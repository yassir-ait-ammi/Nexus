import React, { useState } from 'react';
import { Workspace, User } from '../../types';
import { workspaceApi } from '../../lib/api';
import { X, Settings, Users, Link2, Copy, Check, Shield, Trash2, KeyRound } from 'lucide-react';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  currentUser: User;
  members: User[];
  onUpdateWorkspace: (updated: Workspace) => void;
}

export const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({
  isOpen,
  onClose,
  workspace,
  currentUser,
  members,
  onUpdateWorkspace,
}) => {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'general' | 'members' | 'invites'>('general');
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${workspace.inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setError(null);
    setIsSaving(true);
    try {
      const updated = await workspaceApi.update(workspace.id, { name, description });
      onUpdateWorkspace(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update workspace');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155] bg-[#020617]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4]">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Workspace Settings</h2>
              <p className="text-xs text-[#94A3B8]">{workspace.name}</p>
            </div>
          </div>
          <button
            id="workspace-settings-close-btn"
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#334155] bg-[#020617]/30 px-6 pt-2">
          <button
            onClick={() => setTab('general')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              tab === 'general'
                ? 'border-[#06B6D4] text-[#06B6D4]'
                : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            General
          </button>
          <button
            onClick={() => setTab('members')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              tab === 'members'
                ? 'border-[#06B6D4] text-[#06B6D4]'
                : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Members ({members.length})
          </button>
          <button
            onClick={() => setTab('invites')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              tab === 'invites'
                ? 'border-[#06B6D4] text-[#06B6D4]'
                : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Invite Codes
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {tab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                  Workspace Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4] resize-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#020617] border border-[#334155] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#F8FAFC]">Workspace Slug ID</span>
                  <p className="text-[11px] text-[#94A3B8] font-mono">{workspace.slug}</p>
                </div>
                <span className="text-[10px] px-2 py-1 bg-[#1E293B] text-[#94A3B8] rounded-md font-mono">
                  {workspace.id}
                </span>
              </div>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                  {error}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-60 text-[#020617] font-bold text-xs rounded-xl transition-colors"
                >
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {tab === 'members' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94A3B8]">
                  Active members registered in this workspace:
                </span>
                <span className="text-xs font-semibold text-[#06B6D4]">
                  {members.length} Total
                </span>
              </div>

              <div className="space-y-2">
                {members.map((usr) => (
                  <div
                    key={usr.id}
                    className="flex items-center justify-between p-2.5 bg-[#1E293B] border border-[#334155] rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={usr.avatar}
                        alt={usr.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#334155]"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#F8FAFC]">{usr.name}</span>
                          <span className="text-[10px] font-mono text-[#94A3B8]">@{usr.username}</span>
                        </div>
                        <span className="text-[11px] text-[#94A3B8]">{usr.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#020617] border border-[#334155] text-[#06B6D4] font-semibold">
                        {usr.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'invites' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#020617] border border-[#334155] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC]">
                  <KeyRound className="w-4 h-4 text-[#06B6D4]" />
                  Unique Workspace Invite Link
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Anyone with this link or code can join this workspace directly:
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/join/${workspace.inviteCode}`}
                    className="w-full px-3 py-2 text-xs bg-[#1E293B] border border-[#334155] rounded-xl text-[#06B6D4] font-mono focus:outline-hidden"
                  />
                  <button
                    onClick={handleCopyInvite}
                    className="px-3.5 py-2 bg-[#06B6D4] hover:bg-[#0891B2] text-[#020617] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#1E293B]/50 border border-[#334155] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#F8FAFC]">Invite Code</span>
                  <p className="text-xs font-mono text-[#06B6D4] font-bold">{workspace.inviteCode}</p>
                </div>
                <span className="text-[10px] px-2 py-1 bg-[#020617] text-[#94A3B8] rounded">Never expires</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
