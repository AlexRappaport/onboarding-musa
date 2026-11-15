// Senha de acesso ao portal. Usuário: qualquer um. Senha: variável PORTAL_SENHA na Vercel.
export const config = { matcher: '/:path*' };

export default function middleware(request) {
  const senha = process.env.PORTAL_SENHA;
  if (!senha) return;
  const h = request.headers.get('authorization') || '';
  if (h.startsWith('Basic ')) {
    try {
      const dec = atob(h.slice(6));
      if (dec.slice(dec.indexOf(':') + 1) === senha) return;
    } catch (e) {}
  }
  return new Response('Acesso restrito', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Portal Musa", charset="UTF-8"' } });
}
