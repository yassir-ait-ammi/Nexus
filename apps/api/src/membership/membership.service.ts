import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership, MembershipRole } from './entities/membership.entity';
import { AuthUsersService } from '../common/auth-users/auth-users.service';

export interface MemberDto {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  role: MembershipRole;
}

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly authUsersService: AuthUsersService,
  ) {}

  create(workspaceId: string, userId: string, role: MembershipRole) {
    const membership = this.membershipRepository.create({
      workspaceId,
      userId,
      role,
    });
    return this.membershipRepository.save(membership);
  }

  findOne(workspaceId: string, userId: string) {
    return this.membershipRepository.findOneBy({ workspaceId, userId });
  }

  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    const count = await this.membershipRepository.countBy({
      workspaceId,
      userId,
    });
    return count > 0;
  }

  workspaceIdsForUser(userId: string): Promise<Membership[]> {
    return this.membershipRepository.findBy({ userId });
  }

  async userIdsForWorkspace(workspaceId: string): Promise<string[]> {
    const memberships = await this.membershipRepository.findBy({ workspaceId });
    return memberships.map((m) => m.userId);
  }

  async listMembers(workspaceId: string): Promise<MemberDto[]> {
    const memberships = await this.membershipRepository.findBy({ workspaceId });
    const users = await this.authUsersService.findByIds(
      memberships.map((m) => m.userId),
    );

    return memberships
      .map((m) => {
        const user = users.get(m.userId);
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: m.role,
        };
      })
      .filter((m): m is MemberDto => m !== null);
  }

  countMembers(workspaceId: string): Promise<number> {
    return this.membershipRepository.countBy({ workspaceId });
  }

  async getMemberDto(
    workspaceId: string,
    userId: string,
  ): Promise<MemberDto | null> {
    const membership = await this.findOne(workspaceId, userId);
    if (!membership) return null;
    const user = await this.authUsersService.findById(userId);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: membership.role,
    };
  }
}
