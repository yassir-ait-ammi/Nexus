import React, { useRef, useEffect } from 'react';
import { Message, User, Attachment, Channel } from '../../types';
import { MessageItem } from './MessageItem';
import { Hash, Volume2, Megaphone, Lock, ArrowDown } from 'lucide-react';

interface MessageListProps {
  channel: Channel;
  messages: Message[];
  currentUser: User;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onReplyToMessage: (message: Message) => void;
  onTogglePinMessage: (messageId: string) => void;
  onPreviewAttachment: (attachment: Attachment) => void;
  onSelectUser: (user: User) => void;
  typingUser: User | null;
  searchFilter: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  channel,
  messages,
  currentUser,
  onEditMessage,
  onDeleteMessage,
  onToggleReaction,
  onReplyToMessage,
  onTogglePinMessage,
  onPreviewAttachment,
  onSelectUser,
  typingUser,
  searchFilter,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUser]);

  // Filter messages by search if active
  const filteredMessages = messages.filter((m) => {
    if (!searchFilter) return true;
    return (
      m.content.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.sender.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.sender.username.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  const formatDateDivider = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden p-0 relative flex flex-col justify-start"
    >
      {/* Channel Header Greeting */}
      <div className="px-6 pt-8 pb-4 mb-4 border-b border-[#334155]/40 space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#06B6D4]">
          {channel.isPrivate ? (
            <Lock className="w-6 h-6 text-amber-400" />
          ) : channel.type === 'voice' ? (
            <Volume2 className="w-6 h-6 text-emerald-400" />
          ) : channel.type === 'announcements' ? (
            <Megaphone className="w-6 h-6 text-fuchsia-400" />
          ) : (
            <Hash className="w-6 h-6" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-black text-[#F8FAFC]">
            Welcome to #{channel.name}!
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-xl leading-relaxed">
            {channel.topic ||
              'This is the start of the #' + channel.name + ' channel. Broadcast messages in near real-time with distributed persistence.'}
          </p>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-1 pb-4 flex-1">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-[#94A3B8] text-xs">
            {searchFilter ? `No messages matching "${searchFilter}"` : 'No messages here yet. Say hello!'}
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const prevMsg = filteredMessages[index - 1];
            const showDateDivider =
              !prevMsg ||
              new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {showDateDivider && (
                  <div className="relative my-4 flex items-center justify-center px-4">
                    <div className="absolute inset-0 flex items-center px-4">
                      <div className="w-full border-t border-[#334155]/60" />
                    </div>
                    <span className="relative px-3 py-1 bg-[#0F172A] border border-[#334155] rounded-full text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                      {formatDateDivider(msg.createdAt)}
                    </span>
                  </div>
                )}

                <MessageItem
                  message={msg}
                  currentUser={currentUser}
                  onEditMessage={onEditMessage}
                  onDeleteMessage={onDeleteMessage}
                  onToggleReaction={onToggleReaction}
                  onReplyToMessage={onReplyToMessage}
                  onTogglePinMessage={onTogglePinMessage}
                  onPreviewAttachment={onPreviewAttachment}
                  onSelectUser={onSelectUser}
                />
              </React.Fragment>
            );
          })
        )}

        {/* Live Typing Indicator */}
        {typingUser && (
          <div className="px-6 py-2 flex items-center gap-2 text-xs text-[#06B6D4] animate-pulse">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce [animation-delay:0.4s]" />
            </span>
            <span className="font-medium text-[#94A3B8]">
              <strong className="text-[#F8FAFC]">{typingUser.name}</strong> is typing...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
