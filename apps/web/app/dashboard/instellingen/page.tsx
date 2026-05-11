import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

export default function InstellingenPage() {
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
        Instellingen
      </h1>
      <p style={{ color: 'var(--color-text-2)', marginBottom: 'var(--space-6)' }}>
        Beheer de configuratie van de SC Muiden app.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
        <Link
          href="/dashboard/instellingen/synchronisatie"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            padding: 'var(--space-5)',
            textDecoration: 'none',
            color: 'var(--color-text)',
            transition: 'box-shadow var(--transition-fast)',
          }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-navy-06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <RefreshCw size={20} color="var(--color-navy)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-navy)' }}>
              Synchronisatie
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', marginTop: 2 }}>
              KNVB en KNHB wedstrijdsync beheren
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
