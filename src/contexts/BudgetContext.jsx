import React, { createContext, useReducer, useContext, useEffect, useState } from 'react';
import { normalizeToMasterCycle, getCycleWindow, isWithinCycle } from '../utils/cycleUtils';
import { useAuth } from './AuthContext';
import { env } from '../config/env';
import { db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  LAST_ACTIVE_USER_KEY,
  USER_SESSION_KEY,
  LEGACY_USER_SESSION_KEY,
  getSessionKey,
  getStorageKey,
  stripInternalState,
} from '../utils/budgetStorage';
import {
  QUOTA_LIMITS,
  getMondayOfCurrentWeekISO,
  getNextMondayCountdown,
  normalizeQuotaState,
  checkAndIncrementQuota,
} from '../utils/quotaManager';
import StackedProModal from '../components/ui/StackedProModal';

export { getStorageKey };

// Default fallback state — no hardcoded initial categories so users start with a clean zero-based slate
const defaultState = {
  incomeSources: [],
  cycleStartDate: null, // ISO date string — anchor for pay-cycle window
  cycleFrequency: 'monthly', // The master cycle the budget operates on
  categories: [],
  transactions: [],
  investments: [], // User stock portfolio holdings
  voiceLogs: [],
  chatMessages: [],
  quotaUsage: {
    weekStartDate: getMondayOfCurrentWeekISO(),
    receiptsUsed: 0,
    voiceUsed: 0,
    assistantUsed: 0,
  },
  isSubscribed: false,
  subscriptionPlan: 'free',
  updatedAt: null,
  _sessionKey: null,
};

// Helper to eliminate duplicate categories by name & preserve transaction links
function sanitizeState(state) {
  if (!state || !Array.isArray(state.categories)) return state;

  const seenCategories = new Map();
  const idMap = new Map();
  const cleanedCategories = [];

  for (const cat of state.categories) {
    if (!cat || !cat.name) continue;
    const normName = cat.name.trim().toLowerCase();

    if (seenCategories.has(normName)) {
      const canonical = seenCategories.get(normName);
      idMap.set(cat.id, canonical.id);
      canonical.limit = Math.max(Number(canonical.limit) || 0, Number(cat.limit) || 0);
    } else {
      const cleanCat = { ...cat, name: cat.name.trim() };
      seenCategories.set(normName, cleanCat);
      cleanedCategories.push(cleanCat);
    }
  }

  let cleanedTransactions = state.transactions || [];
  if (idMap.size > 0 && Array.isArray(state.transactions)) {
    cleanedTransactions = state.transactions.map((tx) => {
      if (idMap.has(tx.categoryId)) {
        return { ...tx, categoryId: idMap.get(tx.categoryId) };
      }
      return tx;
    });
  }

  let cleanedMessages = state.chatMessages || [];
  if (Array.isArray(state.chatMessages)) {
    const seenMsgIds = new Set();
    let welcomeSeen = false;
    cleanedMessages = [];
    for (const msg of state.chatMessages) {
      if (!msg) continue;
      const isWelcome = msg.id === 'msg_welcome' || (msg.text && msg.text.includes("AI Financial Assistant"));
      if (isWelcome) {
        if (welcomeSeen) continue;
        welcomeSeen = true;
      } else if (msg.id) {
        if (seenMsgIds.has(msg.id)) continue;
        seenMsgIds.add(msg.id);
      }
      cleanedMessages.push(msg);
    }
  }

  return {
    ...state,
    categories: cleanedCategories,
    transactions: cleanedTransactions,
    investments: Array.isArray(state.investments) ? state.investments : [],
    chatMessages: cleanedMessages,
    quotaUsage: normalizeQuotaState(state?.quotaUsage),
    isSubscribed: Boolean(state?.isSubscribed),
    subscriptionPlan: state?.subscriptionPlan || 'free',
    updatedAt: state?.updatedAt || null,
  };
}

