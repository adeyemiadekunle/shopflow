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
- **Swagger:** `http://localhost:3000/api-docs`

## Commands

```bash
npm run start:dev    # Dev server (watch)
npm run build        # Production build
npm run start:prod   # Start production build
npm test             # Unit tests
npm run test:cov     # Test coverage
npm run lint         # ESLint
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection |
| `JWT_ACCESS_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
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
| auth | `/auth` | Register (buyer/seller), login (all roles), admin creation |
| users | `/users` | User accounts, roles |
| sellers | `/sellers` | Profiles, KYC (NIN/BVN), bank accounts |
| catalog | `/catalog` | Products, variants, media, categories, discounts |
| orders | `/orders` | 14-state order lifecycle |
| payments | `/payments` | Paystack + webhook handling |
| ledger | `/ledger` | Immutable double-entry ledger (12 event types, 7 account types); atomic `record()` with pessimistic lock; currency from platform config |
| subscriptions | `/subscriptions` | Seller tiers (Free/Basic/Pro/Enterprise) |
| platform-config | `/platform-config` | Market identity from env vars (currency, country); business rules (commission, return policy) managed via admin API |
| feed | `/feed` | Instagram-style social feed: posts, likes, comments, follow/unfollow |
| chat | `/chat` + WebSocket | Buyer↔seller 1:1 real-time messaging (Socket.IO) + REST conversation management |
| health | `/health` | DB + memory health checks |

## Testing

```bash
npm test              # 10/10 tests passing
npm run test:cov      # Coverage report
```

> Test suites: `AppController`, `LedgerService`, `OrdersService`.
