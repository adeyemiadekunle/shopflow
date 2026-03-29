import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import {
  DiscountType,
  Product,
  ProductStatus,
} from '../catalog/entities/product.entity';
import { OrdersService } from '../orders/orders.service';
import { SellerProfile } from '../sellers/entities/seller-profile.entity';
import {
  AddCartItemDto,
  CheckoutCartSellerDto,
  UpdateCartItemDto,
} from './dto/cart.dto';
import { CartItem } from './entities/cart-item.entity';

type CartSummaryItem = {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
  isAvailable: boolean;
  unavailableReason?: string;
  product: {
    id: string;
    title: string;
    description?: string;
    status: ProductStatus;
    sellerProfileId: string;
    effectivePrice?: number;
    basePrice: number;
    media?: Array<Record<string, unknown>>;
  };
  variant?: {
    id: string;
    name: string;
    stockQuantity: number;
    attributes?: Record<string, string>;
  };
};

type CartSellerGroup = {
  sellerProfileId: string;
  seller: {
    id: string;
    storeName: string;
    storeSlug: string;
    logoUrl?: string;
  };
  currency?: string;
  itemCount: number;
  subtotal: number;
  canCheckout: boolean;
  items: CartSummaryItem[];
};

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(SellerProfile)
    private readonly sellerRepo: Repository<SellerProfile>,
    private readonly ordersService: OrdersService,
  ) {}

  private resolveUnitPrice(
    product: Product,
    variant?: ProductVariant | null,
  ): number {
    if (
      variant?.priceOverride !== undefined &&
      variant.priceOverride !== null
    ) {
      return Number(variant.priceOverride);
    }

    const basePrice = Number(product.basePrice);
    const now = new Date();
    const discountStarted =
      !product.discountStartsAt || product.discountStartsAt <= now;
    const discountNotExpired =
      !product.discountEndsAt || product.discountEndsAt >= now;

    if (
      product.hasDiscount &&
      product.discountType &&
      product.discountValue !== undefined &&
      discountStarted &&
      discountNotExpired
    ) {
      if (
        product.effectivePrice !== undefined &&
        product.effectivePrice !== null
      ) {
        return Number(product.effectivePrice);
      }

      if (product.discountType === DiscountType.PERCENTAGE) {
        return Number(
          (basePrice * (1 - Number(product.discountValue) / 100)).toFixed(2),
        );
      }

      return Number(
        Math.max(basePrice - Number(product.discountValue), 0).toFixed(2),
      );
    }

    return basePrice;
  }

  private async getCartItemOrThrow(
    buyerId: string,
    itemId: string,
  ): Promise<CartItem> {
    const item = await this.cartItemRepo.findOne({
      where: { id: itemId, buyerId },
      relations: ['product', 'product.media', 'variant', 'sellerProfile'],
    });

    if (!item) {
      throw new NotFoundException(`Cart item ${itemId} not found`);
    }

    return item;
  }

  private async getActiveProductOrThrow(productId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: productId, status: ProductStatus.ACTIVE },
      relations: ['sellerProfile', 'media'],
    });

    if (!product) {
      throw new NotFoundException(
        `Active product ${productId} not found for cart`,
      );
    }

    return product;
  }

  private async getVariantForProduct(
    productId: string,
    variantId?: string,
  ): Promise<ProductVariant | null> {
    if (!variantId) {
      return null;
    }

    const variant = await this.variantRepo.findOne({
      where: { id: variantId, productId },
    });

    if (!variant) {
      throw new NotFoundException(
        `Variant ${variantId} not found for product ${productId}`,
      );
    }

    return variant;
  }

  private ensureVariantStock(
    variant: ProductVariant | null,
    quantity: number,
  ): void {
    if (variant && variant.stockQuantity < quantity) {
      throw new BadRequestException(
        `Requested quantity exceeds stock for variant ${variant.name}`,
      );
    }
  }

  private async findExistingCartLine(
    buyerId: string,
    productId: string,
    variantId?: string,
  ): Promise<CartItem | null> {
    return this.cartItemRepo.findOne({
      where: {
        buyerId,
        productId,
        variantId: variantId ?? IsNull(),
      },
    });
  }

  private buildCartSummaryItem(item: CartItem): CartSummaryItem {
    const unitPrice = this.resolveUnitPrice(item.product, item.variant);
    const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
    let isAvailable = item.product.status === ProductStatus.ACTIVE;
    let unavailableReason: string | undefined;

    if (!isAvailable) {
      unavailableReason = 'Product is no longer active';
    } else if (item.variant && item.variant.stockQuantity < item.quantity) {
      isAvailable = false;
      unavailableReason = 'Requested quantity exceeds available variant stock';
    }

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      currency: item.product.currency,
      isAvailable,
      unavailableReason,
      product: {
        id: item.product.id,
        title: item.product.title,
        description: item.product.description,
        status: item.product.status,
        sellerProfileId: item.product.sellerProfileId,
        effectivePrice:
          item.product.effectivePrice !== undefined &&
          item.product.effectivePrice !== null
            ? Number(item.product.effectivePrice)
            : undefined,
        basePrice: Number(item.product.basePrice),
        media: item.product.media?.map((media) => ({
          id: media.id,
          type: media.type,
          url: media.url,
          isPrimary: media.isPrimary,
          displayOrder: media.displayOrder,
        })),
      },
      ...(item.variant
        ? {
            variant: {
              id: item.variant.id,
              name: item.variant.name,
              stockQuantity: item.variant.stockQuantity,
              attributes: item.variant.attributes,
            },
          }
        : {}),
    };
  }

  private async loadBuyerCartItems(buyerId: string): Promise<CartItem[]> {
    return this.cartItemRepo.find({
      where: { buyerId },
      relations: [
        'product',
        'product.media',
        'variant',
        'sellerProfile',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async getCart(buyerId: string) {
    const items = await this.loadBuyerCartItems(buyerId);
    const groups = new Map<string, CartSellerGroup>();

    for (const item of items) {
      const summaryItem = this.buildCartSummaryItem(item);
      const existingGroup = groups.get(item.sellerProfileId);
      const nextCurrency =
        existingGroup?.currency && existingGroup.currency !== summaryItem.currency
          ? undefined
          : summaryItem.currency;
      const nextSubtotal = Number(
        ((existingGroup?.subtotal ?? 0) + summaryItem.lineTotal).toFixed(2),
      );
      const nextGroup: CartSellerGroup = existingGroup ?? {
        sellerProfileId: item.sellerProfileId,
        seller: {
          id: item.sellerProfile.id,
          storeName: item.sellerProfile.storeName,
          storeSlug: item.sellerProfile.storeSlug,
          logoUrl: item.sellerProfile.logoUrl,
        },
        currency: summaryItem.currency,
        itemCount: 0,
        subtotal: 0,
        canCheckout: true,
        items: [],
      };

      nextGroup.items.push(summaryItem);
      nextGroup.itemCount += summaryItem.quantity;
      nextGroup.subtotal = nextSubtotal;
      nextGroup.currency = nextCurrency;
      nextGroup.canCheckout =
        nextGroup.canCheckout &&
        summaryItem.isAvailable &&
        nextGroup.currency !== undefined;

      groups.set(item.sellerProfileId, nextGroup);
    }

    const sellerGroups = Array.from(groups.values());

    return {
      sellerGroupCount: sellerGroups.length,
      totalItemCount: sellerGroups.reduce(
        (sum, group) => sum + group.itemCount,
        0,
      ),
      sellerGroups,
    };
  }

  async addItem(buyerId: string, dto: AddCartItemDto) {
    const product = await this.getActiveProductOrThrow(dto.productId);
    const variant = await this.getVariantForProduct(product.id, dto.variantId);
    const existing = await this.findExistingCartLine(
      buyerId,
      product.id,
      variant?.id,
    );
    const nextQuantity = (existing?.quantity ?? 0) + dto.quantity;

    this.ensureVariantStock(variant, nextQuantity);

    if (existing) {
      await this.cartItemRepo.save({
        ...existing,
        quantity: nextQuantity,
      });
    } else {
      await this.cartItemRepo.save(
        this.cartItemRepo.create({
          buyerId,
          sellerProfileId: product.sellerProfileId,
          productId: product.id,
          variantId: variant?.id ?? null,
          quantity: dto.quantity,
        }),
      );
    }

    return this.getCart(buyerId);
  }

  async updateItem(
    buyerId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const item = await this.getCartItemOrThrow(buyerId, itemId);

    this.ensureVariantStock(item.variant ?? null, dto.quantity);

    await this.cartItemRepo.save({
      ...item,
      quantity: dto.quantity,
    });

    return this.getCart(buyerId);
  }

  async removeItem(buyerId: string, itemId: string) {
    const item = await this.getCartItemOrThrow(buyerId, itemId);
    await this.cartItemRepo.delete(item.id);
    return this.getCart(buyerId);
  }

  async clearSellerGroup(buyerId: string, sellerProfileId: string) {
    const seller = await this.sellerRepo.findOneBy({ id: sellerProfileId });
    if (!seller) {
      throw new NotFoundException(`Seller ${sellerProfileId} not found`);
    }

    await this.cartItemRepo.delete({
      buyerId,
      sellerProfileId,
    });

    return this.getCart(buyerId);
  }

  async checkoutSellerGroup(
    buyerId: string,
    sellerProfileId: string,
    dto: CheckoutCartSellerDto,
  ) {
    const cartItems = await this.cartItemRepo.find({
      where: { buyerId, sellerProfileId },
      relations: ['product', 'variant'],
      order: { createdAt: 'ASC' },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException(
        'This seller cart group is empty and cannot be checked out',
      );
    }

    const foreignSellerItem = cartItems.find(
      (item) => item.product.sellerProfileId !== sellerProfileId,
    );
    if (foreignSellerItem) {
      throw new ForbiddenException(
        'Cart checkout can only include items belonging to the selected seller',
      );
    }

    const order = await this.ordersService.createOrder(buyerId, {
      items: cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity,
      })),
      deliveryAddress: dto.deliveryAddress,
      buyerNote: dto.buyerNote?.trim(),
    });

    await this.cartItemRepo.delete({
      buyerId,
      sellerProfileId,
    });

    return {
      order,
      clearedItemCount: cartItems.length,
    };
  }
}
