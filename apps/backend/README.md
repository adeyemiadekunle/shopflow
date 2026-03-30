# Shopflow Backend — NestJS API

Production-grade NestJS backend for the Shopflow social ecommerce platform.

> For full project documentation see the [root README](../../README.md).

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start dev server (watch mode)
npm run start:dev
```

- **API:** `http://localhost:3000/api/v1`
- **Health:** `http://localhost:3000/health`
- **Queue Health:** `http://localhost:3000/health/queues`
- **Metrics:** `http://localhost:3000/api/v1/metrics`
- **Swagger:** `http://localhost:3000/api-docs`
<<<<<<< HEAD
- **Grafana Queue Dashboard:** `Rands / Queue Monitoring`
- **Grafana API Dashboard:** `Rands / API and Payments Overview`
=======
- **Grafana Queue Dashboard:** `Shopflow / Queue Monitoring`
- **Grafana API Dashboard:** `Shopflow / API and Payments Overview`
>>>>>>> 2ed2340 (feat: expand shopflow platform and frontend)

## Commands

```bash
npm run start:dev    # Dev server (watch)
npm run build        # Production build
npm run start:prod   # Start production build
npm run db:migrate   # Run DB migrations
npm run db:migrate:revert # Revert latest migration
npm test             # Unit tests
npm run test:cov     # Test coverage
npm run lint         # ESLint
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `DB_HOST` / `DB_PORT` | PostgreSQL host and port |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | PostgreSQL credentials and database |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection |
| `JWT_ACCESS_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `APP_BASE_URL` | Backend base URL |
| `MAIL_FROM` / `SMTP_*` | SMTP sender and transport settings |
| `FRONTEND_BASE_URL` | Frontend URL used in email links |
| `AWS_REGION` | AWS region for S3 uploads |
| `AWS_S3_BUCKET` | S3 bucket for catalog and feed uploads |
| `AWS_CLOUDFRONT_BASE_URL` | CloudFront base URL for public media |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS credentials used to generate presigned upload URLs |
| `MEDIA_PRESIGN_EXPIRES_IN_SECONDS` | Presigned upload URL lifetime |
| `MEDIA_ALLOW_VIDEO_UPLOADS` | Enable video uploads after the image-first rollout is stable |
| `PAYSTACK_SECRET_KEY` | Paystack API secret |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook HMAC secret |
| `MONNIFY_API_KEY` / `MONNIFY_SECRET_KEY` | Monnify API credentials |
| `MONNIFY_CONTRACT_CODE` | Monnify contract code used for checkout |
| `MONNIFY_WALLET_ACCOUNT_NUMBER` | Monnify source wallet/account for payouts |
| `MONNIFY_BASE_URL` | Monnify API base URL |
| `PLATFORM_CURRENCY` | ISO 4217 code for this deployment (e.g. `NGN`) |
| `PLATFORM_COUNTRY_CODE` | ISO 3166-1 alpha-2 (e.g. `NG`) |
| `PLATFORM_MARKET_NAME` | Market name (e.g. `Nigeria`) |
| `PLATFORM_NAME` | Platform display name (e.g. `Shopflow`) |

> `PLATFORM_*` vars are set once at deploy time and must not be changed on a live database. Business-rule settings (commission rate, return policy, etc.) remain configurable via the Admin API.

Provider routing rules:

- admin sets buyer checkout default with `payments.checkout.default_provider`
- admin sets seller payout default with `payouts.default_provider`
- each payment, payout, and refund stores the provider actually used
- refunds must use the same provider as the original payment

Feature rollout model:

- infrastructure capability is controlled by env when needed
- platform live/on-off switches are controlled by admin through platform config
- current gated seller features: feed posting, chat, catalog video uploads, and feed video uploads

## Modules

| Module | Base path | Description |
|---|---|---|
| auth | `/auth` | Register, login, refresh, email verification, password reset, admin creation with password complexity rules and tighter auth throttles |
| users | `/users` | User accounts, roles |
| sellers | `/sellers` | Profiles, KYC (NIN/BVN), bank accounts |
| catalog | `/catalog` | Products, variants, media, categories, discounts |
| media | `/media` | Presigned S3 upload URLs for seller catalog/feed media with CloudFront delivery |
| orders | `/orders` | Buyer order creation, seller quoting, delivery progression, disputes, and scoped order access |
| payments | `/payments` | Provider-configurable checkout init, verify, webhook handling, and admin reconciliation reporting |
| payouts | `/payouts` | Admin-managed seller payout requests, approvals, sends, and payout summaries |
| refunds | `/refunds` | Admin-managed refunds and provider-aware refund state tracking |
| cart | `/cart` | Buyer cart grouped by seller with seller-scoped checkout |
| addresses | `/addresses` | Buyer saved delivery/billing address book with defaults |
| ledger | `/ledger` | Immutable double-entry ledger (12 event types, 7 account types); atomic `record()` with pessimistic lock; currency from platform config |
| platform-config | `/platform-config` | Market identity from env vars (currency, country); business rules (commission, return policy) managed via admin API |
| feed | `/feed` | Instagram-style social feed: posts, likes, comments, follow/unfollow |
| chat | `/chat` + WebSocket | Buyer↔seller 1:1 real-time messaging (Socket.IO) + REST conversation management |
| health | `/health` | DB + memory health checks |
| queue-health | `/health/queues` | Queue backlog summary for payments, orders, and dead-letter |
| metrics | `/api/v1/metrics` | Prometheus scrape endpoint |

