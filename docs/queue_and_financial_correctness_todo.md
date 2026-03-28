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

- [ ] Add BullMQ to `apps/backend`
- [ ] Add Redis-backed queue configuration module
- [ ] Add shared queue constants and job names
- [ ] Add worker registration pattern for NestJS
- [ ] Add retry/backoff defaults
- [ ] Add dead-letter queue strategy
- [ ] Add queue health/metrics visibility
- [ ] Document local queue setup in README

## Phase B: Payments Queue

- [ ] Move Paystack webhook processing off the request thread
- [ ] Persist webhook event first, enqueue processing second
- [ ] Add `payments` worker for payment intent verification
- [ ] Make payment verification idempotent by `paystackReference`
- [ ] Make webhook processing idempotent by event/reference
- [ ] Prevent double payment state transitions on repeated webhook delivery
- [ ] Prevent double order payment confirmation on repeated verify calls
- [ ] Add explicit handling for `charge.success`
- [ ] Add explicit handling for `charge.failed`
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

- [ ] Add scheduled reconciliation job for payment intents
- [ ] Compare Paystack transaction state vs payment intent state
- [ ] Compare payment intent state vs order state
- [ ] Compare payment intent state vs ledger state
- [ ] Flag stuck `processing` or `pending` intents
- [ ] Add safe repair actions for recoverable mismatches
- [ ] Log non-recoverable mismatches for manual review
- [ ] Add admin/internal reporting endpoint for reconciliation results

## Phase E: Orders Queue

- [ ] Queue non-critical order side-effects after order creation
- [ ] Queue seller notifications after buyer creates order
- [ ] Queue buyer notifications after seller sends quote
- [ ] Queue reminder jobs for stale quotes
- [ ] Queue expiry/cancellation jobs for abandoned quote states
- [ ] Queue analytics/event fanout for order milestones
- [ ] Keep synchronous order writes limited to source-of-truth DB records

## Phase F: Notifications Queue

- [ ] Queue email sending
- [ ] Queue payment success/failure notifications
- [ ] Queue seller onboarding notifications
- [ ] Queue chat push notifications when added later
- [ ] Add retry + DLQ policy for outbound notification failures

## Phase G: Observability and Safety

- [ ] Add queue dashboards or metrics
- [ ] Track job success/failure counts
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
- [x] Paystack Checkout init and verify endpoints exist
- [ ] Queue layer not started
- [ ] Ledger posting on payment success not connected
- [ ] Reconciliation not implemented
- [ ] DLQ and worker monitoring not implemented

