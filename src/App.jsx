import React, { useState, useEffect } from 'react';
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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LogOut, HelpCircle } from 'lucide-react';
import Logo from './components/ui/Logo';
import { TutorialProvider, useTutorial } from './components/tutorial/TutorialContext';
import TutorialOverlay from './components/tutorial/TutorialOverlay';

function MainApp() {
  useCycleCheck();
  useFirebaseSync();
  const { user, logout } = useAuth();
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
            <header className="py-3 px-4 sm:px-6 border-b border-border/60 flex items-center justify-between max-w-6xl mx-auto backdrop-blur-md bg-[#161614]/40">
              <div className="flex items-center space-x-2 shrink-0">
                <Logo size="md" />
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
                    <span className="text-[9px] sm:text-[10px] bg-[#2b2924] text-zinc-400 px-1.5 py-0.2 rounded shrink-0">Guest</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => startTutorial(activeTab, true)}
                  title="Page Tutorial & Guide"
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors border border-transparent hover:border-accent/20 shrink-0"
                >
                  <HelpCircle size={16} />
                </button>

                <button
                  type="button"
                  onClick={logout}
                  title="Log Out"
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 shrink-0"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </header>

            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="max-w-6xl mx-auto p-3 sm:p-6 lg:p-8">
              <div className="animate-in fade-in duration-300">
                {activeTab === 'home' && <HomeTab />}
                {activeTab === 'assistant' && <AIAssistantTab />}
                {activeTab === 'markets' && <MarketTrackerTab />}
                {activeTab === 'summary' && <SummaryTab />}
                {activeTab === 'transactions' && <TransactionsTab />}
              </div>
            </main>
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
            background: '#22201d',
            color: '#faf4e8',
            border: '1px solid #38342e',
          },
          success: {
            iconTheme: {
              primary: '#e7b956',
              secondary: '#22201d',
            },
          },
        }}
      />
      <MainApp />
    </TutorialProvider>
  );
}
