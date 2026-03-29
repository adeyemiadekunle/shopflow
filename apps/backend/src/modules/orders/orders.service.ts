import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { In, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  DiscountType,
  Product,
  ProductStatus,
} from '../catalog/entities/product.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { LedgerService } from '../ledger/ledger.service';
import {
  LedgerAccountType,
  LedgerEventType,
} from '../ledger/enums/ledger.enum';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { ORDERS_QUEUE, OrderJobName } from '../queue/queue.constants';
import { RefundsService } from '../refunds/refunds.service';
import { SellersService } from '../sellers/sellers.service';
import { UserRole } from '../users/enums/user-role.enum';
import {
  CreateOrderDto,
  OpenDisputeDto,
  ResolveDisputeDto,
  ResolveDisputeOutcome,
  RespondToQuoteDto,
  SendDeliveryQuoteDto,
  UpdateOrderProgressDto,
} from './dto/orders.dto';
import { DeliveryQuote, QuoteStatus } from './entities/delivery-quote.entity';
import { DisputeCase, DisputeStatus } from './entities/dispute-case.entity';
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
    @InjectRepository(DisputeCase)
    private readonly disputeRepo: Repository<DisputeCase>,
    @InjectRepository(FulfilmentEvent)
    private readonly eventRepo: Repository<FulfilmentEvent>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepo: Repository<ProductVariant>,
    @Inject(ORDERS_QUEUE)
    private readonly ordersQueue: Queue,
    private readonly config: ConfigService,
    private readonly sellersService: SellersService,
    private readonly platformConfigService: PlatformConfigService,
    private readonly ledgerService: LedgerService,
    @Inject(forwardRef(() => RefundsService))
    private readonly refundsService: RefundsService,
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

  private async getOpenDispute(orderId: string): Promise<DisputeCase | null> {
    return this.disputeRepo.findOne({
      where: [
        { orderId, status: DisputeStatus.OPEN },
        { orderId, status: DisputeStatus.UNDER_REVIEW },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  private addDays(baseDate: Date, days: number): Date {
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private getSettlementAmount(order: Order): number {
    return Number(order.totalAmount);
  }

  private async ensureSellerSettlementAccounts(order: Order): Promise<void> {
    await Promise.all([
      this.ledgerService.ensureAccount(
        LedgerAccountType.SELLER_PENDING,
        order.sellerProfileId,
        order.currency,
      ),
      this.ledgerService.ensureAccount(
        LedgerAccountType.SELLER_AVAILABLE,
        order.sellerProfileId,
        order.currency,
      ),
      this.ledgerService.ensureAccount(
        LedgerAccountType.REFUND_RESERVE,
        undefined,
        order.currency,
      ),
    ]);
  }

  private async enqueueOrderNotification(
    jobName: OrderJobName,
    data: { orderId: string; accepted?: boolean },
  ): Promise<void> {
    await this.ordersQueue.add(jobName, data, {
      jobId: `${jobName}:${data.orderId}:${data.accepted ?? 'na'}`,
    });
  }

  private async enqueueDelayedOrderJob(
    jobName: OrderJobName,
    orderId: string,
    delay: number,
  ): Promise<void> {
    await this.ordersQueue.add(
      jobName,
      { orderId },
      {
        jobId: `${jobName}:${orderId}`,
        delay,
      },
    );
  }

  private async moveSellerPendingToAvailable(
    order: Order,
    actorId: string,
    notes: string,
  ): Promise<void> {
    const amount = this.getSettlementAmount(order);
    if (amount <= 0) {
      return;
    }

    await this.ensureSellerSettlementAccounts(order);

    const reference = `hold-release:${order.id}`;
    const pendingAlreadyMoved = await this.ledgerService.hasRecordedReference({
      reference,
      eventType: LedgerEventType.HOLD_RELEASED,
      accountType: LedgerAccountType.SELLER_PENDING,
    });
    const availableAlreadyMoved = await this.ledgerService.hasRecordedReference({
      reference,
      eventType: LedgerEventType.HOLD_RELEASED,
      accountType: LedgerAccountType.SELLER_AVAILABLE,
    });

    if (!pendingAlreadyMoved) {
      await this.ledgerService.record({
        accountType: LedgerAccountType.SELLER_PENDING,
        ownerId: order.sellerProfileId,
        amount: -amount,
        currency: order.currency,
        orderId: order.id,
        actorId,
        eventType: LedgerEventType.HOLD_RELEASED,
        reference,
        notes,
      });
    }

    if (!availableAlreadyMoved) {
      await this.ledgerService.record({
        accountType: LedgerAccountType.SELLER_AVAILABLE,
        ownerId: order.sellerProfileId,
        amount,
        currency: order.currency,
        orderId: order.id,
        actorId,
        eventType: LedgerEventType.HOLD_RELEASED,
        reference,
        notes,
      });
    }
  }

  private async releaseHeldFundsInternal(
    orderId: string,
    actorId: string,
    options?: {
      allowBeforeHoldExpires?: boolean;
      tolerateBlockedRelease?: boolean;
      notes?: string;
    },
  ): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.fundsReleasedAt || order.status === OrderStatus.COMPLETED) {
      return order;
    }

    if (
      order.status !== OrderStatus.DELIVERED_PENDING_CONFIRMATION &&
      order.status !== OrderStatus.DISPUTE_OPEN
    ) {
      if (options?.tolerateBlockedRelease) {
        return order;
      }
      throw new BadRequestException(
        `Held funds can only be released after delivery or seller-favour dispute resolution. Current status: ${order.status}`,
      );
    }

    if (
      !options?.allowBeforeHoldExpires &&
      order.fundsHeldUntil &&
      order.fundsHeldUntil.getTime() > Date.now()
    ) {
      if (options?.tolerateBlockedRelease) {
        return order;
      }
      throw new BadRequestException(
        'Held funds cannot be released before the return-policy window expires',
      );
    }

    const openDispute = await this.getOpenDispute(order.id);
    if (openDispute) {
      if (options?.tolerateBlockedRelease) {
        return order;
      }
      throw new BadRequestException(
        'Held funds cannot be released while an order dispute is still open',
      );
    }

    const notes =
      options?.notes ??
      'Held seller funds released after return-policy hold elapsed.';

    await this.moveSellerPendingToAvailable(order, actorId, notes);

    await this.orderRepo.save({
      ...order,
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
      fundsReleasedAt: new Date(),
    });

    await this.logEvent(
      order.id,
      FulfilmentEventType.FUNDS_RELEASED,
      actorId,
      notes,
      {
        fundsHeldUntil: order.fundsHeldUntil?.toISOString(),
        releasedAt: new Date().toISOString(),
        settlementAmount: this.getSettlementAmount(order),
      },
    );

    return this.findById(order.id);
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

    await this.enqueueOrderNotification(
      OrderJobName.SEND_ORDER_CREATED_NOTIFICATION,
      { orderId: order.id },
    );
    await this.enqueueDelayedOrderJob(
      OrderJobName.SEND_SELLER_QUOTE_REMINDER,
      order.id,
      this.config.get<number>('queue.sellerQuoteReminderDelayMs') ?? 1_800_000,
    );
    await this.enqueueDelayedOrderJob(
      OrderJobName.EXPIRE_AWAITING_DELIVERY_QUOTE,
      order.id,
      this.config.get<number>('queue.sellerQuoteExpiryDelayMs') ?? 86_400_000,
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

    await this.enqueueOrderNotification(
      OrderJobName.SEND_DELIVERY_QUOTE_NOTIFICATION,
      { orderId },
    );
    await this.enqueueDelayedOrderJob(
      OrderJobName.SEND_BUYER_QUOTE_RESPONSE_REMINDER,
      orderId,
      this.config.get<number>('queue.buyerQuoteReminderDelayMs') ?? 1_800_000,
    );
    await this.enqueueDelayedOrderJob(
      OrderJobName.EXPIRE_QUOTE_SENT,
      orderId,
      this.config.get<number>('queue.buyerQuoteExpiryDelayMs') ?? 86_400_000,
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

    await this.enqueueOrderNotification(
      OrderJobName.SEND_QUOTE_RESPONSE_NOTIFICATION,
      { orderId, accepted: dto.accept },
    );

    return this.findById(orderId);
  }

  async cancelByBuyer(buyerId: string, orderId: string): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.AWAITING_DELIVERY_QUOTE,
      OrderStatus.QUOTE_SENT,
      OrderStatus.QUOTE_ACCEPTED,
      OrderStatus.PAYMENT_PENDING,
    ];

    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Orders cannot be cancelled by the buyer once they reach status ${order.status}`,
      );
    }

    if (order.status === OrderStatus.QUOTE_SENT) {
      const latestQuote = await this.getLatestQuote(orderId);
      if (latestQuote?.status === QuoteStatus.SENT) {
        latestQuote.status = QuoteStatus.DECLINED;
        latestQuote.respondedAt = new Date();
        await this.deliveryQuoteRepo.save(latestQuote);
      }
    }

    order.status = OrderStatus.CANCELLED;
    await this.orderRepo.save(order);

    await this.logEvent(
      orderId,
      FulfilmentEventType.CANCELLED,
      buyerId,
      'Order cancelled by buyer before payment confirmation.',
      { cancelledBy: 'buyer' },
    );

    return this.findById(orderId);
  }

  async markPreparing(
    sellerUserId: string,
    orderId: string,
    dto: UpdateOrderProgressDto,
  ): Promise<Order> {
    const order = await this.getSellerOwnedOrderOrThrow(sellerUserId, orderId);

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException(
        'Only paid orders can be moved to seller preparing',
      );
    }

    await this.orderRepo.save({
      ...order,
      status: OrderStatus.SELLER_PREPARING,
    });

    await this.logEvent(
      orderId,
      FulfilmentEventType.PREPARING,
      sellerUserId,
      dto.notes?.trim(),
    );

    return this.findById(orderId);
  }

  async markShipped(
    sellerUserId: string,
    orderId: string,
    dto: UpdateOrderProgressDto,
  ): Promise<Order> {
    const order = await this.getSellerOwnedOrderOrThrow(sellerUserId, orderId);

    if (order.status !== OrderStatus.SELLER_PREPARING) {
      throw new BadRequestException(
        'Only prepared orders can be marked as shipped',
      );
    }

    await this.orderRepo.save({
      ...order,
      status: OrderStatus.SHIPPED,
    });

    await this.logEvent(
      orderId,
      FulfilmentEventType.SHIPPED,
      sellerUserId,
      dto.notes?.trim(),
    );

    return this.findById(orderId);
  }

  async markDelivered(
    sellerUserId: string,
    orderId: string,
    dto: UpdateOrderProgressDto,
  ): Promise<Order> {
    const order = await this.getSellerOwnedOrderOrThrow(sellerUserId, orderId);

    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException(
        'Only shipped orders can be marked as delivered',
      );
    }

    const deliveredAt = new Date();
    const returnPolicyDays =
      await this.platformConfigService.getReturnPolicyDays();
    const fundsHeldUntil = this.addDays(deliveredAt, returnPolicyDays);

    await this.orderRepo.save({
      ...order,
      status: OrderStatus.DELIVERED_PENDING_CONFIRMATION,
      deliveredAt,
      fundsHeldUntil,
    });

    await this.logEvent(
      orderId,
      FulfilmentEventType.DELIVERED,
      sellerUserId,
      dto.notes?.trim(),
      {
        returnPolicyDays,
        fundsHeldUntil: fundsHeldUntil.toISOString(),
      },
    );

    const delay = Math.max(fundsHeldUntil.getTime() - deliveredAt.getTime(), 0);
    await this.enqueueDelayedOrderJob(
      OrderJobName.RELEASE_HELD_ORDER_FUNDS,
      orderId,
      delay,
    );

    return this.findById(orderId);
  }

  async confirmDelivery(
    buyerId: string,
    orderId: string,
    dto: UpdateOrderProgressDto,
  ): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only confirm your own orders');
    }

    if (order.status !== OrderStatus.DELIVERED_PENDING_CONFIRMATION) {
      throw new BadRequestException(
        'Only delivered orders can be confirmed by the buyer',
      );
    }

    if (order.buyerConfirmedAt) {
      return order;
    }

    await this.orderRepo.save({
      ...order,
      buyerConfirmedAt: new Date(),
    });

    await this.logEvent(
      orderId,
      FulfilmentEventType.BUYER_CONFIRMED,
      buyerId,
      dto.notes?.trim(),
    );

    return this.findById(orderId);
  }

  async openDispute(
    buyerId: string,
    orderId: string,
    dto: OpenDisputeDto,
  ): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only dispute your own orders');
    }

    if (order.status !== OrderStatus.DELIVERED_PENDING_CONFIRMATION) {
      throw new BadRequestException(
        'Disputes can only be opened after delivery and before funds are released',
      );
    }

    if (order.fundsReleasedAt) {
      throw new BadRequestException(
        'This order has already released seller funds and can no longer be disputed',
      );
    }

    const existingOpenDispute = await this.getOpenDispute(order.id);
    if (existingOpenDispute) {
      throw new BadRequestException(
        'An open dispute already exists for this order',
      );
    }

    const dispute = await this.disputeRepo.save(
      this.disputeRepo.create({
        orderId: order.id,
        raisedById: buyerId,
        reason: dto.reason.trim(),
        evidenceUrls: dto.evidenceUrls,
        status: DisputeStatus.OPEN,
      }),
    );

    await this.orderRepo.save({
      ...order,
      status: OrderStatus.DISPUTE_OPEN,
    });

    await this.logEvent(
      orderId,
      FulfilmentEventType.DISPUTE_OPENED,
      buyerId,
      dto.reason.trim(),
      {
        disputeId: dispute.id,
        evidenceCount: dto.evidenceUrls?.length ?? 0,
      },
    );

    return this.findById(orderId);
  }

  async resolveDispute(
    disputeId: string,
    adminId: string,
    dto: ResolveDisputeDto,
  ): Promise<Order> {
    const dispute = await this.disputeRepo.findOne({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute ${disputeId} not found`);
    }

    if (
      dispute.status !== DisputeStatus.OPEN &&
      dispute.status !== DisputeStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('This dispute has already been resolved');
    }

    const order = await this.findById(dispute.orderId);
    if (order.status !== OrderStatus.DISPUTE_OPEN) {
      throw new BadRequestException(
        'Only orders with an open dispute can be resolved',
      );
    }
    const resolutionNotes =
      dto.resolutionNotes?.trim() ??
      (dto.outcome === ResolveDisputeOutcome.SELLER
        ? 'Admin resolved the dispute in favour of the seller.'
        : 'Admin resolved the dispute in favour of the buyer and initiated a refund.');

    if (dto.outcome === ResolveDisputeOutcome.SELLER) {
      await this.disputeRepo.save({
        ...dispute,
        status: DisputeStatus.RESOLVED_SELLER,
        resolutionNotes,
        resolvedAt: new Date(),
      });

      await this.logEvent(
        order.id,
        FulfilmentEventType.DISPUTE_RESOLVED,
        adminId,
        resolutionNotes,
        {
          disputeId: dispute.id,
          outcome: ResolveDisputeOutcome.SELLER,
        },
      );

      return this.releaseHeldFundsInternal(order.id, adminId, {
        allowBeforeHoldExpires: true,
        notes: resolutionNotes,
      });
    }

    if (order.fundsReleasedAt) {
      throw new BadRequestException(
        'Cannot resolve a dispute in favour of the buyer after seller funds were released',
      );
    }

    await this.disputeRepo.save({
      ...dispute,
      status: DisputeStatus.RESOLVED_BUYER,
      resolutionNotes,
      resolvedAt: new Date(),
    });

    await this.logEvent(
      order.id,
      FulfilmentEventType.DISPUTE_RESOLVED,
      adminId,
      resolutionNotes,
      {
        disputeId: dispute.id,
        outcome: ResolveDisputeOutcome.BUYER,
      },
    );

    await this.refundsService.createRefundForResolvedDispute({
      orderId: order.id,
      adminId,
      reason: resolutionNotes,
      customerNote: 'Refund approved after dispute resolution.',
    });

    return this.findById(order.id);
  }

  async releaseHeldFundsFromQueue(orderId: string): Promise<Order> {
    return this.releaseHeldFundsInternal(orderId, 'system', {
      tolerateBlockedRelease: true,
    });
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
