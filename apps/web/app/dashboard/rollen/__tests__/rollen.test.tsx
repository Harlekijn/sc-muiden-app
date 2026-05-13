import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  redirect: jest.fn(),
}));

jest.mock('../../../../lib/supabase-client', () => ({
  createSupabaseBrowserClient: jest.fn(),
}));

jest.mock('../../../../lib/supabase-server', () => ({
  createSupabaseServerClient: jest.fn(),
}));

const { createSupabaseBrowserClient } = jest.requireMock('../../../../lib/supabase-client');
const { createSupabaseServerClient } = jest.requireMock('../../../../lib/supabase-server');

import { RollenClient } from '../_components/RollenClient';
import RollenPage from '../page';

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

// S15-E / S12-H — Rolbeheer vereenvoudigd
describe('RollenClient', () => {
  it('S12-K: toont alle profielen', () => {
    render(<RollenClient profiles={mockProfiles} currentUserId="user-2" />);
    expect(screen.getByText('Jan Bakker')).toBeInTheDocument();
    expect(screen.getByText('Piet Smit')).toBeInTheDocument();
  });

  it('S15-E: dropdown toont alleen Lid en Beheerder opties', () => {
    render(<RollenClient profiles={mockProfiles} currentUserId="user-2" />);
    const selects = screen.getAllByRole('combobox');
    const janSelect = selects.find((s) => s.closest('tr')?.textContent?.includes('Jan Bakker'))!;
    const options = Array.from((janSelect as HTMLSelectElement).options).map((o) => o.value);
    expect(options).toEqual(['lid', 'beheerder']);
    expect(options).not.toContain('commissielid');
    expect(options).not.toContain('trainer');
    expect(options).not.toContain('ouder');
  });

  it('S15-F: eigen rij heeft uitgeschakelde dropdown', () => {
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

  it('S15-D: toont bevestigingsdialoog bij rolwijziging naar beheerder', async () => {
    render(<RollenClient profiles={mockProfiles} currentUserId="user-2" />);
    const selects = screen.getAllByRole('combobox');
    const janSelect = selects.find((s) => s.closest('tr')?.textContent?.includes('Jan Bakker'));
    fireEvent.change(janSelect!, { target: { value: 'beheerder' } });
    await waitFor(() => {
      expect(screen.getByText(/wijzigen naar/i)).toBeInTheDocument();
    });
  });

  it('S12-K: annuleren sluit dialog zonder wijziging', async () => {
    render(<RollenClient profiles={mockProfiles} currentUserId="user-2" />);
    const selects = screen.getAllByRole('combobox');
    const janSelect = selects.find((s) => s.closest('tr')?.textContent?.includes('Jan Bakker'));
    fireEvent.change(janSelect!, { target: { value: 'beheerder' } });
    await waitFor(() => screen.getByText(/wijzigen naar/i));
    fireEvent.click(screen.getByText('Annuleren'));
    expect(screen.queryByText(/wijzigen naar/i)).not.toBeInTheDocument();
  });

  it('S15-D: bevestigen roept Supabase update aan met nieuwe rol', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    createSupabaseBrowserClient.mockReturnValue({
      from: jest.fn().mockReturnValue({ update: mockUpdate }),
    });

    render(<RollenClient profiles={mockProfiles} currentUserId="user-2" />);
    const selects = screen.getAllByRole('combobox');
    const janSelect = selects.find((s) => s.closest('tr')?.textContent?.includes('Jan Bakker'));
    fireEvent.change(janSelect!, { target: { value: 'beheerder' } });
    await waitFor(() => screen.getByText(/wijzigen naar/i));
    fireEvent.click(screen.getByText('Bevestigen'));
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ role: 'beheerder' });
    });
  });
});

// S15-G / S04-H — Rolbeheer toegangsbewaking
describe('RollenPage — toegangsbewaking', () => {
  it('S15-G: lid ziet GeenToegang component', async () => {
    createSupabaseServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { role: 'lid' }, error: null }),
          }),
        }),
      }),
    });
    const jsx = await RollenPage();
    render(jsx);
    expect(screen.getByRole('heading', { name: /geen toegang/i })).toBeInTheDocument();
  });

  it('S04-H: niet-ingelogde gebruiker ziet GeenToegang component', async () => {
    createSupabaseServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: jest.fn(),
    });
    const jsx = await RollenPage();
    render(jsx);
    expect(screen.getByRole('heading', { name: /geen toegang/i })).toBeInTheDocument();
  });
});
