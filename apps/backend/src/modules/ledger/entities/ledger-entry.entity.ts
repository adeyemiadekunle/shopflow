import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LedgerAccountType, LedgerEventType } from '../enums/ledger.enum';
import { LedgerAccount } from './ledger-account.entity';

/**
 * LedgerEntry — IMMUTABLE.
 * Entries are NEVER updated or deleted after creation.
 * The source of truth for all money movements on Shopflow.
 */
@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => LedgerAccount, (a) => a.entries, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account!: LedgerAccount;

  @Column({ name: 'account_id' })
  accountId!: string;

  @Column({ type: 'enum', enum: LedgerEventType })
  eventType!: LedgerEventType;

  @Column({ name: 'account_type', type: 'enum', enum: LedgerAccountType })
  accountType!: LedgerAccountType;

  /** Positive = credit to the account, Negative = debit */
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({ name: 'currency', length: 3 })
  currency!: string;

  @Column({ name: 'order_id', nullable: true })
  orderId?: string;

  @Column({ name: 'payment_id', nullable: true })
  paymentId?: string;

  @Column({ name: 'payout_id', nullable: true })
  payoutId?: string;

  @Column({ name: 'actor_id', nullable: true })
  actorId?: string;

  @Column({ name: 'policy_version', nullable: true })
  policyVersion?: string;

  @Column({ name: 'reference', nullable: true })
  reference?: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
