import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { SellerProfile } from '../../sellers/entities/seller-profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 320 })
  email!: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash!: string;

  @Column({ name: 'first_name', length: 100, nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName?: string;

  @Column({ name: 'phone_number', length: 20, nullable: true, unique: true })
  phoneNumber?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.BUYER })
  role!: UserRole;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'refresh_token_hash', nullable: true, select: false })
  refreshTokenHash?: string;

  @Column({
    name: 'email_verification_token_hash',
    nullable: true,
    select: false,
  })
  emailVerificationTokenHash?: string;

  @Column({
    name: 'email_verification_token_expires_at',
    type: 'timestamp',
    nullable: true,
  })
  emailVerificationTokenExpiresAt?: Date;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @Column({
    name: 'password_reset_token_hash',
    nullable: true,
    select: false,
  })
  passwordResetTokenHash?: string;

  @Column({
    name: 'password_reset_token_expires_at',
    type: 'timestamp',
    nullable: true,
  })
  passwordResetTokenExpiresAt?: Date;

  @Column({ name: 'password_changed_at', type: 'timestamp', nullable: true })
  passwordChangedAt?: Date;

  @OneToOne(() => SellerProfile, (profile) => profile.user, { nullable: true })
  sellerProfile?: SellerProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
