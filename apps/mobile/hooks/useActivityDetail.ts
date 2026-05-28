import { useQuery } from '@tanstack/react-query';
import type { ActivityWithDetails } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { enrichActivities, type ActivityViewRow } from '../lib/enrichActivities';

async function fetchActivityDetail(id: string): Promise<ActivityWithDetails | null> {
  const { data, error } = await supabase
    .from('activities_with_occurrences')
    .select(
      `id, type, sport, team_id, recurring_rule_id, title, starts_at, ends_at,
       location, notes, created_at, updated_at, deleted_at, is_generated`,
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const enriched = await enrichActivities([data as unknown as ActivityViewRow]);
  return enriched[0] ?? null;
}

export function useActivityDetail(id: string) {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => fetchActivityDetail(id),
    enabled: !!profile?.id && !!id,
    staleTime: 5 * 60 * 1000,
  });
}
