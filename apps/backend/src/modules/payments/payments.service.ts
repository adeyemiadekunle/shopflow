import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Gauge, register } from 'prom-client';
import { LessThan, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  FulfilmentEvent,
  FulfilmentEventType,
} from '../orders/entities/fulfilment-event.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { PAYMENTS_QUEUE, PaymentJobName } from '../queue/queue.constants';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  InitializeCheckoutDto,
  PaystackCheckoutChannel,
} from './dto/payments.dto';
import {
  PaymentIntent,
  PaymentIntentStatus,
} from './entities/payment-intent.entity';
import {
  PaymentReconciliationIssue,
  PaymentReconciliationIssueSeverity,
  PaymentReconciliationIssueStatus,
  PaymentReconciliationIssueType,
} from './entities/payment-reconciliation-issue.entity';
import {
  PaymentReconciliationRun,
  PaymentReconciliationRunStatus,
  PaymentReconciliationRunTrigger,
} from './entities/payment-reconciliation-run.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import {
  PaystackInitResponse,
  PaystackService,
  PaystackVerifyResponse,
} from './paystack.service';
import * as crypto from 'crypto';

type QueueReconciliationTrigger = 'manual' | 'scheduled';

type ReconciliationJobData = {
  trigger: QueueReconciliationTrigger;
  initiatedByUserId?: string;
};

type ReconciliationOutcome = {
  issuesFound: number;
  repairsApplied: number;
  verificationsAttempted: number;
};

