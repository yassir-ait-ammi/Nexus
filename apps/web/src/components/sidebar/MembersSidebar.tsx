import React, { useState } from 'react';
import { User, UserStatus } from '../../types';
import { Search, Shield, Sparkles, MessageSquare, UserCheck } from 'lucide-react';

interface MembersSidebarProps {
  users: User[];
  onSelectUser: (user: User) => void;
  currentUser: User;
}

export const MembersSidebar: React.FC<MembersSidebarProps> = ({
  users,
  onSelectUser,
  currentUser,
}) => {
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.customStatus && u.customStatus.toLowerCase().includes(search.toLowerCase()))
  );

  const onlineMembers = filteredUsers.filter((u) => u.status === 'online');
  const busyMembers = filteredUsers.filter((u) => u.status === 'busy');
  const awayMembers = filteredUsers.filter((u) => u.status === 'away');
  const offlineMembers = filteredUsers.filter((u) => u.status === 'offline');

  const renderGroup = (title: string, groupUsers: User[], colorDot: string) => {
    if (groupUsers.length === 0) return null;

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 px-2 py-1">
          <span className={`w-2 h-2 rounded-full ${colorDot}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
            {title} — {groupUsers.length}
          </span>
        </div>

        <div className="space-y-0.5">
          {groupUsers.map((user) => {
            const isCurrent = user.id === currentUser.id;
            return (
              <button
                key={user.id}
                id={`member-item-${user.id}`}
                onClick={() => onSelectUser(user)}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-[#1E293B] transition-colors text-left group"
              >
                <div className="relative shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#334155]"
                    referrerPolicy="no-referrer"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-[#0F172A] ${colorDot}`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#F8FAFC] truncate group-hover:text-[#06B6D4] transition-colors">
                      {user.name}
                    </span>
                    {user.role !== 'Member' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#06B6D4]/15 text-[#06B6D4] font-semibold shrink-0">
                        {user.role}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[9px] text-[#94A3B8] italic shrink-0">(you)</span>
                    )}
                  </div>

                  {user.customStatus ? (
                    <p className="text-[10px] text-[#94A3B8] truncate leading-tight mt-0.5">
                      {user.customStatus}
                    </p>
                  ) : (
                    <p className="text-[10px] text-[#94A3B8] font-mono truncate leading-tight">
                      @{user.username}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside 
      className="w-60 bg-[#0F172A] border-l border-[#334155]/60 flex flex-col shrink-0 select-none"
      aria-label="Channel Members List"
    >
      {/* Header with Search */}
      <div className="p-3 border-b border-[#334155]/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
            Workspace Members
          </span>
          <span className="text-[11px] font-mono text-[#06B6D4] font-bold">
            {users.filter((u) => u.status !== 'offline').length} online
          </span>
        </div>

        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-[#94A3B8]" />
          <input
            id="members-search-input"
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#06B6D4]"
          />
        </div>
      </div>

      {/* User Groups */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {renderGroup('Online', onlineMembers, 'bg-emerald-400')}
        {renderGroup('Do Not Disturb', busyMembers, 'bg-rose-500')}
        {renderGroup('Away', awayMembers, 'bg-amber-400')}
        {renderGroup('Offline', offlineMembers, 'bg-slate-500')}
      </div>
    </aside>
  );
};
