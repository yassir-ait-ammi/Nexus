import React, { useState } from 'react';
import { Channel, AppNotification, Message } from '../../types';
import {
  Hash,
  Volume2,
  Megaphone,
  Lock,
  Pin,
  Users,
  Bell,
  VolumeX,
  Search,
  X
} from 'lucide-react';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

interface TopHeaderProps {
  channel: Channel;
  pinnedMessages: Message[];
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  onClearAllNotifications: () => void;
  onSelectChannel: (channelId: string) => void;
  showMembersSidebar: boolean;
  onToggleMembersSidebar: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onlineCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  channel,
  pinnedMessages,
  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onSelectChannel,
  showMembersSidebar,
  onToggleMembersSidebar,
  soundEnabled,
  onToggleSound,
  searchQuery,
  onSearchChange,
  onlineCount,
}) => {
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [showPinnedDropdown, setShowPinnedDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-14 bg-[#0F172A] border-b border-[#334155]/60 px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Left: Channel Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          {channel.isPrivate ? (
            <Lock className="w-4 h-4 text-amber-400" />
          ) : channel.type === 'voice' ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : channel.type === 'announcements' ? (
            <Megaphone className="w-4 h-4 text-fuchsia-400" />
          ) : (
            <Hash className="w-4 h-4 text-[#94A3B8]" />
          )}
          <h1 className="text-sm font-bold text-[#F8FAFC] truncate">{channel.name}</h1>
        </div>

        {channel.topic && (
          <div className="hidden md:flex items-center gap-2 text-xs text-[#94A3B8] border-l border-[#334155] pl-3 truncate max-w-md">
            <span className="truncate">{channel.topic}</span>
          </div>
        )}
      </div>

      {/* Right: Actions & Tools */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search messages in channel */}
        <div className="relative hidden sm:block">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
          <input
            id="chat-search-input"
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-40 lg:w-56 pl-8 pr-7 py-1.5 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#06B6D4] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#F8FAFC]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Pinned Messages Trigger */}
        <div className="relative">
          <button
            id="header-pinned-messages-btn"
            onClick={() => setShowPinnedDropdown(!showPinnedDropdown)}
            title="Pinned Messages"
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1 text-xs ${
              pinnedMessages.length > 0
                ? 'bg-[#1E293B] text-[#06B6D4] border-[#334155] hover:border-[#06B6D4]'
                : 'text-[#94A3B8] border-transparent hover:bg-[#1E293B]'
            }`}
          >
            <Pin className="w-4 h-4" />
            {pinnedMessages.length > 0 && (
              <span className="text-[10px] font-bold">{pinnedMessages.length}</span>
            )}
          </button>

          {/* Pinned Dropdown */}
          {showPinnedDropdown && (
            <div 
              className="absolute right-0 top-12 w-80 bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl p-3 z-50 space-y-2 max-h-80 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#334155]">
                <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-[#06B6D4]" />
                  Pinned Messages ({pinnedMessages.length})
                </span>
                <button
                  onClick={() => setShowPinnedDropdown(false)}
                  className="text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {pinnedMessages.length === 0 ? (
                <p className="text-xs text-[#94A3B8] text-center py-4">No pinned messages in this channel</p>
              ) : (
                pinnedMessages.map((msg) => (
                  <div key={msg.id} className="p-2.5 bg-[#1E293B] border border-[#334155] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F8FAFC]">{msg.sender.name}</span>
                      <span className="text-[10px] text-[#94A3B8]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[#94A3B8] line-clamp-3 leading-relaxed">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Audio notification toggle */}
        <button
          id="header-sound-toggle-btn"
          onClick={onToggleSound}
          title={soundEnabled ? 'Notification Chimes Enabled' : 'Notification Chimes Muted'}
          className={`p-2 rounded-xl border transition-colors ${
            soundEnabled
              ? 'bg-[#1E293B] text-[#06B6D4] border-[#334155] hover:border-[#06B6D4]'
              : 'text-[#94A3B8] border-transparent hover:bg-[#1E293B]'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-[#94A3B8]" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="header-notifications-btn"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            title="Notifications"
            className={`p-2 rounded-xl border relative transition-colors ${
              unreadCount > 0
                ? 'bg-[#1E293B] text-[#06B6D4] border-[#06B6D4]/40 hover:border-[#06B6D4]'
                : 'text-[#94A3B8] border-transparent hover:bg-[#1E293B]'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#06B6D4] ring-2 ring-[#0F172A]" />
            )}
          </button>

          <NotificationDropdown
            isOpen={notifDropdownOpen}
            onClose={() => setNotifDropdownOpen(false)}
            notifications={notifications}
            onMarkAsRead={onMarkNotificationAsRead}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
            onClearAll={onClearAllNotifications}
            onSelectChannel={onSelectChannel}
          />
        </div>

        {/* Online Members Sidebar Toggle */}
        <button
          id="header-members-toggle-btn"
          onClick={onToggleMembersSidebar}
          title="Toggle Member List"
          className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            showMembersSidebar
              ? 'bg-[#1E293B] text-[#06B6D4] border-[#06B6D4]/50'
              : 'text-[#94A3B8] border-transparent hover:bg-[#1E293B]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">{onlineCount}</span>
        </button>
      </div>
    </header>
  );
};