type OpenIssuesGauge = Gauge<'severity'>;
type SimpleGauge = Gauge<never>;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly openIssuesGauge: OpenIssuesGauge;
  private readonly lastRunTimestampGauge: SimpleGauge;
  private readonly lastRunIssueCountGauge: SimpleGauge;
  private readonly lastRunRepairCountGauge: SimpleGauge;

  constructor(
    @InjectRepository(PaymentIntent)
    private readonly paymentIntentRepo: Repository<PaymentIntent>,
    @InjectRepository(PaymentReconciliationRun)
    private readonly reconciliationRunRepo: Repository<PaymentReconciliationRun>,
    @InjectRepository(PaymentReconciliationIssue)
    private readonly reconciliationIssueRepo: Repository<PaymentReconciliationIssue>,
    @InjectRepository(WebhookEvent)
    private readonly webhookRepo: Repository<WebhookEvent>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(FulfilmentEvent)
    private readonly fulfilmentEventRepo: Repository<FulfilmentEvent>,
    @Inject(PAYMENTS_QUEUE)
    private readonly paymentsQueue: Queue,
    private readonly config: ConfigService,
    private readonly paystackService: PaystackService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    const countOpenIssues = this.countOpenReconciliationIssues.bind(this);
    const getLatestRun = this.getLatestReconciliationRun.bind(this);

    const existingOpenIssuesGauge = register.getSingleMetric(
      'rands_payment_reconciliation_open_issues_total',
    ) as OpenIssuesGauge | undefined;
    this.openIssuesGauge =
      existingOpenIssuesGauge ??
      new Gauge({
        name: 'rands_payment_reconciliation_open_issues_total',
        help: 'Open payment reconciliation issues grouped by severity',
        labelNames: ['severity'],
        async collect() {
          const counts = await countOpenIssues();
          this.set(
            { severity: PaymentReconciliationIssueSeverity.WARNING },
            counts.warning,
          );
          this.set(
            { severity: PaymentReconciliationIssueSeverity.ERROR },
            counts.error,
          );
        },
      });

    const existingLastRunTimestampGauge = register.getSingleMetric(
      'rands_payment_reconciliation_last_run_timestamp_seconds',
    ) as SimpleGauge | undefined;
    this.lastRunTimestampGauge =
      existingLastRunTimestampGauge ??
      new Gauge({
        name: 'rands_payment_reconciliation_last_run_timestamp_seconds',
        help: 'Unix timestamp of the latest completed payment reconciliation run',
        async collect() {
          const latestRun = await getLatestRun();
          this.set(
            latestRun?.completedAt
              ? Math.floor(latestRun.completedAt.getTime() / 1000)
              : 0,
          );
        },
      });

    const existingLastRunIssueCountGauge = register.getSingleMetric(
      'rands_payment_reconciliation_last_run_issue_count',
    ) as SimpleGauge | undefined;
    this.lastRunIssueCountGauge =
      existingLastRunIssueCountGauge ??
      new Gauge({
        name: 'rands_payment_reconciliation_last_run_issue_count',
        help: 'Number of issues found in the latest completed payment reconciliation run',
        async collect() {
          const latestRun = await getLatestRun();
          this.set(latestRun?.issueCount ?? 0);
        },
      });

    const existingLastRunRepairCountGauge = register.getSingleMetric(
      'rands_payment_reconciliation_last_run_repair_count',
    ) as SimpleGauge | undefined;
    this.lastRunRepairCountGauge =
      existingLastRunRepairCountGauge ??
      new Gauge({
        name: 'rands_payment_reconciliation_last_run_repair_count',
        help: 'Number of repairs applied in the latest completed payment reconciliation run',
        async collect() {
          const latestRun = await getLatestRun();
          this.set(latestRun?.repairedCount ?? 0);
        },
      });
  }

  private generateReference(orderReference: string): string {
    return `PAY-${orderReference}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  private normalizeChannels(
    channels?: PaystackCheckoutChannel[],
  ): PaystackCheckoutChannel[] | undefined {
    if (!channels?.length) {
      return undefined;
    }

    return Array.from(new Set(channels));
  }

  private normalizeLimit(limit: number, fallback: number): number {
    if (!Number.isFinite(limit) || Number.isNaN(limit) || limit <= 0) {
      return fallback;
    }

    return Math.min(Math.floor(limit), 100);
  }

  private isSuccessfulVerifyResponse(
    verifyResponse: PaystackVerifyResponse,
  ): boolean {
    return verifyResponse.status === 'success';
  }

  private isFailedVerifyResponse(
    verifyResponse: PaystackVerifyResponse,
  ): boolean {
    return (
      verifyResponse.status === 'failed' ||
      verifyResponse.status === 'abandoned'
    );
  }

  private isSameFinalOutcome(
    intent: PaymentIntent,
    verifyResponse: PaystackVerifyResponse,
  ): boolean {
    return (
      (intent.status === PaymentIntentStatus.SUCCEEDED &&
        this.isSuccessfulVerifyResponse(verifyResponse)) ||
      (intent.status === PaymentIntentStatus.FAILED &&
        this.isFailedVerifyResponse(verifyResponse))
    );
  }

  private buildStoredSuccessfulVerifyResponse(
    intent: PaymentIntent,
  ): PaystackVerifyResponse | null {
    const payload = intent.rawVerifyPayload;

    if (!payload) {
      return null;
    }

    const status = payload['status'];
    const reference = payload['reference'];
    const amount = payload['amount'];
    const currency = payload['currency'];
    const paidAt = payload['paid_at'];
    const channel = payload['channel'];
    const metadata = payload['metadata'];
    const authorization = payload['authorization'];

    if (
      status !== 'success' ||
      typeof reference !== 'string' ||
      typeof amount !== 'number' ||
      typeof currency !== 'string' ||
      typeof paidAt !== 'string' ||
      typeof channel !== 'string' ||
      typeof metadata !== 'object' ||
      metadata === null ||
      typeof authorization !== 'object' ||
      authorization === null
    ) {
      return null;
    }

    return {
      status,
      reference,
      amount,
      currency,
      paid_at: paidAt,
      channel,
      metadata: metadata as Record<string, unknown>,
      authorization: authorization as PaystackVerifyResponse['authorization'],
    };
  }

  private async findExistingWebhookEvent(
    eventType: string,
    paystackEventId?: string,
    reference?: string,
  ): Promise<WebhookEvent | null> {
    const orWhere: Array<Partial<WebhookEvent>> = [];

    if (paystackEventId) {
      orWhere.push({ paystackEventId });
    }

    if (reference) {
      orWhere.push({ eventType, reference });
    }

    if (orWhere.length === 0) {
      return null;
    }

    return this.webhookRepo.findOne({
      where: orWhere,
      order: { createdAt: 'DESC' },
    });
  }

  private async getIntentByReferenceOrThrow(
    reference: string,
  ): Promise<PaymentIntent> {
    const intent = await this.paymentIntentRepo.findOne({
      where: { paystackReference: reference },
    });

    if (!intent) {
      throw new NotFoundException(`Payment intent ${reference} not found`);
    }

    return intent;
  }

  private async ensureBuyerOwnsIntent(
    reference: string,
    user: AuthenticatedUser,
  ): Promise<PaymentIntent> {
    const intent = await this.getIntentByReferenceOrThrow(reference);

    if (user.role !== UserRole.ADMIN && intent.buyerId !== user.id) {
      throw new ForbiddenException('You can only verify your own payments');
    }

    return intent;
  }

  private async getOrderByIdOrThrow(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['buyer', 'sellerProfile'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  private async ensureBuyerOwnsOrderForCheckout(
    orderId: string,
    user: AuthenticatedUser,
  ): Promise<Order> {
    const order = await this.getOrderByIdOrThrow(orderId);

    if (user.role !== UserRole.ADMIN && order.buyerId !== user.id) {
      throw new ForbiddenException(
        'You can only initialize payment for your own order',
      );
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('This order has already been paid for');
    }

    if (
      order.status !== OrderStatus.QUOTE_ACCEPTED &&
      order.status !== OrderStatus.PAYMENT_PENDING
    ) {
      throw new BadRequestException(
        'Payment can only be initialized after the delivery quote is accepted',
      );
    }

    if (Number(order.totalAmount) <= 0) {
      throw new BadRequestException('Order total must be greater than zero');
    }

    return order;
  }

  private async markOrderPaid(
    order: Order,
    intent: PaymentIntent,
    verifyResponse: PaystackVerifyResponse,
  ): Promise<void> {
    if (order.status === OrderStatus.PAID) {
      return;
    }

    if (order.status === OrderStatus.QUOTE_ACCEPTED) {
      order.status = OrderStatus.PAYMENT_PENDING;
    }

    if (order.status !== OrderStatus.PAYMENT_PENDING) {
      throw new BadRequestException(
        `Cannot mark order ${order.id} as paid from status ${order.status}`,
      );
    }

    order.status = OrderStatus.PAID;
    order.paidAt = new Date(verifyResponse.paid_at);
    await this.orderRepo.save(order);

    await this.fulfilmentEventRepo.save(
      this.fulfilmentEventRepo.create({
        orderId: order.id,
        type: FulfilmentEventType.PAYMENT_RECEIVED,
        actorId: intent.buyerId,
        notes: `Payment confirmed via Paystack (${verifyResponse.channel})`,
        metadata: {
          reference: verifyResponse.reference,
          amount: verifyResponse.amount,
          currency: verifyResponse.currency,
        },
      }),
    );
  }

  private async finalizeVerifiedPayment(
    intent: PaymentIntent,
    verifyResponse: PaystackVerifyResponse,
  ): Promise<PaymentIntent> {
    if (verifyResponse.reference !== intent.paystackReference) {
      throw new BadRequestException('Payment reference mismatch');
    }

    if (verifyResponse.amount !== Number(intent.amountKobo)) {
      throw new BadRequestException('Payment amount mismatch');
    }

    if (verifyResponse.currency !== intent.currency) {
      throw new BadRequestException('Payment currency mismatch');
    }

    if (this.isSameFinalOutcome(intent, verifyResponse)) {
      return intent;
    }

    if (
      intent.status === PaymentIntentStatus.SUCCEEDED &&
      this.isFailedVerifyResponse(verifyResponse)
    ) {
      throw new BadRequestException(
        'Refusing to overwrite a successful payment with a failed verification result',
      );
    }

    const nextStatus =
      verifyResponse.status === 'success'
        ? PaymentIntentStatus.SUCCEEDED
        : verifyResponse.status === 'failed' ||
            verifyResponse.status === 'abandoned'
          ? PaymentIntentStatus.FAILED
          : PaymentIntentStatus.PROCESSING;

    const savedIntent = await this.paymentIntentRepo.save({
      ...intent,
      status: nextStatus,
      rawVerifyPayload: verifyResponse as unknown as Record<string, unknown>,
      verifiedAt:
        verifyResponse.status === 'success'
          ? new Date(verifyResponse.paid_at)
          : undefined,
    });

    if (nextStatus !== PaymentIntentStatus.SUCCEEDED) {
      return savedIntent;
    }

    const order = await this.getOrderByIdOrThrow(intent.orderId);
    await this.markOrderPaid(order, intent, verifyResponse);

    return savedIntent;
  }

  private async findOpenReconciliationIssue(
    params: Pick<
      PaymentReconciliationIssue,
      'type' | 'paymentIntentId' | 'orderId' | 'paystackReference'
    >,
  ): Promise<PaymentReconciliationIssue | null> {
    return this.reconciliationIssueRepo.findOne({
      where: {
        type: params.type,
        status: PaymentReconciliationIssueStatus.OPEN,
        paymentIntentId: params.paymentIntentId,
        orderId: params.orderId,
        paystackReference: params.paystackReference,
      },
      order: { createdAt: 'DESC' },
    });
  }

  private async upsertOpenReconciliationIssue(params: {
    runId: string;
    type: PaymentReconciliationIssueType;
    severity: PaymentReconciliationIssueSeverity;
    paymentIntentId?: string;
    orderId?: string;
    paystackReference?: string;
    description: string;
    details?: Record<string, unknown>;
  }): Promise<PaymentReconciliationIssue> {
    const existingIssue = await this.findOpenReconciliationIssue({
      type: params.type,
      paymentIntentId: params.paymentIntentId,
      orderId: params.orderId,
      paystackReference: params.paystackReference,
    });

    if (existingIssue) {
      return this.reconciliationIssueRepo.save({
        ...existingIssue,
        runId: params.runId,
        severity: params.severity,
        description: params.description,
        details: params.details,
      });
    }

    return this.reconciliationIssueRepo.save(
      this.reconciliationIssueRepo.create({
        runId: params.runId,
        type: params.type,
        severity: params.severity,
        paymentIntentId: params.paymentIntentId,
        orderId: params.orderId,
        paystackReference: params.paystackReference,
        description: params.description,
        details: params.details,
        status: PaymentReconciliationIssueStatus.OPEN,
      }),
    );
  }

  private async resolveReconciliationIssue(params: {
    type: PaymentReconciliationIssueType;
    paymentIntentId?: string;
    orderId?: string;
    paystackReference?: string;
  }): Promise<void> {
    const existingIssue = await this.findOpenReconciliationIssue(params);

    if (!existingIssue) {
      return;
    }

    await this.reconciliationIssueRepo.save({
      ...existingIssue,
      status: PaymentReconciliationIssueStatus.RESOLVED,
      resolvedAt: new Date(),
    });
  }

  private async ensureSuccessfulIntentEffects(
    intent: PaymentIntent,
  ): Promise<number> {
    const order = await this.getOrderByIdOrThrow(intent.orderId);

    if (order.status === OrderStatus.PAID) {
      return 0;
    }

    if (
      order.status !== OrderStatus.QUOTE_ACCEPTED &&
      order.status !== OrderStatus.PAYMENT_PENDING
    ) {
      throw new BadRequestException(
        `Cannot reconcile a succeeded payment for order ${order.id} from status ${order.status}`,
      );
    }

    const storedVerifyResponse = this.buildStoredSuccessfulVerifyResponse(intent);
    const verifyResponse =
      storedVerifyResponse ??
      (await this.paystackService.verifyTransaction(intent.paystackReference));

    if (!this.isSuccessfulVerifyResponse(verifyResponse)) {
      throw new BadRequestException(
        `Cannot apply payment side effects for non-successful Paystack status ${verifyResponse.status}`,
      );
    }

    await this.markOrderPaid(order, intent, verifyResponse);
    return 1;
  }

  private async countOpenReconciliationIssues(): Promise<{
    warning: number;
    error: number;
  }> {
    const [warning, error] = await Promise.all([
      this.reconciliationIssueRepo.count({
        where: {
          status: PaymentReconciliationIssueStatus.OPEN,
          severity: PaymentReconciliationIssueSeverity.WARNING,
        },
      }),
      this.reconciliationIssueRepo.count({
        where: {
          status: PaymentReconciliationIssueStatus.OPEN,
          severity: PaymentReconciliationIssueSeverity.ERROR,
        },
      }),
    ]);

    return { warning, error };
  }

  private async getLatestReconciliationRun(): Promise<PaymentReconciliationRun | null> {
    return this.reconciliationRunRepo.findOne({
      where: [
        { status: PaymentReconciliationRunStatus.COMPLETED },
        { status: PaymentReconciliationRunStatus.COMPLETED_WITH_ISSUES },
        { status: PaymentReconciliationRunStatus.FAILED },
      ],
      order: { completedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  private async reconcileIntent(
    run: PaymentReconciliationRun,
    intent: PaymentIntent,
  ): Promise<ReconciliationOutcome> {
    let issuesFound = 0;
    let repairsApplied = 0;
    let verificationsAttempted = 0;

    let order: Order;
    try {
      order = await this.getOrderByIdOrThrow(intent.orderId);
      await this.resolveReconciliationIssue({
        type: PaymentReconciliationIssueType.PAYMENT_INTENT_ORDER_MISSING,
        paymentIntentId: intent.id,
        orderId: intent.orderId,
        paystackReference: intent.paystackReference,
      });
    } catch (error) {
      issuesFound += 1;
      await this.upsertOpenReconciliationIssue({
        runId: run.id,
        type: PaymentReconciliationIssueType.PAYMENT_INTENT_ORDER_MISSING,
        severity: PaymentReconciliationIssueSeverity.ERROR,
        paymentIntentId: intent.id,
        orderId: intent.orderId,
        paystackReference: intent.paystackReference,
        description:
          'Payment intent references an order that no longer exists or cannot be loaded',
        details: {
          orderId: intent.orderId,
          paymentIntentStatus: intent.status,
          error:
            error instanceof Error ? error.message : 'Unknown order lookup error',
        },
      });
      return { issuesFound, repairsApplied, verificationsAttempted };
    }

    if (
      intent.status === PaymentIntentStatus.PENDING ||
      intent.status === PaymentIntentStatus.PROCESSING
    ) {
      issuesFound += 1;
      verificationsAttempted += 1;

      try {
        const verifyResponse = await this.paystackService.verifyTransaction(
          intent.paystackReference,
        );
        const previousStatus = intent.status;
        const updatedIntent = await this.finalizeVerifiedPayment(
          intent,
          verifyResponse,
        );

        if (updatedIntent.status !== previousStatus) {
          repairsApplied += 1;
        }

        await this.resolveReconciliationIssue({
          type: PaymentReconciliationIssueType.STALE_PROCESSING_INTENT,
          paymentIntentId: intent.id,
          orderId: order.id,
          paystackReference: intent.paystackReference,
        });
        await this.resolveReconciliationIssue({
          type: PaymentReconciliationIssueType.VERIFY_ATTEMPT_FAILED,
          paymentIntentId: intent.id,
          orderId: order.id,
          paystackReference: intent.paystackReference,
        });
      } catch (error) {
        await this.upsertOpenReconciliationIssue({
          runId: run.id,
          type: PaymentReconciliationIssueType.STALE_PROCESSING_INTENT,
          severity: PaymentReconciliationIssueSeverity.WARNING,
          paymentIntentId: intent.id,
          orderId: order.id,
          paystackReference: intent.paystackReference,
          description:
            'Payment intent stayed in a pending or processing state beyond the reconciliation safety window',
          details: {
            paymentIntentStatus: intent.status,
            paymentIntentUpdatedAt: intent.updatedAt.toISOString(),
            orderStatus: order.status,
          },
        });
        await this.upsertOpenReconciliationIssue({
          runId: run.id,
          type: PaymentReconciliationIssueType.VERIFY_ATTEMPT_FAILED,
          severity: PaymentReconciliationIssueSeverity.ERROR,
          paymentIntentId: intent.id,
          orderId: order.id,
          paystackReference: intent.paystackReference,
          description:
            'Reconciliation attempted a Paystack verify call and it failed',
          details: {
            paymentIntentStatus: intent.status,
            orderStatus: order.status,
            error:
              error instanceof Error
                ? error.message
                : 'Unknown Paystack verification failure',
          },
        });
      }

      return { issuesFound, repairsApplied, verificationsAttempted };
    }

    if (intent.status === PaymentIntentStatus.SUCCEEDED) {
      if (order.status !== OrderStatus.PAID) {
        issuesFound += 1;

        try {
          repairsApplied += await this.ensureSuccessfulIntentEffects(intent);
          await this.resolveReconciliationIssue({
            type: PaymentReconciliationIssueType.SUCCEEDED_ORDER_NOT_PAID,
            paymentIntentId: intent.id,
            orderId: order.id,
            paystackReference: intent.paystackReference,
          });
        } catch (error) {
          await this.upsertOpenReconciliationIssue({
            runId: run.id,
            type: PaymentReconciliationIssueType.SUCCEEDED_ORDER_NOT_PAID,
            severity: PaymentReconciliationIssueSeverity.ERROR,
            paymentIntentId: intent.id,
            orderId: order.id,
            paystackReference: intent.paystackReference,
            description:
              'Payment intent is succeeded but the order is not marked paid',
            details: {
              orderStatus: order.status,
              paymentIntentStatus: intent.status,
              error:
                error instanceof Error
                  ? error.message
                  : 'Unknown order state repair failure',
            },
          });
        }
      } else {
        await this.resolveReconciliationIssue({
          type: PaymentReconciliationIssueType.SUCCEEDED_ORDER_NOT_PAID,
          paymentIntentId: intent.id,
          orderId: order.id,
          paystackReference: intent.paystackReference,
        });
      }

      await this.resolveReconciliationIssue({
        type: PaymentReconciliationIssueType.FAILED_ORDER_MARKED_PAID,
        paymentIntentId: intent.id,
        orderId: order.id,
        paystackReference: intent.paystackReference,
      });

      return { issuesFound, repairsApplied, verificationsAttempted };
    }

    if (intent.status === PaymentIntentStatus.FAILED && order.status === OrderStatus.PAID) {
      issuesFound += 1;
      await this.upsertOpenReconciliationIssue({
        runId: run.id,
        type: PaymentReconciliationIssueType.FAILED_ORDER_MARKED_PAID,
        severity: PaymentReconciliationIssueSeverity.ERROR,
        paymentIntentId: intent.id,
        orderId: order.id,
        paystackReference: intent.paystackReference,
        description:
          'Order is marked paid even though the payment intent is failed',
        details: {
          orderStatus: order.status,
          paymentIntentStatus: intent.status,
        },
      });
    } else {
      await this.resolveReconciliationIssue({
        type: PaymentReconciliationIssueType.FAILED_ORDER_MARKED_PAID,
        paymentIntentId: intent.id,
        orderId: order.id,
        paystackReference: intent.paystackReference,
      });
    }

    return { issuesFound, repairsApplied, verificationsAttempted };
  }

  async initializeCheckout(
    user: AuthenticatedUser,
    orderId: string,
    dto: InitializeCheckoutDto,
  ) {
    const order = await this.ensureBuyerOwnsOrderForCheckout(orderId, user);
    const buyer = await this.usersService.findById(user.id);

    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    const idempotencyKey =
      dto.idempotencyKey?.trim() || this.generateIdempotencyKey();
    const existingIntent = await this.paymentIntentRepo.findOne({
      where: { idempotencyKey },
    });

    if (existingIntent) {
      if (
        existingIntent.buyerId !== user.id ||
        existingIntent.orderId !== orderId
      ) {
        throw new ForbiddenException(
          'This idempotency key belongs to another payment',
        );
      }

      return existingIntent;
    }

    if (order.status === OrderStatus.QUOTE_ACCEPTED) {
      await this.orderRepo.save({
        ...order,
        status: OrderStatus.PAYMENT_PENDING,
      });
    }

    const reference = this.generateReference(order.orderReference);
    const amountKobo = Math.round(Number(order.totalAmount) * 100);
    const paystackResponse: PaystackInitResponse =
      await this.paystackService.initializeTransaction({
        email: buyer.email,
        amountKobo,
        currency: order.currency,
        reference,
        callbackUrl: dto.callbackUrl,
        channels: this.normalizeChannels(dto.channels),
        orderId: order.id,
        buyerId: user.id,
        sellerProfileId: order.sellerProfileId,
        metadata: {
          order_reference: order.orderReference,
        },
      });

    const intent = await this.paymentIntentRepo.save(
      this.paymentIntentRepo.create({
        orderId: order.id,
        buyerId: user.id,
        paystackReference: paystackResponse.reference,
        idempotencyKey,
        amountKobo,
        currency: order.currency,
        status: PaymentIntentStatus.PROCESSING,
        authorizationUrl: paystackResponse.authorization_url,
      }),
    );

    return {
      ...intent,
      accessCode: paystackResponse.access_code,
      authorizationUrl: paystackResponse.authorization_url,
      reference: paystackResponse.reference,
    };
  }

  async verifyCheckout(reference: string, user: AuthenticatedUser) {
    const intent = await this.ensureBuyerOwnsIntent(reference, user);
    const verifyResponse =
      await this.paystackService.verifyTransaction(reference);
    const updatedIntent = await this.finalizeVerifiedPayment(
      intent,
      verifyResponse,
    );

    return {
      paymentIntent: updatedIntent,
      paystack: verifyResponse,
    };
  }

  async enqueueWebhook(body: Record<string, unknown>) {
    const data = body['data'] as Record<string, unknown> | undefined;
    const paystackEventIdValue = data?.['id'];
    const paystackEventId =
      typeof paystackEventIdValue === 'string' ||
      typeof paystackEventIdValue === 'number'
        ? String(paystackEventIdValue)
        : '';
    const eventTypeValue = body['event'];
    const eventType =
      typeof eventTypeValue === 'string' ? eventTypeValue : 'unknown';
    const reference =
      typeof data?.['reference'] === 'string' ? data['reference'] : undefined;
    const existingEvent = await this.findExistingWebhookEvent(
      eventType,
      paystackEventId || undefined,
      reference,
    );

    if (existingEvent?.processed) {
      return {
        received: true,
        queued: false,
        eventId: existingEvent.id,
        status: 'already_processed',
      };
    }

    const event = existingEvent
      ? await this.webhookRepo.save({
          ...existingEvent,
          eventType,
          reference: reference ?? existingEvent.reference,
          rawPayload: body,
          error: undefined,
        })
      : await this.webhookRepo.save(
          this.webhookRepo.create({
            eventType,
            paystackEventId: paystackEventId || undefined,
            reference,
            rawPayload: body,
            processed: false,
          }),
        );

    await this.paymentsQueue.add(
      PaymentJobName.PROCESS_WEBHOOK_EVENT,
      {
        webhookEventId: event.id,
      },
      {
        jobId: `payment-webhook:${event.id}`,
      },
    );

    return {
      received: true,
      queued: true,
      eventId: event.id,
    };
  }

  async processWebhookEvent(webhookEventId: string): Promise<void> {
    const event = await this.webhookRepo.findOne({
      where: { id: webhookEventId },
    });

    if (!event) {
      throw new NotFoundException(`Webhook event ${webhookEventId} not found`);
    }

    if (event.processed) {
      return;
    }

    const body = event.rawPayload;

    try {
      if (event.eventType === 'charge.success' && event.reference) {
        try {
          const intent = await this.getIntentByReferenceOrThrow(event.reference);
          if (intent.status !== PaymentIntentStatus.SUCCEEDED) {
            const verifyResponse = await this.paystackService.verifyTransaction(
              event.reference,
            );
            await this.finalizeVerifiedPayment(intent, verifyResponse);
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            throw error;
          }

          const handledBySubscriptions =
            await this.subscriptionsService.processPaystackWebhook(
              event.eventType,
              body,
            );

          if (!handledBySubscriptions) {
            throw error;
          }
        }
      }

      if (event.eventType === 'charge.failed' && event.reference) {
        const intent = await this.getIntentByReferenceOrThrow(event.reference);
        if (intent.status !== PaymentIntentStatus.SUCCEEDED) {
          if (intent.status !== PaymentIntentStatus.FAILED) {
            await this.paymentIntentRepo.save({
              ...intent,
              status: PaymentIntentStatus.FAILED,
              rawVerifyPayload: body,
            });
          }
        } else {
          this.logger.warn(
            `Ignoring charge.failed webhook for already successful payment ${event.reference}`,
          );
        }
      }

      if (
        event.eventType === 'subscription.create' ||
        event.eventType === 'subscription.disable' ||
        event.eventType === 'invoice.update' ||
        event.eventType === 'invoice.payment_failed'
      ) {
        await this.subscriptionsService.processPaystackWebhook(
          event.eventType,
          body,
        );
      }

      await this.webhookRepo.save({
        ...event,
        processed: true,
        processedAt: new Date(),
        error: undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown webhook processing error';
      await this.webhookRepo.save({
        ...event,
        processed: false,
        error: message,
      });
      this.logger.error(`Failed to process Paystack webhook: ${message}`);
      throw error;
    }
  }

  async enqueueReconciliationRun(
    trigger: QueueReconciliationTrigger,
    initiatedByUserId?: string,
    force = false,
  ) {
    const intervalMs =
      this.config.get<number>('queue.paymentsReconciliationIntervalMs') ??
      900000;
    const jobOptions =
      trigger === 'scheduled'
        ? {
            jobId: 'payment-reconciliation:scheduled',
            repeat: {
              every: intervalMs,
            },
          }
        : {
            jobId: `payment-reconciliation:manual:${Date.now()}`,
          };

    await this.paymentsQueue.add(
      PaymentJobName.RUN_PAYMENT_RECONCILIATION,
      {
        trigger,
        initiatedByUserId,
      } satisfies ReconciliationJobData,
      {
        ...jobOptions,
      },
    );

    return {
      queued: true,
      trigger,
      force,
      intervalMs: trigger === 'scheduled' ? intervalMs : undefined,
    };
  }

  async processReconciliationJob(data: ReconciliationJobData) {
    const minAgeMs =
      this.config.get<number>('queue.paymentsReconciliationMinAgeMs') ??
      600000;
    const batchSize =
      this.config.get<number>('queue.paymentsReconciliationBatchSize') ?? 100;
    const staleBefore = new Date(Date.now() - minAgeMs);
    const run = await this.reconciliationRunRepo.save(
      this.reconciliationRunRepo.create({
        trigger:
          data.trigger === 'manual'
            ? PaymentReconciliationRunTrigger.MANUAL
            : PaymentReconciliationRunTrigger.SCHEDULED,
        status: PaymentReconciliationRunStatus.STARTED,
        startedAt: new Date(),
        initiatedByUserId: data.initiatedByUserId,
        scannedCount: 0,
        verifiedCount: 0,
        repairedCount: 0,
        issueCount: 0,
      }),
    );

    try {
      const intents = await this.paymentIntentRepo.find({
        where: [
          {
            status: PaymentIntentStatus.PENDING,
            updatedAt: LessThan(staleBefore),
          },
          {
            status: PaymentIntentStatus.PROCESSING,
            updatedAt: LessThan(staleBefore),
          },
          {
            status: PaymentIntentStatus.SUCCEEDED,
            updatedAt: LessThan(staleBefore),
          },
          {
            status: PaymentIntentStatus.FAILED,
            updatedAt: LessThan(staleBefore),
          },
        ],
        order: {
          updatedAt: 'ASC',
        },
        take: batchSize,
      });

      let scannedCount = 0;
      let verifiedCount = 0;
      let repairedCount = 0;
      let issueCount = 0;

      for (const intent of intents) {
        scannedCount += 1;
        const outcome = await this.reconcileIntent(run, intent);
        verifiedCount += outcome.verificationsAttempted;
        repairedCount += outcome.repairsApplied;
        issueCount += outcome.issuesFound;
      }

      const savedRun = await this.reconciliationRunRepo.save({
        ...run,
        status:
          issueCount > 0
            ? PaymentReconciliationRunStatus.COMPLETED_WITH_ISSUES
            : PaymentReconciliationRunStatus.COMPLETED,
        completedAt: new Date(),
        scannedCount,
        verifiedCount,
        repairedCount,
        issueCount,
        notes:
          scannedCount === 0
            ? 'No stale or mismatched payment intents needed reconciliation'
            : undefined,
      });

      return savedRun;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown reconciliation error';
      this.logger.error(`Payment reconciliation failed: ${message}`);

      return this.reconciliationRunRepo.save({
        ...run,
        status: PaymentReconciliationRunStatus.FAILED,
        completedAt: new Date(),
        notes: message,
      });
    }
  }

  async getRecentReconciliationRuns(limit: number) {
    return this.reconciliationRunRepo.find({
      order: {
        createdAt: 'DESC',
      },
      take: this.normalizeLimit(limit, 20),
    });
  }

  async getRecentReconciliationIssues(limit: number) {
    return this.reconciliationIssueRepo.find({
      order: {
        createdAt: 'DESC',
      },
      take: this.normalizeLimit(limit, 50),
    });
  }
}
