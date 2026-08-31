import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentUser } from '../lib/session-user';
import { workspaceApi } from '../lib/api';
import { AuthModal } from '../components/modals/AuthModal';

export default function JoinWorkspace() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { currentUser, isPending } = useCurrentUser();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!currentUser || !inviteCode || hasAttempted.current) return;
    hasAttempted.current = true;
    workspaceApi
      .join(inviteCode)
      .then((workspace) => {
        localStorage.setItem('pulse_active_ws', workspace.id);
        navigate('/', { replace: true });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not join workspace');
      });
  }, [currentUser, inviteCode, navigate]);

  if (isPending) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#020617] text-[#94A3B8] text-sm">
        Loading…
      </div>
    );
  }

  if (!currentUser) {
    return <AuthModal isOpen onClose={() => {}} />;
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#020617] text-[#F8FAFC] px-4 text-center">
        <p className="text-sm text-rose-400">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] text-[#020617] font-bold text-xs rounded-xl transition-colors"
        >
          Go to Nexus
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#020617] text-[#94A3B8] text-sm">
      Joining workspace…
    </div>
  );
}
