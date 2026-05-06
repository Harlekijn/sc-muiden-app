// RLS integration tests — verify Row Level Security policies are correctly applied.
//
// These tests run against the real local Supabase instance (no mocking).
// They use the publishable (anon) key so JWTs are validated and RLS applies,
// exactly as in production. The admin client (service role) is used only for
// setup/teardown, bypassing RLS intentionally.
//
// Requires: supabase start + supabase db reset + pnpm test:e2e

import { test, expect } from '@playwright/test';
import { adminClient, E2E_BEHEERDER_EMAIL, E2E_LID_EMAIL, E2E_CHILD_CLUBBASE_ID } from './helpers/admin-client';
import { signedInClient } from './helpers/user-client';

// Resolved once from the seed data; all tests read these values.
let lidMemberId: string;
let lidProfileId: string;
let childMemberId: string;
let beheerderMemberId: string;
let beheerderProfileId: string;

test.beforeAll(async () => {
  const [lidResult, beheerderResult, childResult] = await Promise.all([
    adminClient.from('profiles').select('id, member_id').eq('email', E2E_LID_EMAIL).single(),
    adminClient.from('profiles').select('id, member_id').eq('email', E2E_BEHEERDER_EMAIL).single(),
    adminClient.from('members').select('id').eq('clubbase_id', E2E_CHILD_CLUBBASE_ID).single(),
  ]);

  if (lidResult.error) throw new Error(`RLS setup: ${lidResult.error.message}`);
  if (beheerderResult.error) throw new Error(`RLS setup: ${beheerderResult.error.message}`);
  if (childResult.error) throw new Error(`RLS setup: ${childResult.error.message}`);

  lidProfileId = lidResult.data.id as string;
  lidMemberId = lidResult.data.member_id as string;
  beheerderProfileId = beheerderResult.data.id as string;
  beheerderMemberId = beheerderResult.data.member_id as string;
  childMemberId = childResult.data.id as string;
});

test.describe('RLS — family_link_requests', () => {
  test('lid cannot read another user\'s family_link_requests', async () => {
    // Insert a request belonging to beheerder via the admin client (bypasses RLS).
    const { data: inserted, error: insertErr } = await adminClient
      .from('family_link_requests')
      .insert({ profile_id: beheerderProfileId, first_name: 'Iemand', last_name: 'Anders' })
      .select('id')
      .single();
    if (insertErr) throw new Error(`RLS setup insert: ${insertErr.message}`);

    try {
      const lid = await signedInClient(E2E_LID_EMAIL);
      const { data: rows } = await lid.from('family_link_requests').select('id');
      const ids = (rows ?? []).map((r) => (r as { id: string }).id);

      // Lid must not see the request that belongs to beheerder.
      expect(ids).not.toContain(inserted.id);
    } finally {
      await adminClient.from('family_link_requests').delete().eq('id', inserted.id);
    }
  });
});

test.describe('RLS — members', () => {
  test('lid can read own member record and approved family members', async () => {
    const lid = await signedInClient(E2E_LID_EMAIL);
    const { data: rows, error } = await lid.from('members').select('id');
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r) => (r as { id: string }).id);

    // Own member record (linked via profiles.member_id).
    expect(ids).toContain(lidMemberId);

    // Approved family member (linked via user_family_members).
    expect(ids).toContain(childMemberId);
  });

  test('lid cannot read members with no link to them', async () => {
    const lid = await signedInClient(E2E_LID_EMAIL);
    const { data: rows, error } = await lid
      .from('members')
      .select('id')
      .eq('id', beheerderMemberId);
    if (error) throw new Error(error.message);

    // beheerder has no family link to lid — should be filtered out by RLS.
    expect(rows ?? []).toHaveLength(0);
  });

  test('beheerder can read all members', async () => {
    const beheerder = await signedInClient(E2E_BEHEERDER_EMAIL);
    const { data: rows, error } = await beheerder.from('members').select('id');
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r) => (r as { id: string }).id);

    // Admin policy: beheerder sees all seeded members.
    expect(ids).toContain(lidMemberId);
    expect(ids).toContain(childMemberId);
    expect(ids).toContain(beheerderMemberId);
  });
});

test.describe('RLS — family link approval', () => {
  test('lid can insert a request, admin can approve it, lid then sees the new member', async () => {
    // Create a new member to link (separate from seeded fixtures to avoid interference).
    const { data: newMember, error: memberErr } = await adminClient
      .from('members')
      .insert({ first_name: 'Nieuw', last_name: 'Goedgekeurd', role: 'lid', sport: [] })
      .select('id')
      .single();
    if (memberErr) throw new Error(`create member: ${memberErr.message}`);

    let requestId: string | null = null;

    try {
      // Lid submits a request using their own authenticated client — tests the
      // requests_insert_own RLS policy (profile_id must equal auth.uid()).
      const lid = await signedInClient(E2E_LID_EMAIL);
      const { data: request, error: requestErr } = await lid
        .from('family_link_requests')
        .insert({
          profile_id: lidProfileId,
          first_name: 'Nieuw',
          last_name: 'Goedgekeurd',
          member_id: newMember.id,
        })
        .select('id')
        .single();
      if (requestErr) throw new Error(`insert request: ${requestErr.message}`);
      requestId = (request as { id: string }).id;

      // Admin approves: update status + insert user_family_members row.
      // If member_id FK is wrong this will throw; if admin policy is wrong it will fail silently.
      const { error: approveErr } = await adminClient
        .from('family_link_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);
      if (approveErr) throw new Error(`approve request: ${approveErr.message}`);

      const { error: linkErr } = await adminClient
        .from('user_family_members')
        .insert({ profile_id: lidProfileId, member_id: newMember.id });
      if (linkErr) throw new Error(`insert family link (FK violation?): ${linkErr.message}`);

      // After approval lid must be able to read the new member via members_select_own_and_family.
      const { data: members } = await lid.from('members').select('id');
      const ids = (members ?? []).map((r) => (r as { id: string }).id);
      expect(ids).toContain(newMember.id);
    } finally {
      // Clean up in reverse-dependency order.
      await adminClient.from('user_family_members').delete().eq('member_id', newMember.id);
      if (requestId) {
        await adminClient.from('family_link_requests').delete().eq('id', requestId);
      }
      await adminClient.from('members').delete().eq('id', newMember.id);
    }
  });
});
