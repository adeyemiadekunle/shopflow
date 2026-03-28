export const QUEUE_CONNECTION_OPTIONS = 'QUEUE_CONNECTION_OPTIONS';
export const QUEUE_DEFAULT_JOB_OPTIONS = 'QUEUE_DEFAULT_JOB_OPTIONS';

export enum QueueName {
  PAYMENTS = 'payments',
  ORDERS = 'orders',
  DEAD_LETTER = 'dead-letter',
}

export enum PaymentJobName {
  PROCESS_WEBHOOK_EVENT = 'process-webhook-event',
  RUN_PAYMENT_RECONCILIATION = 'run-payment-reconciliation',
}

export enum OrderJobName {
  SEND_ORDER_CREATED_NOTIFICATION = 'send-order-created-notification',
  SEND_DELIVERY_QUOTE_NOTIFICATION = 'send-delivery-quote-notification',
  SEND_QUOTE_RESPONSE_NOTIFICATION = 'send-quote-response-notification',
  SEND_SELLER_QUOTE_REMINDER = 'send-seller-quote-reminder',
  SEND_BUYER_QUOTE_RESPONSE_REMINDER = 'send-buyer-quote-response-reminder',
  EXPIRE_AWAITING_DELIVERY_QUOTE = 'expire-awaiting-delivery-quote',
  EXPIRE_QUOTE_SENT = 'expire-quote-sent',
}

export enum DeadLetterJobName {
  FAILED_JOB = 'failed-job',
}

export const PAYMENTS_QUEUE = 'PAYMENTS_QUEUE';
export const ORDERS_QUEUE = 'ORDERS_QUEUE';
export const DEAD_LETTER_QUEUE = 'DEAD_LETTER_QUEUE';
