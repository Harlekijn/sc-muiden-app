export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-navy)',
      }}
    >
      <div
        style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          width: '100%',
          maxWidth: 400,
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-3xl)',
            fontWeight: 700,
            color: 'var(--color-navy)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Inloggen
        </h1>
        <p style={{ color: 'var(--color-text-2)', marginBottom: 'var(--space-6)' }}>
          SC Muiden beheer
        </p>
        <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }}>
          Loginformulier volgt in fase 1.
        </p>
      </div>
    </main>
  );
}
