import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { CreateFeedPostDto, CreateCommentDto } from './dto/feed.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  // ─── Posts ──────────────────────────────────────────────────────────────────

  @Post('posts')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Create a new feed post (seller only)' })
  createPost(@CurrentUser() user: any, @Body() dto: CreateFeedPostDto) {
    return this.feedService.createPost(user.sellerProfileId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Personalised feed (posts from followed sellers)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getPersonalisedFeed(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feedService.getPersonalisedFeed(
      user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('explore')
  @Public()
  @ApiOperation({ summary: 'Explore feed — latest posts from all sellers' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getExploreFeed(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.feedService.getExploreFeed(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('posts/:id')
  @Public()
  @ApiOperation({ summary: 'Get a single post' })
  getPost(@Param('id') id: string) {
    return this.feedService.getPost(id);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Archive a post (seller owner or admin)' })
  archivePost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.feedService.archivePost(
      id,
      user.sub,
      user.role === UserRole.ADMIN,
    );
  }

  // ─── Likes ──────────────────────────────────────────────────────────────────

  @Post('posts/:id/like')
  @ApiOperation({ summary: 'Toggle like on a post' })
  toggleLike(@Param('id') id: string, @CurrentUser() user: any) {
    return this.feedService.toggleLike(id, user.sub);
  }

  // ─── Comments ──────────────────────────────────────────────────────────────

  @Get('posts/:id/comments')
  @Public()
  @ApiOperation({ summary: 'List comments on a post' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getComments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feedService.getComments(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('posts/:id/comments')
  @ApiOperation({ summary: 'Add a comment to a post' })
  addComment(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.feedService.addComment(id, user.sub, dto);
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Delete a comment (owner or admin)' })
  deleteComment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.feedService.deleteComment(
      id,
      user.sub,
      user.role === UserRole.ADMIN,
    );
  }

  // ─── Follows ──────────────────────────────────────────────────────────────

  @Post('follow/:sellerProfileId')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Follow a seller' })
  follow(
    @Param('sellerProfileId') sellerProfileId: string,
    @CurrentUser() user: any,
  ) {
    return this.feedService.follow(user.sub, sellerProfileId);
  }

  @Delete('follow/:sellerProfileId')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Unfollow a seller' })
  unfollow(
    @Param('sellerProfileId') sellerProfileId: string,
    @CurrentUser() user: any,
  ) {
    return this.feedService.unfollow(user.sub, sellerProfileId);
  }

  @Get('following')
  @ApiOperation({ summary: 'List sellers the current user follows' })
  getFollowing(@CurrentUser() user: any) {
    return this.feedService.getFollowing(user.sub);
  }
}