function readSavedStateForSession(sessionKey) {
  if (!sessionKey) return null;
  try {
    const storageKey = getStorageKey(sessionKey);
    let saved = localStorage.getItem(storageKey);

    // Fallback to legacy un-scoped storage only for guest sessions when no guest-scoped state exists yet
    if (!saved && sessionKey === 'guest') {
      const lastActive = localStorage.getItem(LAST_ACTIVE_USER_KEY);
      if (!lastActive || lastActive === 'guest') {
        saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      }
    }

    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load budget state from localStorage:', e);
  }
  return null;
}

// Initial state loaded from localStorage if an active user session is present
const getInitialState = () => {
  try {
    const savedSessionRaw = localStorage.getItem(USER_SESSION_KEY) || localStorage.getItem(LEGACY_USER_SESSION_KEY);
    if (savedSessionRaw) {
      const parsedSession = JSON.parse(savedSessionRaw);
      const sessionKey = getSessionKey(parsedSession);
      const parsed = readSavedStateForSession(sessionKey);
      if (parsed) {
        return sanitizeState({
          ...defaultState,
          ...parsed,
          categories: Array.isArray(parsed.categories) ? parsed.categories : defaultState.categories,
          _sessionKey: sessionKey,
        });
      }
      return sanitizeState({ ...defaultState, _sessionKey: sessionKey });
    }
  } catch (e) {
    console.warn('Failed to load budget state from localStorage:', e);
  }
  return sanitizeState({ ...defaultState, _sessionKey: null });
};

const BudgetContext = createContext();

