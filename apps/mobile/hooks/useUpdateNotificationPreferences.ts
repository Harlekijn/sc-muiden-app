import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateNotificationPreferencesInput } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: async (updates: UpdateNotificationPreferencesInput) => {
      if (!profile?.id) throw new Error('Niet ingelogd');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          { profile_id: profile.id, ...updates },
          { onConflict: 'profile_id' }
        );

      if (error) throw error;
    },
    onMutate: async (updates) => {
      if (!profile?.id) return;
      const key = ['notification_preferences', profile.id];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old: Record<string, unknown> | null) =>
        old ? { ...old, ...updates } : old
      );
      return { previous, key };
    },
    onError: (_err, _updates, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(ctx.key, ctx.previous);
      }
    },
    onSettled: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: ['notification_preferences', profile.id] });
      }
    },
  });
}
