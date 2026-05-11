export function KoppelingNietGeldig() {
  return (
    <main style={s.main}>
      <div style={s.card}>
        <h1 style={s.title}>SC Muiden</h1>
        <h2 style={s.sectionTitle}>Koppeling niet meer geldig</h2>
        <p style={s.body}>Deze koppeling is niet meer geldig.</p>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-navy)',
    padding: 'var(--space-4)',
  },
  card: {
    background: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-8)',
    width: '100%',
    maxWidth: 400,
    boxShadow: 'var(--shadow-modal)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-1)',
    letterSpacing: '0.02em',
  },
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-4)',
  },
  body: {
    color: 'var(--color-text-2)',
    fontSize: 'var(--text-base)',
  },
};
