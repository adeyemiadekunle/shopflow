import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MediaService } from '../media/media.service';
import { UploadMediaType } from '../media/dto/media.dto';
import { PlatformConfigKey } from '../platform-config/constants/platform-config.keys';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { FeedPost } from './entities/feed-post.entity';
import { FeedLike } from './entities/feed-like.entity';
import { FeedComment } from './entities/feed-comment.entity';
import { FeedFollow } from './entities/feed-follow.entity';
import { FeedPostMedia } from './entities/feed-post.entity';
import { FeedPostStatus } from './enums/feed-post-status.enum';
import { CreateFeedPostDto, CreateCommentDto } from './dto/feed.dto';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(FeedPost)
    private readonly postRepo: Repository<FeedPost>,
    @InjectRepository(FeedLike)
    private readonly likeRepo: Repository<FeedLike>,
    @InjectRepository(FeedComment)
    private readonly commentRepo: Repository<FeedComment>,
    @InjectRepository(FeedFollow)
    private readonly followRepo: Repository<FeedFollow>,
    private readonly mediaService: MediaService,
    private readonly platformConfigService: PlatformConfigService,
  ) {}

  // ─── Posts ──────────────────────────────────────────────────────────────────

  async createPost(
    sellerProfileId: string,
    dto: CreateFeedPostDto,
  ): Promise<FeedPost> {
    const media: FeedPostMedia[] =
      dto.media ??
      dto.mediaUrls?.map((url) => ({
        type: UploadMediaType.IMAGE,
        url,
      })) ??
      [];

    const feedEnabled = await this.platformConfigService.getBoolean(
      PlatformConfigKey.FEATURE_FEED_ENABLED,
      true,
    );
    const feedImagesEnabled = await this.platformConfigService.getBoolean(
      PlatformConfigKey.FEATURE_MEDIA_FEED_IMAGES_ENABLED,
      true,
    );
    const feedVideoEnabled = await this.platformConfigService.getBoolean(
      PlatformConfigKey.FEATURE_MEDIA_FEED_VIDEO_ENABLED,
      false,
    );

    if (!feedEnabled) {
      throw new ForbiddenException('Feed posting is not enabled right now');
    }

    if (
      media.some((item) => item.type === UploadMediaType.IMAGE) &&
      !feedImagesEnabled
    ) {
      throw new ForbiddenException('Feed image uploads are not enabled right now');
    }

    if (
      media.some((item) => item.type === UploadMediaType.VIDEO) &&
      !feedVideoEnabled
    ) {
      throw new ForbiddenException('Feed video uploads are not enabled right now');
    }

    for (const item of media) {
      if (!this.mediaService.isAllowedPublicUrl(item.url.trim())) {
        throw new ForbiddenException(
          'Feed media must use the configured CloudFront media base URL',
        );
      }
    }

    return this.postRepo.save(
      this.postRepo.create({
        sellerProfileId,
        content: dto.content,
        mediaUrls: media.map((item) => item.url),
        media,
        productId: dto.productId,
      }),
    );
  }

  async getPost(id: string): Promise<FeedPost> {
    const post = await this.postRepo.findOne({
      where: { id, status: FeedPostStatus.PUBLISHED },
      relations: ['sellerProfile'],
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async archivePost(
    postId: string,
    requesterId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['sellerProfile'],
    });
    if (!post) throw new NotFoundException('Post not found');
    if (!isAdmin && post.sellerProfile.userId !== requesterId) {
      throw new ForbiddenException('Not your post');
    }
    await this.postRepo.update(postId, { status: FeedPostStatus.ARCHIVED });
  }

  /**
   * Personalised feed — posts from sellers the user follows, newest first.
   */
  async getPersonalisedFeed(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<FeedPost[]> {
    const follows = await this.followRepo.find({
      where: { followerId: userId },
      select: ['sellerProfileId'],
    });
    if (follows.length === 0) return [];

    const sellerIds = follows.map((f) => f.sellerProfileId);
    return this.postRepo.find({
      where: {
        sellerProfileId: In(sellerIds),
        status: FeedPostStatus.PUBLISHED,
      },
      relations: ['sellerProfile'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  /**
   * Explore feed — latest posts from all sellers.
   */
  async getExploreFeed(page = 1, limit = 20): Promise<FeedPost[]> {
    return this.postRepo.find({
      where: { status: FeedPostStatus.PUBLISHED },
      relations: ['sellerProfile'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  // ─── Likes ──────────────────────────────────────────────────────────────────

  /** Toggle like — idempotent. Returns true if now liked, false if unliked. */
  async toggleLike(postId: string, userId: string): Promise<boolean> {
    const existing = await this.likeRepo.findOne({
      where: { postId, userId },
    });
    if (existing) {
      await this.likeRepo.remove(existing);
      await this.postRepo.decrement({ id: postId }, 'likeCount', 1);
      return false;
    }
    await this.likeRepo.save(this.likeRepo.create({ postId, userId }));
    await this.postRepo.increment({ id: postId }, 'likeCount', 1);
    return true;
  }

  // ─── Comments ──────────────────────────────────────────────────────────────

  async getComments(
    postId: string,
    page = 1,
    limit = 20,
  ): Promise<FeedComment[]> {
    return this.commentRepo.find({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async addComment(
    postId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<FeedComment> {
    const comment = await this.commentRepo.save(
      this.commentRepo.create({ postId, userId, content: dto.content }),
    );
    await this.postRepo.increment({ id: postId }, 'commentCount', 1);
    return comment;
  }

  async deleteComment(
    commentId: string,
    requesterId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (!isAdmin && comment.userId !== requesterId) {
      throw new ForbiddenException('Not your comment');
    }
    await this.commentRepo.remove(comment);
    await this.postRepo.decrement({ id: comment.postId }, 'commentCount', 1);
  }

  // ─── Follows ──────────────────────────────────────────────────────────────

  async follow(followerId: string, sellerProfileId: string): Promise<void> {
    const exists = await this.followRepo.findOne({
      where: { followerId, sellerProfileId },
    });
    if (exists) return; // already following
    await this.followRepo.save(
      this.followRepo.create({ followerId, sellerProfileId }),
    );
  }

  async unfollow(followerId: string, sellerProfileId: string): Promise<void> {
    await this.followRepo.delete({ followerId, sellerProfileId });
  }

  async getFollowing(userId: string): Promise<FeedFollow[]> {
    return this.followRepo.find({
      where: { followerId: userId },
      relations: ['sellerProfile'],
      order: { createdAt: 'DESC' },
    });
  }
}
