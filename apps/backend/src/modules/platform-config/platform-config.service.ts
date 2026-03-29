import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformConfig } from './entities/platform-config.entity';
import {
  PlatformConfigKey,
  PlatformConfigKeyType,
} from './constants/platform-config.keys';
import { PaymentProvider } from '../payments/enums/payment-provider.enum';

@Injectable()
export class PlatformConfigService implements OnModuleInit {
  private readonly logger = new Logger(PlatformConfigService.name);

  /** In-process cache — invalidated on every write. For multi-instance deploys, use Redis. */
  private cache = new Map<string, string>();

  constructor(
    @InjectRepository(PlatformConfig)
    private readonly configRepo: Repository<PlatformConfig>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaults();
    await this.warmCache();
  }

  // ─── Market identity (env vars — read-only, set at deploy time) ──────────

  /**
   * ISO 4217 currency code for this deployment (e.g. "NGN").
   * Source: PLATFORM_CURRENCY env var. Never stored in the DB.
   */
  getCurrency(): string {
    return this.configService.get<string>('market.currency') ?? 'NGN';
  }

  /**
   * ISO 3166-1 alpha-2 country code for this deployment (e.g. "NG").
   * Source: PLATFORM_COUNTRY_CODE env var.
   */
  getCountryCode(): string {
    return this.configService.get<string>('market.countryCode') ?? 'NG';
  }

  /**
   * Human-readable market name (e.g. "Nigeria").
   * Source: PLATFORM_MARKET_NAME env var.
   */
  getMarketName(): string {
    return this.configService.get<string>('market.marketName') ?? 'Nigeria';
  }

  /**
   * Platform display name (e.g. "Rands").
   * Source: PLATFORM_NAME env var.
   */
  getPlatformName(): string {
    return this.configService.get<string>('market.platformName') ?? 'Rands';
  }

  // ─── Business rules (DB-backed, admin-configurable at runtime) ───────────

  /** Get a raw string value from DB. Returns undefined if key not found. */
  async get(key: PlatformConfigKeyType | string): Promise<string | undefined> {
    if (this.cache.has(key)) return this.cache.get(key);
    const row = await this.configRepo.findOne({ where: { key } });
    if (row) this.cache.set(key, row.value);
    return row?.value;
  }

  /** Get with a fallback — throws if no value AND no fallback */
  async getOrFail(key: PlatformConfigKeyType | string): Promise<string> {
    const value = await this.get(key);
    if (value === undefined)
      throw new NotFoundException(`Platform config key "${key}" is not set`);
    return value;
  }

  async getBoolean(
    key: PlatformConfigKeyType | string,
    fallback: boolean,
  ): Promise<boolean> {
    const raw = await this.get(key);
    if (raw === undefined) {
      return fallback;
    }

    return raw === 'true';
  }

  async getDefaultCommissionRate(): Promise<number> {
    const raw = await this.get(PlatformConfigKey.DEFAULT_COMMISSION_RATE);
    return raw !== undefined ? parseFloat(raw) : 10;
  }

  async getReturnPolicyDays(): Promise<number> {
    const raw = await this.get(PlatformConfigKey.RETURN_POLICY_DAYS);
    return raw !== undefined ? parseInt(raw, 10) : 7;
  }

  async getMinPayoutAmount(): Promise<number> {
    const raw = await this.get(PlatformConfigKey.MIN_PAYOUT_AMOUNT);
    return raw !== undefined ? parseFloat(raw) : 1000;
  }

  async getSupportedPaymentGateways(): Promise<PaymentProvider[]> {
    const raw = await this.get(PlatformConfigKey.SUPPORTED_PAYMENT_GATEWAYS);
    const providers = (raw ?? PaymentProvider.PAYSTACK)
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
      .filter(
        (value): value is PaymentProvider =>
          value === PaymentProvider.PAYSTACK ||
          value === PaymentProvider.MONNIFY,
      );

    return providers.length > 0 ? providers : [PaymentProvider.PAYSTACK];
  }

  async getDefaultCheckoutProvider(): Promise<PaymentProvider> {
    const raw = await this.get(PlatformConfigKey.DEFAULT_CHECKOUT_PROVIDER);
    return raw === PaymentProvider.MONNIFY
      ? PaymentProvider.MONNIFY
      : PaymentProvider.PAYSTACK;
  }

  async getDefaultPayoutProvider(): Promise<PaymentProvider> {
    const raw = await this.get(PlatformConfigKey.DEFAULT_PAYOUT_PROVIDER);
    return raw === PaymentProvider.MONNIFY
      ? PaymentProvider.MONNIFY
      : PaymentProvider.PAYSTACK;
  }

  /**
   * Public config — merges env-sourced market identity with DB-sourced public business rules.
   * Safe to expose to the frontend.
   */
  async findPublicConfigs(): Promise<Array<{ key: string; value: string }>> {
    const dbPublic = await this.configRepo.find({ where: { isPublic: true } });

    const marketIdentity = [
      { key: 'platform.currency', value: this.getCurrency() },
      { key: 'platform.country_code', value: this.getCountryCode() },
      { key: 'platform.market_name', value: this.getMarketName() },
      { key: 'platform.name', value: this.getPlatformName() },
    ];

    return [
      ...marketIdentity,
      ...dbPublic.map((r) => ({ key: r.key, value: r.value })),
    ];
  }

