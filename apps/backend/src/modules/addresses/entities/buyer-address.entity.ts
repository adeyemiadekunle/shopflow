import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('buyer_addresses')
export class BuyerAddress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @Column({ name: 'buyer_id' })
  buyerId!: string;

  @Column({ length: 120 })
  label!: string;

  @Column({ name: 'address_line_1', length: 200 })
  addressLine1!: string;

  @Column({ name: 'address_line_2', length: 200, nullable: true })
  addressLine2?: string;

  @Column({ length: 120 })
  state!: string;

  @Column({ length: 120 })
  lga!: string;

  @Column({ length: 20, nullable: true })
  postcode?: string;

  @Column({ length: 2 })
  country!: string;

  @Column({ name: 'recipient_name', length: 200, nullable: true })
  recipientName?: string;

  @Column({ name: 'recipient_phone', length: 20, nullable: true })
  recipientPhone?: string;

  @Column({ name: 'use_for_delivery', default: true })
  useForDelivery!: boolean;

  @Column({ name: 'use_for_billing', default: false })
  useForBilling!: boolean;

  @Column({ name: 'is_default_delivery', default: false })
  isDefaultDelivery!: boolean;

  @Column({ name: 'is_default_billing', default: false })
  isDefaultBilling!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
