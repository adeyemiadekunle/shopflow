import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { LedgerService } from '../ledger/ledger.service';
import {
  LedgerAccountType,
  LedgerEventType,
} from '../ledger/enums/ledger.enum';
import { PaystackService } from '../payments/paystack.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { BankAccount } from '../sellers/entities/bank-account.entity';
import { SellerProfile } from '../sellers/entities/seller-profile.entity';
import {
  ApprovePayoutDto,
  CreatePayoutRequestDto,
  SendPayoutDto,
} from './dto/admin-payout.dto';
import { Payout, PayoutStatus } from './entities/payout.entity';

type PaystackTransferWebhookPayload = Record<string, unknown>;

@Injectable()
export class PayoutsService {
  constructor(
    @InjectRepository(Payout)
    private readonly payoutRepo: Repository<Payout>,
    @InjectRepository(SellerProfile)
    private readonly sellerRepo: Repository<SellerProfile>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepo: Repository<BankAccount>,
    private readonly ledgerService: LedgerService,
    private readonly platformConfigService: PlatformConfigService,
    private readonly paystackService: PaystackService,
  ) {}

  private generateReference(): string {
    return `PAYOUT-${crypto.randomUUID().slice(0, 8).toUpperCase()}-${Date.now()}`;
  }

  private normalizeLimit(limit: number, fallback: number): number {
    if (!Number.isFinite(limit) || Number.isNaN(limit) || limit <= 0) {
      return fallback;
    }

    return Math.min(Math.floor(limit), 100);
  }

  private getAmountNgn(payout: Payout): number {
    return Number(payout.amount);
  }

  private async getPayoutOrThrow(id: string): Promise<Payout> {
    const payout = await this.payoutRepo.findOne({
      where: { id },
      relations: ['sellerProfile', 'bankAccount'],
    });

    if (!payout) {
      throw new NotFoundException(`Payout ${id} not found`);
    }

    return payout;
  }

  private async getSellerOrThrow(sellerProfileId: string): Promise<SellerProfile> {
    const seller = await this.sellerRepo.findOne({
      where: { id: sellerProfileId },
      relations: ['user'],
    });

    if (!seller) {
      throw new NotFoundException(`Seller ${sellerProfileId} not found`);
    }

    return seller;
  }

  private async getBankAccountForPayout(params: {
    sellerProfileId: string;
    bankAccountId?: string;
  }): Promise<BankAccount> {
    const bankAccount = params.bankAccountId
      ? await this.bankAccountRepo.findOne({
          where: {
            id: params.bankAccountId,
            sellerProfileId: params.sellerProfileId,
          },
        })
      : await this.bankAccountRepo.findOne({
          where: {
            sellerProfileId: params.sellerProfileId,
            isPrimary: true,
          },
          order: { updatedAt: 'DESC' },
        });

    if (!bankAccount) {
      throw new NotFoundException('Verified payout bank account not found');
    }

    if (!bankAccount.isVerified) {
      throw new BadRequestException(
        'Seller payout account must be verified before sending payouts',
      );
    }

    if (!bankAccount.bankCode?.trim()) {
      throw new BadRequestException(
        'Seller payout account is missing a bank code required for transfers',
      );
    }

    return bankAccount;
  }

  private async ensurePayoutAccounts(
    sellerProfileId: string,
    currency: string,
  ): Promise<void> {
    await Promise.all([
      this.ledgerService.ensureAccount(
        LedgerAccountType.SELLER_AVAILABLE,
        sellerProfileId,
        currency,
      ),
      this.ledgerService.ensureAccount(
        LedgerAccountType.PAYOUT_PAYABLE,
        sellerProfileId,
        currency,
      ),
    ]);
  }

