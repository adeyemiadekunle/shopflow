export const QUEUE_CONNECTION_OPTIONS = 'QUEUE_CONNECTION_OPTIONS';
export const QUEUE_DEFAULT_JOB_OPTIONS = 'QUEUE_DEFAULT_JOB_OPTIONS';

export enum QueueName {
  PAYMENTS = 'payments',
  DEAD_LETTER = 'dead-letter',
}

export enum PaymentJobName {
  PROCESS_WEBHOOK_EVENT = 'process-webhook-event',
}

export enum DeadLetterJobName {
  FAILED_JOB = 'failed-job',
}

export const PAYMENTS_QUEUE = 'PAYMENTS_QUEUE';
export const DEAD_LETTER_QUEUE = 'DEAD_LETTER_QUEUE';
