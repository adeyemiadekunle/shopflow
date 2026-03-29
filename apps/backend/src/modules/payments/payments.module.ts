import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Queue, QueueOptions } from 'bullmq';
import { FulfilmentEvent } from '../orders/entities/fulfilment-event.entity';
import { Order } from '../orders/entities/order.entity';
import { QueueModule } from '../queue/queue.module';
import {
  DEAD_LETTER_QUEUE,
  PAYMENTS_QUEUE,
  QUEUE_CONNECTION_OPTIONS,
  QUEUE_DEFAULT_JOB_OPTIONS,
  QueueName,
} from '../queue/queue.constants';
import { UsersModule } from '../users/users.module';
import { LedgerModule } from '../ledger/ledger.module';
import { PaymentIntent } from './entities/payment-intent.entity';
import { PaymentReconciliationIssue } from './entities/payment-reconciliation-issue.entity';
import { PaymentReconciliationRun } from './entities/payment-reconciliation-run.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { PlatformConfigModule } from '../platform-config/platform-config.module';
import { PaystackService } from './paystack.service';
import { PaymentsController } from './payments.controller';
import { PaymentsProcessor } from './payments.processor';
import { PaymentsService } from './payments.service';
import { PayoutsModule } from '../payouts/payouts.module';
import { RefundsModule } from '../refunds/refunds.module';
import { MonnifyService } from './monnify.service';

type QueueConnectionOptions = NonNullable<QueueOptions['connection']>;

@Module({
  imports: [
    QueueModule,
    TypeOrmModule.forFeature([
      PaymentIntent,
      PaymentReconciliationRun,
      PaymentReconciliationIssue,
      WebhookEvent,
      Order,
      FulfilmentEvent,
    ]),
    UsersModule,
    LedgerModule,
    PlatformConfigModule,
    forwardRef(() => PayoutsModule),
    forwardRef(() => RefundsModule),
  ],
  providers: [
    {
      provide: PAYMENTS_QUEUE,
      inject: [QUEUE_CONNECTION_OPTIONS, QUEUE_DEFAULT_JOB_OPTIONS],
      useFactory: (
        connection: QueueConnectionOptions,
        defaultJobOptions: QueueOptions['defaultJobOptions'],
      ) =>
        new Queue(QueueName.PAYMENTS, {
          connection,
          defaultJobOptions,
        }),
    },
    {
      provide: DEAD_LETTER_QUEUE,
      inject: [QUEUE_CONNECTION_OPTIONS],
      useFactory: (connection: QueueConnectionOptions) =>
        new Queue(QueueName.DEAD_LETTER, {
          connection,
          defaultJobOptions: {
            attempts: 1,
            removeOnComplete: {
              age: 604800,
              count: 5000,
            },
            removeOnFail: false,
          },
        }),
    },
    PaystackService,
    MonnifyService,
    PaymentsService,
    PaymentsProcessor,
  ],
  controllers: [PaymentsController],
  exports: [PaystackService, MonnifyService, PaymentsService],
})
export class PaymentsModule {}
