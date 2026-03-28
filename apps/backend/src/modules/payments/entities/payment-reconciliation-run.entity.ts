import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PaymentReconciliationRunTrigger {
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
}

export enum PaymentReconciliationRunStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  COMPLETED_WITH_ISSUES = 'completed_with_issues',
  FAILED = 'failed',
}

@Entity('payment_reconciliation_runs')
export class PaymentReconciliationRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: PaymentReconciliationRunTrigger,
  })
  trigger!: PaymentReconciliationRunTrigger;

  @Column({
    type: 'enum',
    enum: PaymentReconciliationRunStatus,
    default: PaymentReconciliationRunStatus.STARTED,
  })
  status!: PaymentReconciliationRunStatus;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ name: 'scanned_count', type: 'int', default: 0 })
  scannedCount!: number;

  @Column({ name: 'verified_count', type: 'int', default: 0 })
  verifiedCount!: number;

  @Column({ name: 'repaired_count', type: 'int', default: 0 })
  repairedCount!: number;

  @Column({ name: 'issue_count', type: 'int', default: 0 })
  issueCount!: number;

  @Column({ name: 'initiated_by_user_id', nullable: true })
  initiatedByUserId?: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
