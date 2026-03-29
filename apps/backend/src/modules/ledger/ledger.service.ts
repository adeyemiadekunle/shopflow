import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LedgerAccount } from './entities/ledger-account.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { LedgerAccountType, LedgerEventType } from './enums/ledger.enum';
import { PlatformConfigService } from '../platform-config/platform-config.service';

export interface RecordLedgerEntryDto {
  accountType: LedgerAccountType;
  ownerId?: string;
  eventType: LedgerEventType;
  amount: number;
  /** If omitted, falls back to PLATFORM_CURRENCY env var via PlatformConfigService */
  currency?: string;
  orderId?: string;
  paymentId?: string;
  payoutId?: string;
  actorId?: string;
  policyVersion?: string;
  reference?: string;
  notes?: string;
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    @InjectRepository(LedgerAccount)
    private readonly accountRepo: Repository<LedgerAccount>,
    @InjectRepository(LedgerEntry)
    private readonly entryRepo: Repository<LedgerEntry>,
    private readonly dataSource: DataSource,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  async ensureAccount(
    type: LedgerAccountType,
    ownerId?: string,
    /** If omitted, resolved from platform.currency config */
    currency?: string,
  ): Promise<LedgerAccount> {
    let account = await this.accountRepo.findOne({
      where: { type, ownerId: ownerId ?? undefined },
    });
    if (!account) {
      const resolvedCurrency = currency ?? this.platformConfig.getCurrency();
      account = await this.accountRepo.save(
        this.accountRepo.create({ type, ownerId, currency: resolvedCurrency }),
      );
    }
    return account;
  }

  /**
   * Record an immutable ledger entry and update the account balance snapshot.
   * Runs in a single atomic transaction with pessimistic write lock.
   * Currency is resolved from platform config if not provided in the DTO.
   */
  async record(dto: RecordLedgerEntryDto): Promise<LedgerEntry> {
    const resolvedCurrency = dto.currency ?? this.platformConfig.getCurrency();

    return this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(LedgerAccount, {
        where: { type: dto.accountType, ownerId: dto.ownerId ?? undefined },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new Error(
          `Ledger account not found: ${dto.accountType} / ownerId=${dto.ownerId}`,
        );
      }

      const newBalance = Number(account.balance) + dto.amount;
      await manager.update(LedgerAccount, account.id, { balance: newBalance });

      const entry = manager.create(LedgerEntry, {
        accountId: account.id,
        accountType: dto.accountType,
        eventType: dto.eventType,
        amount: dto.amount,
        currency: resolvedCurrency,
        orderId: dto.orderId,
        paymentId: dto.paymentId,
        payoutId: dto.payoutId,
        actorId: dto.actorId,
        policyVersion: dto.policyVersion,
        reference: dto.reference,
        notes: dto.notes,
      });

      const saved = await manager.save(LedgerEntry, entry);
      this.logger.log(
        `Ledger entry recorded: ${dto.eventType} ${dto.amount} ${resolvedCurrency} → account ${account.id}`,
      );
      return saved;
    });
  }

  async getBalanceForOwner(
    type: LedgerAccountType,
    ownerId: string,
  ): Promise<number> {
    const account = await this.accountRepo.findOne({
      where: { type, ownerId },
    });
    return account ? Number(account.balance) : 0;
  }

  async hasRecordedReference(params: {
    reference: string;
    eventType: LedgerEventType;
    accountType?: LedgerAccountType;
  }): Promise<boolean> {
    const count = await this.entryRepo.count({
      where: {
        reference: params.reference,
        eventType: params.eventType,
        ...(params.accountType ? { accountType: params.accountType } : {}),
      },
    });

    return count > 0;
  }
}
