import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('lucide-react-native', () => ({
  Bell: () => null,
  ChevronLeft: () => null,
  Clock: () => null,
  Settings: () => null,
}));

jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { signOut: jest.fn() } },
}));

jest.mock('../../../hooks/useAvatarUpload', () => ({
  useAvatarUpload: () => ({ uploading: false, pickAndUpload: jest.fn() }),
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
    member: null,
  }),
}));

// Mutable test state — set before each test
let mockPendingRequests: { id: string; first_name: string; last_name: string; status: string }[] = [];
let mockFamilyMembers: { id: string; first_name: string; last_name: string; sport: string[] }[] = [];

jest.mock('../../../hooks/useFamilyLinkRequests', () => ({
  useFamilyLinkRequests: () => ({ data: mockPendingRequests }),
}));

jest.mock('../../../hooks/useFamilyMembers', () => ({
  useFamilyMembers: () => ({ data: mockFamilyMembers, isLoading: false }),
}));

import ProfielScreen from '../profiel';

describe('ProfielScreen — family section', () => {
  beforeEach(() => {
    mockPendingRequests = [];
    mockFamilyMembers = [];
  });

  it('renders pending requests with "Wacht op goedkeuring" status text', () => {
    mockPendingRequests = [
      { id: 'req-1', first_name: 'Emma', last_name: 'Testdochter', status: 'pending' },
    ];
    render(<ProfielScreen />);
    expect(screen.getByText('Wacht op goedkeuring')).toBeTruthy();
    expect(screen.getByText('Emma Testdochter')).toBeTruthy();
  });

  it('does not render "Wacht op goedkeuring" for approved family members', () => {
    mockFamilyMembers = [
      { id: 'member-1', first_name: 'Emma', last_name: 'Testdochter', sport: [] },
    ];
    render(<ProfielScreen />);
    expect(screen.getByText('Emma Testdochter')).toBeTruthy();
    expect(screen.queryByText('Wacht op goedkeuring')).toBeNull();
  });
});
