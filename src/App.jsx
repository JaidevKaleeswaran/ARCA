import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import TabNavigation from './components/layout/TabNavigation';
import HomeTab from './components/home/HomeTab';
import SummaryTab from './components/summary/SummaryTab';
import TransactionsTab from './components/transactions/TransactionsTab';
import AIAssistantTab from './components/assistant/AIAssistantTab';
import MarketTrackerTab from './components/markets/MarketTrackerTab';
import LoginPage from './components/auth/LoginPage';
import VerifyEmailPage from './components/auth/VerifyEmailPage';
import OnboardingShell from './components/onboarding/OnboardingShell';
import { useCycleCheck } from './hooks/useCycleCheck';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { useAuth } from './contexts/AuthContext';
import { LogOut, HelpCircle, Settings, Plus } from 'lucide-react';
import Logo from './components/ui/Logo';
import UserAvatar from './components/ui/UserAvatar';
import LeavingSoonBadge from './components/auth/LeavingSoonBadge';
import AccountSettingsDrawer from './components/auth/AccountSettingsDrawer';
import { TutorialProvider, useTutorial } from './components/tutorial/TutorialContext';
import TutorialOverlay from './components/tutorial/TutorialOverlay';

const ONBOARDING_PATHS = ['/', '/why-arca', '/about', '/privacy', '/terms'];

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  if (pathname.startsWith('/app')) return '/app';
  if (ONBOARDING_PATHS.includes(pathname)) return pathname;
  return '/';
}

