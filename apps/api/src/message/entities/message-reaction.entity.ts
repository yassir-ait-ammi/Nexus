import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('message_reactions')
@Unique(['messageId', 'userId', 'emoji'])
export class MessageReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  messageId: string;

  @Column()
  userId: string;

  @Column()
  emoji: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
