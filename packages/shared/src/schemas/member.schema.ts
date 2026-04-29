import { z } from 'zod';

const sportSchema = z.enum(['voetbal', 'hockey']);
const userRoleSchema = z.enum([
  'lid',
  'ouder',
  'trainer',
  'coach',
  'teammanager',
  'commissielid',
  'beheerder',
]);

export const profileSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  role: userRoleSchema,
  sport: z.array(sportSchema),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const familyMemberSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  birth_date: z.string().nullable(),
  sport: z.array(sportSchema),
  created_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const createFamilyMemberSchema = z.object({
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  birth_date: z.string().nullable().optional(),
  sport: z.array(sportSchema).min(1, 'Kies minimaal één sport'),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;
export type CreateFamilyMemberInput = z.infer<typeof createFamilyMemberSchema>;
