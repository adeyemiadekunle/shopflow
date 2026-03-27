import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { MessageSenderRole } from './enums/message-sender-role.enum';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authenticate on connection using JWT in handshake auth.
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) throw new UnauthorizedException('No token');

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });

      // Attach user payload to socket data for later use
      (client as any).user = payload;
      this.logger.log(`Client connected: ${payload.sub}`);
    } catch {
      this.logger.warn('Unauthorized WebSocket connection attempt');
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user = (client as any).user;
    const isParticipant = await this.chatService.isParticipant(
      data.conversationId,
      user.sub,
      user.sellerProfileId,
    );
    if (!isParticipant) {
      client.emit('error', {
        message: 'Not a participant in this conversation',
      });
      return;
    }
    await client.join(`conversation:${data.conversationId}`);
    this.logger.log(
      `User ${user.sub} joined room conversation:${data.conversationId}`,
    );
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user = (client as any).user;
    const senderRole =
      user.role === 'seller'
        ? MessageSenderRole.SELLER
        : MessageSenderRole.BUYER;

    const message = await this.chatService.sendMessage(
      data.conversationId,
      user.sub,
      senderRole,
      data.content,
    );

    // Broadcast to everyone in the room (including sender)
    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('new_message', message);
  }
}
