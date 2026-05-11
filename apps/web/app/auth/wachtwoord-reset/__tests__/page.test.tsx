import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KoppelingNietGeldig } from '../page';
import { NieuwWachtwoordForm } from '../NieuwWachtwoordForm';

jest.mock('../../../../lib/supabase-client', () => ({
  createSupabaseBrowserClient: jest.fn(),
}));

const { createSupabaseBrowserClient } = jest.requireMock('../../../../lib/supabase-client');

// S01-K — Vervallen herstelkoppeling
describe('KoppelingNietGeldig (S01-K)', () => {
  it('S01-K: toont de melding "niet meer geldig" zonder formulier', () => {
    render(<KoppelingNietGeldig />);
    expect(screen.getByText('Koppeling niet meer geldig')).toBeInTheDocument();
    expect(screen.getByText('Deze koppeling is niet meer geldig.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

// S01-J — Nieuw wachtwoord instellen via webpagina
describe('NieuwWachtwoordForm (S01-J)', () => {
  beforeEach(() => {
    (createSupabaseBrowserClient as jest.Mock).mockReturnValue({
      auth: {
        updateUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'u1' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
  });

  it('S01-J: toont het formulier met wachtwoordvelden', () => {
    render(<NieuwWachtwoordForm />);
    expect(screen.getByLabelText('Nieuw wachtwoord')).toBeInTheDocument();
    expect(screen.getByLabelText('Wachtwoord bevestigen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wachtwoord opslaan' })).toBeInTheDocument();
  });

  it('S01-J: toont succesmelding na succesvol opslaan', async () => {
    render(<NieuwWachtwoordForm />);
    fireEvent.change(screen.getByLabelText('Nieuw wachtwoord'), {
      target: { value: 'Wachtwoord1' },
    });
    fireEvent.change(screen.getByLabelText('Wachtwoord bevestigen'), {
      target: { value: 'Wachtwoord1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Wachtwoord opslaan' }));

    await waitFor(() => {
      expect(
        screen.getByText('Je wachtwoord is gewijzigd. Je kunt nu inloggen in de app of het CMS.')
      ).toBeInTheDocument();
    });
  });

  it('S01-J: toont foutmelding als updateUser mislukt', async () => {
    (createSupabaseBrowserClient as jest.Mock).mockReturnValue({
      auth: {
        updateUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Server error' },
        }),
      },
      from: jest.fn(),
    });

    render(<NieuwWachtwoordForm />);
    fireEvent.change(screen.getByLabelText('Nieuw wachtwoord'), {
      target: { value: 'Wachtwoord1' },
    });
    fireEvent.change(screen.getByLabelText('Wachtwoord bevestigen'), {
      target: { value: 'Wachtwoord1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Wachtwoord opslaan' }));

    await waitFor(() => {
      expect(
        screen.getByText('Er is een fout opgetreden. Probeer het opnieuw.')
      ).toBeInTheDocument();
    });
  });
});
