'use client';

import { useState } from 'react';
import type { Member, TeamMemberRole } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../../../lib/supabase-client';

interface TeamMemberRow {
  id: string;
  member_id: string;
  role: string;
  jersey_number: number | null;
  member: Pick<Member, 'id' | 'first_name' | 'last_name' | 'sport'> | null;
}

interface Props {
  teamId: string;
  initialMembers: TeamMemberRow[];
}

const TEAM_ROLES: TeamMemberRole[] = ['speler', 'trainer', 'coach', 'teammanager'];

export function TeamLedenTab({ teamId, initialMembers }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [addRole, setAddRole] = useState<TeamMemberRole>('speler');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleSearch(q: string) {
    setSearchQ(q);
    setSelectedMember(null);
    if (!q.trim()) { setSearchResults([]); return; }

    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from('members')
      .select('id, first_name, last_name, sport, role, email, phone, birth_date, clubbase_id, created_at, updated_at, deleted_at')
      .is('deleted_at', null)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(5);

    setSearchResults((data ?? []) as Member[]);
  }

  async function handleAdd() {
    if (!selectedMember) return;
    setAddError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: inserted, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        member_id: selectedMember.id,
        role: addRole,
        jersey_number: jerseyNumber ? parseInt(jerseyNumber, 10) : null,
      })
      .select('id, member_id, role, jersey_number')
      .single();

    if (error) {
      if (error.code === '23505') {
        setAddError('Dit lid is al gekoppeld aan dit team.');
      } else {
        setAddError('Lid toevoegen mislukt. Probeer het opnieuw.');
      }
      return;
    }

    setMembers((prev) => [
      ...prev,
      {
        id: inserted.id,
        member_id: inserted.member_id,
        role: inserted.role,
        jersey_number: inserted.jersey_number,
        member: {
          id: selectedMember.id,
          first_name: selectedMember.first_name,
          last_name: selectedMember.last_name,
          sport: selectedMember.sport,
        },
      },
    ]);
    setShowAdd(false);
    setSearchQ('');
    setSearchResults([]);
    setSelectedMember(null);
    setAddRole('speler');
    setJerseyNumber('');
  }

  async function handleRemove(tmId: string) {
    if (!confirm('Weet je zeker dat je dit lid uit het team wilt verwijderen?')) return;
    setRemovingId(tmId);
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from('team_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', tmId);
    setMembers((prev) => prev.filter((m) => m.id !== tmId));
    setRemovingId(null);
  }

  return (
    <div>
      <div style={s.header}>
        <button onClick={() => setShowAdd(true)} style={s.addBtn} disabled={showAdd}>
          + Lid toevoegen
        </button>
      </div>

      {showAdd && (
        <div style={s.addPanel}>
          <h3 style={s.addTitle}>Lid toevoegen</h3>
          <div style={s.addGrid}>
            <div style={s.searchWrap}>
              <input
                type="search"
                placeholder="Zoek op naam of e-mail"
                value={searchQ}
                onChange={(e) => handleSearch(e.target.value)}
                style={s.input}
              />
              {searchResults.length > 0 && !selectedMember && (
                <div style={s.dropdown}>
                  {searchResults.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { setSelectedMember(m); setSearchQ(`${m.first_name} ${m.last_name}`); setSearchResults([]); }}
                      style={s.dropdownItem}
                    >
                      {m.first_name} {m.last_name}
                      {m.sport.length > 0 && <span style={s.dropdownSport}>{m.sport.join(', ')}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as TeamMemberRole)}
              style={s.select}
            >
              {TEAM_ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Rugnr."
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              style={{ ...s.input, width: 80 }}
              min={1}
              max={99}
            />
          </div>

          {addError && <p style={s.errorText}>{addError}</p>}

          <div style={s.addActions}>
            <button onClick={handleAdd} disabled={!selectedMember} style={s.primaryBtn}>
              Toevoegen
            </button>
            <button onClick={() => { setShowAdd(false); setAddError(null); }} style={s.cancelBtn}>
              Annuleren
            </button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <p style={s.empty}>Nog geen leden gekoppeld aan dit team.</p>
      ) : (
        <div style={s.table}>
          <div style={{ ...s.row, ...s.tableHeader }}>
            <span>Naam</span>
            <span>Rol</span>
            <span>Rugnr.</span>
            <span />
          </div>
          {members.map((tm) => (
            <div key={tm.id} style={s.row}>
              <span style={s.nameCell}>
                {tm.member
                  ? <a href={`/dashboard/leden/${tm.member_id}`} style={s.memberLink}>{tm.member.first_name} {tm.member.last_name}</a>
                  : '—'}
              </span>
              <span>
                <span style={s.roleBadge}>{tm.role}</span>
              </span>
              <span style={s.cellMuted}>{tm.jersey_number != null ? `#${tm.jersey_number}` : '—'}</span>
              <span>
                <button
                  onClick={() => handleRemove(tm.id)}
                  disabled={removingId === tm.id}
                  style={s.removeBtn}
                  aria-label={`Verwijder ${tm.member?.first_name ?? ''}`}
                >
                  ✕
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' },
  addBtn: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-navy)', color: 'var(--color-white)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer', minHeight: 40 },
  addPanel: { background: 'var(--color-light)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)', border: '1px solid var(--color-mid)' },
  addTitle: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-4)', marginTop: 0 },
  addGrid: { display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', flexWrap: 'wrap' },
  searchWrap: { position: 'relative', flex: 1, minWidth: 200 },
  input: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', color: 'var(--color-text)', outline: 'none', width: '100%', boxSizing: 'border-box' },
  select: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', color: 'var(--color-text)', background: 'var(--color-white)' },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--color-white)', border: '1px solid var(--color-mid)', borderRadius: 'var(--radius-md)', zIndex: 10, boxShadow: 'var(--shadow-elevated)' },
  dropdownItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: 'var(--space-2) var(--space-3)', border: 'none', background: 'none', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left' },
  dropdownSport: { fontSize: 'var(--text-xs)', color: 'var(--color-text-2)', marginLeft: 'var(--space-2)' },
  errorText: { color: 'var(--color-error)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' },
  addActions: { display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' },
  primaryBtn: { padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-navy)', color: 'var(--color-white)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer', minHeight: 40 },
  cancelBtn: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', background: 'none', color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', fontWeight: 500, cursor: 'pointer', minHeight: 40 },
  empty: { color: 'var(--color-text-2)', fontStyle: 'italic', padding: 'var(--space-4) 0' },
  table: { border: '1px solid var(--color-mid)', borderRadius: 'var(--radius-md)', overflow: 'hidden' },
  tableHeader: { background: 'var(--color-light)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  row: { display: 'grid', gridTemplateColumns: '2fr 120px 80px 40px', gap: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-mid)', alignItems: 'center' },
  nameCell: { fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)' },
  memberLink: { color: 'var(--color-blue)', textDecoration: 'none', fontWeight: 600, fontSize: 'var(--text-sm)' },
  roleBadge: { display: 'inline-block', padding: '2px var(--space-2)', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 600, background: 'rgba(4,107,186,0.1)', color: 'var(--color-blue)', textTransform: 'capitalize' },
  cellMuted: { fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' },
  removeBtn: { padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-mid)', background: 'none', color: 'var(--color-error)', fontSize: 12, cursor: 'pointer' },
};
