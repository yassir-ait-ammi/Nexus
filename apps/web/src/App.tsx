import React, { useState, useEffect } from 'react';
import {
  User,
  Workspace,
  Channel,
  Message,
  AppNotification,
} from './types';
import { playNotificationSound } from './utils/audio';
import { useCurrentUser } from './lib/session-user';
import {
  workspaceApi,
  channelApi,
  messageApi,
  membershipApi,
  mapMemberToUser,
  notificationApi,
  mapNotificationDto,
} from './lib/api';
import type { MemberDto, NotificationDto } from './lib/api';
import { connectSocket, disconnectSocket, getSocket } from './lib/socket';

import { WorkspaceRail } from './components/layout/WorkspaceRail';
import { ChannelSidebar } from './components/layout/ChannelSidebar';
import { TopHeader } from './components/layout/TopHeader';
import { MessageList } from './components/chat/MessageList';
import { MessageInput } from './components/chat/MessageInput';
import { MembersSidebar } from './components/sidebar/MembersSidebar';

import { AuthModal } from './components/modals/AuthModal';
import { CreateWorkspaceModal } from './components/modals/CreateWorkspaceModal';
import { CreateChannelModal } from './components/modals/CreateChannelModal';
import { WorkspaceSettingsModal } from './components/modals/WorkspaceSettingsModal';
import { UserProfileModal } from './components/modals/UserProfileModal';
import { AttachmentPreviewModal } from './components/modals/AttachmentPreviewModal';
import { NotificationToast } from './components/notifications/NotificationToast';

