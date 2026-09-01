import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ChannelType = 'text' | 'voice' | 'announcements';
export type ChannelSection =
  'general' | 'channels' | 'projects' | 'direct-messages';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  workspaceId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  topic: string;

  @Column({ default: false })
  isPrivate: boolean;

  @Column({ default: 'text' })
  type: ChannelType;

  @Column({ default: 'channels' })
  section: ChannelSection;

  @Column({ type: 'text', array: true, nullable: true })
  memberIds: string[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
