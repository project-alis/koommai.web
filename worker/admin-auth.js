const enc = new TextEncoder();
export const SESSION_COOKIE = '__Host-meepiap_admin';
export const LOGIN_COOKIE = '__Host-meepiap_login';
export const SESSION_SECONDS = 8 * 60 * 60;
const now = () => Math.floor(Date.now() / 1000);
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const unhex = text => Uint8Array.from(text.match(/../g), pair => parseInt(pair, 16));
export const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));
export const hash = async value => hex(await crypto.subtle.digest('SHA-256', enc.encode(value)));
export function same(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
export function configured(env) {
  return typeof env.SESSION_SECRET === 'string' && enc.encode(env.SESSION_SECRET).length >= 32 &&
    /^pbkdf2-sha256\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(env.ADMIN_PASSWORD_HASH || '');
}
export async function passwordHash(password, salt = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name:'PBKDF2', salt:unhex(salt), iterations:100000, hash:'SHA-256' }, key, 256);
  return 'pbkdf2-sha256$100000$' + salt + '$' + hex(derived);
}
export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || password.length > 1024) return false;
  return same(await passwordHash(password, encoded.split('$')[2]), encoded);
}
async function signingKey(env) {
  return crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET), { name:'HMAC', hash:'SHA-256' }, false, ['sign','verify']);
}
const encode = value => btoa(String.fromCharCode(...enc.encode(JSON.stringify(value)))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/, '');
export async function sign(payload, env) {
  const body = encode(payload);
  return body + '.' + hex(await crypto.subtle.sign('HMAC', await signingKey(env), enc.encode(body)));
}
export async function verify(token, purpose, env) {
  try {
    if (!token || token.length > 2048) return null;
    const [body, signature, extra] = token.split('.');
    if (extra || !/^[a-f0-9]{64}$/.test(signature)) return null;
    if (!await crypto.subtle.verify('HMAC', await signingKey(env), unhex(signature), enc.encode(body))) return null;
    const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(body.replaceAll('-','+').replaceAll('_','/')), ch => ch.charCodeAt(0))));
    if (payload.purpose !== purpose || !Number.isInteger(payload.exp) || !Number.isInteger(payload.iat) ||
        payload.iat > now() + 30 || payload.exp <= now() || payload.exp - payload.iat > (purpose === 'login' ? 600 : SESSION_SECONDS) ||
        !/^[a-f0-9]{64}$/.test(payload.csrf)) return null;
    if (purpose === 'session' && (payload.version !== await hash(env.ADMIN_PASSWORD_HASH) || !/^[a-f0-9]{64}$/.test(payload.sid))) return null;
    return payload;
  } catch { return null; }
}
export function cookie(request, name) {
  const matches = (request.headers.get('cookie') || '').split(';').map(value => value.trim()).filter(value => value.startsWith(name + '='));
  return matches.length === 1 ? matches[0].slice(name.length + 1) : null;
}
export function setCookie(name, value, seconds) {
  return name + '=' + value + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + seconds;
}
export async function loginChallenge(env) {
  const payload = { purpose:'login', iat:now(), exp:now()+600, csrf:randomToken() };
  return { csrf:payload.csrf, cookie:setCookie(LOGIN_COOKIE, await sign(payload, env), 600) };
}
export async function currentSession(request, env) {
  const session = await verify(cookie(request, SESSION_COOKIE), 'session', env);
  if (!session) return null;
  const row = await env.DB.prepare('SELECT expires_at,revoked_at FROM admin_sessions WHERE id_hash=?').bind(await hash(session.sid)).first();
  return row && row.revoked_at === null && row.expires_at > now() && row.expires_at === session.exp ? session : null;
}
export async function createSession(env) {
  const session = { purpose:'session', iat:now(), exp:now()+SESSION_SECONDS, csrf:randomToken(), sid:randomToken(), version:await hash(env.ADMIN_PASSWORD_HASH) };
  await env.DB.prepare('INSERT INTO admin_sessions(id_hash,expires_at) VALUES(?,?)').bind(await hash(session.sid), session.exp).run();
  return setCookie(SESSION_COOKIE, await sign(session, env), SESSION_SECONDS);
}
export async function revokeSession(session, env) {
  await env.DB.prepare('UPDATE admin_sessions SET revoked_at=? WHERE id_hash=?').bind(now(), await hash(session.sid)).run();
}
export function checkCsrf(request, form, session) {
  return request.headers.get('origin') === new URL(request.url).origin && same(form.get('csrf'), session.csrf);
}
export async function limitLogin(request, env) {
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip || typeof env.ADMIN_LOGIN_LIMITER?.limit !== 'function') return 503;
  try {
    const result = await env.ADMIN_LOGIN_LIMITER.limit({ key:'meepiap-admin-login:' + await hash(ip) });
    return result?.success === true ? 200 : result?.success === false ? 429 : 503;
  } catch { return 503; }
}
