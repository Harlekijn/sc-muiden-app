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
//  members:
//    1. beheerder  – role beheerder, email E2E_BEHEERDER_EMAIL
//    2. lid        – role lid,       email E2E_LID_EMAIL
//    3. kindlid    – role lid,       no email  (represents a child club member)
//  auth.users:    beheerder + lid  (trigger auto-creates profiles + links member_id)
//  user_family_members: lid ↔ kindlid  (approved link)
//
// Never hard-code the returned UUIDs in assertions — use the SeedResult fields.

// ── Constants ────────────────────────────────────────────────────────────────

export const E2E_BEHEERDER_EMAIL = 'e2e-beheerder@e2e.scmuiden.test';
export const E2E_LID_EMAIL = 'e2e-lid@e2e.scmuiden.test';
export const E2E_PASSWORD = 'E2eTestWachtwoord123!';

const ALL_E2E_EMAILS = [E2E_BEHEERDER_EMAIL, E2E_LID_EMAIL] as const;

// Stable identifier for the child member (no email — looked up by this field).
export const E2E_CHILD_CLUBBASE_ID = 'e2e-child-001';
const CHILD_CLUBBASE_ID = E2E_CHILD_CLUBBASE_ID;

// ── Return type ──────────────────────────────────────────────────────────────

export interface SeedResult {
  beheerderMemberId: string;
  lidMemberId: string;
  childMemberId: string;
  familyLinkId: string;
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

// ── Seed ─────────────────────────────────────────────────────────────────────

export async function seed(admin: AdminClient): Promise<SeedResult> {
  // Always start clean so runs are idempotent.
  await teardown(admin);

  // 1. Create member records.
  const { data: members, error: membersErr } = await admin
    .from('members')
    .insert([
      { first_name: 'Test', last_name: 'Beheerder', email: E2E_BEHEERDER_EMAIL, role: 'beheerder', sport: [] },
      { first_name: 'Test', last_name: 'Lid',       email: E2E_LID_EMAIL,       role: 'lid', sport: ['voetbal'] },
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

  return {
    beheerderMemberId: beheerderMember.id as string,
    lidMemberId:       lidMember.id as string,
    childMemberId:     childMember.id as string,
    familyLinkId:      (link[0] as Row).id as string,
  };
}

// ── Teardown ─────────────────────────────────────────────────────────────────

export async function teardown(admin: AdminClient): Promise<void> {
  // Delete auth users first — profiles (and family links via cascade) follow.
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const testUsers = (data?.users ?? []).filter((u) =>
    u.email && (ALL_E2E_EMAILS as readonly string[]).includes(u.email)
  );
  await Promise.all(testUsers.map((u) => admin.auth.admin.deleteUser(u.id)));

  // Delete named member records.
  await admin.from('members').delete().in('email', ALL_E2E_EMAILS);

  // Delete child member (no email — identified by clubbase_id).
  await admin.from('members').delete().eq('clubbase_id', CHILD_CLUBBASE_ID);
}

// ── Standalone entry point ────────────────────────────────────────────────────
// Run directly:  cd apps/web && npx tsx scripts/seed.ts
