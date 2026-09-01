import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  create(
    @Body() createMessageDto: CreateMessageDto,
    @Session() session: UserSession,
  ) {
    return this.messageService.create(createMessageDto, session.user.id);
  }

  @Get()
  findAll(
    @Query('channelId') channelId: string,
    @Session() session: UserSession,
  ) {
    return this.messageService.findAllForChannel(channelId, session.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Session() session: UserSession,
  ) {
    return this.messageService.update(id, updateMessageDto, session.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Session() session: UserSession) {
    return this.messageService.remove(id, session.user.id);
  }

  @Post(':id/reactions')
  toggleReaction(
    @Param('id') id: string,
    @Body() body: { emoji: string },
    @Session() session: UserSession,
  ) {
    return this.messageService.toggleReaction(id, body.emoji, session.user.id);
  }
}
