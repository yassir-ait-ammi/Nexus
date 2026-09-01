import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { ChannelSection, ChannelType } from '../entities/channel.entity';

export class CreateChannelDto {
  @IsString()
  workspaceId: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsIn(['text', 'voice', 'announcements'])
  type?: ChannelType;

  @IsOptional()
  @IsIn(['general', 'channels', 'projects', 'direct-messages'])
  section?: ChannelSection;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}
