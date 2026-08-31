import React from 'react';
import { AppNotification } from '../../types';
import { X, Bell, MessageSquare, ArrowRight } from 'lucide-react';

interface NotificationToastProps {
  notification: AppNotification | null;
  onClose: () => void;
  onClick: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onClick,
}) => {
  if (!notification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div 
        onClick={onClick}
        className="w-80 bg-[#0F172A] border border-[#06B6D4] rounded-2xl shadow-2xl p-3.5 flex items-start gap-3 cursor-pointer hover:bg-[#1E293B] transition-all group ring-2 ring-[#06B6D4]/30"
      >
        {notification.sender?.avatar ? (
          <img
            src={notification.sender.avatar}
            alt={notification.sender.name}
            className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#334155]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#06B6D4]/20 border border-[#06B6D4] flex items-center justify-center text-[#06B6D4] shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#06B6D4]">
              Incoming Notification
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-[#94A3B8] hover:text-[#F8FAFC] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <h4 className="text-xs font-bold text-[#F8FAFC] truncate mt-0.5">{notification.title}</h4>
          <p className="text-[11px] text-[#94A3B8] line-clamp-2 mt-0.5">{notification.body}</p>
        </div>
      </div>
    </div>
  );
};
