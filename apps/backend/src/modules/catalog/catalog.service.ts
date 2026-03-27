import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { Category } from './entities/category.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  findProducts(page = 1, limit = 20): Promise<[Product[], number]> {
    return this.productRepo.findAndCount({
      where: { status: ProductStatus.ACTIVE },
      relations: ['media', 'variants', 'category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['media', 'variants', 'category', 'sellerProfile'],
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async findBySeller(sellerProfileId: string): Promise<Product[]> {
    return this.productRepo.find({ where: { sellerProfileId } });
  }

  save(product: Partial<Product>): Promise<Product> {
    return this.productRepo.save(product);
  }

  create(data: Partial<Product>): Product {
    return this.productRepo.create(data);
  }

  async softDelete(id: string): Promise<void> {
    await this.productRepo.softDelete(id);
  }

  findCategories(): Promise<Category[]> {
    return this.categoryRepo.find({ where: { isActive: true } });
  }
}
