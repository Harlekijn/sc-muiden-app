import { BarDaySlotForm } from '../../_components/BarDaySlotForm';

export default function NieuwDaySlotPage() {
  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <a href="/dashboard/bardienst?tab=day-slots" style={s.back}>← Terug naar day-slots</a>
        <h1 style={s.heading}>Nieuw day-slot</h1>
      </div>
      <BarDaySlotForm />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  back: { color: '#5a6e8a', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '8px' },
  heading: { fontSize: '24px', fontWeight: 700, color: '#011d50', margin: 0 },
};
