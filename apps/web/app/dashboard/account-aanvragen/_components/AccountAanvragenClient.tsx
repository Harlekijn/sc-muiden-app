'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { AccountRequest } from '@sc-muiden/shared';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'In behandeling',
  approved: 'Goedgekeurd',
  rejected: 'Afgewezen',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--color-warning)',
  approved: 'var(--color-success)',
  rejected: 'var(--color-error)',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      background: (STATUS_COLORS[status] ?? 'var(--color-text-2)') + '20',
      color: STATUS_COLORS[status] ?? 'var(--color-text-2)',
    }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function MemberSearchField({
  selectedMembers,
  onAdd,
  onRemove,
}: {
  selectedMembers: Member[];
  onAdd: (m: Member) => void;
  onRemove: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/cms/members/search?q=${encodeURIComponent(q)}`);
      const json = await res.json() as { members?: Member[] };
      setResults((json.members ?? []).filter((m) => !selectedMembers.find((s) => s.id === m.id)));
    } finally {
      setLoading(false);
    }
  }, [selectedMembers]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    void search(val);
  }

  function handleSelect(m: Member) {
    onAdd(m);
    setQuery('');
    setResults([]);
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Zoek op naam of e-mail..."
        style={s.searchInput}
      />
      {loading && <span style={s.searchHint}>Zoeken...</span>}
      {results.length > 0 && (
        <div style={s.dropdown}>
          {results.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelect(m)}
              style={s.dropdownItem}
            >
              <strong>{m.first_name} {m.last_name}</strong>
              {m.email && <span style={{ color: 'var(--color-text-2)', marginLeft: 8, fontSize: 'var(--text-xs)' }}>{m.email}</span>}
            </button>
          ))}
        </div>
      )}
      {selectedMembers.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selectedMembers.map((m) => (
            <span key={m.id} style={s.memberChip}>
              {m.first_name} {m.last_name}
              <button type="button" onClick={() => onRemove(m.id)} style={s.chipRemove}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountAanvraagRow({
  req,
  dimmed,
}: {
  req: AccountRequest;
  dimmed: boolean;
}) {
  const router = useRouter();
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  function addMember(m: Member) {
    setSelectedMembers((prev) => [...prev, m]);
  }

  function removeMember(id: string) {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleApprove() {
    if (selectedMembers.length === 0) {
      setError('Selecteer minimaal één lid om te koppelen.');
      return;
    }
    setLoading('approve');
    setError(null);
    try {
      const res = await fetch(`/api/cms/account-requests/${req.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_ids: selectedMembers.map((m) => m.id) }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? 'Er is een fout opgetreden.'); return; }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading('reject');
    setError(null);
    try {
      const res = await fetch(`/api/cms/account-requests/${req.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? 'Er is een fout opgetreden.'); return; }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (dimmed) {
    return (
      <div style={{ ...s.row, opacity: 0.7 }}>
        <div>
          <strong>{req.display_name}</strong>
          <div style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-xs)' }}>{req.email}</div>
        </div>
        <div style={{ color: 'var(--color-text-2)' }}>
          {req.birth_date ? new Date(req.birth_date).toLocaleDateString('nl-NL') : '–'}
        </div>
        <div style={{ color: 'var(--color-text-2)' }}>{formatDate(req.created_at)}</div>
        <div><StatusBadge status={req.status} /></div>
      </div>
    );
  }

  return (
    <div style={s.pendingCard}>
      <div style={s.pendingCardHeader}>
        <div>
          <strong style={{ fontSize: 'var(--text-md)', color: 'var(--color-navy)' }}>{req.display_name}</strong>
          <div style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }}>{req.email}</div>
          {req.birth_date && (
            <div style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)', marginTop: 2 }}>
              Geboortedatum: {new Date(req.birth_date).toLocaleDateString('nl-NL')}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-2)', marginBottom: 4 }}>Ingediend op</div>
          <div style={{ fontSize: 'var(--text-sm)' }}>{formatDate(req.created_at)}</div>
        </div>
      </div>

      <div style={s.pendingCardBody}>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', marginBottom: 6 }}>
          Zoek en selecteer het lid (of leden) om te koppelen aan dit account:
        </div>
        <MemberSearchField
          selectedMembers={selectedMembers}
          onAdd={addMember}
          onRemove={removeMember}
        />
      </div>

      {error && (
        <div style={s.errorBanner}>{error}</div>
      )}

      <div style={s.pendingCardFooter}>
        <button
          type="button"
          onClick={() => void handleApprove()}
          disabled={loading !== null}
          style={{ ...s.btnApprove, opacity: loading !== null ? 0.6 : 1 }}
        >
          {loading === 'approve' ? 'Bezig...' : 'Goedkeuren en uitnodigen'}
        </button>
        <button
          type="button"
          onClick={() => void handleReject()}
          disabled={loading !== null}
          style={{ ...s.btnReject, opacity: loading !== null ? 0.6 : 1 }}
        >
          {loading === 'reject' ? 'Bezig...' : 'Afwijzen'}
        </button>
      </div>
    </div>
  );
}

export function AccountAanvragenClient({ requests }: { requests: AccountRequest[] }) {
  const [tab, setTab] = useState<'pending' | 'afgehandeld'>('pending');
  const pending = requests.filter((r) => r.status === 'pending');
  const afgehandeld = requests.filter((r) => r.status !== 'pending');

  return (
    <div>
      <div style={s.tabs}>
        <button
          type="button"
          onClick={() => setTab('pending')}
          style={tab === 'pending' ? { ...s.tab, ...s.tabActive } : s.tab}
        >
          In behandeling ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('afgehandeld')}
          style={tab === 'afgehandeld' ? { ...s.tab, ...s.tabActive } : s.tab}
        >
          Afgehandeld ({afgehandeld.length})
        </button>
      </div>

      {tab === 'pending' && (
        <div>
          {pending.length === 0 ? (
            <p style={s.empty}>Geen openstaande aanvragen.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pending.map((req) => (
                <AccountAanvraagRow key={req.id} req={req} dimmed={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'afgehandeld' && (
        <div>
          {afgehandeld.length === 0 ? (
            <p style={s.empty}>Nog geen afgehandelde aanvragen.</p>
          ) : (
            <div style={s.table}>
              <div style={s.tableHeader}>
                {['Naam', 'Geboortedatum', 'Ingediend op', 'Status'].map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
              {afgehandeld.map((req) => (
                <AccountAanvraagRow key={req.id} req={req} dimmed={true} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  tabs: {
    display: 'flex',
    borderBottom: '2px solid rgba(1, 29, 80, 0.12)',
    marginBottom: 24,
  },
  tab: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '10px 20px',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: 'var(--color-text-2)',
    borderBottom: '2px solid transparent',
    marginBottom: -2,
  },
  tabActive: {
    color: 'var(--color-navy)',
    borderBottomColor: 'var(--color-navy)',
    fontWeight: 600,
  },
  empty: {
    color: 'var(--color-text-2)',
    fontStyle: 'italic',
  },
  pendingCard: {
    border: '1px solid rgba(1, 29, 80, 0.12)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    background: 'var(--color-white)',
  },
  pendingCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 'var(--space-4)',
    borderBottom: '1px solid rgba(1, 29, 80, 0.06)',
    background: 'var(--color-light)',
  },
  pendingCardBody: {
    padding: 'var(--space-4)',
    borderBottom: '1px solid rgba(1, 29, 80, 0.06)',
  },
  pendingCardFooter: {
    display: 'flex',
    gap: 8,
    padding: 'var(--space-3) var(--space-4)',
  },
  errorBanner: {
    padding: 'var(--space-2) var(--space-4)',
    background: 'rgba(214, 60, 60, 0.08)',
    color: 'var(--color-error)',
    fontSize: 'var(--text-sm)',
  },
  btnApprove: {
    background: 'var(--color-navy)',
    color: 'var(--color-white)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 16px',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnReject: {
    background: 'none',
    color: 'var(--color-error)',
    border: '1px solid var(--color-error)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 16px',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid rgba(1, 29, 80, 0.2)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    boxSizing: 'border-box',
  },
  searchHint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-2)',
    marginTop: 4,
    display: 'block',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'var(--color-white)',
    border: '1px solid rgba(1, 29, 80, 0.15)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: '0 4px 12px rgba(1, 29, 80, 0.12)',
    zIndex: 10,
    maxHeight: 240,
    overflowY: 'auto',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '10px 12px',
    fontSize: 'var(--text-sm)',
    borderBottom: '1px solid rgba(1, 29, 80, 0.06)',
  },
  memberChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(4, 107, 186, 0.12)',
    color: 'var(--color-blue)',
    borderRadius: 999,
    padding: '2px 10px',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
  },
  chipRemove: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-blue)',
    fontSize: 14,
    lineHeight: 1,
    padding: 0,
  },
  table: {
    border: '1px solid rgba(1, 29, 80, 0.12)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--color-light)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    gap: 'var(--space-4)',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    padding: 'var(--space-4)',
    borderTop: '1px solid rgba(1, 29, 80, 0.06)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    alignItems: 'center',
    gap: 'var(--space-4)',
    background: 'var(--color-white)',
  },
};
