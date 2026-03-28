import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import {
  DEAD_LETTER_QUEUE,
  DeadLetterJobName,
  PaymentJobName,
  QUEUE_CONNECTION_OPTIONS,
  QueueName,
} from '../queue/queue.constants';
import { PaymentsService } from './payments.service';

type QueueConnectionOptions = {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: null;
};

type FailedPaymentJob = {
  name: string;
  id?: string;
  attemptsMade: number;
  opts: {
    attempts?: number;
  };
  data: unknown;
};

type ProcessWebhookEventJobData = {
  webhookEventId: string;
};

type ProcessWebhookEventJob = Job<
  ProcessWebhookEventJobData,
  void,
  PaymentJobName.PROCESS_WEBHOOK_EVENT
>;

@Injectable()
export class PaymentsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentsProcessor.name);
  private worker?: Worker;
  private queueEvents?: QueueEvents;

  constructor(
    @Inject(QUEUE_CONNECTION_OPTIONS)
    private readonly connection: QueueConnectionOptions,
    @Inject(DEAD_LETTER_QUEUE)
    private readonly deadLetterQueue: Queue,
    private readonly config: ConfigService,
    private readonly paymentsService: PaymentsService,
  ) {}

  private getWebhookEventId(job: ProcessWebhookEventJob): string | null {
    const webhookEventId = job.data?.webhookEventId;

    return typeof webhookEventId === 'string' && webhookEventId.length > 0
      ? webhookEventId
      : null;
  }

  private async handleFailedJob(
    job: FailedPaymentJob,
    error: Error,
  ): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 1;
    const reachedTerminalFailure = job.attemptsMade >= maxAttempts;

    this.logger.error(
      `Payment job failed (${job.name}) attempts=${job.attemptsMade}/${maxAttempts}: ${error.message}`,
    );

    if (!reachedTerminalFailure) {
      return;
    }

    await this.deadLetterQueue.add(
      DeadLetterJobName.FAILED_JOB,
      {
        sourceQueue: QueueName.PAYMENTS,
        sourceJobName: job.name,
        sourceJobId: job.id,
        attemptsMade: job.attemptsMade,
        payload: job.data,
        failedReason: error.message,
        failedAt: new Date().toISOString(),
      },
      {
        jobId: `dlq:${QueueName.PAYMENTS}:${job.id}`,
        attempts: 1,
      },
    );
  }

  async onModuleInit(): Promise<void> {
    const concurrency =
      this.config.get<number>('queue.paymentsConcurrency') ?? 5;

    this.worker = new Worker(
      QueueName.PAYMENTS,
      async (job: ProcessWebhookEventJob) => {
        const webhookEventId = this.getWebhookEventId(job);

        if (!webhookEventId) {
          throw new Error('Missing webhookEventId in queued payment job');
        }

        await this.paymentsService.processWebhookEvent(webhookEventId);
      },
      {
        connection: this.connection,
        concurrency,
      },
    );

    this.worker.on('failed', (job, error) => {
      if (!job) return;
      void this.handleFailedJob(job as FailedPaymentJob, error);
    });

    this.queueEvents = new QueueEvents(QueueName.PAYMENTS, {
      connection: this.connection,
    });
    await this.queueEvents.waitUntilReady();

    this.logger.log(`Payments worker started with concurrency=${concurrency}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.queueEvents?.close();
    await this.worker?.close();
  }
}
