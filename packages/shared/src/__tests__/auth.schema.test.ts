import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, forgotPasswordSchema } from '../schemas/auth.schema';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'test@scmuiden.nl', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'geen-email', password: 'secret' });
    expect(result.success).toBe(false);
    const msg = result.error?.issues[0].message;
    expect(msg).toBe('Ongeldig e-mailadres');
  });

  it('rejects password shorter than 6 characters', () => {
    const result = loginSchema.safeParse({ email: 'test@scmuiden.nl', password: '12345' });
    expect(result.success).toBe(false);
    const msg = result.error?.issues[0].message;
    expect(msg).toBe('Wachtwoord minimaal 6 tekens');
  });
});

describe('registerSchema', () => {
  const valid = {
    naam: 'Jan Jansen',
    email: 'jan@scmuiden.nl',
    password: 'Wachtw0rd',
    passwordBevestiging: 'Wachtw0rd',
  };

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects mismatching passwords', () => {
    const result = registerSchema.safeParse({ ...valid, passwordBevestiging: 'Anders' });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes('passwordBevestiging'));
    expect(issue?.message).toBe('Wachtwoorden komen niet overeen');
  });

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'kort', passwordBevestiging: 'kort' });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes('password'));
    expect(issue?.message).toBe('Wachtwoord minimaal 8 tekens');
  });

  it('rejects naam shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...valid, naam: 'X' });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes('naam'));
    expect(issue?.message).toBe('Naam is verplicht');
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'geen-email' });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes('email'));
    expect(issue?.message).toBe('Ongeldig e-mailadres');
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'test@scmuiden.nl' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'geen-email' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Ongeldig e-mailadres');
  });
});
