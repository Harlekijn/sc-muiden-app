'use client';

import { useState, useRef } from 'react';
import type { CsvImportRow, CsvImportResult } from '@sc-muiden/shared';

type Step = 'upload' | 'mapping' | 'preview' | 'done';

const APP_FIELDS = [
  { value: 'first_name', label: 'Voornaam' },
  { value: 'last_name', label: 'Achternaam' },
  { value: 'birth_date', label: 'Geboortedatum' },
  { value: 'email', label: 'E-mailadres' },
  { value: 'phone', label: 'Telefoon' },
  { value: 'sport', label: 'Sport' },
  { value: 'role', label: 'Rol' },
  { value: 'clubbase_id', label: 'ClubBase-ID' },
  { value: '', label: '(overslaan)' },
] as const;

const AUTO_MAP: Record<string, string> = {
  voornaam: 'first_name',
  firstname: 'first_name',
  'first name': 'first_name',
  achternaam: 'last_name',
  lastname: 'last_name',
  'last name': 'last_name',
  geboortedatum: 'birth_date',
  birthdate: 'birth_date',
  'date of birth': 'birth_date',
  email: 'email',
  'e-mail': 'email',
  telefoon: 'phone',
  phone: 'phone',
  mobiel: 'phone',
  sport: 'sport',
  rol: 'role',
  role: 'role',
  clubbaseid: 'clubbase_id',
  'clubbase id': 'clubbase_id',
};

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) =>
    line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
  );
  return { headers, rows };
}

