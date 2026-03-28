import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FulfilmentEvent } from '../orders/entities/fulfilment-event.entity';
import { Order } from '../orders/entities/order.entity';
import { UsersModule } from '../users/users.module';
import { PaymentIntent } from './entities/payment-intent.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { PaystackService } from './paystack.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentIntent,
      WebhookEvent,
      Order,
      FulfilmentEvent,
    ]),
    UsersModule,
  ],
  providers: [PaystackService, PaymentsService],
  controllers: [PaymentsController],
  exports: [PaystackService, PaymentsService],
})
export class PaymentsModule {}
