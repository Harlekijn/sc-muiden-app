'use client';

import { useState, useMemo } from 'react';
import type { Member, LidType } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../../lib/supabase-client';

export const LID_TYPE_LABELS: Record<LidType, string> = {
  'jeugdlid': 'Jeugdlid',
  'niet-spelend-lid': 'Niet-spelend lid',
  'trainingslid': 'Trainingslid',
  'spelend-lid': 'Spelend lid',
  'relatie': 'Relatie',
};

const PAGE_SIZE = 50;

type SportFilter = 'alle' | 'voetbal' | 'hockey';

interface Props {
  members: Member[];
}

export function LedenClient({ members }: Props) {
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState<SportFilter>('alle');
  const [page, setPage] = useState(0);
  const [inlineTypes, setInlineTypes] = useState<Record<string, LidType | null>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter((m) => {
      const matchesSearch =
        !q ||
        m.first_name.toLowerCase().includes(q) ||
        m.last_name.toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q);
      const matchesSport =
        sportFilter === 'alle' || m.sport.includes(sportFilter);
      return matchesSearch && matchesSport;
    });
  }, [members, search, sportFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSearch(v: string) {
    setSearch(v);
    setPage(0);
  }

  function handleSportFilter(v: SportFilter) {
    setSportFilter(v);
    setPage(0);
  }

  async function handleLidTypeChange(memberId: string, prevType: LidType | null, newValue: string) {
    const newType = newValue === '' ? null : (newValue as LidType);
    setInlineTypes((prev) => ({ ...prev, [memberId]: newType }));
    setSavingId(memberId);
    setErrorId(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from('members')
      .update({ lid_type: newType })
      .eq('id', memberId);

    setSavingId(null);
    if (error) {
      setInlineTypes((prev) => ({ ...prev, [memberId]: prevType }));
      setErrorId(memberId);
    }
  }

  function getCurrentType(m: Member): LidType | null {
    return m.id in inlineTypes ? inlineTypes[m.id] : m.lid_type;
  }

  return (
    <div>
      <div style={s.toolbar}>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>&#128269;</span>
          <input
            type="search"
            placeholder="Zoek op naam of e-mail"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={s.searchInput}
            aria-label="Zoek leden"
          />
        </div>

        <div style={s.sportFilters}>
          {(['alle', 'voetbal', 'hockey'] as SportFilter[]).map((v) => (
            <button
              key={v}
              onClick={() => handleSportFilter(v)}
              style={{
                ...s.filterBtn,
                ...(sportFilter === v ? s.filterBtnActive : {}),
              }}
            >
              {v === 'alle' ? 'Alle' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <a href="/dashboard/leden/importeren" style={s.importBtn}>
          Importeren
        </a>
      </div>

      <p style={s.count}>{filtered.length} {filtered.length === 1 ? 'lid' : 'leden'}</p>

      <div style={s.table}>
        <div style={{ ...s.tableRow, ...s.tableHeader }}>
          <span>Naam</span>
          <span>Sport</span>
          <span>Ledentype</span>
          <span>E-mail</span>
          <span />
        </div>

        {paged.length === 0 ? (
          <p style={s.empty}>Geen leden gevonden voor deze zoekopdracht.</p>
        ) : (
          paged.map((m) => {
            const currentType = getCurrentType(m);
            const isSaving = savingId === m.id;
            const hasError = errorId === m.id;
            return (
              <div key={m.id} style={s.tableRow}>
                <a href={`/dashboard/leden/${m.id}`} style={s.nameLink}>
                  <span style={s.nameCell}>{m.first_name} {m.last_name}</span>
                </a>
                <span style={s.sportCell}>{m.sport.join(', ') || '—'}</span>
                <span style={s.typeCell}>
                  <select
                    value={currentType ?? ''}
                    onChange={(e) => handleLidTypeChange(m.id, currentType, e.target.value)}
                    disabled={isSaving}
                    style={{
                      ...s.inlineSelect,
                      ...(isSaving ? s.inlineSelectSaving : {}),
                      ...(hasError ? s.inlineSelectError : {}),
                    }}
                    aria-label={`Ledentype van ${m.first_name} ${m.last_name}`}
                  >
                    <option value="">—</option>
                    {(Object.entries(LID_TYPE_LABELS) as [LidType, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  {hasError && <span style={s.inlineError}>Niet opgeslagen</span>}
                </span>
                <a href={`/dashboard/leden/${m.id}`} style={s.emailCell}>{m.email ?? '—'}</a>
                <a href={`/dashboard/leden/${m.id}`} style={s.chevron}>›</a>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div style={s.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ ...s.pageBtn, ...(page === 0 ? s.pageBtnDisabled : {}) }}
          >
            Vorige
          </button>
          <span style={s.pageInfo}>{page + 1} van {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{ ...s.pageBtn, ...(page >= totalPages - 1 ? s.pageBtnDisabled : {}) }}
          >
            Volgende
          </button>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  toolbar: {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 'var(--space-4)',
  },
  searchWrap: {
    position: 'relative',
    flex: '1',
    minWidth: 200,
  },
  searchIcon: {
    position: 'absolute',
    left: 'var(--space-3)',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 14,
    color: 'var(--color-text-2)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: 'var(--space-2) var(--space-3) var(--space-2) 36px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-mid)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  sportFilters: {
    display: 'flex',
    gap: 'var(--space-1)',
  },
  filterBtn: {
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-light)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    cursor: 'pointer',
  },
  filterBtnActive: {
    background: 'var(--color-navy)',
    color: 'var(--color-white)',
  },
  importBtn: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-blue)',
    color: 'var(--color-blue)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  count: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-2)',
    marginBottom: 'var(--space-3)',
  },
  table: {
    border: '1px solid var(--color-mid)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  tableHeader: {
    background: 'var(--color-light)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.4fr 2fr 32px',
    gap: 'var(--space-4)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--color-mid)',
    alignItems: 'center',
  },
  nameLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  nameCell: {
    fontWeight: 600,
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
  },
  sportCell: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-2)',
    textTransform: 'capitalize',
  },
  typeCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  inlineSelect: {
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-mid)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    background: 'var(--color-white)',
    cursor: 'pointer',
    maxWidth: 140,
  },
  inlineSelectSaving: {
    opacity: 0.6,
    cursor: 'default',
  },
  inlineSelectError: {
    borderColor: 'var(--color-error)',
  },
  inlineError: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-error)',
    whiteSpace: 'nowrap',
  },
  emailCell: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  },
  chevron: {
    color: 'var(--color-text-2)',
    textAlign: 'center',
    fontSize: 18,
    textDecoration: 'none',
  },
  empty: {
    padding: 'var(--space-8) var(--space-4)',
    color: 'var(--color-text-2)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    marginTop: 'var(--space-4)',
    justifyContent: 'center',
  },
  pageBtn: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-mid)',
    background: 'var(--color-white)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
  },
  pageBtnDisabled: {
    opacity: 0.4,
    cursor: 'default',
  },
  pageInfo: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-2)',
  },
};
