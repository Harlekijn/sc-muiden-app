import { useMutation } from '@tanstack/react-query';
import { updateProfileSchema, type UpdateProfileInput } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function useUpdateProfile() {
  const { profile, setProfile } = useAuthStore();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const validated = updateProfileSchema.parse(input);

      const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: validated.display_name })
        .eq('id', profile!.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (profile && data) {
        setProfile({ ...profile, display_name: data.display_name });
      }
    },
  });
}
