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
import { SellersModule } from '../sellers/sellers.module';
import { PlatformConfigModule } from '../platform-config/platform-config.module';

@Module({
  imports: [
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
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
