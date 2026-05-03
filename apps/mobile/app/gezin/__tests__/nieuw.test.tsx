import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

const mockMutateAsync = jest.fn();

jest.mock('../../../hooks/useFamilyLinkRequests', () => ({
  useCreateFamilyLinkRequest: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

import GezinslidNieuwScreen from '../nieuw';

describe('GezinslidNieuwScreen', () => {
  beforeEach(() => {
    mockMutateAsync.mockClear();
    mockMutateAsync.mockResolvedValue(undefined);
  });

  it('shows the success state after form submission', async () => {
    render(<GezinslidNieuwScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Voornaam'), 'Emma');
    fireEvent.changeText(screen.getByPlaceholderText('Achternaam'), 'Testdochter');
    fireEvent.press(screen.getByText('Verzoek indienen'));

    await waitFor(() => {
      expect(screen.getByText('Verzoek ingediend')).toBeTruthy();
    });
  });

  it('submits successfully without birth_date (optional field)', async () => {
    render(<GezinslidNieuwScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Voornaam'), 'Emma');
    fireEvent.changeText(screen.getByPlaceholderText('Achternaam'), 'Testdochter');
    // Deliberately skip the optional birth_date field
    fireEvent.press(screen.getByText('Verzoek indienen'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ first_name: 'Emma', last_name: 'Testdochter' })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Verzoek ingediend')).toBeTruthy();
    });
  });
});
