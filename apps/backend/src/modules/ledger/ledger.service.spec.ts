import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LedgerService } from './ledger.service';
import { LedgerAccount } from './entities/ledger-account.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { LedgerAccountType, LedgerEventType } from './enums/ledger.enum';
import { PlatformConfigService } from '../platform-config/platform-config.service';

const mockAccount: LedgerAccount = {
  id: 'acc-1',
  type: LedgerAccountType.SELLER_PENDING,
  ownerId: 'seller-1',
  currency: 'NGN',
  balance: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAccountRepo = {
  findOne: jest.fn().mockResolvedValue(mockAccount),
  save: jest
    .fn()
    .mockImplementation((v) => Promise.resolve({ id: 'acc-1', ...v })),
  create: jest.fn().mockImplementation((v) => ({ id: 'acc-1', ...v })),
};

const mockEntryRepo = {
  save: jest.fn(),
  create: jest.fn(),
};

const mockManager = {
  findOne: jest.fn().mockResolvedValue({ ...mockAccount }),
  update: jest.fn().mockResolvedValue(undefined),
  create: jest.fn().mockImplementation((_entity, v) => v),
  save: jest
    .fn()
    .mockImplementation((_entity, v) =>
      Promise.resolve({ id: 'entry-1', ...v }),
    ),
};

const mockDataSource = {
  transaction: jest.fn().mockImplementation((fn) => fn(mockManager)),
};

describe('LedgerService', () => {
  let service: LedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerService,
        {
          provide: getRepositoryToken(LedgerAccount),
          useValue: mockAccountRepo,
        },
        { provide: getRepositoryToken(LedgerEntry), useValue: mockEntryRepo },
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: PlatformConfigService,
          useValue: { getCurrency: jest.fn().mockResolvedValue('NGN') },
        },
      ],
    }).compile();

    service = module.get<LedgerService>(LedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('record() should call transaction and return a ledger entry', async () => {
    const result = await service.record({
      accountType: LedgerAccountType.SELLER_PENDING,
      ownerId: 'seller-1',
      eventType: LedgerEventType.SELLER_PENDING_ALLOCATED,
      amount: 5000,
      orderId: 'order-1',
    });

    expect(mockDataSource.transaction).toHaveBeenCalled();
    expect(mockManager.findOne).toHaveBeenCalled();
    expect(mockManager.update).toHaveBeenCalled();
    expect(result.id).toBe('entry-1');
  });

  it('record() should throw if account not found', async () => {
    mockManager.findOne.mockResolvedValueOnce(null);
    await expect(
      service.record({
        accountType: LedgerAccountType.SELLER_PENDING,
        ownerId: 'nonexistent',
        eventType: LedgerEventType.PAYMENT_COLLECTED,
        amount: 100,
      }),
    ).rejects.toThrow('Ledger account not found');
  });
});
