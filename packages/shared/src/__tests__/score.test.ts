import { describe, it, expect } from 'vitest';
import { formatScore } from '../utils/score';

describe('formatScore', () => {
  it('formats a normal result', () => {
    expect(formatScore(3, 1)).toBe('3 – 1');
  });

  it('formats a draw', () => {
    expect(formatScore(0, 0)).toBe('0 – 0');
  });

  it('uses an en-dash with spaces, not a hyphen', () => {
    const result = formatScore(2, 2);
    expect(result).toContain('–');
    expect(result).not.toContain('-');
  });

  it('formats a high-scoring result', () => {
    expect(formatScore(10, 0)).toBe('10 – 0');
  });
});
