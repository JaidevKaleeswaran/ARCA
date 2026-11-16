import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';
import { Lock, Mail, User, ArrowRight, ArrowLeft, ArrowUpRight, Eye, EyeOff, KeyRound, HelpCircle, X, CheckCircle2 } from 'lucide-react';
import { env } from '../../config/env';

import Logo from '../ui/Logo';

export default function LoginPage() {
  const { loginWithEmail, signupWithEmail, loginWithGoogle, loginAsGuest, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password Reset state
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
          toast.success('Account created! An activation link was sent to your email. Please check your inbox and click the link to activate your account.', { duration: 7000 });
          setIsSignUp(false);
        } else {
          toast.success('Account created successfully!');
        }
      } else {
        await loginWithEmail(formData.email, formData.password);
        toast.success('Welcome back to ARCA!');
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
        toast.loading('Redirecting to Google for sign-in...', { duration: 4000 });
      } else {
        toast.success('Logged in with Google!');
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
    toast.success('Entered as Guest!');
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
      toast.success('Password reset link sent! Check your inbox (and spam folder).', { duration: 6000 });
    } catch (err) {
      console.error('Password reset error:', err);
      toast.error(err.message || 'Failed to send reset link', { duration: 6000 });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 selection:bg-accent selection:text-primary">

      {/* ── Login card ── */}
      <div className="w-full max-w-md relative" style={{ zIndex: 2 }}>
        <div className="mb-4 flex items-center justify-between">
          <a
            href={env.onboardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Onboarding Site</span>
          </a>
        </div>

        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" className="mb-3" />
          <p className="text-zinc-400 mt-1 text-sm">
            {isSignUp ? 'Create your budget account' : 'Sign in to access your financial dashboard'}
          </p>
        </div>

        <Card className="backdrop-blur-xl bg-card/90 border-border shadow-2xl ring-1 ring-white/5 p-6">
          {/* Tab Switcher */}
          <div className="flex bg-primary p-1 rounded-lg mb-6 border border-border">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isSignUp ? 'bg-accent text-primary font-semibold shadow' : 'text-text-muted hover:text-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isSignUp ? 'bg-accent text-primary font-semibold shadow' : 'text-text-muted hover:text-text'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-zinc-500" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-primary border border-border rounded-lg pl-10 pr-4 py-2.5 text-text focus:outline-none focus:border-accent transition-colors text-sm"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full bg-primary border border-border rounded-lg pl-10 pr-4 py-2.5 text-text focus:outline-none focus:border-accent transition-colors text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(formData.email || '');
                      setResetSent(false);
                      setIsResetModalOpen(true);
                    }}
                    className="text-xs text-accent hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-primary border border-border rounded-lg pl-10 pr-11 py-2.5 text-text focus:outline-none focus:border-accent transition-colors text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-accent p-1 rounded transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-accent hover:bg-accent-hover text-primary font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm shadow-md disabled:opacity-60 cursor-pointer"
            >
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-3 text-xs text-text-muted uppercase tracking-wider">Or continue with</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-card hover:bg-card-hover border border-border hover:border-accent/60 text-text font-medium py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-60 cursor-pointer shadow-sm group"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Prominent Guest Mode & Tutorial Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full bg-card hover:bg-card-hover border border-accent/30 hover:border-accent text-accent font-semibold py-2.5 px-3 rounded-lg transition-all flex items-center justify-center space-x-2 text-xs shadow-sm cursor-pointer"
              >
                <HelpCircle size={15} className="text-accent shrink-0" />
                <span>Skip sign in & launch Tutorial as Guest →</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-600 mt-6">
          Encrypted · Private · Zero-Based Budgeting
        </p>
      </div>

      {/* ── Password Reset Modal ── */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#18181b] border border-zinc-700/80 rounded-2xl p-6 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-accent/15 text-accent border border-accent/30">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">Reset Password</h3>
                <p className="text-xs text-text-muted">Receive a secure link to choose a new password</p>
              </div>
            </div>

            {resetSent ? (
              <div className="space-y-4 py-2">
                <div className="bg-[#2e5b45]/15 border border-[#2e5b45]/30 rounded-xl p-4 flex items-start space-x-3 text-xs text-zinc-200">
                  <CheckCircle2 size={18} className="text-accent shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-text">Reset Email Dispatched</p>
                    <p className="text-zinc-400 leading-relaxed">
                      We've sent a password reset link to <strong className="text-text">{resetEmail}</strong>. Please check your inbox and your spam/junk folder.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full bg-accent hover:bg-accent-hover text-primary font-semibold py-2.5 rounded-lg transition-colors text-sm cursor-pointer shadow-md"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                    Your Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-primary border border-border rounded-lg pl-10 pr-4 py-2.5 text-text focus:outline-none focus:border-accent transition-colors text-sm"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                    Firebase will generate a secure reset link. If you originally signed up with Google, you can sign in directly using Google or set a password using this link.
                  </p>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 py-2.5 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 bg-accent hover:bg-accent-hover text-primary font-semibold py-2.5 rounded-lg transition-colors text-sm shadow-md disabled:opacity-60 cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>{resetLoading ? 'Sending...' : 'Send Reset Link'}</span>
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
