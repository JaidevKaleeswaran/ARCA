import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import WhyPage from './pages/WhyPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

const VALID_PATHS = ['/', '/why-arca', '/about', '/privacy', '/terms'];

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      return VALID_PATHS.includes(pathname) ? pathname : '/';
    }
    return '/';
  });

  // Points to the main ARCA webapp
  const appUrl =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:5173'
      : import.meta.env.VITE_APP_URL || 'https://arcabudgeting.com';

  const navigate = (path) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      setCurrentPath(VALID_PATHS.includes(pathname) ? pathname : '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F7] text-zinc-950 antialiased">
      <Navbar currentPath={currentPath} navigate={navigate} appUrl={appUrl} />

      <main className="flex-1">
        {currentPath === '/' && <HomePage navigate={navigate} appUrl={appUrl} />}
        {currentPath === '/why-arca' && <WhyPage navigate={navigate} appUrl={appUrl} />}
        {currentPath === '/about' && <AboutPage navigate={navigate} appUrl={appUrl} />}
        {currentPath === '/privacy' && <PrivacyPage navigate={navigate} />}
        {currentPath === '/terms' && <TermsPage navigate={navigate} />}
      </main>

      <Footer navigate={navigate} appUrl={appUrl} />
    </div>
  );
}
