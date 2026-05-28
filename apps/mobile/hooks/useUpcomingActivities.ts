import { useQuery } from '@tanstack/react-query';
import type { ActivityWithDetails } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { enrichActivities, type ActivityViewRow } from '../lib/enrichActivities';

export interface UpcomingActivitiesBySection {
  vandaag: ActivityWithDetails[];
  binnenkort: ActivityWithDetails[];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

async function fetchUpcomingActivities(): Promise<UpcomingActivitiesBySection> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const cutoff = new Date(todayStart);
  cutoff.setDate(cutoff.getDate() + 8);

  const { data, error } = await supabase
    .from('activities_with_occurrences')
    .select(
      `id, type, sport, team_id, recurring_rule_id, title, starts_at, ends_at,
       location, notes, created_at, updated_at, deleted_at, is_generated`,
    )
    .gte('starts_at', todayStart.toISOString())
    .lt('starts_at', cutoff.toISOString())
    .is('deleted_at', null)
    .order('starts_at', { ascending: true });

  if (error) throw error;

  const all = await enrichActivities((data ?? []) as unknown as ActivityViewRow[]);
  const tomorrowISO = tomorrowStart.toISOString();

  return {
    vandaag: all.filter((a) => a.starts_at < tomorrowISO),
    binnenkort: all.filter((a) => a.starts_at >= tomorrowISO),
  };
}

export function useUpcomingActivities() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['upcoming-activities', profile?.id],
    queryFn: fetchUpcomingActivities,
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
