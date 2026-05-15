import { z } from 'zod';

const sportSchema = z.enum(['voetbal', 'hockey']);
const userRoleSchema = z.enum(['lid', 'beheerder']);
const lidTypeSchema = z.enum([
  'jeugdlid',
  'niet-spelend-lid',
  'trainingslid',
  'spelend-lid',
  'relatie',
]);

// ── Teams ─────────────────────────────────────────────────────────────────────

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Teamnaam is verplicht'),
  sport: sportSchema,
  age_category: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
  federation_team_id: z.string().nullable().optional(),
});

export const updateTeamSchema = createTeamSchema.partial();

// ── Team members ──────────────────────────────────────────────────────────────

export const addTeamMemberSchema = z.object({
  team_id: z.string().uuid('Ongeldig team-ID'),
  member_id: z.string().uuid('Ongeldig lid-ID'),
  role: z.enum(['speler', 'trainer', 'coach', 'teammanager']),
  jersey_number: z.number().int().min(1).max(99).nullable().optional(),
});

// ── Activities ────────────────────────────────────────────────────────────────

const startsAtSchema = z
  .string()
  .min(1, 'Begintijd is verplicht')
  .refine((v) => !isNaN(Date.parse(v)), { message: 'Ongeldige begintijd' });

const endsAtSchema = z
  .string()
  .refine((v) => !v || !isNaN(Date.parse(v)), { message: 'Ongeldige eindtijd' })
  .nullable()
  .optional();

export const createTrainingSchema = z
  .object({
    team_id: z.string().uuid('Selecteer een team'),
    starts_at: startsAtSchema,
    ends_at: endsAtSchema,
    location: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    is_recurring: z.boolean().default(false),
    valid_from: z.string().optional(),
    valid_until: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_recurring) {
      if (!data.valid_from) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['valid_from'],
          message: 'Geldig-van datum is verplicht voor terugkerende training',
        });
      }
      if (!data.valid_until) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['valid_until'],
          message: 'Geldig-tot datum is verplicht voor terugkerende training',
        });
      }
    }
  });

export const createClubactiviteitSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  starts_at: startsAtSchema,
  ends_at: endsAtSchema,
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  sport: sportSchema.nullable().optional(),
});

export const createBardienstSchema = z.object({
  starts_at: startsAtSchema,
  ends_at: endsAtSchema,
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  sport: sportSchema.nullable().optional(),
  assigned_member_ids: z.array(z.string().uuid()).default([]),
});

export const updateActivitySchema = z.object({
  title: z.string().min(1, 'Titel is verplicht').optional(),
  starts_at: startsAtSchema.optional(),
  ends_at: endsAtSchema,
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  sport: sportSchema.nullable().optional(),
  team_id: z.string().uuid().nullable().optional(),
  update_scope: z.enum(['single', 'future']).default('single'),
});

// ── Members ───────────────────────────────────────────────────────────────────

export const updateMemberSchema = z.object({
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  birth_date: z.string().nullable().optional(),
  email: z.string().email('Ongeldig e-mailadres').nullable().optional(),
  phone: z.string().nullable().optional(),
  sport: z.array(sportSchema).default([]),
  lid_type: lidTypeSchema.nullable().optional(),
  is_vrijwilliger: z.boolean().optional(),
  is_barcommissie: z.boolean().optional(),
});

// ── Roles ─────────────────────────────────────────────────────────────────────

export const updateRoleSchema = z.object({
  profile_id: z.string().uuid('Ongeldig profiel-ID'),
  new_role: userRoleSchema,
});

// ── CSV import ────────────────────────────────────────────────────────────────

export const csvColumnMappingSchema = z.object({
  voornaam: z.string().optional(),
  achternaam: z.string().optional(),
  geboortedatum: z.string().optional(),
  email: z.string().optional(),
  telefoon: z.string().optional(),
  sport: z.string().optional(),
  rol: z.string().optional(),
  clubbase_id: z.string().optional(),
});

export const csvImportRowDataSchema = z.object({
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  birth_date: z.string().nullable().optional(),
  email: z.string().email('Ongeldig e-mailadres').nullable().optional(),
  phone: z.string().nullable().optional(),
  sport: z.array(sportSchema).default([]),
  clubbase_id: z.string().nullable().optional(),
});

// ── Bardienst Rooster ─────────────────────────────────────────────────────────

export const createBarDaySlotSchema = z
  .object({
    date: z
      .string()
      .min(1, { message: 'Datum is verplicht' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ongeldige datum' }),
    starts_at: z
      .string()
      .min(1, { message: 'Begintijd is verplicht' })
      .regex(/^\d{2}:\d{2}$/, { message: 'Ongeldige begintijd' }),
    ends_at: z
      .string()
      .min(1, { message: 'Eindtijd is verplicht' })
      .regex(/^\d{2}:\d{2}$/, { message: 'Ongeldige eindtijd' }),
    sport: z.enum(['voetbal', 'hockey']).nullable().optional(),
    season: z.string().min(1, { message: 'Seizoen is verplicht' }),
    notes: z.string().nullable().optional(),
  })
  .refine((data) => data.ends_at > data.starts_at, {
    message: 'De eindtijd moet na de begintijd liggen',
    path: ['ends_at'],
  });

export const updateBarDaySlotSchema = createBarDaySlotSchema;

export const generateRosterSchema = z.object({
  season: z.string().min(1, { message: 'Seizoen is verplicht' }),
  bar_day_slot_ids: z
    .array(z.string().uuid({ message: 'Ongeldig day-slot ID' }))
    .min(1, { message: 'Selecteer minimaal één day-slot' }),
});

const barShiftMemberRefSchema = z.object({
  member_id: z.string().uuid({ message: 'Ongeldig lid-ID' }),
});

const barShiftSchema = z.object({
  starts_at: z.string().min(1, { message: 'Begintijd is verplicht' }),
  ends_at: z.string().min(1, { message: 'Eindtijd is verplicht' }),
  barcommissie_member: barShiftMemberRefSchema,
  regular_members: z.tuple([barShiftMemberRefSchema, barShiftMemberRefSchema]),
});

const barRosterPreviewItemSchema = z.object({
  bar_day_slot_id: z.string().uuid({ message: 'Ongeldig day-slot ID' }),
  date: z.string().min(1, { message: 'Datum is verplicht' }),
  sport: z.enum(['voetbal', 'hockey']).nullable(),
  shifts: z.array(barShiftSchema).min(1, { message: 'Minimaal één dienst vereist' }),
});

export const publishRosterSchema = z.object({
  season: z.string().min(1, { message: 'Seizoen is verplicht' }),
  preview: z
    .array(barRosterPreviewItemSchema)
    .min(1, { message: 'Preview bevat geen diensten' }),
});

// ── Exported types ────────────────────────────────────────────────────────────

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
export type CreateTrainingInput = z.infer<typeof createTrainingSchema>;
export type CreateClubactiviteitInput = z.infer<typeof createClubactiviteitSchema>;
export type CreateBardienstInput = z.infer<typeof createBardienstSchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CsvColumnMappingInput = z.infer<typeof csvColumnMappingSchema>;
export type CsvImportRowDataInput = z.infer<typeof csvImportRowDataSchema>;
export type CreateBarDaySlotInput = z.infer<typeof createBarDaySlotSchema>;
export type UpdateBarDaySlotInput = z.infer<typeof updateBarDaySlotSchema>;
export type GenerateRosterInput = z.infer<typeof generateRosterSchema>;
export type PublishRosterInput = z.infer<typeof publishRosterSchema>;
