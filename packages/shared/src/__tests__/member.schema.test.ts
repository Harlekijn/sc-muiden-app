import { describe, it, expect } from 'vitest';
import { createFamilyLinkRequestSchema, updateProfileSchema } from '../schemas/member.schema';

describe('createFamilyLinkRequestSchema', () => {
  it('accepts first_name and last_name without birth_date', () => {
    const result = createFamilyLinkRequestSchema.safeParse({
      first_name: 'Emma',
      last_name: 'Jansen',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional birth_date when provided', () => {
    const result = createFamilyLinkRequestSchema.safeParse({
      first_name: 'Emma',
      last_name: 'Jansen',
      birth_date: '2015-06-15',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null birth_date', () => {
    const result = createFamilyLinkRequestSchema.safeParse({
      first_name: 'Emma',
      last_name: 'Jansen',
      birth_date: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty first_name', () => {
    const result = createFamilyLinkRequestSchema.safeParse({
      first_name: '',
      last_name: 'Jansen',
    });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes('first_name'));
    expect(issue?.message).toBe('Voornaam is verplicht');
  });

  it('rejects empty last_name', () => {
    const result = createFamilyLinkRequestSchema.safeParse({
      first_name: 'Emma',
      last_name: '',
    });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes('last_name'));
    expect(issue?.message).toBe('Achternaam is verplicht');
  });
});

describe('updateProfileSchema', () => {
  it('accepts display_name with 2 or more characters', () => {
    expect(updateProfileSchema.safeParse({ display_name: 'Jo' }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ display_name: 'Jan Jansen' }).success).toBe(true);
  });

  it('rejects empty display_name', () => {
    const result = updateProfileSchema.safeParse({ display_name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Naam is verplicht');
  });

  it('rejects display_name with 1 character', () => {
    const result = updateProfileSchema.safeParse({ display_name: 'X' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Naam is verplicht');
  });
});
