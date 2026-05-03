export function GeenToegang() {
  return (
    <div style={{ padding: '48px 24px', maxWidth: 480 }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-2xl)',
        color: 'var(--color-navy)',
        marginBottom: '12px',
        fontWeight: 700,
      }}>
        Geen toegang
      </h2>
      <p style={{ color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: '24px' }}>
        Je account heeft geen beheerdersrechten. Neem contact op met de beheerder van SC Muiden.
      </p>
      <a
        href="/login"
        style={{
          color: 'var(--color-blue)',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: 'var(--text-sm)',
        }}
      >
        Uitloggen
      </a>
    </div>
  );
}