  private async reservePayoutFunds(
    payout: Payout,
    adminId: string,
    notes?: string,
  ): Promise<void> {
    const amount = this.getAmountNgn(payout);
    await this.ensurePayoutAccounts(payout.sellerProfileId, payout.currency);

    const availableAlreadyReserved = await this.ledgerService.hasRecordedReference(
      {
        reference: payout.reference,
        eventType: LedgerEventType.PAYOUT_APPROVED,
        accountType: LedgerAccountType.SELLER_AVAILABLE,
      },
    );
    const payableAlreadyReserved = await this.ledgerService.hasRecordedReference(
      {
        reference: payout.reference,
        eventType: LedgerEventType.PAYOUT_APPROVED,
        accountType: LedgerAccountType.PAYOUT_PAYABLE,
      },
    );

    if (!availableAlreadyReserved) {
      await this.ledgerService.record({
        accountType: LedgerAccountType.SELLER_AVAILABLE,
        ownerId: payout.sellerProfileId,
        amount: -amount,
        currency: payout.currency,
        payoutId: payout.id,
        actorId: adminId,
        eventType: LedgerEventType.PAYOUT_APPROVED,
        reference: payout.reference,
        notes:
          notes ??
          `Payout ${payout.reference} approved and reserved from seller available balance`,
      });
    }

    if (!payableAlreadyReserved) {
      await this.ledgerService.record({
        accountType: LedgerAccountType.PAYOUT_PAYABLE,
        ownerId: payout.sellerProfileId,
        amount,
        currency: payout.currency,
        payoutId: payout.id,
        actorId: adminId,
        eventType: LedgerEventType.PAYOUT_APPROVED,
        reference: payout.reference,
        notes:
          notes ??
          `Payout ${payout.reference} moved into payout payable pending transfer`,
      });
    }
  }

  private async settlePayoutSuccess(
    payout: Payout,
    actorId: string,
    notes?: string,
  ): Promise<void> {
    const payableAlreadySettled = await this.ledgerService.hasRecordedReference({
      reference: payout.reference,
      eventType: LedgerEventType.PAYOUT_SENT,
      accountType: LedgerAccountType.PAYOUT_PAYABLE,
    });

    if (payableAlreadySettled) {
      return;
    }

    await this.ledgerService.record({
      accountType: LedgerAccountType.PAYOUT_PAYABLE,
      ownerId: payout.sellerProfileId,
      amount: -this.getAmountNgn(payout),
      currency: payout.currency,
      payoutId: payout.id,
      actorId,
      eventType: LedgerEventType.PAYOUT_SENT,
      reference: payout.reference,
      notes:
        notes ??
        `Payout ${payout.reference} completed successfully through Paystack transfer`,
    });
  }

  private async reverseReservedPayout(
    payout: Payout,
    actorId: string,
    notes?: string,
  ): Promise<void> {
    await this.ensurePayoutAccounts(payout.sellerProfileId, payout.currency);

    const payableAlreadyReversed = await this.ledgerService.hasRecordedReference({
      reference: payout.reference,
      eventType: LedgerEventType.PAYOUT_REVERSED,
      accountType: LedgerAccountType.PAYOUT_PAYABLE,
    });
    const availableAlreadyRestored =
      await this.ledgerService.hasRecordedReference({
        reference: payout.reference,
        eventType: LedgerEventType.PAYOUT_REVERSED,
        accountType: LedgerAccountType.SELLER_AVAILABLE,
      });

    if (!payableAlreadyReversed) {
      await this.ledgerService.record({
        accountType: LedgerAccountType.PAYOUT_PAYABLE,
        ownerId: payout.sellerProfileId,
        amount: -this.getAmountNgn(payout),
        currency: payout.currency,
        payoutId: payout.id,
        actorId,
        eventType: LedgerEventType.PAYOUT_REVERSED,
        reference: payout.reference,
        notes:
          notes ??
          `Payout ${payout.reference} failed or reversed and was removed from payout payable`,
      });
    }

    if (!availableAlreadyRestored) {
      await this.ledgerService.record({
        accountType: LedgerAccountType.SELLER_AVAILABLE,
        ownerId: payout.sellerProfileId,
        amount: this.getAmountNgn(payout),
        currency: payout.currency,
        payoutId: payout.id,
        actorId,
        eventType: LedgerEventType.PAYOUT_REVERSED,
        reference: payout.reference,
        notes:
          notes ??
          `Payout ${payout.reference} failed or reversed and seller funds were restored`,
      });
    }
  }

