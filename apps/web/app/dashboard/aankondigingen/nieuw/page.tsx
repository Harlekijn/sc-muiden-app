import { AankondigingenForm } from '../_components/AankondigingenForm';

export default function NieuweAankondigingPage() {
  return (
    <div>
      <nav
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-2)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <a href="/dashboard/aankondigingen" style={{ color: 'var(--color-blue)' }}>
          Aankondigingen
        </a>
        {' / '}
        <span>Nieuwe aankondiging</span>
      </nav>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 700,
          color: 'var(--color-navy)',
          marginBottom: 'var(--space-5)',
        }}
      >
        Nieuwe aankondiging
      </h1>
      <AankondigingenForm />
    </div>
  );
}
