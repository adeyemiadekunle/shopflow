import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../catalog/entities/product.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { ORDERS_QUEUE } from '../queue/queue.constants';
import { SellersService } from '../sellers/sellers.service';
import { UserRole } from '../users/enums/user-role.enum';
import { DeliveryQuote, QuoteStatus } from './entities/delivery-quote.entity';
import {
  FulfilmentEvent,
  FulfilmentEventType,
} from './entities/fulfilment-event.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockOrder: Order = {
    id: 'order-1',
    orderReference: 'RND-001',
    buyerId: 'buyer-1',
    buyer: {} as any,
    sellerProfileId: 'seller-1',
    sellerProfile: {} as any,
    status: OrderStatus.PAID,
    itemsTotal: 10000,
    deliveryFee: 500,
    platformFee: 0,
    totalAmount: 10500,
    currency: 'NGN',
    deliveryAddress: { addressLine1: '12 Allen Avenue' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderRepo = {
    findOne: jest.fn().mockResolvedValue(mockOrder),
    find: jest.fn().mockResolvedValue([mockOrder]),
    save: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) =>
        Promise.resolve(value),
      ),
    create: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) => value),
  };

  const mockOrderItemRepo = {
    create: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) => value),
  };

  const mockDeliveryQuoteRepo = {
    findOne: jest.fn(),
    save: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) =>
        Promise.resolve(value),
      ),
    create: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) => value),
  };

  const mockEventRepo = {
    save: jest.fn().mockResolvedValue({}),
    create: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) => value),
  };

  const mockProductRepo = {
    find: jest.fn(),
  };

  const mockProductVariantRepo = {
    find: jest.fn(),
  };

  const mockSellersService = {
    getByUserIdOrThrow: jest.fn(),
  };

  const mockOrdersQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockOrderRepo.findOne.mockResolvedValue(mockOrder);
    mockOrderRepo.find.mockResolvedValue([mockOrder]);
    mockOrdersQueue.add.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepo },
        {
          provide: getRepositoryToken(DeliveryQuote),
          useValue: mockDeliveryQuoteRepo,
        },
        {
          provide: getRepositoryToken(FulfilmentEvent),
          useValue: mockEventRepo,
        },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: mockProductVariantRepo,
        },
        { provide: ORDERS_QUEUE, useValue: mockOrdersQueue },
        { provide: SellersService, useValue: mockSellersService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findById() should return an order', async () => {
    const order = await service.findById('order-1');
    expect(order.id).toBe('order-1');
  });

  it('findById() should throw NotFoundException for unknown id', async () => {
    mockOrderRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.findById('unknown')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('transition() should allow valid state change PAID to SELLER_PREPARING', async () => {
    const order = await service.transition(
      'order-1',
      OrderStatus.SELLER_PREPARING,
      'seller-1',
      FulfilmentEventType.PREPARING,
    );
    expect(order.status).toBe(OrderStatus.SELLER_PREPARING);
    expect(mockOrderRepo.save).toHaveBeenCalled();
    expect(mockEventRepo.save).toHaveBeenCalled();
  });

  it('transition() should throw BadRequestException for invalid state change', async () => {
    await expect(
      service.transition(
        'order-1',
        OrderStatus.DRAFT,
        'seller-1',
        FulfilmentEventType.ORDER_CREATED,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('createOrder() should reject carts that mix sellers', async () => {
    mockProductRepo.find.mockResolvedValue([
      {
        id: 'product-1',
        title: 'Product 1',
        sellerProfileId: 'seller-1',
        currency: 'NGN',
        basePrice: 10000,
        status: 'active',
      },
      {
        id: 'product-2',
        title: 'Product 2',
        sellerProfileId: 'seller-2',
        currency: 'NGN',
        basePrice: 5000,
        status: 'active',
      },
    ]);
    mockProductVariantRepo.find.mockResolvedValue([]);

    await expect(
      service.createOrder('buyer-1', {
        items: [
          { productId: 'product-1', quantity: 1 },
          { productId: 'product-2', quantity: 1 },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('createOrder() should create an awaiting-delivery-quote order', async () => {
    mockProductRepo.find.mockResolvedValue([
      {
        id: 'product-1',
        title: 'Ankara Gown',
        description: 'Premium dress',
        sellerProfileId: 'seller-1',
        currency: 'NGN',
        basePrice: 10000,
        effectivePrice: 9000,
        hasDiscount: true,
        discountType: 'percentage',
        discountValue: 10,
        status: 'active',
      },
    ]);
    mockProductVariantRepo.find.mockResolvedValue([]);
    mockOrderRepo.save
      .mockResolvedValueOnce({
        id: 'order-new',
        buyerId: 'buyer-1',
        sellerProfileId: 'seller-1',
        status: OrderStatus.AWAITING_DELIVERY_QUOTE,
        itemsTotal: 18000,
        platformFee: 0,
        totalAmount: 18000,
        currency: 'NGN',
      })
      .mockResolvedValueOnce({
        ...mockOrder,
        id: 'order-new',
        buyerId: 'buyer-1',
        sellerProfileId: 'seller-1',
        status: OrderStatus.AWAITING_DELIVERY_QUOTE,
      });
    mockOrderRepo.findOne.mockResolvedValueOnce({
      ...mockOrder,
      id: 'order-new',
      buyerId: 'buyer-1',
      sellerProfileId: 'seller-1',
      status: OrderStatus.AWAITING_DELIVERY_QUOTE,
    });

    const order = await service.createOrder('buyer-1', {
      items: [{ productId: 'product-1', quantity: 2 }],
      deliveryAddress: {
        addressLine1: '12 Allen Avenue',
        state: 'Lagos',
        lga: 'Ikeja',
        country: 'NG',
      },
    });

    expect(mockOrderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerId: 'buyer-1',
        sellerProfileId: 'seller-1',
        status: OrderStatus.AWAITING_DELIVERY_QUOTE,
        itemsTotal: 18000,
        platformFee: 0,
      }),
    );
    expect(order.status).toBe(OrderStatus.AWAITING_DELIVERY_QUOTE);
    expect(mockEventRepo.save).toHaveBeenCalled();
    expect(mockOrdersQueue.add).toHaveBeenCalledWith(
      'send-order-created-notification',
      { orderId: 'order-new' },
      { jobId: 'send-order-created-notification:order-new:na' },
    );
  });

  it('sendDeliveryQuote() should update the order total and quote status', async () => {
    mockSellersService.getByUserIdOrThrow.mockResolvedValue({ id: 'seller-1' });
    mockOrderRepo.findOne.mockResolvedValueOnce({
      ...mockOrder,
      status: OrderStatus.AWAITING_DELIVERY_QUOTE,
    });
    mockDeliveryQuoteRepo.save.mockResolvedValue({
      id: 'quote-1',
      orderId: 'order-1',
      feeAmount: 2500,
      status: QuoteStatus.SENT,
    });
    mockOrderRepo.findOne.mockResolvedValueOnce({
      ...mockOrder,
      status: OrderStatus.QUOTE_SENT,
      deliveryFee: 2500,
      totalAmount: 12500,
    });

    const order = await service.sendDeliveryQuote('seller-user-1', 'order-1', {
      feeAmount: 2500,
      sellerNote: 'Dispatch within 24 hours',
    });

    expect(order.status).toBe(OrderStatus.QUOTE_SENT);
    expect(mockDeliveryQuoteRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        feeAmount: 2500,
        status: QuoteStatus.SENT,
      }),
    );
    expect(mockOrdersQueue.add).toHaveBeenCalledWith(
      'send-delivery-quote-notification',
      { orderId: 'order-1' },
      { jobId: 'send-delivery-quote-notification:order-1:na' },
    );
  });

  it('respondToQuote() should accept the latest quote for the buyer order', async () => {
    mockOrderRepo.findOne.mockResolvedValueOnce({
      ...mockOrder,
      status: OrderStatus.QUOTE_SENT,
    });
    mockDeliveryQuoteRepo.findOne.mockResolvedValue({
      id: 'quote-1',
      orderId: 'order-1',
      status: QuoteStatus.SENT,
    });
    mockOrderRepo.findOne.mockResolvedValueOnce({
      ...mockOrder,
      status: OrderStatus.QUOTE_ACCEPTED,
    });

    const order = await service.respondToQuote('buyer-1', 'order-1', {
      accept: true,
    });

    expect(order.status).toBe(OrderStatus.QUOTE_ACCEPTED);
    expect(mockDeliveryQuoteRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'quote-1',
        status: QuoteStatus.ACCEPTED,
      }),
    );
    expect(mockOrdersQueue.add).toHaveBeenCalledWith(
      'send-quote-response-notification',
      { orderId: 'order-1', accepted: true },
      { jobId: 'send-quote-response-notification:order-1:true' },
    );
  });

  it('findForUser() should block unrelated buyers from accessing the order', async () => {
    await expect(
      service.findForUser('order-1', {
        id: 'buyer-2',
        email: 'buyer2@example.com',
        role: UserRole.BUYER,
        isEmailVerified: true,
        isActive: true,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
