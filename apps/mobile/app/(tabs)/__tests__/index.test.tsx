import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('lucide-react-native', () => ({
  Bell: () => null,
  Settings: () => null,
}));

jest.mock('../../../components/ui/AppHeader', () => ({
  AppHeader: () => null,
}));

jest.mock('../../../components/agenda/ActivityCard', () => ({
  ActivityCard: ({ activity }: { activity: { title: string } }) => (
    <Text>{activity.title}</Text>
  ),
}));

jest.mock('../../../hooks/useFamilyMembers', () => ({
  useFamilyMembers: () => ({ data: [] }),
}));

jest.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({
    profile: {
      id: 'user-1',
      display_name: 'Test Gebruiker',
      email: 'test@scmuiden.nl',
      avatar_url: null,
      role: 'lid',
      member_id: null,
    },
  }),
}));

jest.mock('../../../stores/agendaStore', () => ({
  useAgendaStore: () => ({
    familyFilter: 'all',
    setFamilyFilter: jest.fn(),
  }),
}));

let mockData: { vandaag: object[]; binnenkort: object[] } | undefined = undefined;
let mockIsLoading = false;

jest.mock('../../../hooks/useUpcomingActivities', () => ({
  useUpcomingActivities: () => ({
    data: mockData,
    isLoading: mockIsLoading,
    refetch: jest.fn(),
  }),
}));

import HomeScreen from '../index';

describe('HomeScreen', () => {
  beforeEach(() => {
    mockIsLoading = false;
    mockData = { vandaag: [], binnenkort: [] };
  });

  it('toont sectielabel VANDAAG en BINNENKORT', () => {
    render(<HomeScreen />);
    expect(screen.getByText('VANDAAG')).toBeTruthy();
    expect(screen.getByText('BINNENKORT')).toBeTruthy();
  });

  it('toont lege staat "Geen activiteiten vandaag." wanneer vandaag leeg is', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Geen activiteiten vandaag.')).toBeTruthy();
  });

  it('toont lege staat "Niets gepland de komende week." wanneer binnenkort leeg is', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Niets gepland de komende week.')).toBeTruthy();
  });

  it('toont activiteitstitels in de juiste sectie', () => {
    mockData = {
      vandaag: [
        { id: '1', title: 'Training Zondag', type: 'training', sport: 'voetbal',
          team_id: null, recurring_rule_id: null, starts_at: new Date().toISOString(),
          ends_at: null, location: null, notes: null, created_at: '', updated_at: '',
          deleted_at: null, team: null, match: null, bar_assignments: [] },
      ],
      binnenkort: [
        { id: '2', title: 'Wedstrijd Maandag', type: 'wedstrijd', sport: 'voetbal',
          team_id: null, recurring_rule_id: null, starts_at: new Date(Date.now() + 86400_000).toISOString(),
          ends_at: null, location: null, notes: null, created_at: '', updated_at: '',
          deleted_at: null, team: null, match: null, bar_assignments: [] },
      ],
    };
    render(<HomeScreen />);
    expect(screen.getByText('Training Zondag')).toBeTruthy();
    expect(screen.getByText('Wedstrijd Maandag')).toBeTruthy();
  });

  it('toont geen lege staat wanneer data aanwezig is', () => {
    mockData = {
      vandaag: [
        { id: '1', title: 'Training', type: 'training', sport: 'voetbal',
          team_id: null, recurring_rule_id: null, starts_at: new Date().toISOString(),
          ends_at: null, location: null, notes: null, created_at: '', updated_at: '',
          deleted_at: null, team: null, match: null, bar_assignments: [] },
      ],
      binnenkort: [],
    };
    render(<HomeScreen />);
    expect(screen.queryByText('Geen activiteiten vandaag.')).toBeNull();
  });
});
