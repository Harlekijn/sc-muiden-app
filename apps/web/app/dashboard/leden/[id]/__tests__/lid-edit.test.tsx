import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../../../../lib/supabase-client', () => ({
  createSupabaseBrowserClient: jest.fn(),
}));

const { createSupabaseBrowserClient } = jest.requireMock('../../../../../lib/supabase-client');

import { LidEditForm } from '../_components/LidEditForm';
import type { Member, Sport } from '@sc-muiden/shared';

const mockMember: Member = {
  id: 'mem-1',
  first_name: 'Jan',
  last_name: 'Bakker',
  birth_date: '1990-01-01',
  email: 'jan@test.nl',
  phone: null,
  sport: ['voetbal'] as Sport[],
  role: 'lid',
  clubbase_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
};

beforeEach(() => {
  createSupabaseBrowserClient.mockReturnValue({
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  });
});

// S12-C — Lid bewerken
describe('LidEditForm', () => {
  it('S12-C: toont leesweergave met Bewerken knop', () => {
    render(<LidEditForm member={mockMember} />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Bewerken')).toBeInTheDocument();
    expect(screen.queryByText('Opslaan')).not.toBeInTheDocument();
  });

  it('S12-C: klikken Bewerken toont formulier met huidige waarden', () => {
    render(<LidEditForm member={mockMember} />);
    fireEvent.click(screen.getByText('Bewerken'));
    expect(screen.getByDisplayValue('Jan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bakker')).toBeInTheDocument();
    expect(screen.getByText('Opslaan')).toBeInTheDocument();
  });

  it('S12-C: lege achternaam toont Achternaam is verplicht', async () => {
    render(<LidEditForm member={mockMember} />);
    fireEvent.click(screen.getByText('Bewerken'));
    fireEvent.change(screen.getByDisplayValue('Bakker'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Opslaan'));
    await waitFor(() => {
      expect(screen.getByText('Achternaam is verplicht')).toBeInTheDocument();
    });
  });

  it('S12-C: succesvolle opslag toont Wijzigingen opgeslagen', async () => {
    render(<LidEditForm member={mockMember} />);
    fireEvent.click(screen.getByText('Bewerken'));
    fireEvent.click(screen.getByText('Opslaan'));
    await waitFor(() => {
      expect(screen.getByText('Wijzigingen opgeslagen')).toBeInTheDocument();
    });
  });

  it('S12-C: DB-fout toont Opslaan mislukt bericht', async () => {
    createSupabaseBrowserClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'db error' } }),
        }),
      }),
    });
    render(<LidEditForm member={mockMember} />);
    fireEvent.click(screen.getByText('Bewerken'));
    fireEvent.click(screen.getByText('Opslaan'));
    await waitFor(() => {
      expect(screen.getByText('Opslaan mislukt. Probeer het opnieuw.')).toBeInTheDocument();
    });
  });
});
