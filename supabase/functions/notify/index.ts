// Edge Function: notify — يرسل إشعارات Push عبر Expo ويحفظها في صندوق الإشعارات.
// النشر: supabase functions deploy notify
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const STATUS: Record<string, string> = {
  pending: 'قيد المراجعة',
  packing: 'قيد التغليف',
  delivering: 'قيد التوصيل',
  delivered: 'تم التوصيل',
  rejected: 'تم الرفض',
};

const soundCfg = (id: string) =>
  !id || id === 'default'
    ? { sound: 'default', channelId: 'default' }
    : { sound: `${id}.wav`, channelId: id };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const admin = createClient(url, service);
    const { data: me } = await admin.from('profiles').select('*').eq('id', user.id).single();
    const isOwner = me?.role === 'owner';
    const myName = me?.full_name || me?.phone || (me?.email ?? '').split('@')[0] || 'مستخدم';
    const { data: st } = await admin.from('app_settings').select('*').eq('id', 1).single();

    const input = await req.json();
    let title = '';
    let body = '';
    let sound = 'default';
    let kind = input.type as string;
    let ref = String(input.ref_id ?? '');
    let recipients: string[] | 'all' = [];

    const owners = async () =>
      ((await admin.from('profiles').select('id').eq('role', 'owner')).data ?? []).map((r) => r.id as string);

    if (input.type === 'new_order') {
      const { data: o } = await admin.from('orders').select('*').eq('id', ref).single();
      if (!o || o.user_id !== user.id) return json({ error: 'forbidden' }, 403);
      title = 'طلب جديد';
      body = `${o.full_name} — ${Number(o.total).toLocaleString('en-US')} د.ع`;
      sound = st?.sound_order ?? 'chime';
      recipients = await owners();
    } else if (input.type === 'new_message') {
      const { data: m } = await admin.from('messages').select('*').eq('id', ref).single();
      if (!m || m.sender_id !== user.id) return json({ error: 'forbidden' }, 403);
      const preview = m.body ? String(m.body).slice(0, 120) : '📷 صورة';
      if (m.sender_role === 'customer') {
        title = `رسالة من ${myName}`;
        sound = st?.sound_message ?? 'pop';
        recipients = await owners();
      } else {
        title = 'رد من كاستر ستور';
        sound = st?.sound_reply ?? 'ding';
        recipients = [m.customer_id];
        ref = m.customer_id;
      }
      body = preview;
    } else if (input.type === 'order_status') {
      if (!isOwner) return json({ error: 'forbidden' }, 403);
      const { data: o } = await admin.from('orders').select('*').eq('id', ref).single();
      if (!o) return json({ error: 'not found' }, 404);
      title = `طلبك: ${STATUS[o.status] ?? o.status}`;
      body = o.status === 'rejected' && o.reject_reason ? `سبب الرفض: ${o.reject_reason}` : 'اضغط لمتابعة طلباتك';
      sound = st?.sound_status ?? 'bell';
      recipients = [o.user_id];
    } else if (input.type === 'broadcast') {
      if (!isOwner) return json({ error: 'forbidden' }, 403);
      title = String(input.title ?? '').slice(0, 120);
      body = String(input.body ?? '').slice(0, 500);
      if (!title) return json({ error: 'title required' }, 400);
      sound = input.sound || st?.sound_broadcast || 'melody';
      recipients = 'all';
      kind = 'broadcast';
    } else {
      return json({ error: 'unknown type' }, 400);
    }

    // الصوت المخصص (مرفوع من المالك) لا يمكن تشغيله من إشعار النظام والتطبيق مغلق → نستخدم صوته البديل
    let pushSound = sound;
    if (sound.startsWith('custom:')) {
      const { data: cs } = await admin.from('custom_sounds').select('push_sound').eq('id', sound.slice(7)).single();
      pushSound = cs?.push_sound ?? 'chime';
    }

    // الأجهزة المستهدفة
    let tokens: string[] = [];
    if (recipients === 'all') {
      tokens = ((await admin.from('push_tokens').select('token')).data ?? []).map((r) => r.token);
    } else if (recipients.length) {
      tokens = ((await admin.from('push_tokens').select('token').in('user_id', recipients)).data ?? []).map((r) => r.token);
    }

    let notifId = '';
    // صندوق الإشعارات داخل التطبيق
    if (recipients === 'all') {
      const { data: row } = await admin.from('notifications').insert({ user_id: null, kind, title, body, ref_id: ref, sound }).select('id').single();
      notifId = row?.id ?? '';
    } else if (recipients.length) {
      await admin.from('notifications').insert(recipients.map((id) => ({ user_id: id, kind, title, body, ref_id: ref, sound })));
    }

    // الإرسال عبر Expo
    const cfg = soundCfg(pushSound);
    let sent = 0;
    for (let i = 0; i < tokens.length; i += 100) {
      const chunk = tokens.slice(i, i + 100);
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(
          chunk.map((to) => ({ to, title, body, ...cfg, priority: 'high', ttl: 86400, badge: 1, subtitle: 'كاستر ستور', data: { kind, ref, nid: notifId } })),
        ),
      });
      const out = await res.json().catch(() => ({}));
      const tickets: Array<{ status: string; details?: { error?: string } }> = out.data ?? [];
      const dead: string[] = [];
      tickets.forEach((t, idx) => {
        if (t.status === 'ok') sent++;
        else if (t.details?.error === 'DeviceNotRegistered') dead.push(chunk[idx]);
      });
      if (dead.length) await admin.from('push_tokens').delete().in('token', dead);
    }

    return json({ ok: true, devices: tokens.length, sent });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
