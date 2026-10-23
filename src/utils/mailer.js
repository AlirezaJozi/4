import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = env.SMTP_HOST ? nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_SECURE, auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined }) : null;
export async function sendMail({ to, subject, text }) {
  if (!transporter || !to || !env.MAIL_FROM) return false;
  await transporter.sendMail({ from: env.MAIL_FROM, to, subject, text });
  return true;
}
export async function notifyAdmin(subject, text, to = env.ADMIN_NOTIFICATION_EMAIL) { try { await sendMail({ to, subject, text }); } catch { /* notification failure is intentionally non-blocking */ } }
