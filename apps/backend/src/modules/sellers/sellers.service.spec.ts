import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SellersService } from './sellers.service';
import { SellerProfile } from './entities/seller-profile.entity';
import { SellerKyc } from './entities/seller-kyc.entity';
import { BankAccount } from './entities/bank-account.entity';
import { PaystackService } from '../payments/paystack.service';
import { SellerStatus } from './enums/seller-status.enum';

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
});
