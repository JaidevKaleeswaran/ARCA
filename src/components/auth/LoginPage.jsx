import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ArrowRight, Eye, EyeOff, HelpCircle, X, CheckCircle2 } from 'lucide-react';
import Logo from '../ui/Logo';
import LeavingSoonBadge from './LeavingSoonBadge';

export default function LoginPage({ onBackToHome, initialSignUp = false }) {
  const { loginWithEmail, signupWithEmail, loginWithGoogle, loginAsGuest, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(Boolean(initialSignUp));
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (isSignUp && !formData.name) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const res = await signupWithEmail(formData.email, formData.password, formData.name);
        if (res?.requiresActivation) {
          toast.success(
            'Account created! An activation link was sent to your email. Please check your inbox and spam folder.',
            { duration: 7000 }
          );
          setIsSignUp(false);
        } else {
          toast.success('Account created.');
        }
      } else {
        await loginWithEmail(formData.email, formData.password);
        toast.success('Signed in to ARCA.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Authentication failed', { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res?.redirecting) {
        toast.loading('Redirecting to Google...', { duration: 4000 });
      } else {
        toast.success('Signed in with Google.');
      }
    } catch (err) {
      console.error('Google Auth Error:', err);
      toast.error(err.message || 'Google Sign-in failed', { duration: 7000 });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    toast.success('Entered as Guest.');
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(resetEmail.trim());
      setResetSent(true);
      toast.success('Password reset link sent. Check your inbox and spam folder.', { duration: 6000 });
    } catch (err) {
      console.error('Password reset error:', err);
      toast.error(err.message || 'Failed to send reset link', { duration: 6000 });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090908] text-zinc-100">
      {/* Top-left clickable logo to return to onboarding */}
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:px-6">
        <button
          type="button"
          onClick={onBackToHome}
          title="Back to ARCA overview"
          aria-label="Back to ARCA overview"
          className="inline-flex items-center rounded-md focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Logo size="sm" />
        </button>
      </header>

      {/* Focused Single-Column Auth Area */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
            {isSignUp ? 'Create your account' : 'Sign in to ARCA'}
          </h1>

          {/* Segmented Pill Mode Control */}
          <div className="grid grid-cols-2 rounded-full border border-white/[0.08] bg-[#111110] p-1">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`rounded-full py-1.5 text-xs transition-colors cursor-pointer ${
                !isSignUp
                  ? 'bg-[#E7B956] font-semibold text-[#090908]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`rounded-full py-1.5 text-xs transition-colors cursor-pointer ${
                isSignUp
                  ? 'bg-[#E7B956] font-semibold text-[#090908]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Alex Rivera"
                  className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#111110] px-3.5 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none transition-colors"
                  required={isSignUp}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#111110] px-3.5 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-400">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(formData.email || '');
                      setResetSent(false);
                      setIsResetModalOpen(true);
                    }}
                    className="text-xs text-[#E7B956] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#111110] pl-3.5 pr-11 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-zinc-500 hover:text-zinc-200 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 sm:h-9 w-full items-center justify-center gap-1.5 rounded-full bg-[#E7B956] text-xs font-semibold text-[#090908] transition-colors hover:bg-[#d8aa45] disabled:opacity-60 cursor-pointer"
            >
              <span>{isSignUp ? 'Create account' : 'Sign in'}</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-white/[0.08]" />
            <span className="text-[11px] text-zinc-600">or</span>
            <div className="flex-1 border-t border-white/[0.08]" />
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex h-10 sm:h-9 w-full items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-[#111110] text-xs font-medium text-zinc-200 transition-colors hover:border-white/[0.2] hover:bg-[#171715] disabled:opacity-60 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div
              role="button"
              tabIndex={0}
              aria-label="Continue as Guest"
              onClick={handleGuestLogin}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleGuestLogin();
                }
              }}
              className="flex min-h-[40px] sm:min-h-[38px] w-full items-center justify-between gap-2 rounded-full border border-[#E7B956]/30 bg-transparent px-4 py-1.5 text-xs font-medium text-[#E7B956] transition-colors hover:border-[#E7B956] hover:bg-[#E7B956]/5 cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                <span className="truncate">Continue as Guest</span>
              </span>
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <LeavingSoonBadge />
                <ArrowRight className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-sm rounded-lg border border-white/[0.1] bg-[#111110] p-5 text-left animate-step-enter">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              aria-label="Close password reset"
              className="absolute right-4 top-4 rounded p-1 text-zinc-500 hover:text-zinc-200 cursor-pointer"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>

            <div className="mb-4 space-y-1">
              <h3 className="text-sm font-semibold text-zinc-100">Reset password</h3>
              <p className="text-xs text-zinc-500">
                We will email you a link to set a new password.
              </p>
            </div>

            {resetSent ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 rounded-md border border-white/[0.08] bg-[#090908] p-3.5 text-xs text-zinc-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E7B956]" strokeWidth={1.5} />
                  <p className="leading-relaxed text-zinc-400">
                    Reset link sent to <strong className="text-zinc-100">{resetEmail}</strong>. Check your inbox and spam folder.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="h-9 w-full rounded-md bg-[#E7B956] text-xs font-semibold text-[#090908] hover:bg-[#d8aa45] cursor-pointer"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-400">
                    Registered email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-9 w-full rounded-md border border-white/[0.1] bg-[#090908] px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="h-9 flex-1 rounded-md border border-white/[0.1] text-xs font-medium text-zinc-300 hover:bg-white/[0.04] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="h-9 flex-1 rounded-md bg-[#E7B956] text-xs font-semibold text-[#090908] hover:bg-[#d8aa45] disabled:opacity-60 cursor-pointer"
                  >
                    {resetLoading ? 'Sending...' : 'Send link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
