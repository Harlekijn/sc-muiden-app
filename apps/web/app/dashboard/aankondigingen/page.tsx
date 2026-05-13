import { createSupabaseServerClient } from '../../../lib/supabase-server';
import { AankondigingenClient } from './_components/AankondigingenClient';
import type { AnnouncementWithAuthor } from '@sc-muiden/shared';

export default async function AankondigingenPage() {
  const supabase = createSupabaseServerClient();

  const { data } = await supabase
    .from('announcements')
    .select('*, author:profiles!author_id(display_name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const announcements = (data ?? []) as unknown as AnnouncementWithAuthor[];

  return <AankondigingenClient announcements={announcements} />;
}
