import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { AuthUsersService } from '../common/auth-users/auth-users.service';

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  workspaceId: string;
  channelId: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  } | null;
}

interface CreateNotificationInput {
  userId: string;
  workspaceId: string;
  channelId: string;
  messageId: string;
  senderId: string;
  body: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly authUsersService: AuthUsersService,
  ) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...input,
      type: 'mention',
    });
    return this.notificationRepository.save(notification);
  }

  private async hydrate(
    notifications: Notification[],
  ): Promise<NotificationDto[]> {
    const senders = await this.authUsersService.findByIds(
      notifications.map((n) => n.senderId),
    );
    return notifications.map((n) => {
      const sender = senders.get(n.senderId);
      return {
        id: n.id,
        type: n.type,
        title: sender ? `${sender.name} mentioned you` : 'You were mentioned',
        body: n.body,
        createdAt: n.createdAt.toISOString(),
        read: n.read,
        workspaceId: n.workspaceId,
        channelId: n.channelId,
        sender: sender
          ? {
              id: sender.id,
              name: sender.name,
              username: sender.username,
              avatar: sender.avatar,
            }
          : null,
      };
    });
  }

  async hydrateOne(notification: Notification): Promise<NotificationDto> {
    const [dto] = await this.hydrate([notification]);
    return dto;
  }

  async listForUser(userId: string): Promise<NotificationDto[]> {
    const notifications = await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return this.hydrate(notifications);
  }

  async markRead(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOneBy({ id });
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException();
    }
    notification.read = true;
    await this.notificationRepository.save(notification);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true },
    );
  }
}
