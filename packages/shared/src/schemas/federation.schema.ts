import { z } from 'zod';

export const KnvbMatchSchema = z.object({
  id: z.string({ message: 'Wedstrijd-ID is verplicht' }),
  thuisclub: z.string({ message: 'Thuisclub is verplicht' }),
  uitclub: z.string({ message: 'Uitclub is verplicht' }),
  datum: z.string({ message: 'Datum is verplicht' }),
  aanvangstijd: z.string({ message: 'Aanvangstijd is verplicht' }),
  locatie: z.string().optional(),
  thuisstand: z.number().optional(),
  uitstand: z.number().optional(),
  status: z.enum(['gepland', 'gespeeld', 'afgelast'], { message: 'Ongeldige wedstrijdstatus' }),
});

export const KnhbMatchSchema = z.object({
  matchId: z.string({ message: 'Match-ID is verplicht' }),
  homeTeam: z.string({ message: 'Thuisclub is verplicht' }),
  awayTeam: z.string({ message: 'Uitclub is verplicht' }),
  dateTime: z.string({ message: 'Datum/tijd is verplicht' }),
  venue: z.string().optional(),
  homeScore: z.number().optional(),
  awayScore: z.number().optional(),
  status: z.string({ message: 'Status is verplicht' }),
});

export const KnvbMatchListSchema = z.array(KnvbMatchSchema);
export const KnhbMatchListSchema = z.array(KnhbMatchSchema);

export type KnvbMatchInput = z.infer<typeof KnvbMatchSchema>;
export type KnhbMatchInput = z.infer<typeof KnhbMatchSchema>;
