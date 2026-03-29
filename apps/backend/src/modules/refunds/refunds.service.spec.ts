import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LedgerService } from '../ledger/ledger.service';
import {
  LedgerAccountType,
  LedgerEventType,
} from '../ledger/enums/ledger.enum';
import { DisputeCase, DisputeStatus } from '../orders/entities/dispute-case.entity';
import {
  FulfilmentEvent,
  FulfilmentEventType,
} from '../orders/entities/fulfilment-event.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import {
  PaymentIntent,
  PaymentIntentStatus,
} from '../payments/entities/payment-intent.entity';
import { MonnifyService } from '../payments/monnify.service';
import { PaystackService } from '../payments/paystack.service';
import { Refund, RefundStatus } from './entities/refund.entity';
import { RefundsService } from './refunds.service';

describe('RefundsService', () => {
  let service: RefundsService;

  const mockRefundRepo = {
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

  const mockOrderRepo = {
    findOne: jest.fn(),
    save: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) =>
        Promise.resolve(value),
      ),
  };

  const mockPaymentIntentRepo = {
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

  const mockDisputeRepo = {
    findOne: jest.fn(),
    save: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) =>
        Promise.resolve(value),
      ),
  };

  const mockLedgerService = {
    ensureAccount: jest.fn().mockResolvedValue(undefined),
    hasRecordedReference: jest.fn().mockResolvedValue(false),
    record: jest.fn().mockResolvedValue(undefined),
  };

  const mockPaystackService = {
    createRefund: jest.fn(),
    retryRefundWithCustomerDetails: jest.fn(),
  };

  const mockMonnifyService = {
    createRefund: jest.fn(),
    getRefundStatus: jest.fn(),
  };

  const baseOrder: Order = {
    id: 'order-1',
    orderReference: 'RND-001',
    buyerId: 'buyer-1',
    buyer: {} as Order['buyer'],
    sellerProfileId: 'seller-1',
    sellerProfile: {} as Order['sellerProfile'],
    status: OrderStatus.DISPUTE_OPEN,
    itemsTotal: 10000,
    deliveryFee: 500,
    platformFee: 0,
    totalAmount: 10500,
    currency: 'NGN',
    paidAt: new Date('2026-03-29T10:00:00.000Z'),
    deliveredAt: new Date('2026-03-29T12:00:00.000Z'),
    buyerConfirmedAt: undefined,
    fundsHeldUntil: new Date('2026-04-05T12:00:00.000Z'),
    fundsReleasedAt: undefined,
    completedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const basePaymentIntent: PaymentIntent = {
    id: 'payment-1',
    orderId: 'order-1',
    order: {} as PaymentIntent['order'],
    buyerId: 'buyer-1',
    buyer: {} as PaymentIntent['buyer'],
    paystackReference: 'PAY-RND-001-TEST',
    idempotencyKey: 'idem-1',
    amountKobo: 1050000,
    currency: 'NGN',
    status: PaymentIntentStatus.SUCCEEDED,
    authorizationUrl: 'https://checkout.paystack.com/test',
    rawVerifyPayload: undefined,
    verifiedAt: new Date('2026-03-29T10:01:00.000Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockLedgerService.hasRecordedReference.mockResolvedValue(false);
    mockOrderRepo.findOne.mockResolvedValue(baseOrder);
    mockPaymentIntentRepo.findOne.mockResolvedValue(basePaymentIntent);
    mockRefundRepo.findOne.mockResolvedValue(null);
    mockDisputeRepo.findOne.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundsService,
        { provide: getRepositoryToken(Refund), useValue: mockRefundRepo },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        {
          provide: getRepositoryToken(PaymentIntent),
          useValue: mockPaymentIntentRepo,
        },
        {
          provide: getRepositoryToken(FulfilmentEvent),
          useValue: mockFulfilmentEventRepo,
        },
        {
          provide: getRepositoryToken(DisputeCase),
          useValue: mockDisputeRepo,
        },
        { provide: LedgerService, useValue: mockLedgerService },
        { provide: PaystackService, useValue: mockPaystackService },
        { provide: MonnifyService, useValue: mockMonnifyService },
      ],
    }).compile();

    service = module.get<RefundsService>(RefundsService);
  });

  it('createRefund() should reserve funds and move the order into refund_pending', async () => {
    mockPaystackService.createRefund.mockResolvedValue({
      id: 44,
      amount: 1050000,
      currency: 'NGN',
      status: 'pending',
    });

    const refund = await service.createRefund('admin-1', {
      orderId: 'order-1',
      reason: 'Approved before seller payout',
    });

    expect(mockLedgerService.record).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        accountType: LedgerAccountType.SELLER_PENDING,
        eventType: LedgerEventType.REFUND_INITIATED,
        amount: -10500,
      }),
    );
    expect(mockLedgerService.record).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        accountType: LedgerAccountType.REFUND_RESERVE,
        eventType: LedgerEventType.REFUND_INITIATED,
        amount: 10500,
      }),
    );
    expect(mockOrderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.REFUND_PENDING,
      }),
    );
    expect(refund.status).toBe(RefundStatus.PENDING);
  });

  it('createRefund() should reject refunds after seller funds have been released', async () => {
    mockOrderRepo.findOne.mockResolvedValueOnce({
      ...baseOrder,
      fundsReleasedAt: new Date('2026-04-06T12:00:00.000Z'),
    });

    await expect(
      service.createRefund('admin-1', {
        orderId: 'order-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('createRefund() should support Monnify refund initiation for Monnify payments', async () => {
    mockPaymentIntentRepo.findOne.mockResolvedValueOnce({
      ...basePaymentIntent,
      provider: 'monnify',
      providerPaymentReference: 'MNFY_PAY_1',
    });
    mockMonnifyService.createRefund.mockResolvedValue({
      refundReference: 'MNFY_REF_1',
      transactionReference: 'PAY-RND-001-TEST',
      refundReason: 'Approved before seller payout',
      customerNote: 'Refund approved',
      refundAmount: 10500,
      refundStatus: 'PENDING',
    });

    const refund = await service.createRefund('admin-1', {
      orderId: 'order-1',
      reason: 'Approved before seller payout',
      customerNote: 'Refund approved',
      destinationAccountNumber: '0123456789',
      destinationBankCode: '050',
    });

    expect(mockMonnifyService.createRefund).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionReference: 'PAY-RND-001-TEST',
        refundAmount: 10500,
        destinationAccountNumber: '0123456789',
        destinationAccountBankCode: '050',
      }),
    );
    expect(refund.provider).toBe('monnify');
    expect(refund.providerRefundReference).toBe('MNFY_REF_1');
  });

  it('retryRefundWithBuyerDetails() should send buyer account details to Paystack', async () => {
    mockRefundRepo.findOne.mockResolvedValueOnce({
      id: 'refund-1',
      orderId: 'order-1',
      paymentIntentId: 'payment-1',
      amount: 10500,
      currency: 'NGN',
      status: RefundStatus.NEEDS_ATTENTION,
      paystackRefundId: '44',
    });
    mockPaystackService.retryRefundWithCustomerDetails.mockResolvedValue({
      id: 44,
      amount: 1050000,
      currency: 'NGN',
      status: 'processing',
    });

    const refund = await service.retryRefundWithBuyerDetails(
      'refund-1',
      'admin-1',
      {
        bankId: '011',
        accountNumber: '0123456789',
        currency: 'NGN',
        accountName: 'Buyer One',
      },
    );

    expect(
      mockPaystackService.retryRefundWithCustomerDetails,
    ).toHaveBeenCalledWith({
      refundId: 44,
      currency: 'NGN',
      accountNumber: '0123456789',
      bankId: '011',
    });
    expect(refund.status).toBe(RefundStatus.PROCESSING);
  });

  it('retryRefundWithBuyerDetails() should re-initiate a Monnify refund when the prior attempt failed', async () => {
    mockRefundRepo.findOne.mockResolvedValueOnce({
      id: 'refund-monnify-retry-1',
      orderId: 'order-1',
      order: baseOrder,
      paymentIntentId: 'payment-1',
      amount: 10500,
      currency: 'NGN',
      status: RefundStatus.FAILED,
      provider: 'monnify',
      providerRefundReference: 'MNFY_REF_OLD',
      transactionReference: 'PAY-RND-001-TEST',
      reason: 'Retry Monnify refund',
      merchantNote: 'Retry Monnify refund',
    });
    mockMonnifyService.getRefundStatus.mockResolvedValue({
      refundReference: 'MNFY_REF_OLD',
      transactionReference: 'PAY-RND-001-TEST',
      refundStatus: 'FAILED',
      refundAmount: 10500,
      refundReason: 'Retry Monnify refund',
    });
    mockMonnifyService.createRefund.mockResolvedValue({
      refundReference: 'MNFY_REF_NEW',
      transactionReference: 'PAY-RND-001-TEST',
      refundStatus: 'PENDING',
      refundAmount: 10500,
      refundReason: 'Retry Monnify refund',
    });

    const refund = await service.retryRefundWithBuyerDetails(
      'refund-monnify-retry-1',
      'admin-1',
      {
        bankId: '050',
        accountNumber: '0123456789',
        currency: 'NGN',
        accountName: 'Buyer One',
      },
    );

    expect(mockMonnifyService.getRefundStatus).toHaveBeenCalledWith(
      'MNFY_REF_OLD',
    );
    expect(mockMonnifyService.createRefund).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionReference: 'PAY-RND-001-TEST',
        destinationAccountNumber: '0123456789',
        destinationAccountBankCode: '050',
      }),
    );
    expect(refund.providerRefundReference).toBe('MNFY_REF_NEW');
    expect(refund.status).toBe(RefundStatus.PENDING);
  });

  it('processPaystackWebhook() should finalize processed refunds', async () => {
    mockRefundRepo.findOne.mockResolvedValueOnce({
      id: 'refund-1',
      orderId: 'order-1',
      paymentIntentId: 'payment-1',
      transactionReference: 'PAY-RND-001-TEST',
      paystackRefundId: '44',
      amount: 10500,
      currency: 'NGN',
      status: RefundStatus.PROCESSING,
    });
    mockOrderRepo.findOne.mockResolvedValueOnce(baseOrder);
    mockPaymentIntentRepo.findOne.mockResolvedValueOnce(basePaymentIntent);
    mockDisputeRepo.findOne.mockResolvedValueOnce({
      id: 'dispute-1',
      orderId: 'order-1',
      status: DisputeStatus.RESOLVED_BUYER,
    });

    const handled = await service.processPaystackWebhook('refund.processed', {
      event: 'refund.processed',
      data: {
        id: 44,
        status: 'processed',
        transaction: {
          reference: 'PAY-RND-001-TEST',
        },
      },
    });

    expect(handled).toBe(true);
    expect(mockLedgerService.record).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        accountType: LedgerAccountType.REFUND_RESERVE,
        eventType: LedgerEventType.REFUND_COMPLETED,
        amount: -10500,
      }),
    );
    expect(mockLedgerService.record).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        accountType: LedgerAccountType.PLATFORM_CASH_CLEARING,
        eventType: LedgerEventType.REFUND_COMPLETED,
        amount: -10500,
      }),
    );
    expect(mockPaymentIntentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'payment-1',
        status: PaymentIntentStatus.REFUNDED,
      }),
    );
    expect(mockOrderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.REFUNDED,
      }),
    );
    expect(mockFulfilmentEventRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        type: FulfilmentEventType.REFUNDED,
      }),
    );
  });

  it('processPaystackWebhook() should return false when no refund matches the event', async () => {
    mockRefundRepo.findOne.mockResolvedValueOnce(null);

    await expect(
      service.processPaystackWebhook('refund.processed', {
        event: 'refund.processed',
        data: { id: 999 },
      }),
    ).resolves.toBe(false);
  });

  it('processMonnifyWebhook() should finalize processed Monnify refunds', async () => {
    mockRefundRepo.findOne.mockResolvedValueOnce({
      id: 'refund-monnify-1',
      orderId: 'order-1',
      paymentIntentId: 'payment-1',
      transactionReference: 'PAY-RND-001-TEST',
      providerRefundReference: 'MNFY_REF_1',
      amount: 10500,
      currency: 'NGN',
      status: RefundStatus.PROCESSING,
      provider: 'monnify',
    });
    mockOrderRepo.findOne.mockResolvedValueOnce(baseOrder);
    mockPaymentIntentRepo.findOne.mockResolvedValueOnce({
      ...basePaymentIntent,
      provider: 'monnify',
    });
    mockDisputeRepo.findOne.mockResolvedValueOnce({
      id: 'dispute-1',
      orderId: 'order-1',
      status: DisputeStatus.RESOLVED_BUYER,
    });

    const handled = await service.processMonnifyWebhook('SUCCESSFUL_REFUND', {
      eventType: 'SUCCESSFUL_REFUND',
      eventData: {
        refundReference: 'MNFY_REF_1',
        transactionReference: 'PAY-RND-001-TEST',
        refundStatus: 'COMPLETED',
      },
    });

    expect(handled).toBe(true);
    expect(mockPaymentIntentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'payment-1',
        status: PaymentIntentStatus.REFUNDED,
      }),
    );
    expect(mockOrderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.REFUNDED,
      }),
    );
  });

  it('createRefund() should throw when there is no successful payment intent', async () => {
    mockPaymentIntentRepo.findOne.mockResolvedValueOnce(null);

    await expect(
      service.createRefund('admin-1', {
        orderId: 'order-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
