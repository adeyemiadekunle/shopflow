import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SellerProfile } from '../../sellers/entities/seller-profile.entity';
import type { ChatMessage } from './chat-message.entity';

@Entity('conversations')
@Unique(['buyerId', 'sellerProfileId'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @Column({ name: 'buyer_id' })
  buyerId!: string;

  @ManyToOne(() => SellerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_profile_id' })
  sellerProfile!: SellerProfile;

  @Column({ name: 'seller_profile_id' })
  sellerProfileId!: string;

  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt?: Date;

  @OneToMany('ChatMessage', 'conversation')
  messages?: ChatMessage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
