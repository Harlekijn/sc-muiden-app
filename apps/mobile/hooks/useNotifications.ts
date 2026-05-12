import { useQuery } from '@tanstack/react-query';
import type { NotificationWithContext } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

async function fetchNotifications(profileId: string): Promise<NotificationWithContext[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as NotificationWithContext[];
}

export function useNotifications() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0,
  });
}
