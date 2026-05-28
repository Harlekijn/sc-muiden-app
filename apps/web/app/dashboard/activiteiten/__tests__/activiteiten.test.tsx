import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@sc-muiden/shared', () => ({
  ...jest.requireActual('@sc-muiden/shared'),
  formatDutchDateTime: (s: string) => s,
}));

jest.mock('../../../../lib/supabase-client', () => ({
  createSupabaseBrowserClient: jest.fn(),
}));

const { createSupabaseBrowserClient } = jest.requireMock('../../../../lib/supabase-client');

import { ActiviteitenClient } from '../_components/ActiviteitenClient';
import { TrainingForm } from '../nieuw/_components/TrainingForm';
import { BardienstForm } from '../nieuw/_components/BardienstForm';

const mockActivities = [
  {
    id: 'act-1',
    type: 'training',
    sport: 'voetbal',
    team_id: 'team-1',
    title: 'Training JO15-1',
    starts_at: '2026-05-12T10:00:00',
    ends_at: null,
    location: 'Veld 1',
    notes: null,
    recurring_rule_id: 'rule-1',
    is_generated: true,
    teams: { id: 'team-1', name: 'JO15-1', sport: 'voetbal' },
  },
  {
    id: 'act-2',
    type: 'wedstrijd',
    sport: 'voetbal',
    team_id: 'team-1',
    title: 'JO15-1 vs SC Almere',
    starts_at: '2026-05-15T14:00:00',
    ends_at: null,
    location: null,
    notes: null,
    recurring_rule_id: null,
    is_generated: false,
    teams: null,
  },
  {
    id: 'act-3',
    type: 'bardienst',
    sport: null,
    team_id: null,
    title: 'Bardienst',
    starts_at: '2026-05-13T18:00:00',
    ends_at: null,
    location: 'Kantine',
    notes: null,
    recurring_rule_id: null,
    is_generated: false,
    teams: null,
  },
];

beforeEach(() => {
  createSupabaseBrowserClient.mockReturnValue({
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
      // Voor gegenereerde occurrences wordt cancel uitgevoerd via een
      // override-insert (soft-deleted activities-rij).
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  });
  window.confirm = jest.fn().mockReturnValue(true);
});

// S12-D — Activiteitenlijst tonen
describe('ActiviteitenClient', () => {
  it('S12-D: toont alle activiteiten standaard', () => {
    render(
      <ActiviteitenClient
        activities={mockActivities}
        currentType="alle"
        currentPeriode="aankomend"
        currentSport="alle"
      />
    );
    expect(screen.getByText('Training JO15-1')).toBeInTheDocument();
    expect(screen.getByText('JO15-1 vs SC Almere')).toBeInTheDocument();
    expect(screen.getAllByText('Bardienst').length).toBeGreaterThan(0);
  });

  // S12-G — Wedstrijd niet bewerkbaar: toont slotje, geen bewerk-link
  it('S12-G: wedstrijd toont slotje icoon', () => {
    render(
      <ActiviteitenClient
        activities={mockActivities}
        currentType="alle"
        currentPeriode="aankomend"
        currentSport="alle"
      />
    );
    const lockIcon = screen.getByTitle('Via federatiesync');
    expect(lockIcon).toBeInTheDocument();
  });

  it('S12-G: wedstrijd heeft geen bewerk-link', () => {
    render(
      <ActiviteitenClient
        activities={mockActivities}
        currentType="alle"
        currentPeriode="aankomend"
        currentSport="alle"
      />
    );
    const links = screen.getAllByRole('link');
    const wedstrijdEditLinks = links.filter(
      (l) => l.getAttribute('href')?.includes('act-2') && l.getAttribute('href')?.includes('bewerken')
    );
    expect(wedstrijdEditLinks).toHaveLength(0);
  });

  // S12-J — Activiteit annuleren via window.confirm
  // S17-C — Soft-deleted override = afgelaste training (generated occurrence)
  it('S12-J / S17-C: annuleer-bevestiging op gegenereerde training inserteert override met deleted_at', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    const updateEqMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn().mockReturnValue({ eq: updateEqMock });
    createSupabaseBrowserClient.mockReturnValue({
      from: jest.fn().mockReturnValue({ insert: insertMock, update: updateMock }),
    });

    render(
      <ActiviteitenClient
        activities={mockActivities}
        currentType="alle"
        currentPeriode="aankomend"
        currentSport="alle"
      />
    );

    const annuleerKnoppen = screen.getAllByTitle('Annuleren');
    fireEvent.click(annuleerKnoppen[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(screen.queryByText('Training JO15-1')).not.toBeInTheDocument();
    });

    // Generated occurrence: insert override met deleted_at, geen update.
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'training',
        recurring_rule_id: 'rule-1',
        deleted_at: expect.any(String),
      })
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  // S17-C — Niet-gegenereerde activiteit (bardienst): soft-delete via update
  it('S17-C: annuleer op niet-gegenereerde activiteit gebruikt update i.p.v. insert', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    const updateEqMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn().mockReturnValue({ eq: updateEqMock });
    createSupabaseBrowserClient.mockReturnValue({
      from: jest.fn().mockReturnValue({ insert: insertMock, update: updateMock }),
    });

    render(
      <ActiviteitenClient
        activities={mockActivities}
        currentType="alle"
        currentPeriode="aankomend"
        currentSport="alle"
      />
    );

    // De tweede annuleer-knop hoort bij act-3 (bardienst, niet-gegenereerd).
    // Wedstrijd (act-2) heeft geen annuleer-knop.
    const annuleerKnoppen = screen.getAllByTitle('Annuleren');
    fireEvent.click(annuleerKnoppen[1]);

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(String) })
      );
      expect(updateEqMock).toHaveBeenCalledWith('id', 'act-3');
    });
    expect(insertMock).not.toHaveBeenCalled();
  });
});

