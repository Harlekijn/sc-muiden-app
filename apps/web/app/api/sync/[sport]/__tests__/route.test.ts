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

import { POST } from '../route';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';

function makeSupabaseWithRole(role: string | null) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: role !== null ? { id: 'user-1' } : null },
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: role ? { role } : null,
            error: null,
          }),
        }),
      }),
    }),
  };
}

describe('POST /api/sync/[sport]', () => {
  beforeEach(() => jest.resetAllMocks());

  // S11-E — Lid ziet rol-afgeschermde synchistorie niet
  it('S11-E: retourneert 403 voor gebruiker met rol lid', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeSupabaseWithRole('lid'));
    const req = new NextRequest('http://localhost/api/sync/voetbal', { method: 'POST' });
    const res = await POST(req, { params: { sport: 'voetbal' } });
    expect(res.status).toBe(403);
  });

  it('S11-E: retourneert 401 voor niet-ingelogde gebruiker', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeSupabaseWithRole(null));
    const req = new NextRequest('http://localhost/api/sync/voetbal', { method: 'POST' });
    const res = await POST(req, { params: { sport: 'voetbal' } });
    expect(res.status).toBe(401);
  });

  it('retourneert 400 voor ongeldige sport', async () => {
    (createSupabaseServerClient as jest.Mock).mockReturnValue(makeSupabaseWithRole('beheerder'));
    const req = new NextRequest('http://localhost/api/sync/invalid', { method: 'POST' });
    const res = await POST(req, { params: { sport: 'invalid' } });
    expect(res.status).toBe(400);
  });
});
