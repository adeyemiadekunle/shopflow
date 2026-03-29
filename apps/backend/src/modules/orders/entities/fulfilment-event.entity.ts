import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum FulfilmentEventType {
  ORDER_CREATED = 'order_created',
  QUOTE_SENT = 'quote_sent',
  QUOTE_ACCEPTED = 'quote_accepted',
  QUOTE_DECLINED = 'quote_declined',
  PAYMENT_RECEIVED = 'payment_received',
  PREPARING = 'preparing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  BUYER_CONFIRMED = 'buyer_confirmed',
  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_RESOLVED = 'dispute_resolved',
  FUNDS_RELEASED = 'funds_released',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

@Entity('fulfilment_events')
export class FulfilmentEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (o) => o.fulfilmentEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id' })
  orderId!: string;

  @Column({
    type: 'enum',
    enum: FulfilmentEventType,
  })
  type!: FulfilmentEventType;

  @Column({ name: 'actor_id', nullable: true })
  actorId?: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'evidence_url', nullable: true })
  evidenceUrl?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
