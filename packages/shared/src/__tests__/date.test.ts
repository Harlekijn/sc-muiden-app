import { describe, it, expect } from 'vitest';
import { formatDutchDate, formatTime, formatDutchDateTime, formatShortDate } from '../utils/date';

// Use `new Date(year, month, day)` (local time) instead of ISO strings to
// avoid the YYYY-MM-DD spec behaviour of parsing as UTC midnight, which shifts
// the displayed date by one day in timezones west of UTC.
const APR_26_2026 = new Date(2026, 3, 26);        // zondag
const APR_26_14_30 = new Date(2026, 3, 26, 14, 30);
const APR_26_09_05 = new Date(2026, 3, 26, 9, 5);

describe('formatDutchDate', () => {
  it('formats a date in Dutch long format', () => {
    expect(formatDutchDate(APR_26_2026)).toBe('zondag 26 april');
  });

  it('accepts an ISO string with explicit time (local noon)', () => {
    // Including a time component forces JS to treat the string as local time
    expect(formatDutchDate('2026-04-26T12:00:00')).toBe('zondag 26 april');
  });

  it('uses lowercase Dutch day and month names', () => {
    const result = formatDutchDate(APR_26_2026);
    expect(result[0]).toBe(result[0].toLowerCase());
  });
});

describe('formatTime', () => {
  it('formats time as HH:mm', () => {
    expect(formatTime(APR_26_14_30)).toBe('14:30');
  });

  it('pads single-digit hours and minutes', () => {
    expect(formatTime(APR_26_09_05)).toBe('09:05');
  });
});

describe('formatDutchDateTime', () => {
  it('combines date and time with "om"', () => {
    expect(formatDutchDateTime(APR_26_14_30)).toBe('zondag 26 april om 14:30');
  });
});

describe('formatShortDate', () => {
  it('formats as d MMM in Dutch (Dutch locale appends a period to short month names)', () => {
    expect(formatShortDate(APR_26_2026)).toBe('26 apr.');
  });
});
