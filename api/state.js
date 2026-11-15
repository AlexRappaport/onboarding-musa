// Guarda os dados do portal no Upstash Redis (Vercel Marketplace).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'musa:pague-menos';
const OK = k => /^musareal_/.test(k);

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(500).json({ error: 'Banco não configurado. Conecte o Upstash Redis no projeto da Vercel.' });
  try {
    if (req.method === 'GET') {
      const a = (await redis(['HGETALL', KEY])) || [];
      const o = {};
      for (let i = 0; i < a.length; i += 2) o[a[i]] = a[i + 1];
      return res.status(200).json(o);
    }
    if (req.method === 'POST') {
      let b = req.body;
      if (typeof b === 'string') b = JSON.parse(b || '{}');
      if (!b || typeof b !== 'object') b = {};
      const set = b.set || {}, del = (b.del || []).filter(OK), args = [];
      Object.keys(set).forEach(k => { if (OK(k)) args.push(k, String(set[k])); });
      if (args.length) await redis(['HSET', KEY, ...args]);
      if (del.length) await redis(['HDEL', KEY, ...del]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
