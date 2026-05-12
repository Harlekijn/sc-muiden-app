import { createSupabaseServerClient } from '../../../lib/supabase-server';
import { GeenToegang } from '../_components/GeenToegang';
import { RollenClient } from './_components/RollenClient';

export interface ProfileRow {
  id: string;
  role: string;
  member: {
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
}

export default async function RollenPage() {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <GeenToegang />;

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentProfile || currentProfile.role !== 'beheerder') {
    return <GeenToegang />;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      role,
      member:members!profiles_member_id_fkey (
        first_name,
        last_name,
        email
      )
    `)
    .order('role', { ascending: true });

  return (
    <div>
      <h1 style={s.heading}>Rollen</h1>
      <p style={s.sub}>Wijs rollen toe aan gebruikers. Alleen beheerders kunnen rollen wijzigen.</p>

      {error ? (
        <p style={{ color: 'var(--color-error)' }}>
          Profielen konden niet worden geladen. Probeer de pagina te vernieuwen.
        </p>
      ) : (
        <RollenClient profiles={(data ?? []) as unknown as ProfileRow[]} currentUserId={user.id} />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-2)',
  },
  sub: {
    color: 'var(--color-text-2)',
    fontSize: 'var(--text-sm)',
    marginBottom: 'var(--space-6)',
  },
};
