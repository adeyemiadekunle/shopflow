import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SellerProfile } from '../../sellers/entities/seller-profile.entity';
import { FeedPostStatus } from '../enums/feed-post-status.enum';
import { UploadMediaType } from '../../media/dto/media.dto';
import type { FeedLike } from './feed-like.entity';
import type { FeedComment } from './feed-comment.entity';

export type FeedPostMedia = {
  type: UploadMediaType;
  url: string;
  cdnKey?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

@Entity('feed_posts')
export class FeedPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => SellerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_profile_id' })
  sellerProfile!: SellerProfile;

  @Column({ name: 'seller_profile_id' })
  sellerProfileId!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'media_urls', type: 'text', array: true, default: '{}' })
  mediaUrls!: string[];

  @Column({ name: 'media', type: 'jsonb', nullable: true })
  media?: FeedPostMedia[];

  /** Optional product tag — links post to a catalog product */
  @Column({ name: 'product_id', nullable: true })
  productId?: string;

  @Column({
    type: 'enum',
    enum: FeedPostStatus,
    default: FeedPostStatus.PUBLISHED,
  })
  status!: FeedPostStatus;

  @Column({ name: 'like_count', default: 0 })
  likeCount!: number;

  @Column({ name: 'comment_count', default: 0 })
  commentCount!: number;

  @OneToMany('FeedLike', 'post')
  likes?: FeedLike[];

  @OneToMany('FeedComment', 'post')
  comments?: FeedComment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
