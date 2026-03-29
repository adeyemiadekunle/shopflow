import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SellersService } from './sellers.service';
import { SellerProfile } from './entities/seller-profile.entity';
import { SellerKyc } from './entities/seller-kyc.entity';
import { BankAccount } from './entities/bank-account.entity';
import { PaystackService } from '../payments/paystack.service';
import { SellerStatus } from './enums/seller-status.enum';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { Payout, PayoutStatus } from '../payouts/entities/payout.entity';
import { Refund, RefundStatus } from '../refunds/entities/refund.entity';
import { LedgerAccount } from '../ledger/entities/ledger-account.entity';
import { LedgerAccountType } from '../ledger/enums/ledger.enum';

describe('SellersService', () => {
  let service: SellersService;

  const mockSellerRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
  };

  const mockSellerKycRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockBankAccountRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockOrderRepo = {
    find: jest.fn(),
  };

  const mockPayoutRepo = {
    find: jest.fn(),
  };

  const mockRefundRepo = {
    find: jest.fn(),
  };

  const mockLedgerAccountRepo = {
    find: jest.fn(),
  };

  const mockPaystackService = {
    resolveAccountNumber: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellersService,
        {
          provide: getRepositoryToken(SellerProfile),
          useValue: mockSellerRepo,
        },
        {
          provide: getRepositoryToken(SellerKyc),
          useValue: mockSellerKycRepo,
        },
        {
          provide: getRepositoryToken(BankAccount),
          useValue: mockBankAccountRepo,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(Payout),
          useValue: mockPayoutRepo,
        },
        {
          provide: getRepositoryToken(Refund),
          useValue: mockRefundRepo,
        },
        {
          provide: getRepositoryToken(LedgerAccount),
          useValue: mockLedgerAccountRepo,
        },
        { provide: PaystackService, useValue: mockPaystackService },
      ],
    }).compile();

    service = module.get<SellersService>(SellersService);
  });

  it('createForUser() should create a unique slug when the base slug already exists', async () => {
    mockSellerRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'existing-seller', storeSlug: 'tola-store' })
      .mockResolvedValueOnce(null);
    mockSellerRepo.save.mockImplementation(
      (value: Record<string, unknown>) => value,
    );

    const result = await service.createForUser({
      userId: 'user-1',
      email: 'seller@example.com',
      storeName: 'Tola Store',
    });

    expect(mockSellerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        storeName: 'Tola Store',
        storeSlug: 'tola-store-1',
      }),
    );
    expect(result.storeSlug).toBe('tola-store-1');
  });

  it('upsertPrimaryBankAccount() should verify the account when Paystack resolves a matching account name', async () => {
    mockSellerRepo.findOne.mockResolvedValue({
      id: 'seller-1',
      userId: 'user-1',
      supportPhone: '08012345678',
      status: SellerStatus.PENDING,
      kycVerified: false,
    });
    mockBankAccountRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'bank-1',
        sellerProfileId: 'seller-1',
        accountName: 'Tola Store',
        accountNumber: '0123456789',
        bankCode: '058',
        isVerified: true,
        verifiedAt: new Date(),
      });
    mockSellerKycRepo.findOne.mockResolvedValue({
      id: 'kyc-1',
      sellerProfileId: 'seller-1',
      businessName: 'Tola Store',
      addressLine1: '12 Allen Avenue',
      state: 'Lagos',
      lga: 'Ikeja',
      country: 'NG',
    });
    mockPaystackService.resolveAccountNumber.mockResolvedValue({
      account_name: 'Tola Store',
      account_number: '0123456789',
    });
    mockBankAccountRepo.save.mockImplementation(
      (value: Record<string, unknown>) => value,
    );
    mockSellerRepo.save.mockImplementation(
      (value: Record<string, unknown>) => value,
    );

    const result = await service.upsertPrimaryBankAccount('user-1', {
      bankCode: '058',
      bankName: 'GTBank',
      accountNumber: '0123456789',
      accountName: 'Tola Store',
    });

    expect(result.isVerified).toBe(true);
    expect(result.resolvedAccountName).toBe('Tola Store');
    expect(mockSellerRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'seller-1',
        kycVerified: true,
        status: SellerStatus.APPROVED,
      }),
    );
  });

  it('updateOwnProfile() should reject a store slug already used by another seller', async () => {
    mockSellerRepo.findOne
      .mockResolvedValueOnce({
        id: 'seller-1',
        userId: 'user-1',
        storeName: 'Tola Store',
        storeSlug: 'tola-store',
      })
      .mockResolvedValueOnce({
        id: 'seller-2',
        userId: 'user-2',
        storeSlug: 'taken-slug',
      });

    await expect(
      service.updateOwnProfile('user-1', {
        storeSlug: 'taken-slug',
      }),
    ).rejects.toThrow('Store slug is already in use');
  });

  it('getAnalytics() should return seller dashboard totals from orders, payouts, refunds, and ledger balances', async () => {
    mockSellerRepo.findOne.mockResolvedValue({
      id: 'seller-1',
      userId: 'user-1',
      storeName: 'Tola Store',
      storeSlug: 'tola-store',
    });
    mockOrderRepo.find.mockResolvedValue([
      {
        id: 'order-1',
        orderReference: 'RND-001',
        sellerProfileId: 'seller-1',
        status: OrderStatus.COMPLETED,
        totalAmount: 12000,
        currency: 'NGN',
        createdAt: new Date('2026-03-01T10:00:00Z'),
        paidAt: new Date('2026-03-01T10:05:00Z'),
        deliveredAt: new Date('2026-03-03T12:00:00Z'),
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            lineTotal: 8000,
            productSnapshot: { title: 'Ankara Gown' },
          },
        ],
      },
      {
        id: 'order-2',
        orderReference: 'RND-002',
        sellerProfileId: 'seller-1',
        status: OrderStatus.REFUNDED,
        totalAmount: 5000,
        currency: 'NGN',
        createdAt: new Date('2026-03-02T10:00:00Z'),
        items: [
          {
            productId: 'product-2',
            quantity: 1,
            lineTotal: 5000,
            productSnapshot: { title: 'Native Cap' },
          },
        ],
      },
      {
        id: 'order-3',
        orderReference: 'RND-003',
        sellerProfileId: 'seller-1',
        status: OrderStatus.DISPUTE_OPEN,
        totalAmount: 7000,
        currency: 'NGN',
        createdAt: new Date('2026-03-04T10:00:00Z'),
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            lineTotal: 7000,
            productSnapshot: { title: 'Ankara Gown' },
          },
        ],
      },
      {
        id: 'order-4',
        orderReference: 'RND-004',
        sellerProfileId: 'seller-1',
        status: OrderStatus.CANCELLED,
        totalAmount: 3000,
        currency: 'NGN',
        createdAt: new Date('2026-03-05T10:00:00Z'),
        items: [],
      },
    ]);
    mockPayoutRepo.find.mockResolvedValue([
      {
        id: 'payout-1',
        reference: 'PAY-001',
        status: PayoutStatus.SUCCEEDED,
        amount: 10000,
        currency: 'NGN',
        createdAt: new Date('2026-03-06T10:00:00Z'),
        processedAt: new Date('2026-03-06T11:00:00Z'),
      },
    ]);
    mockRefundRepo.find.mockResolvedValue([
      {
        id: 'refund-1',
        orderId: 'order-2',
        status: RefundStatus.PROCESSED,
        amount: 5000,
        currency: 'NGN',
        createdAt: new Date('2026-03-07T10:00:00Z'),
        processedAt: new Date('2026-03-07T11:00:00Z'),
        order: { sellerProfileId: 'seller-1' },
      },
      {
        id: 'refund-2',
        orderId: 'order-x',
        status: RefundStatus.PROCESSED,
        amount: 2500,
        currency: 'NGN',
        createdAt: new Date('2026-03-08T10:00:00Z'),
        order: { sellerProfileId: 'seller-2' },
      },
    ]);
    mockLedgerAccountRepo.find.mockResolvedValue([
      {
        type: LedgerAccountType.SELLER_PENDING,
        balance: 2000,
      },
      {
        type: LedgerAccountType.SELLER_AVAILABLE,
        balance: 15000,
      },
    ]);

    const analytics = await service.getAnalytics('user-1');

    expect(analytics.overview.totalOrders).toBe(4);
    expect(analytics.overview.paidOrders).toBe(2);
    expect(analytics.overview.completedOrders).toBe(1);
    expect(analytics.overview.cancelledOrders).toBe(1);
    expect(analytics.overview.openDisputes).toBe(1);
    expect(analytics.overview.refundedOrders).toBe(1);
    expect(analytics.overview.grossSales).toBe(24000);
    expect(analytics.overview.totalRefunds).toBe(5000);
    expect(analytics.overview.totalPayouts).toBe(10000);
    expect(analytics.overview.pendingFunds).toBe(2000);
    expect(analytics.overview.availableFunds).toBe(15000);
    expect(analytics.topProducts[0]).toEqual(
      expect.objectContaining({
        productId: 'product-1',
        title: 'Ankara Gown',
        quantitySold: 3,
        revenue: 15000,
      }),
    );
    expect(analytics.recentOrders).toHaveLength(4);
    expect(analytics.recentPayouts).toHaveLength(1);
    expect(analytics.recentRefunds).toHaveLength(1);
  });
});
