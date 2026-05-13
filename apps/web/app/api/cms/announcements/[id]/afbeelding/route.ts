import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../../lib/supabase-server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

async function getAdminUser() {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;

  const { data: profile } = await authClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['beheerder', 'commissielid'].includes(profile.role)) return null;
  return { user };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Geen bestand opgegeven.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Bestandstype niet toegestaan.' }, { status: 415 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Bestand is te groot (max 5 MB).' }, { status: 413 });
  }

  const ext = file.type.split('/')[1] ?? 'jpg';
  const filename = `${params.id}/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage
    .from('announcement-images')
    .upload(filename, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error(`[cms-afbeelding] announcement_id=${params.id} outcome=upload_failed`);
    return NextResponse.json({ error: 'Afbeelding kon niet worden geüpload. Controleer je verbinding.' }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from('announcement-images')
    .getPublicUrl(filename);

  return NextResponse.json({ url: publicUrl }, { status: 201 });
}
