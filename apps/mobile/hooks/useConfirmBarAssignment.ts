import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

async function confirmBarAssignment(id: string): Promise<void> {
  const { error } = await supabase
    .from('bar_assignments')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export function useConfirmBarAssignment(activityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => confirmBarAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
    },
  });
}
