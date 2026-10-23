import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { env } from '../config/env.js';

const allowed = new Set(['jpeg', 'png', 'webp']);
const publicPath = (filename) => `/uploads/${filename}`;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 2, fields: 30 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(Object.assign(new Error('فرمت تصویر مجاز نیست'), { status: 422 }));
    }
    return cb(null, true);
  }
});

export async function processImage(file) {
  let metadata;
  try {
    metadata = await sharp(file.buffer, { failOn: 'error' }).metadata();
  } catch {
    throw Object.assign(new Error('محتوای تصویر معتبر نیست'), { status: 422 });
  }
  const format = metadata.format === 'jpg' ? 'jpeg' : metadata.format;
  if (!allowed.has(format) || !metadata.width || !metadata.height || metadata.width > env.MAX_IMAGE_WIDTH || metadata.height > env.MAX_IMAGE_HEIGHT) {
    throw Object.assign(new Error('نوع یا ابعاد تصویر مجاز نیست'), { status: 422 });
  }
  const filename = `${crypto.randomUUID()}.webp`;
  const root = path.resolve(env.UPLOAD_DIR);
  await fs.mkdir(root, { recursive: true });
  try {
    await sharp(file.buffer, { failOn: 'error' })
      .rotate()
      .resize({ width: env.MAX_IMAGE_WIDTH, height: env.MAX_IMAGE_HEIGHT, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(root, filename));
  } catch {
    throw Object.assign(new Error('پردازش تصویر ناموفق بود'), { status: 422 });
  }
  return { path: publicPath(filename), filename };
}

export async function removeImage(publicImagePath) {
  if (!publicImagePath || !publicImagePath.startsWith('/uploads/')) return;
  const filename = path.basename(publicImagePath);
  if (!/^[a-f0-9-]+\.webp$/i.test(filename)) return;
  try { await fs.unlink(path.join(path.resolve(env.UPLOAD_DIR), filename)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
