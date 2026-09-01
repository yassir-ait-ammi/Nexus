import { Controller, ForbiddenException, Get, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { MembershipService } from './membership.service';

@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  async findAll(
    @Query('workspaceId') workspaceId: string,
    @Session() session: UserSession,
  ) {
    const isMember = await this.membershipService.isMember(
      workspaceId,
      session.user.id,
    );
    if (!isMember) {
      throw new ForbiddenException('Not a member of this workspace');
    }
    return this.membershipService.listMembers(workspaceId);
  }
}
