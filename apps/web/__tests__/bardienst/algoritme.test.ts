// S16-B/F/G — Algoritme: eerlijke verdeling, sport-filtering, dag-overlap
import {
  splitIntoShifts,
  sportOverlap,
  seasonBounds,
  genereerPreviewVoorSlot,
  type AlgorithmMember,
  type AlgorithmSlot,
} from '../../lib/bardienst-algoritme';

function maakLid(overrides: Partial<AlgorithmMember> & { id: string }): AlgorithmMember {
  return {
    first_name: 'Test',
    last_name: 'Lid',
    sport: ['voetbal'],
    lid_type: 'spelend-lid',
    is_barcommissie: false,
    is_vrijwilliger: false,
    ...overrides,
  };
}

function maakBarLid(overrides: Partial<AlgorithmMember> & { id: string }): AlgorithmMember {
  return maakLid({ ...overrides, is_barcommissie: true, lid_type: null });
}

const SLOT_VOETBAL: AlgorithmSlot = {
  id: 'slot-1',
  date: '2026-04-26',
  starts_at: '08:00:00',
  ends_at: '13:00:00',
  sport: 'voetbal',
};

describe('splitIntoShifts', () => {
  it('08:00–13:00 geeft 2 diensten van 2,5u', () => {
    const shifts = splitIntoShifts('2026-04-26', '08:00:00', '13:00:00');
    expect(shifts).toHaveLength(2);
    expect(shifts[0].starts_at).toBe('2026-04-26T08:00:00');
    expect(shifts[0].ends_at).toBe('2026-04-26T10:30:00');
    expect(shifts[1].starts_at).toBe('2026-04-26T10:30:00');
    expect(shifts[1].ends_at).toBe('2026-04-26T13:00:00');
  });

  it('08:00–18:00 geeft 4 diensten', () => {
    const shifts = splitIntoShifts('2026-04-26', '08:00:00', '18:00:00');
    expect(shifts).toHaveLength(4);
  });

  it('rest-tijd kleiner dan 2,5u wordt niet als dienst opgenomen', () => {
    // 08:00–10:00 = 120 min, minder dan 150 — geen dienst
    const shifts = splitIntoShifts('2026-04-26', '08:00:00', '10:00:00');
    expect(shifts).toHaveLength(0);
  });

  it('begintijd gelijk aan eindtijd geeft geen diensten', () => {
    const shifts = splitIntoShifts('2026-04-26', '08:00:00', '08:00:00');
    expect(shifts).toHaveLength(0);
  });
});

describe('sportOverlap', () => {
  it('club-breed slot (null) accepteert alle sporten', () => {
    expect(sportOverlap(['hockey'], null)).toBe(true);
    expect(sportOverlap(['voetbal'], null)).toBe(true);
    expect(sportOverlap([], null)).toBe(true);
  });

  it('voetbal-slot weigert puur hockey-leden', () => {
    expect(sportOverlap(['hockey'], 'voetbal')).toBe(false);
  });

  it('voetbal-slot accepteert leden met beide sporten', () => {
    expect(sportOverlap(['voetbal', 'hockey'], 'voetbal')).toBe(true);
  });

  it('voetbal-slot accepteert voetbal-leden', () => {
    expect(sportOverlap(['voetbal'], 'voetbal')).toBe(true);
  });
});

describe('seasonBounds', () => {
  it('2025-2026 → start aug 2025, eind jul 2026', () => {
    const { start, end } = seasonBounds('2025-2026');
    expect(start).toBe('2025-08-01T00:00:00Z');
    expect(end).toBe('2026-07-31T23:59:59Z');
  });
});