  private getString(
    source: Record<string, unknown> | undefined,
    key: string,
  ): string | undefined {
    const value = source?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  async getSellerSummaryForAdmin(sellerProfileId: string) {
    const seller = await this.getSellerOrThrow(sellerProfileId);
    const [availableBalance, pendingBalance, minPayoutAmount, bankAccount, recentPayouts] =
      await Promise.all([
        this.ledgerService.getBalanceForOwner(
          LedgerAccountType.SELLER_AVAILABLE,
          sellerProfileId,
        ),
        this.ledgerService.getBalanceForOwner(
          LedgerAccountType.SELLER_PENDING,
          sellerProfileId,
        ),
        this.platformConfigService.getMinPayoutAmount(),
        this.bankAccountRepo.findOne({
          where: { sellerProfileId, isPrimary: true },
          order: { updatedAt: 'DESC' },
        }),
        this.payoutRepo.find({
          where: { sellerProfileId },
          order: { createdAt: 'DESC' },
          take: 10,
        }),
      ]);

    return {
      seller,
      balances: {
        sellerAvailable: availableBalance,
        sellerPending: pendingBalance,
      },
      minPayoutAmount,
      primaryBankAccount: bankAccount,
      recentPayouts,
    };
  }

  async listAdminPayouts(limit: number, status?: PayoutStatus) {
    return this.payoutRepo.find({
      where: status ? { status } : {},
      relations: ['sellerProfile', 'bankAccount'],
      order: { createdAt: 'DESC' },
      take: this.normalizeLimit(limit, 50),
    });
  }

  async createPayoutRequest(adminId: string, dto: CreatePayoutRequestDto) {
    const seller = await this.getSellerOrThrow(dto.sellerProfileId);
    const bankAccount = await this.getBankAccountForPayout({
      sellerProfileId: dto.sellerProfileId,
      bankAccountId: dto.bankAccountId,
    });
    const amount = Number(dto.amount.toFixed(2));
    const availableBalance = await this.ledgerService.getBalanceForOwner(
      LedgerAccountType.SELLER_AVAILABLE,
      seller.id,
    );
    const minPayoutAmount = await this.platformConfigService.getMinPayoutAmount();
    const currency = this.platformConfigService.getCurrency();

    if (amount < minPayoutAmount) {
      throw new BadRequestException(
        `Payout amount must be at least ${minPayoutAmount} ${currency}`,
      );
    }

    if (amount > availableBalance) {
      throw new BadRequestException(
        'Seller does not have enough available balance for this payout request',
      );
    }

    return this.payoutRepo.save(
      this.payoutRepo.create({
        sellerProfileId: seller.id,
        bankAccountId: bankAccount.id,
        reference: this.generateReference(),
        amount,
        currency,
        reason: dto.reason?.trim(),
        requestedById: adminId,
        status: PayoutStatus.REQUESTED,
      }),
    );
  }

  async approvePayout(id: string, adminId: string, dto: ApprovePayoutDto) {
    const payout = await this.getPayoutOrThrow(id);

    if (payout.status !== PayoutStatus.REQUESTED) {
      throw new BadRequestException('Only requested payouts can be approved');
    }

    const availableBalance = await this.ledgerService.getBalanceForOwner(
      LedgerAccountType.SELLER_AVAILABLE,
      payout.sellerProfileId,
    );

    if (this.getAmountNgn(payout) > availableBalance) {
      throw new BadRequestException(
        'Seller available balance is no longer enough to approve this payout',
      );
    }

    await this.reservePayoutFunds(payout, adminId, dto.notes?.trim());

    return this.payoutRepo.save({
      ...payout,
      status: PayoutStatus.APPROVED,
      approvedById: adminId,
      approvedAt: new Date(),
    });
  }

  async sendPayout(id: string, adminId: string, dto: SendPayoutDto) {
    const payout = await this.getPayoutOrThrow(id);

    if (
      payout.status !== PayoutStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Only approved payouts can be sent',
      );
    }

    const bankAccount = await this.getBankAccountForPayout({
      sellerProfileId: payout.sellerProfileId,
      bankAccountId: payout.bankAccountId,
    });

    let recipientCode = bankAccount.paystackRecipientCode;
    if (!recipientCode) {
      const recipient = await this.paystackService.createTransferRecipient({
        name: bankAccount.accountName,
        accountNumber: bankAccount.accountNumber,
        bankCode: bankAccount.bankCode!,
        currency: payout.currency,
      });
      recipientCode = recipient.recipient_code;
      await this.bankAccountRepo.save({
        ...bankAccount,
        paystackRecipientCode: recipientCode,
      });
    }

    const transfer = await this.paystackService.initiateTransfer({
      amountKobo: Math.round(this.getAmountNgn(payout) * 100),
      recipientCode,
      reference: payout.reference,
      reason: dto.reason?.trim() ?? payout.reason,
    });

    if (transfer.status === 'success') {
      await this.settlePayoutSuccess(payout, adminId);
    }

    if (transfer.status === 'failed' || transfer.status === 'reversed') {
      await this.reverseReservedPayout(
        payout,
        adminId,
        transfer.status === 'reversed'
          ? 'Paystack transfer reversed immediately during payout send'
          : 'Paystack transfer failed immediately during payout send',
      );
    }

    return this.payoutRepo.save({
      ...payout,
      status:
        transfer.status === 'success'
          ? PayoutStatus.SUCCEEDED
          : transfer.status === 'failed'
            ? PayoutStatus.FAILED
            : transfer.status === 'reversed'
              ? PayoutStatus.REVERSED
              : PayoutStatus.PROCESSING,
      paystackRecipientCode: recipientCode,
      paystackTransferCode: transfer.transfer_code,
      paystackTransferId:
        transfer.id !== undefined ? String(transfer.id) : payout.paystackTransferId,
      rawTransferPayload: transfer as unknown as Record<string, unknown>,
      processedAt:
        transfer.status === 'success' ? new Date() : payout.processedAt,
      failureReason: undefined,
    });
  }

