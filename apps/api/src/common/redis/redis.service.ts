import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

function presenceKey(userId: string): string {
  return `presence:${userId}`;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  // Socket.IO's Redis adapter needs two dedicated clients: one for
  // publishing, one exclusively for subscribing (a client in subscribe mode
  // can't run other commands). The pub client doubles as our general-purpose
  // client for presence tracking below.
  readonly pubClient: RedisClientType;
  readonly subClient: RedisClientType;

  // Nest doesn't guarantee this module's onModuleInit runs before a
  // consuming gateway's afterInit fires, so anything that needs a connected
  // client (the Socket.IO Redis adapter, notably) should await this first.
  readonly ready: Promise<void>;

  constructor(private readonly configService: ConfigService) {
    const url = `redis://${this.configService.get('REDIS_HOST', 'localhost')}:${this.configService.get('REDIS_PORT', 6379)}`;
    this.pubClient = createClient({ url });
    this.subClient = this.pubClient.duplicate();
    this.ready = Promise.all([
      this.pubClient.connect(),
      this.subClient.connect(),
    ]).then(() => {
      this.logger.log('Connected to Redis');
    });
  }

  async onModuleInit() {
    await this.ready;
  }

  async onModuleDestroy() {
    await Promise.all([this.pubClient.quit(), this.subClient.quit()]);
  }

  // A user is "online" if they have at least one active socket connected,
  // on any API instance — sockets register themselves by id so multiple
  // tabs/devices for the same user don't clobber each other.
  async markSocketOnline(
    userId: string,
    socketId: string,
  ): Promise<{ wasOffline: boolean }> {
    await this.pubClient.sAdd(presenceKey(userId), socketId);
    const total = await this.pubClient.sCard(presenceKey(userId));
    return { wasOffline: total === 1 };
  }

  async markSocketOffline(
    userId: string,
    socketId: string,
  ): Promise<{ wentOffline: boolean }> {
    await this.pubClient.sRem(presenceKey(userId), socketId);
    const total = await this.pubClient.sCard(presenceKey(userId));
    return { wentOffline: total === 0 };
  }

  async isOnline(userId: string): Promise<boolean> {
    return (await this.pubClient.sCard(presenceKey(userId))) > 0;
  }
}
