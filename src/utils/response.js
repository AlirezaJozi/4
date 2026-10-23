export function ok(res, data, message = 'عملیات با موفقیت انجام شد', meta = undefined, status = 200) {
  return res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });
}
export function fail(res, message, status = 400, errors = []) {
  return res.status(status).json({ success: false, message, errors });
}
export function listMeta(page, limit, total) { return { page, limit, total, totalPages: Math.ceil(total / limit) }; }
