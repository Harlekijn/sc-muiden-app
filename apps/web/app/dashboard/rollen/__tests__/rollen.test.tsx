import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('../../../../lib/supabase-client', () => ({
  createSupabaseBrowserClient: jest.fn(),
}));

const { createSupabaseBrowserClient } = jest.requireMock('../../../../lib/supabase-client');

import { RollenClient } from '../_components/RollenClient';

const mockProfiles = [
  {
    id: 'user-1',
    role: 'lid',
    member: { first_name: 'Jan', last_name: 'Bakker', email: 'jan@example.com' },
  },
  {
    id: 'user-2',
    role: 'beheerder',
    member: { first_name: 'Piet', last_name: 'Smit', email: 'piet@example.com' },
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

// S12-K — Rol toewijzen
describe('RollenClient', () => {
  it('S12-K: toont alle profielen', () => {
    render(<RollenClient profiles={mockProfiles} currentUserId="user-2" />);
    expect(screen.getByText('Jan Bakker')).toBeInTheDocument();
    expect(screen.getByText('Piet Smit')).toBeInTheDocument();
  });

  it('S12-K: eigen rij heeft uitgeschakelde dropdown', () => {
    render(<RollenClient profiles={mockProfiles} currentUserId="user-2" />);
    const selects = screen.getAllByRole('combobox');
    const ownSelect = selects.find((s) => s.closest('tr')?.textContent?.includes('Piet Smit'));
    expect(ownSelect).toBeDisabled();
  });

  it('S12-K: andere rij heeft ingeschakelde dropdown', () => {
    render(<RollenClient profiles={mockProfiles} currentUserId="user-2" />);
    const selects = screen.getAllByRole('combobox');
    const otherSelect = selects.find((s) => s.closest('tr')?.textContent?.includes('Jan Bakker'));
    expect(otherSelect).not.toBeDisabled();
  });

  it('S12-K: toont bevestigingsdialoog bij rolwijziging', async () => {
    render(<RollenClient profiles={mockProfiles} currentUserId="user-2" />);
    const selects = screen.getAllByRole('combobox');
    const janSelect = selects.find((s) => s.closest('tr')?.textContent?.includes('Jan Bakker'));

    fireEvent.change(janSelect!, { target: { value: 'trainer' } });

    await waitFor(() => {
      expect(screen.getByText(/wijzigen naar/i)).toBeInTheDocument();
    });
  });

  it('S12-K: annuleren sluit dialog zonder wijziging', async () => {
    render(<RollenClient profiles={mockProfiles} currentUserId="user-2" />);
    const selects = screen.getAllByRole('combobox');
    const janSelect = selects.find((s) => s.closest('tr')?.textContent?.includes('Jan Bakker'));

    fireEvent.change(janSelect!, { target: { value: 'trainer' } });
    await waitFor(() => screen.getByText(/wijzigen naar/i));

    fireEvent.click(screen.getByText('Annuleren'));
    expect(screen.queryByText(/wijzigen naar/i)).not.toBeInTheDocument();
  });

  it('S12-K: bevestigen roept Supabase update aan', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    createSupabaseBrowserClient.mockReturnValue({
      from: jest.fn().mockReturnValue({ update: mockUpdate }),
    });

    render(<RollenClient profiles={mockProfiles} currentUserId="user-2" />);
    const selects = screen.getAllByRole('combobox');
    const janSelect = selects.find((s) => s.closest('tr')?.textContent?.includes('Jan Bakker'));

    fireEvent.change(janSelect!, { target: { value: 'trainer' } });
    await waitFor(() => screen.getByText(/wijzigen naar/i));

    fireEvent.click(screen.getByText('Bevestigen'));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ role: 'trainer' });
    });
  });
});
