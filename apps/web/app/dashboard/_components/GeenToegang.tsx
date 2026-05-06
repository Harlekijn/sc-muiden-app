'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../../lib/supabase-client';

export function GeenToegang() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div style={{ padding: '48px 24px', maxWidth: 480 }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-2xl)',
        color: 'var(--color-navy)',
        marginBottom: '12px',
        fontWeight: 700,
      }}>
        Geen toegang
      </h2>
      <p style={{ color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: '24px' }}>
        Je account heeft geen beheerdersrechten. Neem contact op met de beheerder van SC Muiden.
      </p>
      <button
        onClick={handleSignOut}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'var(--color-blue)',
          fontWeight: 600,
          fontSize: 'var(--text-sm)',
          cursor: 'pointer',
          textDecoration: 'none',
        }}
      >
        Uitloggen
      </button>
    </div>
  );
}
