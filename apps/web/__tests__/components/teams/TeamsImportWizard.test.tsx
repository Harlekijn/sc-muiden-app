/**
 * Component tests for TeamsImportWizard.
 *
 * Test runner: Jest + React Testing Library (jest-environment-jsdom).
 * Fetch is mocked via jest.fn() — no real network calls.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamsImportWizard } from '../../../app/dashboard/teams/importeren/_components/TeamsImportWizard';
import type { CsvImportTeamRow, CsvImportTeamResult } from '@sc-muiden/shared';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal File-like object accepted by handleFileSelect. */
function makeFile(name: string, content: string, size?: number): File {
  const blob = new Blob([content], { type: 'text/csv' });
  const file = new File([blob], name, { type: 'text/csv' });
  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size });
  }
  return file;
}

const SIMPLE_CSV = `name,sport,season\nSC Muiden 1,voetbal,2024-2025\nSC Muiden 2,hockey,2024-2025`;
const MULTI_HEADER_CSV = `teamnaam,sport,seizoen,leeftijdscategorie,federatieid\nSC Muiden 1,voetbal,2024-2025,Senioren,KNVB-001`;

const ANALYSE_RESPONSE_NEW: CsvImportTeamRow[] = [
  { index: 0, data: { name: 'SC Muiden 1', sport: 'voetbal', season: '2024-2025' }, status: 'new' },
  { index: 1, data: { name: 'SC Muiden 2', sport: 'hockey', season: '2024-2025' }, status: 'new' },
];

const ANALYSE_RESPONSE_WITH_CONFLICT: CsvImportTeamRow[] = [
  { index: 0, data: { name: 'SC Muiden 1', sport: 'voetbal', season: '2024-2025' }, status: 'new' },
  {
    index: 1,
    data: { name: 'SC Muiden 2', sport: 'hockey', season: '2024-2025' },
    status: 'conflict',
    conflictTeamId: 'uuid-conflict',
    conflictReason: 'Zelfde naam, sport en seizoen',
  },
];

const ANALYSE_RESPONSE_WITH_REVIVAL: CsvImportTeamRow[] = [
  {
    index: 0,
    data: { name: 'SC Muiden Oud', sport: 'voetbal', season: '2023-2024' },
    status: 'conflict',
    conflictTeamId: 'uuid-deleted',
    conflictReason: 'Zelfde naam, sport en seizoen — team is eerder verwijderd en wordt hersteld',
  },
];

const ANALYSE_RESPONSE_WITH_INVALID: CsvImportTeamRow[] = [
  {
    index: 0,
    data: { name: '', sport: 'voetbal' as const },
    status: 'invalid',
    errors: ['Teamnaam is verplicht'],
  },
];

const IMPORT_RESULT: CsvImportTeamResult = {
  inserted: 2,
  updated: 0,
  failed: [],
};

const IMPORT_RESULT_WITH_FAILURES: CsvImportTeamResult = {
  inserted: 1,
  updated: 0,
  failed: [
    {
      index: 1,
      data: { name: 'SC Muiden 2', sport: 'voetbal' as const },
      status: 'new',
      errors: ['Teamnaam of federatie-ID bestaat al in de database.'],
    },
  ],
};

// ── Setup ─────────────────────────────────────────────────────────────────────

// Mock global fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// jsdom ships with a real FileReader; no mock needed.

