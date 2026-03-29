import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaService } from '../media/media.service';
import { SellersService } from '../sellers/sellers.service';
import { CreateProductDto, UpdateProductDto } from './dto/manage-product.dto';
import { Category } from './entities/category.entity';
import { MediaType, ProductMedia } from './entities/product-media.entity';
import { ProductVariant } from './entities/product-variant.entity';
import {
  DiscountType,
  Product,
  ProductStatus,
} from './entities/product.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductMedia)
    private readonly productMediaRepo: Repository<ProductMedia>,
    private readonly sellersService: SellersService,
    private readonly mediaService: MediaService,
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
      where: { id, status: ProductStatus.ACTIVE },
      relations: ['media', 'variants', 'category', 'sellerProfile'],
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async findOwnProducts(userId: string): Promise<Product[]> {
    const seller = await this.sellersService.getByUserIdOrThrow(userId);

    return this.productRepo.find({
      where: { sellerProfileId: seller.id },
      relations: ['media', 'variants', 'category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySeller(sellerProfileId: string): Promise<Product[]> {
    return this.productRepo.find({
      where: { sellerProfileId },
      relations: ['media', 'variants', 'category'],
      order: { createdAt: 'DESC' },
    });
  }

  private normalizeTags(tags?: string[]): string[] | undefined {
    if (!tags?.length) {
      return undefined;
    }

    const normalized = Array.from(
      new Set(
        tags
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0),
      ),
    );

    return normalized.length > 0 ? normalized : undefined;
  }

  private validateDiscount(dto: {
    basePrice: number;
    hasDiscount?: boolean;
    discountType?: DiscountType;
    discountValue?: number;
    discountStartsAt?: string;
    discountEndsAt?: string;
  }): void {
    if (!dto.hasDiscount) {
      return;
    }

    if (!dto.discountType || dto.discountValue === undefined) {
      throw new BadRequestException(
        'discountType and discountValue are required when hasDiscount is true',
      );
    }

    if (
      dto.discountType === DiscountType.PERCENTAGE &&
      dto.discountValue > 100
    ) {
      throw new BadRequestException(
        'Percentage discount cannot be greater than 100',
      );
    }

    if (
      dto.discountType === DiscountType.FIXED &&
      dto.discountValue > dto.basePrice
    ) {
      throw new BadRequestException(
        'Fixed discount cannot be greater than the base price',
      );
    }

    if (
      dto.discountStartsAt &&
      dto.discountEndsAt &&
      new Date(dto.discountStartsAt) > new Date(dto.discountEndsAt)
    ) {
      throw new BadRequestException(
        'discountStartsAt cannot be later than discountEndsAt',
      );
    }
  }

  private calculateEffectivePrice(params: {
    basePrice: number;
    hasDiscount?: boolean;
    discountType?: DiscountType;
    discountValue?: number;
  }): number {
    const basePrice = Number(params.basePrice);

    if (
      !params.hasDiscount ||
      !params.discountType ||
      params.discountValue === undefined
    ) {
      return basePrice;
    }

    if (params.discountType === DiscountType.PERCENTAGE) {
      return Number((basePrice * (1 - params.discountValue / 100)).toFixed(2));
    }

    return Number(Math.max(basePrice - params.discountValue, 0).toFixed(2));
  }

  private async ensureCategoryExists(categoryId?: string): Promise<void> {
    if (!categoryId) {
      return;
    }

    const category = await this.categoryRepo.findOneBy({ id: categoryId });
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
  }

  private buildVariantEntities(
    productId: string,
    variants?: CreateProductDto['variants'],
  ): ProductVariant[] | undefined {
    if (!variants) {
      return undefined;
    }

    return variants.map((variant) =>
      this.productVariantRepo.create({
        productId,
        name: variant.name.trim(),
        sku: variant.sku?.trim(),
        priceOverride: variant.priceOverride,
        stockQuantity: variant.stockQuantity,
        attributes: variant.attributes,
      }),
    );
  }

  private buildMediaEntities(
    productId: string,
    media?: CreateProductDto['media'],
  ): ProductMedia[] | undefined {
    if (!media) {
      return undefined;
    }

    return media.map((item, index) =>
      this.productMediaRepo.create({
        productId,
        type: item.type,
        url: item.url.trim(),
        cdnKey: item.cdnKey?.trim(),
        displayOrder: item.displayOrder ?? index,
        isPrimary: item.isPrimary ?? index === 0,
      }),
    );
  }

  private validateProductMedia(
    media?: Array<{
      type?: MediaType;
      url: string;
      isPrimary?: boolean;
    }>,
    nextStatus?: ProductStatus,
  ): void {
    if (!media || media.length === 0) {
      if (nextStatus === ProductStatus.ACTIVE) {
        throw new BadRequestException(
          'Active products must include at least one image',
        );
      }
      return;
    }

    const imageCount = media.filter(
      (item) => (item.type ?? MediaType.IMAGE) === MediaType.IMAGE,
    ).length;

    if (nextStatus === ProductStatus.ACTIVE && imageCount === 0) {
      throw new BadRequestException(
        'Active products must include at least one image',
      );
    }

    for (const item of media) {
      if (!this.mediaService.isAllowedPublicUrl(item.url.trim())) {
        throw new BadRequestException(
          'Product media must use the configured CloudFront media base URL',
        );
      }
    }
  }

  private async getOwnedProductOrThrow(
    userId: string,
    productId: string,
  ): Promise<Product> {
    const [seller, product] = await Promise.all([
      this.sellersService.getByUserIdOrThrow(userId),
      this.productRepo.findOne({
        where: { id: productId },
        relations: ['media', 'variants', 'category'],
      }),
    ]);

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    if (product.sellerProfileId !== seller.id) {
      throw new ForbiddenException('You can only manage your own products');
    }

    return product;
  }

  async createProductForSeller(
    userId: string,
    dto: CreateProductDto,
  ): Promise<Product> {
    const seller = await this.sellersService.assertCanManageProducts(userId);
    await this.ensureCategoryExists(dto.categoryId);
    this.validateDiscount(dto);
    this.validateProductMedia(dto.media, dto.status ?? ProductStatus.DRAFT);

    const product = this.productRepo.create({
      sellerProfileId: seller.id,
      categoryId: dto.categoryId,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      basePrice: dto.basePrice,
      currency: dto.currency,
      hasDiscount: dto.hasDiscount ?? false,
      discountType: dto.hasDiscount ? dto.discountType : undefined,
      discountValue: dto.hasDiscount ? dto.discountValue : undefined,
      discountStartsAt: dto.discountStartsAt
        ? new Date(dto.discountStartsAt)
        : undefined,
      discountEndsAt: dto.discountEndsAt
        ? new Date(dto.discountEndsAt)
        : undefined,
      effectivePrice: this.calculateEffectivePrice(dto),
      weightGrams: dto.weightGrams,
      handlingDays: dto.handlingDays ?? 1,
      tags: this.normalizeTags(dto.tags),
      status: dto.status ?? ProductStatus.DRAFT,
    });

    const savedProduct = await this.productRepo.save(product);
    const variants = this.buildVariantEntities(savedProduct.id, dto.variants);
    const media = this.buildMediaEntities(savedProduct.id, dto.media);

    return this.productRepo.save({
      ...savedProduct,
      variants,
      media,
    });
  }

  async updateProductForSeller(
    userId: string,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    await this.sellersService.assertCanManageProducts(userId);
    const product = await this.getOwnedProductOrThrow(userId, productId);
    const nextBasePrice = dto.basePrice ?? Number(product.basePrice);
    const nextHasDiscount = dto.hasDiscount ?? product.hasDiscount;
    const nextDiscountType = nextHasDiscount
      ? (dto.discountType ?? product.discountType)
      : undefined;
    const nextDiscountValue = nextHasDiscount
      ? (dto.discountValue ?? product.discountValue)
      : undefined;
    const discountStartsAt =
      dto.discountStartsAt === undefined
        ? product.discountStartsAt
        : dto.discountStartsAt
          ? new Date(dto.discountStartsAt)
          : undefined;
    const discountEndsAt =
      dto.discountEndsAt === undefined
        ? product.discountEndsAt
        : dto.discountEndsAt
          ? new Date(dto.discountEndsAt)
          : undefined;

    await this.ensureCategoryExists(dto.categoryId ?? product.categoryId);
    this.validateDiscount({
      basePrice: nextBasePrice,
      hasDiscount: nextHasDiscount,
      discountType: nextDiscountType,
      discountValue: nextDiscountValue,
      discountStartsAt: discountStartsAt?.toISOString(),
      discountEndsAt: discountEndsAt?.toISOString(),
    });
    this.validateProductMedia(
      dto.media === undefined ? product.media : dto.media,
      dto.status ?? product.status,
    );

    if (dto.variants !== undefined) {
      await this.productVariantRepo.delete({ productId });
    }

    if (dto.media !== undefined) {
      await this.productMediaRepo.delete({ productId });
    }

    const updated = await this.productRepo.save({
      ...product,
      categoryId: dto.categoryId ?? product.categoryId,
      title: dto.title?.trim() ?? product.title,
      description:
        dto.description !== undefined
          ? dto.description?.trim()
          : product.description,
      basePrice: nextBasePrice,
      currency: dto.currency ?? product.currency,
      hasDiscount: nextHasDiscount,
      discountType: nextDiscountType,
      discountValue: nextDiscountValue,
      discountStartsAt,
      discountEndsAt,
      effectivePrice: this.calculateEffectivePrice({
        basePrice: nextBasePrice,
        hasDiscount: nextHasDiscount,
        discountType: nextDiscountType,
        discountValue: nextDiscountValue,
      }),
      weightGrams: dto.weightGrams ?? product.weightGrams,
      handlingDays: dto.handlingDays ?? product.handlingDays,
      tags:
        dto.tags === undefined ? product.tags : this.normalizeTags(dto.tags),
      status: dto.status ?? product.status,
      variants:
        dto.variants === undefined
          ? product.variants
          : this.buildVariantEntities(productId, dto.variants),
      media:
        dto.media === undefined
          ? product.media
          : this.buildMediaEntities(productId, dto.media),
    });

    const reloaded = await this.productRepo.findOne({
      where: { id: updated.id },
      relations: ['media', 'variants', 'category', 'sellerProfile'],
    });

    if (!reloaded) {
      throw new NotFoundException(`Product ${updated.id} not found`);
    }

    return reloaded;
  }

  async deleteProductForSeller(
    userId: string,
    productId: string,
  ): Promise<void> {
    await this.sellersService.assertCanManageProducts(userId);
    await this.getOwnedProductOrThrow(userId, productId);
    await this.productRepo.softDelete(productId);
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
