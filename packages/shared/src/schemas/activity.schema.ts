import { z } from 'zod';

const activityTypeSchema = z.enum(['training', 'wedstrijd', 'bardienst', 'clubactiviteit']);
const sportSchema = z.enum(['voetbal', 'hockey']);

export const activitySchema = z.object({
  id: z.string().uuid(),
  type: activityTypeSchema,
  sport: sportSchema.nullable(),
  team_id: z.string().uuid().nullable(),
  title: z.string().min(1),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime().nullable(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const createActivitySchema = z.object({
  type: activityTypeSchema,
  sport: sportSchema.nullable().optional(),
  team_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Titel is verplicht'),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime().nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const barAssignmentSchema = z.object({
  id: z.string().uuid(),
  activity_id: z.string().uuid(),
  family_member_id: z.string().uuid(),
  confirmed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export const confirmBarAssignmentSchema = z.object({
  id: z.string().uuid('Ongeldige toewijzing-ID'),
});

export type ActivityInput = z.infer<typeof activitySchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type BarAssignmentInput = z.infer<typeof barAssignmentSchema>;
export type ConfirmBarAssignmentInput = z.infer<typeof confirmBarAssignmentSchema>;
