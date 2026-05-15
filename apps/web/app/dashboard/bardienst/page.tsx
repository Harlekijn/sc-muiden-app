import { createSupabaseServerClient } from '../../../lib/supabase-server';
import { createSupabaseAdminClient } from '../../../lib/supabase-admin';
import { DaySlotsTab } from './_components/DaySlotsTab';
import { RoosterTab } from './_components/RoosterTab';

interface PageProps {
  searchParams: { tab?: string };
}

export default async function BardienstPage({ searchParams }: PageProps) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;

  const activeTab = searchParams.tab === 'rooster' ? 'rooster' : 'day-slots';
  const admin = createSupabaseAdminClient();

  const { data: daySlots } = await admin
    .from('bar_day_slots')
    .select('*')
    .is('deleted_at', null)
    .order('date', { ascending: true });

  const { data: roosterActivities } = await admin
    .from('activities')
    .select(`
      id, title, type, sport, starts_at, ends_at, bar_day_slot_id,
      bar_assignments(id, member_id, confirmed_at, members(id, first_name, last_name))
    `)
    .eq('type', 'bardienst')
    .not('bar_day_slot_id', 'is', null)
    .is('deleted_at', null)
    .order('starts_at', { ascending: true });

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.heading}>Bardienst</h1>
      </div>

      <div style={s.tabBar}>
        <a href="/dashboard/bardienst?tab=day-slots" style={activeTab === 'day-slots' ? s.tabActive : s.tab}>
          Day slots
        </a>
        <a href="/dashboard/bardienst?tab=rooster" style={activeTab === 'rooster' ? s.tabActive : s.tab}>
          Rooster
        </a>
      </div>

      {activeTab === 'day-slots' && <DaySlotsTab daySlots={daySlots ?? []} />}
      {activeTab === 'rooster' && (
        <RoosterTab
          activities={(roosterActivities ?? []).map((a) => ({
            id: a.id,
            title: a.title,
            sport: a.sport,
            starts_at: a.starts_at,
            ends_at: a.ends_at ?? null,
            bar_day_slot_id: a.bar_day_slot_id,
            bar_assignments: (a.bar_assignments ?? []).map((ba) => ({
              id: ba.id,
              member_id: ba.member_id,
              confirmed_at: ba.confirmed_at,
              members: Array.isArray(ba.members) ? ba.members[0] ?? null : ba.members ?? null,
            })),
          }))}
        />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '32px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
  heading: { fontSize: '24px', fontWeight: 700, color: '#011d50', margin: 0 },
  tabBar: { display: 'flex', gap: '4px', borderBottom: '2px solid #dde5f0', marginBottom: '24px' },
  tab: {
    padding: '10px 16px', fontSize: '14px', fontWeight: 500, color: '#5a6e8a',
    textDecoration: 'none', borderBottom: '2px solid transparent', marginBottom: '-2px',
  },
  tabActive: {
    padding: '10px 16px', fontSize: '14px', fontWeight: 600, color: '#046bba',
    textDecoration: 'none', borderBottom: '2px solid #046bba', marginBottom: '-2px',
  },
};
