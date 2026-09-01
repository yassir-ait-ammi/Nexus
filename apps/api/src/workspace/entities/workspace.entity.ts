import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: '💼' })
  icon: string;

  @Column({ default: 'from-cyan-500 to-blue-600' })
  color: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  ownerId: string;

  @Column()
  inviteCode: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
