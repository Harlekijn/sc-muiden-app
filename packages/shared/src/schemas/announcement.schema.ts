import { z } from 'zod';

const sportSchema = z.enum(['voetbal', 'hockey']);

export const announcementSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  sport: z.array(sportSchema).nullable(),
  published_at: z.string().datetime().nullable(),
  author_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht').max(200, 'Titel mag maximaal 200 tekens bevatten'),
  body: z.string().min(1, 'Bericht is verplicht'),
  sport: z.array(sportSchema).nullable().optional(),
  published_at: z.string().datetime().nullable().optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
