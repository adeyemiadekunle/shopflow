import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { LedgerAccountType } from '../enums/ledger.enum';
import type { LedgerEntry } from './ledger-entry.entity';

@Entity('ledger_accounts')
export class LedgerAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: LedgerAccountType })
  type!: LedgerAccountType;

  /** owner_id maps to seller_profile_id for seller accounts, null for platform accounts */
  @Column({ name: 'owner_id', nullable: true })
  ownerId?: string;

  @Column({ name: 'currency', length: 3 })
  currency!: string;

  /** Denormalised balance for fast reads — ledger entries are source of truth */
  @Column({
    name: 'balance',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  balance!: number;

  @OneToMany('LedgerEntry', 'account')
  // Relation<any> intentional: avoids circular emitDecoratorMetadata emission
  entries?: Relation<LedgerEntry>[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
