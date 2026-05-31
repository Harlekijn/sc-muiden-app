import { GenereerWizard } from './_components/GenereerWizard';

export default function GenereerRoosterPage() {
  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <a href="/dashboard/bardienst" style={s.back}>← Terug naar bardienst</a>
        <h1 style={s.heading}>Rooster genereren</h1>
      </div>
      <GenereerWizard />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  back: { color: 'var(--color-text-2)', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '8px' },
  heading: { fontSize: '24px', fontWeight: 700, color: 'var(--color-navy)', margin: 0 },
};
