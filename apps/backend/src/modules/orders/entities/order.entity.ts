import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SellerProfile } from '../../sellers/entities/seller-profile.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderItem } from './order-item.entity';
import { DeliveryQuote } from './delivery-quote.entity';
import { FulfilmentEvent } from './fulfilment-event.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_reference', unique: true, length: 30 })
  orderReference!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @Column({ name: 'buyer_id' })
  buyerId!: string;

  @ManyToOne(() => SellerProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seller_profile_id' })
  sellerProfile!: SellerProfile;

  @Column({ name: 'seller_profile_id' })
  sellerProfileId!: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.DRAFT })
  status!: OrderStatus;

  @Column({
    name: 'items_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  itemsTotal!: number;

  @Column({
    name: 'delivery_fee',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  deliveryFee!: number;

  @Column({
    name: 'platform_fee',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  platformFee!: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount!: number;

  @Column({ name: 'currency', length: 3 })
  currency!: string;

  @Column({ name: 'delivery_address', type: 'jsonb', nullable: true })
  deliveryAddress?: Record<string, unknown>;

  @Column({ name: 'buyer_note', type: 'text', nullable: true })
  buyerNote?: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true })
  items?: OrderItem[];

  @OneToMany(() => DeliveryQuote, (q) => q.order, { cascade: true })
  quotes?: DeliveryQuote[];

  @OneToMany(() => FulfilmentEvent, (e) => e.order, { cascade: true })
  fulfilmentEvents?: FulfilmentEvent[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