function MainApp() {
  useCycleCheck();
  useFirebaseSync();
  const { user, logout } = useAuth();
  const { startTutorial } = useTutorial();
  const [activeTab, setActiveTab] = useState('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferSignUp, setPreferSignUp] = useState(false);
  const [addExpenseTrigger, setAddExpenseTrigger] = useState(0);
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return normalizePath(window.location.pathname);
    }
    return '/';
  });

  const isAppRoute = currentPath === '/app';

  const navigate = useCallback((path) => {
    const normalized = normalizePath(path);
    setCurrentPath(normalized);
    if (typeof window !== 'undefined' && window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // On desktop (>= md), Financial is unified inside Markets — normalize tab on resize up
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const handleResize = (e) => {
      if (e.matches) {
        setActiveTab((prev) => (prev === 'financial' ? 'markets' : prev));
      }
    };
    mq.addEventListener('change', handleResize);
    return () => mq.removeEventListener('change', handleResize);
  }, []);

  useEffect(() => {
    if (isAppRoute && user && (user.emailVerified || user.isGuest)) {
      const timer = setTimeout(() => {
        startTutorial(activeTab);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isAppRoute, user, activeTab, startTutorial]);

  if (!isAppRoute) {
    return (
      <OnboardingShell
        currentPath={currentPath}
        navigate={navigate}
        onOpenApp={() => navigate('/app')}
      />
    );
  }

  return (
    <>
      <TutorialOverlay />

      <div className="min-h-screen bg-[#090908] text-zinc-100 font-sans antialiased selection:bg-[#E7B956] selection:text-[#090908]">
        {!user ? (
          <LoginPage
            onBackToHome={() => navigate('/')}
            initialSignUp={preferSignUp}
          />
        ) : !user.emailVerified && !user.isGuest ? (
          <VerifyEmailPage onBackToHome={() => navigate('/')} />
        ) : (
          <>
            <header className="relative z-30 border-b border-white/[0.06] bg-[#090908]">
              <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  title="Back to ARCA overview"
                  aria-label="Back to ARCA overview"
                  className="inline-flex items-center rounded-md focus:outline-none hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                >
                  <Logo size="sm" />
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-zinc-400 min-w-0">
                    <UserAvatar
                      photoURL={user.photoURL}
                      avatarPreset={user.avatarPreset}
                      displayName={user.displayName}
                      email={user.email}
                      size="xs"
                    />
                    <span className="truncate max-w-[68px] sm:max-w-none text-zinc-300">
                      {user.displayName || user.email}
                    </span>
                    {user.isGuest && (
                      <>
                        <span className="hidden sm:inline-flex rounded border border-white/[0.1] px-1.5 py-0.2 text-[10px] text-zinc-500 shrink-0">
                          Guest
                        </span>
                        <LeavingSoonBadge placement="bottom" />
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    data-testid="account-settings-trigger"
                    onClick={() => setIsSettingsOpen((prev) => !prev)}
                    title="Account settings"
                    aria-label="Account settings"
                    aria-expanded={isSettingsOpen}
                    className={`rounded-md p-1.5 transition-colors shrink-0 cursor-pointer ${
                      isSettingsOpen
                        ? 'bg-[#E7B956]/15 text-[#E7B956]'
                        : 'text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-100'
                    }`}
                  >
                    <Settings className="h-4 w-4" strokeWidth={1.5} />
                  </button>

                  <span className="hidden md:block h-3.5 w-px bg-white/[0.1]" aria-hidden="true" />

                  <button
                    type="button"
                    onClick={async () => {
                      setIsSettingsOpen(false);
                      setPreferSignUp(false);
                      await logout();
                      setActiveTab('home');
                    }}
                    title="Sign out"
                    aria-label="Sign out"
                    className="hidden md:inline-flex rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-rose-400 shrink-0 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </header>

            {isSettingsOpen && (
              <AccountSettingsDrawer
                key={user?.uid}
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onStartTutorial={() => {
                  setIsSettingsOpen(false);
                  startTutorial(activeTab, true);
                }}
                onLogout={async () => {
                  setIsSettingsOpen(false);
                  setPreferSignUp(false);
                  await logout();
                  setActiveTab('home');
                }}
                onRequestSignUp={async () => {
                  setIsSettingsOpen(false);
                  setPreferSignUp(true);
                  await logout();
                  setActiveTab('home');
                }}
              />
            )}

            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-5 pb-36 sm:pt-7 md:pb-12">
              <div className="animate-step-enter">
                {activeTab === 'home' && (
                  <HomeTab
                    onNavigateToMarkets={() => setActiveTab('markets')}
                    onNavigateToTransactions={() => setActiveTab('transactions')}
                  />
                )}
                {activeTab === 'assistant' && <AIAssistantTab />}
                {(activeTab === 'markets' || activeTab === 'financial') && (
                  <MarketTrackerTab
                    mobileView={activeTab === 'financial' ? 'financial' : 'markets'}
                  />
                )}
                {activeTab === 'summary' && <SummaryTab onNavigateToMarkets={() => setActiveTab('markets')} />}
                {activeTab === 'transactions' && (
                  <TransactionsTab addExpenseTrigger={addExpenseTrigger} />
                )}
              </div>
            </main>

            {/* Mobile floating Log Transaction pill right above the bottom tab bar */}
            <button
              type="button"
              data-mobile-fab="log-transaction"
              onClick={() => {
                setIsSettingsOpen(false);
                setActiveTab('transactions');
                setAddExpenseTrigger((n) => n + 1);
              }}
              title="Log a new expense"
              aria-label="Log transaction"
              className="md:hidden fixed right-3.5 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.3rem)] z-30 inline-flex h-10 items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#161614] px-4 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.65)] transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#E7B956] shrink-0" strokeWidth={2.25} />
              <span>Transaction</span>
            </button>

            {/* Desktop corner tutorial trigger */}
            <button
              type="button"
              data-tutorial="corner-tutorial-launcher"
              onClick={() => startTutorial(activeTab, true)}
              title="Start interactive tutorial for this page"
              className="hidden md:inline-flex fixed bottom-5 right-5 z-40 h-8 items-center gap-1.5 rounded-full border border-[#E7B956]/40 bg-[#111110]/95 px-3 text-xs font-medium text-[#E7B956] backdrop-blur-md transition-colors hover:border-[#E7B956] hover:bg-[#171715] cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              <span>Tutorial ?</span>
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <TutorialProvider>
      <Toaster
        position="top-center"
        containerStyle={{ top: 14 }}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#111110',
            color: '#f4f4f0',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '9999px',
            padding: '8px 16px',
            fontSize: '12px',
          },
          success: {
            iconTheme: {
              primary: '#e7b956',
              secondary: '#090908',
            },
          },
        }}
      />
      <MainApp />
    </TutorialProvider>
  );
}
