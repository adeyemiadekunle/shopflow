import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LedgerService } from '../ledger/ledger.service';
import { PaystackService } from '../payments/paystack.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { SellerSubscription } from './entities/seller-subscription.entity';
import { SubscriptionTier } from './entities/subscription-tier.entity';
import {
  SellerSubscriptionStatus,
  SubscriptionTierName,
} from './enums/subscription.enum';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  const mockTierRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn().mockImplementation((value: unknown) => Promise.resolve(value)),
    update: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => value),
    count: jest.fn(),
  };

  const mockSubscriptionRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn().mockImplementation((value: unknown) => Promise.resolve(value)),
    update: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => value),
  };

  const mockPlatformConfig = {
    getCurrency: jest.fn().mockReturnValue('NGN'),
  };

  const mockPaystackService = {
    createPlan: jest.fn(),
    initializeTransaction: jest.fn(),
    verifyTransaction: jest.fn(),
    disableSubscription: jest.fn(),
  };

  const mockLedgerService = {
    hasRecordedReference: jest.fn(),
    ensureAccount: jest.fn(),
    record: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(SubscriptionTier),
          useValue: mockTierRepo,
        },
        {
          provide: getRepositoryToken(SellerSubscription),
          useValue: mockSubscriptionRepo,
        },
        { provide: PlatformConfigService, useValue: mockPlatformConfig },
        { provide: PaystackService, useValue: mockPaystackService },
        { provide: LedgerService, useValue: mockLedgerService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('initializeCheckout() should create a pending paid subscription checkout', async () => {
    const tier = {
      id: 'tier-basic',
      name: SubscriptionTierName.BASIC,
      displayName: 'Basic',
      monthlyPrice: 5000,
      currency: 'NGN',
      isActive: true,
      paystackPlanCode: undefined,
    };
    const freeSubscription = {
      id: 'sub-free',
      sellerProfileId: 'seller-profile-1',
      tierId: 'free-tier',
      status: SellerSubscriptionStatus.TRIAL,
      tier: {
        id: 'free-tier',
        name: SubscriptionTierName.FREE,
        monthlyPrice: 0,
        currency: 'NGN',
        features: {},
      },
    };

    mockTierRepo.findOne.mockResolvedValue(tier);
    mockSubscriptionRepo.findOne
      .mockResolvedValueOnce(freeSubscription)
      .mockResolvedValueOnce(null);
    mockUsersService.findById.mockResolvedValue({
      id: 'seller-user-1',
      email: 'seller@example.com',
    });
    mockPaystackService.createPlan.mockResolvedValue({
      plan_code: 'PLAN_basic_123',
    });
    mockTierRepo.save.mockResolvedValue({
      ...tier,
      paystackPlanCode: 'PLAN_basic_123',
    });
    mockPaystackService.initializeTransaction.mockResolvedValue({
      authorization_url: 'https://checkout.paystack.com/sub-basic',
      access_code: 'ACCESS_CODE',
      reference: 'SUB-BASIC-TEST1234',
    });
    mockSubscriptionRepo.save.mockResolvedValue({
      id: 'sub-pending',
      sellerProfileId: 'seller-profile-1',
      tierId: 'tier-basic',
      status: SellerSubscriptionStatus.PENDING,
      checkoutReference: 'SUB-BASIC-TEST1234',
      checkoutAuthorizationUrl: 'https://checkout.paystack.com/sub-basic',
    });
    mockSubscriptionRepo.findOneOrFail.mockResolvedValue({
      id: 'sub-pending',
      sellerProfileId: 'seller-profile-1',
      tierId: 'tier-basic',
      status: SellerSubscriptionStatus.PENDING,
      checkoutReference: 'SUB-BASIC-TEST1234',
      checkoutAuthorizationUrl: 'https://checkout.paystack.com/sub-basic',
      tier: {
        ...tier,
        paystackPlanCode: 'PLAN_basic_123',
      },
    });

    const result = await service.initializeCheckout(
      {
        id: 'seller-user-1',
        email: 'seller@example.com',
        role: UserRole.SELLER,
        isEmailVerified: true,
        isActive: true,
        sellerProfileId: 'seller-profile-1',
      },
      'tier-basic',
      {},
    );

    expect(mockPaystackService.initializeTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'seller@example.com',
        planCode: 'PLAN_basic_123',
        sellerProfileId: 'seller-profile-1',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        requiresPayment: true,
        authorizationUrl: 'https://checkout.paystack.com/sub-basic',
        reference: 'SUB-BASIC-TEST1234',
      }),
    );
  });

  it('verifyCheckout() should activate a successful paid subscription and record ledger entries', async () => {
    const pendingSubscription = {
      id: 'sub-pending',
      sellerProfileId: 'seller-profile-1',
      tierId: 'tier-basic',
      status: SellerSubscriptionStatus.PENDING,
      checkoutReference: 'SUB-BASIC-TEST1234',
      tier: {
        id: 'tier-basic',
        name: SubscriptionTierName.BASIC,
        displayName: 'Basic',
        monthlyPrice: 5000,
        currency: 'NGN',
        paystackPlanCode: 'PLAN_basic_123',
      },
    };

    mockSubscriptionRepo.findOne.mockResolvedValue(pendingSubscription);
    mockPaystackService.verifyTransaction.mockResolvedValue({
      status: 'success',
      reference: 'SUB-BASIC-TEST1234',
      amount: 500000,
      currency: 'NGN',
      paid_at: '2026-03-28T18:00:00.000Z',
      channel: 'card',
      metadata: {},
      customer: {
        customer_code: 'CUS_123',
      },
      plan: {
        plan_code: 'PLAN_basic_123',
      },
      subscription: {
        subscription_code: 'SUB_CODE_123',
        email_token: 'EMAIL_TOKEN_123',
      },
      authorization: {
        authorization_code: 'AUTH_CODE',
        card_type: 'visa',
        last4: '4081',
        bank: 'Test Bank',
      },
    });
    mockSubscriptionRepo.find.mockResolvedValue([pendingSubscription]);
    mockSubscriptionRepo.save.mockImplementation(
      (value: Record<string, unknown>) => Promise.resolve(value),
    );
    mockLedgerService.hasRecordedReference.mockResolvedValue(false);
    mockLedgerService.ensureAccount.mockResolvedValue(undefined);
    mockLedgerService.record.mockResolvedValue(undefined);

    const result = await service.verifyCheckout(
      {
        id: 'seller-user-1',
        email: 'seller@example.com',
        role: UserRole.SELLER,
        isEmailVerified: true,
        isActive: true,
        sellerProfileId: 'seller-profile-1',
      },
      {
        reference: 'SUB-BASIC-TEST1234',
      },
    );

    expect(result.subscription.status).toBe(SellerSubscriptionStatus.ACTIVE);
    expect(result.subscription.paystackSubscriptionCode).toBe('SUB_CODE_123');
    expect(mockLedgerService.record).toHaveBeenCalledTimes(2);
  });
});
