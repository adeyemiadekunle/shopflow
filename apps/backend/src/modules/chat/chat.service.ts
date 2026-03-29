import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformConfigKey } from '../platform-config/constants/platform-config.keys';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { Conversation } from './entities/conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { MessageSenderRole } from './enums/message-sender-role.enum';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convoRepo: Repository<Conversation>,
    @InjectRepository(ChatMessage)
    private readonly msgRepo: Repository<ChatMessage>,
    private readonly platformConfigService: PlatformConfigService,
  ) {}

  private async assertChatEnabled(): Promise<void> {
    const chatEnabled = await this.platformConfigService.getBoolean(
      PlatformConfigKey.FEATURE_CHAT_ENABLED,
      true,
    );

    if (!chatEnabled) {
      throw new NotFoundException('Chat is not enabled right now');
    }
  }

  /**
   * Find or create a conversation between buyer and seller.
   * A buyer initiates; the same pair always maps to the same conversation.
   */
  async findOrCreateConversation(
    buyerId: string,
    sellerProfileId: string,
  ): Promise<Conversation> {
    await this.assertChatEnabled();

    let convo = await this.convoRepo.findOne({
      where: { buyerId, sellerProfileId },
      relations: ['sellerProfile', 'buyer'],
    });
    if (!convo) {
      convo = await this.convoRepo.save(
        this.convoRepo.create({ buyerId, sellerProfileId }),
      );
      convo = await this.convoRepo.findOneOrFail({
        where: { id: convo.id },
        relations: ['sellerProfile', 'buyer'],
      });
    }
    return convo;
  }

  /**
   * List all conversations for a user (buyer sees their buyer convos,
   * seller sees convos on their seller profile).
   */
  async listConversations(
    userId: string,
    role: UserRole,
    sellerProfileId?: string,
  ): Promise<Conversation[]> {
    if (role === UserRole.SELLER && sellerProfileId) {
      return this.convoRepo.find({
        where: { sellerProfileId },
        relations: ['buyer', 'sellerProfile'],
        order: { lastMessageAt: { direction: 'DESC', nulls: 'LAST' } },
      });
    }
    return this.convoRepo.find({
      where: { buyerId: userId },
      relations: ['sellerProfile', 'buyer'],
      order: { lastMessageAt: { direction: 'DESC', nulls: 'LAST' } },
    });
  }

  async getMessages(
    conversationId: string,
    page = 1,
    limit = 50,
  ): Promise<ChatMessage[]> {
    return this.msgRepo.find({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderRole: MessageSenderRole,
    content: string,
  ): Promise<ChatMessage> {
    const convo = await this.convoRepo.findOne({
      where: { id: conversationId },
    });
    if (!convo) throw new NotFoundException('Conversation not found');
    await this.assertChatEnabled();

    const msg = await this.msgRepo.save(
      this.msgRepo.create({
        conversationId,
        senderId,
        senderRole,
        content,
      }),
    );

    await this.convoRepo.update(conversationId, { lastMessageAt: new Date() });
    return msg;
  }

  async markAsRead(conversationId: string, readerId: string): Promise<void> {
    await this.msgRepo
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ readAt: new Date() })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :readerId', { readerId })
      .andWhere('read_at IS NULL')
      .execute();
  }

  /** Check if a user is a participant in a conversation */
  async isParticipant(
    conversationId: string,
    userId: string,
    sellerProfileId?: string,
  ): Promise<boolean> {
    const convo = await this.convoRepo.findOne({
      where: { id: conversationId },
    });
    if (!convo) return false;
    return (
      convo.buyerId === userId || convo.sellerProfileId === sellerProfileId
    );
  }
}
