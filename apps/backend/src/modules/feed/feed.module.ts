import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedPost } from './entities/feed-post.entity';
import { FeedLike } from './entities/feed-like.entity';
import { FeedComment } from './entities/feed-comment.entity';
import { FeedFollow } from './entities/feed-follow.entity';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { MediaModule } from '../media/media.module';
import { Product } from '../catalog/entities/product.entity';
import { PlatformConfigModule } from '../platform-config/platform-config.module';

@Module({
  imports: [
    MediaModule,
    PlatformConfigModule,
    TypeOrmModule.forFeature([
      FeedPost,
      FeedLike,
      FeedComment,
      FeedFollow,
      Product,
    ]),
  ],
  providers: [FeedService],
  controllers: [FeedController],
  exports: [FeedService],
})
export class FeedModule {}
