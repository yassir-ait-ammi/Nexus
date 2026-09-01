import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MentionNotifierService } from './mention-notifier.service';
import { AuthUsersModule } from '../common/auth-users/auth-users.module';
import { RabbitmqModule } from '../common/rabbitmq/rabbitmq.module';
import { MembershipModule } from '../membership/membership.module';
import { ChannelModule } from '../channel/channel.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    AuthUsersModule,
    RabbitmqModule,
    MembershipModule,
    ChannelModule,
    ChatModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, MentionNotifierService],
  exports: [NotificationService],
})
export class NotificationModule {}
