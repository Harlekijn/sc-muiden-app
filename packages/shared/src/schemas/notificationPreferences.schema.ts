import { z } from 'zod';

export const NotificationPreferencesSchema = z.object({
  id:         z.string().uuid({ message: 'Ongeldig ID formaat' }),
  profile_id: z.string().uuid({ message: 'Ongeldig profiel-ID formaat' }),
  wedstrijd:  z.boolean(),
  bardienst:  z.boolean(),
  training:   z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UpdateNotificationPreferencesSchema = z.object({
  wedstrijd: z.boolean().optional(),
  bardienst: z.boolean().optional(),
  training:  z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Minimaal één voorkeur moet worden opgegeven' }
);

export type NotificationPreferencesInput = z.infer<typeof NotificationPreferencesSchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof UpdateNotificationPreferencesSchema>;
