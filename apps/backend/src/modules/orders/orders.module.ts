import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { DeliveryQuote } from './entities/delivery-quote.entity';
import { FulfilmentEvent } from './entities/fulfilment-event.entity';
import { DisputeCase } from './entities/dispute-case.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      DeliveryQuote,
      FulfilmentEvent,
      DisputeCase,
    ]),
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
