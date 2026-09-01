import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type NotificationType = 'mention';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The recipient — who this notification is for.
  @Index()
  @Column()
  userId: string;

  @Column({ default: 'mention' })
  type: NotificationType;

  @Column()
  workspaceId: string;

  @Column()
  channelId: string;

  @Column()
  messageId: string;

  @Column()
  senderId: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
