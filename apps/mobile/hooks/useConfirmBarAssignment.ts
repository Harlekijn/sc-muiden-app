import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmBarAssignmentSchema } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';

async function confirmBarAssignment(id: string): Promise<void> {
  const { id: validId } = confirmBarAssignmentSchema.parse({ id });
  const { error } = await supabase
    .from('bar_assignments')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('id', validId);

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