export default function App() {
  const { currentUser, isPending: isSessionPending } = useCurrentUser();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() =>
    localStorage.getItem('pulse_active_ws'),
  );

  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(() =>
    localStorage.getItem('pulse_active_chn'),
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // UI state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showMembersSidebar, setShowMembersSidebar] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isWsSettingsOpen, setIsWsSettingsOpen] = useState(false);
  const [inspectingUser, setInspectingUser] = useState<User | null>(null);
  const [previewingAttachment, setPreviewingAttachment] = useState<null>(null);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // Connect the realtime socket once authenticated, disconnect on sign-out.
  // Every other socket-dependent effect below depends on `isSocketReady`
  // too: on a fresh page load `activeWorkspaceId` is already known
  // (persisted in localStorage) before the socket has finished its async
  // connection handshake, so those effects would otherwise fire once with
  // no socket, silently skip their subscriptions/room-joins, and never
  // retry since nothing else would re-trigger them.
  useEffect(() => {
    if (!currentUser) return;
    const socket = connectSocket();
    const onConnect = () => setIsSocketReady(true);
    const onDisconnect = () => setIsSocketReady(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) setIsSocketReady(true);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      disconnectSocket();
      setIsSocketReady(false);
    };
  }, [currentUser?.id]);

  // Load workspaces once authenticated
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    setIsLoadingWorkspaces(true);
    workspaceApi
      .list()
      .then((list) => {
        if (cancelled) return;
        setWorkspaces(list);
        setActiveWorkspaceId((prev) =>
          prev && list.some((w) => w.id === prev) ? prev : (list[0]?.id ?? null),
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingWorkspaces(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem('pulse_active_ws', activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  // Load channels + members whenever the active workspace changes
  useEffect(() => {
    if (!activeWorkspaceId) {
      setChannels([]);
      setMembers([]);
      return;
    }
    let cancelled = false;

    // Make sure the socket has joined this workspace's realtime room before
    // querying presence for it — a socket that connected before the
    // workspace was created/joined never picked up that room automatically.
    const socket = getSocket();
    socket?.emit('workspace:join', { workspaceId: activeWorkspaceId });

    Promise.all([
      channelApi.list(activeWorkspaceId),
      membershipApi.list(activeWorkspaceId),
    ]).then(async ([channelList, memberList]) => {
      if (cancelled) return;
      let users = memberList.map(mapMemberToUser);

      // Hydrate real online/offline status from the socket before committing
      // state, so a freshly-fetched member list is never briefly wrong.
      if (socket) {
        const onlineIds = await new Promise<string[]>((resolve) => {
          socket.emit('presence:query', { workspaceId: activeWorkspaceId }, (ids: string[]) =>
            resolve(ids ?? []),
          );
        });
        if (cancelled) return;
        users = users.map((u) => ({
          ...u,
          status: onlineIds.includes(u.id) ? 'online' : 'offline',
        }));
      }

      setChannels(channelList);
      setMembers(users);
      setActiveChannelId((prev) =>
        prev && channelList.some((c) => c.id === prev) ? prev : (channelList[0]?.id ?? null),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId, isSocketReady]);

  // Join the active channel's realtime room whenever it changes
  useEffect(() => {
    if (!currentUser || !activeChannelId) return;
    getSocket()?.emit('channel:join', { channelId: activeChannelId });
  }, [currentUser?.id, activeChannelId, isSocketReady]);

  // Live message create/update/delete for whichever channel room we're in
  useEffect(() => {
    if (!currentUser) return;
    const socket = getSocket();
    if (!socket) return;

    const onCreated = (message: Message) =>
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    const onUpdated = (message: Message) =>
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    const onDeleted = ({ messageId }: { messageId: string }) =>
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    const onReactionUpdated = ({
      messageId,
      reactions,
    }: {
      messageId: string;
      reactions: Record<string, string[]>;
    }) => setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));

    socket.on('message:created', onCreated);
    socket.on('message:updated', onUpdated);
    socket.on('message:deleted', onDeleted);
    socket.on('message:reactionUpdated', onReactionUpdated);
    return () => {
      socket.off('message:created', onCreated);
      socket.off('message:updated', onUpdated);
      socket.off('message:deleted', onDeleted);
      socket.off('message:reactionUpdated', onReactionUpdated);
    };
  }, [currentUser?.id, isSocketReady]);

  // Live presence for the currently active workspace
  useEffect(() => {
    if (!currentUser || !activeWorkspaceId) return;
    const socket = getSocket();
    if (!socket) return;

    const onPresence = ({
      workspaceId,
      userId,
      status,
    }: {
      workspaceId: string;
      userId: string;
      status: 'online' | 'offline';
    }) => {
      if (workspaceId !== activeWorkspaceId) return;
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, status } : m)));
    };

    const onMemberJoined = ({
      workspaceId,
      member,
    }: {
      workspaceId: string;
      member: MemberDto;
    }) => {
      if (workspaceId !== activeWorkspaceId) return;
      const user = { ...mapMemberToUser(member), status: 'online' as const };
      setMembers((prev) => (prev.some((m) => m.id === user.id) ? prev : [...prev, user]));
    };

    socket.on('presence:update', onPresence);
    socket.on('member:joined', onMemberJoined);
    return () => {
      socket.off('presence:update', onPresence);
      socket.off('member:joined', onMemberJoined);
    };
  }, [currentUser?.id, activeWorkspaceId, isSocketReady]);

  // A DM channel has no other realtime signal when it's created — unlike
  // every other write in this app, it's not scoped to a workspace/channel
  // room the recipient is already in. The gateway targets each member's
  // personal `user:<id>` room instead, so this listener isn't gated on
  // activeWorkspaceId; it just merges in whatever channel arrives (a no-op
  // if we're the one who started it, since we already added it locally).
  useEffect(() => {
    if (!currentUser) return;
    const socket = getSocket();
    if (!socket) return;

    const onChannelCreated = (channel: Channel) => {
      setChannels((prev) => (prev.some((c) => c.id === channel.id) ? prev : [...prev, channel]));
    };

    socket.on('channel:created', onChannelCreated);
    return () => socket.off('channel:created', onChannelCreated);
  }, [currentUser?.id, isSocketReady]);

  // Load existing notifications once authenticated, then keep them live via
  // the socket (a personal `user:<id>` room the gateway joins every socket
  // to — notifications aren't scoped to whichever workspace/channel is
  // currently open).
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    notificationApi.list().then((list) => {
      if (!cancelled) setNotifications(list.map(mapNotificationDto));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    const socket = getSocket();
    if (!socket) return;

    const onNotificationCreated = (dto: NotificationDto) => {
      const notification = mapNotificationDto(dto);
      setNotifications((prev) => [notification, ...prev]);
      setActiveToast(notification);
      if (soundEnabled) {
        playNotificationSound('message');
      }
    };

    socket.on('notification:created', onNotificationCreated);
    return () => socket.off('notification:created', onNotificationCreated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, isSocketReady]);

  // Live typing indicator for the currently active channel
  useEffect(() => {
    setTypingUserId(null);
    if (!currentUser || !activeChannelId) return;
    const socket = getSocket();
    if (!socket) return;

    let clearTimer: ReturnType<typeof setTimeout>;
    const onTyping = ({
      channelId,
      userId,
      isTyping,
    }: {
      channelId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (channelId !== activeChannelId) return;
      clearTimeout(clearTimer);
      if (isTyping) {
        setTypingUserId(userId);
        clearTimer = setTimeout(() => setTypingUserId(null), 4000);
      } else {
        setTypingUserId(null);
      }
    };

    socket.on('typing:update', onTyping);
    return () => {
      socket.off('typing:update', onTyping);
      clearTimeout(clearTimer);
    };
  }, [currentUser?.id, activeChannelId, isSocketReady]);

  useEffect(() => {
    if (activeChannelId) {
      localStorage.setItem('pulse_active_chn', activeChannelId);
    }
  }, [activeChannelId]);

  // Load messages whenever the active channel changes. Also keyed on the
  // user's id: activeChannelId is restored from localStorage, so on a
  // logout -> login cycle it's often unchanged, and without this dependency
  // this effect would never refetch — leaving whatever was in memory before
  // logout on screen, missing anything sent while signed out.
  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    messageApi.list(activeChannelId).then((list) => {
      if (!cancelled) setMessages(list);
    });
    return () => {
      cancelled = true;
    };
  }, [activeChannelId, currentUser?.id]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? null;
  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;

  if (isSessionPending) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#020617] text-[#94A3B8] text-sm">
        Loading…
      </div>
    );
  }

  if (!currentUser) {
    return <AuthModal isOpen onClose={() => {}} />;
  }

  if (isLoadingWorkspaces) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#020617] text-[#94A3B8] text-sm">
        Loading workspaces…
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#020617] text-[#F8FAFC]">
        <p className="text-sm text-[#94A3B8]">You're not in any workspace yet.</p>
        <button
          onClick={() => setIsCreateWsOpen(true)}
          className="px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] text-[#020617] font-bold text-xs rounded-xl transition-colors"
        >
          Create a workspace
        </button>
        <CreateWorkspaceModal
          isOpen={isCreateWsOpen}
          onClose={() => setIsCreateWsOpen(false)}
          onCreateWorkspace={(workspace) => {
            setWorkspaces((prev) => [...prev, workspace]);
            setActiveWorkspaceId(workspace.id);
          }}
        />
      </div>
    );
  }

  // Send Message
  const handleSendMessage = async (content: string, replyToId?: string) => {
    if (!activeChannel) return;
    const message = await messageApi.send({ channelId: activeChannel.id, content, replyToId });
    // The socket broadcast for this message fires server-side before this
    // REST call even returns, so it usually reaches us first — guard
    // against appending it twice.
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    if (soundEnabled) {
      playNotificationSound('send');
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const updated = await messageApi.edit(messageId, newContent);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
  };

  const handleDeleteMessage = async (messageId: string) => {
    await messageApi.remove(messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    const { reactions } = await messageApi.toggleReaction(messageId, emoji);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
  };

  // Pins aren't persisted by the api yet, so this stays local-only UI state
  // and resets on refresh.
  const handleTogglePinMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, pinned: !msg.pinned } : msg)),
    );
  };

  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    setSearchFilter('');
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
  };

  const handleCreateChannel = (newChannel: Channel) => {
    setChannels((prev) => [...prev, newChannel]);
    setActiveChannelId(newChannel.id);
  };

  const handleCreateWorkspace = (newWorkspace: Workspace) => {
    setWorkspaces((prev) => [...prev, newWorkspace]);
    setActiveWorkspaceId(newWorkspace.id);
  };

  const handleStartDirectMessage = async (targetUser: User) => {
    const dmChannel = await channelApi.createDirectMessage(activeWorkspace.id, targetUser.id);
    setChannels((prev) =>
      prev.some((c) => c.id === dmChannel.id) ? prev : [...prev, dmChannel],
    );
    setActiveChannelId(dmChannel.id);
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await notificationApi.markRead(id);
  };

  const handleMarkAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await notificationApi.markAllRead();
  };

  const channelMessages = messages;
  const pinnedMessages = channelMessages.filter((m) => m.pinned);
  const typingUser = members.find((m) => m.id === typingUserId) ?? null;
  const onlineCount = members.filter((m) => m.status === 'online').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020617] text-[#F8FAFC]">
      <WorkspaceRail
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspace.id}
        onSelectWorkspace={handleSelectWorkspace}
        onOpenCreateWorkspace={() => setIsCreateWsOpen(true)}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        unreadCount={notifications.filter((n) => !n.read).length}
      />

      {activeChannel && (
        <ChannelSidebar
          workspace={activeWorkspace}
          channels={channels}
          members={members}
          activeChannelId={activeChannel.id}
          onSelectChannel={handleSelectChannel}
          onOpenCreateChannel={() => setIsCreateChannelOpen(true)}
          onOpenWorkspaceSettings={() => setIsWsSettingsOpen(true)}
          currentUser={currentUser}
          onOpenUserProfile={() => setInspectingUser(currentUser)}
          isVoiceActive={isVoiceActive}
          onToggleVoiceRoom={() => setIsVoiceActive((prev) => !prev)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 bg-[#0F172A] relative overflow-hidden" role="main">
        {activeChannel ? (
          <>
            <TopHeader
              channel={activeChannel}
              pinnedMessages={pinnedMessages}
              notifications={notifications}
              onMarkNotificationAsRead={handleMarkNotificationAsRead}
              onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
              onClearAllNotifications={() => setNotifications([])}
              onSelectChannel={handleSelectChannel}
              showMembersSidebar={showMembersSidebar}
              onToggleMembersSidebar={() => setShowMembersSidebar(!showMembersSidebar)}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              searchQuery={searchFilter}
              onSearchChange={setSearchFilter}
              onlineCount={onlineCount}
            />

            <MessageList
              channel={activeChannel}
              messages={channelMessages}
              currentUser={currentUser}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onToggleReaction={handleToggleReaction}
              onReplyToMessage={(msg) => setReplyingTo(msg)}
              onTogglePinMessage={handleTogglePinMessage}
              onPreviewAttachment={() => {}}
              onSelectUser={(usr) => setInspectingUser(usr)}
              typingUser={typingUser}
              searchFilter={searchFilter}
            />

            <MessageInput
              channelId={activeChannel.id}
              channelName={activeChannel.name}
              onSendMessage={handleSendMessage}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              users={members}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-[#94A3B8]">
            No channels yet.
          </div>
        )}
      </main>

      {activeChannel && showMembersSidebar && (
        <MembersSidebar
          users={members}
          onSelectUser={(usr) => setInspectingUser(usr)}
          currentUser={currentUser}
        />
      )}

      <NotificationToast
        notification={activeToast}
        onClose={() => setActiveToast(null)}
        onClick={() => {
          if (activeToast?.workspaceId && activeToast.workspaceId !== activeWorkspaceId) {
            setActiveWorkspaceId(activeToast.workspaceId);
          }
          if (activeToast?.channelId) {
            setActiveChannelId(activeToast.channelId);
          }
          setActiveToast(null);
        }}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <CreateWorkspaceModal
        isOpen={isCreateWsOpen}
        onClose={() => setIsCreateWsOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
      />

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        workspaceId={activeWorkspace.id}
        members={members}
        onCreateChannel={handleCreateChannel}
      />

      <WorkspaceSettingsModal
        isOpen={isWsSettingsOpen}
        onClose={() => setIsWsSettingsOpen(false)}
        workspace={activeWorkspace}
        currentUser={currentUser}
        members={members}
        onUpdateWorkspace={(updated) =>
          setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
        }
      />

      <UserProfileModal
        isOpen={!!inspectingUser}
        onClose={() => setInspectingUser(null)}
        user={inspectingUser || currentUser}
        isCurrentUser={inspectingUser?.id === currentUser.id}
        onStartDirectMessage={handleStartDirectMessage}
      />

      <AttachmentPreviewModal
        isOpen={!!previewingAttachment}
        onClose={() => setPreviewingAttachment(null)}
        attachment={previewingAttachment}
      />
    </div>
  );
}
