import React from 'react';
import { render, screen } from '@testing-library/react';
import { GeenToegang } from '../_components/GeenToegang';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../../lib/supabase-client', () => ({
  createSupabaseBrowserClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}));

describe('GeenToegang', () => {
  it('renders the "Geen toegang" heading', () => {
    render(<GeenToegang />);
    expect(screen.getByRole('heading', { name: 'Geen toegang' })).toBeInTheDocument();
  });

  it('renders the explanation text', () => {
    render(<GeenToegang />);
    expect(screen.getByText(/geen beheerdersrechten/i)).toBeInTheDocument();
  });

  it('renders a sign-out button labeled Uitloggen', () => {
    render(<GeenToegang />);
    expect(screen.getByRole('button', { name: 'Uitloggen' })).toBeInTheDocument();
  });
});

// S12-K — Gewone gebruiker kan CMS niet benaderen
describe('GeenToegang — S12-K CMS toegangsblokkering', () => {
  it('S12-K: niet-CMS gebruiker ziet Geen toegang heading', () => {
    render(<GeenToegang />);
    expect(screen.getByRole('heading', { name: 'Geen toegang' })).toBeInTheDocument();
    expect(screen.getByText(/geen beheerdersrechten/i)).toBeInTheDocument();
  });

  it('S12-K: Uitloggen knop aanwezig zodat gebruiker kan uitloggen', () => {
    render(<GeenToegang />);
    expect(screen.getByRole('button', { name: 'Uitloggen' })).toBeInTheDocument();
  });
});
