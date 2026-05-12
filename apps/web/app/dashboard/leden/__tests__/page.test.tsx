import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Member } from '@sc-muiden/shared';
import { LedenClient } from '../_components/LedenClient';

const mockMembers: Member[] = [
  {
    id: 'mem-1',
    first_name: 'Jan',
    last_name: 'Bakker',
    birth_date: '2000-01-01',
    email: 'jan@example.com',
    phone: null,
    sport: ['voetbal'],
    role: 'lid',
    clubbase_id: null,
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
    role: 'trainer',
    clubbase_id: null,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    deleted_at: null,
  },
];

// S12-C — Leden lijst tonen
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

  it('toont rolbadge', () => {
    render(<LedenClient members={mockMembers} />);
    expect(screen.getByText('Trainer')).toBeInTheDocument();
  });

  it('toont link naar detail-pagina per lid', () => {
    render(<LedenClient members={mockMembers} />);
    const link = screen.getByRole('link', { name: /Jan Bakker/i });
    expect(link).toHaveAttribute('href', '/dashboard/leden/mem-1');
  });
});
