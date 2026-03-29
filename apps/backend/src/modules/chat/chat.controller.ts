import { Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations/:sellerProfileId')
  @Roles(UserRole.BUYER)
  @ApiOperation({
    summary: 'Start or retrieve conversation with a seller (buyer only)',
  })
  startConversation(
    @Param('sellerProfileId') sellerProfileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chatService.findOrCreateConversation(user.id, sellerProfileId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations for the current user' })
  listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.listConversations(
      user.id,
      user.role,
      user.sellerProfileId,
    );
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Load message history for a conversation' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMessages(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      id,
      user.id,
      user.sellerProfileId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.chatService.markAsRead(id, user.id, user.sellerProfileId);
  }
}
