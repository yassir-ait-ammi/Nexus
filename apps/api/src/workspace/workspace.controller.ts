import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Session() session: UserSession,
  ) {
    return this.workspaceService.create(createWorkspaceDto, session.user.id);
  }

  @Get()
  findAll(@Session() session: UserSession) {
    return this.workspaceService.findAllForUser(session.user.id);
  }

  @Post('join')
  join(@Body() body: { inviteCode: string }, @Session() session: UserSession) {
    return this.workspaceService.joinByInviteCode(
      body.inviteCode,
      session.user.id,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.workspaceService.findOne(id, session.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @Session() session: UserSession,
  ) {
    return this.workspaceService.update(
      id,
      updateWorkspaceDto,
      session.user.id,
    );
  }
}
