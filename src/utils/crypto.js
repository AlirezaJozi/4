import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
export const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');
export const generateOtp = (length) => String(crypto.randomInt(10 ** (length - 1), 10 ** length));
export const safeEqual = (a, b) => { const left = Buffer.from(a); const right = Buffer.from(b); return left.length === right.length && crypto.timingSafeEqual(left, right); };
export const hashPassword = (password) => bcrypt.hash(password, 12);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);
