import { useQuery } from '@tanstack/react-query';
import type { ActivityWithDetails } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { enrichActivities, type ActivityViewRow } from '../lib/enrichActivities';

async function fetchAgendaActivities(
  year: number,
  month: number,
): Promise<ActivityWithDetails[]> {
  const monthStart = new Date(year, month - 1, 1).toISOString();
  const monthEnd = new Date(year, month, 1).toISOString();

  const { data, error } = await supabase
    .from('activities_with_occurrences')
    .select(
      `id, type, sport, team_id, recurring_rule_id, title, starts_at, ends_at,
       location, notes, created_at, updated_at, deleted_at, is_generated`,
    )
    .gte('starts_at', monthStart)
    .lt('starts_at', monthEnd)
    .is('deleted_at', null)
    .order('starts_at', { ascending: true });

  if (error) throw error;

  return enrichActivities((data ?? []) as unknown as ActivityViewRow[]);
}

export function useAgendaActivities(year: number, month: number) {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['agenda', profile?.id, year, month],
    queryFn: () => fetchAgendaActivities(year, month),
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
