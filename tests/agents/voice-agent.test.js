import { describe, it, expect } from 'vitest';
import {
  parseSpokenReceipt,
  createVoiceLogEntry,
  getPreferredRecordingFormat,
  getHighQualityAudioConstraints,
} from '../../src/services/agents/voiceAgent.js';

describe('Voice Agent — Speech Parsing & Transaction Extraction', () => {
  it('parses spoken dollar amounts with currency symbols ("$15 at Starbucks")', () => {
    const result = parseSpokenReceipt('I spent $15 at Starbucks');
    expect(result).not.toBeNull();
    expect(result.amount).toBe(15);
    expect(result.description.toLowerCase()).toContain('starbucks');
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('parses spoken number words and colloquial phrasing ("twenty bucks at Walmart")', () => {
    const result = parseSpokenReceipt('twenty bucks at Walmart');
    expect(result).not.toBeNull();
    expect(result.amount).toBe(20);
    expect(result.description.toLowerCase()).toContain('walmart');
  });

  it('parses decimal cents correctly ("Spent 45.75 on groceries")', () => {
    const result = parseSpokenReceipt('Spent 45.75 on groceries');
    expect(result).not.toBeNull();
    expect(result.amount).toBe(45.75);
    expect(result.description.toLowerCase()).toContain('groceries');
  });

  it('detects "yesterday" and sets relative date appropriately', () => {
    const result = parseSpokenReceipt('Spent $12 on lunch yesterday');
    expect(result).not.toBeNull();
    expect(result.amount).toBe(12);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(result.date).toBe(yesterday.toISOString().split('T')[0]);
  });

  it('returns null for empty or invalid inputs', () => {
    expect(parseSpokenReceipt('')).toBeNull();
    expect(parseSpokenReceipt(null)).toBeNull();
  });

  it('createVoiceLogEntry generates complete audit record', () => {
    const log = createVoiceLogEntry('Spent $30 on gas', { amount: 30, description: 'gas' }, 'tx-123');
    expect(log).toHaveProperty('id');
    expect(log).toHaveProperty('timestamp');
    expect(log).toHaveProperty('rawTranscript', 'Spent $30 on gas');
    expect(log.extracted.amount).toBe(30);
    expect(log.transactionId).toBe('tx-123');
  });

  it('returns valid mobile-safe recording format and high-quality audio constraints', () => {
    const format = getPreferredRecordingFormat();
    expect(format).toHaveProperty('mimeType');
    expect(format).toHaveProperty('cleanMimeType');
    expect(format).toHaveProperty('extension');
    expect(format.cleanMimeType).not.toContain(';');

    const constraints = getHighQualityAudioConstraints();
    expect(constraints.audio).toMatchObject({
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });
  });
});
