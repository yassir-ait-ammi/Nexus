import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitmqService } from '../common/rabbitmq/rabbitmq.service';
import { NotificationService } from './notification.service';
import { AuthUsersService } from '../common/auth-users/auth-users.service';
import { MembershipService } from '../membership/membership.service';
import { ChannelService } from '../channel/channel.service';
import { ChatGateway } from '../chat/chat.gateway';
import { MESSAGE_CREATED_ROUTING_KEY } from '../common/rabbitmq/routing-keys';

const MENTION_QUEUE = 'notifications.mention';

interface MessageCreatedEvent {
  messageId: string;
  channelId: string;
  workspaceId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

function extractMentionedUsernames(content: string): string[] {
  const matches = content.match(/@([a-zA-Z0-9_-]+)/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1)))];
}

// Consumes `message.created` events off RabbitMQ (published by
// MessageService on the request path) and turns @mentions into real
// notifications, off the hot path of actually sending the message.
@Injectable()
export class MentionNotifierService implements OnModuleInit {
  private readonly logger = new Logger(MentionNotifierService.name);

  constructor(
    private readonly rabbitmqService: RabbitmqService,
    private readonly notificationService: NotificationService,
    private readonly authUsersService: AuthUsersService,
    private readonly membershipService: MembershipService,
    private readonly channelService: ChannelService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async onModuleInit() {
    await this.rabbitmqService.consume(MENTION_QUEUE, MESSAGE_CREATED_ROUTING_KEY, (payload) =>
      this.handleMessageCreated(payload as MessageCreatedEvent),
    );
  }

  private async handleMessageCreated(event: MessageCreatedEvent) {
    const usernames = extractMentionedUsernames(event.content);
    if (usernames.length === 0) return;

    const userIdsByUsername = await this.authUsersService.findIdsByUsernames(usernames);
    const mentionedUserIds = [...new Set(userIdsByUsername.values())].filter(
      (id) => id !== event.senderId,
    );
    if (mentionedUserIds.length === 0) return;

    for (const userId of mentionedUserIds) {
      const isMember = await this.membershipService.isMember(event.workspaceId, userId);
      if (!isMember) continue;

      const canAccess = await this.channelService.canAccess(event.channelId, userId);
      if (!canAccess) continue;

      const notification = await this.notificationService.create({
        userId,
        workspaceId: event.workspaceId,
        channelId: event.channelId,
        messageId: event.messageId,
        senderId: event.senderId,
        body: event.content.slice(0, 200),
      });

      const dto = await this.notificationService.hydrateOne(notification);
      this.chatGateway.broadcastNotification(userId, dto);
      this.logger.log(`Notified ${userId} of mention in message ${event.messageId}`);
    }
  }
}
