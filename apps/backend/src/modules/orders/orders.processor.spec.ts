import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersProcessor } from './orders.processor';
import { Order } from './entities/order.entity';
import { DeliveryQuote, QuoteStatus } from './entities/delivery-quote.entity';
import {
  FulfilmentEvent,
  FulfilmentEventType,
} from './entities/fulfilment-event.entity';
import { MailService } from '../mail/mail.service';
import {
  DEAD_LETTER_QUEUE,
  QUEUE_CONNECTION_OPTIONS,
} from '../queue/queue.constants';
import { OrderStatus } from './enums/order-status.enum';

describe('OrdersProcessor', () => {
  let processor: OrdersProcessor;

  const mockOrderRepo = {
    findOne: jest.fn(),
    save: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) =>
        Promise.resolve(value),
      ),
  };

  const mockDeliveryQuoteRepo = {
    findOne: jest.fn(),
    save: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) =>
        Promise.resolve(value),
      ),
  };

  const mockFulfilmentEventRepo = {
    save: jest.fn().mockResolvedValue({}),
    create: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) => value),
  };

  const mockMailService = {
    sendSellerOrderCreatedEmail: jest.fn(),
    sendSellerQuoteReminderEmail: jest.fn(),
    sendBuyerDeliveryQuoteEmail: jest.fn(),
    sendBuyerQuoteResponseReminderEmail: jest.fn(),
    sendSellerQuoteResponseEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersProcessor,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        {
          provide: getRepositoryToken(DeliveryQuote),
          useValue: mockDeliveryQuoteRepo,
        },
        {
          provide: getRepositoryToken(FulfilmentEvent),
          useValue: mockFulfilmentEventRepo,
        },
        {
          provide: QUEUE_CONNECTION_OPTIONS,
          useValue: {
            host: 'localhost',
            port: 6379,
            maxRetriesPerRequest: null,
          },
        },
        { provide: DEAD_LETTER_QUEUE, useValue: { add: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(1) },
        },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    processor = module.get<OrdersProcessor>(OrdersProcessor);
  });

  it('expires awaiting-delivery-quote orders safely', async () => {
    mockOrderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      orderReference: 'RND-001',
      status: OrderStatus.AWAITING_DELIVERY_QUOTE,
      buyer: { email: 'buyer@example.com' },
      sellerProfile: {
        storeName: 'Store',
        user: { email: 'seller@example.com' },
      },
    });

    await (processor as any).processAwaitingQuoteExpiry({
      data: { orderId: 'order-1' },
    });

    expect(mockOrderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.CANCELLED,
      }),
    );
    expect(mockFulfilmentEventRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        type: FulfilmentEventType.CANCELLED,
      }),
    );
  });

  it('expires quote-sent orders and declines the open quote', async () => {
    mockOrderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      orderReference: 'RND-001',
      status: OrderStatus.QUOTE_SENT,
      buyer: { email: 'buyer@example.com' },
      sellerProfile: {
        storeName: 'Store',
        user: { email: 'seller@example.com' },
      },
    });
    mockDeliveryQuoteRepo.findOne.mockResolvedValue({
      id: 'quote-1',
      orderId: 'order-1',
      status: QuoteStatus.SENT,
    });

    await (processor as any).processQuoteSentExpiry({
      data: { orderId: 'order-1' },
    });

    expect(mockDeliveryQuoteRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'quote-1',
        status: QuoteStatus.DECLINED,
      }),
    );
    expect(mockOrderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.CANCELLED,
      }),
    );
  });
});
