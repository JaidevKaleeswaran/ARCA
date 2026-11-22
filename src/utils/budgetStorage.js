import { normalizeQuotaState } from './quotaManager.js';

export const STORAGE_KEY = 'arca_budget_state';
export const LEGACY_STORAGE_KEY = 'stacked_budget_state';
export const LAST_ACTIVE_USER_KEY = 'arca_last_active_user';
export const USER_SESSION_KEY = 'arca_user_session';
export const LEGACY_USER_SESSION_KEY = 'stacked_user_session';

/**
 * Normalizes a user object into a storage session key ('guest', uid, or null).
 */
export function getSessionKey(user) {
  if (!user) return null;
  if (user.isGuest) return 'guest';
  return user.uid || null;
}

/**
 * Returns the user-scoped localStorage key for budget state.
 */
export function getStorageKey(uid) {
  if (!uid || uid === 'guest' || uid === 'usr_arca_guest' || String(uid).startsWith('guest_')) {
    return 'arca_budget_state_guest';
  }
  return `arca_budget_state_${uid}`;
}

/**
 * Strips internal React state metadata before writing to localStorage.
 */
export function stripInternalState(state) {
  if (!state || typeof state !== 'object') return state;
  const { _sessionKey, ...persistable } = state;
  return persistable;
}

/**
 * Safely converts an ISO string, Date, number, or Firestore Timestamp into epoch ms.
 */
export function getTimestampMs(value) {
  if (!value) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Builds a strict schema-compliant payload matching firestore.rules for users/{uid}/budgetData/main.
 */
export function buildFirestoreBudgetPayload(state, uid, { includeCreatedAt = false } = {}) {
  const safeState = state || {};
  const isSubscribed = Boolean(safeState.isSubscribed);

  const payload = {
    transactions: Array.isArray(safeState.transactions) ? safeState.transactions : [],
    categories: Array.isArray(safeState.categories) ? safeState.categories : [],
    incomeSources: Array.isArray(safeState.incomeSources) ? safeState.incomeSources : [],
    investments: Array.isArray(safeState.investments) ? safeState.investments : [],
    cycleStartDate: safeState.cycleStartDate ?? null,
    cycleFrequency: safeState.cycleFrequency || 'monthly',
    voiceLogs: Array.isArray(safeState.voiceLogs) ? safeState.voiceLogs : [],
    chatMessages: Array.isArray(safeState.chatMessages) ? safeState.chatMessages : [],
    quotaUsage: normalizeQuotaState(safeState.quotaUsage),
    isSubscribed,
    subscriptionPlan: safeState.subscriptionPlan || (isSubscribed ? 'pro' : 'free'),
    uid,
    userId: uid,
    updatedAt: safeState.updatedAt || new Date().toISOString(),
  };

  if (includeCreatedAt) {
    payload.createdAt = safeState.createdAt || new Date().toISOString();
  }

  return payload;
}