  // ─── Admin: Write ────────────────────────────────────────────────────────

  findAll(): Promise<PlatformConfig[]> {
    return this.configRepo.find({ order: { key: 'ASC' } });
  }

  async set(
    key: string,
    value: string,
    description?: string,
    isPublic = false,
  ): Promise<PlatformConfig> {
    const existing = await this.configRepo.findOne({ where: { key } });
    if (existing) {
      await this.configRepo.update(existing.id, {
        value,
        ...(description !== undefined && { description }),
        isPublic,
      });
      this.cache.set(key, value);
      return this.configRepo.findOneOrFail({ where: { key } });
    }
    const created = await this.configRepo.save(
      this.configRepo.create({ key, value, description, isPublic }),
    );
    this.cache.set(key, value);
    return created;
  }

  async delete(key: string): Promise<void> {
    await this.configRepo.delete({ key });
    this.cache.delete(key);
  }

  // ─── Internal ────────────────────────────────────────────────────────────

  private async warmCache(): Promise<void> {
    const all = await this.configRepo.find();
    for (const row of all) {
      this.cache.set(row.key, row.value);
    }
    this.logger.log(
      `PlatformConfig: loaded ${all.length} business-rule keys into cache`,
    );
    this.logger.log(
      `PlatformConfig: market identity — currency=${this.getCurrency()} country=${this.getCountryCode()} market="${this.getMarketName()}"`,
    );
  }

  /**
   * Bootstrap business-rule defaults — only runs once when the DB table is empty.
   * Market identity (currency, country, etc.) is NOT seeded here — it comes from env vars.
   */
  private async seedDefaults(): Promise<void> {
    const defaults: Array<{
      key: string;
      value: string;
      description: string;
      isPublic: boolean;
    }> = [
      {
        key: PlatformConfigKey.DEFAULT_COMMISSION_RATE,
        value: '10',
        description:
          'Default platform commission % applied when a seller tier has no override. Numeric string.',
        isPublic: false,
      },
      {
        key: PlatformConfigKey.RETURN_POLICY_DAYS,
        value: '7',
        description: 'Platform-wide return window in days',
        isPublic: true,
      },
      {
        key: PlatformConfigKey.MIN_PAYOUT_AMOUNT,
        value: '1000',
        description: 'Minimum payout amount in the platform currency',
        isPublic: false,
      },
      {
        key: PlatformConfigKey.SUPPORTED_PAYMENT_GATEWAYS,
        value: 'paystack,monnify',
        description:
          'Comma-separated payment gateway IDs active on the platform',
        isPublic: false,
      },
      {
        key: PlatformConfigKey.DEFAULT_CHECKOUT_PROVIDER,
        value: PaymentProvider.PAYSTACK,
        description:
          'Default provider used for buyer checkout initialization',
        isPublic: false,
      },
      {
        key: PlatformConfigKey.DEFAULT_PAYOUT_PROVIDER,
        value: PaymentProvider.PAYSTACK,
        description:
          'Default provider used for seller payout disbursement',
        isPublic: false,
      },
      {
        key: PlatformConfigKey.SUPPORT_EMAIL,
        value: 'support@rands.ng',
        description: 'Platform support email shown to users',
        isPublic: true,
      },
      {
        key: PlatformConfigKey.FEATURE_FEED_ENABLED,
        value: 'true',
        description: 'Enable seller feed posting platform-wide',
        isPublic: true,
      },
      {
        key: PlatformConfigKey.FEATURE_CHAT_ENABLED,
        value: 'true',
        description: 'Enable buyer-seller chat platform-wide',
        isPublic: true,
      },
      {
        key: PlatformConfigKey.FEATURE_MEDIA_CATALOG_IMAGES_ENABLED,
        value: 'true',
        description: 'Enable catalog image uploads platform-wide',
        isPublic: true,
      },
      {
        key: PlatformConfigKey.FEATURE_MEDIA_CATALOG_VIDEO_ENABLED,
        value: 'false',
        description: 'Enable catalog video uploads platform-wide',
        isPublic: true,
      },
      {
        key: PlatformConfigKey.FEATURE_MEDIA_FEED_IMAGES_ENABLED,
        value: 'true',
        description: 'Enable feed image uploads platform-wide',
        isPublic: true,
      },
      {
        key: PlatformConfigKey.FEATURE_MEDIA_FEED_VIDEO_ENABLED,
        value: 'false',
        description: 'Enable feed video uploads platform-wide',
        isPublic: true,
      },
    ];

    const existing = await this.configRepo.find({
      select: ['key'],
    });
    const existingKeys = new Set(existing.map((row) => row.key));
    const missingDefaults = defaults.filter((item) => !existingKeys.has(item.key));

    if (missingDefaults.length === 0) {
      return;
    }

    await this.configRepo.save(
      missingDefaults.map((d) => this.configRepo.create(d)),
    );
    this.logger.log(
      `PlatformConfig: seeded ${missingDefaults.length} missing business-rule keys`,
    );
  }
}
