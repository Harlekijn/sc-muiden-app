import { createSupabaseAdminClient } from '../../../../lib/supabase-admin';
import { GenereerWizard } from './_components/GenereerWizard';

export default async function GenereerRoosterPage() {
  const admin = createSupabaseAdminClient();

  const { data: daySlots } = await admin
    .from('bar_day_slots')
    .select('id, date, starts_at, ends_at, sport, season')
    .is('deleted_at', null)
    .order('date', { ascending: true });

  type SlotRow = NonNullable<typeof daySlots>[number];
  const slots = (daySlots ?? []).map((s: SlotRow) => ({
    id: s.id,
    date: s.date,
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    sport: s.sport,
    season: s.season,
  }));

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <a href="/dashboard/bardienst?tab=day-slots" style={s.back}>← Terug naar bardienst</a>
        <h1 style={s.heading}>Rooster genereren</h1>
      </div>
      <GenereerWizard daySlots={slots} />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  back: { color: '#5a6e8a', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '8px' },
  heading: { fontSize: '24px', fontWeight: 700, color: '#011d50', margin: 0 },
};
