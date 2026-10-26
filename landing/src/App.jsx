import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import WhyPage from './pages/WhyPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const validPaths = ['/', '/why-arca', '/about', '/privacy', '/terms'];
      return validPaths.includes(pathname) ? pathname : '/';
    }
    return '/';
  });

  // App redirect URL: points to the main ARCA webapp
  const appUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:5173'
    : 'https://arca-budgeting.web.app';

  const navigate = (path) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      setCurrentPath(pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#161614] text-[#faf4e8]">
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
