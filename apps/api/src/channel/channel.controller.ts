import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('channel')
export class ChannelController {
  constructor(
    private readonly channelService: ChannelService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  create(
    @Body() createChannelDto: CreateChannelDto,
    @Session() session: UserSession,
  ) {
    return this.channelService.create(createChannelDto, session.user.id);
  }

  @Post('direct-message')
  async createDirectMessage(
    @Body() body: { workspaceId: string; targetUserId: string },
    @Session() session: UserSession,
  ) {
    const channel = await this.channelService.findOrCreateDirectMessage(
      body.workspaceId,
      session.user.id,
      body.targetUserId,
    );
    this.chatGateway.broadcastChannelCreated(channel);
    return channel;
  }

  @Get()
  findAll(
    @Query('workspaceId') workspaceId: string,
    @Session() session: UserSession,
  ) {
    return this.channelService.findAllForWorkspace(
      workspaceId,
      session.user.id,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.channelService.findOne(id, session.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateChannelDto,
    @Session() session: UserSession,
  ) {
    return this.channelService.update(id, updateChannelDto, session.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Session() session: UserSession) {
    return this.channelService.remove(id, session.user.id);
  }
}
