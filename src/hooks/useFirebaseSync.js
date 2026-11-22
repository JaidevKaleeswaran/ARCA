import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useBudget } from '../contexts/BudgetContext';
import {
  buildFirestoreBudgetPayload,
  getTimestampMs,
} from '../utils/budgetStorage';

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
    updatedAt,
    _sessionKey,
    dispatch,
  } = budgetState;

  const [hydratedUid, setHydratedUid] = useState(null);
  const hydratedUidRef = useRef(null);
  const lastCloudSyncMsRef = useRef(0);
  const saveTimeoutRef = useRef(null);

  const userRef = useRef(user);
  userRef.current = user;

  // Keep a ref to the latest state snapshot to prevent stale closure writes
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
    updatedAt: updatedAt || null,
  };

  const activeUid = user && !user.isGuest ? user.uid : null;
  const isHydrated = Boolean(activeUid && db && hydratedUid === activeUid && _sessionKey === activeUid);

  // Helper to perform the save to Firestore using the freshest stateRef
  const performSaveRef = useRef();
  performSaveRef.current = async (targetUid = userRef.current?.uid, { includeCreatedAt = false } = {}) => {
    if (!targetUid || userRef.current?.isGuest || !db) return;
    try {
      const docRef = doc(db, 'users', targetUid, 'budgetData', 'main');
      const payload = buildFirestoreBudgetPayload(stateRef.current, targetUid, { includeCreatedAt });
      lastCloudSyncMsRef.current = Math.max(
        lastCloudSyncMsRef.current,
        getTimestampMs(payload.updatedAt)
      );
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      console.warn('[Firestore] Error syncing budget data:', error);
    }
  };

  // 1. Realtime Firestore listener: hydrate from cloud on login/rejoin and listen for remote updates
  useEffect(() => {
    if (!activeUid || !db || _sessionKey !== activeUid) {
      hydratedUidRef.current = null;
      lastCloudSyncMsRef.current = 0;
      return;
    }

    let isMounted = true;
    const docRef = doc(db, 'users', activeUid, 'budgetData', 'main');

    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (!isMounted) return;

        const isFirstHydration = hydratedUidRef.current !== activeUid;

        // Ignore local pending write echoes once initial hydration has completed
        if (!isFirstHydration && docSnap.metadata?.hasPendingWrites) {
          return;
        }

        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          const remoteTime = getTimestampMs(remoteData?.updatedAt);
          const localTime = getTimestampMs(stateRef.current?.updatedAt);
          const hasNoLocalSavedData = !stateRef.current?.updatedAt;

          if ((isFirstHydration && (remoteTime > localTime || hasNoLocalSavedData)) || (!isFirstHydration && remoteTime > localTime)) {
            lastCloudSyncMsRef.current = remoteTime;
            dispatch({
              type: 'LOAD_USER_STATE',
              payload: remoteData,
              meta: { sessionKey: activeUid },
            });
          } else if (isFirstHydration && localTime > remoteTime) {
            // Preserve unflushed local edits (e.g., offline edits or rapid tab close) and sync up to Firestore
            await performSaveRef.current?.(activeUid);
          } else if (isFirstHydration) {
            lastCloudSyncMsRef.current = Math.max(remoteTime, localTime);
          }

          hydratedUidRef.current = activeUid;
          setHydratedUid(activeUid);
        } else {
          const hasLocalSavedData = Boolean(stateRef.current?.updatedAt);

          // If offline cache reports missing doc without local data, wait for server confirmation before seeding
          if (docSnap.metadata?.fromCache && !hasLocalSavedData) {
            return;
          }

          await performSaveRef.current?.(activeUid, { includeCreatedAt: true });
          hydratedUidRef.current = activeUid;
          setHydratedUid(activeUid);
        }
      },
      (error) => {
        console.error('[Firestore] Error listening to budget data:', error);
        if (isMounted) {
          hydratedUidRef.current = activeUid;
          setHydratedUid(activeUid);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeUid, _sessionKey, dispatch]);

  // Flush any pending debounced write immediately when leaving tab/page or unmounting
  useEffect(() => {
    const flushPendingSave = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        performSaveRef.current?.();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSave();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', flushPendingSave);
    window.addEventListener('beforeunload', flushPendingSave);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', flushPendingSave);
      window.removeEventListener('beforeunload', flushPendingSave);
      flushPendingSave();
    };
  }, []);

  // 2. Debounced auto-save to Firestore whenever user-owned budget state mutates
  useEffect(() => {
    if (!isHydrated || !activeUid || hydratedUidRef.current !== activeUid) {
      return;
    }

    const currentUpdatedMs = getTimestampMs(updatedAt);
    if (!updatedAt || currentUpdatedMs <= lastCloudSyncMsRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      performSaveRef.current?.(activeUid);
    }, 600);

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
    updatedAt,
    activeUid,
    isHydrated,
  ]);
}
