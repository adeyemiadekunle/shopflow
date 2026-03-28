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
import { PaymentIntent } from './payment-intent.entity';
import { PaymentReconciliationRun } from './payment-reconciliation-run.entity';

export enum PaymentReconciliationIssueSeverity {
  WARNING = 'warning',
  ERROR = 'error',
}

export enum PaymentReconciliationIssueStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

export enum PaymentReconciliationIssueType {
  STALE_PROCESSING_INTENT = 'stale_processing_intent',
  SUCCEEDED_ORDER_NOT_PAID = 'succeeded_order_not_paid',
  FAILED_ORDER_MARKED_PAID = 'failed_order_marked_paid',
  PAYMENT_INTENT_ORDER_MISSING = 'payment_intent_order_missing',
  VERIFY_ATTEMPT_FAILED = 'verify_attempt_failed',
}

@Entity('payment_reconciliation_issues')
export class PaymentReconciliationIssue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PaymentReconciliationRun, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'run_id' })
  run!: PaymentReconciliationRun;

  @Column({ name: 'run_id' })
  runId!: string;

  @ManyToOne(() => PaymentIntent, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'payment_intent_id' })
  paymentIntent?: PaymentIntent;

  @Column({ name: 'payment_intent_id', nullable: true })
  paymentIntentId?: string;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @Column({ name: 'order_id', nullable: true })
  orderId?: string;

  @Column({ name: 'paystack_reference', length: 100, nullable: true })
  paystackReference?: string;

  @Column({
    type: 'enum',
    enum: PaymentReconciliationIssueType,
  })
  type!: PaymentReconciliationIssueType;

  @Column({
    type: 'enum',
    enum: PaymentReconciliationIssueSeverity,
  })
  severity!: PaymentReconciliationIssueSeverity;

  @Column({
    type: 'enum',
    enum: PaymentReconciliationIssueStatus,
    default: PaymentReconciliationIssueStatus.OPEN,
  })
  status!: PaymentReconciliationIssueStatus;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, unknown>;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
