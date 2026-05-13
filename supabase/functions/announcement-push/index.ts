import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (req) => {
  const startedAt = new Date().toISOString();
  console.log(JSON.stringify({ event: 'announcement-push-start', ts: startedAt }));

  try {
    let body: { announcement_id: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, message: 'Ongeldig verzoek.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { announcement_id } = body;
    if (!announcement_id) {
      return new Response(
        JSON.stringify({ ok: false, message: 'announcement_id is verplicht.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Haal aankondiging op
    const { data: announcement, error: annErr } = await supabase
      .from('announcements')
      .select('id, title, body, sport')
      .eq('id', announcement_id)
      .is('deleted_at', null)
      .single();

    if (annErr || !announcement) {
      console.error(JSON.stringify({ event: 'announcement-push-not-found', announcement_id }));
      return new Response(
        JSON.stringify({ ok: false, message: 'Aankondiging niet gevonden.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Dedup: als er al notificaties zijn voor deze aankondiging, stop dan
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'aankondiging')
      .contains('data', { announcement_id });

    if (count && count > 0) {
      console.log(JSON.stringify({ event: 'announcement-push-already-sent', announcement_id }));
      return new Response(
        JSON.stringify({ ok: true, message: 'already-sent' }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Bepaal sport-filter voor profielen
    const sport: string[] | null = announcement.sport as string[] | null;

    // Haal profielen op die matchen EN aankondiging-push willen ontvangen
    let profileQuery = supabase
      .from('profiles')
      .select('id, notification_preferences!inner(aankondiging)')
      .is('deleted_at', null)
      .eq('notification_preferences.aankondiging', true);

    if (sport && sport.length > 0) {
      // sport IS NULL (alle leden) OF sport bevat een van de doelgroep-sporten
      profileQuery = profileQuery.or(
        `sport.is.null,sport.cs.{${sport.map((s) => `"${s}"`).join(',')}}`
      );
    }

    const { data: profiles, error: profileErr } = await profileQuery;
    if (profileErr) {
      console.error(JSON.stringify({ event: 'announcement-push-profile-error', announcement_id }));
      return new Response(
        JSON.stringify({ ok: false, message: 'Profielen ophalen mislukt.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const bodyPreview = (announcement.body as string).replace(/<[^>]*>/g, '').slice(0, 160);
    let successCount = 0;

    for (const profile of profiles ?? []) {
      try {
        const { error: insertErr } = await supabase.from('notifications').insert({
          recipient_profile_id: profile.id,
          title: announcement.title,
          body: bodyPreview,
          type: 'aankondiging',
          data: { announcement_id },
        });
        if (insertErr) {
          console.error(JSON.stringify({ event: 'announcement-push-insert-failed', announcement_id }));
        } else {
          successCount++;
        }
      } catch {
        console.error(JSON.stringify({ event: 'announcement-push-exception', announcement_id }));
      }
    }

    console.log(JSON.stringify({
      event: 'announcement-push-complete',
      announcement_id,
      count: successCount,
      ts: new Date().toISOString(),
    }));

    return new Response(
      JSON.stringify({ ok: true, count: successCount }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error(JSON.stringify({ event: 'announcement-push-error', outcome: 'failure' }));
    return new Response(
      JSON.stringify({ ok: false, message: 'Er is een fout opgetreden.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
