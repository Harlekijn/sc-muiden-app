import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

global.fetch = jest.fn();

jest.mock('lucide-react', () => ({
  RefreshCw: () => null,
  AlertCircle: () => null,
  Loader: () => null,
  Check: () => null,
  X: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
}));

import SynchronisatiePage from '../page';

describe('SynchronisatiePage', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockReset();
  });

  it('rendert voetbal en hockey secties', () => {
    render(<SynchronisatiePage />);
    const voetbalItems = screen.getAllByText('Voetbal');
    const hockeyItems = screen.getAllByText('Hockey');
    expect(voetbalItems.length).toBeGreaterThan(0);
    expect(hockeyItems.length).toBeGreaterThan(0);
  });

  it('toont "Nog nooit gesynchroniseerd." als er geen sync is', () => {
    render(<SynchronisatiePage />);
    const neverSyncedTexts = screen.getAllByText('Nog nooit gesynchroniseerd.');
    expect(neverSyncedTexts.length).toBe(2);
  });

  // S11-C — Handmatige sync via CMS — API onbereikbaar
  it('toont foutbanner bij mislukte sync', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, message: 'Synchronisatie mislukt. Probeer het opnieuw.' }),
    });

    render(<SynchronisatiePage />);
    const knoppen = screen.getAllByText('Synchroniseer nu');
    fireEvent.click(knoppen[0]);

    await waitFor(() => {
      expect(screen.getByText('Synchronisatie mislukt. Probeer het opnieuw.')).toBeTruthy();
    });
  });

  // S11-B — Handmatige sync via CMS — succesvol
  it('toont geen foutbanner bij succesvolle sync', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, lastSyncAt: '2026-05-11T14:30:00.000Z' }),
    });

    render(<SynchronisatiePage />);
    const knoppen = screen.getAllByText('Synchroniseer nu');
    fireEvent.click(knoppen[0]);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  it('klapt logpaneel open bij klik op toggle', () => {
    render(<SynchronisatiePage />);
    const toggles = screen.getAllByText('Laatste 10 syncs');
    fireEvent.click(toggles[0]);
    expect(screen.getAllByText('Nog geen syncruns.')[0]).toBeTruthy();
  });
});
