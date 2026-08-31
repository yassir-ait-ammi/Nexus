import React, { useState } from 'react';
import { Message, User, Attachment } from '../../types';
import { 
  Smile, 
  CornerUpLeft, 
  Pencil, 
  Trash2, 
  Pin, 
  FileText, 
  Code, 
  FileArchive, 
  Check, 
  X, 
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  currentUser: User;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onReplyToMessage: (message: Message) => void;
  onTogglePinMessage: (messageId: string) => void;
  onPreviewAttachment: (attachment: Attachment) => void;
  onSelectUser: (user: User) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '🚀', '🔥', '🎉', '👀', '💯', '👏'];

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUser,
  onEditMessage,
  onDeleteMessage,
  onToggleReaction,
  onReplyToMessage,
  onTogglePinMessage,
  onPreviewAttachment,
  onSelectUser,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwner = message.senderId === currentUser.id;
  const canModerate = isOwner || currentUser.role === 'Admin' || currentUser.role === 'Owner';

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEditMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  // Render text with highlight for @mentions and code blocks
  const renderFormattedContent = (content: string) => {
    // Check for markdown code blocks
    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        lang: match[1] || 'code',
        value: match[2],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.substring(lastIndex),
      });
    }

    if (parts.length === 0) {
      parts.push({ type: 'text', value: content });
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={index} className="my-2 p-3 bg-[#020617] border border-[#334155] rounded-xl overflow-x-auto font-mono text-xs text-[#06B6D4]">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#334155]/60 text-[10px] text-[#94A3B8]">
              <span>{part.lang || 'snippet'}</span>
              <span>PostgreSQL / NestJS</span>
            </div>
            <pre className="text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">{part.value}</pre>
          </div>
        );
      }

      // Format mentions, bold, and inline codes
      return (
        <span key={index} className="leading-relaxed">
          {part.value.split(/(@[a-zA-Z0-9_-]+)/g).map((word, wIdx) => {
            if (word.startsWith('@')) {
              return (
                <span
                  key={wIdx}
                  className="px-1.5 py-0.5 rounded bg-[#06B6D4]/15 text-[#06B6D4] font-semibold border border-[#06B6D4]/30"
                >
                  {word}
                </span>
              );
            }
            return word;
          })}
        </span>
      );
    });
  };

  return (
    <div 
      className={`group relative flex gap-3 px-4 py-2.5 hover:bg-[#1E293B]/40 transition-colors ${
        message.pinned ? 'bg-[#06B6D4]/5 border-l-2 border-[#06B6D4]' : ''
      }`}
    >
      {/* Sender Avatar */}
      <button 
        onClick={() => onSelectUser(message.sender)}
        className="shrink-0 self-start mt-0.5"
      >
        <img
          src={message.sender.avatar}
          alt={message.sender.name}
          className="w-9 h-9 rounded-full object-cover border border-[#334155] hover:opacity-80 transition-opacity"
          referrerPolicy="no-referrer"
        />
      </button>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        {/* Reply Context if any */}
        {message.replyToMessage && (
          <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-1 pl-2 border-l-2 border-[#06B6D4]/60">
            <CornerUpLeft className="w-3 h-3 text-[#06B6D4]" />
            <span className="font-semibold text-[#F8FAFC]">@{message.replyToMessage.senderName}</span>
            <span className="truncate max-w-sm italic opacity-80">{message.replyToMessage.content}</span>
          </div>
        )}

        {/* Sender Name & Meta */}
        <div className="flex items-center gap-2 mb-0.5">
          <button
            onClick={() => onSelectUser(message.sender)}
            className="text-xs font-bold text-[#F8FAFC] hover:text-[#06B6D4] transition-colors"
          >
            {message.sender.name}
          </button>

          {message.sender.role && message.sender.role !== 'Member' && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#06B6D4]/15 text-[#06B6D4] font-semibold">
              {message.sender.role}
            </span>
          )}

          <span className="text-[10px] text-[#94A3B8]">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {message.isEdited && (
            <span className="text-[10px] text-[#94A3B8] italic">(edited)</span>
          )}

          {message.pinned && (
            <span className="text-[10px] text-[#06B6D4] font-semibold flex items-center gap-0.5">
              <Pin className="w-2.5 h-2.5" /> Pinned
            </span>
          )}
        </div>

        {/* Message Content or Edit Input */}
        {isEditing ? (
          <div className="mt-1 space-y-2">
            <textarea
              rows={2}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full p-2 text-xs bg-[#020617] border border-[#06B6D4] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:ring-1 focus:ring-[#06B6D4]"
            />
            <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
              <span>Press <kbd className="px-1 py-0.5 bg-[#1E293B] rounded text-[#F8FAFC]">Enter</kbd> to save • <kbd className="px-1 py-0.5 bg-[#1E293B] rounded text-[#F8FAFC]">Esc</kbd> to cancel</span>
              <button
                onClick={handleSaveEdit}
                className="px-2.5 py-1 bg-[#06B6D4] text-[#020617] font-bold rounded-lg text-xs hover:bg-[#0891B2]"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content);
                }}
                className="px-2.5 py-1 bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#F8FAFC] whitespace-pre-wrap break-words">
            {renderFormattedContent(message.content)}
          </div>
        )}

        {/* Attachments Section */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {message.attachments.map((att) => {
              if (att.type === 'image') {
                return (
                  <div
                    key={att.id}
                    onClick={() => onPreviewAttachment(att)}
                    className="relative group/img cursor-pointer overflow-hidden rounded-xl border border-[#334155] max-w-xs shadow-md"
                  >
                    <img
                      src={att.previewUrl || att.url}
                      alt={att.name}
                      className="max-h-48 object-cover rounded-xl group-hover/img:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-xs text-white font-medium transition-opacity">
                      Click to zoom
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={att.id}
                  onClick={() => onPreviewAttachment(att)}
                  className="flex items-center gap-3 p-2.5 bg-[#020617] border border-[#334155] hover:border-[#06B6D4] rounded-xl cursor-pointer transition-all max-w-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center text-[#06B6D4] shrink-0">
                    {att.type === 'code' ? <Code className="w-4 h-4" /> : att.type === 'archive' ? <FileArchive className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#F8FAFC] truncate">{att.name}</p>
                    <p className="text-[10px] text-[#94A3B8]">{(att.size / 1024).toFixed(1)} KB • PostgreSQL Blob</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>
              );
            })}
          </div>
        )}

        {/* Message Reactions */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {Object.entries(message.reactions || {}).map(([emoji, userIds]: [string, string[]]) => {
            if (!userIds || userIds.length === 0) return null;
            const hasReacted = userIds.includes(currentUser.id);
            return (
              <button
                key={emoji}
                onClick={() => onToggleReaction(message.id, emoji)}
                className={`px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 border transition-all ${
                  hasReacted
                    ? 'bg-[#06B6D4]/15 border-[#06B6D4] text-[#06B6D4] font-bold'
                    : 'bg-[#1E293B] border-[#334155] text-[#94A3B8] hover:border-[#06B6D4]/50'
                }`}
              >
                <span>{emoji}</span>
                <span className="text-[11px] font-mono">{userIds.length}</span>
              </button>
            );
          })}

          {/* Quick add emoji button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-lg text-xs transition-colors opacity-0 group-hover:opacity-100"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Emoji picker popover */}
        {showEmojiPicker && (
          <div className="mt-2 p-1.5 bg-[#0F172A] border border-[#334155] rounded-xl flex items-center gap-1 shadow-xl z-20">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onToggleReaction(message.id, emoji);
                  setShowEmojiPicker(false);
                }}
                className="w-7 h-7 flex items-center justify-center hover:bg-[#1E293B] rounded-lg text-sm transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover Floating Action Bar */}
      <div className="absolute right-4 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0F172A] border border-[#334155] rounded-xl shadow-lg flex items-center p-1 gap-0.5 z-10">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="React"
          className="p-1.5 text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#1E293B] rounded-lg transition-colors"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onReplyToMessage(message)}
          title="Reply in thread"
          className="p-1.5 text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#1E293B] rounded-lg transition-colors"
        >
          <CornerUpLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onTogglePinMessage(message.id)}
          title={message.pinned ? 'Unpin message' : 'Pin message'}
          className={`p-1.5 rounded-lg transition-colors ${
            message.pinned ? 'text-[#06B6D4] bg-[#06B6D4]/10' : 'text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#1E293B]'
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        {isOwner && (
          <button
            onClick={() => setIsEditing(true)}
            title="Edit message"
            className="p-1.5 text-[#94A3B8] hover:text-amber-400 hover:bg-[#1E293B] rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}

        {canModerate && (
          confirmDelete ? (
            <div className="flex items-center gap-1 px-1">
              <button
                onClick={() => onDeleteMessage(message.id)}
                title="Confirm delete"
                className="p-1 text-rose-400 hover:bg-rose-500/20 rounded font-bold text-xs"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                title="Cancel"
                className="p-1 text-[#94A3B8] hover:bg-[#1E293B] rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete message"
              className="p-1.5 text-[#94A3B8] hover:text-rose-400 hover:bg-[#1E293B] rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>
    </div>
  );
};
