import { describe, it, expect } from 'vitest';
import { NotificationPreferencesSchema, UpdateNotificationPreferencesSchema } from '../schemas/notificationPreferences.schema';

describe('NotificationPreferencesSchema', () => {
  it('accepteert geldige voorkeuren', () => {
    const result = NotificationPreferencesSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      profile_id: '00000000-0000-0000-0000-000000000002',
      wedstrijd: true,
      bardienst: false,
      training: true,
      created_at: '2026-05-08T12:00:00Z',
      updated_at: '2026-05-08T12:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('weigert ongeldig UUID voor id', () => {
    const result = NotificationPreferencesSchema.safeParse({
      id: 'geen-uuid',
      profile_id: '00000000-0000-0000-0000-000000000002',
      wedstrijd: true,
      bardienst: true,
      training: true,
      created_at: '2026-05-08T12:00:00Z',
      updated_at: '2026-05-08T12:00:00Z',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Ongeldig ID formaat');
  });
});

describe('UpdateNotificationPreferencesSchema', () => {
  it('accepteert een enkel veld', () => {
    const result = UpdateNotificationPreferencesSchema.safeParse({ wedstrijd: false });
    expect(result.success).toBe(true);
  });

  it('accepteert meerdere velden tegelijk', () => {
    const result = UpdateNotificationPreferencesSchema.safeParse({ wedstrijd: false, training: true });
    expect(result.success).toBe(true);
  });

  it('weigert een leeg object', () => {
    const result = UpdateNotificationPreferencesSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Minimaal één voorkeur moet worden opgegeven');
  });
});
