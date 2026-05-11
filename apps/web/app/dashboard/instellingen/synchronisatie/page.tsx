'use client';

import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { SyncTriggerButton } from './SyncTriggerButton';

interface SyncRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  records_updated: number | null;
  error: string | null;
  triggered_by: string;
}

interface SyncSportSectieProps {
  sport: 'voetbal' | 'hockey';
  label: string;
  initialLastSync: string | null;
  initialLogs: SyncRun[];
}

const DUTCH_MONTHS = [
  'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
];
const DUTCH_DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

function formatDutchDatetime(iso: string): string {
  const d = new Date(iso);
  const day = DUTCH_DAYS[d.getDay()];
  const month = DUTCH_MONTHS[d.getMonth()];
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${d.getDate()} ${month} om ${h}:${m}`;
}

function SyncSportSectie({ sport, label, initialLastSync, initialLogs }: SyncSportSectieProps) {
  const [lastSync, setLastSync] = useState<string | null>(initialLastSync);
  const [logs, setLogs] = useState<SyncRun[]>(initialLogs);
  const [logsOpen, setLogsOpen] = useState(false);

  function handleSuccess(lastSyncAt: string) {
    setLastSync(lastSyncAt);
    const newRun: SyncRun = {
      id: crypto.randomUUID(),
      started_at: lastSyncAt,
      finished_at: lastSyncAt,
      records_updated: null,
      error: null,
      triggered_by: 'manual',
    };
    setLogs((prev) => [newRun, ...prev].slice(0, 10));
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-navy)' }}>
          {label}
        </h2>
        <span style={sportBadgeStyle}>{label}</span>
      </div>

      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', marginBottom: 'var(--space-4)' }}>
        {lastSync
          ? `Laatste sync: ${formatDutchDatetime(lastSync)}`
          : 'Nog nooit gesynchroniseerd.'}
      </p>

      <SyncTriggerButton sport={sport} onSuccess={handleSuccess} />

      <button
        onClick={() => setLogsOpen((o) => !o)}
        style={logToggleStyle}
        aria-expanded={logsOpen}
      >
        <span>Laatste 10 syncs</span>
        {logsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {logsOpen && (
        <div style={logTableWrapper}>
          {logs.length === 0 ? (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-2)', padding: 'var(--space-3)' }}>
              Nog geen syncruns.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-mid)' }}>
                  {['Tijdstip', 'Records', 'Status'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((run, i) => (
                  <tr key={run.id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-white)' : 'var(--color-light)' }}>
                    <td style={tdStyle}>{formatDutchDatetime(run.started_at)}</td>
                    <td style={tdStyle}>{run.records_updated ?? '–'}</td>
                    <td style={tdStyle}>
                      {run.error ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                          <X size={16} color="var(--color-error)" />
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>{run.error}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                          <Check size={16} color="var(--color-success)" />
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>Gelukt</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-white)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
  padding: 'var(--space-6)',
};

const sportBadgeStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-blue)',
  color: 'var(--color-white)',
  borderRadius: 'var(--radius-pill)',
  padding: '2px var(--space-2)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
};

const logToggleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--color-text-2)',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  letterSpacing: '0.02em',
  padding: '0',
  marginTop: 'var(--space-4)',
};

const logTableWrapper: React.CSSProperties = {
  marginTop: 'var(--space-3)',
  border: '1px solid var(--color-mid)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
};

const thStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-3)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--color-text-2)',
  textAlign: 'left',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  backgroundColor: 'var(--color-light)',
};

const tdStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-3)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text)',
  borderTop: '1px solid var(--color-mid)',
};

export default function SynchronisatiePage() {
  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 700,
          color: 'var(--color-navy)',
          marginBottom: 'var(--space-2)',
        }}
      >
        Synchronisatie
      </h1>
      <p style={{ color: 'var(--color-text-2)', marginBottom: 'var(--space-6)' }}>
        Beheer de koppeling met KNVB (voetbal) en KNHB (hockey).
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        <SyncSportSectie
          sport="voetbal"
          label="Voetbal"
          initialLastSync={null}
          initialLogs={[]}
        />
        <SyncSportSectie
          sport="hockey"
          label="Hockey"
          initialLastSync={null}
          initialLogs={[]}
        />
      </div>
    </div>
  );
}
