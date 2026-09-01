import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export type MembershipRole = 'Owner' | 'Admin' | 'Member';

@Entity('memberships')
@Unique(['workspaceId', 'userId'])
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  workspaceId: string;

  @Index()
  @Column()
  userId: string;

  @Column({ default: 'Member' })
  role: MembershipRole;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