  async processPaystackWebhook(
    eventType: string,
    payload: PaystackTransferWebhookPayload,
  ): Promise<boolean> {
    if (
      eventType !== 'transfer.success' &&
      eventType !== 'transfer.failed' &&
      eventType !== 'transfer.reversed'
    ) {
      return false;
    }

    const data =
      typeof payload['data'] === 'object' && payload['data'] !== null
        ? (payload['data'] as Record<string, unknown>)
        : undefined;
    const reference = this.getString(data, 'reference');

    if (!reference) {
      return false;
    }

    const payout = await this.payoutRepo.findOne({
      where: { reference },
      relations: ['bankAccount'],
    });

    if (!payout) {
      return false;
    }

    if (eventType === 'transfer.success') {
      if (payout.status !== PayoutStatus.SUCCEEDED) {
        await this.settlePayoutSuccess(payout, 'system');
        await this.payoutRepo.save({
          ...payout,
          status: PayoutStatus.SUCCEEDED,
          processedAt: new Date(),
          rawTransferPayload: payload,
          paystackTransferCode:
            this.getString(data, 'transfer_code') ?? payout.paystackTransferCode,
          paystackTransferId:
            this.getString(data, 'id') ?? payout.paystackTransferId,
          failureReason: undefined,
        });
      }

      return true;
    }

    if (payout.status === PayoutStatus.SUCCEEDED) {
      return true;
    }

    if (
      payout.status === PayoutStatus.FAILED ||
      payout.status === PayoutStatus.REVERSED
    ) {
      return true;
    }

    await this.reverseReservedPayout(
      payout,
      'system',
      eventType === 'transfer.reversed'
        ? 'Paystack transfer reversed; seller funds restored'
        : 'Paystack transfer failed; seller funds restored',
    );

    await this.payoutRepo.save({
      ...payout,
      status:
        eventType === 'transfer.reversed'
          ? PayoutStatus.REVERSED
          : PayoutStatus.FAILED,
      rawTransferPayload: payload,
      failureReason:
        this.getString(data, 'reason') ??
        this.getString(data, 'failure_reason') ??
        payout.failureReason,
      failedAt:
        eventType === 'transfer.failed' ? new Date() : payout.failedAt,
      reversedAt:
        eventType === 'transfer.reversed' ? new Date() : payout.reversedAt,
    });

    return true;
  }
}
