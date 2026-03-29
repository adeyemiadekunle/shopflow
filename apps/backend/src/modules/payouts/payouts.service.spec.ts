import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LedgerService } from '../ledger/ledger.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { PaystackService } from '../payments/paystack.service';
import { BankAccount } from '../sellers/entities/bank-account.entity';
import { SellerProfile } from '../sellers/entities/seller-profile.entity';
import { PayoutsService } from './payouts.service';
import { Payout, PayoutStatus } from './entities/payout.entity';

describe('PayoutsService', () => {
  let service: PayoutsService;

  const mockPayoutRepo = {
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

  const mockSellerRepo = {
    findOne: jest.fn(),
  };

  const mockBankAccountRepo = {
    findOne: jest.fn(),
    save: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) =>
        Promise.resolve(value),
      ),
  };

  const mockLedgerService = {
    ensureAccount: jest.fn().mockResolvedValue(undefined),
    getBalanceForOwner: jest.fn(),
    hasRecordedReference: jest.fn().mockResolvedValue(false),
    record: jest.fn().mockResolvedValue(undefined),
  };

  const mockPlatformConfigService = {
    getMinPayoutAmount: jest.fn().mockResolvedValue(1000),
    getCurrency: jest.fn().mockReturnValue('NGN'),
  };

  const mockPaystackService = {
    createTransferRecipient: jest.fn(),
    initiateTransfer: jest.fn(),
  };

  const seller: SellerProfile = {
    id: 'seller-1',
    userId: 'user-1',
    user: { email: 'seller@example.com' } as never,
    storeName: 'Store',
    storeSlug: 'store',
    status: 'approved' as never,
    kycVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const bankAccount: BankAccount = {
    id: 'bank-1',
    sellerProfileId: 'seller-1',
    sellerProfile: seller,
    bankCode: '058',
    bankName: 'GTBank',
    accountNumber: '0123456789',
    accountName: 'Store Owner',
    isPrimary: true,
    isVerified: true,
    resolvedAccountName: 'Store Owner',
    verifiedAt: new Date(),
    paystackRecipientCode: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockLedgerService.hasRecordedReference.mockResolvedValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutsService,
        { provide: getRepositoryToken(Payout), useValue: mockPayoutRepo },
        {
          provide: getRepositoryToken(SellerProfile),
          useValue: mockSellerRepo,
        },
        {
          provide: getRepositoryToken(BankAccount),
          useValue: mockBankAccountRepo,
        },
        { provide: LedgerService, useValue: mockLedgerService },
        {
          provide: PlatformConfigService,
          useValue: mockPlatformConfigService,
        },
        { provide: PaystackService, useValue: mockPaystackService },
      ],
    }).compile();

    service = module.get<PayoutsService>(PayoutsService);
  });

  it('createPayoutRequest() should create a requested payout for a verified seller bank account', async () => {
    mockSellerRepo.findOne.mockResolvedValue(seller);
    mockBankAccountRepo.findOne.mockResolvedValue(bankAccount);
    mockLedgerService.getBalanceForOwner.mockResolvedValue(15000);

    const payout = await service.createPayoutRequest('admin-1', {
      sellerProfileId: 'seller-1',
      amount: 12000,
      reason: 'Weekly payout batch',
    });

    expect(mockPayoutRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sellerProfileId: 'seller-1',
        bankAccountId: 'bank-1',
        amount: 12000,
        status: PayoutStatus.REQUESTED,
      }),
    );
    expect(payout.status).toBe(PayoutStatus.REQUESTED);
  });

  it('createPayoutRequest() should reject amounts above seller available balance', async () => {
    mockSellerRepo.findOne.mockResolvedValue(seller);
    mockBankAccountRepo.findOne.mockResolvedValue(bankAccount);
    mockLedgerService.getBalanceForOwner.mockResolvedValue(5000);

    await expect(
      service.createPayoutRequest('admin-1', {
        sellerProfileId: 'seller-1',
        amount: 6000,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('approvePayout() should reserve seller funds into payout payable', async () => {
    mockPayoutRepo.findOne.mockResolvedValue({
      id: 'payout-1',
      sellerProfileId: 'seller-1',
      bankAccountId: 'bank-1',
      reference: 'PAYOUT-REF-1',
      amount: 12000,
      currency: 'NGN',
      status: PayoutStatus.REQUESTED,
      sellerProfile: seller,
      bankAccount,
    } satisfies Partial<Payout>);
    mockLedgerService.getBalanceForOwner.mockResolvedValue(15000);

    const payout = await service.approvePayout('payout-1', 'admin-1', {
      notes: 'Approved for transfer',
    });

    expect(mockLedgerService.record).toHaveBeenCalledTimes(2);
    expect(payout.status).toBe(PayoutStatus.APPROVED);
  });

  it('sendPayout() should create a Paystack recipient when missing and move to processing', async () => {
    mockPayoutRepo.findOne.mockResolvedValue({
      id: 'payout-1',
      sellerProfileId: 'seller-1',
      bankAccountId: 'bank-1',
      reference: 'PAYOUT-REF-1',
      amount: 12000,
      currency: 'NGN',
      status: PayoutStatus.APPROVED,
      sellerProfile: seller,
      bankAccount,
    } satisfies Partial<Payout>);
    mockBankAccountRepo.findOne.mockResolvedValue(bankAccount);
    mockPaystackService.createTransferRecipient.mockResolvedValue({
      recipient_code: 'RCP_12345',
      type: 'nuban',
      name: 'Store Owner',
    });
    mockPaystackService.initiateTransfer.mockResolvedValue({
      id: 12345,
      transfer_code: 'TRF_12345',
      reference: 'PAYOUT-REF-1',
      status: 'pending',
      amount: 1200000,
      currency: 'NGN',
    });

    const payout = await service.sendPayout('payout-1', 'admin-1', {
      reason: 'Friday payout run',
    });

    expect(mockPaystackService.createTransferRecipient).toHaveBeenCalled();
    expect(mockPaystackService.initiateTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientCode: 'RCP_12345',
        reference: 'PAYOUT-REF-1',
      }),
    );
    expect(payout.status).toBe(PayoutStatus.PROCESSING);
  });

  it('processPaystackWebhook() should settle a successful payout only once', async () => {
    mockPayoutRepo.findOne.mockResolvedValue({
      id: 'payout-1',
      sellerProfileId: 'seller-1',
      bankAccountId: 'bank-1',
      reference: 'PAYOUT-REF-1',
      amount: 12000,
      currency: 'NGN',
      status: PayoutStatus.PROCESSING,
      bankAccount,
    } satisfies Partial<Payout>);

    const handled = await service.processPaystackWebhook('transfer.success', {
      data: {
        reference: 'PAYOUT-REF-1',
        transfer_code: 'TRF_12345',
        id: '12345',
      },
    });

    expect(handled).toBe(true);
    expect(mockLedgerService.record).toHaveBeenCalledTimes(1);
    expect(mockPayoutRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: PayoutStatus.SUCCEEDED,
      }),
    );
  });

  it('getSellerSummaryForAdmin() should throw for unknown sellers', async () => {
    mockSellerRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getSellerSummaryForAdmin('missing-seller'),
    ).rejects.toThrow(NotFoundException);
  });
});
