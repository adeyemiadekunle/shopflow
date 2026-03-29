import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { In, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { LedgerService } from '../ledger/ledger.service';
import {
  LedgerAccountType,
  LedgerEventType,
} from '../ledger/enums/ledger.enum';
import {
  PaystackService,
  PaystackVerifyResponse,
} from '../payments/paystack.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import {
  InitializeSubscriptionCheckoutDto,
  VerifySubscriptionPaymentDto,
} from './dto/subscription-checkout.dto';
import {
  UpdateSubscriptionTierDto,
  UpsertSubscriptionTierDto,
} from './dto/upsert-subscription-tier.dto';
import { SellerSubscription } from './entities/seller-subscription.entity';
import { SubscriptionTier } from './entities/subscription-tier.entity';
import {
  SellerSubscriptionStatus,
  SubscriptionTierName,
} from './enums/subscription.enum';
import type { TierFeatures } from './types/tier-features.interface';

type PaystackWebhookPayload = Record<string, unknown>;

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionTier)
    private readonly tierRepo: Repository<SubscriptionTier>,
    @InjectRepository(SellerSubscription)
    private readonly subscriptionRepo: Repository<SellerSubscription>,
    private readonly platformConfig: PlatformConfigService,
    private readonly paystackService: PaystackService,
    private readonly ledgerService: LedgerService,
    private readonly usersService: UsersService,
  ) {}

  private generateReference(tierName: SubscriptionTierName): string {
    return `SUB-${tierName.toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  private assertSeller(user: AuthenticatedUser): string {
    if (user.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can manage subscriptions');
    }

    if (!user.sellerProfileId) {
      throw new BadRequestException(
        'Seller account is missing a seller profile',
      );
    }

    return user.sellerProfileId;
  }

  private addOneMonth(date: Date): Date {
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
  }

  private getString(
    source: Record<string, unknown> | undefined,
    key: string,
  ): string | undefined {
    const value = source?.[key];
    return typeof value === 'string' && value.trim()
      ? value.trim()
      : undefined;
  }

  private getObject(
    source: Record<string, unknown> | undefined,
    key: string,
  ): Record<string, unknown> | undefined {
    const value = source?.[key];
    return typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private getNestedString(
    source: Record<string, unknown> | undefined,
    path: string[],
  ): string | undefined {
    let cursor: unknown = source;

    for (const key of path) {
      if (typeof cursor !== 'object' || cursor === null) {
        return undefined;
      }

      cursor = (cursor as Record<string, unknown>)[key];
    }

    return typeof cursor === 'string' && cursor.trim()
      ? cursor.trim()
      : undefined;
  }

  private async getTierOrThrow(id: string): Promise<SubscriptionTier> {
    const tier = await this.tierRepo.findOne({ where: { id } });
    if (!tier) {
      throw new NotFoundException(`Subscription tier ${id} not found`);
    }
    return tier;
  }

  private async ensureTierPlan(
    tier: SubscriptionTier,
  ): Promise<SubscriptionTier> {
    if (Number(tier.monthlyPrice) <= 0 || tier.paystackPlanCode) {
      return tier;
    }

    const createdPlan = await this.paystackService.createPlan({
      name: `Rands ${tier.displayName} Monthly`,
      amountKobo: Math.round(Number(tier.monthlyPrice) * 100),
      interval: 'monthly',
      currency: tier.currency,
      description:
        tier.description ?? `Monthly seller subscription for ${tier.displayName}`,
    });

    return this.tierRepo.save({
      ...tier,
      paystackPlanCode: createdPlan.plan_code,
    });
  }

  private async findCurrentSubscription(
    sellerProfileId: string,
  ): Promise<SellerSubscription | null> {
    return this.subscriptionRepo.findOne({
      where: {
        sellerProfileId,
        status: In([
          SellerSubscriptionStatus.ACTIVE,
          SellerSubscriptionStatus.TRIAL,
          SellerSubscriptionStatus.PENDING,
        ]),
      },
      relations: ['tier'],
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  private async findSubscriptionByReference(
    reference: string,
    sellerProfileId?: string,
  ): Promise<SellerSubscription | null> {
    const where: Array<Partial<SellerSubscription>> = [
      { checkoutReference: reference },
      { latestChargeReference: reference },
    ];

    return this.subscriptionRepo.findOne({
      where: sellerProfileId
        ? where.map((item) => ({ ...item, sellerProfileId }))
        : where,
      relations: ['tier'],
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  private async ensureBaselineSubscription(
    sellerProfileId: string,
  ): Promise<SellerSubscription> {
    const existing = await this.findCurrentSubscription(sellerProfileId);
    if (existing) {
      return existing;
    }

    return this.startFreeTrial(sellerProfileId);
  }

  private async cancelSupersededSubscriptions(
    sellerProfileId: string,
    keepSubscriptionId: string,
  ): Promise<void> {
    const subscriptions = await this.subscriptionRepo.find({
      where: {
        sellerProfileId,
        status: In([
          SellerSubscriptionStatus.ACTIVE,
          SellerSubscriptionStatus.TRIAL,
          SellerSubscriptionStatus.PENDING,
        ]),
      },
    });

    const now = new Date();
    const updates = subscriptions
      .filter((subscription) => subscription.id !== keepSubscriptionId)
      .map((subscription) =>
        this.subscriptionRepo.save({
          ...subscription,
          status: SellerSubscriptionStatus.CANCELLED,
          cancelledAt: now,
        }),
      );

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  }

  private async recordSubscriptionLedgerEntry(params: {
    sellerProfileId: string;
    reference: string;
    amountNgn: number;
    currency: string;
    notes: string;
  }): Promise<void> {
    const alreadyRecorded = await this.ledgerService.hasRecordedReference({
      reference: params.reference,
      eventType: LedgerEventType.SUBSCRIPTION_BILLED,
      accountType: LedgerAccountType.PLATFORM_REVENUE,
    });

    if (alreadyRecorded) {
      return;
    }

    await this.ledgerService.ensureAccount(
      LedgerAccountType.PLATFORM_CASH_CLEARING,
      undefined,
      params.currency,
    );
    await this.ledgerService.ensureAccount(
      LedgerAccountType.PLATFORM_REVENUE,
      undefined,
      params.currency,
    );

    await this.ledgerService.record({
      accountType: LedgerAccountType.PLATFORM_CASH_CLEARING,
      amount: params.amountNgn,
      eventType: LedgerEventType.SUBSCRIPTION_BILLED,
      currency: params.currency,
      actorId: params.sellerProfileId,
      reference: params.reference,
      notes: params.notes,
    });

    await this.ledgerService.record({
      accountType: LedgerAccountType.PLATFORM_REVENUE,
      amount: params.amountNgn,
      eventType: LedgerEventType.SUBSCRIPTION_BILLED,
      currency: params.currency,
      actorId: params.sellerProfileId,
      reference: params.reference,
      notes: params.notes,
    });
  }

  private async findSubscriptionForWebhook(params: {
    reference?: string;
    subscriptionCode?: string;
    customerCode?: string;
    planCode?: string;
    sellerProfileId?: string;
  }): Promise<SellerSubscription | null> {
    const where: Array<Partial<SellerSubscription>> = [];

    if (params.reference) {
      where.push({ checkoutReference: params.reference });
      where.push({ latestChargeReference: params.reference });
    }

    if (params.subscriptionCode) {
      where.push({ paystackSubscriptionCode: params.subscriptionCode });
    }

    if (params.customerCode) {
      where.push({ paystackCustomerCode: params.customerCode });
    }

    if (params.planCode) {
      where.push({ paystackPlanCode: params.planCode });
    }

    if (params.sellerProfileId) {
      where.push({ sellerProfileId: params.sellerProfileId });
    }

    if (where.length === 0) {
      return null;
    }

    return this.subscriptionRepo.findOne({
      where,
      relations: ['tier'],
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  private async finalizeSubscriptionCharge(
    subscription: SellerSubscription,
    verifyResponse: PaystackVerifyResponse,
  ): Promise<SellerSubscription> {
    const tier =
      subscription.tier ?? (await this.getTierOrThrow(subscription.tierId));
    const expectedAmountKobo = Math.round(Number(tier.monthlyPrice) * 100);

    if (
      subscription.status === SellerSubscriptionStatus.PENDING &&
      subscription.checkoutReference !== verifyResponse.reference
    ) {
      throw new BadRequestException('Subscription payment reference mismatch');
    }

    if (verifyResponse.currency !== tier.currency) {
      throw new BadRequestException('Subscription currency mismatch');
    }

    if (verifyResponse.status !== 'success') {
      if (subscription.status === SellerSubscriptionStatus.PENDING) {
        return this.subscriptionRepo.save({
          ...subscription,
          status: SellerSubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
          latestChargeReference: verifyResponse.reference,
        });
      }

      return subscription;
    }

    if (verifyResponse.amount !== expectedAmountKobo) {
      throw new BadRequestException('Subscription billing amount mismatch');
    }

    if (
      subscription.status === SellerSubscriptionStatus.ACTIVE &&
      subscription.latestChargeReference === verifyResponse.reference
    ) {
      return subscription;
    }

    await this.cancelSupersededSubscriptions(
      subscription.sellerProfileId,
      subscription.id,
    );

    const paidAt = new Date(verifyResponse.paid_at);
    const renewalBaseDate =
      subscription.endsAt && subscription.endsAt > paidAt
        ? subscription.endsAt
        : paidAt;
    const updatedSubscription = await this.subscriptionRepo.save({
      ...subscription,
      status: SellerSubscriptionStatus.ACTIVE,
      startsAt:
        subscription.status === SellerSubscriptionStatus.PENDING
          ? paidAt
          : subscription.startsAt,
      endsAt: this.addOneMonth(renewalBaseDate),
      paystackPlanCode:
        verifyResponse.plan?.plan_code ??
        subscription.paystackPlanCode ??
        tier.paystackPlanCode,
      paystackCustomerCode:
        verifyResponse.customer?.customer_code ??
        subscription.paystackCustomerCode,
      paystackSubscriptionCode:
        verifyResponse.subscription?.subscription_code ??
        subscription.paystackSubscriptionCode,
      paystackEmailToken:
        verifyResponse.subscription?.email_token ??
        subscription.paystackEmailToken,
      latestChargeReference: verifyResponse.reference,
      lastBilledAt: paidAt,
      billedAmountNgn: verifyResponse.amount / 100,
    });

    await this.recordSubscriptionLedgerEntry({
      sellerProfileId: updatedSubscription.sellerProfileId,
      reference: verifyResponse.reference,
      amountNgn: verifyResponse.amount / 100,
      currency: verifyResponse.currency,
      notes: `Seller subscription charge recorded for ${tier.displayName}`,
    });

    return updatedSubscription;
  }

  private async processSubscriptionChargePayload(
    payload: PaystackWebhookPayload,
  ): Promise<boolean> {
    const data = this.getObject(payload, 'data');
    const metadata = this.getObject(data, 'metadata');
    const reference = this.getString(data, 'reference');
    const flow = this.getString(metadata, 'flow');
    const sellerProfileId = this.getString(metadata, 'seller_profile_id');
    const subscriptionCode =
      this.getNestedString(data, ['subscription', 'subscription_code']) ??
      this.getString(data, 'subscription_code');
    const customerCode =
      this.getNestedString(data, ['customer', 'customer_code']) ??
      this.getString(data, 'customer_code');
    const planCode =
      this.getNestedString(data, ['plan', 'plan_code']) ??
      this.getString(data, 'plan_code');

    if (
      flow !== 'seller_subscription' &&
      !subscriptionCode &&
      !customerCode &&
      !planCode
    ) {
      return false;
    }

    const subscription = await this.findSubscriptionForWebhook({
      reference,
      subscriptionCode,
      customerCode,
      planCode,
      sellerProfileId,
    });

    if (!subscription || !reference) {
      return false;
    }

    if (
      subscription.status === SellerSubscriptionStatus.ACTIVE &&
      subscription.latestChargeReference === reference
    ) {
      return true;
    }

    const verifyResponse =
      await this.paystackService.verifyTransaction(reference);
    await this.finalizeSubscriptionCharge(subscription, verifyResponse);
    return true;
  }

  private async applySubscriptionMetadataFromWebhook(
    payload: PaystackWebhookPayload,
  ): Promise<boolean> {
    const data = this.getObject(payload, 'data');
    const metadata = this.getObject(data, 'metadata');
    const reference = this.getString(data, 'reference');
    const sellerProfileId = this.getString(metadata, 'seller_profile_id');
    const subscriptionCode =
      this.getNestedString(data, ['subscription', 'subscription_code']) ??
      this.getString(data, 'subscription_code');
    const emailToken =
      this.getNestedString(data, ['subscription', 'email_token']) ??
      this.getString(data, 'email_token');
    const customerCode =
      this.getNestedString(data, ['customer', 'customer_code']) ??
      this.getString(data, 'customer_code');
    const planCode =
      this.getNestedString(data, ['plan', 'plan_code']) ??
      this.getString(data, 'plan_code');

    const subscription = await this.findSubscriptionForWebhook({
      reference,
      subscriptionCode,
      customerCode,
      planCode,
      sellerProfileId,
    });

    if (!subscription) {
      return false;
    }

    await this.subscriptionRepo.save({
      ...subscription,
      paystackSubscriptionCode:
        subscriptionCode ?? subscription.paystackSubscriptionCode,
      paystackEmailToken: emailToken ?? subscription.paystackEmailToken,
      paystackCustomerCode: customerCode ?? subscription.paystackCustomerCode,
      paystackPlanCode: planCode ?? subscription.paystackPlanCode,
    });

    return true;
  }

  private async markSubscriptionCancelledFromWebhook(
    payload: PaystackWebhookPayload,
  ): Promise<boolean> {
    const data = this.getObject(payload, 'data');
    const subscriptionCode =
      this.getNestedString(data, ['subscription', 'subscription_code']) ??
      this.getString(data, 'subscription_code');
    const customerCode =
      this.getNestedString(data, ['customer', 'customer_code']) ??
      this.getString(data, 'customer_code');
    const planCode =
      this.getNestedString(data, ['plan', 'plan_code']) ??
      this.getString(data, 'plan_code');

    const subscription = await this.findSubscriptionForWebhook({
      subscriptionCode,
      customerCode,
      planCode,
    });

    if (!subscription) {
      return false;
    }

    await this.subscriptionRepo.save({
      ...subscription,
      status: SellerSubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
    });

    return true;
  }

  private async applyInvoiceUpdate(
    payload: PaystackWebhookPayload,
  ): Promise<boolean> {
    const data = this.getObject(payload, 'data');
    const invoiceCode =
      this.getString(data, 'invoice_code') ?? this.getString(data, 'invoiceCode');
    const status = this.getString(data, 'status');
    const reference =
      this.getString(data, 'transaction_reference') ??
      this.getString(data, 'reference');
    const subscriptionCode =
      this.getNestedString(data, ['subscription', 'subscription_code']) ??
      this.getString(data, 'subscription_code');
    const customerCode =
      this.getNestedString(data, ['customer', 'customer_code']) ??
      this.getString(data, 'customer_code');
    const planCode =
      this.getNestedString(data, ['plan', 'plan_code']) ??
      this.getString(data, 'plan_code');

    const subscription = await this.findSubscriptionForWebhook({
      reference,
      subscriptionCode,
      customerCode,
      planCode,
    });

    if (!subscription) {
      return false;
    }

    await this.subscriptionRepo.save({
      ...subscription,
      lastInvoiceCode: invoiceCode ?? subscription.lastInvoiceCode,
    });

    if (status === 'success' && reference) {
      const verifyResponse =
        await this.paystackService.verifyTransaction(reference);
      await this.finalizeSubscriptionCharge(subscription, verifyResponse);
    }

    return true;
  }

  findAllTiers(): Promise<SubscriptionTier[]> {
    return this.tierRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  findTierById(id: string): Promise<SubscriptionTier | null> {
    return this.tierRepo.findOne({ where: { id } });
  }

  findTierByName(name: SubscriptionTierName): Promise<SubscriptionTier | null> {
    return this.tierRepo.findOne({ where: { name } });
  }

  getActiveSubscription(
    sellerProfileId: string,
  ): Promise<SellerSubscription | null> {
    return this.subscriptionRepo.findOne({
      where: {
        sellerProfileId,
        status: In([
          SellerSubscriptionStatus.ACTIVE,
          SellerSubscriptionStatus.TRIAL,
        ]),
      },
      relations: ['tier'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCurrentSubscriptionForUser(user: AuthenticatedUser) {
    const sellerProfileId = this.assertSeller(user);
    const subscription = await this.ensureBaselineSubscription(sellerProfileId);

    return {
      subscription,
      features: await this.getFeaturesForSeller(sellerProfileId),
    };
  }

  async getFeaturesForSeller(sellerProfileId: string): Promise<TierFeatures> {
    const sub = await this.getActiveSubscription(sellerProfileId);
    if (sub) return sub.tier.features;

    const freeTier = await this.findTierByName(SubscriptionTierName.FREE);
    if (!freeTier) throw new NotFoundException('FREE tier is not configured');
    return freeTier.features;
  }

  async activate(
    sellerProfileId: string,
    tierId: string,
    paystackSubscriptionCode?: string,
    billedAmountNgn?: number,
  ): Promise<SellerSubscription> {
    const tier = await this.getTierOrThrow(tierId);
    const now = new Date();
    const subscription = await this.subscriptionRepo.save(
      this.subscriptionRepo.create({
        sellerProfileId,
        tierId,
        paystackPlanCode: tier.paystackPlanCode,
        status:
          Number(tier.monthlyPrice) > 0
            ? SellerSubscriptionStatus.ACTIVE
            : SellerSubscriptionStatus.TRIAL,
        startsAt: now,
        endsAt: Number(tier.monthlyPrice) > 0 ? this.addOneMonth(now) : undefined,
        paystackSubscriptionCode,
        lastBilledAt: billedAmountNgn ? now : undefined,
        billedAmountNgn,
      }),
    );

    await this.cancelSupersededSubscriptions(sellerProfileId, subscription.id);

    return this.subscriptionRepo.findOneOrFail({
      where: { id: subscription.id },
      relations: ['tier'],
    });
  }

  async startFreeTrial(sellerProfileId: string): Promise<SellerSubscription> {
    const existingActive = await this.getActiveSubscription(sellerProfileId);
    if (existingActive) {
      return existingActive;
    }

    const freeTier = await this.findTierByName(SubscriptionTierName.FREE);
    if (!freeTier) throw new NotFoundException('FREE tier is not configured');

    const subscription = await this.subscriptionRepo.save(
      this.subscriptionRepo.create({
        sellerProfileId,
        tierId: freeTier.id,
        status: SellerSubscriptionStatus.TRIAL,
        startsAt: new Date(),
      }),
    );

    return this.subscriptionRepo.findOneOrFail({
      where: { id: subscription.id },
      relations: ['tier'],
    });
  }

  async initializeCheckout(
    user: AuthenticatedUser,
    tierId: string,
    dto: InitializeSubscriptionCheckoutDto,
  ) {
    const sellerProfileId = this.assertSeller(user);
    const tier = await this.getTierOrThrow(tierId);
    const currentSubscription = await this.ensureBaselineSubscription(
      sellerProfileId,
    );

    if (!tier.isActive) {
      throw new BadRequestException('Selected subscription tier is not active');
    }

    if (Number(tier.monthlyPrice) <= 0) {
      const freeSubscription = await this.activate(sellerProfileId, tier.id);
      return {
        requiresPayment: false,
        subscription: freeSubscription,
      };
    }

    if (
      currentSubscription.status === SellerSubscriptionStatus.ACTIVE &&
      currentSubscription.tierId === tier.id
    ) {
      return {
        requiresPayment: false,
        subscription: currentSubscription,
      };
    }

    const idempotencyKey =
      dto.idempotencyKey?.trim() || this.generateIdempotencyKey();
    const existingPending = await this.subscriptionRepo.findOne({
      where: {
        sellerProfileId,
        status: SellerSubscriptionStatus.PENDING,
        idempotencyKey,
      },
      relations: ['tier'],
    });

    if (existingPending) {
      return {
        requiresPayment: true,
        subscription: existingPending,
        authorizationUrl: existingPending.checkoutAuthorizationUrl,
        reference: existingPending.checkoutReference,
      };
    }

    const seller = await this.usersService.findById(user.id);
    const paystackTier = await this.ensureTierPlan(tier);
    const reference = this.generateReference(paystackTier.name);
    const initialized =
      await this.paystackService.initializeTransaction({
        email: seller?.email ?? user.email,
        amountKobo: Math.round(Number(paystackTier.monthlyPrice) * 100),
        currency: paystackTier.currency,
        reference,
        callbackUrl: dto.callbackUrl,
        planCode: paystackTier.paystackPlanCode,
        sellerProfileId,
        metadata: {
          flow: 'seller_subscription',
          seller_profile_id: sellerProfileId,
          subscription_tier_id: paystackTier.id,
          subscription_tier_name: paystackTier.name,
          subscription_plan_code: paystackTier.paystackPlanCode,
        },
      });

    const pendingSubscription = await this.subscriptionRepo.save(
      this.subscriptionRepo.create({
        sellerProfileId,
        tierId: paystackTier.id,
        paystackPlanCode: paystackTier.paystackPlanCode,
        status: SellerSubscriptionStatus.PENDING,
        startsAt: new Date(),
        billedAmountNgn: Number(paystackTier.monthlyPrice),
        checkoutReference: initialized.reference,
        checkoutAuthorizationUrl: initialized.authorization_url,
        idempotencyKey,
      }),
    );

    return {
      requiresPayment: true,
      subscription: await this.subscriptionRepo.findOneOrFail({
        where: { id: pendingSubscription.id },
        relations: ['tier'],
      }),
      authorizationUrl: initialized.authorization_url,
      accessCode: initialized.access_code,
      reference: initialized.reference,
    };
  }

  async verifyCheckout(
    user: AuthenticatedUser,
    dto: VerifySubscriptionPaymentDto,
  ) {
    const sellerProfileId = this.assertSeller(user);
    const subscription = await this.findSubscriptionByReference(
      dto.reference,
      sellerProfileId,
    );

    if (!subscription) {
      throw new NotFoundException(
        `Seller subscription checkout ${dto.reference} not found`,
      );
    }

    const verifyResponse =
      await this.paystackService.verifyTransaction(dto.reference);
    const updatedSubscription = await this.finalizeSubscriptionCharge(
      subscription,
      verifyResponse,
    );

    return {
      subscription: updatedSubscription,
      paystack: verifyResponse,
    };
  }

  async cancelCurrentSubscription(user: AuthenticatedUser) {
    const sellerProfileId = this.assertSeller(user);
    const current = await this.getActiveSubscription(sellerProfileId);

    if (!current) {
      throw new NotFoundException('No active seller subscription found');
    }

    if (current.paystackSubscriptionCode && current.paystackEmailToken) {
      await this.paystackService.disableSubscription({
        code: current.paystackSubscriptionCode,
        token: current.paystackEmailToken,
      });
    }

    return this.subscriptionRepo.save({
      ...current,
      status: SellerSubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
    });
  }

  async processPaystackWebhook(
    eventType: string,
    payload: PaystackWebhookPayload,
  ): Promise<boolean> {
    switch (eventType) {
      case 'charge.success':
        return this.processSubscriptionChargePayload(payload);
      case 'subscription.create':
        return this.applySubscriptionMetadataFromWebhook(payload);
      case 'subscription.disable':
        return this.markSubscriptionCancelledFromWebhook(payload);
      case 'invoice.update':
      case 'invoice.payment_failed':
        return this.applyInvoiceUpdate(payload);
      default:
        return false;
    }
  }

  async syncTierPlan(id: string): Promise<SubscriptionTier> {
    const tier = await this.getTierOrThrow(id);
    return this.ensureTierPlan(tier);
  }

  async upsertTier(dto: UpsertSubscriptionTierDto): Promise<SubscriptionTier> {
    const existing = await this.tierRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      await this.tierRepo.update(existing.id, {
        displayName: dto.displayName,
        description: dto.description,
        monthlyPrice: dto.monthlyPrice,
        currency: dto.currency,
        features: dto.features,
        isActive: dto.isActive ?? existing.isActive,
        sortOrder: dto.sortOrder ?? existing.sortOrder,
      });
      return this.tierRepo.findOneOrFail({ where: { id: existing.id } });
    }
    return this.tierRepo.save(
      this.tierRepo.create({
        name: dto.name,
        displayName: dto.displayName,
        description: dto.description,
        monthlyPrice: dto.monthlyPrice,
        currency: dto.currency,
        features: dto.features,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      }),
    );
  }

  async updateTier(
    id: string,
    dto: UpdateSubscriptionTierDto,
  ): Promise<SubscriptionTier> {
    const tier = await this.tierRepo.findOne({ where: { id } });
    if (!tier) throw new NotFoundException(`Tier ${id} not found`);

    await this.tierRepo.update(id, {
      ...(dto.displayName !== undefined && { displayName: dto.displayName }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.monthlyPrice !== undefined && { monthlyPrice: dto.monthlyPrice }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.features !== undefined && {
        features: { ...tier.features, ...dto.features },
      }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    });
    return this.tierRepo.findOneOrFail({ where: { id } });
  }

  findAllTiersAdmin(): Promise<SubscriptionTier[]> {
    return this.tierRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async seedDefaultTiers(): Promise<void> {
    const existing = await this.tierRepo.count();
    if (existing > 0) return;

    const currency = this.platformConfig.getCurrency();

    const defaults: Partial<SubscriptionTier>[] = [
      {
        name: SubscriptionTierName.FREE,
        displayName: 'Free',
        description: 'Get started with basic seller tools.',
        monthlyPrice: 0,
        currency,
        sortOrder: 0,
        features: {
          maxProducts: 10,
          maxMediaPerProduct: 3,
          feedPostsEnabled: true,
          chatEnabled: true,
          analyticsEnabled: false,
          priorityListing: false,
          discountCampaignsEnabled: false,
          monthlyPayoutRequests: 2,
          customDomainEnabled: false,
          commissionRatePercent: null,
        },
      },
      {
        name: SubscriptionTierName.BASIC,
        displayName: 'Basic',
        description: 'More listings, analytics, and increased payout access.',
        monthlyPrice: 5000,
        currency,
        sortOrder: 1,
        features: {
          maxProducts: 100,
          maxMediaPerProduct: 6,
          feedPostsEnabled: true,
          chatEnabled: true,
          analyticsEnabled: true,
          priorityListing: false,
          discountCampaignsEnabled: true,
          monthlyPayoutRequests: 8,
          customDomainEnabled: false,
          commissionRatePercent: null,
        },
      },
      {
        name: SubscriptionTierName.PRO,
        displayName: 'Pro',
        description:
          'Priority listing, unlimited products, full payout access.',
        monthlyPrice: 15000,
        currency,
        sortOrder: 2,
        features: {
          maxProducts: -1,
          maxMediaPerProduct: 10,
          feedPostsEnabled: true,
          chatEnabled: true,
          analyticsEnabled: true,
          priorityListing: true,
          discountCampaignsEnabled: true,
          monthlyPayoutRequests: -1,
          customDomainEnabled: false,
          commissionRatePercent: null,
        },
      },
      {
        name: SubscriptionTierName.ENTERPRISE,
        displayName: 'Enterprise',
        description: 'Custom domain, dedicated support, lowest commission.',
        monthlyPrice: 50000,
        currency,
        sortOrder: 3,
        features: {
          maxProducts: -1,
          maxMediaPerProduct: 20,
          feedPostsEnabled: true,
          chatEnabled: true,
          analyticsEnabled: true,
          priorityListing: true,
          discountCampaignsEnabled: true,
          monthlyPayoutRequests: -1,
          customDomainEnabled: true,
          commissionRatePercent: null,
        },
      },
    ];

    await this.tierRepo.save(defaults.map((d) => this.tierRepo.create(d)));
  }
}
