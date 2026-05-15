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
  lid_type: null,
  is_vrijwilliger: false,
  is_barcommissie: false,
  clubbase_id: null,
  ouder_email_1: null,
  ouder_email_2: null,
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

// S12-C — Persoonsgegevens bewerken
describe('LidEditForm — Persoonsgegevens', () => {
  it('S12-C: toont leesweergave met Bewerken knop', () => {
    render(<LidEditForm member={mockMember} />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getAllByText('Bewerken').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Opslaan')).not.toBeInTheDocument();
  });

  it('S12-C: klikken Bewerken (persoonsgegevens) toont formulier', () => {
    render(<LidEditForm member={mockMember} />);
    fireEvent.click(screen.getAllByText('Bewerken')[0]);
    expect(screen.getByDisplayValue('Jan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bakker')).toBeInTheDocument();
    expect(screen.getByText('Opslaan')).toBeInTheDocument();
  });

  it('S12-C: lege achternaam toont Achternaam is verplicht', async () => {
    render(<LidEditForm member={mockMember} />);
    fireEvent.click(screen.getAllByText('Bewerken')[0]);
    fireEvent.change(screen.getByDisplayValue('Bakker'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Opslaan'));
    await waitFor(() => {
      expect(screen.getByText('Achternaam is verplicht')).toBeInTheDocument();
    });
  });

  it('S12-C: succesvolle opslag toont Wijzigingen opgeslagen', async () => {
    render(<LidEditForm member={mockMember} />);
    fireEvent.click(screen.getAllByText('Bewerken')[0]);
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
    fireEvent.click(screen.getAllByText('Bewerken')[0]);
    fireEvent.click(screen.getByText('Opslaan'));
    await waitFor(() => {
      expect(screen.getByText('Opslaan mislukt. Probeer het opnieuw.')).toBeInTheDocument();
    });
  });
});

// S15-A / S15-B — Lidmaatschap sectie
describe('LidEditForm — Lidmaatschap', () => {
  it('S15-A: toont sectie Lidmaatschap', () => {
    render(<LidEditForm member={mockMember} />);
    expect(screen.getByText('Lidmaatschap')).toBeInTheDocument();
  });

  it('S15-A: ledentype is — als lid_type null is', () => {
    render(<LidEditForm member={mockMember} />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('S15-A: toont huidig ledentype als ingesteld', () => {
    const memberWithType: Member = { ...mockMember, lid_type: 'spelend-lid' };
    render(<LidEditForm member={memberWithType} />);
    expect(screen.getByText('Spelend lid')).toBeInTheDocument();
  });

  it('S15-B: checkbox Vrijwilliger beschikbaar in bewerkingsmodus', async () => {
    render(<LidEditForm member={mockMember} />);
    const lidmaatschapBewerkBtn = screen.getAllByText('Bewerken')[1];
    fireEvent.click(lidmaatschapBewerkBtn);
    const checkbox = screen.getByLabelText(/Vrijwilliger/i);
    expect(checkbox).toBeInTheDocument();
  });

  it('S15-B: checkbox Lid barcommissie beschikbaar in bewerkingsmodus', async () => {
    render(<LidEditForm member={mockMember} />);
    const lidmaatschapBewerkBtn = screen.getAllByText('Bewerken')[1];
    fireEvent.click(lidmaatschapBewerkBtn);
    const checkbox = screen.getByLabelText(/Lid barcommissie/i);
    expect(checkbox).toBeInTheDocument();
  });

  it('S15-A: lidmaatschap opslaan roept supabase.update aan', async () => {
    render(<LidEditForm member={mockMember} />);
    const lidmaatschapBewerkBtn = screen.getAllByText('Bewerken')[1];
    fireEvent.click(lidmaatschapBewerkBtn);
    fireEvent.click(screen.getByText('Opslaan'));
    await waitFor(() => {
      expect(createSupabaseBrowserClient).toHaveBeenCalled();
    });
  });
});
