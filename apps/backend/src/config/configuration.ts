export default () => ({
  app: {
    name: process.env['APP_NAME'] ?? 'rands-api',
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    env: process.env['NODE_ENV'] ?? 'development',
    baseUrl: process.env['APP_BASE_URL'] ?? 'http://localhost:3000',
    corsOrigins: (process.env['CORS_ORIGINS'] ?? 'http://localhost:3000').split(
      ',',
    ),
  },
  database: {
    host: process.env['DB_HOST'] ?? 'localhost',
    port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
    username: process.env['DB_USERNAME'] ?? 'rands',
    password: process.env['DB_PASSWORD'] ?? 'rands_secret',
    name: process.env['DB_NAME'] ?? 'rands_db',
    synchronize: process.env['DB_SYNCHRONIZE'] === 'true',
    logging: process.env['DB_LOGGING'] === 'true',
  },
  redis: {
    host: process.env['REDIS_HOST'] ?? 'localhost',
    port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
    password: process.env['REDIS_PASSWORD'] ?? undefined,
  },
  jwt: {
    accessSecret: process.env['JWT_ACCESS_SECRET'] ?? 'fallback_access_secret',
    refreshSecret:
      process.env['JWT_REFRESH_SECRET'] ?? 'fallback_refresh_secret',
    accessExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
  },
  mail: {
    from: process.env['MAIL_FROM'] ?? 'no-reply@rands.local',
    smtpHost: process.env['SMTP_HOST'] ?? '',
    smtpPort: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
    smtpUser: process.env['SMTP_USER'] ?? '',
    smtpPass: process.env['SMTP_PASS'] ?? '',
    smtpSecure: process.env['SMTP_SECURE'] === 'true',
    frontendBaseUrl:
      process.env['FRONTEND_BASE_URL'] ?? 'http://localhost:3001',
  },
  paystack: {
    secretKey: process.env['PAYSTACK_SECRET_KEY'] ?? '',
    publicKey: process.env['PAYSTACK_PUBLIC_KEY'] ?? '',
    webhookSecret: process.env['PAYSTACK_WEBHOOK_SECRET'] ?? '',
    baseUrl: process.env['PAYSTACK_BASE_URL'] ?? 'https://api.paystack.co',
  },
  throttle: {
    ttl: parseInt(process.env['THROTTLE_TTL'] ?? '60', 10),
    limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '100', 10),
  },
  /**
   * Market identity — set once in .env at deploy time.
   * NEVER change these on a live database with existing ledger/order/payment data.
   * Each market deployment (NG, GH, KE, etc.) gets its own instance + database.
   */
  market: {
    currency: process.env['PLATFORM_CURRENCY'] ?? 'NGN',
    countryCode: process.env['PLATFORM_COUNTRY_CODE'] ?? 'NG',
    marketName: process.env['PLATFORM_MARKET_NAME'] ?? 'Nigeria',
    platformName: process.env['PLATFORM_NAME'] ?? 'Rands',
  },
});
