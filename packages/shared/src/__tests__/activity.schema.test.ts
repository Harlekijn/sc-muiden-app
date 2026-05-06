import { describe, it, expect } from 'vitest';
import { confirmBarAssignmentSchema } from '../schemas/activity.schema';

describe('confirmBarAssignmentSchema', () => {
  it('geldig UUID gaat door', () => {
    const result = confirmBarAssignmentSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });

  it('ongeldige UUID geeft fout', () => {
    const result = confirmBarAssignmentSchema.safeParse({ id: 'niet-een-uuid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Ongeldige toewijzing-ID');
    }
  });

  it('ontbrekend id geeft fout', () => {
    const result = confirmBarAssignmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
