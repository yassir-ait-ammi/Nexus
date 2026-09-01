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
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Post()
  create(
    @Body() createChannelDto: CreateChannelDto,
    @Session() session: UserSession,
  ) {
    return this.channelService.create(createChannelDto, session.user.id);
  }

  @Post('direct-message')
  createDirectMessage(
    @Body() body: { workspaceId: string; targetUserId: string },
    @Session() session: UserSession,
  ) {
    return this.channelService.findOrCreateDirectMessage(
      body.workspaceId,
      session.user.id,
      body.targetUserId,
    );
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
