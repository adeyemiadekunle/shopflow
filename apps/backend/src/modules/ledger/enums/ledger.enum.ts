export enum LedgerEventType {
  PAYMENT_COLLECTED = 'payment_collected',
  PAYMENT_VERIFIED = 'payment_verified',
  FEE_ACCRUED = 'fee_accrued',
  SUBSCRIPTION_BILLED = 'subscription_billed',
  SELLER_PENDING_ALLOCATED = 'seller_pending_allocated',
  DELIVERY_CONFIRMED = 'delivery_confirmed',
  HOLD_RELEASED = 'hold_released',
  REFUND_INITIATED = 'refund_initiated',
  REFUND_COMPLETED = 'refund_completed',
  PAYOUT_REQUESTED = 'payout_requested',
  PAYOUT_APPROVED = 'payout_approved',
  PAYOUT_SENT = 'payout_sent',
  PAYOUT_REVERSED = 'payout_reversed',
}

export enum LedgerAccountType {
  PLATFORM_CASH_CLEARING = 'platform_cash_clearing',
  SELLER_PENDING = 'seller_pending',
  SELLER_AVAILABLE = 'seller_available',
  PLATFORM_REVENUE = 'platform_revenue',
  PAYMENT_FEE_RESERVE = 'payment_fee_reserve',
  REFUND_RESERVE = 'refund_reserve',
  PAYOUT_PAYABLE = 'payout_payable',
}
