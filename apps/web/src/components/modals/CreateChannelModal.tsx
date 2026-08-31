import React, { useState } from 'react';
import { Channel, ChannelType, ChannelSection, User } from '../../types';
import { channelApi } from '../../lib/api';
import { X, Hash, Volume2, Megaphone, Lock, Globe, Plus, Check } from 'lucide-react';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  members: User[];
  onCreateChannel: (channel: Channel) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  members,
  onCreateChannel,
}) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<ChannelType>('text');
  const [section, setSection] = useState<ChannelSection>('channels');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    const formattedName = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');

    setError(null);
    setIsSubmitting(true);
    try {
      const channel = await channelApi.create({
        workspaceId,
        name: formattedName || 'channel',
        topic: topic.trim() || undefined,
        type,
        section,
        isPrivate,
        memberIds: isPrivate ? selectedMembers : undefined,
      });
      onCreateChannel(channel);
      setName('');
      setTopic('');
      setIsPrivate(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155] bg-[#020617]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4]">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Create Channel</h2>
              <p className="text-xs text-[#94A3B8]">Add a discussion channel to your workspace</p>
            </div>
          </div>
          <button
            id="create-channel-close-btn"
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Channel Type */}
          <div>
            <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
              Channel Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('text')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                  type === 'text'
                    ? 'bg-[#06B6D4]/15 border-[#06B6D4] text-[#06B6D4]'
                    : 'bg-[#1E293B] border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span className="text-xs font-semibold">Text</span>
                <span className="text-[10px] opacity-75">Messages & Code</span>
              </button>

              <button
                type="button"
                onClick={() => setType('voice')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                  type === 'voice'
                    ? 'bg-[#06B6D4]/15 border-[#06B6D4] text-[#06B6D4]'
                    : 'bg-[#1E293B] border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-xs font-semibold">Voice Room</span>
                <span className="text-[10px] opacity-75">Live Audio Sync</span>
              </button>

              <button
                type="button"
                onClick={() => setType('announcements')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                  type === 'announcements'
                    ? 'bg-[#06B6D4]/15 border-[#06B6D4] text-[#06B6D4]'
                    : 'bg-[#1E293B] border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span className="text-xs font-semibold">Broadcast</span>
                <span className="text-[10px] opacity-75">Read-only notices</span>
              </button>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
              Channel Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                <Hash className="w-3.5 h-3.5" />
              </div>
              <input
                id="new-channel-name-input"
                type="text"
                required
                placeholder="new-channel-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4] font-mono"
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
              Topic / Description (Optional)
            </label>
            <input
              id="new-channel-topic-input"
              type="text"
              placeholder="What is this channel about?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4]"
            />
          </div>

          {/* Section */}
          <div>
            <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
              Category Group
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as ChannelSection)}
              className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4]"
            >
              <option value="channels">Channels</option>
              <option value="general">General & Announcements</option>
              <option value="projects">Projects & Features</option>
            </select>
          </div>

          {/* Privacy Toggle */}
          <div className="p-3 bg-[#1E293B] border border-[#334155] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <Globe className="w-4 h-4 text-[#06B6D4]" />}
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC]">
                    {isPrivate ? 'Private Channel' : 'Public Channel'}
                  </h4>
                  <p className="text-[10px] text-[#94A3B8]">
                    {isPrivate ? 'Only invited members can view this channel' : 'Anyone in the workspace can join'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isPrivate ? 'bg-[#06B6D4]' : 'bg-[#334155]'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isPrivate ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Member selector if private */}
            {isPrivate && (
              <div className="pt-2 border-t border-[#334155] space-y-1.5">
                <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Invite Members ({selectedMembers.length})
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {members.map((user) => {
                    const isSelected = selectedMembers.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleMember(user.id)}
                        className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition-colors ${
                          isSelected ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'hover:bg-[#020617] text-[#94A3B8]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                          <span className="text-xs font-medium text-[#F8FAFC]">{user.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#06B6D4]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="new-channel-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-60 text-[#020617] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              {isSubmitting ? 'Creating…' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