describe('genereerPreviewVoorSlot', () => {
  function maakLeden(n: number, sport: string[] = ['voetbal']): AlgorithmMember[] {
    return Array.from({ length: n }, (_, i) => maakLid({ id: `lid-${i}`, sport, last_name: `Lid${i}` }));
  }

  function maakBarLeden(n: number, sport: string[] = ['voetbal']): AlgorithmMember[] {
    return Array.from({ length: n }, (_, i) => maakBarLid({ id: `bar-${i}`, sport, last_name: `Bar${i}` }));
  }

  it('genereert 2 diensten voor slot 08:00–13:00 met genoeg leden', () => {
    const members = [...maakBarLeden(2), ...maakLeden(4)];
    const result = genereerPreviewVoorSlot(SLOT_VOETBAL, members, new Map());
    expect('shifts' in result).toBe(true);
    if ('shifts' in result) {
      expect(result.shifts).toHaveLength(2);
      expect(result.shifts[0].barcommissie_member.is_barcommissie).toBe(true);
      expect(result.shifts[0].regular_members).toHaveLength(2);
    }
  });

  it('retourneert INSUFFICIENT_BARCOMMISSIE als er te weinig barcommissieleden zijn', () => {
    // Slot 08:00–13:00 → 2 diensten, maar slechts 1 barcommissielid
    const members = [...maakBarLeden(1), ...maakLeden(4)];
    const result = genereerPreviewVoorSlot(SLOT_VOETBAL, members, new Map());
    expect('code' in result).toBe(true);
    if ('code' in result) {
      expect(result.code).toBe('INSUFFICIENT_BARCOMMISSIE');
      expect(result.error).toMatch(/barcommissie/i);
    }
  });

  it('retourneert INSUFFICIENT_REGULAR als er te weinig reguliere leden zijn', () => {
    // 2 diensten → 4 reguliere leden nodig, maar slechts 3
    const members = [...maakBarLeden(2), ...maakLeden(3)];
    const result = genereerPreviewVoorSlot(SLOT_VOETBAL, members, new Map());
    expect('code' in result).toBe(true);
    if ('code' in result) {
      expect(result.code).toBe('INSUFFICIENT_REGULAR');
    }
  });

  it('sluit hockey-leden uit bij voetbal-slot', () => {
    const voetbalLeden = maakLeden(4, ['voetbal']);
    const hockeyLeden = maakLeden(2, ['hockey']).map((m, i) => ({ ...m, id: `hockey-${i}` }));
    const barLeden = maakBarLeden(2, ['voetbal']);
    const members = [...barLeden, ...voetbalLeden, ...hockeyLeden];
    const result = genereerPreviewVoorSlot(SLOT_VOETBAL, members, new Map());
    expect('shifts' in result).toBe(true);
    if ('shifts' in result) {
      for (const shift of result.shifts) {
        expect(shift.barcommissie_member.member_id).not.toMatch(/^hockey/);
        expect(shift.regular_members[0].member_id).not.toMatch(/^hockey/);
        expect(shift.regular_members[1].member_id).not.toMatch(/^hockey/);
      }
    }
  });

  it('pland niemand twee keer in op dezelfde dag', () => {
    const members = [...maakBarLeden(2), ...maakLeden(4)];
    const result = genereerPreviewVoorSlot(SLOT_VOETBAL, members, new Map());
    expect('shifts' in result).toBe(true);
    if ('shifts' in result) {
      const allIds = result.shifts.flatMap((sh) => [
        sh.barcommissie_member.member_id,
        sh.regular_members[0].member_id,
        sh.regular_members[1].member_id,
      ]);
      const unique = new Set(allIds);
      expect(unique.size).toBe(allIds.length);
    }
  });

  it('leden met lagere fairness-score krijgen voorrang', () => {
    // lid-0 heeft 3 diensten, lid-1 heeft 0 — lid-1 moet als eerste gekozen worden
    const bar = maakBarLeden(2);
    const regulier = [
      maakLid({ id: 'lid-0', last_name: 'Aap' }),
      maakLid({ id: 'lid-1', last_name: 'Bok' }),
      maakLid({ id: 'lid-2', last_name: 'Cor' }),
      maakLid({ id: 'lid-3', last_name: 'Dam' }),
    ];
    const fairness = new Map([['lid-0', 3]]);
    const result = genereerPreviewVoorSlot(SLOT_VOETBAL, [...bar, ...regulier], fairness);
    expect('shifts' in result).toBe(true);
    if ('shifts' in result) {
      const firstShiftRegIds = result.shifts[0].regular_members.map((m) => m.member_id);
      // lid-0 heeft de hoogste score, dus moet niet als eerste komen
      expect(firstShiftRegIds).not.toContain('lid-0');
    }
  });

  it('sluit vrijwilligers uit', () => {
    const barLeden = maakBarLeden(2);
    const regulier = maakLeden(4);
    const vrijwilliger = { ...maakLid({ id: 'vrijwilliger-1' }), is_vrijwilliger: true };
    const members = [...barLeden, ...regulier, vrijwilliger];
    const result = genereerPreviewVoorSlot(SLOT_VOETBAL, members, new Map());
    expect('shifts' in result).toBe(true);
    if ('shifts' in result) {
      const allIds = result.shifts.flatMap((sh) => [
        sh.barcommissie_member.member_id,
        sh.regular_members[0].member_id,
        sh.regular_members[1].member_id,
      ]);
      expect(allIds).not.toContain('vrijwilliger-1');
    }
  });

  it('sluit niet-spelend-lid en trainingslid uit', () => {
    const barLeden = maakBarLeden(2);
    const regulier = maakLeden(4);
    const uitgesloten = [
      { ...maakLid({ id: 'nsl-1' }), lid_type: 'niet-spelend-lid' as const },
      { ...maakLid({ id: 'tl-1' }), lid_type: 'trainingslid' as const },
    ];
    const members = [...barLeden, ...regulier, ...uitgesloten];
    const result = genereerPreviewVoorSlot(SLOT_VOETBAL, members, new Map());
    expect('shifts' in result).toBe(true);
    if ('shifts' in result) {
      const allIds = result.shifts.flatMap((sh) => [
        sh.barcommissie_member.member_id,
        sh.regular_members[0].member_id,
        sh.regular_members[1].member_id,
      ]);
      expect(allIds).not.toContain('nsl-1');
      expect(allIds).not.toContain('tl-1');
    }
  });
});
