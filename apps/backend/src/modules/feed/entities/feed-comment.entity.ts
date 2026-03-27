import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FeedPost } from './feed-post.entity';
import { User } from '../../users/entities/user.entity';

@Entity('feed_comments')
export class FeedComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => FeedPost, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: FeedPost;

  @Column({ name: 'post_id' })
  postId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
