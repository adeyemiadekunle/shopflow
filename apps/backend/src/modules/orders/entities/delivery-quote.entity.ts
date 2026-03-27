import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum QuoteStatus {
  PENDING = 'pending',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Entity('delivery_quotes')
export class DeliveryQuote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (o) => o.quotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id' })
  orderId!: string;

  @Column({ name: 'fee_amount', type: 'decimal', precision: 12, scale: 2 })
  feeAmount!: number;

  @Column({ name: 'seller_note', type: 'text', nullable: true })
  sellerNote?: string;

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.PENDING })
  status!: QuoteStatus;

  @Column({ name: 'responded_at', type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
