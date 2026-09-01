import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ChannelService } from '../channel/channel.service';
import { MembershipService } from '../membership/membership.service';
import { AuthUsersService } from '../common/auth-users/auth-users.service';
import { ChatGateway } from '../chat/chat.gateway';
import { RabbitmqService } from '../common/rabbitmq/rabbitmq.service';
import { MESSAGE_CREATED_ROUTING_KEY } from '../common/rabbitmq/routing-keys';

export interface HydratedMessage {
  id: string;
  channelId: string;
  workspaceId: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar: string | null;
    status: 'online';
    role: 'Member';
    createdAt: string;
  } | null;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  replyToId?: string;
  replyToMessage?: { senderName: string; content: string };
  reactions: Record<string, string[]>;
  attachments: unknown[];
}

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageReaction)
    private readonly reactionRepository: Repository<MessageReaction>,
    private readonly channelService: ChannelService,
    private readonly membershipService: MembershipService,
    private readonly authUsersService: AuthUsersService,
    private readonly chatGateway: ChatGateway,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  private async reactionsByMessageId(
    messageIds: string[],
  ): Promise<Map<string, Record<string, string[]>>> {
    if (messageIds.length === 0) return new Map();
    const rows = await this.reactionRepository.findBy({ messageId: In(messageIds) });

    const byMessage = new Map<string, Record<string, string[]>>();
    for (const row of rows) {
      const reactions = byMessage.get(row.messageId) ?? {};
      reactions[row.emoji] = [...(reactions[row.emoji] ?? []), row.userId];
      byMessage.set(row.messageId, reactions);
    }
    return byMessage;
  }

  private async hydrate(messages: Message[]): Promise<HydratedMessage[]> {
    const senderIds = messages.map((m) => m.senderId);
    const replyToIds = messages
      .map((m) => m.replyToId)
      .filter((id): id is string => !!id);
    const [users, replyTargets, reactionsByMessage] = await Promise.all([
      this.authUsersService.findByIds(senderIds),
      replyToIds.length
        ? this.messageRepository.findBy({ id: In(replyToIds) })
        : Promise.resolve([] as Message[]),
      this.reactionsByMessageId(messages.map((m) => m.id)),
    ]);
    const replyTargetUsers = await this.authUsersService.findByIds(
      replyTargets.map((m) => m.senderId),
    );
    const replyTargetsById = new Map(replyTargets.map((m) => [m.id, m]));

    return messages.map((m) => {
      const sender = users.get(m.senderId);
      const replyTarget = m.replyToId
        ? replyTargetsById.get(m.replyToId)
        : undefined;
      const replyTargetSender = replyTarget
        ? replyTargetUsers.get(replyTarget.senderId)
        : undefined;

      return {
        id: m.id,
        channelId: m.channelId,
        workspaceId: m.workspaceId,
        senderId: m.senderId,
        sender: sender
          ? {
              id: sender.id,
              name: sender.name,
              username: sender.username,
              email: sender.email,
              avatar: sender.avatar,
              status: 'online' as const,
              role: 'Member' as const,
              createdAt: sender.createdAt,
            }
          : null,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt?.toISOString(),
        isEdited: m.isEdited,
        replyToId: m.replyToId ?? undefined,
        replyToMessage:
          replyTarget && replyTargetSender
            ? {
                senderName: replyTargetSender.name,
                content: replyTarget.content,
              }
            : undefined,
        reactions: reactionsByMessage.get(m.id) ?? {},
        attachments: [],
      };
    });
  }

  private async assertChannelAccess(channelId: string, userId: string) {
    const channel = await this.channelService.findOne(channelId, userId);
    return channel;
  }

  async create(dto: CreateMessageDto, userId: string) {
    const channel = await this.assertChannelAccess(dto.channelId, userId);

    const message = this.messageRepository.create({
      channelId: channel.id,
      workspaceId: channel.workspaceId,
      senderId: userId,
      content: dto.content,
      replyToId: dto.replyToId ?? null,
    });
    const saved = await this.messageRepository.save(message);
    const [hydrated] = await this.hydrate([saved]);
    this.chatGateway.broadcastMessageCreated(hydrated);

    // Fire-and-forget: mention notifications are a side effect, not part of
    // "did the message send" — a slow/failed consumer shouldn't hold up or
    // fail the send.
    this.rabbitmqService
      .publish(MESSAGE_CREATED_ROUTING_KEY, {
        messageId: saved.id,
        channelId: saved.channelId,
        workspaceId: saved.workspaceId,
        senderId: saved.senderId,
        content: saved.content,
        createdAt: saved.createdAt.toISOString(),
      })
      .catch((err: Error) => this.logger.warn(`Failed to publish message.created: ${err.message}`));

    return hydrated;
  }

  async findAllForChannel(channelId: string, userId: string) {
    await this.assertChannelAccess(channelId, userId);
    const messages = await this.messageRepository.find({
      where: { channelId },
      order: { createdAt: 'ASC' },
      take: 200,
    });
    return this.hydrate(messages);
  }

  async update(id: string, dto: UpdateMessageDto, userId: string) {
    const message = await this.messageRepository.findOneBy({ id });
    if (!message) {
      throw new NotFoundException(`Message ${id} not found`);
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException('Only the sender can edit this message');
    }
    message.content = dto.content;
    message.isEdited = true;
    const saved = await this.messageRepository.save(message);
    const [hydrated] = await this.hydrate([saved]);
    this.chatGateway.broadcastMessageUpdated(hydrated);
    return hydrated;
  }

  async remove(id: string, userId: string) {
    const message = await this.messageRepository.findOneBy({ id });
    if (!message) {
      throw new NotFoundException(`Message ${id} not found`);
    }
    if (message.senderId !== userId) {
      const membership = await this.membershipService.findOne(
        message.workspaceId,
        userId,
      );
      if (!membership || !['Owner', 'Admin'].includes(membership.role)) {
        throw new ForbiddenException('Not allowed to delete this message');
      }
    }
    await this.messageRepository.remove(message);
    this.chatGateway.broadcastMessageDeleted(message.channelId, id);
  }

  async toggleReaction(messageId: string, emoji: string, userId: string) {
    const message = await this.messageRepository.findOneBy({ id: messageId });
    if (!message) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }
    await this.assertChannelAccess(message.channelId, userId);

    const existing = await this.reactionRepository.findOneBy({
      messageId,
      userId,
      emoji,
    });
    if (existing) {
      await this.reactionRepository.remove(existing);
    } else {
      await this.reactionRepository.save(
        this.reactionRepository.create({ messageId, userId, emoji }),
      );
    }

    const reactionsByMessage = await this.reactionsByMessageId([messageId]);
    const reactions = reactionsByMessage.get(messageId) ?? {};
    this.chatGateway.broadcastReactionUpdated(message.channelId, messageId, reactions);
    return { messageId, reactions };
  }
}
