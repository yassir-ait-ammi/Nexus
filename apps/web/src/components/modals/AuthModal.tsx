import React, { useState } from 'react';
import { authClient } from '../../lib/auth-client';
import { useCurrentUser } from '../../lib/session-user';
import { X, LogIn, UserPlus, Shield, Sparkles, LogOut } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useCurrentUser();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: signInError } = await authClient.signIn.email({ email, password });
    setIsSubmitting(false);
    if (signInError) {
      setError(signInError.message || 'Invalid email or password');
      return;
    }
    resetForm();
    onClose();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name,
      // `username` is a custom additional field configured on the api side.
      ...({ username } as Record<string, unknown>),
    });
    setIsSubmitting(false);
    if (signUpError) {
      setError(signUpError.message || 'Could not create account');
      return;
    }
    resetForm();
    onClose();
  };

  const handleSignOut = async () => {
    await authClient.signOut({});
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    await authClient.signIn.social({ provider: 'google', callbackURL: window.location.origin });
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
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Account</h2>
              <p className="text-xs text-[#94A3B8]">
                {currentUser ? 'Manage your session' : 'Sign in or create an account'}
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentUser ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1E293B] border border-[#334155]">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border border-[#334155]"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-sm font-semibold text-[#F8FAFC]">{currentUser.name}</p>
                <p className="text-xs text-[#94A3B8] font-mono">@{currentUser.username}</p>
              </div>
            </div>
            <button
              id="sign-out-btn"
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1E293B] hover:bg-rose-500/15 border border-[#334155] hover:border-rose-500/50 text-[#F8FAFC] hover:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <>
            {/* Tab Selector */}
            <div className="flex border-b border-[#334155] bg-[#020617]/30 px-6 pt-2">
              <button
                id="tab-login-btn"
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                  tab === 'login'
                    ? 'border-[#06B6D4] text-[#06B6D4]'
                    : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Login
              </button>
              <button
                id="tab-register-btn"
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                  tab === 'register'
                    ? 'border-[#06B6D4] text-[#06B6D4]'
                    : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <button
                id="google-sign-in-btn"
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#1F1F1F] font-bold text-xs flex items-center justify-center gap-2.5 shadow-lg transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    fill="#FFC107"
                    d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#334155]" />
                <span className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wider">or</span>
                <div className="h-px flex-1 bg-[#334155]" />
              </div>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                  {error}
                </div>
              )}

              {tab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                      Email Address
                    </label>
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      placeholder="jordan@nexus.dev"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                      Password
                    </label>
                    <input
                      id="login-password-input"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4]"
                    />
                  </div>
                  <button
                    id="login-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-60 text-[#020617] font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    {isSubmitting ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                        Full Name *
                      </label>
                      <input
                        id="register-fullname-input"
                        type="text"
                        required
                        placeholder="e.g. Jordan Miller"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                        Username *
                      </label>
                      <input
                        id="register-username-input"
                        type="text"
                        required
                        placeholder="e.g. jordan_dev"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                      Email Address *
                    </label>
                    <input
                      id="register-email-input"
                      type="email"
                      required
                      placeholder="jordan@nexus.dev"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                      Password *
                    </label>
                    <input
                      id="register-password-input"
                      type="password"
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#334155] rounded-xl text-[#F8FAFC] focus:outline-hidden focus:border-[#06B6D4]"
                    />
                  </div>

                  <button
                    id="register-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-60 text-[#020617] font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isSubmitting ? 'Creating account…' : 'Create Account'}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
