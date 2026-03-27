import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SellerProfile } from '../../sellers/entities/seller-profile.entity';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductMedia } from './product-media.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  MODERATION_HOLD = 'moderation_hold',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => SellerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_profile_id' })
  sellerProfile!: SellerProfile;

  @Column({ name: 'seller_profile_id' })
  sellerProfileId!: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @Column({ name: 'category_id', nullable: true })
  categoryId?: string;

  @Column({ length: 300 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'base_price', type: 'decimal', precision: 12, scale: 2 })
  basePrice!: number;

  @Column({ name: 'currency', length: 3 })
  currency!: string;

  // ─── Discount ──────────────────────────────────────────────────
  /** Whether a discount is currently active */
  @Column({ name: 'has_discount', default: false })
  hasDiscount!: boolean;

  /** 'percentage' = % off base price, 'fixed' = flat NGN amount off */
  @Column({
    name: 'discount_type',
    type: 'enum',
    enum: DiscountType,
    nullable: true,
  })
  discountType?: DiscountType;

  /**
   * For PERCENTAGE: value 0–100 (e.g. 20 → 20% off).
   * For FIXED: absolute amount in NGN (e.g. 500 → ₦500 off).
   */
  @Column({
    name: 'discount_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  discountValue?: number;

  /** Optional scheduled start for the discount window */
  @Column({ name: 'discount_starts_at', type: 'timestamp', nullable: true })
  discountStartsAt?: Date;

  /** Optional scheduled end for the discount window */
  @Column({ name: 'discount_ends_at', type: 'timestamp', nullable: true })
  discountEndsAt?: Date;

  /**
   * Computed effective price after discount (denormalised for fast reads/sorting).
   * Recalculated whenever discount fields change.
   */
  @Column({
    name: 'effective_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  effectivePrice?: number;
  // ────────────────────────────────────────────────────────────────

  @Column({ name: 'weight_grams', nullable: true })
  weightGrams?: number;

  @Column({ name: 'handling_days', default: 1 })
  handlingDays!: number;

  @Column({ name: 'tags', type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status!: ProductStatus;

  @OneToMany(() => ProductVariant, (v) => v.product, { cascade: true })
  variants?: ProductVariant[];

  @OneToMany(() => ProductMedia, (m) => m.product, { cascade: true })
  media?: ProductMedia[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
