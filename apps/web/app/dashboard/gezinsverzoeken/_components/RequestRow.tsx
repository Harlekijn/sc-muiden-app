export interface FamilyRequest {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  status: string;
  created_at: string;
  profiles: { display_name: string; email: string }[] | null;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'In behandeling',
  approved: 'Goedgekeurd',
  rejected: 'Afgewezen',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--color-warning)',
  approved: 'var(--color-success)',
  rejected: 'var(--color-error)',
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const badge: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
};

const tableRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
  padding: 'var(--space-4)',
  borderTop: '1px solid rgba(1, 29, 80, 0.06)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text)',
  alignItems: 'center',
  gap: 'var(--space-4)',
  background: 'var(--color-white)',
};

export function RequestRow({ req, dimmed = false }: { req: FamilyRequest; dimmed?: boolean }) {
  const requester = req.profiles?.[0];
  return (
    <div style={{ ...tableRow, opacity: dimmed ? 0.7 : 1 }}>
      <span>
        <strong>{requester?.display_name ?? '–'}</strong>
        <br />
        <small style={{ color: 'var(--color-text-2)' }}>{requester?.email ?? ''}</small>
      </span>
      <span>{req.first_name} {req.last_name}</span>
      <span style={{ color: 'var(--color-text-2)' }}>
        {req.birth_date ? new Date(req.birth_date).toLocaleDateString('nl-NL') : '–'}
      </span>
      <span style={{ color: 'var(--color-text-2)' }}>{formatDate(req.created_at)}</span>
      <span>
        <span style={{
          ...badge,
          background: STATUS_COLORS[req.status] + '20',
          color: STATUS_COLORS[req.status],
        }}>
          {STATUS_LABELS[req.status] ?? req.status}
        </span>
      </span>
    </div>
  );
}
