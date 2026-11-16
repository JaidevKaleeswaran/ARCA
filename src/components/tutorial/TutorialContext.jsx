import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TUTORIAL_STEPS } from './tutorialSteps';

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
  const { user } = useAuth();
  const [activeTabId, setActiveTabId] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const getStorageKey = useCallback((tabId) => {
    if (!user) return null;
    if (user.isGuest) {
      return `arca_tutorial_${tabId}_guest`;
    }
    return `arca_tutorial_${tabId}_${user.uid}`;
  }, [user]);

  const hasSeenTab = useCallback((tabId) => {
    if (!user) return true; // Don't show if not logged in
    const key = getStorageKey(tabId);
    if (!key) return true;

    try {
      if (user.isGuest) {
        return sessionStorage.getItem(key) === 'true';
      } else {
        return localStorage.getItem(key) === 'true';
      }
    } catch {
      return false;
    }
  }, [user, getStorageKey]);

  const markTabSeen = useCallback((tabId) => {
    if (!user) return;
    const key = getStorageKey(tabId);
    if (!key) return;

    try {
      if (user.isGuest) {
        sessionStorage.setItem(key, 'true');
      } else {
        localStorage.setItem(key, 'true');
      }
    } catch (e) {
      console.warn('Could not save tutorial state', e);
    }
  }, [user, getStorageKey]);

  const startTutorial = useCallback((tabId, force = false) => {
    if (!tabId || !TUTORIAL_STEPS[tabId]) {
      setActiveTabId(null);
      setCurrentStepIndex(0);
      return;
    }

    // If tutorial is already running on this tab and not forced, keep it running
    if (!force && activeTabId === tabId) {
      return;
    }

    // If tab has already been seen and not forced, dismiss any tutorial from another tab
    if (!force && hasSeenTab(tabId)) {
      if (activeTabId && activeTabId !== tabId) {
        setActiveTabId(null);
        setCurrentStepIndex(0);
      }
      return;
    }

    setActiveTabId(tabId);
    setCurrentStepIndex(0);
  }, [activeTabId, hasSeenTab]);

  const endTutorial = useCallback((tabIdToMark) => {
    const tabToMark = tabIdToMark || activeTabId;
    if (tabToMark) {
      markTabSeen(tabToMark);
    }
    setActiveTabId(null);
    setCurrentStepIndex(0);
  }, [activeTabId, markTabSeen]);

  const nextStep = useCallback(() => {
    if (!activeTabId) return;
    const steps = TUTORIAL_STEPS[activeTabId] || [];
    if (currentStepIndex + 1 < steps.length) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      endTutorial();
    }
  }, [activeTabId, currentStepIndex, endTutorial]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const skipTutorial = useCallback(() => {
    endTutorial();
  }, [endTutorial]);

  // If user logs out, dismiss any active tutorial
  useEffect(() => {
    if (!user) {
      setActiveTabId(null);
      setCurrentStepIndex(0);
    }
  }, [user]);

  const currentSteps = activeTabId ? (TUTORIAL_STEPS[activeTabId] || []) : [];
  const currentStep = currentSteps[currentStepIndex] || null;

  const value = {
    activeTabId,
    currentStepIndex,
    currentStep,
    totalSteps: currentSteps.length,
    isTutorialActive: Boolean(activeTabId && currentStep),
    hasSeenTab,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
