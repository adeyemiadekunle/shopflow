import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { PaymentIntent } from '../../payments/entities/payment-intent.entity';

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  NEEDS_ATTENTION = 'needs_attention',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id' })
  orderId!: string;

  @ManyToOne(() => PaymentIntent, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payment_intent_id' })
  paymentIntent!: PaymentIntent;

  @Column({ name: 'payment_intent_id' })
  paymentIntentId!: string;

  @Column({ name: 'transaction_reference', length: 100 })
  transactionReference!: string;

  @Column({ name: 'paystack_refund_id', nullable: true })
  paystackRefundId?: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount!: number;

  @Column({ name: 'currency', length: 3 })
  currency!: string;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.PENDING,
  })
  status!: RefundStatus;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason?: string;

  @Column({ name: 'customer_note', type: 'text', nullable: true })
  customerNote?: string;

  @Column({ name: 'merchant_note', type: 'text', nullable: true })
  merchantNote?: string;

  @Column({ name: 'initiated_by_id' })
  initiatedById!: string;

  @Column({ name: 'customer_bank_id', nullable: true })
  customerBankId?: string;

  @Column({ name: 'customer_account_number', nullable: true })
  customerAccountNumber?: string;

  @Column({ name: 'customer_account_currency', length: 3, nullable: true })
  customerAccountCurrency?: string;

  @Column({ name: 'customer_account_name', nullable: true })
  customerAccountName?: string;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt?: Date;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload?: Record<string, unknown>;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
