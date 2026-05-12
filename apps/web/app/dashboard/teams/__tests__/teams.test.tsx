import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Sport, TeamMemberWithMember } from '@sc-muiden/shared';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
}));

jest.mock('../../../../lib/supabase-client', () => ({
  createSupabaseBrowserClient: jest.fn(),
}));

const { createSupabaseBrowserClient } = jest.requireMock('../../../../lib/supabase-client');

import { TeamDetailClient } from '../[id]/_components/TeamDetailClient';

const mockTeam = {
  id: 'team-1',
  name: 'JO15-1',
  sport: 'voetbal' as Sport,
  federation_team_id: null,
  age_category: null,
  season: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  deleted_at: null,
};

const mockMembers = [
  {
    id: 'tm-1',
    member_id: 'mem-1',
    team_id: 'team-1',
    role: 'speler',
    jersey_number: null,
    created_at: '2026-01-01T00:00:00',
    deleted_at: null,
    member: {
      id: 'mem-1',
      first_name: 'Jan',
      last_name: 'Bakker',
      sport: ['voetbal'],
      role: 'lid',
      email: 'jan@example.com',
      phone: null,
      birth_date: null,
      clubbase_id: null,
      created_at: '2026-01-01T00:00:00',
      updated_at: '2026-01-01T00:00:00',
      deleted_at: null,
    },
  },
];

function makeMockClient() {
  return {
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTeam, error: null }),
          }),
        }),
      }),
      select: jest.fn().mockReturnValue({
        ilike: jest.fn().mockReturnValue({
          is: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      }),
    }),
  };
}

beforeEach(() => {
  createSupabaseBrowserClient.mockReturnValue(makeMockClient());
});

// S12-B — Team aanmaken / bewerken
describe('TeamDetailClient', () => {
  it('S12-B: toont teamnaam als heading', () => {
    render(
      <TeamDetailClient
        team={mockTeam}
        teamMembers={mockMembers as unknown as TeamMemberWithMember[]}
        activeTab="gegevens"
      />
    );
    expect(screen.getByRole('heading', { name: 'JO15-1' })).toBeInTheDocument();
  });

  it('toont Bewerken-knop in Gegevens tab', () => {
    render(
      <TeamDetailClient
        team={mockTeam}
        teamMembers={mockMembers as unknown as TeamMemberWithMember[]}
        activeTab="gegevens"
      />
    );
    expect(screen.getByText('Bewerken')).toBeInTheDocument();
  });

  it('opent bewerkformulier bij klik op Bewerken', () => {
    render(
      <TeamDetailClient
        team={mockTeam}
        teamMembers={mockMembers as unknown as TeamMemberWithMember[]}
        activeTab="gegevens"
      />
    );
    fireEvent.click(screen.getByText('Bewerken'));
    expect(screen.getByDisplayValue('JO15-1')).toBeInTheDocument();
  });

  it('toont teamlid in de leden-tab', () => {
    render(
      <TeamDetailClient
        team={mockTeam}
        teamMembers={mockMembers as unknown as TeamMemberWithMember[]}
        activeTab="gegevens"
      />
    );
    const ledenTab = screen.getByText('Leden');
    fireEvent.click(ledenTab);
    expect(screen.getByText('Jan Bakker')).toBeInTheDocument();
  });

  it('opslaan roept update aan', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: mockTeam, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    createSupabaseBrowserClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        update: mockUpdate,
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue({ data: [] }) }),
          }),
        }),
      }),
    });

    render(
      <TeamDetailClient
        team={mockTeam}
        teamMembers={mockMembers as unknown as TeamMemberWithMember[]}
        activeTab="gegevens"
      />
    );

    fireEvent.click(screen.getByText('Bewerken'));

    const input = screen.getByDisplayValue('JO15-1');
    fireEvent.change(input, { target: { value: 'JO15-2' } });

    const saveBtn = screen.getByText('Opslaan');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
