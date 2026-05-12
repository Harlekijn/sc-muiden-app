import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { AankondigingenForm } from '../../_components/AankondigingenForm';
import type { AnnouncementWithAuthor } from '@sc-muiden/shared';

interface Props {
  params: { id: string };
}

export default async function BewerkenPage({ params }: Props) {
  const supabase = createSupabaseServerClient();

  const { data } = await supabase
    .from('announcements')
    .select('*, author:profiles!author_id(display_name)')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (!data) notFound();

  const announcement = data as unknown as AnnouncementWithAuthor;

  return (
    <div>
      <nav
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-2)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <a href="/dashboard/aankondigingen" style={{ color: 'var(--color-blue)' }}>
          Aankondigingen
        </a>
        {' / '}
        <span>Bewerken</span>
      </nav>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 700,
          color: 'var(--color-navy)',
          marginBottom: 'var(--space-5)',
        }}
      >
        Aankondiging bewerken
      </h1>
      <AankondigingenForm announcement={announcement} />
    </div>
  );
}
