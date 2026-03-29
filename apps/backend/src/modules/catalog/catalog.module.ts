import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductMedia } from './entities/product-media.entity';
import { Category } from './entities/category.entity';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { MediaModule } from '../media/media.module';
import { SellersModule } from '../sellers/sellers.module';
import { PlatformConfigModule } from '../platform-config/platform-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant, ProductMedia, Category]),
    MediaModule,
    SellersModule,
    PlatformConfigModule,
  ],
  providers: [CatalogService],
  controllers: [CatalogController],
  exports: [CatalogService],
})
export class CatalogModule {}
