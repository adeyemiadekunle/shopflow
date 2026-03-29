import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { DeliveryQuote } from './entities/delivery-quote.entity';
import { FulfilmentEvent } from './entities/fulfilment-event.entity';
import { DisputeCase } from './entities/dispute-case.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Product } from '../catalog/entities/product.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { MailModule } from '../mail/mail.module';
import { SellersModule } from '../sellers/sellers.module';
import { PlatformConfigModule } from '../platform-config/platform-config.module';
import { LedgerModule } from '../ledger/ledger.module';
import { Queue, QueueOptions } from 'bullmq';
import { QueueModule } from '../queue/queue.module';
import {
  DEAD_LETTER_QUEUE,
  ORDERS_QUEUE,
  QUEUE_CONNECTION_OPTIONS,
  QUEUE_DEFAULT_JOB_OPTIONS,
  QueueName,
} from '../queue/queue.constants';
import { OrdersProcessor } from './orders.processor';

type QueueConnectionOptions = NonNullable<QueueOptions['connection']>;

@Module({
  imports: [
    QueueModule,
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      DeliveryQuote,
      FulfilmentEvent,
      DisputeCase,
      Product,
      ProductVariant,
    ]),
    SellersModule,
    PlatformConfigModule,
    LedgerModule,
    MailModule,
  ],
  providers: [
    {
      provide: ORDERS_QUEUE,
      inject: [QUEUE_CONNECTION_OPTIONS, QUEUE_DEFAULT_JOB_OPTIONS],
      useFactory: (
        connection: QueueConnectionOptions,
        defaultJobOptions: QueueOptions['defaultJobOptions'],
      ) =>
        new Queue(QueueName.ORDERS, {
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
    OrdersService,
    OrdersProcessor,
  ],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
