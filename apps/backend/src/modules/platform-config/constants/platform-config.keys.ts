/**
 * Well-known platform configuration keys stored in the database.
 * These are RUNTIME-MUTABLE business rules managed by admin via the API.
 *
 * Market-identity values (currency, country code, market name, platform name)
 * are NOT here — they are deploy-time env vars (PLATFORM_CURRENCY, etc.)
 * and must never be changed on a live database with existing financial records.
 */
export const PlatformConfigKey = {
  // ─── Financial ─────────────────────────────────────────────────
  /** Default platform commission % applied when no tier override exists (e.g. "10") */
  DEFAULT_COMMISSION_RATE: 'platform.commission_rate_default_percent',
  /** Platform-wide return window in days (e.g. "7") */
  RETURN_POLICY_DAYS: 'platform.return_policy_days',
  /** Minimum payout amount in the platform currency (e.g. "1000") */
  MIN_PAYOUT_AMOUNT: 'platform.min_payout_amount',

  // ─── Payment ───────────────────────────────────────────────────
  /** Comma-separated supported payment gateway IDs (e.g. "paystack") */
  SUPPORTED_PAYMENT_GATEWAYS: 'platform.supported_payment_gateways',
  /** Default buyer checkout provider (e.g. "paystack" or "monnify") */
  DEFAULT_CHECKOUT_PROVIDER: 'payments.checkout.default_provider',
  /** Default seller payout provider (e.g. "paystack" or "monnify") */
  DEFAULT_PAYOUT_PROVIDER: 'payouts.default_provider',

  // ─── Support ───────────────────────────────────────────────────
  /** Support email address */
  SUPPORT_EMAIL: 'platform.support_email',

  // Feature flags
  FEATURE_FEED_ENABLED: 'features.feed.enabled',
  FEATURE_CHAT_ENABLED: 'features.chat.enabled',
  FEATURE_MEDIA_CATALOG_IMAGES_ENABLED: 'features.media.catalog.images.enabled',
  FEATURE_MEDIA_CATALOG_VIDEO_ENABLED: 'features.media.catalog.video.enabled',
  FEATURE_MEDIA_FEED_IMAGES_ENABLED: 'features.media.feed.images.enabled',
  FEATURE_MEDIA_FEED_VIDEO_ENABLED: 'features.media.feed.video.enabled',
} as const;

export type PlatformConfigKeyType =
  (typeof PlatformConfigKey)[keyof typeof PlatformConfigKey];
