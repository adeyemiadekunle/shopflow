import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import {
  FulfilmentEvent,
  FulfilmentEventType,
} from './entities/fulfilment-event.entity';
import { OrderStatus } from './enums/order-status.enum';

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
  platformFee: 1000,
  totalAmount: 11500,
  currency: 'NGN',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOrderRepo = {
  findOne: jest.fn().mockResolvedValue(mockOrder),
  find: jest.fn().mockResolvedValue([mockOrder]),
  save: jest.fn().mockImplementation((v) => Promise.resolve(v)),
  create: jest.fn().mockImplementation((v) => v),
};

const mockEventRepo = {
  save: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockImplementation((v) => v),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        {
          provide: getRepositoryToken(FulfilmentEvent),
          useValue: mockEventRepo,
        },
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

  it('transition() should allow valid state change PAID → SELLER_PREPARING', async () => {
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
        OrderStatus.DRAFT, // PAID → DRAFT is not allowed
        'seller-1',
        FulfilmentEventType.ORDER_CREATED,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('generateReference() should return a string with RND- prefix', () => {
    const ref = service.generateReference();
    expect(ref).toMatch(/^RND-/);
  });
});
