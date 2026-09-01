import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MembershipModule } from '../membership/membership.module';
import { ChannelModule } from '../channel/channel.module';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [MembershipModule, ChannelModule, RedisModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