const mockTeams = [
  { id: 'team-1', name: 'JO15-1', sport: 'voetbal' },
];

// S12-F — Training aanmaken (terugkerend)
describe('TrainingForm', () => {
  it('S12-F: toont formulier met teams dropdown', () => {
    render(<TrainingForm teams={mockTeams} />);
    expect(screen.getByText('JO15-1')).toBeInTheDocument();
    expect(screen.getByText('Wekelijks herhalen')).toBeInTheDocument();
  });

  it('S12-F: recurring toggle toont geldig-van en geldig-tot velden', () => {
    render(<TrainingForm teams={mockTeams} />);
    expect(screen.queryByText(/geldig van/i)).not.toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(screen.getByText(/geldig van \*/i)).toBeInTheDocument();
    expect(screen.getByText(/geldig tot \*/i)).toBeInTheDocument();
  });

  it('S12-F: opslaan zonder begintijd toont Begintijd is verplicht', async () => {
    render(<TrainingForm teams={mockTeams} />);
    fireEvent.click(screen.getByText('Opslaan'));
    await waitFor(() => {
      expect(screen.getByText('Begintijd is verplicht')).toBeInTheDocument();
    });
  });
});

// S12-G — Bardienst aanmaken en leden toewijzen
describe('BardienstForm', () => {
  beforeEach(() => {
    createSupabaseBrowserClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          is: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'act-1' }, error: null }),
          }),
        }),
      }),
    });
  });

  it('S12-G: toont formulier met zoekveldinput voor leden', () => {
    render(<BardienstForm />);
    expect(screen.getByPlaceholderText(/zoek en voeg lid toe/i)).toBeInTheDocument();
  });

  it('S12-G: toont sport-selectie opties', () => {
    render(<BardienstForm />);
    expect(screen.getByText('Voetbal')).toBeInTheDocument();
    expect(screen.getByText('Hockey')).toBeInTheDocument();
  });

  it('S12-G: opslaan zonder begintijd toont Begintijd is verplicht', async () => {
    render(<BardienstForm />);
    fireEvent.click(screen.getByText('Opslaan'));
    await waitFor(() => {
      expect(screen.getByText('Begintijd is verplicht')).toBeInTheDocument();
    });
  });
});
