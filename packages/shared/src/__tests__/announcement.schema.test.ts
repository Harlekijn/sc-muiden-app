import { describe, it, expect } from 'vitest';
import { createAnnouncementSchema, updateAnnouncementSchema } from '../schemas/announcement.schema';

describe('createAnnouncementSchema', () => {
  it('geldige input passeert', () => {
    const result = createAnnouncementSchema.safeParse({
      title: 'Trainingstijden gewijzigd',
      body: '<p>De trainingen starten om 19:30.</p>',
    });
    expect(result.success).toBe(true);
  });

  it('geldige input met sport en published_at passeert', () => {
    const result = createAnnouncementSchema.safeParse({
      title: 'Hockeynieuws',
      body: '<p>Bericht.</p>',
      sport: ['hockey'],
      published_at: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('lege titel geeft Nederlandse foutmelding', () => {
    const result = createAnnouncementSchema.safeParse({
      title: '',
      body: '<p>Bericht.</p>',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Titel is verplicht');
    }
  });

  it('titel te lang geeft Nederlandse foutmelding', () => {
    const result = createAnnouncementSchema.safeParse({
      title: 'a'.repeat(201),
      body: '<p>Bericht.</p>',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Titel mag maximaal 200 tekens bevatten');
    }
  });

  it('lege body geeft Nederlandse foutmelding', () => {
    const result = createAnnouncementSchema.safeParse({
      title: 'Titel',
      body: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Bericht is verplicht');
    }
  });

  it('titel precies 200 tekens is geldig', () => {
    const result = createAnnouncementSchema.safeParse({
      title: 'a'.repeat(200),
      body: '<p>Bericht.</p>',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateAnnouncementSchema', () => {
  it('lege update passeert (alle velden optioneel)', () => {
    const result = updateAnnouncementSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('gedeeltelijke update passeert', () => {
    const result = updateAnnouncementSchema.safeParse({ title: 'Nieuw' });
    expect(result.success).toBe(true);
  });

  it('ongeldige titel in update geeft foutmelding', () => {
    const result = updateAnnouncementSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});
