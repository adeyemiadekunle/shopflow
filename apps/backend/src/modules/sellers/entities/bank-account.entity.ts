import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SellerProfile } from './seller-profile.entity';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => SellerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_profile_id' })
  sellerProfile!: SellerProfile;

  @Column({ name: 'seller_profile_id' })
  sellerProfileId!: string;

  @Column({ name: 'bank_code', length: 10, nullable: true })
  bankCode?: string;

  @Column({ name: 'bank_name', length: 200 })
  bankName!: string;

  @Column({ name: 'account_number', length: 20 })
  accountNumber!: string;

  @Column({ name: 'account_name', length: 300 })
  accountName!: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary!: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @Column({ name: 'resolved_account_name', nullable: true })
  resolvedAccountName?: string;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'paystack_recipient_code', nullable: true })
  paystackRecipientCode?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
