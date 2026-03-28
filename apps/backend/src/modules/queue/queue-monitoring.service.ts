import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { Gauge, register } from 'prom-client';
import { QUEUE_CONNECTION_OPTIONS, QueueName } from './queue.constants';

type QueueConnectionOptions = {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: null;
};

export interface QueueSummary {
  name: QueueName;
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
}

@Injectable()
export class QueueMonitoringService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueMonitoringService.name);
  private queues = new Map<QueueName, Queue>();
  private readonly jobsGauge: Gauge<'queue' | 'status'>;

  constructor(
    @Inject(QUEUE_CONNECTION_OPTIONS)
    private readonly connection: QueueConnectionOptions,
  ) {
    const existingMetric = register.getSingleMetric(
      'rands_queue_jobs_total',
    ) as Gauge<'queue' | 'status'> | undefined;

    if (existingMetric) {
      this.jobsGauge = existingMetric;
      return;
    }

    const getSummary = this.getSummary.bind(this);
    this.jobsGauge = new Gauge({
      name: 'rands_queue_jobs_total',
      help: 'Current BullMQ job counts by queue and status',
      labelNames: ['queue', 'status'],
      async collect() {
        const summaries = await getSummary();
        const statuses: Array<keyof QueueSummary['counts']> = [
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
          'paused',
        ];

        for (const summary of summaries) {
          for (const status of statuses) {
            this.set(
              { queue: summary.name, status },
              summary.counts[status] ?? 0,
            );
          }
        }
      },
    });
  }

  onModuleInit(): void {
    for (const queueName of [
      QueueName.PAYMENTS,
      QueueName.ORDERS,
      QueueName.DEAD_LETTER,
    ]) {
      this.queues.set(
        queueName,
        new Queue(queueName, {
          connection: this.connection,
        }),
      );
    }

    this.logger.log('Queue monitoring initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(
      Array.from(this.queues.values()).map(async (queue) => queue.close()),
    );
  }

  async getSummary(): Promise<QueueSummary[]> {
    const summaries = await Promise.all(
      Array.from(this.queues.entries()).map(async ([name, queue]) => {
        const counts = await queue.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
          'paused',
        );

        return {
          name,
          counts: {
            waiting: counts.waiting ?? 0,
            active: counts.active ?? 0,
            completed: counts.completed ?? 0,
            failed: counts.failed ?? 0,
            delayed: counts.delayed ?? 0,
            paused: counts.paused ?? 0,
          },
        };
      }),
    );

    return summaries;
  }
}
