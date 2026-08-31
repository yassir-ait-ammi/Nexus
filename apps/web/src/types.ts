export type UserStatus = 'online' | 'busy' | 'away' | 'offline';
export type UserRole = 'Owner' | 'Admin' | 'Member';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  status: UserStatus;
  customStatus?: string;
  role: UserRole;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  ownerId: string;
  membersCount: number;
  inviteCode: string;
  createdAt: string;
}

export type ChannelType = 'text' | 'voice' | 'announcements';
export type ChannelSection = 'general' | 'channels' | 'projects' | 'direct-messages';

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  topic?: string;
  isPrivate: boolean;
  type: ChannelType;
  section: ChannelSection;
  unreadCount?: number;
  memberIds?: string[];
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'code' | 'archive' | 'file' | 'video';
  size: number;
  previewUrl?: string;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  channelId: string;
  workspaceId: string;
  senderId: string;
  sender: User;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  replyToId?: string;
  replyToMessage?: {
    senderName: string;
    content: string;
  };
  reactions: Record<string, string[]>; // emoji -> userIds
  attachments: Attachment[];
  pinned?: boolean;
}

export interface AppNotification {
  id: string;
  type: 'mention' | 'message' | 'channel_invite' | 'system';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  workspaceId: string;
  channelId?: string;
  sender?: { id: string; name: string; username: string; avatar: string } | null;
}
