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

  // ─── Support ───────────────────────────────────────────────────
  /** Support email address */
  SUPPORT_EMAIL: 'platform.support_email',
} as const;

export type PlatformConfigKeyType =
  (typeof PlatformConfigKey)[keyof typeof PlatformConfigKey];
