import { describe, it, expect } from 'vitest';
import { sportLabel, sportBadgeColor, SPORT_OPTIONS } from '../utils/sport';

describe('sportLabel', () => {
  it('returns Voetbal for voetbal', () => {
    expect(sportLabel('voetbal')).toBe('Voetbal');
  });

  it('returns Hockey for hockey', () => {
    expect(sportLabel('hockey')).toBe('Hockey');
  });
});

describe('sportBadgeColor', () => {
  it('returns blue for voetbal', () => {
    expect(sportBadgeColor('voetbal')).toBe('#046bba');
  });

  it('returns success green for hockey', () => {
    expect(sportBadgeColor('hockey')).toBe('#1a8c5c');
  });
});

describe('SPORT_OPTIONS', () => {
  it('contains both sports', () => {
    const values = SPORT_OPTIONS.map((o) => o.value);
    expect(values).toContain('voetbal');
    expect(values).toContain('hockey');
  });

  it('has Dutch labels', () => {
    const labels = SPORT_OPTIONS.map((o) => o.label);
    expect(labels).toContain('Voetbal');
    expect(labels).toContain('Hockey');
  });
});
