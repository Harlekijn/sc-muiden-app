/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

jest.mock('../../../../../lib/supabase-server', () => ({
  createSupabaseServerClient: jest.fn(),
}));
jest.mock('../../../../../lib/supabase-admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

import { POST } from '../[id]/approve/route';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { createSupabaseAdminClient } from '../../../../../lib/supabase-admin';

function makeAuthClient(role: string | null) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: role !== null ? { id: 'admin-1' } : null },
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: role ? { id: 'admin-1', role } : null,
            error: null,
          }),
        }),
      }),
    }),
  };
}

function makeAdminClient({
  requestStatus = 'pending',
  inviteError = null as unknown,
  userId = 'new-user-1',
} = {}) {
  return {
    auth: {
      admin: {
        inviteUserByEmail: jest.fn().mockResolvedValue(
          inviteError
            ? { data: null, error: inviteError }
            : { data: { user: { id: userId } }, error: null }
        ),
      },
    },
    from: jest.fn((table: string) => {
      if (table === 'account_requests') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'req-1', email: 'jan@test.nl', display_name: 'Jan', status: requestStatus },
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'user_family_members') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    }),
  };
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/cms/account-requests/req-1/approve', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/cms/account-requests/[id]/approve', () => {
  beforeEach(() => jest.resetAllMocks());

  it('S14-E: retourneert 403 voor niet-beheerder', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient('lid'));
    const res = await POST(makeRequest({ member_ids: ['00000000-0000-0000-0000-000000000001'] }), { params: { id: 'req-1' } });
    expect(res.status).toBe(403);
  });

  it('S14-E: retourneert 403 voor niet-ingelogde gebruiker', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient(null));
    const res = await POST(makeRequest({ member_ids: ['00000000-0000-0000-0000-000000000001'] }), { params: { id: 'req-1' } });
    expect(res.status).toBe(403);
  });

  it('S14-E: retourneert 422 wanneer member_ids leeg is', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient('beheerder'));
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(makeAdminClient());
    const res = await POST(makeRequest({ member_ids: [] }), { params: { id: 'req-1' } });
    expect(res.status).toBe(422);
  });

  it('S14-E: retourneert 409 wanneer aanvraag al afgehandeld is', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient('beheerder'));
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(makeAdminClient({ requestStatus: 'approved' }));
    const res = await POST(makeRequest({ member_ids: ['00000000-0000-0000-0000-000000000001'] }), { params: { id: 'req-1' } });
    expect(res.status).toBe(409);
  });

  it('S14-E: retourneert 200 bij succesvolle goedkeuring', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient('beheerder'));
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(makeAdminClient());
    const res = await POST(makeRequest({ member_ids: ['00000000-0000-0000-0000-000000000001'] }), { params: { id: 'req-1' } });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok?: boolean };
    expect(body.ok).toBe(true);
  });

  it('S14-E: retourneert 500 wanneer invite mislukt', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient('beheerder'));
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(makeAdminClient({ inviteError: { message: 'invite failed' } }));
    const res = await POST(makeRequest({ member_ids: ['00000000-0000-0000-0000-000000000001'] }), { params: { id: 'req-1' } });
    expect(res.status).toBe(500);
  });
});
