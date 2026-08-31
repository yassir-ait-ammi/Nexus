import React from 'react';
import { AppNotification } from '../../types';
import { Bell, Check, Trash2, MessageSquare, Megaphone, UserPlus, Info } from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectChannel?: (channelId: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectChannel,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div 
      className="absolute right-0 top-12 w-84 md:w-96 bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[480px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155] bg-[#020617]/70">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#06B6D4]" />
          <h3 className="text-xs font-bold text-[#F8FAFC]">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#06B6D4] text-[#020617] font-bold">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[10px] font-semibold text-[#06B6D4] hover:underline"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              title="Clear all"
              className="text-[#94A3B8] hover:text-rose-400 p-1 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="p-2 overflow-y-auto space-y-1.5 flex-1">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-[#94A3B8] text-xs space-y-1">
            <Bell className="w-8 h-8 mx-auto opacity-30 text-[#06B6D4]" />
            <p className="font-semibold text-[#F8FAFC]">All caught up!</p>
            <p className="text-[11px]">No unread alerts or mentions</p>
          </div>
        ) : (
          notifications.map((notif) => {
            return (
              <div
                key={notif.id}
                onClick={() => {
                  onMarkAsRead(notif.id);
                  if (notif.channelId && onSelectChannel) {
                    onSelectChannel(notif.channelId);
                    onClose();
                  }
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  !notif.read
                    ? 'bg-[#1E293B] border-[#06B6D4]/40 hover:border-[#06B6D4]'
                    : 'bg-[#020617]/50 border-[#334155]/40 opacity-75 hover:opacity-100 hover:bg-[#1E293B]/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {notif.sender?.avatar ? (
                    <img
                      src={notif.sender.avatar}
                      alt={notif.sender.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-[#334155]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4] shrink-0 mt-0.5">
                      {notif.type === 'mention' ? <MessageSquare className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-[#F8FAFC] truncate">{notif.title}</h4>
                      <span className="text-[10px] text-[#94A3B8] shrink-0">{notif.createdAt}</span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.body}
                    </p>
                  </div>

                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-[#06B6D4] shrink-0 mt-1" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
