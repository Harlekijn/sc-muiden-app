import { notFound } from 'next/navigation';
import { createSupabaseAdminClient } from '../../../../../../lib/supabase-admin';
import { BarDaySlotForm } from '../../../_components/BarDaySlotForm';

interface PageProps {
  params: { id: string };
}

export default async function BewerkDaySlotPage({ params }: PageProps) {
  const admin = createSupabaseAdminClient();
  const { data: slot } = await admin
    .from('bar_day_slots')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (!slot) notFound();

  const initialValues = {
    date: slot.date,
    starts_at: slot.starts_at.slice(0, 5),
    ends_at: slot.ends_at.slice(0, 5),
    sport: slot.sport ?? '',
    season: slot.season,
    notes: slot.notes ?? '',
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <a href="/dashboard/bardienst?tab=day-slots" style={s.back}>← Terug naar day-slots</a>
        <h1 style={s.heading}>Day-slot bewerken</h1>
      </div>
      <BarDaySlotForm initialValues={initialValues} slotId={params.id} />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  back: { color: '#5a6e8a', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '8px' },
  heading: { fontSize: '24px', fontWeight: 700, color: '#011d50', margin: 0 },
};