beforeEach(() => {
  mockFetch.mockReset();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TeamsImportWizard', () => {
  // ── Step: upload ────────────────────────────────────────────────────────────

  it('renders with the upload step visible', () => {
    render(<TeamsImportWizard />);
    expect(
      screen.getByText(/Sleep een CSV-bestand hierheen of klik om te selecteren/)
    ).toBeInTheDocument();
  });

  it('rejects a non-CSV file with a Dutch error message', async () => {
    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile('teams.xlsx', 'not csv');
    fireEvent.change(input, { target: { files: [file] } });
    expect(
      await screen.findByText('Alleen CSV-bestanden zijn toegestaan.')
    ).toBeInTheDocument();
  });

  it('rejects a CSV file larger than 5 MB with a Dutch error message', async () => {
    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // 5 MB + 1 byte
    const file = makeFile('teams.csv', 'name,sport\nfoo,voetbal', 5 * 1024 * 1024 + 1);
    fireEvent.change(input, { target: { files: [file] } });
    expect(
      await screen.findByText('Bestand mag niet groter zijn dan 5 MB.')
    ).toBeInTheDocument();
  });

  it('advances to the mapping step after a valid CSV is selected', async () => {
    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile('teams.csv', SIMPLE_CSV);
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText('Kolomkoppeling')).toBeInTheDocument();
  });

  // ── Step: mapping ───────────────────────────────────────────────────────────

  it('auto-maps recognised column headers', async () => {
    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // Use Dutch/alias headers that AUTO_MAP recognises
    const file = makeFile('teams.csv', MULTI_HEADER_CSV);
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for mapping step
    await screen.findByText('Kolomkoppeling');

    // 'teamnaam' → 'name', 'sport' → 'sport', 'seizoen' → 'season',
    // 'leeftijdscategorie' → 'age_category', 'federatieid' → 'federation_team_id'
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const values = selects.map((s) => s.value);
    expect(values).toEqual(
      expect.arrayContaining(['name', 'sport', 'season', 'age_category', 'federation_team_id'])
    );
  });

  it('resets all state and returns to upload step when Back is pressed on mapping step', async () => {
    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');

    fireEvent.click(screen.getByRole('button', { name: 'Terug' }));
    expect(
      screen.getByText(/Sleep een CSV-bestand hierheen of klik om te selecteren/)
    ).toBeInTheDocument();
    // Error state cleared
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // ── Step: preview / analyse ─────────────────────────────────────────────────

  it('calls the analyse API and shows the preview table', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ANALYSE_RESPONSE_NEW,
    } as unknown as Response);

    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');

    fireEvent.click(screen.getByRole('button', { name: 'Analyseren' }));

    await screen.findByText('Importpreview');
    expect(screen.getByText('SC Muiden 1')).toBeInTheDocument();
    expect(screen.getByText('SC Muiden 2')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/cms/teams/import/analyse',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('shows a Dutch error when the analyse API fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false } as unknown as Response);

    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');

    fireEvent.click(screen.getByRole('button', { name: 'Analyseren' }));

    expect(
      await screen.findByText('Analyse mislukt. Probeer het opnieuw.')
    ).toBeInTheDocument();
  });

  // ── Conflict row display ─────────────────────────────────────────────────────

  it('renders a conflict row with a checkbox and tooltip', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ANALYSE_RESPONSE_WITH_CONFLICT,
    } as unknown as Response);

    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');
    fireEvent.click(screen.getByRole('button', { name: 'Analyseren' }));
    await screen.findByText('Importpreview');

    // Conflict badge is present
    const conflictBadge = screen.getByText('Conflict');
    expect(conflictBadge).toBeInTheDocument();
    // Tooltip matches conflict reason
    expect(conflictBadge).toHaveAttribute('title', 'Zelfde naam, sport en seizoen');

    // Conflict row has a checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    // One for the conflict row (and optionally one "select all")
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
  });

  it('adds revival note to tooltip for soft-deleted conflict', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ANALYSE_RESPONSE_WITH_REVIVAL,
    } as unknown as Response);

    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');
    fireEvent.click(screen.getByRole('button', { name: 'Analyseren' }));
    await screen.findByText('Importpreview');

    const conflictBadge = screen.getByText('Conflict');
    // Title should contain both the conflict reason and the revival note
    expect(conflictBadge.getAttribute('title')).toContain('verwijderd en wordt hersteld');
  });

  it('shows an invalid badge with the first error message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ANALYSE_RESPONSE_WITH_INVALID,
    } as unknown as Response);

    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');
    fireEvent.click(screen.getByRole('button', { name: 'Analyseren' }));
    await screen.findByText('Importpreview');

    expect(screen.getByText('Teamnaam is verplicht')).toBeInTheDocument();
  });

  // ── Import — conflict selection ──────────────────────────────────────────────

  it('sends only new + selected conflict rows to the import API', async () => {
    (mockFetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ANALYSE_RESPONSE_WITH_CONFLICT,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => IMPORT_RESULT,
      } as unknown as Response);

    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');
    fireEvent.click(screen.getByRole('button', { name: 'Analyseren' }));
    await screen.findByText('Importpreview');

    // Check the conflict checkbox (index 1)
    const conflictCheckbox = screen.getByRole('checkbox', {
      name: /Conflict voor rij 3 selecteren/,
    });
    fireEvent.click(conflictCheckbox);

    fireEvent.click(screen.getByRole('button', { name: 'Importeren' }));

    await screen.findByText('Import voltooid');

    // Inspect what was sent to the import endpoint
    const importCall = mockFetch.mock.calls[1];
    const importBody = JSON.parse((importCall?.[1] as any)?.body as string) as {
      rows: CsvImportTeamRow[];
    };

    // Both new (index 0) and selected conflict (index 1) should be included
    expect(importBody.rows).toHaveLength(2);
    expect(importBody.rows.map((r) => r.index)).toEqual([0, 1]);
  });

  it('does not send unselected conflict rows to the import API', async () => {
    (mockFetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ANALYSE_RESPONSE_WITH_CONFLICT,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ inserted: 1, updated: 0, failed: [] } satisfies CsvImportTeamResult),
      } as unknown as Response);

    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');
    fireEvent.click(screen.getByRole('button', { name: 'Analyseren' }));
    await screen.findByText('Importpreview');

    // Do NOT check the conflict checkbox — click import directly
    fireEvent.click(screen.getByRole('button', { name: 'Importeren' }));

    await screen.findByText('Import voltooid');

    const importCall = mockFetch.mock.calls[1];
    const importBody = JSON.parse((importCall?.[1] as any)?.body as string) as {
      rows: CsvImportTeamRow[];
    };

    // Only the new row (index 0) should be sent; conflict (index 1) excluded
    expect(importBody.rows).toHaveLength(1);
    expect(importBody.rows[0].index).toBe(0);
  });

  // ── Step: done ──────────────────────────────────────────────────────────────

  it('shows inserted and updated counts on the done step', async () => {
    (mockFetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ANALYSE_RESPONSE_NEW,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ inserted: 2, updated: 1, failed: [] } satisfies CsvImportTeamResult),
      } as unknown as Response);

    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');
    fireEvent.click(screen.getByRole('button', { name: 'Analyseren' }));
    await screen.findByText('Importpreview');
    fireEvent.click(screen.getByRole('button', { name: 'Importeren' }));

    expect(await screen.findByText('Import voltooid')).toBeInTheDocument();
    expect(screen.getByText(/2 nieuwe teams toegevoegd/)).toBeInTheDocument();
    expect(screen.getByText(/1 teams bijgewerkt/)).toBeInTheDocument();
  });

  it('shows the failed-rows table when rows could not be imported', async () => {
    (mockFetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ANALYSE_RESPONSE_NEW,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => IMPORT_RESULT_WITH_FAILURES,
      } as unknown as Response);

    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');
    fireEvent.click(screen.getByRole('button', { name: 'Analyseren' }));
    await screen.findByText('Importpreview');
    fireEvent.click(screen.getByRole('button', { name: 'Importeren' }));

    await screen.findByText('Import voltooid');

    // Failed rows table columns
    expect(screen.getByText('Rijnummer')).toBeInTheDocument();
    expect(screen.getByText('Naam')).toBeInTheDocument();
    expect(screen.getByText('Reden')).toBeInTheDocument();

    // Failed row data
    expect(screen.getByText('SC Muiden 2')).toBeInTheDocument();
    expect(
      screen.getByText('Teamnaam of federatie-ID bestaat al in de database.')
    ).toBeInTheDocument();
    // Row number: index 1 → CSV row 3 (header=1, data rows start at 2)
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('"Terug naar teams" link points to /dashboard/teams', async () => {
    (mockFetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ANALYSE_RESPONSE_NEW,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => IMPORT_RESULT,
      } as unknown as Response);

    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');
    fireEvent.click(screen.getByRole('button', { name: 'Analyseren' }));
    await screen.findByText('Importpreview');
    fireEvent.click(screen.getByRole('button', { name: 'Importeren' }));

    await screen.findByText('Import voltooid');

    const link = screen.getByRole('link', { name: 'Terug naar teams' });
    expect(link).toHaveAttribute('href', '/dashboard/teams');
  });

  it('shows a Dutch error when the import API fails', async () => {
    (mockFetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ANALYSE_RESPONSE_NEW,
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: false } as unknown as Response);

    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');
    fireEvent.click(screen.getByRole('button', { name: 'Analyseren' }));
    await screen.findByText('Importpreview');
    fireEvent.click(screen.getByRole('button', { name: 'Importeren' }));

    expect(
      await screen.findByText('Import mislukt. Probeer het opnieuw.')
    ).toBeInTheDocument();
  });

  it('resets all state and returns to upload when "Opnieuw beginnen" is pressed on preview step', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ANALYSE_RESPONSE_NEW,
    } as unknown as Response);

    render(<TeamsImportWizard />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('teams.csv', SIMPLE_CSV)] } });
    await screen.findByText('Kolomkoppeling');
    fireEvent.click(screen.getByRole('button', { name: 'Analyseren' }));
    await screen.findByText('Importpreview');

    fireEvent.click(screen.getByRole('button', { name: 'Opnieuw beginnen' }));

    expect(
      screen.getByText(/Sleep een CSV-bestand hierheen of klik om te selecteren/)
    ).toBeInTheDocument();
  });
});
