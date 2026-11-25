import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Shield,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Mail,
  ArrowRight,
  RotateCcw,
  Link as LinkIcon,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar, {
  AVATAR_PRESETS,
  compressImageToAvatarDataUrl,
} from '../ui/UserAvatar';

export default function AccountSettingsDrawer({
  isOpen,
  onClose,
  onRequestSignUp,
  onStartTutorial,
  onLogout,
}) {
  const {
    user,
    updateAccountProfile,
    changePassword,
    setPasswordForOAuthUser,
    resetPassword,
  } = useAuth();

  const [section, setSection] = useState('profile'); // 'profile' | 'security'

  // Profile form state (drafts initialized from user when drawer opens)
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [draftPhotoURL, setDraftPhotoURL] = useState(user?.photoURL || null);
  const [draftPreset, setDraftPreset] = useState(user?.avatarPreset || null);
  const [draftResetToProvider, setDraftResetToProvider] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const drawerRef = useRef(null);
  const fileInputRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Track viewport scroll & TabNavigation position at 60fps so drawer follows scroll
  // smoothly and NEVER overlaps the pages chooser (TabNavigation).
  useEffect(() => {
    if (!isOpen) return;

    document.body.dataset.settingsDrawerOpen = 'true';
    let rafId = null;

    const syncDrawerBounds = () => {
      rafId = null;
      const el = drawerRef.current;
      if (!el) return;

      const isDesktop = window.innerWidth >= 768;
      const navEl = document.querySelector('[data-tutorial="tab-nav"]');
      const headerEl = document.querySelector('header');

      if (isDesktop) {
        let topPx = 0;
        if (navEl) {
          const navRect = navEl.getBoundingClientRect();
          topPx = Math.max(0, Math.ceil(navRect.bottom));
        } else if (headerEl) {
          const headerRect = headerEl.getBoundingClientRect();
          topPx = Math.max(0, Math.ceil(headerRect.bottom));
        }
        el.style.top = `${topPx}px`;
        el.style.bottom = '0px';
      } else {
        let topPx = 0;
        if (headerEl) {
          const headerRect = headerEl.getBoundingClientRect();
          topPx = Math.max(0, Math.ceil(headerRect.bottom));
        }
        let bottomPx = 0;
        if (navEl) {
          const navRect = navEl.getBoundingClientRect();
          bottomPx = Math.max(0, Math.ceil(window.innerHeight - navRect.top + 8));
        }
        el.style.top = `${topPx}px`;
        el.style.bottom = `${bottomPx}px`;
      }
    };

    const scheduleSync = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(syncDrawerBounds);
      }
    };

    syncDrawerBounds();

    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync, { passive: true });

    let resizeObserver = null;
    const navEl = document.querySelector('[data-tutorial="tab-nav"]');
    if (typeof ResizeObserver !== 'undefined' && navEl) {
      resizeObserver = new ResizeObserver(scheduleSync);
      resizeObserver.observe(navEl);
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      delete document.body.dataset.settingsDrawerOpen;
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('keydown', onKeyDown);
      if (resizeObserver) resizeObserver.disconnect();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const providerIds = Array.isArray(user.providerIds) ? user.providerIds : [];
  const hasGoogleProvider = providerIds.includes('google.com');
  const hasPasswordProvider =
    providerIds.includes('password') || (!user.isGuest && !hasGoogleProvider);
  const isGoogleOnly = !user.isGuest && hasGoogleProvider && !providerIds.includes('password');

  const hasUnsavedProfile =
    displayName.trim() !== (user.displayName || '').trim() ||
    draftPhotoURL !== (user.photoURL || null) ||
    draftPreset !== (user.avatarPreset || null) ||
    draftResetToProvider;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await compressImageToAvatarDataUrl(file);
      setDraftPhotoURL(dataUrl);
      setDraftPreset(null);
      setDraftResetToProvider(false);
      setShowUrlInput(false);
      toast.success('Photo ready — click Save profile to apply.');
    } catch (err) {
      toast.error(err.message || 'Could not process image.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (presetId) => {
    setDraftPreset(presetId);
    setDraftPhotoURL(null);
    setDraftResetToProvider(false);
    setShowUrlInput(false);
  };

  const handleApplyUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      toast.error('Enter a valid https:// image URL.');
      return;
    }
    if (trimmed.length > 500) {
      toast.error('Image URL must be 500 characters or fewer.');
      return;
    }
    setDraftPhotoURL(trimmed);
    setDraftPreset(null);
    setDraftResetToProvider(false);
    setShowUrlInput(false);
    setCustomUrlInput('');
  };

  const handleClearAvatar = () => {
    setDraftPhotoURL(null);
    setDraftPreset(null);
    setDraftResetToProvider(false);
  };

  const handleRestoreGooglePhoto = () => {
    setDraftPhotoURL(user.providerPhotoURL || null);
    setDraftPreset(null);
    setDraftResetToProvider(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Please enter a display name.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateAccountProfile({
        displayName: displayName.trim(),
        photoURL: draftPhotoURL,
        avatarPreset: draftPreset,
        resetToProviderPhoto: draftResetToProvider,
      });
      setDraftResetToProvider(false);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.message || 'Could not save profile changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      if (isGoogleOnly) {
        await setPasswordForOAuthUser(newPassword);
        toast.success('ARCA password added to your account.');
      } else {
        if (!currentPassword) {
          toast.error('Please enter your current password.');
          setSavingPassword(false);
          return;
        }
        await changePassword(currentPassword, newPassword);
        toast.success('Password updated successfully.');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPw(false);
      setShowNewPw(false);
      setShowConfirmPw(false);
    } catch (err) {
      toast.error(err.message || 'Could not update password.', { duration: 6000 });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await resetPassword(user.email);
      setResetSent(true);
      toast.success(`Password reset link sent to ${user.email}.`);
    } catch (err) {
      toast.error(err.message || 'Failed to send password reset email.');
    } finally {
      setSendingReset(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordLongEnough = newPassword.length >= 6;

  const drawerContent = (
    <aside
      ref={drawerRef}
      data-testid="account-settings-drawer"
      aria-label="Account settings"
      style={{ top: '101px', bottom: '0px' }}
      className="fixed right-0 z-[18] flex w-full flex-col border-l border-white/[0.1] bg-[#0B0B0A]/[0.98] backdrop-blur-md md:w-[33.3333vw] md:min-w-[340px]"
    >
      {/* Top Hairline Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-5 py-4 shrink-0">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-zinc-100">
            Account Settings
          </h2>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {user.isGuest ? 'Guest session · Beta' : user.email}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          title="Close account settings"
          aria-label="Close account settings"
          className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Clean Underline Section Tabs */}
      <div className="border-b border-white/[0.08] px-5 shrink-0">
        <div
          role="tablist"
          aria-label="Account settings sections"
          className="flex items-center gap-6"
        >
          <button
            type="button"
            role="tab"
            aria-selected={section === 'profile'}
            onClick={() => setSection('profile')}
            className={`relative flex items-center gap-1.5 py-3 text-xs font-medium transition-colors cursor-pointer ${
              section === 'profile'
                ? 'text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            <User className="h-3.5 w-3.5" strokeWidth={1.6} />
            <span>Profile</span>
            {section === 'profile' && (
              <span className="absolute inset-x-0 bottom-0 h-[1.5px] bg-[#c8a24e]" />
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={section === 'security'}
            onClick={() => setSection('security')}
            className={`relative flex items-center gap-1.5 py-3 text-xs font-medium transition-colors cursor-pointer ${
              section === 'security'
                ? 'text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5" strokeWidth={1.6} />
            <span>Password</span>
            {section === 'security' && (
              <span className="absolute inset-x-0 bottom-0 h-[1.5px] bg-[#c8a24e]" />
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Inner Body (Tutorial & Log out integrated directly inside tab flow) */}
      <div className="flex-1 overflow-y-auto px-5 py-5 pb-12">
        {section === 'profile' ? (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar Live Preview Row */}
            <div className="flex items-center gap-4 border-b border-white/[0.07] pb-5">
              <UserAvatar
                photoURL={draftPhotoURL}
                avatarPreset={draftPreset}
                displayName={displayName || user.displayName}
                email={user.email}
                size="lg"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-semibold text-zinc-100">
                  {displayName.trim() || user.displayName || 'ARCA User'}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {user.email || 'Local guest profile'}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {user.isGuest ? (
                    <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      Guest · Beta
                    </span>
                  ) : hasGoogleProvider ? (
                    <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                      Google{hasPasswordProvider ? ' + Password' : ''}
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                      Email &amp; Password
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Picture Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Profile Picture
                </span>
                <button
                  type="button"
                  onClick={() => setShowUrlInput((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-[#E7B956] transition-colors cursor-pointer"
                >
                  <LinkIcon className="h-3 w-3" strokeWidth={1.5} />
                  <span>{showUrlInput ? 'Hide URL' : 'Use image URL'}</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
                data-testid="pfp-file-input"
              />

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-[#c8a24e] transition-colors hover:text-[#d8b464] cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>{uploadingPhoto ? 'Processing...' : 'Upload photo'}</span>
                </button>

                {(draftPhotoURL || draftPreset) && (
                  <button
                    type="button"
                    onClick={handleClearAvatar}
                    className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>Use initials</span>
                  </button>
                )}

                {user.providerPhotoURL && (draftPreset || draftPhotoURL !== user.providerPhotoURL) && (
                  <button
                    type="button"
                    onClick={handleRestoreGooglePhoto}
                    className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
                    <span>Google photo</span>
                  </button>
                )}
              </div>

              {showUrlInput && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="h-9 flex-1 rounded-lg border border-white/[0.1] bg-[#111110] px-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="h-9 rounded-lg border border-white/[0.12] bg-[#171715] px-3 text-xs font-medium text-zinc-200 hover:border-[#E7B956] hover:text-[#E7B956] cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              )}

              {/* Curated ARCA Avatar Presets */}
              <div className="pt-1">
                <p className="mb-2 text-[11px] text-zinc-500">Or choose an ARCA emblem</p>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = draftPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        data-avatar-preset={preset.id}
                        onClick={() => handleSelectPreset(preset.id)}
                        title={preset.label}
                        aria-label={`Select ${preset.label} avatar`}
                        aria-pressed={isSelected}
                        className={`relative aspect-square w-full overflow-hidden rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#E7B956] ring-2 ring-[#E7B956]/40 scale-[1.03]'
                            : 'border-white/[0.1] opacity-80 hover:opacity-100 hover:border-white/[0.25]'
                        }`}
                      >
                        {preset.render()}
                        {isSelected && (
                          <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#E7B956] text-[#090908]">
                            <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1.5 border-t border-white/[0.07] pt-5">
              <label
                htmlFor="arca-settings-display-name"
                className="block text-xs font-medium text-zinc-400"
              >
                Display name
              </label>
              <input
                id="arca-settings-display-name"
                type="text"
                maxLength={100}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name in ARCA"
                className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#111110] px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-zinc-500">
                Changes apply strictly inside ARCA without altering your Google account.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingProfile || !hasUnsavedProfile}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#272724] text-xs font-semibold text-[#c8a24e] transition-colors hover:bg-[#30302c] disabled:opacity-45 cursor-pointer"
            >
              <span>{savingProfile ? 'Saving...' : 'Save profile'}</span>
            </button>
          </form>
        ) : user.isGuest ? (
          /* Guest Security View */
          <div className="space-y-5">
            <div className="space-y-2 border-b border-white/[0.07] pb-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                Guest sessions don&apos;t use a password
              </h3>
              <p className="text-xs leading-relaxed text-zinc-400">
                You&apos;re currently browsing ARCA in beta guest mode. Guest sign-in will be retired after the beta period ends — create a permanent account to set a password and sync your budget across devices.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose?.();
                onRequestSignUp?.();
              }}
              className="inline-flex items-center gap-1.5 py-1 text-xs font-semibold text-[#c8a24e] transition-colors hover:underline cursor-pointer"
            >
              <span>Create permanent account</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          /* Authenticated Password Management View */
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-100">
                {isGoogleOnly ? 'Add an ARCA password' : 'Change password'}
              </h3>
              <p className="text-xs leading-relaxed text-zinc-500">
                {isGoogleOnly
                  ? 'You signed in with Google. Add a password to sign in with your email address too.'
                  : 'Confirm your current password, then choose a new password of at least 6 characters.'}
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {!isGoogleOnly && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="arca-current-password"
                    className="block text-xs font-medium text-zinc-400"
                  >
                    Current password
                  </label>
                  <div className="relative">
                    <input
                      id="arca-current-password"
                      type={showCurrentPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#111110] pl-3.5 pr-11 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw((v) => !v)}
                      aria-label={showCurrentPw ? 'Hide current password' : 'Show current password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-zinc-500 hover:text-zinc-200 focus:outline-none cursor-pointer"
                    >
                      {showCurrentPw ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="arca-new-password"
                  className="block text-xs font-medium text-zinc-400"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="arca-new-password"
                    type={showNewPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#111110] pl-3.5 pr-11 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-zinc-500 hover:text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    {showNewPw ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="arca-confirm-password"
                  className="block text-xs font-medium text-zinc-400"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="arca-confirm-password"
                    type={showConfirmPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    minLength={6}
                    className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#111110] pl-3.5 pr-11 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    aria-label={showConfirmPw ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-zinc-500 hover:text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    {showConfirmPw ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* Minimal inline validation indicators */}
              {(newPassword.length > 0 || confirmPassword.length > 0) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                  <span className={passwordLongEnough ? 'text-emerald-400' : 'text-zinc-500'}>
                    {passwordLongEnough ? '✓' : '·'} 6+ characters
                  </span>
                  <span
                    className={
                      confirmPassword.length === 0
                        ? 'text-zinc-500'
                        : passwordsMatch
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                    }
                  >
                    {passwordsMatch ? '✓' : '·'} Passwords match
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingPassword || !passwordLongEnough || !passwordsMatch}
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#272724] text-xs font-semibold text-[#c8a24e] transition-colors hover:bg-[#30302c] disabled:opacity-45 cursor-pointer"
              >
                <span>
                  {savingPassword
                    ? 'Updating...'
                    : isGoogleOnly
                      ? 'Set ARCA password'
                      : 'Update password'}
                </span>
              </button>
            </form>

            {/* Password Reset Email Fallback */}
            {user.email && (
              <div className="border-t border-white/[0.08] pt-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Forgot current password?
                </p>
                {resetSent ? (
                  <p className="text-xs leading-relaxed text-emerald-400">
                    Reset email sent to <span className="font-medium">{user.email}</span>. Check your inbox and spam folder.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={sendingReset}
                    className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-[#c8a24e] disabled:opacity-50 cursor-pointer"
                  >
                    <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>{sendingReset ? 'Sending link...' : `Send reset link to ${user.email}`}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Integrated Account Actions inside the tab flow (no separate detached box) */}
        {(onStartTutorial || onLogout) && (
          <div className="mt-6 divide-y divide-white/[0.06] border-t border-white/[0.08]">
            {onStartTutorial && (
              <button
                type="button"
                data-testid="settings-start-tutorial"
                onClick={onStartTutorial}
                className="flex w-full items-center justify-between py-3.5 text-left text-xs font-medium text-zinc-300 transition-colors hover:text-[#c8a24e] cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <HelpCircle className="h-3.5 w-3.5 text-zinc-500 shrink-0" strokeWidth={1.6} />
                  <span>Replay page tutorial</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" strokeWidth={1.5} />
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                data-testid="settings-logout-btn"
                onClick={onLogout}
                className="flex w-full items-center justify-between py-3.5 text-left text-xs font-medium text-rose-400 transition-colors hover:text-rose-300 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
                  <span>Log out</span>
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );

  if (typeof document !== 'undefined') {
    return createPortal(drawerContent, document.body);
  }
  return drawerContent;
}
