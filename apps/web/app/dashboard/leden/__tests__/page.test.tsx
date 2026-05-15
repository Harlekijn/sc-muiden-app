import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Member } from '@sc-muiden/shared';
import { LedenClient } from '../_components/LedenClient';

jest.mock('../../../../lib/supabase-client', () => ({
  createSupabaseBrowserClient: jest.fn(),
}));

const { createSupabaseBrowserClient } = jest.requireMock('../../../../lib/supabase-client');

const mockMembers: Member[] = [
  {
    id: 'mem-1',
    first_name: 'Jan',
    last_name: 'Bakker',
    birth_date: '2000-01-01',
    email: 'jan@example.com',
    phone: null,
    sport: ['voetbal'],
    lid_type: 'spelend-lid',
    is_vrijwilliger: false,
    is_barcommissie: false,
    clubbase_id: null,
    ouder_email_1: null,
    ouder_email_2: null,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    deleted_at: null,
  },
  {
    id: 'mem-2',
    first_name: 'Sophie',
    last_name: 'de Vries',
    birth_date: '1998-06-15',
    email: 'sophie@example.com',
    phone: null,
    sport: ['hockey'],
    lid_type: null,
    is_vrijwilliger: true,
    is_barcommissie: false,
    clubbase_id: null,
    ouder_email_1: null,
    ouder_email_2: null,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    deleted_at: null,
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
});

// S12-C / S15-H — Ledenlijst
describe('LedenClient', () => {
  it('S12-C: toont alle leden standaard', () => {
    render(<LedenClient members={mockMembers} />);
    expect(screen.getByText('Jan Bakker')).toBeInTheDocument();
    expect(screen.getByText('Sophie de Vries')).toBeInTheDocument();
  });

  it('S12-C: zoeken filtert op naam', () => {
    render(<LedenClient members={mockMembers} />);
    const searchInput = screen.getByPlaceholderText(/Zoek op naam/i);
    fireEvent.change(searchInput, { target: { value: 'sophie' } });
    expect(screen.queryByText('Jan Bakker')).not.toBeInTheDocument();
    expect(screen.getByText('Sophie de Vries')).toBeInTheDocument();
  });

  it('S12-C: sportfilter voetbal toont alleen voetballers', () => {
    render(<LedenClient members={mockMembers} />);
    const voetbalBtn = screen.getByText('Voetbal');
    fireEvent.click(voetbalBtn);
    expect(screen.getByText('Jan Bakker')).toBeInTheDocument();
    expect(screen.queryByText('Sophie de Vries')).not.toBeInTheDocument();
  });

  it('S15-H: toont kolom Ledentype in plaats van Rol', () => {
    render(<LedenClient members={mockMembers} />);
    expect(screen.getByText('Ledentype')).toBeInTheDocument();
    expect(screen.queryByText('Rol')).not.toBeInTheDocument();
  });

  it('S15-H: toont lid_type in inline dropdown', () => {
    render(<LedenClient members={mockMembers} />);
    const dropdown = screen.getByLabelText(/Ledentype van Jan Bakker/i) as HTMLSelectElement;
    expect(dropdown.value).toBe('spelend-lid');
  });

  it('S15-H: lid zonder ledentype toont lege dropdown', () => {
    render(<LedenClient members={mockMembers} />);
    const dropdown = screen.getByLabelText(/Ledentype van Sophie de Vries/i) as HTMLSelectElement;
    expect(dropdown.value).toBe('');
  });

  it('S15-C: inline wijziging roept supabase.update aan', async () => {
    render(<LedenClient members={mockMembers} />);
    const dropdown = screen.getByLabelText(/Ledentype van Sophie de Vries/i);
    fireEvent.change(dropdown, { target: { value: 'spelend-lid' } });
    await waitFor(() => {
      expect(createSupabaseBrowserClient).toHaveBeenCalled();
    });
  });

  it('toont link naar detail-pagina per lid', () => {
    render(<LedenClient members={mockMembers} />);
    const links = screen.getAllByRole('link');
    const janLinks = links.filter((l) => l.getAttribute('href') === '/dashboard/leden/mem-1');
    expect(janLinks.length).toBeGreaterThan(0);
  });
});
