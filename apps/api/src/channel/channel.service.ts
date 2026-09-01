import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { MembershipService } from '../membership/membership.service';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    private readonly membershipService: MembershipService,
  ) {}

  private async assertMember(workspaceId: string, userId: string) {
    const isMember = await this.membershipService.isMember(workspaceId, userId);
    if (!isMember) {
      throw new ForbiddenException('Not a member of this workspace');
    }
  }

  async create(dto: CreateChannelDto, userId: string) {
    await this.assertMember(dto.workspaceId, userId);
    const channel = this.channelRepository.create({
      workspaceId: dto.workspaceId,
      name: dto.name,
      topic: dto.topic,
      isPrivate: dto.isPrivate ?? false,
      type: dto.type ?? 'text',
      section: dto.section ?? 'channels',
      memberIds: dto.memberIds ?? null,
    });
    return this.channelRepository.save(channel);
  }

  async createDefault(workspaceId: string) {
    const channel = this.channelRepository.create({
      workspaceId,
      name: 'general',
      topic: 'Welcome!',
      isPrivate: false,
      type: 'text',
      section: 'general',
      memberIds: null,
    });
    return this.channelRepository.save(channel);
  }

  async findAllForWorkspace(workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    const channels = await this.channelRepository.findBy({ workspaceId });
    return channels.filter(
      (c) => !c.isPrivate || !c.memberIds || c.memberIds.includes(userId),
    );
  }

  async findOne(id: string, userId: string) {
    const channel = await this.channelRepository.findOneBy({ id });
    if (!channel) {
      throw new NotFoundException(`Channel ${id} not found`);
    }
    await this.assertMember(channel.workspaceId, userId);
    if (
      channel.isPrivate &&
      channel.memberIds &&
      !channel.memberIds.includes(userId)
    ) {
      throw new ForbiddenException('Not a member of this channel');
    }
    return channel;
  }

  findByIdUnchecked(id: string) {
    return this.channelRepository.findOneBy({ id });
  }

  async canAccess(channelId: string, userId: string): Promise<boolean> {
    const channel = await this.channelRepository.findOneBy({ id: channelId });
    if (!channel) return false;
    const isMember = await this.membershipService.isMember(
      channel.workspaceId,
      userId,
    );
    if (!isMember) return false;
    if (
      channel.isPrivate &&
      channel.memberIds &&
      !channel.memberIds.includes(userId)
    ) {
      return false;
    }
    return true;
  }

  async findOrCreateDirectMessage(
    workspaceId: string,
    userId: string,
    targetUserId: string,
  ) {
    await this.assertMember(workspaceId, userId);
    const channels = await this.channelRepository.findBy({
      workspaceId,
      section: 'direct-messages',
    });
    const existing = channels.find(
      (c) =>
        c.memberIds?.includes(userId) && c.memberIds?.includes(targetUserId),
    );
    if (existing) return existing;

    const targetUser = await this.membershipService.listMembers(workspaceId);
    const targetName =
      targetUser.find((m) => m.id === targetUserId)?.name ?? 'Direct Message';

    const channel = this.channelRepository.create({
      workspaceId,
      name: targetName,
      isPrivate: true,
      type: 'text',
      section: 'direct-messages',
      memberIds: [userId, targetUserId],
    });
    return this.channelRepository.save(channel);
  }

  async update(id: string, dto: UpdateChannelDto, userId: string) {
    const channel = await this.findOne(id, userId);
    Object.assign(channel, dto);
    return this.channelRepository.save(channel);
  }

  async remove(id: string, userId: string) {
    const channel = await this.findOne(id, userId);
    await this.channelRepository.remove(channel);
  }
}
