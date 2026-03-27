# Rands — Social Ecommerce Platform

**Rands** is a production-grade social ecommerce platform where buyers discover products through a social feed and purchase directly from verified sellers. Built with NestJS + PostgreSQL + Redis, designed for multi-market deployment with full admin configurability.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [API Modules](#api-modules)
- [Platform Config](#platform-config)
- [Subscription Tiers](#subscription-tiers)
- [Testing](#testing)
- [Docker & Infrastructure](#docker--infrastructure)
- [CI/CD](#cicd)
- [Project Structure](#project-structure)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  NestJS API (port 3000)              │
│  auth · users · sellers · catalog · orders           │
│  payments · ledger · subscriptions · platform-config │
│  feed · chat (WebSocket + REST)                       │
├─────────────────────────────────────────────────────┤
│  PostgreSQL (TypeORM)    │  Redis (BullMQ / cache)   │
├─────────────────────────────────────────────────────┤
│  Prometheus · Grafana · Loki · Promtail              │
└─────────────────────────────────────────────────────┘
```

Key design principles:
- **Immutable ledger** — double-entry, atomic transactions, pessimistic write locks
- **14-state order machine** — guarded transitions, full audit trail
- **Admin-configurable platform** — currency, country, commission, return policy all set via API, never hardcoded
- **Subscription-gated features** — seller capabilities are tied to subscription tier, not server constants

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (TypeScript strict) |
| Database | PostgreSQL 16 + TypeORM |
| Cache / Queues | Redis + BullMQ |
| Auth | JWT (access + refresh), bcrypt |
| Payments | Paystack (init, verify, refund, webhooks) |
| Logging | nestjs-pino (structured JSON) |
| Metrics | Prometheus + Grafana |
| Log aggregation | Loki + Promtail |
| Security | Throttle (rate limiting), HMAC webhook verification, RBAC guards |
| Containerisation | Docker (multi-stage) + docker-compose |
| CI | GitHub Actions |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Docker + Docker Compose
- `make` (optional, for shorthand commands)

### Local setup

```bash
# 1. Install backend dependencies from the repo root
npm install --workspace backend

# 2. Copy and fill in environment variables
cd apps/backend
cp .env.example .env

# 3. Start infrastructure (DB, Redis, observability)
cd ../..
docker compose up -d postgres redis

# 4. Run database migrations
npm run db:migrate

# 5. Start the API in dev/watch mode from the repo root
npm run dev
```

API available at: `http://localhost:3000/api/v1`  
Swagger UI: `http://localhost:3000/api-docs`

---

## Environment Variables

See [`apps/backend/.env.example`](apps/backend/.env.example) for the full list. Key variables:

| Variable | Description |
|---|---|
| `DB_HOST` / `DB_PORT` | PostgreSQL host and port |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | PostgreSQL credentials and database |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `APP_BASE_URL` | Backend base URL used for generated links |
| `MAIL_FROM` / `SMTP_*` | SMTP sender and transport settings |
| `FRONTEND_BASE_URL` | Frontend URL used in verification/reset links |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (from dashboard) |
| `PAYSTACK_WEBHOOK_SECRET` | HMAC secret for webhook verification |
| `PLATFORM_CURRENCY` | ISO 4217 currency code for this deployment (e.g. `NGN`, `GHS`) |
| `PLATFORM_COUNTRY_CODE` | ISO 3166-1 alpha-2 country code (e.g. `NG`, `GH`) |
| `PLATFORM_MARKET_NAME` | Human-readable market name (e.g. `Nigeria`) |
| `PLATFORM_NAME` | Platform display name (e.g. `Rands`) |

> **Note:** `PLATFORM_*` variables are set **once at deploy time** and must never be changed on a live database with existing financial records. See [Platform Config](#platform-config) for details.

---

## Running the App

```bash
# Development (watch mode from repo root)
npm run dev

# Run pending database migrations
npm run db:migrate

# Revert the latest migration
npm run db:migrate:revert

# Production build
npm run build

# Or via Makefile (from project root)
make dev          # Start dev server
make docker-up    # Start all Docker services
make test         # Run unit tests
make lint         # Run ESLint
```

---

## API Modules

All routes are prefixed with `/api/v1`.  
Protected routes require `Authorization: Bearer <access_token>`.

### Auth — `/api/v1/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register buyer or seller (`role: "buyer"\|"seller"`) |
| POST | `/login` | Public | Login for all roles. Pass `expectedRole` to enforce portal validation |
| POST | `/refresh` | Public | Rotate access and refresh tokens |
| POST | `/verify-email` | Public | Verify email using one-time token |
| POST | `/verify-email/resend` | Public | Resend verification email |
| POST | `/forgot-password` | Public | Request password reset email |
| POST | `/reset-password` | Public | Reset password using one-time token |
| POST | `/logout` | User | Invalidate refresh token |
| POST | `/admin` | Admin | Create admin account |

### Users — `/api/v1/users`

CRUD for user accounts. Role-based access (BUYER, SELLER, ADMIN).

### Sellers — `/api/v1/sellers`

| Feature | Description |
|---|---|
| Seller Profile | Store name, slug, bio, logo, support contacts |
| KYC | Business details, BVN, NIN, ID document upload, address |
| Bank Account | Payout bank account management |
| Status Flow | `PENDING → KYC_SUBMITTED → APPROVED / REJECTED` |

### Catalog — `/api/v1/catalog`

Products with variants (size/colour/stock), media, categories, and **discount support**:

- `discountType`: `percentage` or `fixed`
- `discountValue`: % off or flat currency amount
- `discountStartsAt` / `discountEndsAt`: optional scheduled window
- `effectivePrice`: denormalised for fast sorting/search

### Orders — `/api/v1/orders`

14-state order lifecycle with guarded transitions:

```
PENDING_PAYMENT → PAID → SELLER_PREPARING → READY_FOR_PICKUP
→ IN_TRANSIT → DELIVERED → COMPLETED
         ↘ DISPUTED → RESOLVED / REFUND_REQUESTED → REFUNDED
```

Every transition logged in `FulfilmentEvent` for full audit trail.

### Payments — `/api/v1/payments`

- Paystack payment initialisation and verification
- Webhook handling with HMAC signature verification
- Raw webhook events stored in `webhook_events` for deduplication and replay
- Idempotency keys on payment intents

### Ledger — `/api/v1/ledger` (internal)

Immutable double-entry ledger — entries are **never updated or deleted** after creation.

**LedgerEventType** (12 values):

| Event | Meaning |
|---|---|
| `payment_collected` | Buyer payment received into clearing |
| `payment_verified` | Payment confirmed by Paystack |
| `fee_accrued` | Platform commission debited |
| `seller_pending_allocated` | Funds moved to seller pending hold |
| `delivery_confirmed` | Delivery confirmed, hold ready to release |
| `hold_released` | Funds released to seller available balance |
| `refund_initiated` | Refund process started |
| `refund_completed` | Refund disbursed to buyer |
| `payout_requested` | Seller requests payout |
| `payout_approved` | Admin approves payout |
| `payout_sent` | Payout dispatched via Paystack |
| `payout_reversed` | Payout reversed / failed |

**LedgerAccountType** (7 values): `platform_cash_clearing`, `seller_pending`, `seller_available`, `platform_revenue`, `payment_fee_reserve`, `refund_reserve`, `payout_payable`.

**LedgerService public API:**
- `ensureAccount(type, ownerId?, currency?)` — find-or-create a ledger account
- `record(dto: RecordLedgerEntryDto)` — atomic write with pessimistic lock, currency auto-resolved from platform config
- `getBalanceForOwner(type, ownerId)` — read denormalised balance snapshot

### Feed — `/api/v1/feed`

Instagram-style social feed. Sellers create posts with text, media, and optional product tags. Buyers follow sellers and get a personalised feed.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/posts` | Seller | Create a post |
| GET | `/` | User | Personalised feed (followed sellers) |
| GET | `/explore` | Public | Latest posts from all sellers |
| GET | `/posts/:id` | Public | Single post |
| DELETE | `/posts/:id` | Seller/Admin | Archive post |
| POST | `/posts/:id/like` | User | Toggle like |
| GET | `/posts/:id/comments` | Public | List comments |
| POST | `/posts/:id/comments` | User | Add comment |
| DELETE | `/comments/:id` | User/Admin | Delete comment |
| POST | `/follow/:sellerProfileId` | Buyer | Follow seller |
| DELETE | `/follow/:sellerProfileId` | Buyer | Unfollow seller |
| GET | `/following` | User | List followed sellers |

### Chat — `/api/v1/chat` + WebSocket

Buyer↔seller 1:1 real-time messaging. One conversation per buyer-seller pair.

**REST routes:**

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/conversations/:sellerProfileId` | Buyer | Start or retrieve conversation |
| GET | `/conversations` | User | List all conversations |
| GET | `/conversations/:id/messages` | User | Message history (paginated) |
| PATCH | `/conversations/:id/read` | User | Mark messages as read |

**WebSocket** (Socket.IO, namespace `/chat`):

| Event | Direction | Payload |
|---|---|---|
| `join` | client→server | `{ conversationId }` |
| `send_message` | client→server | `{ conversationId, content }` |
| `new_message` | server→client | `ChatMessage` object |

JWT auth via `auth.token` in the Socket.IO handshake.

### Subscriptions — `/api/v1/subscriptions`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/tiers` | Public | Active tiers (pricing page) |
| GET | `/admin/tiers` | Admin | All tiers including inactive |
| PUT | `/admin/tiers` | Admin | Create or replace a tier |
| PATCH | `/admin/tiers/:id` | Admin | Update price, currency, features |
| POST | `/admin/tiers/seed` | Admin | Bootstrap default tiers |

### Health — `/health`

Database and memory health checks via `@nestjs/terminus`.

---

## Platform Config

Platform-wide settings are split into two categories:

### Market identity — env vars (deploy-time, immutable per instance)

Set in `.env` before the instance first starts. **Never change on a live database.**

| Env var | Example | Description |
|---|---|---|
| `PLATFORM_CURRENCY` | `NGN` | ISO 4217 currency code stamped on all new records |
| `PLATFORM_COUNTRY_CODE` | `NG` | ISO 3166-1 alpha-2 country code |
| `PLATFORM_MARKET_NAME` | `Nigeria` | Human-readable market name |
| `PLATFORM_NAME` | `Rands` | Platform display name |

> [!WARNING]
> Every `LedgerEntry`, `LedgerAccount`, and `PaymentIntent` stores its own `currency` at creation time. Changing `PLATFORM_CURRENCY` after launch does not migrate existing records — it only affects new ones.
> **Each market/country gets its own dedicated server + database.**

### Business rules — admin API (runtime-configurable)

Safe to change at any time — they apply to future records only.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/platform-config/public` | Public | Market identity + public business rules |
| GET | `/platform-config` | Admin | All business-rule keys |
| PUT | `/platform-config/:key` | Admin | Set / update a business-rule value |
| DELETE | `/platform-config/:key` | Admin | Delete a key |

| Key | Default | Description |
|---|---|---|
| `platform.commission_rate_default_percent` | `10` | Default commission % |
| `platform.return_policy_days` | `7` | Return window in days |
| `platform.min_payout_amount` | `1000` | Minimum payout amount |
| `platform.supported_payment_gateways` | `paystack` | Active payment gateways |
| `platform.support_email` | `support@rands.ng` | Support contact |

---

## Subscription Tiers

Tiers gate seller features. All values are admin-configurable:

| Tier | Default Price | Key features |
|---|---|---|
| **Free** | 0 | 10 products, 3 media/product, 2 payouts/month |
| **Basic** | 5,000 | 100 products, analytics, discount campaigns, 8 payouts/month |
| **Pro** | 15,000 | Unlimited products, priority listing, unlimited payouts |
| **Enterprise** | 50,000 | Custom domain, account manager, lowest commission |

Feature flags per tier (all configurable): `maxProducts`, `maxMediaPerProduct`, `analyticsEnabled`, `priorityListing`, `discountCampaignsEnabled`, `monthlyPayoutRequests`, `customDomainEnabled`, `commissionRatePercent`.

---

## Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

Current test suites: `AppController`, `AuthService`, `LedgerService`, `OrdersService` — 16/16 passing.

---

## Docker & Infrastructure

```bash
# Start everything (API + Postgres + Redis + observability stack)
docker compose up -d

# Services
# API        → http://localhost:3000
# Health     → http://localhost:3000/health
# Metrics    → http://localhost:3000/api/v1/metrics
# Swagger    → http://localhost:3000/api-docs
# Grafana    → http://localhost:3001
# Prometheus → http://localhost:9090
# Loki       → http://localhost:3100
```

Grafana local login:
- Username: `admin`
- Password: `admin`

The Docker Compose stack includes:

| Service | Port |
|---|---|
| `api` | 3000 |
| `postgres` | 5432 |
| `redis` | 6379 |
| `prometheus` | 9090 |
| `grafana` | 3001 |
| `loki` | 3100 |
| `promtail` | — |

---

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):

```
Lint → Unit Tests → Build → Docker Build
```

Triggers on push to `main` and all pull requests.

---

## Project Structure

```
apps/backend/src/
├── common/
│   ├── decorators/       # @CurrentUser, @Roles, @Public
│   ├── filters/          # Global HTTP exception filter
│   └── interceptors/     # Response envelope interceptor
├── config/               # Central configuration factory
├── database/             # TypeORM migrations
├── modules/
│   ├── auth/             # JWT auth, guards, strategies
│   ├── catalog/          # Products, variants, media, categories
│   ├── chat/             # 1:1 real-time buyer↔seller messaging
│   ├── feed/             # Social feed: posts, likes, comments
│   ├── health/           # Health checks (Terminus)
│   ├── ledger/           # Immutable double-entry ledger
│   ├── orders/           # 14-state order machine
│   ├── payments/         # Paystack integration + webhooks
│   ├── platform-config/  # Admin-managed platform settings
│   ├── sellers/          # Seller profiles, KYC, bank accounts
│   ├── subscriptions/    # Seller subscription tiers + features
│   └── users/            # User accounts + roles
└── main.ts               # App entrypoint (Swagger setup, port 3000)

apps/
└── backend/              # NestJS backend application

infra/
├── grafana/              # Grafana provisioning
├── loki/                 # Loki config
├── prometheus/           # Prometheus scrape config
└── promtail/             # Log shipping config
```

---

## License

Private — All rights reserved © Rands 2026.
