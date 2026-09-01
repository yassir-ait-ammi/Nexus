import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server, Socket } from 'socket.io';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth/auth';
import { MembershipService, MemberDto } from '../membership/membership.service';
import { ChannelService } from '../channel/channel.service';
import { RedisService } from '../common/redis/redis.service';
import type { HydratedMessage } from '../message/message.service';
import type { NotificationDto } from '../notification/notification.service';
import type { Channel } from '../channel/entities/channel.entity';

interface AuthedSocketData {
  userId: string;
  currentChannelId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly membershipService: MembershipService,
    private readonly channelService: ChannelService,
    private readonly redisService: RedisService,
  ) {}

  async afterInit(server: Server) {
    await this.redisService.ready;
    server.adapter(
      createAdapter(this.redisService.pubClient, this.redisService.subClient),
    );
    this.logger.log('Socket.IO using Redis adapter');
  }

  async handleConnection(client: Socket) {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(client.handshake.headers),
    });

    if (!session) {
      client.disconnect(true);
      return;
    }

    const userId = session.user.id;
    (client.data as AuthedSocketData).userId = userId;

    const memberships =
      await this.membershipService.workspaceIdsForUser(userId);
    for (const membership of memberships) {
      client.join(`workspace:${membership.workspaceId}`);
    }
    client.join(`user:${userId}`);

    const { wasOffline } = await this.redisService.markSocketOnline(
      userId,
      client.id,
    );

    if (wasOffline) {
      this.logger.log(`User ${userId} online`);
      for (const membership of memberships) {
        this.server
          .to(`workspace:${membership.workspaceId}`)
          .emit('presence:update', {
            workspaceId: membership.workspaceId,
            userId,
            status: 'online',
          });
      }
    }
  }

  async handleDisconnect(client: Socket) {
    const { userId } = client.data as AuthedSocketData;
    if (!userId) return;

    const { wentOffline } = await this.redisService.markSocketOffline(
      userId,
      client.id,
    );

    if (wentOffline) {
      this.logger.log(`User ${userId} offline`);
      const memberships =
        await this.membershipService.workspaceIdsForUser(userId);
      for (const membership of memberships) {
        this.server
          .to(`workspace:${membership.workspaceId}`)
          .emit('presence:update', {
            workspaceId: membership.workspaceId,
            userId,
            status: 'offline',
          });
      }
    }
  }

  // A socket only joins the workspace rooms it knew about at connect time.
  // If the user creates or joins a workspace mid-session, the client calls
  // this to add that room without waiting for a reconnect.
  @SubscribeMessage('workspace:join')
  async handleWorkspaceJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { workspaceId: string },
  ) {
    const { userId } = client.data as AuthedSocketData;
    if (!userId || !payload?.workspaceId) return;

    const isMember = await this.membershipService.isMember(
      payload.workspaceId,
      userId,
    );
    if (!isMember) return;

    client.join(`workspace:${payload.workspaceId}`);
  }

  @SubscribeMessage('channel:join')
  async handleChannelJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string },
  ) {
    const { userId, currentChannelId } = client.data as AuthedSocketData;
    if (!userId || !payload?.channelId) return;

    try {
      await this.channelService.findOne(payload.channelId, userId);
    } catch {
      return;
    }

    if (currentChannelId) {
      client.leave(`channel:${currentChannelId}`);
    }
    client.join(`channel:${payload.channelId}`);
    (client.data as AuthedSocketData).currentChannelId = payload.channelId;
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string },
  ) {
    this.broadcastTyping(client, payload?.channelId, true);
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string },
  ) {
    this.broadcastTyping(client, payload?.channelId, false);
  }

  private broadcastTyping(
    client: Socket,
    channelId: string | undefined,
    isTyping: boolean,
  ) {
    const { userId } = client.data as AuthedSocketData;
    if (!userId || !channelId) return;
    client
      .to(`channel:${channelId}`)
      .emit('typing:update', { channelId, userId, isTyping });
  }

  // Backed by Redis (not this instance's local socket/room state) so the
  // answer is correct regardless of which API instance a given member is
  // actually connected to.
  @SubscribeMessage('presence:query')
  async handlePresenceQuery(
    @MessageBody() payload: { workspaceId: string },
  ): Promise<string[]> {
    if (!payload?.workspaceId) return [];
    const userIds = await this.membershipService.userIdsForWorkspace(
      payload.workspaceId,
    );
    const onlineFlags = await Promise.all(
      userIds.map((id) => this.redisService.isOnline(id)),
    );
    return userIds.filter((_, i) => onlineFlags[i]);
  }

  broadcastMessageCreated(message: HydratedMessage) {
    this.server
      .to(`channel:${message.channelId}`)
      .emit('message:created', message);
  }

  broadcastMessageUpdated(message: HydratedMessage) {
    this.server
      .to(`channel:${message.channelId}`)
      .emit('message:updated', message);
  }

  broadcastMessageDeleted(channelId: string, messageId: string) {
    this.server
      .to(`channel:${channelId}`)
      .emit('message:deleted', { channelId, messageId });
  }

  broadcastMemberJoined(workspaceId: string, member: MemberDto) {
    this.server
      .to(`workspace:${workspaceId}`)
      .emit('member:joined', { workspaceId, member });
  }

  broadcastReactionUpdated(
    channelId: string,
    messageId: string,
    reactions: Record<string, string[]>,
  ) {
    this.server
      .to(`channel:${channelId}`)
      .emit('message:reactionUpdated', { channelId, messageId, reactions });
  }

  broadcastNotification(userId: string, notification: NotificationDto) {
    this.server.to(`user:${userId}`).emit('notification:created', notification);
  }

  // Fired when a DM channel is created (or re-found) so the *other*
  // participant's client learns it exists without waiting for a message —
  // channel creation otherwise has no realtime signal at all, unlike every
  // other write in this app. Targets each member's personal room, so the
  // initiator (already holding the channel locally) just gets a harmless
  // no-op merge.
  broadcastChannelCreated(channel: Channel) {
    for (const memberId of channel.memberIds ?? []) {
      this.server.to(`user:${memberId}`).emit('channel:created', channel);
    }
  }
}
