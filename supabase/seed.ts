// Canonical E2E seed — single source of truth for all integration test fixtures.
//
// Imported by:
//   apps/web/e2e/global-setup.ts    (Playwright — creates storageState)
//   apps/web/e2e/global-teardown.ts (Playwright — cleans up after suite)
//
// Standalone usage (requires supabase running locally):
//   cd apps/web && npx tsx scripts/seed.ts
//   (SUPABASE_URL and SUPABASE_SECRET_KEY must be set in env / .env.test.local)
//
// What gets seeded
// ─────────────────
//  Phase 1
//    members:     beheerder, lid, kindlid
//    auth.users:  beheerder + lid  (trigger auto-creates profiles + links member_id)
//    user_family_members: lid ↔ kindlid  (approved link)
//
//  Phase 2
//    teams:          E2E Voetbalteam JO11-1  (federation_team_id = 'e2e-team-001')
//    team_members:   kindlid → team  (role: speler)
//    activities:     training, wedstrijd, bardienst, clubactiviteit  (relative to seed date)
//    matches:        linked to wedstrijd  (status: gepland)
//    bar_assignments: bardienst → kindlid  (not confirmed)
//
// Never hard-code the returned UUIDs in assertions — use the SeedResult fields.

// ── Constants ────────────────────────────────────────────────────────────────

export const E2E_BEHEERDER_EMAIL    = 'e2e-beheerder@e2e.scmuiden.test';
export const E2E_LID_EMAIL          = 'e2e-lid@e2e.scmuiden.test';
export const E2E_COMMISSIELID_EMAIL = 'e2e-commissielid@e2e.scmuiden.test';
export const E2E_VOETBAL_EMAIL      = 'e2e-voetbal@e2e.scmuiden.test';
export const E2E_HOCKEY_EMAIL       = 'e2e-hockey@e2e.scmuiden.test';
export const E2E_PASSWORD           = 'E2eTestWachtwoord123!';

const ALL_E2E_EMAILS = [
  E2E_BEHEERDER_EMAIL,
  E2E_LID_EMAIL,
  E2E_COMMISSIELID_EMAIL,
  E2E_VOETBAL_EMAIL,
  E2E_HOCKEY_EMAIL,
] as const;

// Stable identifier for the child member (no email — looked up by this field).
export const E2E_CHILD_CLUBBASE_ID = 'e2e-child-001';
const CHILD_CLUBBASE_ID = E2E_CHILD_CLUBBASE_ID;

// Stable identifier for the E2E team (stored in federation_team_id).
const E2E_TEAM_FEDERATION_ID = 'e2e-team-001';

// Stable identifier for the E2E match row.
const E2E_MATCH_FEDERATION_ID = 'e2e-match-001';

// Activity titles — used to identify and clean up E2E rows.
const E2E_ACTIVITY_TITLES = [
  'Training JO11-1',
  'Wedstrijd JO11-1 vs FC Diemen',
  'Bardienst zaterdag',
  'Ledenvergadering SC Muiden',
] as const;

// ── Return type ──────────────────────────────────────────────────────────────

export interface SeedResult {
  // Phase 1
  beheerderMemberId: string;
  lidMemberId: string;
  childMemberId: string;
  familyLinkId: string;
  // Phase 2
  teamId: string;
  activityTrainingId: string;
  activityWedstrijdId: string;
  activityBardienstId: string;
  activityClubactiviteitId: string;
}

// ── Client interface ─────────────────────────────────────────────────────────
// Minimal structural type that the real SupabaseClient satisfies.
// Using a structural interface avoids a runtime dependency on @supabase/supabase-js
// from this supabase/ directory (which has no package.json of its own).

interface Row { [key: string]: unknown }

