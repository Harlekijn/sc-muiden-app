import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const expoPushAccessToken = Deno.env.get('EXPO_PUSH_ACCESS_TOKEN');

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface NotificationRecord {
  id: string;
  recipient_profile_id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
}

async function sendPushNotifications(notification: NotificationRecord): Promise<void> {
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('profile_id', notification.recipient_profile_id);

  if (!tokens || tokens.length === 0) {
    console.log(JSON.stringify({ event: 'no_push_token', notification_id: notification.id }));
    return;
  }

  const messages: ExpoPushMessage[] = tokens.map((t: { token: string }) => ({
    to: t.token,
    title: notification.title,
    body: notification.body,
    sound: 'default',
    data: notification.data ?? {},
  }));

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (expoPushAccessToken) {
    headers['Authorization'] = `Bearer ${expoPushAccessToken}`;
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(JSON.stringify({ event: 'push_api_error', notification_id: notification.id, status: response.status, body }));
    return;
  }

  await supabase
    .from('notifications')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', notification.id);

  console.log(JSON.stringify({ event: 'push_sent', notification_id: notification.id, token_count: tokens.length }));
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record: NotificationRecord = payload.record;

    if (!record?.id || !record?.recipient_profile_id) {
      return new Response(JSON.stringify({ ok: false, message: 'Ongeldig verzoek.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await sendPushNotifications(record);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'push_trigger_error', message: (err as Error).message }));
    return new Response(
      JSON.stringify({ ok: false, message: 'Er is een fout opgetreden bij het versturen van de melding.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
