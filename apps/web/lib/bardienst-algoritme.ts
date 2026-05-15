import type { BarRosterPreview, BarShift, BarShiftMember, Sport } from '@sc-muiden/shared';

export const SHIFT_DURATION_MINUTES = 150;
export const ELIGIBLE_LID_TYPES = ['spelend-lid', 'relatie'] as const;

export function seasonBounds(season: string): { start: string; end: string } {
  const [startYear] = season.split('-').map(Number);
  return {
    start: `${startYear}-08-01T00:00:00Z`,
    end: `${startYear + 1}-07-31T23:59:59Z`,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function splitIntoShifts(
  date: string,
  startsAt: string,
  endsAt: string
): Array<{ starts_at: string; ends_at: string }> {
  const [sh, sm] = startsAt.replace(':00', '').split(':').map(Number);
  const [eh, em] = endsAt.replace(':00', '').split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  const shifts: Array<{ starts_at: string; ends_at: string }> = [];
  let cursor = startMinutes;
  while (cursor + SHIFT_DURATION_MINUTES <= endMinutes) {
    const shiftEnd = cursor + SHIFT_DURATION_MINUTES;
    shifts.push({
      starts_at: `${date}T${pad(Math.floor(cursor / 60))}:${pad(cursor % 60)}:00`,
      ends_at: `${date}T${pad(Math.floor(shiftEnd / 60))}:${pad(shiftEnd % 60)}:00`,
    });
    cursor = shiftEnd;
  }
  return shifts;
}

export function sportOverlap(memberSport: string[], slotSport: string | null): boolean {
  if (!slotSport) return true;
  return memberSport.includes(slotSport);
}

export type AlgorithmMember = {
  id: string;
  first_name: string;
  last_name: string;
  sport: string[];
  lid_type: string | null;
  is_barcommissie: boolean;
  is_vrijwilliger: boolean;
};

export type AlgorithmSlot = {
  id: string;
  date: string;
  starts_at: string;
  ends_at: string;
  sport: string | null;
};

export type GenereerFout = {
  code: 'INSUFFICIENT_BARCOMMISSIE' | 'INSUFFICIENT_REGULAR';
  error: string;
};

export type GenereerResultaat = BarRosterPreview | GenereerFout;

function toBarShiftMember(m: AlgorithmMember, count: number): BarShiftMember {
  return {
    member_id: m.id,
    first_name: m.first_name,
    last_name: m.last_name,
    lid_type: m.lid_type as BarShiftMember['lid_type'],
    is_barcommissie: m.is_barcommissie,
    diensten_count: count,
  };
}

export function genereerPreviewVoorSlot(
  slot: AlgorithmSlot,
  allMembers: AlgorithmMember[],
  fairnessMap: Map<string, number>
): BarRosterPreview | GenereerFout {
  const shiftTimes = splitIntoShifts(slot.date, slot.starts_at, slot.ends_at);
  if (shiftTimes.length === 0) {
    return {
      bar_day_slot_id: slot.id,
      date: slot.date,
      sport: slot.sport as Sport | null,
      shifts: [],
    };
  }

  const sportFiltered = allMembers.filter((m) => sportOverlap(m.sport, slot.sport));
  const barcommissiePool = sportFiltered.filter((m) => m.is_barcommissie);
  const regulierPool = sportFiltered.filter(
    (m) =>
      !m.is_barcommissie &&
      !m.is_vrijwilliger &&
      m.lid_type !== null &&
      ELIGIBLE_LID_TYPES.includes(m.lid_type as typeof ELIGIBLE_LID_TYPES[number])
  );

  if (barcommissiePool.length < shiftTimes.length) {
    return {
      code: 'INSUFFICIENT_BARCOMMISSIE',
      error: `Onvoldoende barcommissieleden beschikbaar voor ${slot.date}.`,
    };
  }
  if (regulierPool.length < shiftTimes.length * 2) {
    return {
      code: 'INSUFFICIENT_REGULAR',
      error: `Onvoldoende reguliere leden beschikbaar voor ${slot.date}.`,
    };
  }

  const runScores = new Map<string, number>(fairnessMap);
  const assignedToday = new Set<string>();
  const shifts: BarShift[] = [];

  for (const shiftTime of shiftTimes) {
    const sortedBar = barcommissiePool
      .filter((m) => !assignedToday.has(m.id))
      .sort((a, b) => {
        const diff = (runScores.get(a.id) ?? 0) - (runScores.get(b.id) ?? 0);
        if (diff !== 0) return diff;
        return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, 'nl');
      });

    const barMember = sortedBar[0];
    assignedToday.add(barMember.id);
    runScores.set(barMember.id, (runScores.get(barMember.id) ?? 0) + 1);

    const sortedReg = regulierPool
      .filter((m) => !assignedToday.has(m.id))
      .sort((a, b) => {
        const diff = (runScores.get(a.id) ?? 0) - (runScores.get(b.id) ?? 0);
        if (diff !== 0) return diff;
        return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, 'nl');
      });

    const reg1 = sortedReg[0];
    const reg2 = sortedReg[1];
    assignedToday.add(reg1.id);
    assignedToday.add(reg2.id);
    runScores.set(reg1.id, (runScores.get(reg1.id) ?? 0) + 1);
    runScores.set(reg2.id, (runScores.get(reg2.id) ?? 0) + 1);

    shifts.push({
      starts_at: shiftTime.starts_at,
      ends_at: shiftTime.ends_at,
      barcommissie_member: toBarShiftMember(barMember, fairnessMap.get(barMember.id) ?? 0),
      regular_members: [
        toBarShiftMember(reg1, fairnessMap.get(reg1.id) ?? 0),
        toBarShiftMember(reg2, fairnessMap.get(reg2.id) ?? 0),
      ],
    });
  }

  return {
    bar_day_slot_id: slot.id,
    date: slot.date,
    sport: slot.sport as Sport | null,
    shifts,
  };
}
