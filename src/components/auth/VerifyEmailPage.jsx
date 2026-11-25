import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { RefreshCw, LogOut, HelpCircle, ArrowRight } from 'lucide-react';
import Logo from '../ui/Logo';
import LeavingSoonBadge from './LeavingSoonBadge';

export default function VerifyEmailPage({ onBackToHome }) {
  const { user, resendVerificationEmail, refreshUserStatus, logout, loginAsGuest } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  const handleDeferVerification = () => {
    if (!user) return;
    const updated = {
      ...user,
      emailVerified: true,
      activationPending: true,
    };
    try {
      if (user.uid) {
        localStorage.setItem(`arca_activation_pending_${user.uid}`, 'true');
      }
      localStorage.setItem('arca_user_session', JSON.stringify(updated));
    } catch {
      // Ignore storage failures
    }
    toast.success(`Welcome to ARCA, ${user.displayName || user.email}.`);
    window.location.reload();
  };

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const isVerified = await refreshUserStatus();
      if (isVerified) {
        toast.success('Email verified. Welcome to ARCA.');
      } else {
        toast.error('Email not verified yet. Please check your inbox and click the link.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not check status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      toast.success('Activation email resent. Check your spam folder if not found.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090908] text-zinc-100">
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

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
              Verify your email
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We sent an activation link to{' '}
              <span className="font-medium text-[#E7B956]">{user?.email}</span>.
            </p>
          </div>

          <div className="divide-y divide-white/[0.08] border-y border-white/[0.08] text-xs text-zinc-400">
            <div className="py-4 space-y-2">
              <p className="font-medium text-zinc-200">Next steps</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open your inbox for <strong className="text-zinc-200">{user?.email}</strong></li>
                <li>Click the activation link from ARCA / Firebase</li>
                <li>Return here and confirm activation</li>
              </ol>
            </div>

            <div className="py-4 space-y-1.5">
              <p className="font-medium text-[#E7B956]">Check Spam / Junk folder</p>
              <p className="leading-relaxed text-zinc-500">
                Messages from <code className="text-zinc-300">noreply@arca-budgeting.firebaseapp.com</code> can occasionally land in Spam or Promotions. Mark as Not Spam to ensure future alerts arrive.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#E7B956] text-xs font-semibold text-[#090908] hover:bg-[#d8aa45] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} strokeWidth={1.75} />
              <span>{checking ? 'Checking status...' : "I've activated my account"}</span>
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="flex h-9 w-full items-center justify-center rounded-md border border-white/[0.1] bg-[#111110] text-xs font-medium text-zinc-200 hover:bg-[#171715] cursor-pointer"
            >
              {resending ? 'Sending...' : 'Resend activation email'}
            </button>

            <button
              type="button"
              onClick={handleDeferVerification}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-white/[0.1] text-xs font-medium text-zinc-300 hover:border-white/[0.2] hover:text-zinc-100 cursor-pointer"
            >
              <span>Continue to dashboard (activate later)</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>

            <div
              role="button"
              tabIndex={0}
              aria-label="Explore as Guest"
              onClick={() => {
                loginAsGuest();
                toast.success('Switched to Guest mode.');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  loginAsGuest();
                  toast.success('Switched to Guest mode.');
                }
              }}
              className="flex min-h-[38px] w-full items-center justify-between gap-2 rounded-full border border-[#E7B956]/30 px-4 py-1.5 text-xs font-medium text-[#E7B956] hover:border-[#E7B956] cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                <span className="truncate">Explore as Guest</span>
              </span>
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <LeavingSoonBadge />
                <ArrowRight className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-1.5 py-2 text-xs text-zinc-500 hover:text-rose-400 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
