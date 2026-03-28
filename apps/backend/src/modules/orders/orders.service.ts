import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  DiscountType,
  Product,
  ProductStatus,
} from '../catalog/entities/product.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { SellersService } from '../sellers/sellers.service';
import { UserRole } from '../users/enums/user-role.enum';
import {
  CreateOrderDto,
  RespondToQuoteDto,
  SendDeliveryQuoteDto,
} from './dto/orders.dto';
import { DeliveryQuote, QuoteStatus } from './entities/delivery-quote.entity';
import {
  FulfilmentEvent,
  FulfilmentEventType,
} from './entities/fulfilment-event.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { ORDER_TRANSITIONS, OrderStatus } from './enums/order-status.enum';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(DeliveryQuote)
    private readonly deliveryQuoteRepo: Repository<DeliveryQuote>,
    @InjectRepository(FulfilmentEvent)
    private readonly eventRepo: Repository<FulfilmentEvent>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepo: Repository<ProductVariant>,
    private readonly sellersService: SellersService,
  ) {}

  generateReference(): string {
    return `RND-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private async logEvent(
    orderId: string,
    type: FulfilmentEventType,
    actorId?: string,
    notes?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.eventRepo.save(
      this.eventRepo.create({
        orderId,
        type,
        actorId,
        notes,
        metadata,
      }),
    );
  }

  private async getAccessibleOrderOrThrow(
    orderId: string,
    user: AuthenticatedUser,
  ): Promise<Order> {
    const order = await this.findById(orderId);

    if (user.role === UserRole.ADMIN) {
      return order;
    }

    if (user.role === UserRole.BUYER && order.buyerId === user.id) {
      return order;
    }

    if (user.role === UserRole.SELLER) {
      const seller = await this.sellersService.getByUserIdOrThrow(user.id);
      if (order.sellerProfileId === seller.id) {
        return order;
      }
    }

    throw new ForbiddenException('You are not allowed to access this order');
  }

  private async getSellerOwnedOrderOrThrow(
    sellerUserId: string,
    orderId: string,
  ): Promise<Order> {
    const seller = await this.sellersService.getByUserIdOrThrow(sellerUserId);
    const order = await this.findById(orderId);

    if (order.sellerProfileId !== seller.id) {
      throw new ForbiddenException('You can only manage your own orders');
    }

    return order;
  }

  private resolveUnitPrice(product: Product, variant?: ProductVariant): number {
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

  private async getLatestQuote(orderId: string): Promise<DeliveryQuote | null> {
    return this.deliveryQuoteRepo.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: [
        'items',
        'items.product',
        'items.variant',
        'quotes',
        'fulfilmentEvents',
        'buyer',
        'sellerProfile',
      ],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async findForUser(id: string, user: AuthenticatedUser): Promise<Order> {
    return this.getAccessibleOrderOrThrow(id, user);
  }

  async findByBuyer(buyerId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { buyerId },
      relations: ['items', 'quotes', 'sellerProfile'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySellerUser(userId: string): Promise<Order[]> {
    const seller = await this.sellersService.getByUserIdOrThrow(userId);
    return this.findBySeller(seller.id);
  }

  async findBySeller(sellerProfileId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { sellerProfileId },
      relations: ['items', 'quotes', 'buyer'],
      order: { createdAt: 'DESC' },
    });
  }

  async createOrder(buyerId: string, dto: CreateOrderDto): Promise<Order> {
    const productIds = Array.from(
      new Set(dto.items.map((item) => item.productId)),
    );

    const products = await this.productRepo.find({
      where: {
        id: In(productIds),
        status: ProductStatus.ACTIVE,
      },
      relations: ['sellerProfile'],
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more selected products are unavailable',
      );
    }

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    const variantIds = Array.from(
      new Set(dto.items.map((item) => item.variantId).filter(Boolean)),
    ) as string[];
    const variants = variantIds.length
      ? await this.productVariantRepo.find({
          where: { id: In(variantIds) },
        })
      : [];
    const variantMap = new Map(
      variants.map((variant) => [variant.id, variant]),
    );

    const firstProduct = products[0];
    const sellerProfileId = firstProduct.sellerProfileId;
    const currency = firstProduct.currency;

    for (const product of products) {
      if (product.sellerProfileId !== sellerProfileId) {
        throw new BadRequestException(
          'All items in an order must belong to the same seller',
        );
      }

      if (product.currency !== currency) {
        throw new BadRequestException(
          'All items in an order must use the same currency',
        );
      }
    }

    let itemsTotal = 0;
    const orderReference = this.generateReference();
    const items = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} is unavailable`,
        );
      }

      const variant = item.variantId
        ? variantMap.get(item.variantId)
        : undefined;
      if (item.variantId && !variant) {
        throw new BadRequestException(
          `Variant ${item.variantId} is unavailable`,
        );
      }

      if (variant && variant.productId !== product.id) {
        throw new BadRequestException(
          'Selected variant does not belong to the product',
        );
      }

      if (variant && variant.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for variant ${variant.name}`,
        );
      }

      const unitPrice = this.resolveUnitPrice(product, variant);
      const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
      itemsTotal += lineTotal;

      return this.orderItemRepo.create({
        productId: product.id,
        variantId: variant?.id,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        productSnapshot: {
          productId: product.id,
          variantId: variant?.id,
          title: product.title,
          description: product.description,
          categoryId: product.categoryId,
          sellerProfileId: product.sellerProfileId,
          currency: product.currency,
          unitPrice,
          selectedVariantName: variant?.name,
          selectedAttributes: variant?.attributes,
        },
      });
    });

    const orderEntity = this.orderRepo.create({
      orderReference,
      buyerId,
      sellerProfileId,
      status: OrderStatus.AWAITING_DELIVERY_QUOTE,
      itemsTotal,
      deliveryFee: 0,
      platformFee: 0,
      totalAmount: Number(itemsTotal.toFixed(2)),
      currency,
      deliveryAddress: dto.deliveryAddress
        ? ({ ...dto.deliveryAddress } as Record<string, unknown>)
        : undefined,
      buyerNote: dto.buyerNote?.trim(),
      items,
    });
    const order = await this.orderRepo.save(orderEntity);

    await this.logEvent(
      order.id,
      FulfilmentEventType.ORDER_CREATED,
      buyerId,
      undefined,
      {
        itemCount: items.length,
        itemsTotal,
        buyerPayableAmount: Number(itemsTotal.toFixed(2)),
      },
    );

    return this.findById(order.id);
  }

  async sendDeliveryQuote(
    sellerUserId: string,
    orderId: string,
    dto: SendDeliveryQuoteDto,
  ): Promise<Order> {
    const order = await this.getSellerOwnedOrderOrThrow(sellerUserId, orderId);

    if (order.status !== OrderStatus.AWAITING_DELIVERY_QUOTE) {
      throw new BadRequestException(
        'Delivery quotes can only be sent for orders awaiting a quote',
      );
    }

    const quote = await this.deliveryQuoteRepo.save(
      this.deliveryQuoteRepo.create({
        orderId,
        feeAmount: dto.feeAmount,
        sellerNote: dto.sellerNote?.trim(),
        status: QuoteStatus.SENT,
      }),
    );

    order.deliveryFee = dto.feeAmount;
    order.totalAmount = Number(
      (Number(order.itemsTotal) + dto.feeAmount).toFixed(2),
    );
    order.status = OrderStatus.QUOTE_SENT;

    await this.orderRepo.save(order);
    await this.logEvent(
      orderId,
      FulfilmentEventType.QUOTE_SENT,
      sellerUserId,
      dto.sellerNote?.trim(),
      { quoteId: quote.id, feeAmount: dto.feeAmount },
    );

    return this.findById(orderId);
  }

  async respondToQuote(
    buyerId: string,
    orderId: string,
    dto: RespondToQuoteDto,
  ): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only respond to your own orders');
    }

    if (order.status !== OrderStatus.QUOTE_SENT) {
      throw new BadRequestException('This order does not have a pending quote');
    }

    const quote = await this.getLatestQuote(orderId);
    if (!quote || quote.status !== QuoteStatus.SENT) {
      throw new BadRequestException(
        'No active delivery quote was found for this order',
      );
    }

    quote.status = dto.accept ? QuoteStatus.ACCEPTED : QuoteStatus.DECLINED;
    quote.respondedAt = new Date();
    await this.deliveryQuoteRepo.save(quote);

    order.status = dto.accept
      ? OrderStatus.QUOTE_ACCEPTED
      : OrderStatus.QUOTE_DECLINED;
    await this.orderRepo.save(order);

    await this.logEvent(
      orderId,
      dto.accept
        ? FulfilmentEventType.QUOTE_ACCEPTED
        : FulfilmentEventType.QUOTE_DECLINED,
      buyerId,
      undefined,
      { quoteId: quote.id },
    );

    return this.findById(orderId);
  }

  async transition(
    orderId: string,
    targetStatus: OrderStatus,
    actorId: string,
    eventType: FulfilmentEventType,
    notes?: string,
    evidenceUrl?: string,
  ): Promise<Order> {
    const order = await this.findById(orderId);
    const allowed = ORDER_TRANSITIONS[order.status];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${targetStatus}`,
      );
    }

    order.status = targetStatus;
    if (targetStatus === OrderStatus.PAID) order.paidAt = new Date();
    if (targetStatus === OrderStatus.COMPLETED) order.completedAt = new Date();

    await this.orderRepo.save(order);

    await this.eventRepo.save(
      this.eventRepo.create({
        orderId,
        type: eventType,
        actorId,
        notes,
        evidenceUrl,
      }),
    );

    return order;
  }

  save(order: Partial<Order>): Promise<Order> {
    return this.orderRepo.save(order);
  }

  create(data: Partial<Order>): Order {
    return this.orderRepo.create(data);
  }
}
