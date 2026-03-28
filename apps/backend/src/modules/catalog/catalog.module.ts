import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductMedia } from './entities/product-media.entity';
import { Category } from './entities/category.entity';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { SellersModule } from '../sellers/sellers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant, ProductMedia, Category]),
    SellersModule,
  ],
  providers: [CatalogService],
  controllers: [CatalogController],
  exports: [CatalogService],
})
export class CatalogModule {}