interface AdminClient {
  from(table: string): {
    insert(rows: Row | Row[]): {
      select(cols: string): Promise<{ data: Row[] | null; error: { message: string } | null }>;
    };
    delete(): {
      in(col: string, vals: readonly string[]): Promise<{ error: { message: string } | null }>;
      eq(col: string, val: string): Promise<{ error: { message: string } | null }>;
    };
    select(cols: string): {
      eq(col: string, val: string): {
        single(): Promise<{ data: Row | null; error: { message: string } | null }>;
      };
    };
    upsert(rows: Row | Row[], opts?: { onConflict?: string }): Promise<{ error: { message: string } | null }>;
  };
  auth: {
    admin: {
      createUser(p: { email: string; password: string; email_confirm: boolean }): Promise<{
        error: { message: string } | null;
      }>;
      listUsers(p?: { perPage?: number }): Promise<{
        data: { users: Array<{ id: string; email?: string }> } | null;
      }>;
      deleteUser(id: string): Promise<{ error: unknown }>;
    };
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function must<T>(data: T | null, err: { message: string } | null, label: string): T {
  if (err) throw new Error(`${label}: ${err.message}`);
  if (!data) throw new Error(`${label}: no data returned`);
  return data;
}

async function createAuthUser(admin: AdminClient, email: string): Promise<void> {
  const { error } = await admin.auth.admin.createUser({
    email,
    password: E2E_PASSWORD,
    email_confirm: true,
  });
  if (error && !error.message.includes('already been registered')) {
    throw new Error(`createAuthUser(${email}): ${error.message}`);
  }
}

// Return a timestamptz string for `daysOffset` days from today at the given time.
function activityAt(daysOffset: number, hours: number, minutes: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

// ── Seed ─────────────────────────────────────────────────────────────────────

export async function seed(admin: AdminClient): Promise<SeedResult> {
  // Always start clean so runs are idempotent.
  await teardown(admin);

  // ── Phase 1 ───────────────────────────────────────────────────────────────

  // 1. Create member records.
  const { data: members, error: membersErr } = await admin
    .from('members')
    .insert([
      { first_name: 'Test', last_name: 'Beheerder',    email: E2E_BEHEERDER_EMAIL,    role: 'beheerder',    sport: [] },
      { first_name: 'Test', last_name: 'Lid',          email: E2E_LID_EMAIL,          role: 'lid',          sport: ['voetbal'] },
      { first_name: 'Test', last_name: 'Commissielid', email: E2E_COMMISSIELID_EMAIL, role: 'commissielid', sport: [] },
      { first_name: 'Test', last_name: 'Voetballid',   email: E2E_VOETBAL_EMAIL,      role: 'lid',          sport: ['voetbal'] },
      { first_name: 'Test', last_name: 'Hockeylid',    email: E2E_HOCKEY_EMAIL,       role: 'lid',          sport: ['hockey'] },
      // Child member: no app account — represented by a clubbase_id for stable lookup.
      { first_name: 'Test', last_name: 'Kindlid', email: null, role: 'lid', sport: ['voetbal'], clubbase_id: CHILD_CLUBBASE_ID },
    ])
    .select('id, email, clubbase_id');

  const rows = must(members, membersErr, 'seed members');
  const beheerderMember = rows.find((r) => r.email === E2E_BEHEERDER_EMAIL)!;
  const lidMember       = rows.find((r) => r.email === E2E_LID_EMAIL)!;
  const childMember     = rows.find((r) => r.clubbase_id === CHILD_CLUBBASE_ID)!;

  // 2. Create auth users — handle_new_user trigger auto-creates profiles and links member_id.
  await createAuthUser(admin, E2E_BEHEERDER_EMAIL);
  await createAuthUser(admin, E2E_LID_EMAIL);
  await createAuthUser(admin, E2E_COMMISSIELID_EMAIL);
  await createAuthUser(admin, E2E_VOETBAL_EMAIL);
  await createAuthUser(admin, E2E_HOCKEY_EMAIL);

  // 3. Fetch the lid profile (created by the trigger).
  const { data: lidProfile, error: profileErr } = await admin
    .from('profiles')
    .select('id')
    .eq('email', E2E_LID_EMAIL)
    .single();

  const profile = must(lidProfile, profileErr, 'fetch lid profile');

  // 4. Create an approved family link between lid and the child member.
  const { data: linkRows, error: linkErr } = await admin
    .from('user_family_members')
    .insert({ profile_id: profile.id, member_id: childMember.id })
    .select('id');

  const link = must(linkRows, linkErr, 'seed family link');

  // 4b. Create default notification preferences for the lid (all types on).
  const { error: prefErr } = await admin
    .from('notification_preferences')
    .upsert(
      { profile_id: profile.id, wedstrijd: true, bardienst: true, training: true, aankondiging: true },
      { onConflict: 'profile_id' }
    );

  if (prefErr) throw new Error(`seed notification_preferences: ${prefErr.message}`);

  // 4c. Set up notification preferences for voetbal- and hockeylid.
  for (const email of [E2E_VOETBAL_EMAIL, E2E_HOCKEY_EMAIL]) {
    const { data: sportProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    if (sportProfile) {
      await admin
        .from('notification_preferences')
        .upsert(
          { profile_id: sportProfile.id, wedstrijd: true, bardienst: true, training: true, aankondiging: true },
          { onConflict: 'profile_id' }
        );
    }
  }

  // ── Phase 2 ───────────────────────────────────────────────────────────────

  // 5. Create the E2E team.
  const { data: teamRows, error: teamErr } = await admin
    .from('teams')
    .insert({
      name: 'E2E Voetbalteam JO11-1',
      sport: 'voetbal',
      age_category: 'JO11',
      season: '2025/2026',
      federation_team_id: E2E_TEAM_FEDERATION_ID,
    })
    .select('id');

  const teamRow = must(teamRows, teamErr, 'seed team');
  const teamId = (teamRow[0] as Row).id as string;

  // 6. Add kindlid as speler in the team.
  const { error: teamMemberErr } = await admin
    .from('team_members')
    .insert({ team_id: teamId, member_id: childMember.id, role: 'speler' })
    .select('id');

  if (teamMemberErr) throw new Error(`seed team_members: ${teamMemberErr.message}`);

  // 7. Create activities (all relative to the seed date).
  const { data: activityRows, error: activityErr } = await admin
    .from('activities')
    .insert([
      {
        type: 'training',
        sport: 'voetbal',
        team_id: teamId,
        title: 'Training JO11-1',
        starts_at: activityAt(0, 9, 0),
        location: 'Sportpark De Volharding',
      },
      {
        type: 'wedstrijd',
        sport: 'voetbal',
        team_id: teamId,
        title: 'Wedstrijd JO11-1 vs FC Diemen',
        starts_at: activityAt(2, 14, 0),
      },
      {
        type: 'bardienst',
        sport: null,
        team_id: null,
        title: 'Bardienst zaterdag',
        starts_at: activityAt(7, 12, 0),
      },
      {
        type: 'clubactiviteit',
        sport: null,
        team_id: null,
        title: 'Ledenvergadering SC Muiden',
        starts_at: activityAt(3, 20, 0),
      },
    ])
    .select('id, title');

  const activityRowList = must(activityRows, activityErr, 'seed activities');
  const findActivity = (title: string) =>
    (activityRowList.find((r) => r.title === title) as Row).id as string;

  const activityTrainingId      = findActivity('Training JO11-1');
  const activityWedstrijdId     = findActivity('Wedstrijd JO11-1 vs FC Diemen');
  const activityBardienstId     = findActivity('Bardienst zaterdag');
  const activityClubactiviteitId = findActivity('Ledenvergadering SC Muiden');

  // 8. Create match record for the wedstrijd.
  const { error: matchErr } = await admin
    .from('matches')
    .insert({
      activity_id: activityWedstrijdId,
      federation_match_id: E2E_MATCH_FEDERATION_ID,
      home_team: 'JO11-1',
      away_team: 'FC Diemen JO11-1',
      status: 'gepland',
    })
    .select('id');

  if (matchErr) throw new Error(`seed matches: ${matchErr.message}`);

  // 9. Assign kindlid to bardienst (not confirmed).
  const { error: barErr } = await admin
    .from('bar_assignments')
    .insert({
      activity_id: activityBardienstId,
      member_id: childMember.id,
      confirmed_at: null,
    })
    .select('id');

  if (barErr) throw new Error(`seed bar_assignments: ${barErr.message}`);

  return {
    beheerderMemberId: beheerderMember.id as string,
    lidMemberId:       lidMember.id as string,
    childMemberId:     childMember.id as string,
    familyLinkId:      (link[0] as Row).id as string,
    teamId,
    activityTrainingId,
    activityWedstrijdId,
    activityBardienstId,
    activityClubactiviteitId,
  };
}

// ── Teardown ─────────────────────────────────────────────────────────────────

export async function teardown(admin: AdminClient): Promise<void> {
  // Phase 2: delete in dependency order.
  // matches and bar_assignments cascade from activities (on delete cascade),
  // team_members cascade from teams (on delete cascade).
  await admin.from('activities').delete().in('title', E2E_ACTIVITY_TITLES);
  await admin.from('teams').delete().eq('federation_team_id', E2E_TEAM_FEDERATION_ID);

  // Phase 1: delete auth users first — profiles (and family links via cascade) follow.
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const testUsers = (data?.users ?? []).filter((u) =>
    u.email && (ALL_E2E_EMAILS as readonly string[]).includes(u.email)
  );
  await Promise.all(testUsers.map((u) => admin.auth.admin.deleteUser(u.id)));

  await admin.from('members').delete().in('email', ALL_E2E_EMAILS);
  await admin.from('members').delete().eq('clubbase_id', CHILD_CLUBBASE_ID);
}

// ── Standalone entry point ────────────────────────────────────────────────────
// Run directly:  cd apps/web && npx tsx scripts/seed.ts
