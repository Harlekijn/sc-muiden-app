import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'act-1' }),
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  Clock: () => null,
  MapPin: () => null,
  Users: () => null,
  CheckCircle: () => null,
}));

let mockActivity: object | null = null;
let mockIsLoading = false;
let mockIsError = false;

jest.mock('../../../hooks/useActivityDetail', () => ({
  useActivityDetail: () => ({
    data: mockActivity,
    isLoading: mockIsLoading,
    isError: mockIsError,
  }),
}));

jest.mock('../../../hooks/useConfirmBarAssignment', () => ({
  useConfirmBarAssignment: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  }),
}));

import ActiviteitScreen from '../[id]';

function makeActivity(overrides: object = {}): object {
  return {
    id: 'act-1',
    type: 'training',
    sport: 'voetbal',
    team_id: 'team-1',
    recurring_rule_id: null,
    title: 'Training JO11-1',
    starts_at: '2026-05-06T14:00:00.000Z',
    ends_at: null,
    location: 'Sportpark Muiden',
    notes: null,
    created_at: '2026-05-06T00:00:00.000Z',
    updated_at: '2026-05-06T00:00:00.000Z',
    deleted_at: null,
    team: { id: 'team-1', name: 'JO11-1', sport: 'voetbal' },
    match: null,
    bar_assignments: [],
    ...overrides,
  };
}

describe('ActiviteitScreen', () => {
  beforeEach(() => {
    mockActivity = null;
    mockIsLoading = false;
    mockIsError = false;
  });

  // S06-A — Trainingsdetail bekijken (happy path)
  it('S06-A: renders team name and location when training activity is loaded', () => {
    mockActivity = makeActivity();
    render(<ActiviteitScreen />);
    expect(screen.getAllByText('JO11-1').length).toBeGreaterThan(0);
    expect(screen.getByText('Sportpark Muiden')).toBeTruthy();
  });

  // S06-E — Activiteit niet gevonden (error path)
  it('S06-E: renders Dutch error message when activity is not found', () => {
    mockIsError = true;
    render(<ActiviteitScreen />);
    expect(screen.getByText('Deze activiteit is niet meer beschikbaar.')).toBeTruthy();
  });
});
