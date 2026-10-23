import rateLimit from 'express-rate-limit';
import { fail } from '../utils/response.js';
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, keyGenerator: (req) => { const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''; return email ? `email:${email}` : `ip:${req.ip}`; }, standardHeaders: true, legacyHeaders: false, handler: (req, res) => fail(res, 'تعداد تلاش‌ها بیش از حد مجاز است', 429) });
export const publicFormLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false, handler: (req, res) => fail(res, 'تعداد ارسال‌ها بیش از حد مجاز است', 429) });
