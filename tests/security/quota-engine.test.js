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
      receiptsUsed: 15,
      voiceUsed: 20,
      assistantUsed: 30,
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
      receiptsUsed: QUOTA_LIMITS.receipts,
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
      receiptsUsed: 5,
      voiceUsed: 2,
      assistantUsed: 10,
    };

    const res = await checkAndIncrementQuota('guest_user', 'assistant', activeState, { skipIncrement: true });
    expect(res.allowed).toBe(true);
    expect(res.used).toBe(10);
  });
});
