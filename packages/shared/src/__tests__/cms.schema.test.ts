import { describe, it, expect } from 'vitest';
import {
  createTeamSchema,
  updateTeamSchema,
  createTrainingSchema,
  createClubactiviteitSchema,
  createBardienstSchema,
  updateActivitySchema,
  updateMemberSchema,
  updateRoleSchema,
  generateRosterSchema,
  publishRosterSchema,
} from '../schemas/cms.schema';

// ── Teams ──────────────────────────────────────────────────────────────────────

describe('createTeamSchema', () => {
  it('geldige invoer slaagt', () => {
    const result = createTeamSchema.safeParse({
      name: 'JO15-1',
      sport: 'voetbal',
    });
    expect(result.success).toBe(true);
  });

  it('lege naam geeft fout', () => {
    const result = createTeamSchema.safeParse({ name: '', sport: 'voetbal' });
    expect(result.success).toBe(false);
  });

  it('ongeldige sport geeft fout', () => {
    const result = createTeamSchema.safeParse({ name: 'JO15-1', sport: 'baseball' });
    expect(result.success).toBe(false);
  });
});

describe('updateTeamSchema', () => {
  it('gedeeltelijke update slaagt', () => {
    const result = updateTeamSchema.safeParse({ name: 'JO17-2' });
    expect(result.success).toBe(true);
  });
});

// ── Training ──────────────────────────────────────────────────────────────────

describe('createTrainingSchema', () => {
  const base = {
    team_id: '123e4567-e89b-12d3-a456-426614174000',
    starts_at: '2026-05-12T10:00',
    is_recurring: false,
  };

  it('enkelvoudige training slaagt', () => {
    expect(createTrainingSchema.safeParse(base).success).toBe(true);
  });

  it('recurring zonder valid_from/valid_until geeft fout', () => {
    const result = createTrainingSchema.safeParse({ ...base, is_recurring: true });
    expect(result.success).toBe(false);
  });

  it('recurring met beide datums slaagt', () => {
    const result = createTrainingSchema.safeParse({
      ...base,
      is_recurring: true,
      valid_from: '2026-05-01',
      valid_until: '2026-08-31',
    });
    expect(result.success).toBe(true);
  });

  it('lege starts_at geeft fout', () => {
    const result = createTrainingSchema.safeParse({ ...base, starts_at: '' });
    expect(result.success).toBe(false);
  });
});

// ── Clubactiviteit ────────────────────────────────────────────────────────────

describe('createClubactiviteitSchema', () => {
  it('geldige invoer slaagt', () => {
    const result = createClubactiviteitSchema.safeParse({
      title: 'Seizoensfeest',
      starts_at: '2026-06-01T14:00',
    });
    expect(result.success).toBe(true);
  });

  it('lege titel geeft fout', () => {
    const result = createClubactiviteitSchema.safeParse({ title: '', starts_at: '2026-06-01T14:00' });
    expect(result.success).toBe(false);
  });
});

// ── Bardienst ─────────────────────────────────────────────────────────────────

describe('createBardienstSchema', () => {
  it('geldige invoer slaagt', () => {
    const result = createBardienstSchema.safeParse({ starts_at: '2026-05-20T18:00' });
    expect(result.success).toBe(true);
  });

  it('lege starts_at geeft fout', () => {
    const result = createBardienstSchema.safeParse({ starts_at: '' });
    expect(result.success).toBe(false);
  });
});

// ── Activiteit bewerken ───────────────────────────────────────────────────────

describe('updateActivitySchema', () => {
  it('enkele sessie zonder starts_at slaagt', () => {
    const result = updateActivitySchema.safeParse({
      title: 'Gewijzigde training',
      update_scope: 'single',
    });
    expect(result.success).toBe(true);
  });

  it('toekomstige scope slaagt', () => {
    const result = updateActivitySchema.safeParse({
      title: 'Nieuwe naam',
      update_scope: 'future',
    });
    expect(result.success).toBe(true);
  });

  it('ongeldige update_scope geeft fout', () => {
    const result = updateActivitySchema.safeParse({
      title: 'Test',
      update_scope: 'all',
    });
    expect(result.success).toBe(false);
  });
});

// ── Lid bewerken ──────────────────────────────────────────────────────────────

describe('updateMemberSchema', () => {
  const base = { first_name: 'Jan', last_name: 'Bakker' };

  it('verplichte velden voldoende voor update', () => {
    expect(updateMemberSchema.safeParse(base).success).toBe(true);
  });

  it('ongeldig e-mailadres geeft fout', () => {
    const result = updateMemberSchema.safeParse({ ...base, email: 'geen-email' });
    expect(result.success).toBe(false);
  });

  it('geldig e-mailadres slaagt', () => {
    const result = updateMemberSchema.safeParse({ ...base, email: 'test@example.com' });
    expect(result.success).toBe(true);
  });

  it('lege voornaam geeft fout', () => {
    const result = updateMemberSchema.safeParse({ first_name: '', last_name: 'Bakker' });
    expect(result.success).toBe(false);
  });
});

