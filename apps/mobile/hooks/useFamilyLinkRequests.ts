import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { familyLinkRequestSchema, createFamilyLinkRequestSchema, type CreateFamilyLinkRequestInput } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

async function fetchRequests(profileId: string) {
  const { data, error } = await supabase
    .from('family_link_requests')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return z.array(familyLinkRequestSchema).parse(data ?? []);
}

export function useFamilyLinkRequests() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['family_link_requests', profile?.id],
    queryFn: () => fetchRequests(profile!.id),
    enabled: !!profile?.id,
  });
}

export function useCreateFamilyLinkRequest() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFamilyLinkRequestInput) => {
      const validated = createFamilyLinkRequestSchema.parse(input);

      let birthDate: string | null = null;
      if (validated.birth_date) {
        // Normalize from DD-MM-YYYY to YYYY-MM-DD for the DB
        const parts = validated.birth_date.split('-');
        if (parts.length === 3 && parts[0].length === 2) {
          birthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
          birthDate = validated.birth_date;
        }
      }

      const { error } = await supabase.from('family_link_requests').insert({
        profile_id: profile!.id,
        first_name: validated.first_name,
        last_name: validated.last_name,
        birth_date: birthDate,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family_link_requests', profile?.id] });
    },
  });
}
