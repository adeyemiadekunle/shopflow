# Queue and Financial Correctness TODO

This document tracks the backend hardening work needed to make `rands` safer under traffic spikes, payment retries, webhook duplication, and financial edge cases.

## Why This Exists

The current codebase already has good foundations:

- `payment_intents` for payment intent vs execution
- `webhook_events` for incoming Paystack webhook persistence
- append-only ledger primitives
- order and payment state machines
- idempotency keys on payment intents

What is still missing is the production-grade async and correctness layer around them:

- queue-backed processing
- dead-letter handling
- reconciliation jobs
- ledger posting connected to successful payments
- strong idempotent processing across webhooks and retries

## Priority Order

1. Queue payment and webhook processing
2. Connect successful payments to ledger entries
3. Add reconciliation jobs
4. Add order and notification queues
5. Add monitoring, retries, and dead-letter tooling

## Phase A: Queue Foundation

- [x] Add BullMQ to `apps/backend`
- [x] Add Redis-backed queue configuration module
- [x] Add shared queue constants and job names
- [x] Add worker registration pattern for NestJS
- [x] Add retry/backoff defaults
- [x] Add dead-letter queue strategy
- [x] Add queue health/metrics visibility
- [x] Document local queue setup in README

## Phase B: Payments Queue

- [x] Move Paystack webhook processing off the request thread
- [x] Persist webhook event first, enqueue processing second
- [x] Add `payments` worker for payment intent verification
- [x] Make payment verification idempotent by `paystackReference`
- [x] Make webhook processing idempotent by event/reference
- [x] Prevent double payment state transitions on repeated webhook delivery
- [x] Prevent double order payment confirmation on repeated verify calls
- [x] Add explicit handling for `charge.success`
- [x] Add explicit handling for `charge.failed`
- [ ] Add retry + backoff policy for verification failures
- [ ] Add DLQ path for repeated payment job failures

## Phase C: Ledger Integration

- [ ] Post ledger entries when payment is confirmed
- [ ] Record buyer payment into clearing account
- [ ] Record platform fee accrual
- [ ] Record seller pending allocation
- [ ] Make ledger posting idempotent for a payment reference
- [ ] Wrap payment success + ledger posting in safe transactional boundaries
- [ ] Ensure order paid state cannot diverge silently from ledger state
- [ ] Add tests for duplicate webhook + duplicate ledger protection

## Phase D: Reconciliation

- [x] Add scheduled reconciliation job for payment intents
- [x] Compare Paystack transaction state vs payment intent state
- [x] Compare payment intent state vs order state
- [ ] Compare payment intent state vs ledger state
- [x] Flag stuck `processing` or `pending` intents
- [x] Add safe repair actions for recoverable mismatches
- [x] Log non-recoverable mismatches for manual review
- [x] Add admin/internal reporting endpoint for reconciliation results

## Phase E: Orders Queue

- [x] Queue non-critical order side-effects after order creation
- [x] Queue seller notifications after buyer creates order
- [x] Queue buyer notifications after seller sends quote
- [x] Queue seller notifications after buyer responds to quote
- [x] Queue reminder jobs for stale quotes
- [x] Queue expiry/cancellation jobs for abandoned quote states
- [ ] Queue analytics/event fanout for order milestones
- [ ] Keep synchronous order writes limited to source-of-truth DB records

## Phase F: Notifications Queue

- [ ] Queue email sending
- [ ] Queue payment success/failure notifications
- [ ] Queue seller onboarding notifications
- [ ] Queue chat push notifications when added later
- [ ] Add retry + DLQ policy for outbound notification failures

## Phase G: Observability and Safety

- [x] Add queue dashboards or metrics
- [x] Track job success/failure counts
- [ ] Track retry counts and DLQ counts
- [ ] Add alerts for stuck workers
- [ ] Add alerts for webhook backlog growth
- [ ] Add alerts for reconciliation mismatches
- [ ] Add runbook for replaying failed jobs

## Phase H: Testing and Verification

- [ ] Add unit tests for payment workers
- [ ] Add unit tests for reconciliation jobs
- [ ] Add integration tests for duplicate webhook delivery
- [ ] Add integration tests for duplicate checkout verification
- [ ] Add integration tests for queue retry behavior
- [ ] Add integration tests for ledger idempotency
- [ ] Load test concurrent checkout and webhook flows

## Non-Negotiable Design Rules

- [ ] Never update balances by reading into memory and writing back mutable totals
- [ ] Never treat webhook delivery count as exactly-once
- [ ] Never treat frontend success as payment truth without backend verification
- [ ] Never let duplicate requests create duplicate financial side effects
- [ ] Never couple slow external calls tightly to the HTTP response path when they can be queued
- [ ] Never skip reconciliation for money movement

## Current Status

- [x] Payment intent model exists
- [x] Webhook event persistence exists
- [x] Order checkout flow exists
- [x] Provider-aware checkout init and verify endpoints exist
- [x] Paystack + Monnify checkout support exists
- [x] Queue layer started
- [x] Orders notification queue started
- [x] Orders reminder and expiry queue started
- [x] Queue summary health endpoint added
- [x] Queue Grafana dashboard provisioning added
- [x] API and payments Grafana dashboard provisioning added
- [x] Payment reconciliation dashboards added
- [x] Payment idempotency hardening added
- [x] Ledger posting on payment success connected
- [ ] Ledger-aware reconciliation not implemented
- [ ] DLQ and worker monitoring not implemented
