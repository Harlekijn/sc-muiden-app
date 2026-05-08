// S08-A — Push-token opgeslagen na inloggen met permissie
// S08-B — Geen push-token opgeslagen na weigeren permissie
// S08-C — Duplicaat push-token wordt bijgewerkt via upsert

const mockUpsert = jest.fn().mockResolvedValue({ error: null });

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test-token]' }),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({ upsert: mockUpsert })),
  },
}));

jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import * as Notifications from 'expo-notifications';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../../stores/authStore';
import { usePushTokenRegistration } from '../usePushTokenRegistration';

describe('usePushTokenRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (require('expo-secure-store').getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it('S08-A — slaat push-token op wanneer permissie wordt verleend', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ id: 'profile-1' });
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    renderHook(() => usePushTokenRegistration());

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_id: 'profile-1',
          token: 'ExponentPushToken[test-token]',
        }),
        expect.objectContaining({ onConflict: 'token' })
      );
    });
  });

  it('S08-B — slaat geen token op wanneer permissie wordt geweigerd', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ id: 'profile-1' });
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    renderHook(() => usePushTokenRegistration());

    await new Promise((r) => setTimeout(r, 100));
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('S08-C — gebruikt upsert met onConflict: token', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ id: 'profile-1' });
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    renderHook(() => usePushTokenRegistration());

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ onConflict: 'token' })
      );
    });
  });

  it('geen effect wanneer geen profiel beschikbaar is', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue(null);

    renderHook(() => usePushTokenRegistration());

    await new Promise((r) => setTimeout(r, 50));
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
