import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  ChevronRight: () => null,
  Clock: () => null,
  MapPin: () => null,
  Users: () => null,
  CheckCircle: () => null,
}));

jest.mock('../../../components/agenda/MonthCalendar', () => ({
  MonthCalendar: () => null,
}));

jest.mock('../../../components/agenda/FamilyFilterChip', () => ({
  FamilyFilterChip: () => null,
}));

jest.mock('../../../hooks/useFamilyMembers', () => ({
  useFamilyMembers: () => ({ data: [] }),
}));

let mockActivities: object[] = [];
let mockIsLoading = false;
let mockIsError = false;

jest.mock('../../../hooks/useAgendaActivities', () => ({
  useAgendaActivities: () => ({
    data: mockActivities,
    isLoading: mockIsLoading,
    isError: mockIsError,
    refetch: jest.fn(),
  }),
}));

// selectedDate must be new Date() at call time so today's activities are shown
jest.mock('../../../stores/agendaStore', () => ({
  useAgendaStore: () => ({
    selectedDate: new Date(),
    familyFilter: 'all',
    setSelectedDate: jest.fn(),
    setFamilyFilter: jest.fn(),
  }),
}));

import AgendaScreen from '../agenda';

function makeActivity(overrides: object = {}): object {
  return {
    id: 'act-1',
    type: 'training',
    sport: 'voetbal',
    team_id: 'team-1',
    recurring_rule_id: null,
    title: 'Training JO11-1',
    starts_at: new Date().toISOString(),
    ends_at: null,
    location: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    team: { id: 'team-1', name: 'JO11-1', sport: 'voetbal' },
    match: null,
    bar_assignments: [],
    ...overrides,
  };
}

describe('AgendaScreen', () => {
  beforeEach(() => {
    mockActivities = [];
    mockIsLoading = false;
    mockIsError = false;
  });

  // S05-B — Dagdetail toont activiteiten van de geselecteerde dag
  it('S05-B: renders activity title for activities on the selected day', () => {
    mockActivities = [makeActivity()];
    render(<AgendaScreen />);
    expect(screen.getByText('Training JO11-1')).toBeTruthy();
  });

  // S05-C — Lege dag toont Dutch lege staat
  it('S05-C: renders Dutch empty state when no activities on selected day', () => {
    render(<AgendaScreen />);
    expect(screen.getByText('Geen activiteiten op deze dag.')).toBeTruthy();
  });

  // UC-06 foutpad — netwerkverlies toont Dutch foutmelding
  it('renders Dutch network error message when query fails', () => {
    mockIsError = true;
    render(<AgendaScreen />);
    expect(
      screen.getByText('Geen verbinding — controleer je internetverbinding en probeer opnieuw.'),
    ).toBeTruthy();
  });
});
