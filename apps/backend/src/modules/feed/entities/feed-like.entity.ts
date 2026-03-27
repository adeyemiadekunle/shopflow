import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from 'typeorm';
import { FeedPost } from './feed-post.entity';
import { User } from '../../users/entities/user.entity';

@Entity('feed_likes')
@Unique(['postId', 'userId'])
export class FeedLike {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => FeedPost, (post) => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: FeedPost;

  @Column({ name: 'post_id' })
  postId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
