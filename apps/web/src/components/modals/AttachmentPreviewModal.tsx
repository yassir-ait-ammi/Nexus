import React from 'react';
import { Attachment } from '../../types';
import { X, Download, FileText, Code, FileArchive, Eye, ExternalLink } from 'lucide-react';

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: Attachment | null;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  isOpen,
  onClose,
  attachment,
}) => {
  if (!isOpen || !attachment) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div 
        className="w-full max-w-3xl bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#334155] bg-[#020617]/50">
          <div className="flex items-center gap-2.5">
            {attachment.type === 'image' && <Eye className="w-4 h-4 text-[#06B6D4]" />}
            {attachment.type === 'code' && <Code className="w-4 h-4 text-emerald-400" />}
            {attachment.type === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
            {attachment.type === 'archive' && <FileArchive className="w-4 h-4 text-amber-400" />}
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] truncate max-w-md">{attachment.name}</h3>
              <p className="text-[11px] text-[#94A3B8]">{formatFileSize(attachment.size)} • PostgreSQL Blob/Object Storage</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={attachment.url || '#'}
              download={attachment.name}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-xs font-semibold text-[#F8FAFC] rounded-xl flex items-center gap-1.5 transition-colors border border-[#334155]"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-6 flex-1 flex items-center justify-center overflow-auto bg-[#020617]/60 min-h-[300px]">
          {attachment.type === 'image' ? (
            <img
              src={attachment.previewUrl || attachment.url}
              alt={attachment.name}
              className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-lg border border-[#334155]"
              referrerPolicy="no-referrer"
            />
          ) : attachment.type === 'code' ? (
            <div className="w-full h-full max-h-[60vh] bg-[#020617] p-4 rounded-xl border border-[#334155] font-mono text-xs text-[#06B6D4] overflow-auto">
              <div className="text-[11px] text-[#94A3B8] pb-2 border-b border-[#334155] mb-2 flex justify-between">
                <span>SQL Schema Partition Definition</span>
                <span>PostgreSQL 16 Enterprise</span>
              </div>
              <pre className="text-[#F8FAFC]">
{`-- Partitioned message table for 10,000+ users & zero message loss
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    reply_to_id UUID REFERENCES messages(id),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
) PARTITION BY RANGE (created_at);

CREATE TABLE messages_2026_08 PARTITION OF messages
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE INDEX idx_messages_channel_created ON messages (channel_id, created_at DESC);`}
              </pre>
            </div>
          ) : (
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-center justify-center mx-auto text-[#06B6D4]">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-[#F8FAFC]">{attachment.name}</h4>
              <p className="text-xs text-[#94A3B8]">
                Binary document stream ({formatFileSize(attachment.size)}) ready for secure retrieval.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