function internalBudgetReducer(state, action) {
  switch (action.type) {
    case 'ADD_INCOME_SOURCE':
      return { ...state, incomeSources: [...state.incomeSources, action.payload] };
    case 'UPDATE_INCOME_SOURCE':
      return {
        ...state,
        incomeSources: state.incomeSources.map((source) =>
          source.id === action.payload.id ? { ...source, ...action.payload } : source
        ),
      };
    case 'DELETE_INCOME_SOURCE':
      return {
        ...state,
        incomeSources: state.incomeSources.filter((source) => source.id !== action.payload),
      };
    case 'SET_SALARY': {
      const salarySource = {
        id: action.payload.id || 'salary_source',
        name: action.payload.name || 'Primary Salary',
        amount: Number(action.payload.amount),
        frequency: action.payload.frequency || 'monthly',
        isBorrowed: false,
        isSalary: true,
      };

      const existingIndex = state.incomeSources.findIndex(
        (s) => s.isSalary || s.id === 'salary_source' || s.name?.toLowerCase() === 'primary salary' || s.name?.toLowerCase() === 'salary'
      );

      let updatedSources;
      if (existingIndex >= 0) {
        updatedSources = [...state.incomeSources];
        updatedSources[existingIndex] = { ...updatedSources[existingIndex], ...salarySource };
      } else {
        updatedSources = [salarySource, ...state.incomeSources];
      }

      return {
        ...state,
        incomeSources: updatedSources,
      };
    }
    case 'SET_CYCLE_CONFIG':
      return {
        ...state,
        cycleStartDate: action.payload.cycleStartDate !== undefined ? action.payload.cycleStartDate : state.cycleStartDate,
        cycleFrequency: action.payload.cycleFrequency !== undefined ? action.payload.cycleFrequency : state.cycleFrequency,
      };
    case 'ADD_CATEGORY':
      return sanitizeState({ ...state, categories: [...state.categories, action.payload] });
    case 'UPDATE_CATEGORY':
      return sanitizeState({
        ...state,
        categories: state.categories.map((cat) =>
          cat.id === action.payload.id ? { ...cat, ...action.payload } : cat
        ),
      });
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((cat) => cat.id !== action.payload),
      };
    case 'REPLACE_CATEGORIES':
      return sanitizeState({
        ...state,
        categories: action.payload,
      });
    case 'ADD_TRANSACTION': {
      const newTx = {
        receipt_image_url: null,
        line_items: null,
        source: 'manual',
        ...action.payload,
      };
      return { ...state, transactions: [newTx, ...state.transactions] };
    }
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id ? { ...tx, ...action.payload } : tx
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((tx) => tx.id !== action.payload),
      };
    case 'ADD_VOICE_LOG':
      return {
        ...state,
        voiceLogs: [action.payload, ...(state.voiceLogs || [])],
      };
    case 'CLEAR_VOICE_LOGS':
      return {
        ...state,
        voiceLogs: [],
      };
    case 'ADD_CHAT_MESSAGE': {
      const existingMessages = state.chatMessages || [];
      if (action.payload?.id && existingMessages.some((msg) => msg.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        chatMessages: [...existingMessages, action.payload],
      };
    }
    case 'CLEAR_CHAT_MESSAGES':
      return {
        ...state,
        chatMessages: [],
      };

    case 'ADD_INVESTMENT': {
      const { symbol, name, shares, investedAmount, currentPrice, notes } = action.payload || {};
      const numShares = Math.max(0, Number(shares) || 0);
      const numInvested = Math.max(0, Number(investedAmount) || 0);
      const numPrice = Math.max(0, Number(currentPrice) || (numShares > 0 ? numInvested / numShares : 0));
      const upperSym = (symbol || '').toUpperCase().trim();

      const existingIndex = (state.investments || []).findIndex(
        (inv) => inv.symbol.toUpperCase() === upperSym
      );

      let updatedInvestments = [...(state.investments || [])];

      if (existingIndex >= 0) {
        const existing = updatedInvestments[existingIndex];
        const combinedShares = Number((existing.shares + numShares).toFixed(4));
        const combinedInvested = Number((existing.investedAmount + numInvested).toFixed(2));
        const effectivePrice = numPrice || existing.currentPrice || (combinedShares > 0 ? combinedInvested / combinedShares : 0);
        const currentValue = Number((combinedShares * effectivePrice).toFixed(2));
        const unrealizedGain = Number((currentValue - combinedInvested).toFixed(2));
        const unrealizedGainPercent = combinedInvested > 0 ? Number(((unrealizedGain / combinedInvested) * 100).toFixed(2)) : 0;

        updatedInvestments[existingIndex] = {
          ...existing,
          shares: combinedShares,
          investedAmount: combinedInvested,
          avgCostPerShare: combinedShares > 0 ? Number((combinedInvested / combinedShares).toFixed(2)) : 0,
          currentPrice: effectivePrice,
          currentValue,
          unrealizedGain,
          unrealizedGainPercent,
          lastUpdated: new Date().toISOString(),
        };
      } else {
        const currentValue = Number((numShares * numPrice).toFixed(2));
        const unrealizedGain = Number((currentValue - numInvested).toFixed(2));
        const unrealizedGainPercent = numInvested > 0 ? Number(((unrealizedGain / numInvested) * 100).toFixed(2)) : 0;

        const newHolding = {
          id: action.payload?.id || `inv_${upperSym.toLowerCase()}_${Date.now()}`,
          symbol: upperSym,
          name: name || upperSym,
          shares: Number(numShares.toFixed(4)),
          investedAmount: Number(numInvested.toFixed(2)),
          avgCostPerShare: numShares > 0 ? Number((numInvested / numShares).toFixed(2)) : numPrice,
          currentPrice: numPrice,
          currentValue,
          unrealizedGain,
          unrealizedGainPercent,
          notes: notes || '',
          dateAdded: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };
        updatedInvestments.unshift(newHolding);
      }

      // Ensure an 'Investments' category exists in state.categories if none exists
      let updatedCategories = [...(state.categories || [])];
      const hasInvestmentsCat = updatedCategories.some(
        (c) => c && c.name && (c.name.toLowerCase() === 'investments' || c.name.toLowerCase().startsWith('investment'))
      );

      if (!hasInvestmentsCat) {
        updatedCategories.push({
          id: `cat_investments_${Date.now()}`,
          name: 'Investments',
          limit: Math.max(500, Math.round(numInvested)),
          color: '#3b82f6',
          endOfCycleAction: 'rollover',
        });
      }

      return {
        ...state,
        investments: updatedInvestments,
        categories: updatedCategories,
      };
    }

    case 'UPDATE_INVESTMENT': {
      const { id, shares, investedAmount, currentPrice, notes } = action.payload || {};
      return {
        ...state,
        investments: (state.investments || []).map((inv) => {
          if (inv.id !== id) return inv;
          const newShares = shares !== undefined ? Math.max(0, Number(shares)) : inv.shares;
          const newInvested = investedAmount !== undefined ? Math.max(0, Number(investedAmount)) : inv.investedAmount;
          const newPrice = currentPrice !== undefined ? Math.max(0, Number(currentPrice)) : inv.currentPrice;
          const currentValue = Number((newShares * newPrice).toFixed(2));
          const unrealizedGain = Number((currentValue - newInvested).toFixed(2));
          const unrealizedGainPercent = newInvested > 0 ? Number(((unrealizedGain / newInvested) * 100).toFixed(2)) : 0;

          return {
            ...inv,
            shares: Number(newShares.toFixed(4)),
            investedAmount: Number(newInvested.toFixed(2)),
            avgCostPerShare: newShares > 0 ? Number((newInvested / newShares).toFixed(2)) : inv.avgCostPerShare,
            currentPrice: newPrice,
            currentValue,
            unrealizedGain,
            unrealizedGainPercent,
            notes: notes !== undefined ? notes : inv.notes,
            lastUpdated: new Date().toISOString(),
          };
        }),
      };
    }

    case 'DELETE_INVESTMENT': {
      const targetId = action.payload?.id || action.payload;
      return {
        ...state,
        investments: (state.investments || []).filter((inv) => inv.id !== targetId),
      };
    }

    case 'REFRESH_PORTFOLIO_PRICES': {
      const quotes = action.payload || {};
      if (Object.keys(quotes).length === 0) return state;

      return {
        ...state,
        investments: (state.investments || []).map((inv) => {
          const latestPrice = quotes[inv.symbol] || quotes[inv.symbol.toUpperCase()];
          if (!latestPrice || typeof latestPrice !== 'number') return inv;

          const currentValue = Number((inv.shares * latestPrice).toFixed(2));
          const unrealizedGain = Number((currentValue - inv.investedAmount).toFixed(2));
          const unrealizedGainPercent = inv.investedAmount > 0 ? Number(((unrealizedGain / inv.investedAmount) * 100).toFixed(2)) : 0;

          return {
            ...inv,
            currentPrice: latestPrice,
            currentValue,
            unrealizedGain,
            unrealizedGainPercent,
            lastUpdated: new Date().toISOString(),
          };
        }),
      };
    }
    case 'SET_FULL_STATE': {
      const incoming = action.payload || {};

      // Merge transactions by id (preserve local transactions & remote transactions)
      const txMap = new Map();
      (state?.transactions || []).forEach((tx) => {
        if (tx?.id) txMap.set(tx.id, tx);
      });
      (incoming.transactions || []).forEach((tx) => {
        if (tx?.id) txMap.set(tx.id, tx);
      });

      // Merge categories by normalized name (never re-inject deleted or default categories)
      const catMap = new Map();
      (state?.categories || []).forEach((cat) => {
        if (cat?.name) catMap.set(cat.name.trim().toLowerCase(), cat);
      });
      (incoming.categories || []).forEach((cat) => {
        if (cat?.name) catMap.set(cat.name.trim().toLowerCase(), cat);
      });

      // Merge income sources by id or name
      const sourceMap = new Map();
      (state?.incomeSources || []).forEach((src) => {
        const key = src?.id || src?.name;
        if (key) sourceMap.set(key, src);
      });
      (incoming.incomeSources || []).forEach((src) => {
        const key = src?.id || src?.name;
        if (key) sourceMap.set(key, src);
      });

      // Merge voice logs
      const logMap = new Map();
      (state?.voiceLogs || []).forEach((log) => {
        const key = log?.id || log?.timestamp;
        if (key) logMap.set(key, log);
      });
      (incoming.voiceLogs || []).forEach((log) => {
        const key = log?.id || log?.timestamp;
        if (key) logMap.set(key, log);
      });

      // Merge chat messages by id
      const msgMap = new Map();
      (state?.chatMessages || []).forEach((msg) => {
        if (msg?.id) msgMap.set(msg.id, msg);
      });
      (incoming.chatMessages || []).forEach((msg) => {
        if (msg?.id) msgMap.set(msg.id, msg);
      });

      // Merge investments by symbol
      const invMap = new Map();
      (state?.investments || []).forEach((inv) => {
        if (inv?.symbol) invMap.set(inv.symbol.toUpperCase(), inv);
      });
      (incoming.investments || []).forEach((inv) => {
        if (inv?.symbol) invMap.set(inv.symbol.toUpperCase(), inv);
      });

      return sanitizeState({
        ...defaultState,
        ...state,
        ...incoming,
        categories: Array.from(catMap.values()),
        transactions: Array.from(txMap.values()),
        incomeSources: Array.from(sourceMap.values()),
        investments: Array.from(invMap.values()),
        voiceLogs: Array.from(logMap.values()),
        chatMessages: Array.from(msgMap.values()),
        quotaUsage: normalizeQuotaState(incoming.quotaUsage || state.quotaUsage),
      });
    }
    case 'LOAD_USER_STATE': {
      const incoming = action.payload || {};
      const sessionKey = action.meta?.sessionKey !== undefined ? action.meta.sessionKey : state._sessionKey;
      return sanitizeState({
        ...defaultState,
        ...incoming,
        categories: Array.isArray(incoming.categories) ? incoming.categories : defaultState.categories,
        transactions: Array.isArray(incoming.transactions) ? incoming.transactions : [],
        incomeSources: Array.isArray(incoming.incomeSources) ? incoming.incomeSources : [],
        investments: Array.isArray(incoming.investments) ? incoming.investments : [],
        voiceLogs: Array.isArray(incoming.voiceLogs) ? incoming.voiceLogs : [],
        chatMessages: Array.isArray(incoming.chatMessages) ? incoming.chatMessages : [],
        quotaUsage: normalizeQuotaState(incoming.quotaUsage),
        isSubscribed: Boolean(incoming.isSubscribed),
        subscriptionPlan: incoming.subscriptionPlan || (incoming.isSubscribed ? 'pro' : 'free'),
        updatedAt: incoming.updatedAt || null,
        _sessionKey: sessionKey,
      });
    }
    case 'UPDATE_QUOTA_USAGE': {
      const currentQuota = normalizeQuotaState(state.quotaUsage);
      return {
        ...state,
        quotaUsage: {
          ...currentQuota,
          ...action.payload,
        },
      };
    }
    case 'UPDATE_SUBSCRIPTION': {
      return {
        ...state,
        isSubscribed: Boolean(action.payload.isSubscribed),
        subscriptionPlan: action.payload.plan || (action.payload.isSubscribed ? 'pro' : 'free'),
      };
    }
    case 'RESET_STATE':
      return sanitizeState({
        ...defaultState,
        updatedAt: null,
        _sessionKey: action.meta?.sessionKey !== undefined ? action.meta.sessionKey : null,
      });

    default:
      return state;
  }
}

