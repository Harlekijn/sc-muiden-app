import { TeamsImportWizard } from './_components/TeamsImportWizard';

export default function TeamsImporterenPage() {
  return (
    <div>
      <p style={s.breadcrumb}>
        <a href="/dashboard/teams" style={s.breadcrumbLink}>Teams</a>
        {' > '}
        Importeren
      </p>
      <h1 style={s.heading}>Teams importeren</h1>
      <p style={s.desc}>
        Importeer teams vanuit een CSV-bestand. Controleer de kolomkoppeling en bekijk een preview voor het importeren.
      </p>
      <TeamsImportWizard />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  breadcrumb: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-2)',
    marginBottom: 'var(--space-2)',
  },
  breadcrumbLink: {
    color: 'var(--color-blue)',
    textDecoration: 'none',
  },
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-2)',
  },
  desc: {
    color: 'var(--color-text-2)',
    fontSize: 'var(--text-base)',
    lineHeight: 1.6,
    marginBottom: 'var(--space-8)',
    maxWidth: 600,
  },
};
