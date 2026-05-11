import { describe, it, expect } from 'vitest';
import { KnvbMatchSchema, KnhbMatchSchema, KnvbMatchListSchema } from '../schemas/federation.schema';

// S11-A — Cron sync verwerkt wedstrijden (mock): schema-validatie is de eerste verwerkingsstap
describe('KnvbMatchSchema', () => {
  const valid = {
    id: 'knvb-001',
    thuisclub: 'SC Muiden 1',
    uitclub: 'FC Diemen 1',
    datum: '2026-05-17',
    aanvangstijd: '14:30',
    status: 'gepland' as const,
  };

  it('accepteert een geldige wedstrijd', () => {
    expect(() => KnvbMatchSchema.parse(valid)).not.toThrow();
  });

  it('accepteert optionele locatie, thuisstand en uitstand', () => {
    const withOptionals = { ...valid, locatie: 'Sportpark Muiden', thuisstand: 2, uitstand: 1 };
    const result = KnvbMatchSchema.parse(withOptionals);
    expect(result.locatie).toBe('Sportpark Muiden');
    expect(result.thuisstand).toBe(2);
  });

  it('geeft Nederlandse foutmelding bij ontbrekend id', () => {
    const result = KnvbMatchSchema.safeParse({ ...valid, id: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Wedstrijd-ID is verplicht');
    }
  });

  it('geeft Nederlandse foutmelding bij ontbrekende thuisclub', () => {
    const result = KnvbMatchSchema.safeParse({ ...valid, thuisclub: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Thuisclub is verplicht');
    }
  });

  it('geeft Nederlandse foutmelding bij ongeldige status', () => {
    const result = KnvbMatchSchema.safeParse({ ...valid, status: 'unknown' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Ongeldige wedstrijdstatus');
    }
  });

  it('accepteert alle geldige statussen', () => {
    for (const status of ['gepland', 'gespeeld', 'afgelast'] as const) {
      expect(() => KnvbMatchSchema.parse({ ...valid, status })).not.toThrow();
    }
  });
});

describe('KnhbMatchSchema', () => {
  const valid = {
    matchId: 'knhb-001',
    homeTeam: 'SC Muiden Hockey 1',
    awayTeam: 'HC Muiderberg 1',
    dateTime: '2026-05-17T10:00:00Z',
    status: 'gepland',
  };

  it('accepteert een geldige wedstrijd', () => {
    expect(() => KnhbMatchSchema.parse(valid)).not.toThrow();
  });

  it('accepteert optionele venue, homeScore en awayScore', () => {
    const result = KnhbMatchSchema.parse({ ...valid, venue: 'Hockeyveld Muiden', homeScore: 3, awayScore: 0 });
    expect(result.venue).toBe('Hockeyveld Muiden');
    expect(result.homeScore).toBe(3);
  });

  it('geeft Nederlandse foutmelding bij ontbrekend matchId', () => {
    const result = KnhbMatchSchema.safeParse({ ...valid, matchId: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Match-ID is verplicht');
    }
  });

  it('geeft Nederlandse foutmelding bij ontbrekend homeTeam', () => {
    const result = KnhbMatchSchema.safeParse({ ...valid, homeTeam: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Thuisclub is verplicht');
    }
  });
});

describe('KnvbMatchListSchema', () => {
  it('accepteert een lege array', () => {
    expect(() => KnvbMatchListSchema.parse([])).not.toThrow();
  });

  it('accepteert een array met meerdere wedstrijden', () => {
    const items = [
      { id: '1', thuisclub: 'A', uitclub: 'B', datum: '2026-05-17', aanvangstijd: '14:00', status: 'gepland' },
      { id: '2', thuisclub: 'C', uitclub: 'D', datum: '2026-05-24', aanvangstijd: '14:00', status: 'gespeeld', thuisstand: 2, uitstand: 1 },
    ];
    const result = KnvbMatchListSchema.parse(items);
    expect(result).toHaveLength(2);
  });

  it('faalt als één item ongeldig is', () => {
    const items = [
      { id: '1', thuisclub: 'A', uitclub: 'B', datum: '2026-05-17', aanvangstijd: '14:00', status: 'gepland' },
      { id: '2', thuisclub: 'C', uitclub: 'D', datum: '2026-05-24', aanvangstijd: '14:00', status: 'onbekend' },
    ];
    expect(() => KnvbMatchListSchema.parse(items)).toThrow();
  });
});
