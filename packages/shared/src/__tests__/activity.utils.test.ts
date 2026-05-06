import { describe, it, expect } from 'vitest';
import { formatActivityType, getActivityTypeColor } from '../utils/activity';

describe('formatActivityType', () => {
  it('training → "Training"', () => {
    expect(formatActivityType('training')).toBe('Training');
  });

  it('wedstrijd → "Wedstrijd"', () => {
    expect(formatActivityType('wedstrijd')).toBe('Wedstrijd');
  });

  it('bardienst → "Bardienst"', () => {
    expect(formatActivityType('bardienst')).toBe('Bardienst');
  });

  it('clubactiviteit → "Clubactiviteit"', () => {
    expect(formatActivityType('clubactiviteit')).toBe('Clubactiviteit');
  });
});

describe('getActivityTypeColor', () => {
  it('training geeft blauw', () => {
    expect(getActivityTypeColor('training')).toBe('#046bba');
  });

  it('wedstrijd geeft marine', () => {
    expect(getActivityTypeColor('wedstrijd')).toBe('#011d50');
  });

  it('bardienst geeft geel', () => {
    expect(getActivityTypeColor('bardienst')).toBe('#f5c518');
  });

  it('clubactiviteit geeft groen', () => {
    expect(getActivityTypeColor('clubactiviteit')).toBe('#1a8c5c');
  });
});
