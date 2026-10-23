import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import { fail } from '../utils/response.js';

export async function issueSession(adminId) { const jti = crypto.randomUUID(); await pool.query('INSERT INTO admin_sessions (jti, admin_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))', [jti, adminId, env.SESSION_TTL_SECONDS]); return jwt.sign({ sub: adminId, jti, type: 'session' }, env.SESSION_SECRET, { expiresIn: env.SESSION_TTL_SECONDS }); }
export function authenticate(req, res, next) {
  const token = req.cookies?.clinic_session;
  if (!token) return fail(res, 'احراز هویت لازم است', 401);
  Promise.resolve().then(async () => { const payload = jwt.verify(token, env.SESSION_SECRET); if (payload.type !== 'session' || !payload.jti) throw new Error('invalid'); const [rows] = await pool.query('SELECT jti FROM admin_sessions WHERE jti=? AND admin_id=? AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP()', [payload.jti, payload.sub]); if (!rows[0]) throw new Error('revoked'); req.admin = { id: payload.sub, jti: payload.jti }; next(); }).catch(() => fail(res, 'نشست معتبر نیست یا منقضی شده است', 401));
}
export function csrfToken(req, res, next) { const token = crypto.randomBytes(24).toString('hex'); res.cookie(env.CSRF_COOKIE_NAME, token, { httpOnly: false, sameSite: 'strict', secure: env.COOKIE_SECURE, maxAge: env.SESSION_TTL_SECONDS * 1000 }); res.locals.csrfToken = token; return next(); }
export function csrfProtection(req, res, next) { if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path === '/admin/auth/login' || req.path === '/admin/auth/verify-otp' || req.path === '/admin/auth/resend-otp' || req.path === '/consultation-requests') return next(); if (req.path.startsWith('/admin') && !req.cookies?.clinic_session) return next(); const cookie = req.cookies?.[env.CSRF_COOKIE_NAME]; const header = req.get('x-csrf-token'); if (!cookie || !header || cookie !== header) return fail(res, 'توکن CSRF معتبر نیست', 403); return next(); }
