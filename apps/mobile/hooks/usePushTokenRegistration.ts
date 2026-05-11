import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

const PUSH_ASKED_KEY = 'push_permission_asked';

async function registerPushToken(profileId: string): Promise<void> {
  const alreadyAsked = await SecureStore.getItemAsync(PUSH_ASKED_KEY);

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted' && !alreadyAsked) {
    await SecureStore.setItemAsync(PUSH_ASKED_KEY, 'true');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  await supabase
    .from('push_tokens')
    .upsert(
      { profile_id: profileId, token, platform },
      { onConflict: 'token' }
    );
}

export function usePushTokenRegistration(): void {
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (!profile?.id) return;
    registerPushToken(profile.id).catch(() => {
      // Push-registratie is niet kritiek — stil falen is acceptabel
    });
  }, [profile?.id]);
}
