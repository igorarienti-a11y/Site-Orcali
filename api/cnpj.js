export const config = { runtime: 'edge' };

// ── ORCALI — verificação de existência de CNPJ ─────────────────────
// Usado pelo Typebot (Webhook client-side) para barrar CPF / CNPJ
// inventado antes de virar lead. Mesma regra que o form das LPs já faz
// no browser. Não grava nada, não enriquece.
//
// Fail-OPEN deliberado: só devolve ok:"nao" quando TEMOS CERTEZA
// (dígito verificador não fecha, ou a Receita responde 404/400). Se a
// BrasilAPI cair ou der timeout, devolve ok:"sim" — timeout não é prova
// de CNPJ falso, e barrar por API fora do ar perderia lead real.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Cache-Control': 'no-store',
};

const json = (obj) =>
  new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json', ...CORS },
  });

function digitoValido(d) {
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const dv = (base) => {
    let peso = base.length - 7, soma = 0;
    for (const c of base) { soma += (+c) * peso; peso = peso === 2 ? 9 : peso - 1; }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return dv(d.slice(0, 12)) === +d[12] && dv(d.slice(0, 13)) === +d[13];
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const url = new URL(req.url);
  const d = (url.searchParams.get('n') || '').replace(/\D/g, '').slice(0, 14);

  if (!digitoValido(d)) return json({ ok: 'nao', reason: 'digito' });

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4500);
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${d}`, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'orcali-lp/1.0' },
    });
    clearTimeout(t);

    if (r.status === 404 || r.status === 400) return json({ ok: 'nao', reason: 'nao_encontrado' });
    if (!r.ok) return json({ ok: 'sim', reason: 'erro_upstream' });
    return json({ ok: 'sim' });
  } catch {
    return json({ ok: 'sim', reason: 'erro_upstream' });
  }
}
