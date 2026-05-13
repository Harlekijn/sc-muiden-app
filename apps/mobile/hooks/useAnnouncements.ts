import { useQuery } from '@tanstack/react-query';
import type { AnnouncementWithAuthor } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

type AnnouncementFilter = 'alle' | 'voetbal' | 'hockey';

async function fetchAnnouncements(
  filter: AnnouncementFilter,
): Promise<AnnouncementWithAuthor[]> {
  let query = supabase
    .from('announcements')
    .select('*, author:profiles!author_id(display_name)')
    .is('deleted_at', null)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });

  if (filter === 'voetbal') {
    query = query.or('sport.is.null,sport.cs.{"voetbal"}');
  } else if (filter === 'hockey') {
    query = query.or('sport.is.null,sport.cs.{"hockey"}');
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AnnouncementWithAuthor[];
}

export function useAnnouncements(filter: AnnouncementFilter = 'alle') {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['announcements', filter],
    queryFn: () => fetchAnnouncements(filter),
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
  });
}
