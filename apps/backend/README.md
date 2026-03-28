# Rands Backend — NestJS API

Production-grade NestJS backend for the Rands social ecommerce platform.

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
- **Grafana Queue Dashboard:** `Rands / Queue Monitoring`
- **Grafana API Dashboard:** `Rands / API and Payments Overview`

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
| `PAYSTACK_SECRET_KEY` | Paystack API secret |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook HMAC secret |
| `PLATFORM_CURRENCY` | ISO 4217 code for this deployment (e.g. `NGN`) |
| `PLATFORM_COUNTRY_CODE` | ISO 3166-1 alpha-2 (e.g. `NG`) |
| `PLATFORM_MARKET_NAME` | Market name (e.g. `Nigeria`) |
| `PLATFORM_NAME` | Platform display name (e.g. `Rands`) |

> `PLATFORM_*` vars are set once at deploy time and must not be changed on a live database. Business-rule settings (commission rate, return policy, etc.) remain configurable via the Admin API.

## Modules

| Module | Base path | Description |
|---|---|---|
| auth | `/auth` | Register, login, refresh, email verification, password reset, admin creation with password complexity rules and tighter auth throttles |
| users | `/users` | User accounts, roles |
| sellers | `/sellers` | Profiles, KYC (NIN/BVN), bank accounts |
| catalog | `/catalog` | Products, variants, media, categories, discounts |
| orders | `/orders` | Buyer order creation, seller quoting, quote response, scoped order access |
| payments | `/payments` | Paystack Checkout init, verify, and webhook handling |
| ledger | `/ledger` | Immutable double-entry ledger (12 event types, 7 account types); atomic `record()` with pessimistic lock; currency from platform config |
| subscriptions | `/subscriptions` | Seller tiers (Free/Basic/Pro/Enterprise) |
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

> Test suites: `AppController`, `AuthService`, `CatalogService`, `LedgerService`, `OrdersService`, `PaymentsService`, `SellersService`.

## Frontend Integration

Recommended buyer checkout flow:

1. Create the order with `POST /api/v1/orders`.
2. Wait for the seller to send a quote with `POST /api/v1/orders/:id/quote`.
3. Accept the quote with `POST /api/v1/orders/:id/quote-response`.
4. Initialize Paystack Checkout with `POST /api/v1/payments/checkout/:orderId`.
5. Redirect the browser to the returned `authorizationUrl`.
6. After redirect back from Paystack, call `POST /api/v1/payments/verify`.
7. Refresh the order from `GET /api/v1/orders/:id`.

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
- Treat the webhook-driven backend update as the final payment truth; the verify endpoint is mainly for immediate UI refresh after Paystack redirects back.
