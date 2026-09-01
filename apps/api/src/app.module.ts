import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChannelModule } from './channel/channel.module';
import { MembershipModule } from './membership/membership.module';
import { MessageModule } from './message/message.module';
import { AttachmentModule } from './attachment/attachment.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { NotificationModule } from './notification/notification.module';
import { auth } from './auth/auth';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'nexus'),
        password: configService.get<string>('DB_PASSWORD', 'nexus'),
        database: configService.get<string>('DB_NAME', 'nexus'),
        autoLoadEntities: true,
        synchronize:
          configService.get<string>('NODE_ENV', 'development') !== 'production',
      }),
    }),
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
      },
    }),
    ChannelModule,
    MembershipModule,
    MessageModule,
    AttachmentModule,
    WorkspaceModule,
    UserModule,
    ProfileModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
