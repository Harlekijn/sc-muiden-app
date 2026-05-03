import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { memberSchema } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { Member } from '@sc-muiden/shared';

interface FamilyMemberWithLink extends Member {
  linkId: string;
}

async function fetchFamilyMembers(profileId: string): Promise<FamilyMemberWithLink[]> {
  const { data, error } = await supabase
    .from('user_family_members')
    .select('id, member_id, members(*)')
    .eq('profile_id', profileId);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    linkId: row.id as string,
    ...(z.object({ members: memberSchema }).parse(row).members),
  }));
}

export function useFamilyMembers() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['family_members', profile?.id],
    queryFn: () => fetchFamilyMembers(profile!.id),
    enabled: !!profile?.id,
  });
}