## Testing

```bash
npm test              # 16/16 tests passing
npm run test:cov      # Coverage report
```

> Test suites: 12 suites, 64/64 tests passing.

## Frontend Integration

Recommended buyer checkout flow:

1. Save reusable buyer addresses with `POST /api/v1/addresses` when needed.
2. Add items with `POST /api/v1/cart/items`.
3. Show the buyer cart grouped by seller from `GET /api/v1/cart`.
4. Create one seller-scoped order with `POST /api/v1/cart/sellers/:sellerProfileId/checkout`.
   You can pass saved `deliveryAddressId`, `billingAddressId`, or use the same delivery address for billing.
5. Wait for the seller to send a quote with `POST /api/v1/orders/:id/quote`.
6. Accept the quote with `POST /api/v1/orders/:id/quote-response`.
7. Initialize checkout with `POST /api/v1/payments/checkout/:orderId`.
8. Redirect the browser to the returned `authorizationUrl`.
9. After redirect back from the active provider, call `POST /api/v1/payments/verify`.
10. Sellers progress fulfilment with `POST /api/v1/orders/:id/prepare`, `/ship`, and `/deliver`.
11. Buyers can confirm delivery with `POST /api/v1/orders/:id/confirm-delivery` or raise a dispute with `POST /api/v1/orders/:id/disputes`.
12. Refresh the order from `GET /api/v1/orders/:id`.

Checkout init body:

```json
{
  "channels": ["card", "bank_transfer"],
  "idempotencyKey": "checkout-order-123",
  "callbackUrl": "http://localhost:3001/payments/callback"
}
```

Verify body:

```json
{
  "reference": "PAY-RND-123-ABCDEFGH"
}
```

Important frontend rules:

- Always send the buyer access token in `Authorization: Bearer <accessToken>`.
- Use the returned `authorizationUrl` for redirect-based checkout.
- Treat the webhook-driven backend update as the final payment truth; the verify endpoint is mainly for immediate UI refresh after redirect back from the active provider.
- For Monnify-backed checkouts the response can also include a `paymentReference` alongside the main `reference`.
- Payment verify responses now include `provider` and `providerResponse`; the legacy `paystack` field remains for backward compatibility.
- Order funds stay in `seller_pending` after payment and only move to `seller_available` after the return-policy hold window expires without an open dispute.
- Buyer-favour dispute resolution now puts the order into `refund_pending` until the original payment provider confirms the refund is processed.

Recommended media upload flow:

1. Seller requests `POST /api/v1/media/upload-url`.
2. Frontend uploads the file directly to the returned `uploadUrl` with the returned headers.
3. Frontend sends the resulting CloudFront `publicUrl` and `objectKey` into catalog or feed payloads.
4. Active products must include at least one image.
5. Video is modelled, but the default rollout is image-first and `MEDIA_ALLOW_VIDEO_UPLOADS=false`.

## Admin Payout Flow

1. Check seller payout readiness with `GET /api/v1/payouts/admin/sellers/:sellerProfileId/summary`.
2. Create a payout request with `POST /api/v1/payouts/admin`.
3. Approve it with `POST /api/v1/payouts/admin/:id/approve`.
4. Send it with `POST /api/v1/payouts/admin/:id/send`.
5. For Monnify payout batches, use `POST /api/v1/payouts/admin/send-bulk`.
6. Let the configured payout provider finalize success or restore seller funds on failure or reversal.

Important payout rules:

- Only `seller_available` funds are eligible for payout.
- The seller bank account must already be verified.
- Failed or reversed transfers restore funds from `payout_payable` back to `seller_available`.
- Paystack and Monnify are supported payout providers.
- Monnify supports both single-transfer sends and bulk payout batches.

## Admin Refund Flow

1. Review eligible paid orders whose seller funds are still unreleased.
2. Start a refund with `POST /api/v1/refunds/admin`.
3. If the provider requires recovery action or a retry, use `POST /api/v1/refunds/admin/:id/retry`.
4. Let the original payment provider finalize the refund and move the order from `refund_pending` to `refunded`.

Important refund rules:

- Refunds are currently limited to orders whose seller funds have not been released.
- Refund initiation moves funds from `seller_pending` into `refund_reserve`.
- Buyer bank details are accepted on retry when the active provider needs destination details.
- Paystack and Monnify refund execution are supported.
- Monnify refunds can optionally include destination account details when the provider requires them.
