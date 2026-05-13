'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { AnnouncementWithAuthor } from '@sc-muiden/shared';

function formatDatum(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SportBadge({ sport }: { sport: string[] | null }) {
  if (!sport || sport.length === 0) {
    return <span style={badgeStyle('var(--color-text-2)')}>Alle leden</span>;
  }
  return (
    <>
      {sport.map((s) => (
        <span key={s} style={badgeStyle('var(--color-blue)')}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </span>
      ))}
    </>
  );
}

function badgeStyle(bg: string): React.CSSProperties {
  return {
    display: 'inline-block',
    background: bg,
    color: 'var(--color-white)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: 999,
    marginRight: 4,
  };
}

function StatusBadge({ publishedAt, deletedAt }: { publishedAt: string | null; deletedAt: string | null }) {
  if (deletedAt) {
    return <span style={statusStyle('var(--color-text-2)')}>GEARCHIVEERD</span>;
  }
  if (publishedAt) {
    return <span style={statusStyle('var(--color-success)')}>GEPUBLICEERD</span>;
  }
  return <span style={statusStyle('var(--color-warning)')}>CONCEPT</span>;
}

function statusStyle(bg: string): React.CSSProperties {
  return {
    display: 'inline-block',
    background: bg,
    color: 'var(--color-white)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    padding: '3px 10px',
    borderRadius: 999,
  };
}

interface Props {
  announcements: AnnouncementWithAuthor[];
}

export function AankondigingenClient({ announcements }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/cms/announcements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Archiveren mislukt');
      router.refresh();
    } catch {
      alert('Archiveren mislukt. Probeer het opnieuw.');
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-5)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-3xl)',
            fontWeight: 700,
            color: 'var(--color-navy)',
            margin: 0,
          }}
        >
          Aankondigingen
        </h1>
        <a
          href="/dashboard/aankondigingen/nieuw"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'var(--color-blue)',
            color: 'var(--color-white)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-2) var(--space-4)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <Plus size={20} />
          Nieuwe aankondiging
        </a>
      </div>

      {announcements.length === 0 ? (
        <p style={{ color: 'var(--color-text-2)', fontFamily: 'var(--font-body)' }}>
          Geen aankondigingen. Maak de eerste aankondiging aan voor je leden.
        </p>
      ) : (
        <div
          style={{
            background: 'var(--color-white)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-light)' }}>
                {['Titel', 'Doelgroep', 'Status', 'Datum', 'Acties'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      textAlign: 'left',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--color-text-2)',
                      letterSpacing: '0.4px',
                      borderBottom: '1px solid var(--color-mid)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => (
                <tr
                  key={a.id}
                  style={{ borderBottom: '1px solid var(--color-mid)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'var(--color-navy-06)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = '';
                  }}
                >
                  <td
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-text)',
                      maxWidth: 300,
                    }}
                  >
                    {a.title}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <SportBadge sport={a.sport} />
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <StatusBadge publishedAt={a.published_at} deletedAt={a.deleted_at} />
                  </td>
                  <td
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-2)',
                    }}
                  >
                    {formatDatum(a.published_at ?? a.created_at)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <a
                        href={`/dashboard/aankondigingen/${a.id}/bewerken`}
                        title="Bewerken"
                        style={{ color: 'var(--color-blue)', display: 'flex' }}
                      >
                        <Pencil size={16} />
                      </a>
                      {!a.deleted_at && (
                        <button
                          type="button"
                          title="Archiveren"
                          disabled={deletingId === a.id}
                          onClick={() => setConfirmId(a.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-error)',
                            display: 'flex',
                            padding: 0,
                            opacity: deletingId === a.id ? 0.5 : 1,
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bevestigingsdialoog */}
      {confirmId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(1,29,80,0.50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: 'var(--color-white)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              maxWidth: 400,
              width: '90%',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                color: 'var(--color-text)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Aankondiging archiveren? Dit is niet meer zichtbaar voor leden.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  border: '1px solid var(--color-mid)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-white)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmId)}
                disabled={deletingId === confirmId}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-error)',
                  color: 'var(--color-white)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Bevestigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
