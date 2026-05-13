import { createSupabaseServerClient } from '../../../lib/supabase-server';
import type { Member } from '@sc-muiden/shared';
import { LedenClient } from './_components/LedenClient';

export default async function LedenPage() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('members')
    .select('id, first_name, last_name, birth_date, email, phone, sport, lid_type, is_vrijwilliger, is_barcommissie, clubbase_id, created_at, updated_at, deleted_at')
    .is('deleted_at', null)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.heading}>Leden</h1>
      </div>

      {error ? (
        <p style={{ color: 'var(--color-error)' }}>
          Leden konden niet worden geladen. Probeer de pagina te vernieuwen.
        </p>
      ) : (
        <LedenClient members={(data ?? []) as Member[]} />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--space-6)',
  },
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    margin: 0,
  },
};