// ── Rol toewijzen ─────────────────────────────────────────────────────────────

describe('updateRoleSchema', () => {
  it('geldige rol slaagt', () => {
    const result = updateRoleSchema.safeParse({
      profile_id: '123e4567-e89b-12d3-a456-426614174000',
      new_role: 'beheerder',
    });
    expect(result.success).toBe(true);
  });

  it('ongeldige rol geeft fout', () => {
    const result = updateRoleSchema.safeParse({
      profile_id: '123e4567-e89b-12d3-a456-426614174000',
      new_role: 'superadmin',
    });
    expect(result.success).toBe(false);
  });

  it('ongeldig UUID geeft fout', () => {
    const result = updateRoleSchema.safeParse({
      profile_id: 'niet-een-uuid',
      new_role: 'lid',
    });
    expect(result.success).toBe(false);
  });
});

// ── Bardienst Rooster ──────────────────────────────────────────────────────────

describe('generateRosterSchema', () => {
  const validDay = {
    date: '2026-04-26',
    starts_at: '08:00',
    ends_at: '18:00',
    sport: 'voetbal' as const,
  };

  it('geldige invoer slaagt', () => {
    const result = generateRosterSchema.safeParse({ season: '2025-2026', dagen: [validDay] });
    expect(result.success).toBe(true);
  });

  it('club-brede dag (sport=null) slaagt', () => {
    const result = generateRosterSchema.safeParse({
      season: '2025-2026',
      dagen: [{ ...validDay, sport: null }],
    });
    expect(result.success).toBe(true);
  });

  it('lege dagen-lijst geeft fout', () => {
    const result = generateRosterSchema.safeParse({ season: '2025-2026', dagen: [] });
    expect(result.success).toBe(false);
  });

  it('eindtijd gelijk aan begintijd geeft fout', () => {
    const result = generateRosterSchema.safeParse({
      season: '2025-2026',
      dagen: [{ ...validDay, ends_at: '08:00' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0]?.message;
      expect(msg).toContain('eindtijd');
    }
  });

  it('eindtijd vóór begintijd geeft fout met Nederlandse melding', () => {
    const result = generateRosterSchema.safeParse({
      season: '2025-2026',
      dagen: [{ ...validDay, ends_at: '07:00' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0]?.message;
      expect(msg).toContain('eindtijd');
    }
  });

  it('ongeldige datum-opmaak geeft fout', () => {
    const result = generateRosterSchema.safeParse({
      season: '2025-2026',
      dagen: [{ ...validDay, date: '26-04-2026' }],
    });
    expect(result.success).toBe(false);
  });

  it('leeg seizoen geeft fout', () => {
    const result = generateRosterSchema.safeParse({ season: '', dagen: [validDay] });
    expect(result.success).toBe(false);
  });
});

describe('publishRosterSchema', () => {
  const uuid1 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const uuid2 = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
  const uuid3 = 'cccccccc-dddd-eeee-ffff-000000000000';
  const previewId = 'eeeeeeee-ffff-0000-1111-222222222222';

  const validPreviewItem = {
    preview_id: previewId,
    date: '2026-04-26',
    sport: null,
    shifts: [{
      starts_at: '2026-04-26T08:00:00',
      ends_at: '2026-04-26T10:30:00',
      barcommissie_member: { member_id: uuid1 },
      regular_members: [{ member_id: uuid2 }, { member_id: uuid3 }],
    }],
  };

  it('geldige invoer slaagt', () => {
    const result = publishRosterSchema.safeParse({ season: '2025-2026', preview: [validPreviewItem] });
    expect(result.success).toBe(true);
  });

  it('lege preview-lijst geeft fout', () => {
    const result = publishRosterSchema.safeParse({ season: '2025-2026', preview: [] });
    expect(result.success).toBe(false);
  });

  it('ontbrekend regular_member geeft fout', () => {
    const item = {
      ...validPreviewItem,
      shifts: [{
        ...validPreviewItem.shifts[0],
        regular_members: [{ member_id: uuid2 }],
      }],
    };
    const result = publishRosterSchema.safeParse({ season: '2025-2026', preview: [item] });
    expect(result.success).toBe(false);
  });

  it('ongeldig preview_id geeft fout', () => {
    const item = { ...validPreviewItem, preview_id: 'geen-uuid' };
    const result = publishRosterSchema.safeParse({ season: '2025-2026', preview: [item] });
    expect(result.success).toBe(false);
  });
});
