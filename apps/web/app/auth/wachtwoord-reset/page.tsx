import { createSupabaseServerClient } from '../../../lib/supabase-server';
import { NieuwWachtwoordForm } from './NieuwWachtwoordForm';
import { KoppelingNietGeldig } from './_components/KoppelingNietGeldig';

export default async function WachtwoordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  if (!code) {
    return <KoppelingNietGeldig />;
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return <KoppelingNietGeldig />;
  }

  return <NieuwWachtwoordForm />;
}