export function CsvImportWizard() {
  const [step, setStep] = useState<Step>('upload');
  const [fileError, setFileError] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewRows, setPreviewRows] = useState<CsvImportRow[]>([]);
  const [selectedConflicts, setSelectedConflicts] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File) {
    setFileError(null);
    if (!file.name.endsWith('.csv')) {
      setFileError('Alleen CSV-bestanden zijn toegestaan.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('Bestand mag niet groter zijn dan 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCsv(text);
      if (headers.length === 0) {
        setFileError('Het bestand bevat geen geldige kolomkoppen.');
        return;
      }
      setCsvHeaders(headers);
      setCsvRows(rows);
      const autoMapping: Record<string, string> = {};
      headers.forEach((h) => {
        autoMapping[h] = AUTO_MAP[h.toLowerCase()] ?? '';
      });
      setMapping(autoMapping);
      setStep('mapping');
    };
    reader.readAsText(file, 'utf-8');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleAnalyse() {
    const rowObjects = csvRows.map((row) => {
      const obj: Record<string, string> = {};
      csvHeaders.forEach((header, i) => {
        const field = mapping[header];
        if (field) obj[field] = row[i] ?? '';
      });
      return obj;
    });

    const res = await fetch('/api/cms/import/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: rowObjects }),
    });

    if (!res.ok) {
      setFileError('Analyse mislukt. Probeer het opnieuw.');
      return;
    }

    const data: CsvImportRow[] = await res.json();
    setPreviewRows(data);
    setSelectedConflicts(new Set());
    setStep('preview');
  }

  function toggleConflict(index: number) {
    setSelectedConflicts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleAllConflicts() {
    const conflictIndexes = previewRows
      .filter((r) => r.status === 'conflict')
      .map((r) => r.index);
    if (conflictIndexes.every((i) => selectedConflicts.has(i))) {
      setSelectedConflicts(new Set());
    } else {
      setSelectedConflicts(new Set(conflictIndexes));
    }
  }

  async function handleImport() {
    setImporting(true);
    setImportError(null);

    const toImport = previewRows.filter(
      (r) => r.status === 'new' || (r.status === 'conflict' && selectedConflicts.has(r.index))
    );

    const res = await fetch('/api/cms/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: toImport, selectedConflicts: Array.from(selectedConflicts) }),
    });

    setImporting(false);

    if (!res.ok) {
      setImportError('Import mislukt. Probeer het opnieuw.');
      return;
    }

    const result: CsvImportResult = await res.json();
    setImportResult(result);
    setStep('done');
  }

  const newCount = previewRows.filter((r) => r.status === 'new').length;
  const conflictCount = previewRows.filter((r) => r.status === 'conflict').length;
  const invalidCount = previewRows.filter((r) => r.status === 'invalid').length;

  return (
    <div style={s.container}>
      {step === 'upload' && (
        <div>
          <div
            style={s.dropZone}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileRef.current?.click()}
          >
            <div style={s.dropIcon}>&#8679;</div>
            <p style={s.dropText}>Sleep een CSV-bestand hierheen of klik om te selecteren</p>
            <p style={s.dropSub}>Maximaal 5 MB. Komma-gescheiden.</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>
          {fileError && <p style={s.errorText}>{fileError}</p>}
        </div>
      )}

      {step === 'mapping' && (
        <div>
          <h2 style={s.stepTitle}>Kolomkoppeling</h2>
          <p style={s.stepDesc}>
            Koppel de CSV-kolommen aan de juiste applicatievelden. Velden die niet relevant zijn, kies je &ldquo;(overslaan)&rdquo;.
          </p>
          <div style={s.mappingTable}>
            <div style={{ ...s.mappingRow, ...s.mappingHeader }}>
              <span>CSV-kolom</span>
              <span>Applicatieveld</span>
            </div>
            {csvHeaders.map((header) => (
              <div key={header} style={s.mappingRow}>
                <span style={s.mappingColName}>{header}</span>
                <select
                  value={mapping[header] ?? ''}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [header]: e.target.value }))}
                  style={s.select}
                >
                  {APP_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div style={s.actions}>
            <button onClick={handleAnalyse} style={s.primaryBtn}>Analyseren</button>
            <button onClick={() => setStep('upload')} style={s.secondaryBtn}>Terug</button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <h2 style={s.stepTitle}>Importpreview</h2>
          <p style={s.summaryBar}>
            <span style={s.summaryNew}>{newCount} nieuwe leden</span>
            {' · '}
            <span style={s.summaryConflict}>{conflictCount} conflicten</span>
            {' · '}
            <span style={s.summaryInvalid}>{invalidCount} ongeldige rijen</span>
          </p>

          <div style={s.previewTable}>
            <div style={{ ...s.previewRow, ...s.previewHeader }}>
              <span>
                {conflictCount > 0 && (
                  <input
                    type="checkbox"
                    onChange={toggleAllConflicts}
                    checked={conflictCount > 0 && previewRows.filter(r => r.status === 'conflict').every(r => selectedConflicts.has(r.index))}
                    aria-label="Selecteer alle conflicten"
                  />
                )}
              </span>
              <span>Voornaam</span>
              <span>Achternaam</span>
              <span>E-mail</span>
              <span>Status</span>
            </div>
            {previewRows.map((row) => {
              const rowBg =
                row.status === 'new'
                  ? 'rgba(26,140,92,0.05)'
                  : row.status === 'conflict'
                  ? 'rgba(245,197,24,0.08)'
                  : 'rgba(214,60,60,0.06)';
              return (
                <div key={row.index} style={{ ...s.previewRow, background: rowBg }}>
                  <span>
                    {row.status === 'conflict' && (
                      <input
                        type="checkbox"
                        checked={selectedConflicts.has(row.index)}
                        onChange={() => toggleConflict(row.index)}
                      />
                    )}
                  </span>
                  <span style={s.previewCell}>{row.data.first_name ?? '—'}</span>
                  <span style={s.previewCell}>{row.data.last_name ?? '—'}</span>
                  <span style={{ ...s.previewCell, color: 'var(--color-text-2)' }}>{row.data.email ?? '—'}</span>
                  <span style={s.previewCell}>
                    {row.status === 'new' && <span style={s.badgeNew}>Nieuw</span>}
                    {row.status === 'conflict' && (
                      <span style={s.badgeConflict} title={row.conflictReason}>Conflict</span>
                    )}
                    {row.status === 'invalid' && (
                      <span style={s.badgeInvalid}>{row.errors?.[0] ?? 'Ongeldig'}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {importError && <p style={s.errorText}>{importError}</p>}

          <div style={s.actions}>
            <button onClick={handleImport} disabled={importing} style={s.primaryBtn}>
              {importing ? 'Importeren...' : 'Importeren'}
            </button>
            <button onClick={() => setStep('upload')} style={s.secondaryBtn}>Opnieuw beginnen</button>
          </div>
        </div>
      )}

      {step === 'done' && importResult && (
        <div style={s.doneBox}>
          <p style={s.doneTitle}>Import voltooid</p>
          <p style={s.doneText}>
            {importResult.inserted} nieuwe leden toegevoegd. {importResult.updated} leden bijgewerkt.
          </p>
          {importResult.failed.length > 0 && (
            <p style={s.errorText}>
              {importResult.failed.length} rijen mislukt.
            </p>
          )}
          <a href="/dashboard/leden" style={s.backLink}>Terug naar ledenlijst</a>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800 },
  dropZone: {
    border: '2px dashed var(--color-mid)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-12) var(--space-8)',
    textAlign: 'center',
    cursor: 'pointer',
    background: 'var(--color-light)',
  },
  dropIcon: {
    fontSize: 40,
    color: 'var(--color-blue)',
    marginBottom: 'var(--space-3)',
  },
  dropText: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-2)',
    marginBottom: 'var(--space-2)',
  },
  dropSub: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-2)',
  },
  errorText: {
    color: 'var(--color-error)',
    fontSize: 'var(--text-sm)',
    marginTop: 'var(--space-3)',
  },
  stepTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-2)',
  },
  stepDesc: {
    color: 'var(--color-text-2)',
    fontSize: 'var(--text-sm)',
    marginBottom: 'var(--space-6)',
  },
  mappingTable: {
    border: '1px solid var(--color-mid)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    marginBottom: 'var(--space-6)',
  },
  mappingRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-4)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--color-mid)',
    alignItems: 'center',
  },
  mappingHeader: {
    background: 'var(--color-light)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  mappingColName: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    fontWeight: 500,
  },
  select: {
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-mid)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    background: 'var(--color-white)',
    width: '100%',
  },
  summaryBar: {
    fontSize: 'var(--text-sm)',
    marginBottom: 'var(--space-4)',
  },
  summaryNew: { color: 'var(--color-success)' },
  summaryConflict: { color: 'var(--color-warning)' },
  summaryInvalid: { color: 'var(--color-error)' },
  previewTable: {
    border: '1px solid var(--color-mid)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    marginBottom: 'var(--space-6)',
  },
  previewRow: {
    display: 'grid',
    gridTemplateColumns: '32px 1fr 1fr 1.5fr 120px',
    gap: 'var(--space-3)',
    padding: 'var(--space-2) var(--space-4)',
    borderBottom: '1px solid var(--color-mid)',
    alignItems: 'center',
  },
  previewHeader: {
    background: 'var(--color-light)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  previewCell: { fontSize: 'var(--text-sm)', color: 'var(--color-text)' },
  badgeNew: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(26,140,92,0.12)',
    color: 'var(--color-success)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
  },
  badgeConflict: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(245,197,24,0.2)',
    color: 'var(--color-warning)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    cursor: 'help',
  },
  badgeInvalid: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(214,60,60,0.1)',
    color: 'var(--color-error)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    gap: 'var(--space-3)',
  },
  primaryBtn: {
    padding: 'var(--space-2) var(--space-6)',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-navy)',
    color: 'var(--color-white)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: 44,
  },
  secondaryBtn: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-mid)',
    background: 'none',
    color: 'var(--color-text)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    cursor: 'pointer',
    minHeight: 44,
  },
  doneBox: {
    padding: 'var(--space-8)',
    background: 'var(--color-light)',
    borderRadius: 'var(--radius-lg)',
    maxWidth: 480,
  },
  doneTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-2)',
  },
  doneText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    marginBottom: 'var(--space-4)',
  },
  backLink: {
    color: 'var(--color-blue)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
