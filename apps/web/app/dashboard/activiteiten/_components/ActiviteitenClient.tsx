'use client';

import { useState } from 'react';
import { formatDutchDateTime } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../../lib/supabase-client';

const TYPE_LABELS: Record<string, string> = {
  alle: 'Alle',
  training: 'Training',
  wedstrijd: 'Wedstrijd',
  bardienst: 'Bardienst',
  clubactiviteit: 'Clubactiviteit',
};

const TYPE_BADGE: Record<string, React.CSSProperties> = {
  training: { background: 'var(--color-light)', color: 'var(--color-text)' },
  wedstrijd: { background: 'var(--color-navy)', color: 'var(--color-white)' },
  bardienst: { background: 'rgba(245,197,24,0.15)', color: 'var(--color-warning)' },
  clubactiviteit: { background: 'rgba(4,107,186,0.12)', color: 'var(--color-blue)' },
};

interface ActivityRow {
  id: string;
  type: string;
  sport: string | null;
  team_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  recurring_rule_id: string | null;
  is_generated: boolean;
  teams: { id: string; name: string; sport: string } | null;
}

interface Props {
  activities: ActivityRow[];
  currentType: string;
  currentPeriode: string;
  currentSport: string;
}

export function ActiviteitenClient({ activities, currentType, currentPeriode, currentSport }: Props) {
  const [typeFilter, setTypeFilter] = useState(currentType);
  const [periodeFilter, _setPeriodeFilter] = useState(currentPeriode);
  const [sportFilter, setSportFilter] = useState(currentSport);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());

  const filtered = activities.filter((a) => {
    if (cancelledIds.has(a.id)) return false;
    if (typeFilter !== 'alle' && a.type !== typeFilter) return false;
    if (sportFilter !== 'alle' && a.sport !== sportFilter) return false;
    return true;
  });

  function buildFiltersUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      type: typeFilter,
      periode: periodeFilter,
      sport: sportFilter,
      ...overrides,
    });
    return `/dashboard/activiteiten?${params.toString()}`;
  }

  async function handleCancel(act: ActivityRow) {
    if (act.type === 'wedstrijd') return;
    if (!confirm('Weet je zeker dat je deze activiteit wilt annuleren? Deelnemers ontvangen geen automatische notificatie.')) return;

    setCancellingId(act.id);
    const supabase = createSupabaseBrowserClient();

    if (act.is_generated && act.recurring_rule_id) {
      // Een gegenereerde occurrence afgelasten: insert een override-Activity met
      // deleted_at gevuld. De view excludeert dan de generated row.
      await supabase.from('activities').insert({
        type: 'training',
        team_id: act.team_id,
        sport: act.sport,
        title: act.title,
        starts_at: act.starts_at,
        ends_at: act.ends_at,
        location: act.location,
        notes: act.notes,
        recurring_rule_id: act.recurring_rule_id,
        deleted_at: new Date().toISOString(),
      });
    } else {
      await supabase
        .from('activities')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', act.id);
    }

    setCancelledIds((prev) => new Set([...prev, act.id]));
    setCancellingId(null);
  }

  return (
    <div>
      <div style={s.filterBar}>
        <div style={s.filterGroup}>
          {Object.keys(TYPE_LABELS).map((t) => (
            <a
              key={t}
              href={buildFiltersUrl({ type: t })}
              onClick={(e) => { e.preventDefault(); setTypeFilter(t); }}
              style={{ ...s.filterBtn, ...(typeFilter === t ? s.filterBtnActive : {}) }}
            >
              {TYPE_LABELS[t]}
            </a>
          ))}
        </div>
        <div style={s.filterGroup}>
          {(['aankomend', 'verleden'] as const).map((p) => (
            <a
              key={p}
              href={buildFiltersUrl({ periode: p })}
              style={{ ...s.filterBtn, ...(periodeFilter === p ? s.filterBtnActive : {}) }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </a>
          ))}
        </div>
        <div style={s.filterGroup}>
          {(['alle', 'voetbal', 'hockey'] as const).map((sp) => (
            <a
              key={sp}
              href={buildFiltersUrl({ sport: sp })}
              onClick={(e) => { e.preventDefault(); setSportFilter(sp); }}
              style={{ ...s.filterBtn, ...(sportFilter === sp ? s.filterBtnActive : {}) }}
            >
              {sp === 'alle' ? 'Alle sporten' : sp.charAt(0).toUpperCase() + sp.slice(1)}
            </a>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={s.empty}>Geen activiteiten gevonden voor de gekozen filters.</p>
      ) : (
        <div style={s.table}>
          <div style={{ ...s.row, ...s.tableHeader }}>
            <span>Datum</span>
            <span>Type</span>
            <span>Sport</span>
            <span>Team</span>
            <span>Titel</span>
            <span>Acties</span>
          </div>
          {filtered.map((act) => (
            <div key={act.id} style={s.row}>
              <span style={s.dateCell}>{formatDutchDateTime(act.starts_at)}</span>
              <span>
                <span style={{ ...s.badge, ...(TYPE_BADGE[act.type] ?? {}) }}>
                  {TYPE_LABELS[act.type] ?? act.type}
                </span>
              </span>
              <span style={s.cell}>{act.sport ? act.sport.charAt(0).toUpperCase() + act.sport.slice(1) : '—'}</span>
              <span style={s.cell}>{act.teams?.name ?? '—'}</span>
              <span style={s.titleCell}>{act.title}</span>
              <span style={s.actions}>
                {act.type === 'wedstrijd' ? (
                  <span style={s.lockIcon} title="Via federatiesync">&#128274;</span>
                ) : (
                  <>
                    <a
                      href={`/dashboard/activiteiten/${act.id}/bewerken`}
                      style={s.actionLink}
                      title="Bewerken"
                    >
                      ✏
                    </a>
                    <button
                      onClick={() => handleCancel(act)}
                      disabled={cancellingId === act.id}
                      style={s.cancelBtn}
                      title="Annuleren"
                    >
                      ✕
                    </button>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  filterBar: { display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' },
  filterGroup: { display: 'flex', gap: 'var(--space-1)' },
  filterBtn: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-light)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
  filterBtnActive: { background: 'var(--color-navy)', color: 'var(--color-white)' },
  empty: { color: 'var(--color-text-2)', fontStyle: 'italic' },
  table: { border: '1px solid var(--color-mid)', borderRadius: 'var(--radius-md)', overflow: 'hidden' },
  tableHeader: { background: 'var(--color-light)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  row: { display: 'grid', gridTemplateColumns: '180px 120px 80px 160px 1fr 80px', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-mid)', alignItems: 'center' },
  badge: { display: 'inline-block', padding: '2px var(--space-2)', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.03em' },
  dateCell: { fontSize: 'var(--text-xs)', color: 'var(--color-text)' },
  cell: { fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' },
  titleCell: { fontSize: 'var(--text-sm)', color: 'var(--color-text)', fontWeight: 500 },
  actions: { display: 'flex', gap: 'var(--space-2)', alignItems: 'center' },
  lockIcon: { fontSize: 14, color: 'var(--color-text-2)', cursor: 'default' },
  actionLink: { fontSize: 14, color: 'var(--color-text-2)', textDecoration: 'none', cursor: 'pointer' },
  cancelBtn: { border: 'none', background: 'none', color: 'var(--color-error)', fontSize: 14, cursor: 'pointer', padding: 2 },
};
