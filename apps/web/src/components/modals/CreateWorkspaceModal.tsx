import React, { useState } from 'react';
import { Workspace } from '../../types';
import { workspaceApi } from '../../lib/api';
import { X, Layers, Sparkles, Check } from 'lucide-react';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkspace: (workspace: Workspace) => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreateWorkspace,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🚀');
  const [selectedColor, setSelectedColor] = useState('from-cyan-500 to-blue-600');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const ICONS = ['🚀', '⚡', '🎨', '🛡️', '🪐', '💡', '💎', '🔥', '🤖', '📦', '🎯', '🌐'];
  const COLORS = [
    { label: 'Cyan / Blue', value: 'from-cyan-500 to-blue-600', preview: 'bg-gradient-to-r from-cyan-500 to-blue-600' },
    { label: 'Fuchsia / Purple', value: 'from-fuchsia-500 to-purple-600', preview: 'bg-gradient-to-r from-fuchsia-500 to-purple-600' },
    { label: 'Emerald / Teal', value: 'from-emerald-500 to-teal-600', preview: 'bg-gradient-to-r from-emerald-500 to-teal-600' },
    { label: 'Amber / Orange', value: 'from-amber-500 to-orange-600', preview: 'bg-gradient-to-r from-amber-500 to-orange-600' },
    { label: 'Rose / Pink', value: 'from-rose-500 to-pink-600', preview: 'bg-gradient-to-r from-rose-500 to-pink-600' },
    { label: 'Indigo / Violet', value: 'from-indigo-500 to-violet-600', preview: 'bg-gradient-to-r from-indigo-500 to-violet-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const workspace = await workspaceApi.create({
        name: name.trim(),
        description: description.trim() || 'Collaborative engineering and product workspace.',
        icon: selectedIcon,
        color: selectedColor,
      });
      onCreateWorkspace(workspace);
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155] bg-[#020617]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Create Workspace</h2>
              <p className="text-xs text-[#94A3B8]">Set up a collaborative space for your team</p>
            </div>
          </div>
          <button
            id="create-workspace-close-btn"
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
              Workspace Icon & Emoji
            </label>
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/10 bg-gradient-to-br ${selectedColor}`}>
                {selectedIcon}
              </div>
              <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                {ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedIcon(emoji)}
                    className={`w-8 h-8 text-sm rounded-lg flex items-center justify-center border transition-all ${
                      selectedIcon === emoji
                        ? 'bg-[#1E293B] border-[#06B6D4] scale-110'
                        : 'bg-[#020617] border-[#334155] hover:bg-[#1E293B]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all ${
                    selectedColor === c.value
                      ? 'bg-[#1E293B] border-[#06B6D4] ring-1 ring-[#06B6D4]'
                      : 'bg-[#020617] border-[#334155] hover:bg-[#1E293B]'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${c.preview}`} />
                  <span className="text-[11px] text-[#F8FAFC] font-medium truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
              Workspace Name *
            </label>
            <input
              id="new-workspace-name-input"
              type="text"
              required
              placeholder="e.g. Acme Distributed Lab"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
              Description / Mission
            </label>
            <textarea
              id="new-workspace-desc-input"
              rows={2}
              placeholder="What will this workspace be used for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4] resize-none"
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="new-workspace-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-60 text-[#020617] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSubmitting ? 'Creating…' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
