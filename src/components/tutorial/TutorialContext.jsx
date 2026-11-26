import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { TUTORIAL_STEPS } from './tutorialSteps';

const TutorialContext = createContext(null);

const ALL_TAB_IDS = Object.keys(TUTORIAL_STEPS);

export function TutorialProvider({ children }) {
  const { user } = useAuth();
  const [activeTabId, setActiveTabId] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tutorialLoaded, setTutorialLoaded] = useState(false);
  const [dismissedAll, setDismissedAll] = useState(false);
  const [seenTabs, setSeenTabs] = useState({});

  const getTabStorageKey = useCallback((tabId, targetUser = user) => {
    if (!targetUser) return null;
    if (targetUser.isGuest) {
      return `arca_tutorial_${tabId}_guest`;
    }
    return `arca_tutorial_${tabId}_${targetUser.uid}`;
  }, [user]);

  const getDismissedStorageKey = useCallback((targetUser = user) => {
    if (!targetUser) return null;
    if (targetUser.isGuest) {
      return 'arca_tutorial_dismissed_guest';
    }
    return `arca_tutorial_dismissed_${targetUser.uid}`;
  }, [user]);

  const readLocalState = useCallback((targetUser) => {
    const localSeen = {};
    let localDismissed = false;
    try {
      const dismissedKey = getDismissedStorageKey(targetUser);
      if (dismissedKey && localStorage.getItem(dismissedKey) === 'true') {
        localDismissed = true;
      }
      for (const tabId of ALL_TAB_IDS) {
        const key = getTabStorageKey(tabId, targetUser);
        if (key && localStorage.getItem(key) === 'true') {
          localSeen[tabId] = true;
        }
      }
    } catch {
      // Ignore storage errors (private browsing / restricted storage)
    }
    return { localDismissed, localSeen };
  }, [getDismissedStorageKey, getTabStorageKey]);

  // Load tutorial completion state from localStorage + Firestore (for signed-in users)
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setActiveTabId(null);
      setCurrentStepIndex(0);
      setDismissedAll(false);
      setSeenTabs({});
      setTutorialLoaded(false);
      return;
    }

    const { localDismissed, localSeen } = readLocalState(user);

    if (user.isGuest || !db || !user.uid) {
      setDismissedAll(localDismissed);
      setSeenTabs(localSeen);
      setTutorialLoaded(true);
      return;
    }

    setTutorialLoaded(false);

    (async () => {
      let remoteDismissed = false;
      let remoteSeen = {};
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const prefs = snap.data()?.preferences || {};
          remoteDismissed = prefs.tutorialDismissedAll === true;
          if (prefs.tutorialSeenTabs && typeof prefs.tutorialSeenTabs === 'object') {
            remoteSeen = prefs.tutorialSeenTabs;
          }
        }
      } catch (err) {
        console.warn('Could not load tutorial preferences from Firestore:', err);
      }

      if (cancelled) return;

      const mergedDismissed = localDismissed || remoteDismissed;
      const mergedSeen = { ...remoteSeen, ...localSeen };

      // Mirror merged state into localStorage for instant checks
      try {
        const dismissedKey = getDismissedStorageKey(user);
        if (mergedDismissed && dismissedKey) {
          localStorage.setItem(dismissedKey, 'true');
        }
        for (const [tabId, seen] of Object.entries(mergedSeen)) {
          if (seen) {
            const key = getTabStorageKey(tabId, user);
            if (key) localStorage.setItem(key, 'true');
          }
        }
      } catch {
        // Ignore storage errors
      }

      setDismissedAll(mergedDismissed);
      setSeenTabs(mergedSeen);
      setTutorialLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, readLocalState, getDismissedStorageKey, getTabStorageKey]);

  const persistToFirestore = useCallback((nextDismissed, nextSeenTabs) => {
    if (!user || user.isGuest || !db || !user.uid) return;
    setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        preferences: {
          tutorialDismissedAll: nextDismissed,
          tutorialSeenTabs: nextSeenTabs,
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch((err) => {
      console.warn('Could not persist tutorial preferences to Firestore:', err);
    });
  }, [user]);

  const hasSeenTab = useCallback((tabId) => {
    if (!user) return true; // Don't show if not logged in
    if (dismissedAll) return true;
    if (seenTabs[tabId]) return true;

    const key = getTabStorageKey(tabId);
    if (!key) return true;
    try {
      const dismissedKey = getDismissedStorageKey();
      if (dismissedKey && localStorage.getItem(dismissedKey) === 'true') {
        return true;
      }
      return localStorage.getItem(key) === 'true';
    } catch {
      return false;
    }
  }, [user, dismissedAll, seenTabs, getTabStorageKey, getDismissedStorageKey]);

  const markTabSeen = useCallback((tabId) => {
    if (!user) return;
    const key = getTabStorageKey(tabId);
    try {
      if (key) localStorage.setItem(key, 'true');
    } catch (e) {
      console.warn('Could not save tutorial state', e);
    }
    setSeenTabs((prev) => {
      const next = { ...prev, [tabId]: true };
      persistToFirestore(dismissedAll, next);
      return next;
    });
  }, [user, getTabStorageKey, dismissedAll, persistToFirestore]);

  const markAllTutorialsDone = useCallback(() => {
    if (!user) return;
    const allSeen = {};
    for (const tabId of ALL_TAB_IDS) {
      allSeen[tabId] = true;
    }
    try {
      const dismissedKey = getDismissedStorageKey();
      if (dismissedKey) localStorage.setItem(dismissedKey, 'true');
      for (const tabId of ALL_TAB_IDS) {
        const key = getTabStorageKey(tabId);
        if (key) localStorage.setItem(key, 'true');
      }
    } catch (e) {
      console.warn('Could not save tutorial dismissed state', e);
    }
    setDismissedAll(true);
    setSeenTabs(allSeen);
    persistToFirestore(true, allSeen);
  }, [user, getDismissedStorageKey, getTabStorageKey, persistToFirestore]);

  const startTutorial = useCallback((tabId, force = false) => {
    if (!tabId || !TUTORIAL_STEPS[tabId]) {
      setActiveTabId(null);
      setCurrentStepIndex(0);
      return;
    }

    // Wait until Firestore tutorial preferences finish loading before auto-starting
    if (!force && !tutorialLoaded) {
      return;
    }

    // If tutorial is already running on this tab and not forced, keep it running
    if (!force && activeTabId === tabId) {
      return;
    }

    // If user already dismissed tutorials or saw this tab and not forced, don't auto-start
    if (!force && (dismissedAll || hasSeenTab(tabId))) {
      if (activeTabId && activeTabId !== tabId) {
        setActiveTabId(null);
        setCurrentStepIndex(0);
      }
      return;
    }

    setActiveTabId(tabId);
    setCurrentStepIndex(0);
  }, [tutorialLoaded, activeTabId, dismissedAll, hasSeenTab]);

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
    markAllTutorialsDone();
    setActiveTabId(null);
    setCurrentStepIndex(0);
  }, [markAllTutorialsDone]);

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
