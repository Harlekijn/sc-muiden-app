'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BarRosterPreview, BarShiftMember } from '@sc-muiden/shared';

interface DaySlotOption {
  id: string;
  date: string;
  starts_at: string;
  ends_at: string;
  sport: string | null;
  season: string;
}

interface Props {
  daySlots: DaySlotOption[];
}

type Step = 1 | 2 | 3;

function formatDutchDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(isoDatetime: string): string {
  return new Date(isoDatetime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

function sportLabel(sport: string | null): string {
  if (sport === 'voetbal') return 'Voetbal';
  if (sport === 'hockey') return 'Hockey';
  return 'Club-breed';
}

function getMemberFullName(m: BarShiftMember): string {
  return `${m.first_name} ${m.last_name}`;
}

function countUniqueLeden(preview: BarRosterPreview[]): number {
  const ids = new Set<string>();
  for (const item of preview) {
    for (const shift of item.shifts) {
      ids.add(shift.barcommissie_member.member_id);
      ids.add(shift.regular_members[0].member_id);
      ids.add(shift.regular_members[1].member_id);
    }
  }
  return ids.size;
}

function countShifts(preview: BarRosterPreview[]): number {
  return preview.reduce((acc, item) => acc + item.shifts.length, 0);
}

export function GenereerWizard({ daySlots }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [season, setSeason] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<BarRosterPreview[]>([]);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredSlots = season
    ? daySlots.filter((s) => s.season === season)
    : daySlots;

  const seasons = Array.from(new Set(daySlots.map((s) => s.season))).sort().reverse();

  function toggleSlot(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filteredSlots.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSlots.map((s) => s.id)));
    }
  }

  async function handleGenereer() {
    if (selectedIds.size === 0 || !season) return;
    setError(null);
    setGenerating(true);
    let res: Response;
    try {
      res = await fetch('/api/cms/bardienst/genereer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season, bar_day_slot_ids: Array.from(selectedIds) }),
      });
    } catch {
      setError('Geen verbinding — controleer je internetverbinding en probeer opnieuw.');
      setGenerating(false);
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Genereren mislukt. Probeer het opnieuw.');
      setGenerating(false);
      return;
    }
    setPreview(data as BarRosterPreview[]);
    setGenerating(false);
    setStep(2);
  }

  function swapMember(
    slotIndex: number,
    shiftIndex: number,
    position: 'barcommissie' | 'regulier_0' | 'regulier_1',
    newMember: BarShiftMember
  ) {
    setPreview((prev) => {
      const next = prev.map((item, si) => {
        if (si !== slotIndex) return item;
        return {
          ...item,
          shifts: item.shifts.map((shift, shi) => {
            if (shi !== shiftIndex) return shift;
            if (position === 'barcommissie') {
              return { ...shift, barcommissie_member: newMember };
            }
            const regs: [BarShiftMember, BarShiftMember] = [...shift.regular_members];
            regs[position === 'regulier_0' ? 0 : 1] = newMember;
            return { ...shift, regular_members: regs };
          }),
        };
      });
      return next;
    });
  }

  async function handlePubliceer() {
    setError(null);
    setPublishing(true);
    let res: Response;
    try {
      res = await fetch('/api/cms/bardienst/publiceer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season, preview }),
      });
    } catch {
      setError('Geen verbinding — controleer je internetverbinding en probeer opnieuw.');
      setPublishing(false);
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Publicatie mislukt. Probeer het opnieuw.');
      setPublishing(false);
      return;
    }
    router.push('/dashboard/bardienst?tab=rooster');
    router.refresh();
  }

  return (
    <div>
      <StapIndicator step={step} />

      {step === 1 && (
        <StapSelectie
          seasons={seasons}
          season={season}
          onSeasonChange={(s) => { setSeason(s); setSelectedIds(new Set()); }}
          slots={filteredSlots}
          selectedIds={selectedIds}
          onToggle={toggleSlot}
          onToggleAll={toggleAll}
          onGenereer={handleGenereer}
          generating={generating}
          error={error}
        />
      )}

      {step === 2 && (
        <StapPreview
          preview={preview}
          season={season}
          onSwap={swapMember}
          onVorige={() => setStep(1)}
          onVolgende={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <StapPubliceren
          preview={preview}
          selectedCount={selectedIds.size}
          onVorige={() => setStep(2)}
          onPubliceer={handlePubliceer}
          publishing={publishing}
          error={error}
        />
      )}
    </div>
  );
}

