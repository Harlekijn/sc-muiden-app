import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@sc-muiden/shared', () => ({
  formatDutchDateTime: (s: string) => s,
}));

jest.mock('../../../../lib/supabase-client', () => ({
  createSupabaseBrowserClient: jest.fn(),
}));

const { createSupabaseBrowserClient } = jest.requireMock('../../../../lib/supabase-client');

import { ActiviteitenClient } from '../_components/ActiviteitenClient';

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
    teams: null,
  },
];

beforeEach(() => {
  createSupabaseBrowserClient.mockReturnValue({
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
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

  // S12-F — Activiteit annuleren via window.confirm
  it('S12-F: annuleer-bevestiging via window.confirm verbergt activiteit', async () => {
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
  });
});
