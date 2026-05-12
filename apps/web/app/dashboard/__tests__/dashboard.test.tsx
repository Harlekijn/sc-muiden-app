import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  redirect: jest.fn(),
}));

jest.mock('../../../lib/supabase-server', () => ({
  createSupabaseServerClient: jest.fn(),
}));

jest.mock('@sc-muiden/shared', () => ({
  formatDutchDateTime: (s: string) => s,
}));

const { createSupabaseServerClient } = jest.requireMock('../../../lib/supabase-server');

function makeMock() {
  const from = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      is: jest.fn().mockReturnValue({
        count: jest.fn().mockResolvedValue({ count: 0, error: null }),
        order: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { role: 'beheerder' }, error: null }),
      }),
    }),
    count: jest.fn().mockReturnValue({
      is: jest.fn().mockResolvedValue({ count: 5, error: null }),
    }),
  });
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
    from,
  };
}

import DashboardPage from '../page';

// S12-A — Dashboard overzicht
describe('DashboardPage', () => {
  it('S12-A: toont Dashboard heading', async () => {
    createSupabaseServerClient.mockReturnValue(makeMock());
    const jsx = await DashboardPage();
    render(jsx);
    const headings = screen.getAllByText('Dashboard');
    expect(headings.length).toBeGreaterThan(0);
  });
});

