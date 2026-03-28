import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FulfilmentEvent } from '../orders/entities/fulfilment-event.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { PAYMENTS_QUEUE } from '../queue/queue.constants';
import { UsersService } from '../users/users.service';
import {
  PaymentIntent,
  PaymentIntentStatus,
} from './entities/payment-intent.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPaymentIntentRepo = {
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

  const mockWebhookRepo = {
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

  const mockOrderRepo = {
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

  const mockPaystackService = {
    initializeTransaction: jest.fn(),
    verifyTransaction: jest.fn(),
  };

  const mockPaymentsQueue = {
    add: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(PaymentIntent),
          useValue: mockPaymentIntentRepo,
        },
        {
          provide: getRepositoryToken(WebhookEvent),
          useValue: mockWebhookRepo,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(FulfilmentEvent),
          useValue: mockFulfilmentEventRepo,
        },
        { provide: PAYMENTS_QUEUE, useValue: mockPaymentsQueue },
        { provide: PaystackService, useValue: mockPaystackService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('initializeCheckout() should create a checkout session for a quote-accepted order', async () => {
    mockOrderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      orderReference: 'RND-100',
      buyerId: 'buyer-1',
      sellerProfileId: 'seller-1',
      totalAmount: 19800,
      currency: 'NGN',
      status: OrderStatus.QUOTE_ACCEPTED,
    });
    mockUsersService.findById.mockResolvedValue({
      id: 'buyer-1',
      email: 'buyer@example.com',
    });
    mockPaymentIntentRepo.findOne.mockResolvedValue(null);
    mockPaystackService.initializeTransaction.mockResolvedValue({
      authorization_url: 'https://checkout.paystack.com/test',
      access_code: 'ACCESS_CODE',
      reference: 'PAY-RND-100-TESTREF',
    });

    const result = await service.initializeCheckout(
      {
        id: 'buyer-1',
        email: 'buyer@example.com',
        role: 'buyer',
        isEmailVerified: true,
        isActive: true,
      },
      'order-1',
      {
        channels: ['card', 'bank_transfer'],
      },
    );

    expect(mockOrderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.PAYMENT_PENDING,
      }),
    );
    expect(result.authorizationUrl).toBe('https://checkout.paystack.com/test');
    expect(result.reference).toBe('PAY-RND-100-TESTREF');
  });

  it('initializeCheckout() should reject another buyer trying to pay someone else order', async () => {
    mockOrderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      buyerId: 'buyer-1',
      totalAmount: 5000,
      currency: 'NGN',
      status: OrderStatus.QUOTE_ACCEPTED,
    });

    await expect(
      service.initializeCheckout(
        {
          id: 'buyer-2',
          email: 'buyer2@example.com',
          role: 'buyer',
          isEmailVerified: true,
          isActive: true,
        },
        'order-1',
        {},
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('verifyCheckout() should mark a successful payment intent as succeeded and pay the order', async () => {
    mockPaymentIntentRepo.findOne.mockResolvedValue({
      id: 'intent-1',
      orderId: 'order-1',
      buyerId: 'buyer-1',
      paystackReference: 'PAY-RND-100-TESTREF',
      amountKobo: 1980000,
      currency: 'NGN',
      status: PaymentIntentStatus.PROCESSING,
    });
    mockPaystackService.verifyTransaction.mockResolvedValue({
      status: 'success',
      reference: 'PAY-RND-100-TESTREF',
      amount: 1980000,
      currency: 'NGN',
      paid_at: '2026-03-28T16:55:00.000Z',
      channel: 'card',
      metadata: {},
      authorization: {
        authorization_code: 'AUTH_CODE',
        card_type: 'visa',
        last4: '4081',
        bank: 'Test Bank',
      },
    });
    mockOrderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      buyerId: 'buyer-1',
      status: OrderStatus.PAYMENT_PENDING,
    });

    const result = await service.verifyCheckout('PAY-RND-100-TESTREF', {
      id: 'buyer-1',
      email: 'buyer@example.com',
      role: 'buyer',
      isEmailVerified: true,
      isActive: true,
    });

    expect(result.paymentIntent.status).toBe(PaymentIntentStatus.SUCCEEDED);
    expect(mockOrderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.PAID,
      }),
    );
    expect(mockFulfilmentEventRepo.save).toHaveBeenCalled();
  });

  it('verifyCheckout() should reject unknown references', async () => {
    mockPaymentIntentRepo.findOne.mockResolvedValue(null);

    await expect(
      service.verifyCheckout('missing-ref', {
        id: 'buyer-1',
        email: 'buyer@example.com',
        role: 'buyer',
        isEmailVerified: true,
        isActive: true,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('verifyCheckout() should reject mismatched payment amounts', async () => {
    mockPaymentIntentRepo.findOne.mockResolvedValue({
      id: 'intent-1',
      orderId: 'order-1',
      buyerId: 'buyer-1',
      paystackReference: 'PAY-RND-100-TESTREF',
      amountKobo: 1980000,
      currency: 'NGN',
      status: PaymentIntentStatus.PROCESSING,
    });
    mockPaystackService.verifyTransaction.mockResolvedValue({
      status: 'success',
      reference: 'PAY-RND-100-TESTREF',
      amount: 100,
      currency: 'NGN',
      paid_at: '2026-03-28T16:55:00.000Z',
      channel: 'card',
      metadata: {},
      authorization: {
        authorization_code: 'AUTH_CODE',
        card_type: 'visa',
        last4: '4081',
        bank: 'Test Bank',
      },
    });

    await expect(
      service.verifyCheckout('PAY-RND-100-TESTREF', {
        id: 'buyer-1',
        email: 'buyer@example.com',
        role: 'buyer',
        isEmailVerified: true,
        isActive: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('verifyCheckout() should be idempotent for already succeeded intents', async () => {
    const succeededIntent = {
      id: 'intent-1',
      orderId: 'order-1',
      buyerId: 'buyer-1',
      paystackReference: 'PAY-RND-100-TESTREF',
      amountKobo: 1980000,
      currency: 'NGN',
      status: PaymentIntentStatus.SUCCEEDED,
      verifiedAt: new Date('2026-03-28T16:55:00.000Z'),
    };

    mockPaymentIntentRepo.findOne.mockResolvedValue(succeededIntent);
    mockPaystackService.verifyTransaction.mockResolvedValue({
      status: 'success',
      reference: 'PAY-RND-100-TESTREF',
      amount: 1980000,
      currency: 'NGN',
      paid_at: '2026-03-28T16:55:00.000Z',
      channel: 'card',
      metadata: {},
      authorization: {
        authorization_code: 'AUTH_CODE',
        card_type: 'visa',
        last4: '4081',
        bank: 'Test Bank',
      },
    });

    const result = await service.verifyCheckout('PAY-RND-100-TESTREF', {
      id: 'buyer-1',
      email: 'buyer@example.com',
      role: 'buyer',
      isEmailVerified: true,
      isActive: true,
    });

    expect(result.paymentIntent).toBe(succeededIntent);
    expect(mockPaymentIntentRepo.save).not.toHaveBeenCalled();
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
    expect(mockFulfilmentEventRepo.save).not.toHaveBeenCalled();
  });

  it('enqueueWebhook() should persist and queue an unprocessed webhook event', async () => {
    mockWebhookRepo.findOne.mockResolvedValue(null);
    mockWebhookRepo.save.mockResolvedValue({
      id: 'webhook-1',
      eventType: 'charge.success',
      reference: 'PAY-RND-100-TESTREF',
      processed: false,
    });
    mockPaymentsQueue.add.mockResolvedValue({});

    const result = await service.enqueueWebhook({
      event: 'charge.success',
      data: {
        id: 12345,
        reference: 'PAY-RND-100-TESTREF',
      },
    });

    expect(mockPaymentsQueue.add).toHaveBeenCalledWith(
      'process-webhook-event',
      { webhookEventId: 'webhook-1' },
      { jobId: 'payment-webhook:webhook-1' },
    );
    expect(result).toEqual({
      received: true,
      queued: true,
      eventId: 'webhook-1',
    });
  });

  it('enqueueWebhook() should reuse an existing event for duplicate charge.success references', async () => {
    mockWebhookRepo.findOne.mockResolvedValue({
      id: 'webhook-1',
      eventType: 'charge.success',
      reference: 'PAY-RND-100-TESTREF',
      processed: false,
      rawPayload: {},
    });
    mockWebhookRepo.save.mockResolvedValue({
      id: 'webhook-1',
      eventType: 'charge.success',
      reference: 'PAY-RND-100-TESTREF',
      processed: false,
    });
    mockPaymentsQueue.add.mockResolvedValue({});

    const result = await service.enqueueWebhook({
      event: 'charge.success',
      data: {
        reference: 'PAY-RND-100-TESTREF',
      },
    });

    expect(mockWebhookRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'webhook-1',
        eventType: 'charge.success',
        reference: 'PAY-RND-100-TESTREF',
      }),
    );
    expect(mockPaymentsQueue.add).toHaveBeenCalledWith(
      'process-webhook-event',
      { webhookEventId: 'webhook-1' },
      { jobId: 'payment-webhook:webhook-1' },
    );
    expect(result).toEqual({
      received: true,
      queued: true,
      eventId: 'webhook-1',
    });
  });

  it('processWebhookEvent() should ignore charge.failed for already successful intents', async () => {
    mockWebhookRepo.findOne.mockResolvedValue({
      id: 'webhook-1',
      eventType: 'charge.failed',
      reference: 'PAY-RND-100-TESTREF',
      processed: false,
      rawPayload: { event: 'charge.failed' },
    });
    mockPaymentIntentRepo.findOne.mockResolvedValue({
      id: 'intent-1',
      orderId: 'order-1',
      buyerId: 'buyer-1',
      paystackReference: 'PAY-RND-100-TESTREF',
      amountKobo: 1980000,
      currency: 'NGN',
      status: PaymentIntentStatus.SUCCEEDED,
    });

    await service.processWebhookEvent('webhook-1');

    expect(mockPaymentIntentRepo.save).not.toHaveBeenCalled();
    expect(mockWebhookRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'webhook-1',
        processed: true,
      }),
    );
  });
});
