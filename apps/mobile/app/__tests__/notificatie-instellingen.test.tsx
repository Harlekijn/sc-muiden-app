import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock('lucide-react-native', () => ({
  Bell: () => null,
  ChevronLeft: () => null,
  Clock: () => null,
  Dumbbell: () => null,
}));

const mockMutate = jest.fn();

jest.mock('../../hooks/useUpdateNotificationPreferences', () => ({
  useUpdateNotificationPreferences: () => ({ mutate: mockMutate }),
}));

let mockPrefs: { wedstrijd: boolean; bardienst: boolean; training: boolean } | null = null;
let mockIsLoading = false;

jest.mock('../../hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: () => ({ data: mockPrefs, isLoading: mockIsLoading }),
}));

import NotificatieInstellingenScreen from '../notificatie-instellingen';

describe('NotificatieInstellingenScreen', () => {
  beforeEach(() => {
    mockPrefs = { wedstrijd: true, bardienst: true, training: true };
    mockIsLoading = false;
    mockMutate.mockClear();
  });

  it('toont de drie toggles met labels', () => {
    render(<NotificatieInstellingenScreen />);
    expect(screen.getByText('Wedstrijdherinneringen')).toBeTruthy();
    expect(screen.getByText('Bardienst-herinneringen')).toBeTruthy();
    expect(screen.getByText('Trainingsherinneringen')).toBeTruthy();
  });

  it('toont de caption over herinneringstijden', () => {
    render(<NotificatieInstellingenScreen />);
    expect(screen.getByText(/24 uur van tevoren/)).toBeTruthy();
    expect(screen.getByText(/48 uur van tevoren/)).toBeTruthy();
  });

  it('roept mutate aan met wedstrijd: false bij toggle', () => {
    render(<NotificatieInstellingenScreen />);
    const switches = screen.getAllByRole('switch');
    // Eerste switch = wedstrijd
    fireEvent(switches[0], 'valueChange', false);
    expect(mockMutate).toHaveBeenCalledWith(
      { wedstrijd: false },
      expect.objectContaining({ onError: expect.any(Function) })
    );
  });

  it('gebruikt standaard true als prefs null zijn', () => {
    mockPrefs = null;
    render(<NotificatieInstellingenScreen />);
    const switches = screen.getAllByRole('switch');
    switches.forEach((s) => {
      expect(s.props.value).toBe(true);
    });
  });

  it('toont skeletons tijdens laden', () => {
    mockIsLoading = true;
    render(<NotificatieInstellingenScreen />);
    // Geen toggle-labels zichtbaar tijdens laden
    expect(screen.queryByText('Wedstrijdherinneringen')).toBeNull();
  });
});