function StapIndicator({ step }: { step: Step }) {
  const stappen = ['Selectie', 'Preview', 'Publiceren'];
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', alignItems: 'center' }}>
      {stappen.map((label, i) => {
        const num = (i + 1) as Step;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700,
              background: active || done ? '#046bba' : '#dde5f0',
              color: active || done ? '#fff' : '#5a6e8a',
            }}>
              {num}
            </div>
            <span style={{ fontSize: '14px', fontWeight: active ? 600 : 400, color: active ? '#011d50' : '#5a6e8a' }}>
              {label}
            </span>
            {i < stappen.length - 1 && <div style={{ width: '24px', height: '2px', background: '#dde5f0' }} />}
          </div>
        );
      })}
    </div>
  );
}

function StapSelectie({
  seasons, season, onSeasonChange, slots, selectedIds, onToggle, onToggleAll, onGenereer, generating, error,
}: {
  seasons: string[];
  season: string;
  onSeasonChange: (s: string) => void;
  slots: DaySlotOption[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onGenereer: () => void;
  generating: boolean;
  error: string | null;
}) {
  return (
    <div style={s.card}>
      {error && <p style={s.error}>{error}</p>}

      <div style={{ marginBottom: '20px' }}>
        <label style={s.label}>Seizoen</label>
        <select value={season} onChange={(e) => onSeasonChange(e.target.value)} style={s.input}>
          <option value="">Kies een seizoen</option>
          {seasons.map((se) => <option key={se} value={se}>{se}</option>)}
        </select>
      </div>

      {season && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#011d50' }}>
              Day-slots ({slots.length})
            </span>
            <button onClick={onToggleAll} style={s.ghostBtn}>
              {selectedIds.size === slots.length ? 'Deselecteer alles' : 'Selecteer alles'}
            </button>
          </div>

          {slots.length === 0 ? (
            <p style={{ color: '#5a6e8a', fontSize: '14px' }}>
              Geen day-slots gevonden voor seizoen {season}.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {slots.map((slot) => (
                <label key={slot.id} style={s.slotRow}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(slot.id)}
                    onChange={() => onToggle(slot.id)}
                    style={{ marginRight: '10px', accentColor: '#046bba' }}
                  />
                  <span style={{ fontSize: '14px', color: '#0d1f3c', flex: 1 }}>
                    {formatDutchDate(slot.date)} · {slot.starts_at.slice(0, 5)}–{slot.ends_at.slice(0, 5)}
                  </span>
                  <span style={slot.sport ? s.sportBadge : s.sportBadgeNeutral}>
                    {sportLabel(slot.sport)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onGenereer}
          disabled={generating || selectedIds.size === 0 || !season}
          style={generating || selectedIds.size === 0 || !season ? s.btnDisabled : s.btn}
        >
          {generating ? 'Genereren...' : 'Genereer preview'}
        </button>
      </div>
    </div>
  );
}

function StapPreview({
  preview, season, onSwap, onVorige, onVolgende,
}: {
  preview: BarRosterPreview[];
  season: string;
  onSwap: (slotIndex: number, shiftIndex: number, position: 'barcommissie' | 'regulier_0' | 'regulier_1', m: BarShiftMember) => void;
  onVorige: () => void;
  onVolgende: () => void;
}) {
  return (
    <div>
      {preview.map((item, slotIndex) => (
        <div key={item.bar_day_slot_id} style={s.dayCard}>
          <h2 style={s.dayTitle}>{formatDutchDate(item.date)}</h2>
          {item.shifts.map((shift, shiftIndex) => (
            <div key={shiftIndex} style={s.shiftBlock}>
              <p style={s.shiftTime}>
                {formatTime(shift.starts_at)} – {formatTime(shift.ends_at)}
              </p>
              <MemberSlot
                member={shift.barcommissie_member}
                isBarcommissie
                sport={item.sport}
                season={season}
                currentPreviewIds={[
                  shift.barcommissie_member.member_id,
                  shift.regular_members[0].member_id,
                  shift.regular_members[1].member_id,
                ]}
                onSwap={(m) => onSwap(slotIndex, shiftIndex, 'barcommissie', m)}
              />
              <MemberSlot
                member={shift.regular_members[0]}
                sport={item.sport}
                season={season}
                currentPreviewIds={[
                  shift.barcommissie_member.member_id,
                  shift.regular_members[0].member_id,
                  shift.regular_members[1].member_id,
                ]}
                onSwap={(m) => onSwap(slotIndex, shiftIndex, 'regulier_0', m)}
              />
              <MemberSlot
                member={shift.regular_members[1]}
                sport={item.sport}
                season={season}
                currentPreviewIds={[
                  shift.barcommissie_member.member_id,
                  shift.regular_members[0].member_id,
                  shift.regular_members[1].member_id,
                ]}
                onSwap={(m) => onSwap(slotIndex, shiftIndex, 'regulier_1', m)}
              />
            </div>
          ))}
        </div>
      ))}

      <div style={s.navRow}>
        <button onClick={onVorige} style={s.ghostBtn}>← Vorige</button>
        <button onClick={onVolgende} style={s.btn}>Doorgaan naar publiceren →</button>
      </div>
    </div>
  );
}

function MemberSlot({
  member, isBarcommissie, sport, season, currentPreviewIds, onSwap,
}: {
  member: BarShiftMember;
  isBarcommissie?: boolean;
  sport: string | null;
  season: string;
  currentPreviewIds: string[];
  onSwap: (m: BarShiftMember) => void;
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<BarShiftMember[]>([]);
  const [loading, setLoading] = useState(false);

  async function openSwap() {
    setOpen(true);
    setLoading(true);
    const excludeIds = currentPreviewIds.filter((id) => id !== member.member_id).join(',');
    const params = new URLSearchParams({
      type: isBarcommissie ? 'barcommissie' : 'regulier',
      season,
      ...(sport ? { sport } : {}),
      ...(excludeIds ? { exclude: excludeIds } : {}),
    });
    const res = await fetch(`/api/cms/bardienst/genereer/leden?${params}`);
    const data = await res.json();
    setOptions(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function select(m: BarShiftMember) {
    onSwap(m);
    setOpen(false);
  }

  return (
    <div style={s.memberRow}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        {isBarcommissie && <span style={s.barBadge}>Barcommissie</span>}
        <span style={{ fontSize: '14px', color: '#0d1f3c' }}>{getMemberFullName(member)}</span>
        <span style={{ fontSize: '12px', color: '#5a6e8a' }}>
          {member.lid_type ?? '—'} · {member.diensten_count} diensten
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        <button onClick={open ? () => setOpen(false) : openSwap} style={s.swapBtn}>
          Omwisselen
        </button>
        {open && (
          <div style={s.dropdown}>
            {loading && <p style={s.dropdownItem}>Laden...</p>}
            {!loading && options.length === 0 && (
              <p style={s.dropdownItem}>Geen alternatieven beschikbaar</p>
            )}
            {!loading && options.map((opt) => (
              <button key={opt.member_id} onClick={() => select(opt)} style={s.dropdownOption}>
                <span>{getMemberFullName(opt)}</span>
                <span style={{ fontSize: '12px', color: '#5a6e8a' }}>{opt.diensten_count} diensten</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StapPubliceren({
  preview, selectedCount, onVorige, onPubliceer, publishing, error,
}: {
  preview: BarRosterPreview[];
  selectedCount: number;
  onVorige: () => void;
  onPubliceer: () => void;
  publishing: boolean;
  error: string | null;
}) {
  const totalShifts = countShifts(preview);
  const totalLeden = countUniqueLeden(preview);

  return (
    <div style={s.card}>
      {error && <p style={s.error}>{error}</p>}

      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#011d50', marginBottom: '16px' }}>
        Samenvatting
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <SummaryRow label="Day-slots geselecteerd" value={String(selectedCount)} />
        <SummaryRow label="Diensten gegenereerd" value={String(totalShifts)} />
        <SummaryRow label="Unieke leden ingepland" value={String(totalLeden)} />
      </div>

      <p style={{ fontSize: '14px', color: '#5a6e8a', marginBottom: '24px' }}>
        Na publicatie ontvangen betrokken leden een push-notificatie.
      </p>

      <div style={s.navRow}>
        <button onClick={onVorige} style={s.ghostBtn} disabled={publishing}>← Vorige</button>
        <button onClick={onPubliceer} disabled={publishing} style={publishing ? s.btnDisabled : s.btn}>
          {publishing ? 'Publiceren...' : 'Publiceer rooster'}
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px solid #f0f4f9' }}>
      <span style={{ color: '#5a6e8a' }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#011d50' }}>{value}</span>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff', borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(1,29,80,0.08)', padding: '28px', maxWidth: '800px',
  },
  dayCard: {
    background: '#fff', borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(1,29,80,0.08)', padding: '20px 24px', marginBottom: '16px',
  },
  dayTitle: { fontSize: '16px', fontWeight: 700, color: '#011d50', margin: '0 0 12px' },
  shiftBlock: { borderTop: '1px solid #dde5f0', paddingTop: '10px', marginTop: '10px' },
  shiftTime: { fontSize: '13px', fontWeight: 600, color: '#5a6e8a', margin: '0 0 8px' },
  memberRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' },
  label: { display: 'block', fontSize: '14px', fontWeight: 500, color: '#0d1f3c', marginBottom: '6px' },
  input: {
    width: '100%', padding: '8px 12px', border: '1px solid #dde5f0',
    borderRadius: '6px', fontSize: '14px', color: '#0d1f3c', boxSizing: 'border-box',
  },
  slotRow: {
    display: 'flex', alignItems: 'center', padding: '10px 14px',
    border: '1px solid #dde5f0', borderRadius: '6px', cursor: 'pointer',
  },
  sportBadge: {
    fontSize: '12px', fontWeight: 500, padding: '2px 8px',
    background: '#046bba', color: '#fff', borderRadius: '4px',
  },
  sportBadgeNeutral: {
    fontSize: '12px', fontWeight: 500, padding: '2px 8px',
    background: '#dde5f0', color: '#5a6e8a', borderRadius: '4px',
  },
  barBadge: {
    fontSize: '11px', fontWeight: 600, padding: '2px 7px',
    background: '#f5c518', color: '#011d50', borderRadius: '4px',
  },
  error: {
    color: '#d63c3c', background: '#fef2f2', border: '1px solid #fca5a5',
    borderRadius: '6px', padding: '10px 14px', fontSize: '14px', marginBottom: '16px',
  },
  btn: {
    padding: '9px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
    color: '#fff', background: '#046bba', border: 'none', cursor: 'pointer',
  },
  btnDisabled: {
    padding: '9px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
    color: '#fff', background: '#a0b4cc', border: 'none', cursor: 'not-allowed',
  },
  ghostBtn: {
    padding: '9px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
    color: '#5a6e8a', background: '#f0f4f9', border: '1px solid #dde5f0', cursor: 'pointer',
  },
  navRow: { display: 'flex', justifyContent: 'space-between', marginTop: '24px' },
  swapBtn: {
    padding: '5px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
    color: '#046bba', background: '#f0f4f9', border: '1px solid #dde5f0', cursor: 'pointer',
  },
  dropdown: {
    position: 'absolute', right: 0, top: '100%', marginTop: '4px',
    background: '#fff', border: '1px solid #dde5f0', borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(1,29,80,0.12)', minWidth: '260px',
    zIndex: 100, maxHeight: '240px', overflowY: 'auto',
  },
  dropdownItem: { padding: '10px 14px', fontSize: '14px', color: '#5a6e8a', margin: 0 },
  dropdownOption: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', padding: '9px 14px', background: 'none', border: 'none',
    borderBottom: '1px solid #f0f4f9', cursor: 'pointer', fontSize: '14px',
    color: '#0d1f3c', textAlign: 'left',
  },
};
