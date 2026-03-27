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
import { User } from '../../users/entities/user.entity';

export enum PaymentIntentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('payment_intents')
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id' })
  orderId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @Column({ name: 'buyer_id' })
  buyerId!: string;

  @Column({ name: 'paystack_reference', unique: true, length: 100 })
  paystackReference!: string;

  @Column({ name: 'idempotency_key', unique: true, length: 200 })
  idempotencyKey!: string;

  @Column({ name: 'amount_kobo', type: 'bigint' })
  amountKobo!: number;

  @Column({ name: 'currency', length: 3 })
  currency!: string;

  @Column({
    type: 'enum',
    enum: PaymentIntentStatus,
    default: PaymentIntentStatus.PENDING,
  })
  status!: PaymentIntentStatus;

  @Column({ name: 'authorization_url', nullable: true })
  authorizationUrl?: string;

  @Column({ name: 'raw_verify_payload', type: 'jsonb', nullable: true })
  rawVerifyPayload?: Record<string, unknown>;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
