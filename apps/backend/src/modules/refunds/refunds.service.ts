import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { PaymentProvider } from '../payments/enums/payment-provider.enum';
import { MonnifyService } from '../payments/monnify.service';
import { PaystackService } from '../payments/paystack.service';
import { CreateRefundDto, RetryRefundWithBuyerDetailsDto } from './dto/admin-refund.dto';
import { Refund, RefundStatus } from './entities/refund.entity';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Refund)
    private readonly refundRepo: Repository<Refund>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(PaymentIntent)
    private readonly paymentIntentRepo: Repository<PaymentIntent>,
    @InjectRepository(FulfilmentEvent)
    private readonly fulfilmentEventRepo: Repository<FulfilmentEvent>,
    @InjectRepository(DisputeCase)
    private readonly disputeRepo: Repository<DisputeCase>,
    private readonly ledgerService: LedgerService,
    @Inject(forwardRef(() => PaystackService))
    private readonly paystackService: PaystackService,
    private readonly monnifyService: MonnifyService,
  ) {}

  private normalizeLimit(limit: number, fallback: number): number {
    if (!Number.isFinite(limit) || Number.isNaN(limit) || limit <= 0) {
      return fallback;
    }

    return Math.min(Math.floor(limit), 100);
  }

  private getString(
    source: Record<string, unknown> | undefined,
    key: string,
  ): string | undefined {
    const value = source?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private getNumber(
    source: Record<string, unknown> | undefined,
    key: string,
  ): number | undefined {
    const value = source?.[key];
    return typeof value === 'number' ? value : undefined;
  }

  private getAmountNgn(refund: Refund): number {
    return Number(refund.amount);
  }

  private mapPaystackRefundStatus(status: string): RefundStatus {
    switch (status) {
      case 'processing':
        return RefundStatus.PROCESSING;
      case 'needs-attention':
        return RefundStatus.NEEDS_ATTENTION;
      case 'processed':
        return RefundStatus.PROCESSED;
      case 'failed':
        return RefundStatus.FAILED;
      default:
        return RefundStatus.PENDING;
    }
  }

  private mapMonnifyRefundStatus(status: string): RefundStatus {
    switch ((status ?? '').toUpperCase()) {
      case 'COMPLETED':
        return RefundStatus.PROCESSED;
      case 'FAILED':
        return RefundStatus.FAILED;
      case 'PROCESSING':
        return RefundStatus.PROCESSING;
      default:
        return RefundStatus.PENDING;
    }
  }

  private generateMonnifyRefundReference(orderReference: string): string {
    return `MNF-REF-${orderReference}-${Date.now()}`;
  }

  private async getOrderOrThrow(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  private async getSucceededPaymentIntentOrThrow(
    orderId: string,
  ): Promise<PaymentIntent> {
    const paymentIntent = await this.paymentIntentRepo.findOne({
      where: { orderId, status: PaymentIntentStatus.SUCCEEDED },
      order: { updatedAt: 'DESC' },
    });

    if (!paymentIntent) {
      throw new NotFoundException(
        `No successful payment intent found for order ${orderId}`,
      );
    }

    return paymentIntent;
  }

  private async getRefundOrThrow(id: string): Promise<Refund> {
    const refund = await this.refundRepo.findOne({
      where: { id },
      relations: ['order', 'paymentIntent'],
    });
    if (!refund) {
      throw new NotFoundException(`Refund ${id} not found`);
    }
    return refund;
  }

  private async findOpenRefundForOrder(orderId: string): Promise<Refund | null> {
    return this.refundRepo.findOne({
      where: [
        { orderId, status: RefundStatus.PENDING },
        { orderId, status: RefundStatus.PROCESSING },
        { orderId, status: RefundStatus.NEEDS_ATTENTION },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  private async ensureRefundReserveAccounts(order: Order): Promise<void> {
    await Promise.all([
      this.ledgerService.ensureAccount(
        LedgerAccountType.REFUND_RESERVE,
        undefined,
        order.currency,
      ),
      this.ledgerService.ensureAccount(
        LedgerAccountType.SELLER_PENDING,
        order.sellerProfileId,
        order.currency,
      ),
      this.ledgerService.ensureAccount(
        LedgerAccountType.PLATFORM_CASH_CLEARING,
        undefined,
        order.currency,
      ),
    ]);
  }

  private async reserveRefundAmount(
    order: Order,
    paymentIntent: PaymentIntent,
    actorId: string,
    amount: number,
    notes: string,
  ): Promise<void> {
    const reference = `refund-reserve:${order.id}:${amount.toFixed(2)}`;
    const reserveAlreadyExists = await this.ledgerService.hasRecordedReference({
      reference,
      eventType: LedgerEventType.REFUND_INITIATED,
      accountType: LedgerAccountType.REFUND_RESERVE,
    });

    if (reserveAlreadyExists) {
      return;
    }

    await this.ensureRefundReserveAccounts(order);

    await this.ledgerService.record({
      accountType: LedgerAccountType.SELLER_PENDING,
      ownerId: order.sellerProfileId,
      amount: -amount,
      currency: order.currency,
      orderId: order.id,
      paymentId: paymentIntent.id,
      actorId,
      eventType: LedgerEventType.REFUND_INITIATED,
      reference,
      notes,
    });

    await this.ledgerService.record({
      accountType: LedgerAccountType.REFUND_RESERVE,
      amount,
      currency: order.currency,
      orderId: order.id,
      paymentId: paymentIntent.id,
      actorId,
      eventType: LedgerEventType.REFUND_INITIATED,
      reference,
      notes,
    });
  }

  private async completeRefundLedger(
    refund: Refund,
    actorId: string,
    notes: string,
  ): Promise<void> {
    const reference = `refund-completed:${refund.id}`;
    const reserveAlreadyCleared = await this.ledgerService.hasRecordedReference({
      reference,
      eventType: LedgerEventType.REFUND_COMPLETED,
      accountType: LedgerAccountType.REFUND_RESERVE,
    });
    const cashAlreadyReduced = await this.ledgerService.hasRecordedReference({
      reference,
      eventType: LedgerEventType.REFUND_COMPLETED,
      accountType: LedgerAccountType.PLATFORM_CASH_CLEARING,
    });

    if (!reserveAlreadyCleared) {
      await this.ledgerService.record({
        accountType: LedgerAccountType.REFUND_RESERVE,
        amount: -this.getAmountNgn(refund),
        currency: refund.currency,
        orderId: refund.orderId,
        paymentId: refund.paymentIntentId,
        actorId,
        eventType: LedgerEventType.REFUND_COMPLETED,
        reference,
        notes,
      });
    }

    if (!cashAlreadyReduced) {
      await this.ledgerService.record({
        accountType: LedgerAccountType.PLATFORM_CASH_CLEARING,
        amount: -this.getAmountNgn(refund),
        currency: refund.currency,
        orderId: refund.orderId,
        paymentId: refund.paymentIntentId,
        actorId,
        eventType: LedgerEventType.REFUND_COMPLETED,
        reference,
        notes,
      });
    }
  }

  private async finalizeProcessedRefund(
    refund: Refund,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (refund.status === RefundStatus.PROCESSED) {
      return;
    }

    const order = await this.getOrderOrThrow(refund.orderId);
    const paymentIntent = await this.getSucceededPaymentIntentOrThrow(order.id);

    await this.completeRefundLedger(
      refund,
      'system',
      `Refund ${refund.id} processed successfully via ${refund.provider}`,
    );

    await this.paymentIntentRepo.save({
      ...paymentIntent,
      status: PaymentIntentStatus.REFUNDED,
    });

    await this.orderRepo.save({
      ...order,
      status: OrderStatus.REFUNDED,
    });

    await this.fulfilmentEventRepo.save(
      this.fulfilmentEventRepo.create({
        orderId: order.id,
        type: FulfilmentEventType.REFUNDED,
        actorId: 'system',
        notes: `Refund processed successfully via ${refund.provider}.`,
        metadata: {
          refundId: refund.id,
          provider: refund.provider,
          providerRefundReference: refund.providerRefundReference,
          providerRefundId: refund.providerRefundId,
          paystackRefundId: refund.paystackRefundId,
        },
      }),
    );

    const dispute = await this.disputeRepo.findOne({
      where: { orderId: order.id, status: DisputeStatus.RESOLVED_BUYER },
      order: { updatedAt: 'DESC' },
    });

    if (dispute) {
      await this.disputeRepo.save({
        ...dispute,
        status: DisputeStatus.CLOSED,
      });
    }

    await this.refundRepo.save({
      ...refund,
      status: RefundStatus.PROCESSED,
      processedAt: new Date(),
      rawPayload: payload,
      failureReason: undefined,
    });
  }

  private async applyRefundWebhookStatus(
    refund: Refund,
    payload: Record<string, unknown>,
    eventType: string,
  ): Promise<void> {
    const data =
      typeof payload['data'] === 'object' && payload['data'] !== null
        ? (payload['data'] as Record<string, unknown>)
        : undefined;
    const mappedStatus = this.mapPaystackRefundStatus(
      this.getString(data, 'status') ??
        eventType.replace('refund.', '').replace('-', '_'),
    );

    if (mappedStatus === RefundStatus.PROCESSED) {
      await this.finalizeProcessedRefund(refund, payload);
      return;
    }

    await this.refundRepo.save({
      ...refund,
      status: mappedStatus,
      rawPayload: payload,
      failureReason:
        this.getString(data, 'reason') ??
        this.getString(data, 'merchant_note') ??
        refund.failureReason,
      failedAt: mappedStatus === RefundStatus.FAILED ? new Date() : refund.failedAt,
    });
  }

  private async applyMonnifyRefundStatus(
    refund: Refund,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const data =
      typeof payload['eventData'] === 'object' && payload['eventData'] !== null
        ? (payload['eventData'] as Record<string, unknown>)
        : payload;
    const mappedStatus = this.mapMonnifyRefundStatus(
      this.getString(data, 'refundStatus') ?? 'PENDING',
    );

    if (mappedStatus === RefundStatus.PROCESSED) {
      await this.finalizeProcessedRefund(refund, payload);
      return;
    }

    await this.refundRepo.save({
      ...refund,
      status: mappedStatus,
      rawPayload: payload,
      failureReason:
        this.getString(data, 'comment') ??
        this.getString(data, 'refundReason') ??
        refund.failureReason,
      failedAt: mappedStatus === RefundStatus.FAILED ? new Date() : refund.failedAt,
    });
  }

  async listAdminRefunds(limit: number, status?: RefundStatus) {
    return this.refundRepo.find({
      where: status ? { status } : {},
      relations: ['order', 'paymentIntent'],
      order: { createdAt: 'DESC' },
      take: this.normalizeLimit(limit, 50),
    });
  }

  async createRefund(adminId: string, dto: CreateRefundDto) {
    const order = await this.getOrderOrThrow(dto.orderId);
    const paymentIntent = await this.getSucceededPaymentIntentOrThrow(order.id);
    const amount = Number(
      (dto.amount ?? Number(order.totalAmount)).toFixed(2),
    );

    if (amount <= 0 || amount > Number(order.totalAmount)) {
      throw new BadRequestException(
        'Refund amount must be greater than zero and no more than the original order amount',
      );
    }

    if (order.fundsReleasedAt) {
      throw new BadRequestException(
        'Refunds are only supported before seller funds are released',
      );
    }

    const existingOpenRefund = await this.findOpenRefundForOrder(order.id);
    if (existingOpenRefund) {
      return existingOpenRefund;
    }

    const notes =
      dto.reason?.trim() ??
      'Refund initiated from the admin dashboard before seller funds were released.';

    await this.reserveRefundAmount(order, paymentIntent, adminId, amount, notes);

    let refund: Refund;

    if (paymentIntent.provider === PaymentProvider.MONNIFY) {
      const refundReference = this.generateMonnifyRefundReference(
        order.orderReference,
      );
      const monnifyRefund = await this.monnifyService.createRefund({
        transactionReference: paymentIntent.paystackReference,
        refundAmount: amount,
        refundReference,
        refundReason: notes,
        customerNote:
          dto.customerNote?.trim() ?? 'Order refund approved by admin.',
        destinationAccountNumber: dto.destinationAccountNumber?.trim(),
        destinationAccountBankCode: dto.destinationBankCode?.trim(),
      });

      refund = await this.refundRepo.save(
        this.refundRepo.create({
          orderId: order.id,
          paymentIntentId: paymentIntent.id,
          transactionReference: paymentIntent.paystackReference,
          provider: paymentIntent.provider,
          providerRefundReference: monnifyRefund.refundReference,
          providerRefundId: monnifyRefund.refundReference,
          amount,
          currency: order.currency,
          status: this.mapMonnifyRefundStatus(monnifyRefund.refundStatus),
          reason: dto.reason?.trim(),
          customerNote: dto.customerNote?.trim(),
          merchantNote: notes,
          customerAccountNumber: dto.destinationAccountNumber?.trim(),
          customerBankId: dto.destinationBankCode?.trim(),
          initiatedById: adminId,
          rawPayload: monnifyRefund as unknown as Record<string, unknown>,
        }),
      );
    } else {
      const paystackRefund = await this.paystackService.createRefund({
        transaction: paymentIntent.paystackReference,
        amountKobo: Math.round(amount * 100),
        currency: order.currency,
        customerNote: dto.customerNote?.trim(),
        merchantNote: notes,
      });

      refund = await this.refundRepo.save(
        this.refundRepo.create({
          orderId: order.id,
          paymentIntentId: paymentIntent.id,
          transactionReference: paymentIntent.paystackReference,
          provider: paymentIntent.provider,
          paystackRefundId:
            paystackRefund.id !== undefined
              ? String(paystackRefund.id)
              : undefined,
          providerRefundId:
            paystackRefund.id !== undefined
              ? String(paystackRefund.id)
              : undefined,
          amount,
          currency: order.currency,
          status: this.mapPaystackRefundStatus(paystackRefund.status),
          reason: dto.reason?.trim(),
          customerNote: dto.customerNote?.trim(),
          merchantNote: notes,
          initiatedById: adminId,
          rawPayload: paystackRefund as unknown as Record<string, unknown>,
        }),
      );
    }

    await this.orderRepo.save({
      ...order,
      status: OrderStatus.REFUND_PENDING,
    });

    if (refund.status === RefundStatus.PROCESSED) {
      await this.finalizeProcessedRefund(
        refund,
        refund.rawPayload ?? ({} as Record<string, unknown>),
      );
      return this.getRefundOrThrow(refund.id);
    }

    return refund;
  }

  async createRefundForResolvedDispute(params: {
    orderId: string;
    adminId: string;
    reason?: string;
    customerNote?: string;
  }): Promise<Refund> {
    return this.createRefund(params.adminId, {
      orderId: params.orderId,
      reason: params.reason,
      customerNote: params.customerNote,
    });
  }

  async retryRefundWithBuyerDetails(
    refundId: string,
    adminId: string,
    dto: RetryRefundWithBuyerDetailsDto,
  ) {
    const refund = await this.getRefundOrThrow(refundId);

    if (refund.provider === PaymentProvider.MONNIFY) {
      if (!refund.providerRefundReference) {
        throw new BadRequestException(
          'This Monnify refund has no provider refund reference to retry',
        );
      }

      const currentStatus = await this.monnifyService.getRefundStatus(
        refund.providerRefundReference,
      );
      const mappedStatus = this.mapMonnifyRefundStatus(
        currentStatus.refundStatus,
      );

      if (mappedStatus === RefundStatus.PROCESSED) {
        await this.finalizeProcessedRefund(
          refund,
          currentStatus as unknown as Record<string, unknown>,
        );
        return this.getRefundOrThrow(refund.id);
      }

      if (mappedStatus === RefundStatus.PROCESSING) {
        return this.refundRepo.save({
          ...refund,
          status: RefundStatus.PROCESSING,
          customerBankId: dto.bankId,
          customerAccountNumber: dto.accountNumber,
          customerAccountCurrency: dto.currency,
          customerAccountName: dto.accountName?.trim(),
          initiatedById: adminId,
          rawPayload: currentStatus as unknown as Record<string, unknown>,
          failureReason: undefined,
        });
      }

      const newRefundReference = this.generateMonnifyRefundReference(
        refund.order.orderReference,
      );
      const retriedRefund = await this.monnifyService.createRefund({
        transactionReference: refund.transactionReference,
        refundAmount: this.getAmountNgn(refund),
        refundReference: newRefundReference,
        refundReason:
          refund.reason?.trim() ?? refund.merchantNote?.trim() ?? 'Refund retry',
        customerNote:
          refund.customerNote?.trim() ??
          dto.accountName?.trim() ??
          'Refund retry approved by admin.',
        destinationAccountNumber: dto.accountNumber,
        destinationAccountBankCode: dto.bankId,
      });

      const nextStatus = this.mapMonnifyRefundStatus(retriedRefund.refundStatus);

      const savedRefund = await this.refundRepo.save({
        ...refund,
        providerRefundReference: retriedRefund.refundReference,
        providerRefundId: retriedRefund.refundReference,
        status: nextStatus,
        customerBankId: dto.bankId,
        customerAccountNumber: dto.accountNumber,
        customerAccountCurrency: dto.currency,
        customerAccountName: dto.accountName?.trim(),
        initiatedById: adminId,
        rawPayload: retriedRefund as unknown as Record<string, unknown>,
        failureReason: undefined,
      });

      if (nextStatus === RefundStatus.PROCESSED) {
        await this.finalizeProcessedRefund(
          savedRefund,
          retriedRefund as unknown as Record<string, unknown>,
        );
        return this.getRefundOrThrow(savedRefund.id);
      }

      return savedRefund;
    }

    if (refund.status !== RefundStatus.NEEDS_ATTENTION) {
      throw new BadRequestException(
        'Only refunds waiting for buyer bank details can be retried',
      );
    }

    const paystackRefund = await this.paystackService.retryRefundWithCustomerDetails(
      {
        refundId: Number(refund.paystackRefundId),
        currency: dto.currency,
        accountNumber: dto.accountNumber,
        bankId: dto.bankId,
      },
    );

    return this.refundRepo.save({
      ...refund,
      status: this.mapPaystackRefundStatus(paystackRefund.status),
      customerBankId: dto.bankId,
      customerAccountNumber: dto.accountNumber,
      customerAccountCurrency: dto.currency,
      customerAccountName: dto.accountName?.trim(),
      initiatedById: adminId,
      rawPayload: paystackRefund as unknown as Record<string, unknown>,
      failureReason: undefined,
    });
  }

  async processPaystackWebhook(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    if (
      eventType !== 'refund.pending' &&
      eventType !== 'refund.processing' &&
      eventType !== 'refund.needs-attention' &&
      eventType !== 'refund.failed' &&
      eventType !== 'refund.processed'
    ) {
      return false;
    }

    const data =
      typeof payload['data'] === 'object' && payload['data'] !== null
        ? (payload['data'] as Record<string, unknown>)
        : undefined;
    const paystackRefundIdValue = this.getNumber(data, 'id');
    const transactionValue = data?.['transaction'];
    const transactionReference =
      typeof transactionValue === 'object' && transactionValue !== null
        ? this.getString(
            transactionValue as Record<string, unknown>,
            'reference',
          )
        : this.getString(data, 'transaction_reference');

    const refund = await this.refundRepo.findOne({
      where: [
        ...(paystackRefundIdValue !== undefined
          ? [{ paystackRefundId: String(paystackRefundIdValue) }]
          : []),
        ...(transactionReference
          ? [{ transactionReference }]
          : []),
      ],
      relations: ['order', 'paymentIntent'],
      order: { createdAt: 'DESC' },
    });

    if (!refund) {
      return false;
    }

    await this.applyRefundWebhookStatus(refund, payload, eventType);
    return true;
  }

  async processMonnifyWebhook(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    if (
      eventType !== 'SUCCESSFUL_REFUND' &&
      eventType !== 'FAILED_REFUND'
    ) {
      return false;
    }

    const data =
      typeof payload['eventData'] === 'object' && payload['eventData'] !== null
        ? (payload['eventData'] as Record<string, unknown>)
        : undefined;
    const refundReference = this.getString(data, 'refundReference');
    const transactionReference = this.getString(data, 'transactionReference');

    const refund = await this.refundRepo.findOne({
      where: [
        ...(refundReference
          ? [{ providerRefundReference: refundReference }]
          : []),
        ...(transactionReference
          ? [{ transactionReference }]
          : []),
      ],
      relations: ['order', 'paymentIntent'],
      order: { createdAt: 'DESC' },
    });

    if (!refund) {
      return false;
    }

    await this.applyMonnifyRefundStatus(refund, payload);
    return true;
  }
}
