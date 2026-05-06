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
  avatar_url: z.string().nullable(),
  role: userRoleSchema,
  sport: z.array(sportSchema),
  member_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const memberSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  birth_date: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  sport: z.array(sportSchema),
  role: userRoleSchema,
  clubbase_id: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const familyLinkRequestSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  birth_date: z.string().nullable(),
  member_id: z.string().uuid().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']),
  admin_notes: z.string().nullable(),
  reviewed_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createFamilyLinkRequestSchema = z.object({
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  birth_date: z.string().nullable().optional(),
});

export const updateProfileSchema = z.object({
  display_name: z.string().min(2, 'Naam is verplicht'),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type MemberInput = z.infer<typeof memberSchema>;
export type FamilyLinkRequestInput = z.infer<typeof familyLinkRequestSchema>;
export type CreateFamilyLinkRequestInput = z.infer<typeof createFamilyLinkRequestSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
