import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerModule } from '../ledger/ledger.module';
import { Order } from '../orders/entities/order.entity';
import { DisputeCase } from '../orders/entities/dispute-case.entity';
import { FulfilmentEvent } from '../orders/entities/fulfilment-event.entity';
import { OrdersModule } from '../orders/orders.module';
import { PaymentIntent } from '../payments/entities/payment-intent.entity';
import { PaymentsModule } from '../payments/payments.module';
import { Refund } from './entities/refund.entity';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Refund,
      Order,
      PaymentIntent,
      FulfilmentEvent,
      DisputeCase,
    ]),
    LedgerModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => PaymentsModule),
  ],
  providers: [RefundsService],
  controllers: [RefundsController],
  exports: [RefundsService],
})
export class RefundsModule {}
