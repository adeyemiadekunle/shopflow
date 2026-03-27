import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionTier } from './entities/subscription-tier.entity';
import { SellerSubscription } from './entities/seller-subscription.entity';
import {
  SellerSubscriptionStatus,
  SubscriptionTierName,
} from './enums/subscription.enum';
import type { TierFeatures } from './types/tier-features.interface';
import {
  UpdateSubscriptionTierDto,
  UpsertSubscriptionTierDto,
} from './dto/upsert-subscription-tier.dto';
import { PlatformConfigService } from '../platform-config/platform-config.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionTier)
    private readonly tierRepo: Repository<SubscriptionTier>,
    @InjectRepository(SellerSubscription)
    private readonly subscriptionRepo: Repository<SellerSubscription>,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  // ─── Public / Seller-facing ────────────────────────────────────────────────

  /** All active tiers ordered by sort_order (for pricing page) */
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

  /** Get a seller's current active subscription (includes tier) */
  getActiveSubscription(
    sellerProfileId: string,
  ): Promise<SellerSubscription | null> {
    return this.subscriptionRepo.findOne({
      where: { sellerProfileId, status: SellerSubscriptionStatus.ACTIVE },
      relations: ['tier'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Resolve effective feature flags for a seller — falls back to FREE tier */
  async getFeaturesForSeller(sellerProfileId: string): Promise<TierFeatures> {
    const sub = await this.getActiveSubscription(sellerProfileId);
    if (sub) return sub.tier.features;

    const freeTier = await this.findTierByName(SubscriptionTierName.FREE);
    if (!freeTier) throw new NotFoundException('FREE tier is not configured');
    return freeTier.features;
  }

  /**
   * Activate a subscription for a seller.
   * Called after Paystack payment is confirmed.
   */
  async activate(
    sellerProfileId: string,
    tierId: string,
    paystackSubscriptionCode?: string,
    billedAmountNgn?: number,
  ): Promise<SellerSubscription> {
    await this.subscriptionRepo.update(
      { sellerProfileId, status: SellerSubscriptionStatus.ACTIVE },
      { status: SellerSubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    );

    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setMonth(endsAt.getMonth() + 1);

    return this.subscriptionRepo.save(
      this.subscriptionRepo.create({
        sellerProfileId,
        tierId,
        status: SellerSubscriptionStatus.ACTIVE,
        startsAt: now,
        endsAt,
        paystackSubscriptionCode,
        lastBilledAt: now,
        billedAmountNgn,
      }),
    );
  }

  /** Start a seller on the FREE tier immediately after onboarding */
  async startFreeTrial(sellerProfileId: string): Promise<SellerSubscription> {
    const freeTier = await this.findTierByName(SubscriptionTierName.FREE);
    if (!freeTier) throw new NotFoundException('FREE tier is not configured');

    return this.subscriptionRepo.save(
      this.subscriptionRepo.create({
        sellerProfileId,
        tierId: freeTier.id,
        status: SellerSubscriptionStatus.ACTIVE,
        startsAt: new Date(),
      }),
    );
  }

  // ─── Admin: Tier Management ───────────────────────────────────────────────

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

  /** All tiers including inactive — admin view */
  findAllTiersAdmin(): Promise<SubscriptionTier[]> {
    return this.tierRepo.find({ order: { sortOrder: 'ASC' } });
  }

  /**
   * Seed bootstrap defaults — runs once if no tiers exist.
   * Currency is read from PLATFORM_CURRENCY env var via PlatformConfigService — not hardcoded.
   * All values are updateable via PATCH /subscriptions/admin/tiers/:id.
   */
  async seedDefaultTiers(): Promise<void> {
    const existing = await this.tierRepo.count();
    if (existing > 0) return;

    // Always read from platform config — never hardcode currencies or amounts
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
