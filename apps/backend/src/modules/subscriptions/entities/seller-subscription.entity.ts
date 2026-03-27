import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SellerProfile } from '../../sellers/entities/seller-profile.entity';
import { SubscriptionTier } from './subscription-tier.entity';
import { SellerSubscriptionStatus } from '../enums/subscription.enum';

@Entity('seller_subscriptions')
export class SellerSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => SellerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_profile_id' })
  sellerProfile!: SellerProfile;

  @Column({ name: 'seller_profile_id' })
  sellerProfileId!: string;

  @ManyToOne(() => SubscriptionTier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tier_id' })
  tier!: SubscriptionTier;

  @Column({ name: 'tier_id' })
  tierId!: string;

  @Column({
    type: 'enum',
    enum: SellerSubscriptionStatus,
    default: SellerSubscriptionStatus.TRIAL,
  })
  status!: SellerSubscriptionStatus;

  @Column({ name: 'starts_at', type: 'timestamp' })
  startsAt!: Date;

  @Column({ name: 'ends_at', type: 'timestamp', nullable: true })
  endsAt?: Date;

  /** Paystack subscription code for recurring billing */
  @Column({ name: 'paystack_subscription_code', nullable: true })
  paystackSubscriptionCode?: string;

  /** Last successful billing date */
  @Column({ name: 'last_billed_at', type: 'timestamp', nullable: true })
  lastBilledAt?: Date;

  /** Billing amount in NGN at time of subscription (snapshot) */
  @Column({
    name: 'billed_amount_ngn',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  billedAmountNgn?: number;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
