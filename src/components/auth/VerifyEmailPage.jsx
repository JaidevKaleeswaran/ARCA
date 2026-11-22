import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';
import { MailCheck, RefreshCw, LogOut, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';

export default function VerifyEmailPage() {
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
    } catch (e) {}
    toast.success(`Welcome to ARCA, ${user.displayName || user.email}!`);
    window.location.reload();
  };

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const isVerified = await refreshUserStatus();
      if (isVerified) {
        toast.success('Email verified successfully! Welcome to ARCA.');
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
      toast.success('Activation email resent! Please check your spam folder if not found.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-4 py-8 selection:bg-accent selection:text-primary">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/15 border border-accent/30 mb-6 text-accent">
          <MailCheck size={40} />
        </div>

        <h1 className="text-3xl font-bold text-text tracking-tight mb-2">
          Verify Your Email
        </h1>
        <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">
          We sent an account activation link to <br />
          <span className="text-accent font-semibold">{user?.email}</span>
        </p>

        <Card className="backdrop-blur-xl bg-card/90 border-border shadow-2xl p-6 text-left space-y-4">
          <div className="bg-primary border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-accent" />
              <span>Next steps to activate your account:</span>
            </div>
            <ol className="list-decimal list-inside text-xs text-text-muted space-y-1.5 pl-1">
              <li>Open your email inbox for <strong className="text-zinc-200">{user?.email}</strong></li>
              <li>Click the activation link inside the email from <strong>ARCA / Firebase</strong></li>
              <li>Return here and click <strong>"I've Activated My Account"</strong></li>
            </ol>
          </div>

          {/* Spam Prevention & Inbox Tips Box */}
          <div className="bg-card border border-border rounded-lg p-3.5 space-y-2 text-xs text-text-muted">
            <p className="font-semibold flex items-center gap-1 text-accent">
              Check your Spam / Junk folder
            </p>
            <p className="text-text-muted leading-relaxed text-[11px]">
              Verification emails from <code className="bg-primary px-1 py-0.5 rounded text-accent">ARCA-support@arca-budgeting.com</code> (or <code className="bg-primary px-1 py-0.5 rounded text-accent">noreply@arca-budgeting.firebaseapp.com</code>) are sometimes flagged by Spam filters (Gmail, Outlook, Yahoo).
            </p>
            <ul className="list-disc list-inside text-[11px] text-text-muted space-y-1 pl-1">
              <li>Check your <strong>Spam / Junk / Promotions</strong> folder</li>
              <li>Click <strong>"Not Spam"</strong> in Gmail to move it to your Primary inbox</li>
              <li>Add <code className="bg-primary px-1 py-0.5 rounded text-accent">ARCA-support@arca-budgeting.com</code> to your contacts</li>
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="w-full bg-accent hover:bg-accent-hover text-primary font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm shadow-md disabled:opacity-50"
            >
              <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
              <span>{checking ? 'Checking Status...' : "I've Activated My Account"}</span>
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full bg-primary hover:bg-card-hover border border-border text-zinc-300 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2 text-xs"
            >
              <span>{resending ? 'Sending...' : 'Resend Activation Email'}</span>
            </button>

            <button
              type="button"
              onClick={handleDeferVerification}
              className="w-full bg-[#2e5b45]/30 hover:bg-[#2e5b45]/40 border border-[#2e5b45]/60 text-zinc-200 font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 text-xs shadow-sm cursor-pointer"
            >
              <ArrowRight size={15} className="text-accent shrink-0" />
              <span>Continue to My Dashboard (Activate Later) →</span>
            </button>

            <button
              type="button"
              onClick={() => {
                loginAsGuest();
                toast.success('Switched to Guest mode! Welcome to ARCA.');
              }}
              className="w-full bg-card hover:bg-card-hover border border-accent/40 text-accent font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 text-xs shadow-sm cursor-pointer"
            >
              <HelpCircle size={15} className="text-accent" />
              <span>Explore as Guest & Launch Tutorial →</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full text-xs text-zinc-500 hover:text-red-400 transition-colors text-center py-2 flex items-center justify-center space-x-1"
            >
              <LogOut size={14} />
              <span>Sign out / Back to Login</span>
            </button>
          </div>
        </Card>

      </div>
    </div>
  );
}
