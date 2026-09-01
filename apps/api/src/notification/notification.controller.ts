import { Controller, Get, Param, Patch } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@Session() session: UserSession) {
    return this.notificationService.listForUser(session.user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Session() session: UserSession) {
    return this.notificationService.markRead(id, session.user.id);
  }

  @Patch('read-all')
  markAllRead(@Session() session: UserSession) {
    return this.notificationService.markAllRead(session.user.id);
  }
}
