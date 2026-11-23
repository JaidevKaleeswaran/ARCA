import { doc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase.js';

export const QUOTA_LIMITS = {
  receipts: 5,
  voice: 5,
  assistant: 10,
};

/**
 * Returns the Monday of the current week at 00:00:00.000 UTC in ISO 8601 format
 */
export function getMondayOfCurrentWeekISO() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const currentMonday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + diffToMonday,
    0, 0, 0, 0
  ));
  return currentMonday.toISOString();
}

/**
 * Returns the upcoming Monday at 00:00:00.000 UTC in ISO 8601 format
 */
export function getNextMondayISO() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilNextMonday = ((8 - day) % 7) || 7;
  const nextMonday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilNextMonday,
    0, 0, 0, 0
  ));
  return nextMonday.toISOString();
}

/**
 * Calculates human-readable countdown to next Monday 00:00 UTC (e.g. "in 2d 6h")
 */
export function getNextMondayCountdown() {
  const now = new Date();
  const nextMonday = new Date(getNextMondayISO());
  const diffMs = Math.max(0, nextMonday.getTime() - now.getTime());

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) {
    return `in ${days}d ${hours}h`;
  }
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `in ${hours}h ${minutes}m`;
}

/**
 * Normalizes quota state, resetting counters if weekStartDate is not the current week's Monday
 */
export function normalizeQuotaState(quotaState = {}) {
  const currentMondayISO = getMondayOfCurrentWeekISO();
  if (!quotaState || quotaState.weekStartDate !== currentMondayISO) {
    return {
      weekStartDate: currentMondayISO,
      receiptsUsed: 0,
      voiceUsed: 0,
      assistantUsed: 0,
    };
  }

  return {
    weekStartDate: currentMondayISO,
    receiptsUsed: Math.max(0, Number(quotaState.receiptsUsed) || 0),
    voiceUsed: Math.max(0, Number(quotaState.voiceUsed) || 0),
    assistantUsed: Math.max(0, Number(quotaState.assistantUsed) || 0),
  };
}

/**
 * Checks feature quota availability and optionally executes an atomic dot-notation Firestore increment.
 * Subscriptions are disabled — all users are permanently capped at QUOTA_LIMITS per week.
 *
 * @param {string} uid - User ID
 * @param {'receipts' | 'voice' | 'assistant'} feature - Feature being used
 * @param {Object} currentQuotaState - State from BudgetContext
 * @param {Object} options - Options ({ skipIncrement: boolean })
 * @returns {Promise<{ allowed: boolean, reason?: string, limit: number, used: number, resetCountdown: string }>}
 */
export async function checkAndIncrementQuota(uid, feature, currentQuotaState = {}, { skipIncrement = false } = {}) {
  const normalized = normalizeQuotaState(currentQuotaState);
  const currentMondayISO = normalized.weekStartDate;
  const isStale = !currentQuotaState || currentQuotaState.weekStartDate !== currentMondayISO;
  const limit = QUOTA_LIMITS[feature] ?? 10;
  const fieldKey = `${feature}Used`;
  const used = normalized[fieldKey] || 0;
  const resetCountdown = getNextMondayCountdown();

  if (used >= limit) {
    return {
      allowed: false,
      reason: 'QUOTA_EXHAUSTED',
      feature,
      limit,
      used,
      resetCountdown,
    };
  }

  if (!skipIncrement) {
    // Atomically increment quota counter in Cloud Firestore if authenticated
    if (db && uid && uid !== 'usr_arca_guest' && !String(uid).startsWith('guest_')) {
      try {
        const budgetDocRef = doc(db, 'users', uid, 'budgetData', 'main');
        if (isStale) {
          // If entering a new week, reset all counters and initialize the current feature to 1
          const resetUsage = {
            weekStartDate: currentMondayISO,
            receiptsUsed: feature === 'receipts' ? 1 : 0,
            voiceUsed: feature === 'voice' ? 1 : 0,
            assistantUsed: feature === 'assistant' ? 1 : 0,
          };
          try {
            await updateDoc(budgetDocRef, { quotaUsage: resetUsage });
          } catch {
            await setDoc(budgetDocRef, { quotaUsage: resetUsage }, { merge: true });
          }
        } else {
          try {
            await updateDoc(budgetDocRef, {
              [`quotaUsage.${fieldKey}`]: increment(1),
              'quotaUsage.weekStartDate': currentMondayISO,
            });
          } catch {
            await setDoc(budgetDocRef, {
              quotaUsage: {
                weekStartDate: currentMondayISO,
                receiptsUsed: feature === 'receipts' ? 1 : 0,
                voiceUsed: feature === 'voice' ? 1 : 0,
                assistantUsed: feature === 'assistant' ? 1 : 0,
              },
            }, { merge: true });
          }
        }
      } catch (err) {
        console.warn('[quotaManager] Atomic Firestore quota increment failed:', err.message);
      }
    }

    return {
      allowed: true,
      feature,
      limit,
      used: used + 1,
      resetCountdown,
    };
  }

  return {
    allowed: true,
    feature,
    limit,
    used,
    resetCountdown,
  };
}
