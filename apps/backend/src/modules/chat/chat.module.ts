import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Conversation } from './entities/conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from '../users/users.module';
import { PlatformConfigModule } from '../platform-config/platform-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ChatMessage]),
    UsersModule,
    PlatformConfigModule,
    JwtModule.register({}), // Secret provided via ConfigService in the gateway
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