const NON_MUTATING_ACTIONS = new Set([
  'SET_FULL_STATE',
  'LOAD_USER_STATE',
  'RESET_STATE',
  'REFRESH_PORTFOLIO_PRICES',
]);

function budgetReducer(state, action) {
  const nextState = internalBudgetReducer(state, action);
  if (nextState !== state && !NON_MUTATING_ACTIONS.has(action.type)) {
    return {
      ...nextState,
      updatedAt: new Date().toISOString(),
    };
  }
  return nextState;
}

export function BudgetProvider({ children }) {
  const [state, dispatch] = useReducer(budgetReducer, null, getInitialState);
  const { user } = useAuth();
  const activeSessionKey = getSessionKey(user);

  // ARCA Pro Modal state
  const [proModalConfig, setProModalConfig] = useState({
    isOpen: false,
    reason: 'QUOTA_EXHAUSTED',
    feature: 'receipts',
    used: 5,
    limit: 5,
    resetCountdown: getNextMondayCountdown(),
  });

  const openProModal = (config = {}) => {
    const feat = config.feature || 'receipts';
    setProModalConfig({
      isOpen: true,
      reason: config.reason || 'QUOTA_EXHAUSTED',
      feature: feat,
      used: config.used ?? (state.quotaUsage?.[`${feat}Used`] ?? QUOTA_LIMITS[feat] ?? 5),
      limit: config.limit ?? (QUOTA_LIMITS[feat] ?? 5),
      resetCountdown: config.resetCountdown || getNextMondayCountdown(),
    });
  };

  const closeProModal = () => {
    setProModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const subscribeToPro = async (plan = 'pro') => {
    dispatch({
      type: 'UPDATE_SUBSCRIPTION',
      payload: { isSubscribed: true, plan },
    });
    if (db && user && user.uid && !user.isGuest) {
      try {
        const docRef = doc(db, 'users', user.uid, 'budgetData', 'main');
        await setDoc(docRef, { isSubscribed: true, subscriptionPlan: plan, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('[BudgetContext] Firestore subscribe update failed:', err);
      }
    }
    return { success: true };
  };

  const cancelProSubscription = async () => {
    dispatch({
      type: 'UPDATE_SUBSCRIPTION',
      payload: { isSubscribed: false, plan: 'free' },
    });
    if (db && user && user.uid && !user.isGuest) {
      try {
        const docRef = doc(db, 'users', user.uid, 'budgetData', 'main');
        await setDoc(docRef, { isSubscribed: false, subscriptionPlan: 'free', updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('[BudgetContext] Firestore cancel subscription failed:', err);
      }
    }
    return { success: true };
  };

  const updateQuota = async (feature, skipIncrement = false) => {
    const result = await checkAndIncrementQuota(user?.uid, feature, state.quotaUsage, {
      skipIncrement,
      isSubscribed: state.isSubscribed,
    });
    if (!skipIncrement && result.allowed && !state.isSubscribed) {
      dispatch({
        type: 'UPDATE_QUOTA_USAGE',
        payload: {
          [`${feature}Used`]: result.used,
          weekStartDate: getMondayOfCurrentWeekISO(),
        },
      });
    }
    return result;
  };

  // Load user-scoped budget state from localStorage whenever the active session changes
  useEffect(() => {
    if (!activeSessionKey) {
      if (state._sessionKey !== null) {
        dispatch({ type: 'RESET_STATE', meta: { sessionKey: null } });
      }
      return;
    }

    if (state._sessionKey === activeSessionKey) {
      return;
    }

    const saved = readSavedStateForSession(activeSessionKey);
    dispatch({
      type: 'LOAD_USER_STATE',
      payload: saved || { ...defaultState, updatedAt: null },
      meta: { sessionKey: activeSessionKey },
    });
  }, [activeSessionKey, state._sessionKey]);

  // Persist budget state immediately to user-scoped localStorage (never overwriting during logout/user switch)
  useEffect(() => {
    if (!activeSessionKey || state._sessionKey !== activeSessionKey) {
      return;
    }

    try {
      const persistable = stripInternalState(state);
      localStorage.setItem(getStorageKey(activeSessionKey), JSON.stringify(persistable));
      localStorage.setItem(LAST_ACTIVE_USER_KEY, activeSessionKey);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch (e) {
      console.warn('Failed to save budget state to localStorage:', e);
    }
  }, [state, activeSessionKey]);

  // Continuously refresh user stock holdings with accurate live market prices
  useEffect(() => {
    const symbols = (state.investments || []).map((i) => i.symbol).filter(Boolean);
    if (symbols.length === 0) return;

    let isMounted = true;
    const fetchLiveQuotes = async () => {
      try {
        const apiBase = env.apiBaseUrl || '';
        const res = await fetch(`${apiBase}/api/markets/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols }),
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.quotes && Object.keys(data.quotes).length > 0) {
            const liveMap = {};
            Object.values(data.quotes).forEach((q) => {
              liveMap[q.symbol] = q.price;
            });
            dispatch({ type: 'REFRESH_PORTFOLIO_PRICES', payload: liveMap });
          }
        }
      } catch (err) {
        console.warn('BudgetContext failed to refresh holding quotes:', err);
      }
    };

    fetchLiveQuotes();
    const interval = setInterval(fetchLiveQuotes, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [state.investments?.length]);

  // Calculate normalized total income
  const totalIncome = state.incomeSources.reduce((sum, source) => {
    return sum + normalizeToMasterCycle(source.amount, source.frequency, state.cycleFrequency);
  }, 0);

  // Determine current cycle window
  const cycleWindow = getCycleWindow(state.cycleStartDate, state.cycleFrequency);

  // Filter transactions to the current cycle
  const currentCycleTransactions = state.transactions.filter(tx => isWithinCycle(tx.date, cycleWindow));

  // Calculate totals for the current cycle
  const totalSpent = currentCycleTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalAllocated = state.categories.reduce((sum, cat) => sum + Number(cat.limit), 0);
  const leftToBudget = totalIncome - totalAllocated;

  // Calculate spent per category (summing all transactions assigned to that category)
  const categorySpending = state.categories.reduce((acc, cat) => {
    acc[cat.id] = state.transactions
      .filter((tx) => tx.categoryId === cat.id)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    return acc;
  }, {});

  // Find primary salary income source if present
  const primarySalary = state.incomeSources.find(
    (s) => s.isSalary || s.id === 'salary_source' || s.name?.toLowerCase() === 'primary salary' || s.name?.toLowerCase() === 'salary'
  ) || null;

  // Calculate portfolio totals
  const portfolioTotalInvested = (state.investments || []).reduce(
    (sum, inv) => sum + (Number(inv.investedAmount) || 0),
    0
  );
  const portfolioCurrentValue = (state.investments || []).reduce(
    (sum, inv) => sum + (Number(inv.currentValue) || 0),
    0
  );
  const portfolioTotalGain = portfolioCurrentValue - portfolioTotalInvested;
  const portfolioTotalGainPercent = portfolioTotalInvested > 0
    ? (portfolioTotalGain / portfolioTotalInvested) * 100
    : 0;

  const value = {
    ...state,
    dispatch,
    primarySalary,
    totalIncome,
    totalSpent,
    totalAllocated,
    leftToBudget,
    categorySpending,
    currentCycleWindow: cycleWindow,
    portfolioTotalInvested: Number(portfolioTotalInvested.toFixed(2)),
    portfolioCurrentValue: Number(portfolioCurrentValue.toFixed(2)),
    portfolioTotalGain: Number(portfolioTotalGain.toFixed(2)),
    portfolioTotalGainPercent: Number(portfolioTotalGainPercent.toFixed(2)),
    quotaUsage: state.quotaUsage,
    isSubscribed: Boolean(state.isSubscribed),
    subscriptionPlan: state.subscriptionPlan || 'free',
    subscribeToPro,
    cancelProSubscription,
    proModalConfig,
    openProModal,
    closeProModal,
    updateQuota,
  };


  return (
    <BudgetContext.Provider value={value}>
      {children}
      <StackedProModal />
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
