import { useMutation } from '@tanstack/react-query';
import { createAccountRequestSchema, type CreateAccountRequestInput } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';

export function useSubmitAccountRequest() {
  return useMutation({
    mutationFn: async (input: CreateAccountRequestInput) => {
      const validated = createAccountRequestSchema.parse(input);

      const { error } = await supabase.from('account_requests').insert({
        display_name: validated.display_name,
        email: validated.email.toLowerCase().trim(),
        birth_date: validated.birth_date,
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Er bestaat al een aanvraag voor dit e-mailadres.');
        }
        throw new Error('Er is een fout opgetreden. Probeer het opnieuw.');
      }
    },
  });
}
