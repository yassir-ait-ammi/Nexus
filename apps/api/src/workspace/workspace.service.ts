import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { MembershipService } from '../membership/membership.service';
import { ChannelService } from '../channel/channel.service';
import { ChatGateway } from '../chat/chat.gateway';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'workspace'
  );
}

function randomInviteCode(): string {
  return Math.random().toString(36).slice(2, 10);
}

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    private readonly membershipService: MembershipService,
    private readonly channelService: ChannelService,
    private readonly chatGateway: ChatGateway,
  ) {}

  private async withMembersCount(workspace: Workspace) {
    const membersCount = await this.membershipService.countMembers(
      workspace.id,
    );
    return { ...workspace, membersCount };
  }

  private async assertMember(workspaceId: string, userId: string) {
    const isMember = await this.membershipService.isMember(workspaceId, userId);
    if (!isMember) {
      throw new ForbiddenException('Not a member of this workspace');
    }
  }

  async create(dto: CreateWorkspaceDto, userId: string) {
    let slug = slugify(dto.name);
    const existing = await this.workspaceRepository.findOneBy({ slug });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const workspace = this.workspaceRepository.create({
      name: dto.name,
      description: dto.description,
      icon: dto.icon ?? '💼',
      color: dto.color ?? 'from-cyan-500 to-blue-600',
      slug,
      ownerId: userId,
      inviteCode: randomInviteCode(),
    });
    const saved = await this.workspaceRepository.save(workspace);

    await this.membershipService.create(saved.id, userId, 'Owner');
    await this.channelService.createDefault(saved.id);

    return this.withMembersCount(saved);
  }

  async findAllForUser(userId: string) {
    const memberships =
      await this.membershipService.workspaceIdsForUser(userId);
    if (memberships.length === 0) return [];

    const workspaces = await this.workspaceRepository.findBy({
      id: In(memberships.map((m) => m.workspaceId)),
    });
    return Promise.all(workspaces.map((w) => this.withMembersCount(w)));
  }

  async findOne(id: string, userId: string) {
    await this.assertMember(id, userId);
    const workspace = await this.workspaceRepository.findOneBy({ id });
    if (!workspace) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }
    return this.withMembersCount(workspace);
  }

  async joinByInviteCode(inviteCode: string, userId: string) {
    const workspace = await this.workspaceRepository.findOneBy({ inviteCode });
    if (!workspace) {
      throw new NotFoundException('Invalid invite link');
    }

    const alreadyMember = await this.membershipService.isMember(
      workspace.id,
      userId,
    );
    if (!alreadyMember) {
      await this.membershipService.create(workspace.id, userId, 'Member');
      const member = await this.membershipService.getMemberDto(
        workspace.id,
        userId,
      );
      if (member) {
        this.chatGateway.broadcastMemberJoined(workspace.id, member);
      }
    }

    return this.withMembersCount(workspace);
  }

  async update(id: string, dto: UpdateWorkspaceDto, userId: string) {
    await this.assertMember(id, userId);
    const workspace = await this.workspaceRepository.findOneBy({ id });
    if (!workspace) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }
    Object.assign(workspace, dto);
    const saved = await this.workspaceRepository.save(workspace);
    return this.withMembersCount(saved);
  }
}
