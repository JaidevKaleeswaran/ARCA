import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import HomePage from './pages/HomePage';
import WhyPage from './pages/WhyPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

export default function OnboardingShell({ currentPath, navigate, onOpenApp }) {
  return (
    <div className="arca-onboarding min-h-screen flex flex-col bg-[#090908] text-zinc-100 antialiased selection:bg-[#E7B956] selection:text-[#090908]">
      <Navbar currentPath={currentPath} navigate={navigate} onOpenApp={onOpenApp} />

      <main className="flex-1">
        {currentPath === '/' && <HomePage navigate={navigate} onOpenApp={onOpenApp} />}
        {currentPath === '/why-arca' && <WhyPage navigate={navigate} onOpenApp={onOpenApp} />}
        {currentPath === '/about' && <AboutPage navigate={navigate} onOpenApp={onOpenApp} />}
        {currentPath === '/privacy' && <PrivacyPage navigate={navigate} />}
        {currentPath === '/terms' && <TermsPage navigate={navigate} />}
      </main>

      <Footer navigate={navigate} onOpenApp={onOpenApp} />
    </div>
  );
}
