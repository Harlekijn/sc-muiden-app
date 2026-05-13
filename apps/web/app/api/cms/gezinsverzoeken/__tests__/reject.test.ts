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

import { POST } from '../[id]/reject/route';
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
                data: { id: 'req-1', status: requestStatus },
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    }),
  };
}

function makeRequest(body: unknown = {}) {
  return new NextRequest('http://localhost/api/cms/gezinsverzoeken/req-1/reject', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/cms/gezinsverzoeken/[id]/reject', () => {
  beforeEach(() => jest.resetAllMocks());

  // S03-G — Gezinsverzoek afwijzen
  it('S03-G: retourneert 403 voor niet-beheerder', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient('lid'));
    const res = await POST(makeRequest(), { params: { id: 'req-1' } });
    expect(res.status).toBe(403);
  });

  it('S03-G: retourneert 409 wanneer verzoek al afgehandeld is', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient('beheerder'));
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(makeAdminClient({ requestStatus: 'rejected' }));
    const res = await POST(makeRequest(), { params: { id: 'req-1' } });
    expect(res.status).toBe(409);
  });

  it('S03-G: retourneert 200 bij succesvolle afwijzing', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeAuthClient('beheerder'));
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(makeAdminClient());
    const res = await POST(makeRequest({ admin_notes: 'Niet gevonden.' }), { params: { id: 'req-1' } });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok?: boolean };
    expect(body.ok).toBe(true);
  });
});
