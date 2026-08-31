import React, { useEffect, useRef, useState } from 'react';
import { Message, User } from '../../types';
import { getSocket } from '../../lib/socket';
import {
  Send,
  Smile,
  Bold,
  Italic,
  Code,
  List,
  AtSign,
  X,
  CornerUpLeft
} from 'lucide-react';

interface MessageInputProps {
  channelId: string;
  channelName: string;
  onSendMessage: (content: string, replyToId?: string) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  users: User[];
}

const COMMON_EMOJIS = ['😀', '🔥', '🚀', '💯', '👏', '⚡', '✨', '🎉', '💡', '❤️', '🙌', '👀'];
const TYPING_STOP_DELAY_MS = 3000;

export const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  channelName,
  onSendMessage,
  replyingTo,
  onCancelReply,
  users,
}) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);

  const stopTyping = () => {
    clearTimeout(typingStopTimer.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      getSocket()?.emit('typing:stop', { channelId });
    }
  };

  // Stop typing when switching channels or unmounting
  useEffect(() => stopTyping, [channelId]);

  const handleSend = () => {
    if (!content.trim()) return;
    stopTyping();
    onSendMessage(content.trim(), replyingTo?.id);
    setContent('');
    if (replyingTo) onCancelReply();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    if (val.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        getSocket()?.emit('typing:start', { channelId });
      }
      clearTimeout(typingStopTimer.current);
      typingStopTimer.current = setTimeout(stopTyping, TYPING_STOP_DELAY_MS);
    } else {
      stopTyping();
    }

    // Auto expand textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }

    // Check if user is typing @ for mention
    const lastWord = val.split(/\s+/).pop() || '';
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setShowMentionPicker(true);
      setMentionFilter(lastWord.substring(1).toLowerCase());
    } else {
      setShowMentionPicker(false);
    }
  };

  const insertMention = (username: string) => {
    const words = content.split(/\s+/);
    words.pop(); // remove incomplete mention
    const newContent = [...words, `@${username} `].join(' ');
    setContent(newContent);
    setShowMentionPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 50);
  };

  // Filter mention suggestions
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(mentionFilter) ||
      u.name.toLowerCase().includes(mentionFilter)
  );

  return (
    <div className="p-4 bg-[#0F172A] border-t border-[#334155]/60 relative select-none">
      {/* Reply Banner */}
      {replyingTo && (
        <div className="mb-2.5 px-3 py-1.5 bg-[#1E293B] border border-[#06B6D4]/40 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 truncate">
            <CornerUpLeft className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span className="text-[#94A3B8]">Replying to</span>
            <span className="font-bold text-[#F8FAFC]">@{replyingTo.sender.username}</span>
            <span className="text-[#94A3B8] truncate italic max-w-sm">"{replyingTo.content.substring(0, 60)}..."</span>
          </div>
          <button
            onClick={onCancelReply}
            className="text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Box */}
      <div className="bg-[#020617] border border-[#334155] rounded-2xl p-2.5 focus-within:border-[#06B6D4] focus-within:ring-1 focus-within:ring-[#06B6D4] transition-all">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 pb-1.5 mb-1.5 border-b border-[#334155]/40 text-[#94A3B8]">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            title="Bold (**text**)"
            className="p-1 rounded-md hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-colors"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            title="Italic (*text*)"
            className="p-1 rounded-md hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-colors"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('```ts\n', '\n```')}
            title="Code Block"
            className="p-1 rounded-md hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('- ')}
            title="List"
            className="p-1 rounded-md hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-colors"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('@')}
            title="Mention teammate"
            className="p-1 rounded-md hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-colors"
          >
            <AtSign className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="chat-message-textarea"
          rows={1}
          placeholder={`Message #${channelName}... (Press Enter to send, Shift+Enter for new line)`}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-xs text-[#F8FAFC] placeholder-[#94A3B8] resize-none focus:outline-hidden leading-relaxed max-h-40 overflow-y-auto"
        />

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            {/* Emoji Picker Button */}
            <button
              type="button"
              id="emoji-picker-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Insert Emoji"
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#1E293B] transition-colors"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] text-[#94A3B8]">
              NestJS + WS Gateway
            </span>
            <button
              id="send-message-btn"
              type="button"
              onClick={handleSend}
              disabled={!content.trim()}
              className="p-2 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-40 disabled:hover:bg-[#06B6D4] text-[#020617] font-bold transition-all shadow-md flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Emoji Picker Box */}
      {showEmojiPicker && (
        <div
          className="absolute bottom-24 left-4 p-2 bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl z-50 flex flex-wrap gap-1.5 max-w-[260px]"
          onClick={(e) => e.stopPropagation()}
        >
          {COMMON_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => {
                setContent((prev) => prev + em);
                setShowEmojiPicker(false);
                textareaRef.current?.focus();
              }}
              className="w-8 h-8 text-base flex items-center justify-center hover:bg-[#1E293B] rounded-xl hover:scale-125 transition-transform"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Mention Auto-Suggest Popover */}
      {showMentionPicker && (
        <div
          className="absolute bottom-24 left-4 w-60 bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 max-h-48 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase text-[#94A3B8] border-b border-[#334155]/60">
            Mention Member
          </div>
          {filteredUsers.length === 0 ? (
            <p className="text-xs text-[#94A3B8] p-2">No matching member found</p>
          ) : (
            filteredUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => insertMention(u.username)}
                className="w-full flex items-center gap-2 p-1.5 hover:bg-[#1E293B] rounded-xl text-left transition-colors"
              >
                <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                <span className="text-xs font-semibold text-[#F8FAFC]">{u.name}</span>
                <span className="text-[10px] text-[#94A3B8] font-mono">@{u.username}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
