'use client';

import { useState, useMemo } from 'react';
import type { Member, UserRole } from '@sc-muiden/shared';

const ROLE_LABELS: Record<UserRole, string> = {
  lid: 'Lid',
  ouder: 'Ouder',
  trainer: 'Trainer',
  coach: 'Coach',
  teammanager: 'Teammanager',
  commissielid: 'Commissielid',
  beheerder: 'Beheerder',
};

const ROLE_BADGE_STYLES: Partial<Record<UserRole, React.CSSProperties>> = {
  beheerder: { background: 'var(--color-navy)', color: 'var(--color-white)' },
  commissielid: { background: 'var(--color-blue)', color: 'var(--color-white)' },
  trainer: { background: 'rgba(4,107,186,0.1)', color: 'var(--color-blue)' },
  coach: { background: 'rgba(4,107,186,0.1)', color: 'var(--color-blue)' },
  teammanager: { background: 'rgba(4,107,186,0.1)', color: 'var(--color-blue)' },
  lid: { background: 'var(--color-light)', color: 'var(--color-text)' },
  ouder: { background: 'var(--color-light)', color: 'var(--color-text)' },
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
          <span>Rol</span>
          <span>E-mail</span>
          <span />
        </div>

        {paged.length === 0 ? (
          <p style={s.empty}>Geen leden gevonden voor deze zoekopdracht.</p>
        ) : (
          paged.map((m) => (
            <a key={m.id} href={`/dashboard/leden/${m.id}`} style={s.tableLink}>
              <span style={s.nameCell}>{m.first_name} {m.last_name}</span>
              <span style={s.sportCell}>{m.sport.join(', ') || '—'}</span>
              <span>
                <span style={{ ...s.roleBadge, ...(ROLE_BADGE_STYLES[m.role as UserRole] ?? {}) }}>
                  {ROLE_LABELS[m.role as UserRole] ?? m.role}
                </span>
              </span>
              <span style={s.emailCell}>{m.email ?? '—'}</span>
              <span style={s.chevron}>›</span>
            </a>
          ))
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
    gridTemplateColumns: '2fr 1fr 1.2fr 2fr 32px',
    gap: 'var(--space-4)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--color-mid)',
    alignItems: 'center',
  },
  tableLink: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.2fr 2fr 32px',
    gap: 'var(--space-4)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--color-mid)',
    alignItems: 'center',
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
  roleBadge: {
    display: 'inline-block',
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-pill)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
  },
  emailCell: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chevron: {
    color: 'var(--color-text-2)',
    textAlign: 'center',
    fontSize: 18,
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
