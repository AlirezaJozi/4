import { env } from '../config/env.js';
import { fail } from '../utils/response.js';
export function notFound(req, res) { return fail(res, 'مسیر مورد نظر پیدا نشد', 404); }
export function errorHandler(error, req, res, next) {
  req.log?.error({ err: error, code: error.code }, 'request failed');
  if (error.code === 'ER_DUP_ENTRY') return fail(res, 'رکورد تکراری است', 409);
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return fail(res, 'وابستگی معتبر نیست', 422);
  if (error.name === 'ZodError') return fail(res, 'داده‌های ورودی نامعتبر است', 422, error.issues.map((i) => ({ path: i.path, message: i.message })));
  if (error.code === 'LIMIT_FILE_SIZE') return fail(res, 'حجم فایل بیش از حد مجاز است', 422);
  if (['LIMIT_UNEXPECTED_FILE', 'MulterError'].includes(error.code) || error.status === 422 || error.name === 'SharpError') return fail(res, error.message || 'فایل یا ورودی نامعتبر است', 422);
  return fail(res, env.NODE_ENV === 'production' ? 'خطای داخلی سرور' : error.message, 500);
}
