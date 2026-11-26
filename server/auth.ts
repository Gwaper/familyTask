import { createHash, timingSafeEqual } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

const COOKIE = 'family';
const MAX_AGE = 400 * 24 * 3600; // maximum accepté par les navigateurs
const PUBLIC_PATHS = ['/api/health', '/api/login'];

/** Valeur du cookie : empreinte du code, pour ne jamais stocker le code lui-même côté appareil. */
export const tokenFor = (code: string): string => createHash('sha256').update(code).digest('hex');

export const sameToken = (a: string, b: string): boolean =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Exige le cookie du code famille sur l'API et les photos. */
export function requireFamily(familyCode: string): MiddlewareHandler {
  const expected = tokenFor(familyCode);
  return async (c, next) => {
    const { pathname } = new URL(c.req.url);
    const isProtected = pathname.startsWith('/api/') || pathname.startsWith('/photos/');
    if (!isProtected || PUBLIC_PATHS.includes(pathname) || sameToken(getCookie(c, COOKIE) ?? '', expected)) {
      return next();
    }
    return c.json({ error: 'unauthorized' }, 401);
  };
}

/** Pose le cookie du code famille (connexion réussie). */
export const setFamilyCookie = (c: Context, token: string): void =>
  setCookie(c, COOKIE, token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: MAX_AGE });
