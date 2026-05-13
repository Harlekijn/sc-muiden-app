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

function makeAdminClient({ requestStatus = 'pending' } = {}) {
  return {
    from: jest.fn((table: string) => {
      if (table === 'family_link_requests') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'req-1', profile_id: 'profile-1', status: requestStatus },
                error: null,
              }),
            }),
          }),
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
  return new NextRequest('http://localhost/api/cms/gezinsverzoeken/req-1/approve', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const VALID_MEMBER_ID = '00000000-0000-0000-0000-000000000002';

describe('POST /api/cms/gezinsverzoeken/[id]/approve', () => {
  beforeEach(() => jest.resetAllMocks());

  // S03-E — Admin keurt gezinsverzoek goed
  it('S03-E: retourneert 403 voor niet-beheerder', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient('lid'));
    const res = await POST(makeRequest({ member_id: VALID_MEMBER_ID }), { params: { id: 'req-1' } });
    expect(res.status).toBe(403);
  });

  it('S03-E: retourneert 422 voor ongeldig member_id', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient('beheerder'));
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(makeAdminClient());
    const res = await POST(makeRequest({ member_id: 'geen-uuid' }), { params: { id: 'req-1' } });
    expect(res.status).toBe(422);
  });

  it('S03-E: retourneert 409 wanneer verzoek al afgehandeld is', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient('beheerder'));
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(makeAdminClient({ requestStatus: 'approved' }));
    const res = await POST(makeRequest({ member_id: VALID_MEMBER_ID }), { params: { id: 'req-1' } });
    expect(res.status).toBe(409);
  });

  it('S03-E: retourneert 200 bij succesvolle goedkeuring', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient('beheerder'));
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(makeAdminClient());
    const res = await POST(makeRequest({ member_id: VALID_MEMBER_ID }), { params: { id: 'req-1' } });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok?: boolean };
    expect(body.ok).toBe(true);
  });
});
