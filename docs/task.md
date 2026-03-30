# Shopflow Backend Task Tracker

This file is the current high-level implementation tracker for the backend.
It replaces the original scaffold-era checklist, which is now outdated.

Detailed queue and financial-correctness follow-up work lives in:
- `docs/queue_and_financial_correctness_todo.md`

Current source of truth for module status lives in:
- `docs/status_report.md`

## Completed Core Modules

- [x] `auth`
- [x] `users`
- [x] `sellers`
- [x] `catalog`
- [x] `media`
- [x] `feed`
- [x] `chat`
- [x] `cart`
- [x] `addresses`
- [x] `orders`
- [x] `payments`
- [x] `payouts`
- [x] `refunds`
- [x] `ledger`
- [x] `platform-config`
- [x] `health`
- [x] `queue`
- [x] `mail`

## Completed Platform Foundations

- [x] PostgreSQL + TypeORM + migrations
- [x] Redis + BullMQ foundation
- [x] Swagger / OpenAPI
- [x] Health checks
- [x] Prometheus metrics
- [x] Grafana dashboards
- [x] Loki / Promtail log pipeline
- [x] Docker Compose local stack
- [x] GitHub Actions CI
- [x] AWS S3 + CloudFront media upload foundation
- [x] Paystack + Monnify provider abstraction foundation

## Remaining Work By Theme

### Product / UX

- [x] Add seller analytics endpoints and dashboard-ready summaries
- [x] Add platform/admin analytics endpoints and dashboard-ready summaries
- [x] Add richer catalog/feed media polish
- [ ] Add video-processing pipeline after image-first rollout
- [ ] Add first-time checkout support for separate raw `billingAddress`
- [ ] Add moderation / admin tooling for feed, chat, and catalog

### Finance / Operations

- [ ] Finish ledger-aware reconciliation
- [ ] Add finance reporting derived from ledger state
- [ ] Add payout and refund operational reporting / exports
- [ ] Add commission-policy reporting and audit visibility

### Queue / Reliability

- [ ] Add DLQ visibility and replay workflow
- [ ] Add alerting for queue backlog and stuck jobs
- [ ] Add retry / failure runbooks
- [ ] Add more worker-level metrics and dashboards
- [ ] Add integration tests for duplicate webhook / retry / replay behavior
- [ ] Add load testing for checkout, webhook, and payout paths

### Notifications

- [ ] Expand beyond email into WhatsApp / SMS / push when ready
- [ ] Add provider/channel-aware notification preferences

### Documentation / Cleanup

- [ ] Refresh stale counts and examples in README files over time
- [ ] Remove dead leftover module folders that are no longer wired
- [ ] Audit module imports for runtime DI issues surfaced only at app boot
- [ ] Keep `docs/status_report.md` updated at each major milestone

## Suggested Next Order

1. Queue and ops hardening
2. Video processing pipeline and media automation
3. Notification expansion
4. Final finance and ledger reporting pass
5. Admin reporting / exports
6. Cleanup and documentation sweep
