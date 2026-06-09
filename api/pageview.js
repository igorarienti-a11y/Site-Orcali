export const config = { runtime: 'edge' };

const META_PIXEL_ID    = '1650240729249255';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: CORS });

  if (req.method !== 'POST')
    return new Response(null, { status: 405, headers: CORS });

  try {
    const d  = await req.json();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
            || req.headers.get('x-real-ip')
            || '';

    const userData = {
      client_ip_address: ip,
      client_user_agent: d.user_agent || req.headers.get('user-agent') || '',
    };
    if (d.fbp) userData.fbp = d.fbp;
    if (d.fbc) userData.fbc = d.fbc;

    const eventId   = d.event_id || crypto.randomUUID();
    const eventTime = Math.floor(Date.now() / 1000);

    const payload = {
      data: [{
        event_name:       'PageView',
        event_time:       eventTime,
        event_id:         eventId,
        action_source:    'website',
        event_source_url: d.page_url || '',
        user_data:        userData,
      }]
    };

    await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(payload),
    });

    return new Response(JSON.stringify({ ok: true }), {
      status:  200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[orcali/pageview]', err);
    return new Response(JSON.stringify({ ok: false }), {
      status:  500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}
