export enum OrderStatus {
  DRAFT = 'draft',
  AWAITING_DELIVERY_QUOTE = 'awaiting_delivery_quote',
  QUOTE_SENT = 'quote_sent',
  QUOTE_ACCEPTED = 'quote_accepted',
  QUOTE_DECLINED = 'quote_declined',
  PAYMENT_PENDING = 'payment_pending',
  PAID = 'paid',
  SELLER_PREPARING = 'seller_preparing',
  SHIPPED = 'shipped',
  DELIVERED_PENDING_CONFIRMATION = 'delivered_pending_confirmation',
  COMPLETED = 'completed',
  DISPUTE_OPEN = 'dispute_open',
  REFUND_PENDING = 'refund_pending',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

/** Valid state transitions for the order state machine */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [
    OrderStatus.AWAITING_DELIVERY_QUOTE,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.AWAITING_DELIVERY_QUOTE]: [
    OrderStatus.QUOTE_SENT,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.QUOTE_SENT]: [
    OrderStatus.QUOTE_ACCEPTED,
    OrderStatus.QUOTE_DECLINED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.QUOTE_ACCEPTED]: [
    OrderStatus.PAYMENT_PENDING,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.QUOTE_DECLINED]: [OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [
    OrderStatus.SELLER_PREPARING,
    OrderStatus.REFUND_PENDING,
  ],
  [OrderStatus.SELLER_PREPARING]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED_PENDING_CONFIRMATION],
  [OrderStatus.DELIVERED_PENDING_CONFIRMATION]: [
    OrderStatus.COMPLETED,
    OrderStatus.DISPUTE_OPEN,
    OrderStatus.REFUND_PENDING,
  ],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.DISPUTE_OPEN]: [
    OrderStatus.COMPLETED,
    OrderStatus.REFUND_PENDING,
  ],
  [OrderStatus.REFUND_PENDING]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
  [OrderStatus.CANCELLED]: [],
};
