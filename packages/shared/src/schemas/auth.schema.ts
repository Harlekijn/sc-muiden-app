import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(6, 'Wachtwoord minimaal 6 tekens'),
});

export const registerSchema = z
  .object({
    naam: z.string().min(2, 'Naam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres'),
    password: z.string().min(8, 'Wachtwoord minimaal 8 tekens'),
    passwordBevestiging: z.string().min(1, 'Bevestig je wachtwoord'),
  })
  .refine((data) => data.password === data.passwordBevestiging, {
    message: 'Wachtwoorden komen niet overeen',
    path: ['passwordBevestiging'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Wachtwoord minimaal 8 tekens')
      .regex(/[A-Z]/, 'Wachtwoord moet minimaal één hoofdletter bevatten')
      .regex(/[0-9]/, 'Wachtwoord moet minimaal één cijfer bevatten'),
    passwordBevestiging: z.string().min(1, 'Bevestig je wachtwoord'),
  })
  .refine((data) => data.password === data.passwordBevestiging, {
    message: 'Wachtwoorden komen niet overeen',
    path: ['passwordBevestiging'],
  });

export const createAccountRequestSchema = z.object({
  display_name: z.string().min(2, 'Naam moet minimaal 2 tekens bevatten'),
  email: z.string().email('Ongeldig e-mailadres'),
  birth_date: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, 'Gebruik het formaat DD-MM-JJJJ')
    .optional()
    .transform((val) => {
      if (!val) return null;
      const [day, month, year] = val.split('-');
      return `${year}-${month}-${day}`;
    })
    .nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateAccountRequestInput = z.infer<typeof createAccountRequestSchema>;
