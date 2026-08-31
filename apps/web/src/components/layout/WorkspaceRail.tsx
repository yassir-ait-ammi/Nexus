import React from 'react';
import { Workspace, User } from '../../types';
import { Plus } from 'lucide-react';

interface WorkspaceRailProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onOpenCreateWorkspace: () => void;
  onOpenAuthModal: () => void;
  currentUser: User;
  unreadCount: number;
}

export const WorkspaceRail: React.FC<WorkspaceRailProps> = ({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  onOpenAuthModal,
  currentUser,
  unreadCount,
}) => {
  return (
    <aside
      className="w-18 bg-[#020617] border-r border-[#334155]/60 flex flex-col items-center py-3 select-none shrink-0 z-20 justify-between"
      aria-label="Workspaces Rail"
    >
      {/* Top Workspace list */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {/* Pulse App Brand Logo */}
        <div
          title="Nexus"
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#06B6D4] to-blue-600 flex items-center justify-center text-[#020617] font-black text-xl shadow-lg mb-1 relative group"
        >
          <span>P</span>
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#020617] ring-1 ring-emerald-500" />
        </div>

        <div className="w-8 h-px bg-[#334155]/80 my-0.5" />

        {/* Workspaces items */}
        {workspaces.map((ws) => {
          const isActive = ws.id === activeWorkspaceId;
          return (
            <div key={ws.id} className="relative group flex items-center justify-center w-full">
              {/* Active indicator bar */}
              <div
                className={`absolute left-0 w-1 bg-[#06B6D4] rounded-r-full transition-all duration-300 ${isActive ? 'h-9' : 'h-2 group-hover:h-5 opacity-0 group-hover:opacity-100'
                  }`}
              />

              <button
                id={`workspace-btn-${ws.id}`}
                onClick={() => onSelectWorkspace(ws.id)}
                title={ws.name}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-200 shadow-md ${isActive
                    ? 'rounded-2xl ring-2 ring-[#06B6D4] ring-offset-2 ring-offset-[#020617] scale-105 bg-gradient-to-br ' + ws.color
                    : 'rounded-3xl hover:rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] border border-[#334155]/60 hover:border-[#06B6D4]/50'
                  }`}
              >
                <span>{ws.icon}</span>
              </button>

              {/* Tooltip */}
              <div className="absolute left-16 z-50 hidden group-hover:flex px-2.5 py-1.5 bg-[#0F172A] border border-[#334155] text-xs font-semibold text-[#F8FAFC] rounded-lg whitespace-nowrap shadow-xl">
                {ws.name}
              </div>
            </div>
          );
        })}

        {/* Add Workspace Button */}
        <div className="relative group flex items-center justify-center w-full mt-1">
          <button
            id="rail-create-workspace-btn"
            onClick={onOpenCreateWorkspace}
            title="Create Workspace"
            className="w-12 h-12 rounded-3xl hover:rounded-2xl bg-[#0F172A] hover:bg-[#06B6D4] hover:text-[#020617] text-[#06B6D4] border border-[#334155] hover:border-transparent flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-md"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="absolute left-16 z-50 hidden group-hover:flex px-2.5 py-1.5 bg-[#0F172A] border border-[#334155] text-xs font-semibold text-[#F8FAFC] rounded-lg whitespace-nowrap shadow-xl">
            Create New Workspace
          </div>
        </div>
      </div>

      {/* Bottom User Avatar Trigger */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="relative group flex items-center justify-center w-full">
          <button
            id="rail-current-user-avatar-btn"
            onClick={onOpenAuthModal}
            title={`${currentUser.name} (@${currentUser.username})`}
            className="w-11 h-11 rounded-full relative p-0.5 border-2 border-[#334155] hover:border-[#06B6D4] transition-all"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-[#020617] ${currentUser.status === 'online'
                  ? 'bg-emerald-400'
                  : currentUser.status === 'busy'
                    ? 'bg-rose-500'
                    : currentUser.status === 'away'
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                }`}
            />
          </button>
          <div className="absolute left-16 z-50 hidden group-hover:flex px-2.5 py-1.5 bg-[#0F172A] border border-[#334155] text-xs font-semibold text-[#F8FAFC] rounded-lg whitespace-nowrap shadow-xl">
            Switch User: {currentUser.name}
          </div>
        </div>
      </div>
    </aside>
  );
};
