'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

function MemberSearchField({
  selected,
  onSelect,
}: {
  selected: Member | null;
  onSelect: (m: Member | null) => void;
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
      setResults(json.members ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    void search(val);
  }

  function handleSelect(m: Member) {
    onSelect(m);
    setQuery('');
    setResults([]);
  }

  if (selected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={s.chip}>
          {selected.first_name} {selected.last_name}
          <button type="button" onClick={() => onSelect(null)} style={s.chipRemove}>×</button>
        </span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Zoek lid op naam of e-mail..."
        style={s.input}
      />
      {loading && <span style={s.hint}>Zoeken...</span>}
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
    </div>
  );
}

export function GezinsverzoekActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    if (!selectedMember) {
      setError('Selecteer eerst een lid om te koppelen.');
      return;
    }
    setLoading('approve');
    setError(null);
    try {
      const res = await fetch(`/api/cms/gezinsverzoeken/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: selectedMember.id }),
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
      const res = await fetch(`/api/cms/gezinsverzoeken/${requestId}/reject`, {
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

  return (
    <div style={s.actions}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <MemberSearchField selected={selectedMember} onSelect={setSelectedMember} />
        <button
          type="button"
          onClick={() => void handleApprove()}
          disabled={loading !== null}
          style={{ ...s.btnApprove, opacity: loading !== null ? 0.6 : 1 }}
        >
          {loading === 'approve' ? 'Bezig...' : 'Goedkeuren'}
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
      {error && <div style={s.error}>{error}</div>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  actions: {
    marginTop: 8,
  },
  input: {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid rgba(1, 29, 80, 0.2)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    boxSizing: 'border-box',
    minWidth: 200,
  },
  hint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-2)',
    marginTop: 2,
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
    maxHeight: 200,
    overflowY: 'auto',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 12px',
    fontSize: 'var(--text-sm)',
    borderBottom: '1px solid rgba(1, 29, 80, 0.06)',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(4, 107, 186, 0.12)',
    color: 'var(--color-blue)',
    borderRadius: 999,
    padding: '3px 10px',
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
  btnApprove: {
    background: 'var(--color-navy)',
    color: 'var(--color-white)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 14px',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnReject: {
    background: 'none',
    color: 'var(--color-error)',
    border: '1px solid var(--color-error)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 14px',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  error: {
    marginTop: 6,
    fontSize: 'var(--text-xs)',
    color: 'var(--color-error)',
  },
};
