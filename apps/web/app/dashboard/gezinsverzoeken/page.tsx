import { createSupabaseServerClient } from '../../../lib/supabase-server';
import { RequestRow, type FamilyRequest } from './_components/RequestRow';

const TABLE_HEADERS = ['Verzocht door', 'Gezinslid', 'Geboortedatum', 'Ingediend op', 'Status'];

function RequestTable({ items, dimmed = false }: { items: FamilyRequest[]; dimmed?: boolean }) {
  return (
    <div style={s.table}>
      <div style={s.tableHeader}>
        {TABLE_HEADERS.map((h) => <span key={h}>{h}</span>)}
      </div>
      {items.map((req) => <RequestRow key={req.id} req={req} dimmed={dimmed} />)}
    </div>
  );
}

export default async function GezinsverzoekPage() {
  const supabase = createSupabaseServerClient();

  const { data: requests, error } = await supabase
    .from('family_link_requests')
    .select('id, first_name, last_name, birth_date, status, created_at, profiles!family_link_requests_profile_id_fkey(display_name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div>
        <h1 style={s.heading}>Gezinsverzoeken</h1>
        <p style={{ color: 'var(--color-error)' }}>Fout bij ophalen van verzoeken.</p>
      </div>
    );
  }

  const items = (requests ?? []) as unknown as FamilyRequest[];
  const pending = items.filter((r) => r.status === 'pending');
  const rest = items.filter((r) => r.status !== 'pending');

  return (
    <div>
      <h1 style={s.heading}>Gezinsverzoeken</h1>
      <p style={s.description}>
        Leden kunnen via de app verzoeken indienen om gezinsleden te koppelen. Koppel het juiste
        lid via Supabase Studio en zet de status op <em>approved</em>.
      </p>

      <h2 style={s.subheading}>In behandeling ({pending.length})</h2>
      {pending.length === 0 ? (
        <p style={s.empty}>Geen openstaande verzoeken.</p>
      ) : (
        <RequestTable items={pending} />
      )}

      {rest.length > 0 && (
        <>
          <h2 style={{ ...s.subheading, marginTop: 'var(--space-10)' }}>
            Afgehandeld ({rest.length})
          </h2>
          <RequestTable items={rest} dimmed />
        </>
      )}
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
  subheading: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-4)',
  },
  empty: {
    color: 'var(--color-text-2)',
    fontStyle: 'italic',
  },
  table: {
    border: '1px solid rgba(1, 29, 80, 0.12)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--color-light)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    gap: 'var(--space-4)',
  },
};
