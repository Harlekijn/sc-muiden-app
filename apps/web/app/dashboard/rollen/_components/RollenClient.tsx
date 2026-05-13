'use client';

import { useState } from 'react';
import type { UserRole } from '@sc-muiden/shared';
import type { ProfileRow } from '../page';
import { createSupabaseBrowserClient } from '../../../../lib/supabase-client';

const ROLE_LABELS: Record<UserRole, string> = {
  lid: 'Lid',
  beheerder: 'Beheerder',
};

const ROLE_OPTIONS: UserRole[] = ['lid', 'beheerder'];

interface Props {
  profiles: ProfileRow[];
  currentUserId: string;
}

export function RollenClient({ profiles, currentUserId }: Props) {
  const [rows, setRows] = useState(profiles);
  const [pending, setPending] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ profileId: string; name: string; newRole: UserRole } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function requestChange(profileId: string, name: string, newRole: UserRole) {
    setConfirm({ profileId, name, newRole });
  }

  async function applyChange() {
    if (!confirm) return;
    setPending(confirm.profileId);
    setErrorMsg(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from('profiles')
      .update({ role: confirm.newRole })
      .eq('id', confirm.profileId);

    setPending(null);
    setConfirm(null);

    if (error) {
      setErrorMsg('Rol wijzigen mislukt. Probeer het opnieuw.');
      return;
    }

    setRows((prev) =>
      prev.map((r) => r.id === confirm.profileId ? { ...r, role: confirm.newRole } : r)
    );
  }

  return (
    <div>
      {errorMsg && <p style={s.errorBanner}>{errorMsg}</p>}

      {confirm && (
        <div style={s.overlay}>
          <div style={s.dialog}>
            <p style={s.dialogText}>
              Rol van <strong>{confirm.name}</strong> wijzigen naar <strong>{ROLE_LABELS[confirm.newRole]}</strong>?
            </p>
            <div style={s.dialogActions}>
              <button onClick={applyChange} style={s.confirmBtn}>Bevestigen</button>
              <button onClick={() => setConfirm(null)} style={s.cancelBtn}>Annuleren</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Naam</th>
              <th style={s.th}>E-mail</th>
              <th style={s.th}>Huidige rol</th>
              <th style={s.th}>Wijzigen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const name = row.member
                ? `${row.member.first_name} ${row.member.last_name}`
                : row.id;
              const isOwnRow = row.id === currentUserId;
              const isBusy = pending === row.id;
              const currentRole = (row.role === 'beheerder' ? 'beheerder' : 'lid') as UserRole;

              return (
                <tr key={row.id} style={s.tr}>
                  <td style={s.td}>{name}</td>
                  <td style={{ ...s.td, color: 'var(--color-text-2)' }}>{row.member?.email ?? '—'}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, ...(currentRole === 'beheerder' ? s.badgeBeheerder : s.badgeLid) }}>
                      {ROLE_LABELS[currentRole]}
                    </span>
                  </td>
                  <td style={s.td}>
                    <select
                      value={currentRole}
                      disabled={isOwnRow || isBusy}
                      onChange={(e) => requestChange(row.id, name, e.target.value as UserRole)}
                      style={{ ...s.select, opacity: isOwnRow ? 0.4 : 1 }}
                      title={isOwnRow ? 'Je kunt je eigen rol niet wijzigen' : undefined}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  errorBanner: { color: 'var(--color-error)', fontSize: 'var(--text-sm)', padding: 'var(--space-3)', background: 'rgba(214,60,60,0.06)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' },
  th: { textAlign: 'left', padding: 'var(--space-2) var(--space-3)', borderBottom: '2px solid var(--color-mid)', fontWeight: 600, color: 'var(--color-text-2)', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid var(--color-light)' },
  td: { padding: 'var(--space-3)', color: 'var(--color-text)', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '2px var(--space-2)', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 600 },
  badgeBeheerder: { background: 'rgba(1,29,80,0.1)', color: 'var(--color-navy)' },
  badgeLid: { background: 'var(--color-light)', color: 'var(--color-text)' },
  select: { padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', color: 'var(--color-text)', background: 'var(--color-white)', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(1,29,80,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  dialog: { background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(1,29,80,0.18)' },
  dialogText: { fontSize: 'var(--text-base)', color: 'var(--color-text)', marginBottom: 'var(--space-5)' },
  dialogActions: { display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' },
  confirmBtn: { padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-navy)', color: 'var(--color-white)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', fontWeight: 500, background: 'none', cursor: 'pointer' },
};
