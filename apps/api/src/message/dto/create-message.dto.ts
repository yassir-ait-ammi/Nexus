import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  channelId: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsString()
  replyToId?: string;
}
