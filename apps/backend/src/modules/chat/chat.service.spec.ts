import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { ChatService } from './chat.service';
import { Conversation } from './entities/conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { MessageSenderRole } from './enums/message-sender-role.enum';

describe('ChatService', () => {
  let service: ChatService;

  const mockConversationRepo = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
    update: jest.fn(),
    find: jest.fn(),
  };

  const mockMessageRepo = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
    createQueryBuilder: jest.fn(),
  };

  const mockPlatformConfigService = {
    getBoolean: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: mockConversationRepo,
        },
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: mockMessageRepo,
        },
        {
          provide: PlatformConfigService,
          useValue: mockPlatformConfigService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('getMessages() should reject non-participants', async () => {
    mockConversationRepo.findOne.mockResolvedValue({
      id: 'conversation-1',
      buyerId: 'buyer-1',
      sellerProfileId: 'seller-1',
    });

    await expect(
      service.getMessages('conversation-1', 'buyer-2', undefined),
    ).rejects.toThrow(ForbiddenException);
  });

  it('sendMessage() should reject senders outside the conversation', async () => {
    mockConversationRepo.findOne.mockResolvedValue({
      id: 'conversation-1',
      buyerId: 'buyer-1',
      sellerProfileId: 'seller-1',
    });

    await expect(
      service.sendMessage(
        'conversation-1',
        'seller-user-2',
        'seller-2',
        MessageSenderRole.SELLER,
        'Hello there',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('markAsRead() should reject non-participants before updating messages', async () => {
    const execute = jest.fn();
    const andWhere = jest.fn().mockReturnValue({ execute });
    const where = jest.fn().mockReturnValue({ andWhere });
    const set = jest.fn().mockReturnValue({ where });
    const update = jest.fn().mockReturnValue({ set });
    mockMessageRepo.createQueryBuilder.mockReturnValue({ update });
    mockConversationRepo.findOne.mockResolvedValue({
      id: 'conversation-1',
      buyerId: 'buyer-1',
      sellerProfileId: 'seller-1',
    });

    await expect(
      service.markAsRead('conversation-1', 'buyer-2'),
    ).rejects.toThrow(ForbiddenException);

    expect(execute).not.toHaveBeenCalled();
  });
});
