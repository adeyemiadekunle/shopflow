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
import { BankAccount } from '../../sellers/entities/bank-account.entity';
import { PaymentProvider } from '../../payments/enums/payment-provider.enum';

export enum PayoutStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REVERSED = 'reversed',
  REJECTED = 'rejected',
}

@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => SellerProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seller_profile_id' })
  sellerProfile!: SellerProfile;

  @Column({ name: 'seller_profile_id' })
  sellerProfileId!: string;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount!: BankAccount;

  @Column({ name: 'bank_account_id' })
  bankAccountId!: string;

  @Column({ name: 'reference', unique: true, length: 100 })
  reference!: string;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.PAYSTACK,
  })
  provider!: PaymentProvider;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount!: number;

  @Column({ name: 'currency', length: 3 })
  currency!: string;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.REQUESTED,
  })
  status!: PayoutStatus;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason?: string;

  @Column({ name: 'requested_by_id' })
  requestedById!: string;

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById?: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt?: Date;

  @Column({ name: 'reversed_at', type: 'timestamp', nullable: true })
  reversedAt?: Date;

  @Column({ name: 'paystack_transfer_code', nullable: true })
  paystackTransferCode?: string;

  @Column({ name: 'paystack_transfer_id', nullable: true })
  paystackTransferId?: string;

  @Column({ name: 'paystack_recipient_code', nullable: true })
  paystackRecipientCode?: string;

  @Column({ name: 'provider_transfer_reference', nullable: true })
  providerTransferReference?: string;

  @Column({ name: 'provider_transfer_id', nullable: true })
  providerTransferId?: string;

  @Column({ name: 'provider_batch_reference', nullable: true })
  providerBatchReference?: string;

  @Column({ name: 'provider_recipient_reference', nullable: true })
  providerRecipientReference?: string;

  @Column({ name: 'raw_transfer_payload', type: 'jsonb', nullable: true })
  rawTransferPayload?: Record<string, unknown>;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
