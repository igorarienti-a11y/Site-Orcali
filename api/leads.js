export const config = { runtime: 'edge' };

const SPREADSHEET_ID  = process.env.ORCALI_SPREADSHEET_ID;
const SHEET_NAME      = 'Leads';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function getAccessToken(serviceAccountKey) {
  const key = JSON.parse(serviceAccountKey);
  const b64url = obj => btoa(JSON.stringify(obj))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

  const now = Math.floor(Date.now() / 1000);
  const header  = b64url({ alg: 'RS256', typ: 'JWT' });
  const payload = b64url({
    iss:   key.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  });

  const pem = key.private_key
    .replace('-----BEGIN PRIVATE KEY-----','')
    .replace('-----END PRIVATE KEY-----','')
    .replace(/\s/g,'');

  const binKey = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(`${header}.${payload}`)
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

  const jwt = `${header}.${payload}.${sigB64}`;
  const tok = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const td = await tok.json();
  if (!tok.ok) throw new Error(`TOKEN_FAIL: ${td.error_description}`);
  return td.access_token;
}

function formatPhone(raw) {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('55') && d.length >= 12) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = d.slice(0, 2) + '9' + d.slice(2);
  return '+55' + d;
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function getLocalDate() {
  const now    = new Date();
  const offset = -3;
  const local  = new Date(now.getTime() + (offset * 60 + now.getTimezoneOffset()) * 60000);
  const pad    = n => String(n).padStart(2, '0');
  return {
    iso: `${local.getFullYear()}-${pad(local.getMonth()+1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}-03:00`,
    br:  `${pad(local.getDate())}/${pad(local.getMonth()+1)}/${local.getFullYear()} ${pad(local.getHours())}:${pad(local.getMinutes())}`,
    mes: `${MESES[local.getMonth()]}/${local.getFullYear()}`,
  };
}

export default async function handler(req) {
  if (req.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: CORS });

  if (req.method !== 'POST')
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: CORS });

  try {
    const d    = await req.json();
    const utms = d.utms || {};

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
            || req.headers.get('x-real-ip')
            || '';

    let geo = { city: '', region_code: '', postal: '' };
    if (ip) {
      try {
        const gr = await fetch(`https://ipapi.co/${ip}/json/`, {
          headers: { 'User-Agent': 'orcali-lp/1.0' },
        });
        if (gr.ok) {
          const g = await gr.json();
          geo = {
            city:        g.city        || '',
            region_code: (g.region_code || '').toLowerCase(),
            postal:      (g.postal      || '').replace(/\D/g,'').substring(0,8),
          };
        }
      } catch (_) {}
    }

    const ts = getLocalDate();
    const nameParts = (d.name || '').trim().split(/\s+/);

    const fieldMap = {
      // ── comercial ──────────────────────────────────────────────
      'mês':          ts.mes,
      'data':         ts.br,
      'nome':         d.name          || '',
      'email':        (d.email || '').toLowerCase().trim(),
      'telefone':     formatPhone(d.phone),
      'empresa':      d.empresa       || '',
      'segmento':     d.segmento      || '',
      'estado':       d.estado        || geo.region_code,
      'cidade':       d.cidade        || geo.city,
      'mensagem':     (d.message || '').trim(),
      'status':       '',
      // ── utms ────────────────────────────────────────────────────
      'utm_source':   utms.utm_source   || '',
      'utm_medium':   utms.utm_medium   || '',
      'utm_campaign': utms.utm_campaign || '',
      'utm_term':     utms.utm_term     || '',
      'utm_content':  utms.utm_content  || '',
      // ── advanced match ──────────────────────────────────────────
      'event id':      d.event_id   || '',
      'fbclid':        d.fbclid     || '',
      'gclid':         d.gclid      || '',
      'gbraid':        d.gbraid     || '',
      'wbraid':        d.wbraid     || '',
      'ttclid':        d.ttclid     || '',
      'msclkid':       d.msclkid    || '',
      'fbp':           d.fbp        || '',
      'fbc':           d.fbc        || '',
      'primeiro nome': nameParts[0] || '',
      'sobrenome':     nameParts.slice(1).join(' ') || '',
      'pagina':        d.page_url   || '',
      'referencia':    d.referrer   || '',
      'idioma':        d.language   || '',
      'resolucao':     d.screen     || '',
      'fuso horario':  d.timezone   || '',
      'ip':            ip,
      'navegador':     d.user_agent || '',
      'cidade geo':    geo.city,
      'estado geo':    geo.region_code,
      'cep':           d.cep        || geo.postal,
      'data iso':      ts.iso,
      // ── adicionado no FINAL para não desalinhar as 38 colunas → header exato na planilha: "CNPJ" ──
      'cnpj':          (d.cnpj || '').replace(/\D/g, ''),
    };

    const token = await getAccessToken(process.env.GOOGLE_CREDENTIALS);

    const headersRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!1:1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!headersRes.ok) throw new Error(`HEADERS_FAIL(${headersRes.status})`);

    const headersData = await headersRes.json();
    const sheetHeaders = (headersData.values?.[0] || []).map(h => h.toLowerCase().trim());
    const row = sheetHeaders.map(h => fieldMap[h] ?? '');

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:A:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ values: [row] }),
      }
    );
    if (!appendRes.ok) {
      const err = await appendRes.json();
      throw new Error(`SHEETS_FAIL(${appendRes.status}): ${JSON.stringify(err)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[orcali/leads]', err);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}
