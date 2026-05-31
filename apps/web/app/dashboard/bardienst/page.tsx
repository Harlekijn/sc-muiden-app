import { createSupabaseServerClient } from '../../../lib/supabase-server';
import { createSupabaseAdminClient } from '../../../lib/supabase-admin';
import { RoosterClient } from './_components/RoosterClient';

export default async function BardienstPage() {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClient();

  const [{ data: roosterActivities }, { data: allMembers }] = await Promise.all([
    admin
      .from('activities')
      .select(`
        id, title, type, sport, starts_at, ends_at,
        bar_assignments(id, member_id, confirmed_at, members(id, first_name, last_name, is_barcommissie))
      `)
      .eq('type', 'bardienst')
      .is('deleted_at', null)
      .order('starts_at', { ascending: true }),
    admin
      .from('members')
      .select('id, first_name, last_name, is_barcommissie')
      .is('deleted_at', null)
      .order('last_name', { ascending: true }),
  ]);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.heading}>Bardienst</h1>
        <a href="/dashboard/bardienst/genereren" style={s.btn}>Genereer rooster</a>
      </div>

      <RoosterClient
        activities={(roosterActivities ?? []).map((a) => ({
          id: a.id,
          title: a.title,
          sport: a.sport,
          starts_at: a.starts_at,
          ends_at: a.ends_at ?? null,
          bar_assignments: (a.bar_assignments ?? []).map((ba) => ({
            id: ba.id,
            member_id: ba.member_id,
            confirmed_at: ba.confirmed_at,
            members: Array.isArray(ba.members) ? ba.members[0] ?? null : ba.members ?? null,
          })),
        }))}
        members={allMembers ?? []}
      />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '32px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
  heading: { fontSize: '24px', fontWeight: 700, color: 'var(--color-navy)', margin: 0 },
  btn: {
    display: 'inline-block', padding: '8px 16px', background: 'var(--color-blue)', color: 'var(--color-white)',
    borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500,
  },
};
