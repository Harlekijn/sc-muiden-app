import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth.schema';

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

describe('resetPasswordSchema', () => {
  const valid = {
    password: 'NieuwWachtwoord1',
    passwordBevestiging: 'NieuwWachtwoord1',
  };

  it('accepts valid password meeting all requirements', () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = resetPasswordSchema.safeParse({ ...valid, password: 'Kort1', passwordBevestiging: 'Kort1' });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes('password'));
    expect(issue?.message).toBe('Wachtwoord minimaal 8 tekens');
  });

  it('rejects password without uppercase letter', () => {
    const result = resetPasswordSchema.safeParse({ ...valid, password: 'geenhoofdletter1', passwordBevestiging: 'geenhoofdletter1' });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes('password'));
    expect(issue?.message).toBe('Wachtwoord moet minimaal één hoofdletter bevatten');
  });

  it('rejects password without digit', () => {
    const result = resetPasswordSchema.safeParse({ ...valid, password: 'GeenCijferHier', passwordBevestiging: 'GeenCijferHier' });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes('password'));
    expect(issue?.message).toBe('Wachtwoord moet minimaal één cijfer bevatten');
  });

  it('rejects mismatching passwords', () => {
    const result = resetPasswordSchema.safeParse({ ...valid, passwordBevestiging: 'AndersWachtwoord1' });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes('passwordBevestiging'));
    expect(issue?.message).toBe('Wachtwoorden komen niet overeen');
  });

  it('rejects empty confirmation field', () => {
    const result = resetPasswordSchema.safeParse({ ...valid, passwordBevestiging: '' });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes('passwordBevestiging'));
    expect(issue).toBeDefined();
  });
});
