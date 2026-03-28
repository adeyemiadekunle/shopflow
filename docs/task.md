# Rands NestJS Backend Scaffold

## Phase 1: Foundation
- [x] Write implementation plan
- [x] Scaffold NestJS project (`apps/backend/`) via CLI
- [x] Configure TypeScript strict mode + path aliases
- [x] Set up ESLint + Prettier
- [x] Set up `.env` / `ConfigModule` with class-validator

## Phase 2: Core Infrastructure
- [x] Database: TypeORM + PostgreSQL setup with migrations
- [x] Pino structured JSON logging
- [x] Global exception filter + validation pipe
- [x] Health check module (`/health`)
- [x] Swagger / OpenAPI documentation

## Phase 3: Domain Modules (skeleton)
- [x] `auth` — JWT access + refresh tokens, guards, RBAC decorators
- [x] `users` — user entity, roles
- [x] `sellers` — seller profile, KYC status, storefront
- [x] `catalog` — product, variant, category, media
- [x] `orders` — order, order-item, delivery-quote, fulfilment-event, dispute
- [x] `payments` — Paystack integration layer, webhook handler, payment-intent
- [x] `ledger` — ledger-account, ledger-entry, balance-snapshot
- [ ] `social` — post, post-product link, comment
- [ ] `chat` — conversation, message

## Phase 4: Docker & Observability
- [/] `Dockerfile` (multi-stage, non-root)
- [/] `docker-compose.yml` (app, postgres, redis, prometheus, grafana, loki, promtail)
- [/] `prometheus.yml` scrape config
- [/] Grafana provisioning (datasources + dashboards)
- [/] Promtail config

## Phase 5: CI/CD & Testing
- [/] GitHub Actions CI pipeline (lint → test → build → docker)
- [/] Jest unit tests for LedgerService and OrdersService
- [/] Makefile with common dev targets

## Phase 6: Verification
- [ ] `npm run build` passes
- [ ] `npm run test` passes
- [ ] `docker compose up` starts all services
- [ ] `/health` and Swagger reachable

## Phase 7: Queue and Financial Correctness
- [ ] Add BullMQ + Redis worker foundation
- [ ] Queue Paystack webhook and payment post-processing
- [ ] Connect payment success to immutable ledger entries
- [ ] Add reconciliation jobs for orders, payments, and ledger state
- [ ] Queue slow order, notification, and external-service side effects
- [ ] Add retry, DLQ, and queue observability

See `docs/queue_and_financial_correctness_todo.md` for the detailed implementation tracker.
