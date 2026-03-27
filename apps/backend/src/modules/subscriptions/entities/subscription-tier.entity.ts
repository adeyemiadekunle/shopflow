import type { TierFeatures } from '../types/tier-features.interface';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionTierName } from '../enums/subscription.enum';

/**
 * SubscriptionTier defines what a seller gets at each plan level.
 * All values (price, currency, features) are managed exclusively by platform admins.
 * Sellers cannot modify their own tier definition — only their subscription to one.
 */
@Entity('subscription_tiers')
export class SubscriptionTier {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: SubscriptionTierName, unique: true })
  name!: SubscriptionTierName;

  @Column({ length: 200 })
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Monthly price — set by admin. 0 for the FREE tier.
   * Currency is stored separately per tier for multi-currency support.
   */
  @Column({
    name: 'monthly_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  monthlyPrice!: number;

  /**
   * ISO 4217 currency code (e.g. 'NGN', 'USD').
   * Set by admin — defaults to NGN on seed but overrideable.
   */
  @Column({ name: 'currency', length: 3 })
  currency!: string;

  /**
   * Feature flags and per-tier limits.
   * All values are set and updated by admin via the admin API.
   * Stored as JSONB for schema flexibility without migrations.
   */
  @Column({ name: 'features', type: 'jsonb' })
  features!: TierFeatures;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
