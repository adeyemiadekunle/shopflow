import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import {
  DEAD_LETTER_QUEUE,
  DeadLetterJobName,
  OrderJobName,
  QUEUE_CONNECTION_OPTIONS,
  QueueName,
} from '../queue/queue.constants';
import { DeliveryQuote, QuoteStatus } from './entities/delivery-quote.entity';
import {
  FulfilmentEvent,
  FulfilmentEventType,
} from './entities/fulfilment-event.entity';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';
import { OrdersService } from './orders.service';

type QueueConnectionOptions = {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: null;
};

type FailedOrderJob = {
  name: string;
  id?: string;
  attemptsMade: number;
  opts: {
    attempts?: number;
  };
  data: unknown;
};

type OrderNotificationJobData = {
  orderId: string;
  accepted?: boolean;
};

type OrderNotificationJob = Job<OrderNotificationJobData, void, OrderJobName>;

@Injectable()
export class OrdersProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersProcessor.name);
  private worker?: Worker;
  private queueEvents?: QueueEvents;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(DeliveryQuote)
    private readonly deliveryQuoteRepo: Repository<DeliveryQuote>,
    @InjectRepository(FulfilmentEvent)
    private readonly fulfilmentEventRepo: Repository<FulfilmentEvent>,
    @Inject(QUEUE_CONNECTION_OPTIONS)
    private readonly connection: QueueConnectionOptions,
    @Inject(DEAD_LETTER_QUEUE)
    private readonly deadLetterQueue: Queue,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
    private readonly ordersService: OrdersService,
  ) {}

  private async getOrderForNotification(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['buyer', 'sellerProfile', 'sellerProfile.user'],
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found for queued notification`);
    }

    return order;
  }

  private async processOrderCreated(job: OrderNotificationJob): Promise<void> {
    const order = await this.getOrderForNotification(job.data.orderId);
    const sellerEmail = order.sellerProfile.user?.email;

    if (!sellerEmail) {
      this.logger.warn(
        `Skipping order-created notification for ${order.id}: seller email missing`,
      );
      return;
    }

    await this.mailService.sendSellerOrderCreatedEmail(sellerEmail, {
      orderReference: order.orderReference,
      storeName: order.sellerProfile.storeName,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
    });
  }

  private async processDeliveryQuote(job: OrderNotificationJob): Promise<void> {
    const order = await this.getOrderForNotification(job.data.orderId);

    await this.mailService.sendBuyerDeliveryQuoteEmail(order.buyer.email, {
      orderReference: order.orderReference,
      feeAmount: Number(order.deliveryFee),
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
    });
  }

  private async processQuoteResponse(job: OrderNotificationJob): Promise<void> {
    const order = await this.getOrderForNotification(job.data.orderId);
    const sellerEmail = order.sellerProfile.user?.email;

    if (!sellerEmail) {
      this.logger.warn(
        `Skipping quote-response notification for ${order.id}: seller email missing`,
      );
      return;
    }

    await this.mailService.sendSellerQuoteResponseEmail(sellerEmail, {
      orderReference: order.orderReference,
      accepted: job.data.accepted === true,
    });
  }

  private async processSellerQuoteReminder(
    job: OrderNotificationJob,
  ): Promise<void> {
    const order = await this.getOrderForNotification(job.data.orderId);

    if (order.status !== OrderStatus.AWAITING_DELIVERY_QUOTE) {
      return;
    }

    const sellerEmail = order.sellerProfile.user?.email;
    if (!sellerEmail) {
      this.logger.warn(
        `Skipping seller quote reminder for ${order.id}: seller email missing`,
      );
      return;
    }

    await this.mailService.sendSellerQuoteReminderEmail(sellerEmail, {
      orderReference: order.orderReference,
      storeName: order.sellerProfile.storeName,
    });
  }

  private async processBuyerQuoteReminder(
    job: OrderNotificationJob,
  ): Promise<void> {
    const order = await this.getOrderForNotification(job.data.orderId);

    if (order.status !== OrderStatus.QUOTE_SENT) {
      return;
    }

    await this.mailService.sendBuyerQuoteResponseReminderEmail(
      order.buyer.email,
      {
        orderReference: order.orderReference,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
      },
    );
  }

  private async logSystemCancellation(
    orderId: string,
    notes: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.fulfilmentEventRepo.save(
      this.fulfilmentEventRepo.create({
        orderId,
        type: FulfilmentEventType.CANCELLED,
        actorId: 'system',
        notes,
        metadata,
      }),
    );
  }

  private async processAwaitingQuoteExpiry(
    job: OrderNotificationJob,
  ): Promise<void> {
    const order = await this.getOrderForNotification(job.data.orderId);

    if (order.status !== OrderStatus.AWAITING_DELIVERY_QUOTE) {
      return;
    }

    await this.orderRepo.save({
      ...order,
      status: OrderStatus.CANCELLED,
    });

    await this.logSystemCancellation(
      order.id,
      'Order cancelled automatically because no delivery quote was sent before expiry.',
      { reason: 'awaiting_delivery_quote_expired' },
    );
  }

  private async processQuoteSentExpiry(
    job: OrderNotificationJob,
  ): Promise<void> {
    const order = await this.getOrderForNotification(job.data.orderId);

    if (order.status !== OrderStatus.QUOTE_SENT) {
      return;
    }

    const latestQuote = await this.deliveryQuoteRepo.findOne({
      where: { orderId: order.id },
      order: { createdAt: 'DESC' },
    });

    if (latestQuote && latestQuote.status === QuoteStatus.SENT) {
      await this.deliveryQuoteRepo.save({
        ...latestQuote,
        status: QuoteStatus.DECLINED,
        respondedAt: new Date(),
      });
    }

    await this.orderRepo.save({
      ...order,
      status: OrderStatus.CANCELLED,
    });

    await this.logSystemCancellation(
      order.id,
      'Order cancelled automatically because the delivery quote was not answered before expiry.',
      { reason: 'quote_response_expired' },
    );
  }

  private async processHeldFundsRelease(
    job: OrderNotificationJob,
  ): Promise<void> {
    await this.ordersService.releaseHeldFundsFromQueue(job.data.orderId);
  }

  private async handleFailedJob(
    job: FailedOrderJob,
    error: Error,
  ): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 1;
    const reachedTerminalFailure = job.attemptsMade >= maxAttempts;

    this.logger.error(
      `Order job failed (${job.name}) attempts=${job.attemptsMade}/${maxAttempts}: ${error.message}`,
    );

    if (!reachedTerminalFailure) {
      return;
    }

    await this.deadLetterQueue.add(
      DeadLetterJobName.FAILED_JOB,
      {
        sourceQueue: QueueName.ORDERS,
        sourceJobName: job.name,
        sourceJobId: job.id,
        attemptsMade: job.attemptsMade,
        payload: job.data,
        failedReason: error.message,
        failedAt: new Date().toISOString(),
      },
      {
        jobId: `dlq:${QueueName.ORDERS}:${job.id}`,
        attempts: 1,
      },
    );
  }

  async onModuleInit(): Promise<void> {
    const concurrency = this.config.get<number>('queue.ordersConcurrency') ?? 5;

    this.worker = new Worker(
      QueueName.ORDERS,
      async (job: OrderNotificationJob) => {
        switch (job.name) {
          case OrderJobName.SEND_ORDER_CREATED_NOTIFICATION:
            await this.processOrderCreated(job);
            return;
          case OrderJobName.SEND_DELIVERY_QUOTE_NOTIFICATION:
            await this.processDeliveryQuote(job);
            return;
          case OrderJobName.SEND_QUOTE_RESPONSE_NOTIFICATION:
            await this.processQuoteResponse(job);
            return;
          case OrderJobName.SEND_SELLER_QUOTE_REMINDER:
            await this.processSellerQuoteReminder(job);
            return;
          case OrderJobName.SEND_BUYER_QUOTE_RESPONSE_REMINDER:
            await this.processBuyerQuoteReminder(job);
            return;
          case OrderJobName.EXPIRE_AWAITING_DELIVERY_QUOTE:
            await this.processAwaitingQuoteExpiry(job);
            return;
          case OrderJobName.EXPIRE_QUOTE_SENT:
            await this.processQuoteSentExpiry(job);
            return;
          case OrderJobName.RELEASE_HELD_ORDER_FUNDS:
            await this.processHeldFundsRelease(job);
            return;
        }
      },
      {
        connection: this.connection,
        concurrency,
      },
    );

    this.worker.on('failed', (job, error) => {
      if (!job) return;
      void this.handleFailedJob(job as FailedOrderJob, error);
    });

    this.queueEvents = new QueueEvents(QueueName.ORDERS, {
      connection: this.connection,
    });
    await this.queueEvents.waitUntilReady();

    this.logger.log(`Orders worker started with concurrency=${concurrency}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.queueEvents?.close();
    await this.worker?.close();
  }
}
