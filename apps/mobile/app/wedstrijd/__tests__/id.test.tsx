import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'act-match-1' }),
  usePathname: () => '/wedstrijd/act-match-1',
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  Clock: () => null,
  MapPin: () => null,
  Users: () => null,
  Calendar: () => null,
  Home: () => null,
  Store: () => null,
  User: () => null,
}));

jest.mock('../../../components/ui/BottomTabBar', () => ({
  BottomTabBar: () => null,
}));

let mockMatch: object | null = null;
let mockIsLoading = false;
let mockIsError = false;

jest.mock('../../../hooks/useMatch', () => ({
  useMatch: () => ({
    data: mockMatch,
    isLoading: mockIsLoading,
    isError: mockIsError,
  }),
}));

import WedstrijdDetailScreen from '../[id]';

function makeMatch(overrides: object = {}): object {
  return {
    id: 'match-1',
    activityId: 'act-match-1',
    teamId: 'team-1',
    homeTeam: 'SC Muiden 1',
    awayTeam: 'FC Diemen 1',
    scoreHome: null,
    scoreAway: null,
    status: 'gepland',
    federationMatchId: 'knvb-001',
    federationSource: 'knvb',
    startsAt: '2026-05-17T14:30:00.000Z',
    endsAt: null,
    location: 'Sportpark Muiden, Muiden',
    sport: 'voetbal',
    teamName: 'SC Muiden 1',
    ...overrides,
  };
}

describe('WedstrijdDetailScreen', () => {
  beforeEach(() => {
    mockMatch = null;
    mockIsLoading = false;
    mockIsError = false;
  });

  // S11-D — Gepland wedstrijddetail
  it('S11-D: rendert teamgegevens en locatie bij geplande wedstrijd', () => {
    mockMatch = makeMatch();
    render(<WedstrijdDetailScreen />);
    expect(screen.getByText('GEPLAND')).toBeTruthy();
    expect(screen.getByText('Sportpark Muiden, Muiden')).toBeTruthy();
    expect(screen.getByText('SC Muiden 1 – FC Diemen 1')).toBeTruthy();
  });

  it('S11-D: toont scorebord bij gespeelde wedstrijd', () => {
    mockMatch = makeMatch({ status: 'gespeeld', scoreHome: 3, scoreAway: 1 });
    render(<WedstrijdDetailScreen />);
    expect(screen.getByText('GESPEELD')).toBeTruthy();
    expect(screen.getByText('3 – 1')).toBeTruthy();
  });

  it('toont geen scorebord bij geplande wedstrijd', () => {
    mockMatch = makeMatch({ status: 'gepland' });
    render(<WedstrijdDetailScreen />);
    expect(screen.queryByText(/\d+ – \d+/)).toBeNull();
  });

  it('toont Nederlandse foutmelding als wedstrijd niet gevonden', () => {
    mockIsError = true;
    render(<WedstrijdDetailScreen />);
    expect(screen.getByText('Wedstrijd niet gevonden.')).toBeTruthy();
    expect(screen.getByText('Ga terug naar de kalender.')).toBeTruthy();
  });

  it('toont Nederlandse foutmelding als data null is', () => {
    mockMatch = null;
    mockIsError = false;
    mockIsLoading = false;
    render(<WedstrijdDetailScreen />);
    expect(screen.getByText('Wedstrijd niet gevonden.')).toBeTruthy();
  });
});
