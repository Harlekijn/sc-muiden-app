import { useQuery } from '@tanstack/react-query';
import type { AnnouncementWithAuthor } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';

async function fetchAnnouncement(id: string): Promise<AnnouncementWithAuthor> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, author:profiles!author_id(display_name)')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return data as unknown as AnnouncementWithAuthor;
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: ['announcement', id],
    queryFn: () => fetchAnnouncement(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
