import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import TabNavigation from './components/layout/TabNavigation';
import HomeTab from './components/home/HomeTab';
import SummaryTab from './components/summary/SummaryTab';
import TransactionsTab from './components/transactions/TransactionsTab';
import AIAssistantTab from './components/assistant/AIAssistantTab';
import MarketTrackerTab from './components/markets/MarketTrackerTab';
import LoginPage from './components/auth/LoginPage';
import VerifyEmailPage from './components/auth/VerifyEmailPage';
import { useCycleCheck } from './hooks/useCycleCheck';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { useAuth } from './contexts/AuthContext';
import { useBudget } from './contexts/BudgetContext';
import { LogOut, HelpCircle, ExternalLink } from 'lucide-react';
import Logo from './components/ui/Logo';
import { env } from './config/env';
import { TutorialProvider, useTutorial } from './components/tutorial/TutorialContext';
import TutorialOverlay from './components/tutorial/TutorialOverlay';

function MainApp() {
  useCycleCheck();
  useFirebaseSync();
  const { user, logout } = useAuth();
  const { isSubscribed, openProModal } = useBudget();
  const { startTutorial } = useTutorial();
  const [activeTab, setActiveTab] = useState('home');

  // Trigger per-tab tutorial whenever active tab changes (or on initial login)
  useEffect(() => {
    if (user && (user.emailVerified || user.isGuest)) {
      const timer = setTimeout(() => {
        startTutorial(activeTab);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [user, activeTab, startTutorial]);

  return (
    <>
      <TutorialOverlay />

      {/* ── All page content sits above the Beams ── */}
      <div style={{ position: 'relative', zIndex: 2 }} className="min-h-screen text-text font-sans selection:bg-accent selection:text-primary">
        {!user ? (
          <LoginPage />
        ) : !user.emailVerified && !user.isGuest ? (
          <VerifyEmailPage />
        ) : (
          <>
            <header className="py-3 px-4 sm:px-6 border-b border-border/60 flex items-center justify-between max-w-6xl mx-auto backdrop-blur-md bg-primary/80">
              <div className="flex items-center space-x-3 shrink-0">
                <Logo size="md" />
                <a
                  href={env.onboardingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-accent font-medium px-2 py-1 rounded-md hover:bg-card-hover transition-colors"
                  title="View Onboarding Website"
                >
                  <span>Onboarding Site</span>
                  <ExternalLink size={11} className="text-accent" />
                </a>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2 bg-card/80 border border-border px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs backdrop-blur-sm min-w-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full shrink-0" />
                  ) : (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0">
                      {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="font-medium text-text truncate max-w-[110px] sm:max-w-none">{user.displayName || user.email}</span>
                  {user.isGuest && (
                    <span className="text-[9px] sm:text-[10px] bg-card-hover text-zinc-400 px-1.5 py-0.2 rounded shrink-0">Guest</span>
                  )}
                </div>

                {isSubscribed ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent border border-accent/40 px-2.5 py-1 rounded-full flex items-center shadow-sm shrink-0">
                    PRO
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => openProModal({ reason: 'UPGRADE' })}
                    className="text-[10px] font-bold uppercase tracking-wider bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 px-2.5 py-1 rounded-full transition-colors flex items-center shrink-0 cursor-pointer"
                    title="Upgrade to ARCA Pro"
                  >
                    Upgrade
                  </button>
                )}

                <button
                  type="button"
                  onClick={logout}
                  title="Log Out"
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 shrink-0 cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </header>

            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="max-w-6xl mx-auto p-3 sm:p-6 lg:p-8">
              <div className="animate-in fade-in duration-300">
                {activeTab === 'home' && <HomeTab onNavigateToMarkets={() => setActiveTab('markets')} />}
                {activeTab === 'assistant' && <AIAssistantTab />}
                {activeTab === 'markets' && <MarketTrackerTab />}
                {activeTab === 'summary' && <SummaryTab onNavigateToMarkets={() => setActiveTab('markets')} />}
                {activeTab === 'transactions' && <TransactionsTab />}
              </div>
            </main>

            {/* Floating Tutorial quick launcher strictly anchored in the corner, always discoverable regardless of scroll depth */}
            <button
              type="button"
              data-tutorial="corner-tutorial-launcher"
              onClick={() => startTutorial(activeTab, true)}
              title="Start interactive tutorial for this page"
              className="fixed bottom-6 right-6 z-40 bg-[#1e1c18]/95 hover:bg-[#2b2721] border border-accent/40 hover:border-accent text-accent font-semibold text-xs px-3.5 py-2 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 backdrop-blur-md cursor-pointer group"
            >
              <HelpCircle size={16} className="text-accent group-hover:rotate-12 transition-transform shrink-0" />
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
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1b1b18',
            color: '#f5f4ef',
            border: '1px solid #2c2a24',
          },
          success: {
            iconTheme: {
              primary: '#e7b956',
              secondary: '#1b1b18',
            },
          },
        }}
      />
      <MainApp />
    </TutorialProvider>
  );
}
