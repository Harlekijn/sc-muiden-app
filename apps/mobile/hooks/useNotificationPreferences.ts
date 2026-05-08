import { useQuery } from '@tanstack/react-query';
import type { NotificationPreferences } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

async function fetchNotificationPreferences(profileId: string): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) throw error;
  return data as NotificationPreferences | null;
}

export function useNotificationPreferences() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['notification_preferences', profile?.id],
    queryFn: () => fetchNotificationPreferences(profile!.id),
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
  });
}
