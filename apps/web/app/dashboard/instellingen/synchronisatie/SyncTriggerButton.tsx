'use client';

import { useState } from 'react';
import { RefreshCw, AlertCircle, Loader } from 'lucide-react';

interface SyncTriggerButtonProps {
  sport: 'voetbal' | 'hockey';
  onSuccess: (lastSyncAt: string) => void;
}

export function SyncTriggerButton({ sport, onSuccess }: SyncTriggerButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sync/${sport}`, { method: 'POST' });
      const json = (await res.json()) as { ok: boolean; message?: string; lastSyncAt?: string };

      if (!res.ok || !json.ok) {
        setError(json.message ?? 'Synchronisatie mislukt. Probeer het opnieuw.');
        return;
      }

      onSuccess(json.lastSyncAt ?? new Date().toISOString());
    } catch {
      setError('Synchronisatie mislukt. Controleer de verbinding en probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <button
        onClick={handleSync}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4)',
          backgroundColor: loading ? 'var(--color-blue)' : 'var(--color-blue)',
          color: 'var(--color-white)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity var(--transition-fast)',
        }}
      >
        {loading ? (
          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <RefreshCw size={16} />
        )}
        {loading ? 'Synchroniseren...' : 'Synchroniseer nu'}
      </button>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-2)',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-base)',
          }}
          role="alert"
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
