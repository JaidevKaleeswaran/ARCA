import { describe, it, expect } from 'vitest';
import {
  getMondayOfCurrentWeekISO,
  getNextMondayISO,
  getNextMondayCountdown,
  normalizeQuotaState,
  checkAndIncrementQuota,
  QUOTA_LIMITS,
} from '../../src/utils/quotaManager.js';

describe('Quota Engine & Deterministic Reset', () => {
  it('Verifies correct free tier quota limits (10 assistant, 5 voice, 5 receipts)', () => {
    expect(QUOTA_LIMITS.assistant).toBe(10);
    expect(QUOTA_LIMITS.voice).toBe(5);
    expect(QUOTA_LIMITS.receipts).toBe(5);
  });

  it('Calculates deterministic current Monday at 00:00:00 UTC', () => {
    const mondayISO = getMondayOfCurrentWeekISO();
    const date = new Date(mondayISO);
    expect(date.getUTCDay()).toBe(1); // Monday is day 1
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
    expect(date.getUTCMilliseconds()).toBe(0);
  });

  it('Calculates upcoming next Monday at 00:00:00 UTC', () => {
    const nextMondayISO = getNextMondayISO();
    const date = new Date(nextMondayISO);
    expect(date.getUTCDay()).toBe(1);
    expect(date.getUTCHours()).toBe(0);
    expect(new Date(nextMondayISO).getTime()).toBeGreaterThan(Date.now());
  });

  it('Generates human-readable countdown to next Monday reset', () => {
    const countdown = getNextMondayCountdown();
    expect(countdown).toMatch(/^in\s+(\d+d\s+\d+h|\d+h\s+\d+m)$/);
  });

  it('Normalizes quota state and resets stale week counts to 0', () => {
    const staleState = {
      weekStartDate: '2020-01-06T00:00:00.000Z',
      receiptsUsed: 5,
      voiceUsed: 5,
      assistantUsed: 10,
    };

    const normalized = normalizeQuotaState(staleState);
    expect(normalized.weekStartDate).toBe(getMondayOfCurrentWeekISO());
    expect(normalized.receiptsUsed).toBe(0);
    expect(normalized.voiceUsed).toBe(0);
    expect(normalized.assistantUsed).toBe(0);
  });

  it('checkAndIncrementQuota blocks when limit is reached without incrementing', async () => {
    const maxedState = {
      weekStartDate: getMondayOfCurrentWeekISO(),
      receiptsUsed: QUOTA_LIMITS.receipts, // 5
      voiceUsed: 0,
      assistantUsed: 0,
    };

    const res = await checkAndIncrementQuota('guest_user', 'receipts', maxedState, { skipIncrement: true });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('QUOTA_EXHAUSTED');
    expect(res.used).toBe(QUOTA_LIMITS.receipts);
  });

  it('checkAndIncrementQuota allows execution when below limit', async () => {
    const activeState = {
      weekStartDate: getMondayOfCurrentWeekISO(),
      receiptsUsed: 2,
      voiceUsed: 1,
      assistantUsed: 4,
    };

    const res = await checkAndIncrementQuota('guest_user', 'assistant', activeState, { skipIncrement: true });
    expect(res.allowed).toBe(true);
    expect(res.used).toBe(4);
  });

  it('checkAndIncrementQuota permanently enforces weekly caps even if isSubscribed is passed as true', async () => {
    const maxedState = {
      weekStartDate: getMondayOfCurrentWeekISO(),
      receiptsUsed: QUOTA_LIMITS.receipts,
      voiceUsed: QUOTA_LIMITS.voice,
      assistantUsed: QUOTA_LIMITS.assistant,
    };

    const resAssistant = await checkAndIncrementQuota('sub_user', 'assistant', maxedState, {
      skipIncrement: true,
      isSubscribed: true,
    });
    expect(resAssistant.allowed).toBe(false);
    expect(resAssistant.reason).toBe('QUOTA_EXHAUSTED');
    expect(resAssistant.limit).toBe(QUOTA_LIMITS.assistant);

    const resVoice = await checkAndIncrementQuota('sub_user', 'voice', maxedState, {
      skipIncrement: true,
      isSubscribed: true,
    });
    expect(resVoice.allowed).toBe(false);
    expect(resVoice.reason).toBe('QUOTA_EXHAUSTED');
    expect(resVoice.limit).toBe(QUOTA_LIMITS.voice);

    const resReceipts = await checkAndIncrementQuota('sub_user', 'receipts', maxedState, {
      skipIncrement: true,
      isSubscribed: true,
    });
    expect(resReceipts.allowed).toBe(false);
    expect(resReceipts.reason).toBe('QUOTA_EXHAUSTED');
    expect(resReceipts.limit).toBe(QUOTA_LIMITS.receipts);
  });
});
