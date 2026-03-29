import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LedgerService } from '../ledger/ledger.service';
import { FulfilmentEvent } from '../orders/entities/fulfilment-event.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { PAYMENTS_QUEUE } from '../queue/queue.constants';
import { PayoutsService } from '../payouts/payouts.service';
import { RefundsService } from '../refunds/refunds.service';
import { UsersService } from '../users/users.service';
import {
  PaymentIntent,
  PaymentIntentStatus,
} from './entities/payment-intent.entity';
import {
  PaymentReconciliationIssue,
  PaymentReconciliationIssueSeverity,
  PaymentReconciliationIssueStatus,
  PaymentReconciliationIssueType,
} from './entities/payment-reconciliation-issue.entity';
import {
  PaymentReconciliationRun,
  PaymentReconciliationRunStatus,
} from './entities/payment-reconciliation-run.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPaymentIntentRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
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

  const mockReconciliationRunRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) =>
        Promise.resolve(value),
      ),
    create: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) => value),
  };

  const mockReconciliationIssueRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
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

  const mockLedgerService = {
    ensureAccount: jest.fn().mockResolvedValue(undefined),
    hasRecordedReference: jest.fn().mockResolvedValue(false),
    record: jest.fn().mockResolvedValue(undefined),
  };

  const mockPayoutsService = {
    processPaystackWebhook: jest.fn(),
  };

  const mockRefundsService = {
    processPaystackWebhook: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'queue.paymentsReconciliationIntervalMs':
          return 900000;
        case 'queue.paymentsReconciliationMinAgeMs':
          return 600000;
        case 'queue.paymentsReconciliationBatchSize':
          return 100;
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockLedgerService.hasRecordedReference.mockResolvedValue(false);

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
          provide: getRepositoryToken(PaymentReconciliationRun),
          useValue: mockReconciliationRunRepo,
        },
        {
          provide: getRepositoryToken(PaymentReconciliationIssue),
          useValue: mockReconciliationIssueRepo,
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
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PaystackService, useValue: mockPaystackService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: LedgerService, useValue: mockLedgerService },
        {
          provide: PayoutsService,
          useValue: mockPayoutsService,
        },
        {
          provide: RefundsService,
          useValue: mockRefundsService,
        },
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
      orderReference: 'RND-100',
      buyerId: 'buyer-1',
      sellerProfileId: 'seller-1',
      totalAmount: 19800,
      currency: 'NGN',
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
    expect(mockLedgerService.record).toHaveBeenCalledTimes(2);
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
    mockOrderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      orderReference: 'RND-100',
      buyerId: 'buyer-1',
      sellerProfileId: 'seller-1',
      totalAmount: 19800,
      currency: 'NGN',
      status: OrderStatus.PAYMENT_PENDING,
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

    const result = await service.verifyCheckout('PAY-RND-100-TESTREF', {
      id: 'buyer-1',
      email: 'buyer@example.com',
      role: 'buyer',
      isEmailVerified: true,
      isActive: true,
    });

    expect(result.paymentIntent).toBe(succeededIntent);
    expect(mockPaymentIntentRepo.save).not.toHaveBeenCalled();
    expect(mockOrderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.PAID,
      }),
    );
    expect(mockLedgerService.record).toHaveBeenCalledTimes(2);
    expect(mockFulfilmentEventRepo.save).toHaveBeenCalled();
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

  it('processWebhookEvent() should forward refund webhooks to the refunds service', async () => {
    mockWebhookRepo.findOne.mockResolvedValue({
      id: 'webhook-refund-1',
      eventType: 'refund.processed',
      reference: 'PAY-RND-100-TESTREF',
      processed: false,
      rawPayload: { event: 'refund.processed', data: { id: 44 } },
    });
    mockRefundsService.processPaystackWebhook.mockResolvedValue(true);

    await service.processWebhookEvent('webhook-refund-1');

    expect(mockRefundsService.processPaystackWebhook).toHaveBeenCalledWith(
      'refund.processed',
      { event: 'refund.processed', data: { id: 44 } },
    );
    expect(mockWebhookRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'webhook-refund-1',
        processed: true,
      }),
    );
  });

  it('enqueueReconciliationRun() should queue a manual reconciliation job', async () => {
    mockPaymentsQueue.add.mockResolvedValue({});

    const result = await service.enqueueReconciliationRun(
      'manual',
      'admin-1',
      true,
    );

    expect(mockPaymentsQueue.add).toHaveBeenCalledWith(
      'run-payment-reconciliation',
      {
        trigger: 'manual',
        initiatedByUserId: 'admin-1',
      },
      expect.objectContaining({
        jobId: expect.stringContaining('payment-reconciliation:manual:'),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        queued: true,
        trigger: 'manual',
      }),
    );
  });

  it('processReconciliationJob() should repair a succeeded payment whose order is still payment_pending', async () => {
    mockReconciliationRunRepo.save
      .mockResolvedValueOnce({
        id: 'run-1',
        status: PaymentReconciliationRunStatus.STARTED,
        startedAt: new Date('2026-03-28T12:00:00.000Z'),
      })
      .mockImplementation((value: Record<string, unknown>) =>
        Promise.resolve(value),
      );
    mockPaymentIntentRepo.find.mockResolvedValue([
      {
        id: 'intent-1',
        orderId: 'order-1',
        buyerId: 'buyer-1',
        paystackReference: 'PAY-RND-100-TESTREF',
        amountKobo: 1980000,
        currency: 'NGN',
        status: PaymentIntentStatus.SUCCEEDED,
        updatedAt: new Date('2026-03-28T10:00:00.000Z'),
        rawVerifyPayload: {
          status: 'success',
          reference: 'PAY-RND-100-TESTREF',
          amount: 1980000,
          currency: 'NGN',
          paid_at: '2026-03-28T10:05:00.000Z',
          channel: 'card',
          metadata: {},
          authorization: {
            authorization_code: 'AUTH_CODE',
            card_type: 'visa',
            last4: '4081',
            bank: 'Test Bank',
          },
        },
      },
    ]);
    mockOrderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      orderReference: 'RND-100',
      buyerId: 'buyer-1',
      sellerProfileId: 'seller-1',
      totalAmount: 19800,
      currency: 'NGN',
      status: OrderStatus.PAYMENT_PENDING,
    });
    mockReconciliationIssueRepo.findOne.mockResolvedValue(null);
    mockReconciliationIssueRepo.count.mockResolvedValue(0);

    const result = await service.processReconciliationJob({
      trigger: 'scheduled',
    });

    expect(mockOrderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.PAID,
      }),
    );
    expect(mockFulfilmentEventRepo.save).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        repairedCount: 1,
        issueCount: 1,
        status: PaymentReconciliationRunStatus.COMPLETED_WITH_ISSUES,
      }),
    );
  });

  it('processReconciliationJob() should record an open issue for failed intents attached to paid orders', async () => {
    mockReconciliationRunRepo.save
      .mockResolvedValueOnce({
        id: 'run-2',
        status: PaymentReconciliationRunStatus.STARTED,
        startedAt: new Date('2026-03-28T12:00:00.000Z'),
      })
      .mockImplementation((value: Record<string, unknown>) =>
        Promise.resolve(value),
      );
    mockPaymentIntentRepo.find.mockResolvedValue([
      {
        id: 'intent-2',
        orderId: 'order-2',
        buyerId: 'buyer-1',
        paystackReference: 'PAY-RND-200-TESTREF',
        amountKobo: 250000,
        currency: 'NGN',
        status: PaymentIntentStatus.FAILED,
        updatedAt: new Date('2026-03-28T10:00:00.000Z'),
      },
    ]);
    mockOrderRepo.findOne.mockResolvedValue({
      id: 'order-2',
      orderReference: 'RND-200',
      buyerId: 'buyer-1',
      sellerProfileId: 'seller-1',
      totalAmount: 2500,
      currency: 'NGN',
      status: OrderStatus.PAID,
    });
    mockReconciliationIssueRepo.findOne.mockResolvedValue(null);
    mockReconciliationIssueRepo.count.mockResolvedValue(0);

    const result = await service.processReconciliationJob({
      trigger: 'manual',
      initiatedByUserId: 'admin-1',
    });

    expect(mockReconciliationIssueRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: PaymentReconciliationIssueType.FAILED_ORDER_MARKED_PAID,
        severity: PaymentReconciliationIssueSeverity.ERROR,
        status: PaymentReconciliationIssueStatus.OPEN,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        issueCount: 1,
        repairedCount: 0,
        status: PaymentReconciliationRunStatus.COMPLETED_WITH_ISSUES,
      }),
    );
  });
});
