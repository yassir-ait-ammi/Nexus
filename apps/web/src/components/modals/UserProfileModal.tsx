import React, { useRef, useState } from 'react';
import { User, UserStatus } from '../../types';
import { profileApi } from '../../lib/api';
import { useCurrentUser } from '../../lib/session-user';
import { X, MessageSquare, Mail, Calendar, Shield, Sparkles, Check, Camera } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  isCurrentUser: boolean;
  onUpdateStatus?: (status: UserStatus, customStatus: string) => void;
  onStartDirectMessage?: (user: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  isCurrentUser,
  onUpdateStatus,
  onStartDirectMessage,
}) => {
  const [customStatus, setCustomStatus] = useState(user.customStatus || '');
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { refetch } = useCurrentUser();

  if (!isOpen) return null;

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setIsUploadingAvatar(true);
    try {
      await profileApi.uploadAvatar(file);
      await refetch();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Could not upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const STATUS_CONFIG: Record<UserStatus, { label: string; color: string }> = {
    online: { label: 'Online', color: 'bg-emerald-400' },
    busy: { label: 'Do Not Disturb', color: 'bg-rose-500' },
    away: { label: 'Away', color: 'bg-amber-400' },
    offline: { label: 'Invisible / Offline', color: 'bg-slate-500' },
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateStatus) {
      onUpdateStatus(status, customStatus);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        className="w-full max-w-sm bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="h-20 bg-gradient-to-r from-cyan-600 to-blue-700 relative p-4 flex items-start justify-end">
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Details */}
        <div className="px-6 pb-6 pt-0 relative space-y-4">
          <div className="flex items-end justify-between -mt-10 mb-2">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-[#0F172A] shadow-lg"
                referrerPolicy="no-referrer"
              />
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-2 ring-[#0F172A] ${
                  STATUS_CONFIG[user.status]?.color || 'bg-slate-500'
                }`}
              />
              {isCurrentUser && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    title="Change avatar"
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 hover:bg-black/50 text-transparent hover:text-white transition-all disabled:cursor-wait"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#1E293B] border border-[#334155] text-[#06B6D4] font-semibold">
              {user.role}
            </span>
          </div>

          {isCurrentUser && avatarError && (
            <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
              {avatarError}
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">{user.name}</h3>
            <p className="text-xs text-[#94A3B8] font-mono">@{user.username}</p>
          </div>

          {user.customStatus && !isCurrentUser && (
            <div className="p-3 bg-[#1E293B] border border-[#334155] rounded-xl text-xs text-[#F8FAFC]">
              {user.customStatus}
            </div>
          )}

          {/* Quick Info */}
          <div className="space-y-2 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="text-[#F8FAFC]">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="text-[#06B6D4] font-medium">{user.role} permissions</span>
            </div>
          </div>

          {/* Edit status if current user */}
          {isCurrentUser && onUpdateStatus && (
            <form onSubmit={handleSaveStatus} className="pt-2 border-t border-[#334155] space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
                  Update Online Presence
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(STATUS_CONFIG) as UserStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`flex items-center gap-2 p-2 text-xs rounded-xl border transition-all text-left ${
                        status === st
                          ? 'bg-[#1E293B] border-[#06B6D4] text-[#F8FAFC]'
                          : 'bg-[#020617] border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[st].color}`} />
                      <span className="truncate">{STATUS_CONFIG[st].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                  Custom Status Text
                </label>
                <input
                  type="text"
                  placeholder="What's happening? (e.g. ☕ In a meeting)"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#06B6D4] hover:bg-[#0891B2] text-[#020617] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Updated!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Save Presence
                  </>
                )}
              </button>
            </form>
          )}

          {/* DM Button for other users */}
          {!isCurrentUser && onStartDirectMessage && (
            <div className="pt-2 border-t border-[#334155]">
              <button
                onClick={() => {
                  onStartDirectMessage(user);
                  onClose();
                }}
                className="w-full py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] text-[#020617] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                Direct Message @{user.username}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
