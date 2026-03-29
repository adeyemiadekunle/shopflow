import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SellerStatus } from '../enums/seller-status.enum';

@Entity('seller_profiles')
export class SellerProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, (user) => user.sellerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'store_name', length: 200 })
  storeName!: string;

  @Column({ name: 'store_slug', unique: true, length: 200 })
  storeSlug!: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({ name: 'banner_url', nullable: true })
  bannerUrl?: string;

  @Column({ name: 'support_email', nullable: true })
  supportEmail?: string;

  @Column({ name: 'support_phone', nullable: true })
  supportPhone?: string;

  // Return policy is set by the platform (via PolicyRule), not per seller.

  @Column({
    type: 'enum',
    enum: SellerStatus,
    default: SellerStatus.PENDING,
  })
  status!: SellerStatus;

  @Column({ name: 'kyc_verified', default: false })
  kycVerified!: boolean;

  // Commission rate is not stored here and stays under platform policy rules.

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
