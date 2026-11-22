import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  getSessionKey,
  getStorageKey,
  stripInternalState,
  getTimestampMs,
  buildFirestoreBudgetPayload,
} from '../../src/utils/budgetStorage.js';

describe('Account Data Persistence & Firestore Rules Schema Parity', () => {
  it('resolves distinct storage keys for authenticated users and a shared guest key', () => {
    expect(getSessionKey(null)).toBeNull();
    expect(getSessionKey({ uid: 'usr_123', isGuest: false })).toBe('usr_123');
    expect(getSessionKey({ uid: 'usr_arca_guest', isGuest: true })).toBe('guest');
    expect(getSessionKey({ uid: 'guest_999', isGuest: true })).toBe('guest');

    expect(getStorageKey('usr_123')).toBe('arca_budget_state_usr_123');
    expect(getStorageKey('usr_456')).toBe('arca_budget_state_usr_456');
    expect(getStorageKey('guest')).toBe('arca_budget_state_guest');
    expect(getStorageKey('usr_arca_guest')).toBe('arca_budget_state_guest');
    expect(getStorageKey('guest_12345')).toBe('arca_budget_state_guest');
  });

  it('strips internal _sessionKey metadata before persisting to localStorage', () => {
    const raw = {
      _sessionKey: 'usr_123',
      transactions: [{ id: 'tx_1', amount: 25 }],
      updatedAt: '2026-11-22T10:00:00.000Z',
    };

    const stripped = stripInternalState(raw);
    expect(stripped._sessionKey).toBeUndefined();
    expect(stripped.transactions).toHaveLength(1);
    expect(stripped.updatedAt).toBe('2026-11-22T10:00:00.000Z');
  });

  it('parses ISO strings, numbers, and Firestore Timestamp-like objects deterministically', () => {
    expect(getTimestampMs(null)).toBe(0);
    expect(getTimestampMs(undefined)).toBe(0);
    expect(getTimestampMs('2026-11-22T10:00:00.000Z')).toBe(Date.parse('2026-11-22T10:00:00.000Z'));
    expect(getTimestampMs({ toMillis: () => 1700000000000 })).toBe(1700000000000);
    expect(getTimestampMs({ seconds: 1700000000 })).toBe(1700000000000);
  });

  it('builds a Firestore budget payload containing ONLY fields allowed by firestore.rules', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    const dirtyState = {
      _sessionKey: 'usr_abc',
      legacyExtraField: 'should-not-be-sent',
      transactions: [{ id: 'tx_1', amount: 50, description: 'Lunch' }],
      categories: [{ id: '1', name: 'Bills', limit: 1000 }],
      incomeSources: [{ id: 'sal', name: 'Salary', amount: 5000 }],
      investments: [{ id: 'inv_1', symbol: 'AAPL', shares: 2 }],
      cycleStartDate: '2026-11-01',
      cycleFrequency: 'monthly',
      voiceLogs: [],
      chatMessages: [],
      quotaUsage: {
        weekStartDate: '2026-11-16T00:00:00.000Z',
        receiptsUsed: 1,
        voiceUsed: 0,
        assistantUsed: 2,
      },
      isSubscribed: true,
      subscriptionPlan: 'pro',
      updatedAt: '2026-11-22T10:00:00.000Z',
    };

    const updatePayload = buildFirestoreBudgetPayload(dirtyState, 'usr_abc');
    expect(updatePayload._sessionKey).toBeUndefined();
    expect(updatePayload.legacyExtraField).toBeUndefined();
    expect(updatePayload.createdAt).toBeUndefined();
    expect(updatePayload.uid).toBe('usr_abc');
    expect(updatePayload.userId).toBe('usr_abc');
    expect(updatePayload.isSubscribed).toBe(true);
    expect(updatePayload.subscriptionPlan).toBe('pro');

    const createPayload = buildFirestoreBudgetPayload(dirtyState, 'usr_abc', { includeCreatedAt: true });
    expect(typeof createPayload.createdAt).toBe('string');

    // Verify every payload key is explicitly allowlisted inside isValidBudgetData in firestore.rules
    const match = rulesContent.match(/function isValidBudgetData[\s\S]*?hasOnlyAllowedFields\(\[([\s\S]*?)\]\)/);
    expect(match).not.toBeNull();
    const allowedFieldsBlock = match[1];
    const allowedFields = Array.from(allowedFieldsBlock.matchAll(/'([^']+)'/g)).map((m) => m[1]);

    for (const key of Object.keys(createPayload)) {
      expect(allowedFields).toContain(key);
    }
  });
});
