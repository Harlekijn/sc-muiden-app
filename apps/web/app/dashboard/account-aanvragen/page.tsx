import { createSupabaseServerClient } from '../../../lib/supabase-server';
import type { AccountRequest } from '@sc-muiden/shared';
import { AccountAanvragenClient } from './_components/AccountAanvragenClient';

export default async function AccountAanvragenPage() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('account_requests')
    .select('id, display_name, email, birth_date, status, admin_notes, reviewed_by, reviewed_at, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div>
        <h1 style={s.heading}>Account aanvragen</h1>
        <p style={{ color: 'var(--color-error)' }}>Fout bij ophalen van aanvragen.</p>
      </div>
    );
  }

  const requests = (data ?? []) as AccountRequest[];

  return (
    <div>
      <h1 style={s.heading}>Account aanvragen</h1>
      <p style={s.description}>
        Leden kunnen via de app een account aanvragen. Koppel de aanvrager aan het juiste lid
        en keur de aanvraag goed — de gebruiker ontvangt dan een activatiemail van Supabase.
      </p>

      <AccountAanvragenClient requests={requests} />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-2xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-2)',
  },
  description: {
    color: 'var(--color-text-2)',
    marginBottom: 'var(--space-8)',
    lineHeight: 1.6,
    maxWidth: 640,
  },
};
