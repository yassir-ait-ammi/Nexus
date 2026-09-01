import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { Message } from './entities/message.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { ChannelModule } from '../channel/channel.module';
import { MembershipModule } from '../membership/membership.module';
import { AuthUsersModule } from '../common/auth-users/auth-users.module';
import { ChatModule } from '../chat/chat.module';
import { RabbitmqModule } from '../common/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageReaction]),
    ChannelModule,
    MembershipModule,
    AuthUsersModule,
    ChatModule,
    RabbitmqModule,
  ],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule {}
