import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SellerProfile } from './seller-profile.entity';

@Entity('seller_kycs')
export class SellerKyc {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => SellerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_profile_id' })
  sellerProfile!: SellerProfile;

  @Column({ name: 'seller_profile_id' })
  sellerProfileId!: string;

  @Column({ name: 'business_name', nullable: true })
  businessName?: string;

  @Column({ name: 'business_type', nullable: true })
  businessType?: string;

  @Column({ name: 'rc_number', nullable: true })
  rcNumber?: string;

  @Column({ name: 'bvn', nullable: true, select: false })
  bvn?: string;

  @Column({ name: 'nin', nullable: true, select: false })
  nin?: string;

  @Column({ name: 'id_document_url', nullable: true })
  idDocumentUrl?: string;

  @Column({ name: 'address_line_1', nullable: true })
  addressLine1?: string;

  @Column({ name: 'address_line_2', nullable: true })
  addressLine2?: string;

  @Column({ name: 'state', nullable: true })
  state?: string;

  @Column({ name: 'lga', nullable: true })
  lga?: string;

  @Column({ name: 'postcode', nullable: true })
  postcode?: string;

  @Column({ name: 'country', length: 2, nullable: true })
  country?: string;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
