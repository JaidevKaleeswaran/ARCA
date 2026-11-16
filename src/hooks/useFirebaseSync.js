import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useBudget } from '../contexts/BudgetContext';

export function useFirebaseSync() {
  const { user } = useAuth();
  const budgetState = useBudget();
  const {
    transactions,
    categories,
    incomeSources,
    investments,
    cycleStartDate,
    cycleFrequency,
    voiceLogs,
    chatMessages,
    quotaUsage,
    isSubscribed,
    subscriptionPlan,
    dispatch
  } = budgetState;

  const [isHydrated, setIsHydrated] = useState(!user || user.isGuest || !db);
  const isLocalUpdateRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  // Keep a ref to the latest state payload to prevent stale closure issues
  const stateRef = useRef();
  stateRef.current = {
    transactions,
    categories,
    incomeSources,
    investments: investments || [],
    cycleStartDate,
    cycleFrequency,
    voiceLogs: voiceLogs || [],
    chatMessages: chatMessages || [],
    quotaUsage: quotaUsage || null,
    isSubscribed: Boolean(isSubscribed),
    subscriptionPlan: subscriptionPlan || (isSubscribed ? 'pro' : 'free'),
    updatedAt: new Date().toISOString(),
  };

  // Store active user UID and sync to user-scoped localStorage
  useEffect(() => {
    if (user && user.uid && !user.isGuest) {
      try {
        localStorage.setItem('arca_last_active_user', user.uid);
        const userStorageKey = `arca_budget_state_${user.uid}`;
        localStorage.setItem(userStorageKey, JSON.stringify(stateRef.current));
      } catch (e) {
        console.warn('Could not cache user budget state to localStorage:', e);
      }
    }
  }, [user?.uid, transactions, categories, incomeSources, investments, cycleStartDate, cycleFrequency, voiceLogs, chatMessages, quotaUsage, isSubscribed, subscriptionPlan]);

  // 1. Realtime Firestore listener: Sync data from Firestore to local state across all devices
  useEffect(() => {
    if (!user || user.isGuest || !db) {
      return;
    }

    let isMounted = true;
    const docRef = doc(db, 'users', user.uid, 'budgetData', 'main');

    // Subscribe to realtime updates from Firestore
    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (!isMounted) return;

        // Ignore local pending writes to avoid feedback echo loops
        if (docSnap.metadata?.hasPendingWrites) {
          setIsHydrated(true);
          return;
        }

        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          // If update came from server (another device or remote update), hydrate local state
          if (!isLocalUpdateRef.current) {
            dispatch({ type: 'SET_FULL_STATE', payload: remoteData });
          }
        } else {
          // If no document exists in Firestore yet for this logged in user, initialize Firestore doc from current state
          try {
            isLocalUpdateRef.current = true;
            await setDoc(docRef, stateRef.current, { merge: true });
            console.log("Initialized new Firestore budget document for user:", user.uid);
          } catch (e) {
            console.error("Error creating initial Firestore budget document:", e);
          }
        }
        setIsHydrated(true);
        isLocalUpdateRef.current = false;
      },
      (error) => {
        console.error("Error listening to Firestore budget data:", error);
        if (isMounted) setIsHydrated(true);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user, dispatch]);

  // Reset state on signout
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [user, dispatch]);

  // Helper to perform the save to Firestore using the freshest stateRef
  const performSaveRef = useRef();
  performSaveRef.current = async () => {
    if (!user || !user.uid || user.isGuest || !db) return;
    try {
      isLocalUpdateRef.current = true;
      const docRef = doc(db, 'users', user.uid, 'budgetData', 'main');
      await setDoc(docRef, stateRef.current, { merge: true });
      console.log("Budget data synced to Firestore for user:", user.uid);
    } catch (error) {
      console.error("Error syncing budget data to Firestore:", error);
    }
  };

  // Mount/unmount & window beforeunload handler: flush pending save only on true unmount or page exit
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        performSaveRef.current?.();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Flush any pending in-flight debounce timer on component unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        performSaveRef.current?.();
      }
    };
  }, []);

  // 2. Sync local changes back to Firestore (debounced save 1000ms using latest stateRef)
  useEffect(() => {
    if (!isHydrated || !user || user.isGuest || !db) return;

    // Clear any previous debounce timer on new state change
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 1000ms of user inactivity
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      performSaveRef.current?.();
    }, 1000);

    // Cancel timer on next state change so writes are truly debounced
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [
    transactions,
    categories,
    incomeSources,
    investments,
    cycleStartDate,
    cycleFrequency,
    voiceLogs,
    chatMessages,
    quotaUsage,
    isSubscribed,
    subscriptionPlan,
    user?.uid,
    isHydrated
  ]);
}
