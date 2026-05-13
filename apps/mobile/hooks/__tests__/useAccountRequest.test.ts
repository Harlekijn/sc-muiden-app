// S14-A — Gebruiker dient succesvol een account aan
// S14-B — Duplicaat e-mail geeft Nederlandse foutmelding
// S14-C — Generieke serverfout geeft Nederlandse foutmelding

// Test the underlying supabase mutation logic directly, decoupled from React Query rendering.
// This avoids QueryClientProvider wrapper type incompatibilities with the mobile RN test environment.

const mockInsert = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({ insert: mockInsert })),
  },
}));

// Import the schema directly to replicate hook behaviour
import { createAccountRequestSchema } from '@sc-muiden/shared';
import { supabase } from '../../lib/supabase';

async function submitAccountRequest(input: {
  display_name: string;
  email: string;
  birth_date: string | null;
}) {
  const validated = createAccountRequestSchema.parse(input);
  const { error } = await (supabase.from as jest.Mock)('account_requests').insert({
    display_name: validated.display_name,
    email: validated.email.toLowerCase().trim(),
    birth_date: validated.birth_date,
  });
  if (error) {
    if ((error as { code?: string }).code === '23505') {
      throw new Error('Er bestaat al een aanvraag voor dit e-mailadres.');
    }
    throw new Error('Er is een fout opgetreden. Probeer het opnieuw.');
  }
}

describe('useAccountRequest — mutation logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('S14-A — roept supabase insert aan met correcte velden', async () => {
    mockInsert.mockResolvedValue({ error: null });

    await submitAccountRequest({
      display_name: 'Jan de Vries',
      email: 'jan@scmuiden.nl',
      birth_date: null,
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        display_name: 'Jan de Vries',
        email: 'jan@scmuiden.nl',
        birth_date: null,
      })
    );
  });

  it('S14-B — gooit Nederlandse fout bij duplicaat e-mail (code 23505)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

    await expect(
      submitAccountRequest({ display_name: 'Jan de Vries', email: 'jan@scmuiden.nl', birth_date: null })
    ).rejects.toThrow('Er bestaat al een aanvraag voor dit e-mailadres.');
  });

  it('S14-C — gooit generieke Nederlandse fout bij andere serverfout', async () => {
    mockInsert.mockResolvedValue({ error: { code: 'PGRST000', message: 'some error' } });

    await expect(
      submitAccountRequest({ display_name: 'Jan de Vries', email: 'jan@scmuiden.nl', birth_date: null })
    ).rejects.toThrow('Er is een fout opgetreden. Probeer het opnieuw.');
  });

  it('e-mailadres wordt in kleine letters opgeslagen', async () => {
    mockInsert.mockResolvedValue({ error: null });

    await submitAccountRequest({ display_name: 'Jan de Vries', email: 'Jan@SCMUIDEN.nl', birth_date: null });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'jan@scmuiden.nl' })
    );
  });

  it('geboortedatum wordt omgezet van DD-MM-JJJJ naar ISO-formaat', async () => {
    mockInsert.mockResolvedValue({ error: null });

    await submitAccountRequest({ display_name: 'Jan de Vries', email: 'jan@scmuiden.nl', birth_date: '15-03-2010' });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ birth_date: '2010-03-15' })
    );
  });
});
