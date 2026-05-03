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

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
