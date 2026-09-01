import React, { useState } from 'react';
import { Workspace, Channel, User, ChannelSection } from '../../types';
import { 
  ChevronDown, 
  Hash, 
  Volume2, 
  Megaphone, 
  Lock, 
  Plus, 
  Settings, 
  UserPlus, 
  Search, 
  Mic, 
  MicOff, 
  Headphones, 
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

interface ChannelSidebarProps {
  workspace: Workspace;
  channels: Channel[];
  members: User[];
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
  onOpenCreateChannel: () => void;
  onOpenWorkspaceSettings: () => void;
  currentUser: User;
  onOpenUserProfile: () => void;
  isVoiceActive: boolean;
  onToggleVoiceRoom: (channelName: string) => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  workspace,
  channels,
  members,
  activeChannelId,
  onSelectChannel,
  onOpenCreateChannel,
  onOpenWorkspaceSettings,
  currentUser,
  onOpenUserProfile,
  isVoiceActive,
  onToggleVoiceRoom,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  // Filter channels based on search
  const filteredChannels = channels.filter(
    (c) =>
      c.workspaceId === workspace.id &&
      (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.topic && c.topic.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const sections: { id: ChannelSection; label: string }[] = [
    { id: 'general', label: 'Announcements & General' },
    { id: 'channels', label: 'Text & Voice Channels' },
    { id: 'projects', label: 'Projects & Working Groups' },
  ];

  return (
    <div className="w-64 bg-[#0F172A] border-r border-[#334155]/60 flex flex-col shrink-0 select-none">
      {/* Workspace Header Dropdown */}
      <div className="relative">
        <button
          id="workspace-dropdown-trigger-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full h-14 px-4 border-b border-[#334155]/60 flex items-center justify-between hover:bg-[#1E293B]/50 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 truncate">
            <span className="text-lg">{workspace.icon}</span>
            <div className="truncate">
              <h2 className="text-sm font-bold text-[#F8FAFC] truncate tracking-tight">{workspace.name}</h2>
              <p className="text-[10px] text-[#94A3B8] font-mono truncate">pulse/{workspace.slug}</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-[#06B6D4]' : ''}`} />
        </button>

        {dropdownOpen && (
          <div 
            className="absolute top-15 left-2 right-2 z-40 bg-[#1E293B] border border-[#334155] rounded-xl shadow-2xl p-1.5 space-y-1"
            onClick={() => setDropdownOpen(false)}
          >
            <button
              id="workspace-menu-settings-btn"
              onClick={onOpenWorkspaceSettings}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#F8FAFC] hover:bg-[#0F172A] rounded-lg transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-[#06B6D4]" />
              Workspace Settings & Members
            </button>
            <button
              id="workspace-menu-create-channel-btn"
              onClick={onOpenCreateChannel}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#F8FAFC] hover:bg-[#0F172A] rounded-lg transition-colors text-left"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Create Channel
            </button>
            <button
              id="workspace-menu-invite-btn"
              onClick={onOpenWorkspaceSettings}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#F8FAFC] hover:bg-[#0F172A] rounded-lg transition-colors text-left border-t border-[#334155]/60 pt-2"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              Invite Teammates
            </button>
          </div>
        )}
      </div>

      {/* Quick Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
          <input
            id="channels-search-input"
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#06B6D4] transition-colors"
          />
        </div>
      </div>

      {/* Channels List by Category */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
        {sections.map((section) => {
          const sectionChannels = filteredChannels.filter((c) => c.section === section.id);
          if (sectionChannels.length === 0 && searchQuery) return null;

          return (
            <div key={section.id} className="space-y-0.5">
              <div className="flex items-center justify-between px-2 py-1 group">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  {section.label}
                </span>
                <button
                  onClick={onOpenCreateChannel}
                  title="Create Channel"
                  className="opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-[#06B6D4] p-0.5 rounded transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-0.5">
                {sectionChannels.map((channel) => {
                  const isActive = channel.id === activeChannelId;
                  const isVoice = channel.type === 'voice';

                  return (
                    <button
                      key={channel.id}
                      id={`channel-btn-${channel.id}`}
                      onClick={() => {
                        if (isVoice) {
                          onToggleVoiceRoom(channel.name);
                        }
                        onSelectChannel(channel.id);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all text-left ${
                        isActive
                          ? 'bg-[#1E293B] text-[#06B6D4] font-bold shadow-sm'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {channel.isPrivate ? (
                          <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        ) : channel.type === 'voice' ? (
                          <Volume2 className={`w-3.5 h-3.5 shrink-0 ${isVoiceActive ? 'text-emerald-400 animate-pulse' : 'text-[#94A3B8]'}`} />
                        ) : channel.type === 'announcements' ? (
                          <Megaphone className="w-3.5 h-3.5 shrink-0 text-fuchsia-400" />
                        ) : (
                          <Hash className="w-3.5 h-3.5 shrink-0 text-[#94A3B8]" />
                        )}
                        <span className="truncate">{channel.name}</span>
                      </div>

                      {channel.unreadCount && channel.unreadCount > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#06B6D4] text-[#020617] rounded-full shrink-0">
                          {channel.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {(() => {
          const dmChannels = filteredChannels.filter((c) => c.section === 'direct-messages');
          if (dmChannels.length === 0) return null;

          return (
            <div className="space-y-0.5">
              <div className="px-2 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Direct Messages
                </span>
              </div>

              <div className="space-y-0.5">
                {dmChannels.map((channel) => {
                  const otherUserId = channel.memberIds?.find((id) => id !== currentUser.id);
                  const otherUser = members.find((m) => m.id === otherUserId);
                  const isActive = channel.id === activeChannelId;

                  return (
                    <button
                      key={channel.id}
                      id={`channel-btn-${channel.id}`}
                      onClick={() => onSelectChannel(channel.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all text-left ${
                        isActive
                          ? 'bg-[#1E293B] text-[#06B6D4] font-bold shadow-sm'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {otherUser ? (
                          <img
                            src={otherUser.avatar}
                            alt={otherUser.name}
                            className="w-5 h-5 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#334155]" />
                        )}
                        {otherUser && (
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#0F172A] ${
                              otherUser.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                        )}
                      </div>
                      <span className="truncate">{otherUser?.name ?? channel.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Live Voice Connected Banner (if active) */}
      {isVoiceActive && (
        <div className="p-2.5 mx-2 mb-2 bg-[#020617] border border-emerald-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <p className="text-[11px] font-bold text-emerald-400">Voice Connected</p>
              <p className="text-[9px] text-[#94A3B8]">RTC Audio Stream active</p>
            </div>
          </div>
          <button
            onClick={() => onToggleVoiceRoom('')}
            className="text-[10px] px-2 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-md font-semibold hover:bg-rose-500/25"
          >
            Leave
          </button>
        </div>
      )}

      {/* Bottom User Bar */}
      <div className="p-2.5 bg-[#020617]/70 border-t border-[#334155]/60 flex items-center justify-between">
        <button
          id="sidebar-user-profile-btn"
          onClick={onOpenUserProfile}
          className="flex items-center gap-2.5 truncate text-left hover:opacity-90 transition-opacity flex-1"
        >
          <div className="relative shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-[#334155]"
              referrerPolicy="no-referrer"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#020617] ${
                currentUser.status === 'online'
                  ? 'bg-emerald-400'
                  : currentUser.status === 'busy'
                  ? 'bg-rose-500'
                  : currentUser.status === 'away'
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-[#F8FAFC] truncate">{currentUser.name}</h4>
            <p className="text-[10px] text-[#94A3B8] font-mono truncate">@{currentUser.username}</p>
          </div>
        </button>

        {/* Audio mic controls */}
        <div className="flex items-center gap-0.5 text-[#94A3B8]">
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            className={`p-1.5 rounded-lg hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-colors ${
              isMuted ? 'text-rose-400' : ''
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsDeafened(!isDeafened)}
            title={isDeafened ? 'Undeafen' : 'Deafen Audio'}
            className={`p-1.5 rounded-lg hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-colors ${
              isDeafened ? 'text-rose-400' : ''
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenUserProfile}
            title="User Profile & Status"
            className="p-1.5 rounded-lg hover:bg-[#1E293B] hover:text-[#06B6D4] transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
