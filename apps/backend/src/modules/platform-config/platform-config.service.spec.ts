import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PlatformConfigService } from './platform-config.service';
import { PlatformConfig } from './entities/platform-config.entity';
import { User } from '../users/entities/user.entity';
import { SellerProfile } from '../sellers/entities/seller-profile.entity';
import { Order } from '../orders/entities/order.entity';
import { Payout, PayoutStatus } from '../payouts/entities/payout.entity';
import { Refund, RefundStatus } from '../refunds/entities/refund.entity';
import { LedgerAccount } from '../ledger/entities/ledger-account.entity';
import {
  PaymentIntent,
  PaymentIntentStatus,
} from '../payments/entities/payment-intent.entity';
import {
  PaymentReconciliationIssue,
  PaymentReconciliationIssueStatus,
} from '../payments/entities/payment-reconciliation-issue.entity';
import { PaymentProvider } from '../payments/enums/payment-provider.enum';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { SellerStatus } from '../sellers/enums/seller-status.enum';
import { LedgerAccountType } from '../ledger/enums/ledger.enum';

describe('PlatformConfigService', () => {
  let service: PlatformConfigService;

  const mockConfigRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
    delete: jest.fn(),
  };

  const mockUserRepo = {
    count: jest.fn(),
  };

  const mockSellerRepo = {
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockOrderRepo = {
    count: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPayoutRepo = {
    count: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRefundRepo = {
    count: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockLedgerAccountRepo = {
    find: jest.fn(),
  };

  const mockPaymentIntentRepo = {
    count: jest.fn(),
  };

  const mockReconciliationIssueRepo = {
    count: jest.fn(),
  };

  const configValues = new Map<string, unknown>([
    ['market.currency', 'NGN'],
    ['market.countryCode', 'NG'],
    ['market.marketName', 'Nigeria'],
    ['market.platformName', 'Rands'],
  ]);

  beforeEach(async () => {
    jest.clearAllMocks();

    const orderAggregateQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          sellerProfileId: 'seller-1',
          grossSales: '17000',
          orderCount: '2',
        },
      ]),
      getRawOne: jest.fn().mockResolvedValue({ total: '24000' }),
    };

    const payoutAggregateQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '10000' }),
    };

    const refundAggregateQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '5000' }),
    };

    mockOrderRepo.createQueryBuilder.mockReturnValue(orderAggregateQb);
    mockPayoutRepo.createQueryBuilder.mockReturnValue(payoutAggregateQb);
    mockRefundRepo.createQueryBuilder.mockReturnValue(refundAggregateQb);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformConfigService,
        {
          provide: getRepositoryToken(PlatformConfig),
          useValue: mockConfigRepo,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(SellerProfile),
          useValue: mockSellerRepo,
        },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(Payout), useValue: mockPayoutRepo },
        { provide: getRepositoryToken(Refund), useValue: mockRefundRepo },
        {
          provide: getRepositoryToken(LedgerAccount),
          useValue: mockLedgerAccountRepo,
        },
        {
          provide: getRepositoryToken(PaymentIntent),
          useValue: mockPaymentIntentRepo,
        },
        {
          provide: getRepositoryToken(PaymentReconciliationIssue),
          useValue: mockReconciliationIssueRepo,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => configValues.get(key),
          },
        },
      ],
    }).compile();

    service = module.get<PlatformConfigService>(PlatformConfigService);
  });

  it('getAdminAnalytics() should return platform overview, finance balances, and recent activity', async () => {
    mockConfigRepo.findOne
      .mockResolvedValueOnce({ key: 'payments.checkout.default_provider', value: PaymentProvider.PAYSTACK })
      .mockResolvedValueOnce({ key: 'payouts.default_provider', value: PaymentProvider.MONNIFY })
      .mockResolvedValueOnce({ key: 'payments.supported_gateways', value: 'paystack,monnify' })
      .mockResolvedValueOnce({ key: 'platform.return_policy_days', value: '7' })
      .mockResolvedValueOnce({ key: 'platform.min_payout_amount', value: '1000' })
      .mockResolvedValueOnce({ key: 'platform.support_email', value: 'support@rands.ng' });

    mockUserRepo.count
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(15)
      .mockResolvedValueOnce(18);

    mockSellerRepo.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    mockOrderRepo.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    mockOrderRepo.find.mockResolvedValue([
      {
        id: 'order-1',
        orderReference: 'RND-001',
        sellerProfileId: 'seller-1',
        buyerId: 'buyer-1',
        status: OrderStatus.COMPLETED,
        totalAmount: 12000,
        currency: 'NGN',
        createdAt: new Date('2026-03-20T10:00:00Z'),
      },
    ]);

    mockPayoutRepo.count.mockResolvedValueOnce(2);
    mockPayoutRepo.find.mockResolvedValue([
      {
        id: 'payout-1',
        sellerProfileId: 'seller-1',
        reference: 'PAY-001',
        provider: PaymentProvider.MONNIFY,
        status: PayoutStatus.SUCCEEDED,
        amount: 10000,
        currency: 'NGN',
        createdAt: new Date('2026-03-21T10:00:00Z'),
      },
    ]);

    mockRefundRepo.count.mockResolvedValueOnce(3);
    mockRefundRepo.find.mockResolvedValue([
      {
        id: 'refund-1',
        orderId: 'order-1',
        paymentIntentId: 'payment-1',
        provider: PaymentProvider.PAYSTACK,
        status: RefundStatus.PROCESSED,
        amount: 5000,
        currency: 'NGN',
        createdAt: new Date('2026-03-22T10:00:00Z'),
      },
    ]);

    mockPaymentIntentRepo.count.mockResolvedValueOnce(4);
    mockReconciliationIssueRepo.count.mockResolvedValueOnce(2);
    mockSellerRepo.find.mockResolvedValue([
      {
        id: 'seller-1',
        storeName: 'Tola Store',
        storeSlug: 'tola-store',
        status: SellerStatus.APPROVED,
      },
    ]);
    mockLedgerAccountRepo.find.mockResolvedValue([
      { type: LedgerAccountType.SELLER_PENDING, balance: 4000 },
      { type: LedgerAccountType.SELLER_AVAILABLE, balance: 25000 },
      { type: LedgerAccountType.REFUND_RESERVE, balance: 3000 },
      { type: LedgerAccountType.PAYOUT_PAYABLE, balance: 2000 },
      { type: LedgerAccountType.PLATFORM_CASH_CLEARING, balance: 15000 },
      { type: LedgerAccountType.PLATFORM_REVENUE, balance: 6000 },
    ]);

    const analytics = await service.getAdminAnalytics();

    expect(analytics.overview.totalUsers).toBe(20);
    expect(analytics.overview.totalOrders).toBe(10);
    expect(analytics.overview.grossMerchandiseValue).toBe(24000);
    expect(analytics.overview.totalRefunds).toBe(5000);
    expect(analytics.overview.totalPayouts).toBe(10000);
    expect(analytics.finance.sellerPendingLiability).toBe(4000);
    expect(analytics.finance.platformRevenueBalance).toBe(6000);
    expect(analytics.operations.pendingPayoutCount).toBe(2);
    expect(analytics.operations.openReconciliationIssues).toBe(2);
    expect(analytics.config.defaultCheckoutProvider).toBe(
      PaymentProvider.PAYSTACK,
    );
    expect(analytics.config.defaultPayoutProvider).toBe(
      PaymentProvider.MONNIFY,
    );
    expect(analytics.topSellers[0]).toEqual(
      expect.objectContaining({
        sellerProfileId: 'seller-1',
        storeName: 'Tola Store',
        grossSales: 17000,
        orderCount: 2,
      }),
    );
    expect(analytics.recentOrders).toHaveLength(1);
    expect(analytics.recentPayouts).toHaveLength(1);
    expect(analytics.recentRefunds).toHaveLength(1);
  });
});
