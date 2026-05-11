import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LedenPage from '../page';

jest.mock('../../../../lib/supabase-client', () => ({
  createSupabaseBrowserClient: jest.fn(),
}));

const { createSupabaseBrowserClient } = jest.requireMock('../../../../lib/supabase-client');

function makeMock(role: string | null) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: role ? { role } : null }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  };
}

// S08-B — Commissielid heeft geen toegang tot de reset-sectie
describe('LedenPage rolbeveiliging', () => {
  it('S08-B: toont de reset-sectie NIET voor een commissielid', async () => {
    (createSupabaseBrowserClient as jest.Mock).mockReturnValue(makeMock('commissielid'));
    render(<LedenPage />);

    await waitFor(() => {
      expect(screen.queryByText('Wachtwoord-resetmail sturen')).not.toBeInTheDocument();
    });
  });

  // S08-A — Beheerder stuurt resetmail voor een lid
  it('S08-A: toont de reset-sectie WEL voor een beheerder', async () => {
    (createSupabaseBrowserClient as jest.Mock).mockReturnValue(makeMock('beheerder'));
    render(<LedenPage />);

    await waitFor(() => {
      expect(screen.getByText('Wachtwoord-resetmail sturen')).toBeInTheDocument();
    });
  });
});
