import { apiFetch, apiUpload } from './api-client';
import { AppNotification, Channel, ChannelSection, ChannelType, Message, User, Workspace } from '../types';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

export interface MemberDto {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  role: 'Owner' | 'Admin' | 'Member';
}

export function mapMemberToUser(member: MemberDto): User {
  return {
    id: member.id,
    name: member.name,
    username: member.username,
    email: member.email,
    avatar: member.avatar || DEFAULT_AVATAR,
    status: 'offline',
    role: member.role,
    createdAt: new Date().toISOString(),
  };
}

export const workspaceApi = {
  list: () => apiFetch<Workspace[]>('/workspace'),
  create: (data: { name: string; description?: string; icon?: string; color?: string }) =>
    apiFetch<Workspace>('/workspace', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; description?: string }) =>
    apiFetch<Workspace>(`/workspace/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  join: (inviteCode: string) =>
    apiFetch<Workspace>('/workspace/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
};

export const channelApi = {
  list: (workspaceId: string) => apiFetch<Channel[]>(`/channel?workspaceId=${workspaceId}`),
  create: (data: {
    workspaceId: string;
    name: string;
    topic?: string;
    isPrivate?: boolean;
    type?: ChannelType;
    section?: ChannelSection;
    memberIds?: string[];
  }) => apiFetch<Channel>('/channel', { method: 'POST', body: JSON.stringify(data) }),
  createDirectMessage: (workspaceId: string, targetUserId: string) =>
    apiFetch<Channel>('/channel/direct-message', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, targetUserId }),
    }),
};

export const messageApi = {
  list: (channelId: string) => apiFetch<Message[]>(`/message?channelId=${channelId}`),
  send: (data: { channelId: string; content: string; replyToId?: string }) =>
    apiFetch<Message>('/message', { method: 'POST', body: JSON.stringify(data) }),
  edit: (id: string, content: string) =>
    apiFetch<Message>(`/message/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
  remove: (id: string) => apiFetch<void>(`/message/${id}`, { method: 'DELETE' }),
  toggleReaction: (id: string, emoji: string) =>
    apiFetch<{ messageId: string; reactions: Record<string, string[]> }>(
      `/message/${id}/reactions`,
      { method: 'POST', body: JSON.stringify({ emoji }) },
    ),
};

export const membershipApi = {
  list: (workspaceId: string) => apiFetch<MemberDto[]>(`/membership?workspaceId=${workspaceId}`),
};

export const profileApi = {
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload<{ avatar: string }>('/profile/avatar', formData);
  },
};

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  workspaceId: string;
  channelId: string;
  sender: { id: string; name: string; username: string; avatar: string | null } | null;
}

export function mapNotificationDto(dto: NotificationDto): AppNotification {
  return {
    id: dto.id,
    type: dto.type as AppNotification['type'],
    title: dto.title,
    body: dto.body,
    createdAt: dto.createdAt,
    read: dto.read,
    workspaceId: dto.workspaceId,
    channelId: dto.channelId,
    sender: dto.sender
      ? { ...dto.sender, avatar: dto.sender.avatar || DEFAULT_AVATAR }
      : null,
  };
}

export const notificationApi = {
  list: () => apiFetch<NotificationDto[]>('/notification'),
  markRead: (id: string) => apiFetch<void>(`/notification/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => apiFetch<void>('/notification/read-all', { method: 'PATCH' }),
};
