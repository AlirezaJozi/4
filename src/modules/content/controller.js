import { z } from 'zod';
import { pool, withTransaction } from '../../config/db.js';
import { ok, fail } from '../../utils/response.js';
import { pagination, paged } from '../../utils/pagination.js';
import { processImage, removeImage } from '../../middlewares/upload.js';
import { slugPattern } from '../../utils/slug.js';
import { recordActivity } from '../../utils/audit.js';

const idSchema = z.coerce.number().int().positive();
const booleanValue = z.preprocess((value) => value === 'true' ? true : value === 'false' ? false : value, z.boolean());
const imagePath = z.string().regex(/^\/uploads\/[a-f0-9-]+\.webp$/i).nullable().optional();
const serviceSchema = z.object({
  title: z.string().trim().min(2).max(190), name: z.string().trim().max(190).optional(), slug: z.string().regex(slugPattern),
  categoryId: idSchema, shortDescription: z.string().max(1000).optional().nullable(), description: z.string().max(10000).optional().nullable(),
  imageMain: imagePath, imageSecondary: imagePath, price: z.coerce.number().nonnegative().optional().nullable(), showPrice: booleanValue.default(false),
  priceText: z.string().max(190).optional().nullable(), durationMinutes: z.coerce.number().int().positive().optional().nullable(),
  complications: z.string().max(5000).optional().nullable(), preCare: z.string().max(5000).optional().nullable(), afterCare: z.string().max(5000).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0), isPublished: booleanValue.default(false)
});
const categorySchema = z.object({ title: z.string().trim().min(2).max(190), name: z.string().trim().max(190).optional(), slug: z.string().regex(slugPattern), description: z.string().max(3000).optional().nullable(), sortOrder: z.coerce.number().int().min(0).default(0), isActive: booleanValue.default(true) });
const portfolioCategorySchema = categorySchema.omit({ name: true });

function actor(req) { return { adminId: req.admin?.id, ip: req.ip }; }
async function requireService(id) { const [rows] = await pool.query('SELECT id FROM services WHERE id=? AND deleted_at IS NULL', [id]); return rows[0]; }
async function requireServiceCategory(id) { const [rows] = await pool.query('SELECT id FROM service_categories WHERE id=? AND is_active=1 AND deleted_at IS NULL', [id]); return rows[0]; }
async function requirePortfolioCategory(id) { const [rows] = await pool.query('SELECT id FROM portfolio_categories WHERE id=? AND is_active=1 AND deleted_at IS NULL', [id]); return rows[0]; }
async function requirePortfolio(id) { const [rows] = await pool.query('SELECT * FROM portfolio_items WHERE id=? AND deleted_at IS NULL', [id]); return rows[0]; }

export async function listServices(req, res) {
  const p = pagination(req.query); const q = req.query.search ? `%${req.query.search}%` : null;
  const categoryId = req.query.categoryId ? idSchema.parse(req.query.categoryId) : null;
  const published = req.query.isPublished === undefined ? null : (req.query.isPublished === 'true' || req.query.isPublished === '1' ? 1 : 0);
  const base = 'FROM services s JOIN service_categories c ON c.id=s.category_id WHERE s.deleted_at IS NULL AND (? IS NULL OR s.title LIKE ? OR s.slug LIKE ?) AND (? IS NULL OR s.category_id=?) AND (? IS NULL OR s.is_published=?)';
  const result = await paged(pool, { select: `SELECT s.*, c.title AS category_title ${base} ORDER BY s.sort_order,s.id`, count: `SELECT COUNT(*) total ${base}`, params: [q, q, q, categoryId, categoryId, published, published], ...p });
  return ok(res, result.rows, 'خدمات', result.meta);
}

export async function createService(req, res) {
  const body = serviceSchema.parse(req.body);
  if (!(await requireServiceCategory(body.categoryId))) return fail(res, 'دسته‌بندی فعال پیدا نشد', 422);
  const [result] = await pool.query(`INSERT INTO services
    (title,name,slug,category_id,short_description,description,image_main,image_secondary,price,show_price,price_text,duration_minutes,complications,pre_care,after_care,sort_order,is_published,published_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,IF(?,UTC_TIMESTAMP(),NULL))`, [body.title, body.name || body.title, body.slug, body.categoryId, body.shortDescription || null, body.description || null, body.imageMain || null, body.imageSecondary || null, body.price ?? null, body.showPrice, body.priceText || null, body.durationMinutes ?? null, body.complications || null, body.preCare || null, body.afterCare || null, body.sortOrder, body.isPublished, body.isPublished]);
  await recordActivity({ ...actor(req), action: 'create', entityType: 'service', entityId: result.insertId });
  return ok(res, { id: result.insertId, ...body }, 'خدمت ایجاد شد', undefined, 201);
}

export async function updateService(req, res) {
  const id = idSchema.parse(req.params.id); const body = serviceSchema.partial().parse(req.body); const current = await requireService(id);
  if (!current) return fail(res, 'خدمت پیدا نشد', 404);
  if (body.categoryId !== undefined && !(await requireServiceCategory(body.categoryId))) return fail(res, 'دسته‌بندی فعال پیدا نشد', 422);
  const map = { title: 'title', name: 'name', slug: 'slug', categoryId: 'category_id', shortDescription: 'short_description', description: 'description', imageMain: 'image_main', imageSecondary: 'image_secondary', price: 'price', showPrice: 'show_price', priceText: 'price_text', durationMinutes: 'duration_minutes', complications: 'complications', preCare: 'pre_care', afterCare: 'after_care', sortOrder: 'sort_order', isPublished: 'is_published' };
  const fields = []; const values = [];
  for (const [key, value] of Object.entries(body)) { fields.push(`${map[key]}=?`); values.push(value); }
  if (!fields.length) return fail(res, 'داده‌ای برای ویرایش ارسال نشده است', 422);
  if (body.isPublished === true) fields.push('published_at=COALESCE(published_at,UTC_TIMESTAMP())');
  if (body.isPublished === false) fields.push('published_at=NULL');
  const [updated] = await pool.query(`UPDATE services SET ${fields.join(',')} WHERE id=? AND deleted_at IS NULL`, [...values, id]);
  if (!updated.affectedRows) return fail(res, 'خدمت پیدا نشد', 404);
  await recordActivity({ ...actor(req), action: 'update', entityType: 'service', entityId: id, metadata: body });
  return ok(res, { id, ...body });
}

export async function deleteService(req, res) {
  const id = idSchema.parse(req.params.id); const [updated] = await pool.query('UPDATE services SET deleted_at=UTC_TIMESTAMP(),is_published=0 WHERE id=? AND deleted_at IS NULL', [id]);
  if (!updated.affectedRows) return fail(res, 'خدمت پیدا نشد', 404);
  await recordActivity({ ...actor(req), action: 'delete', entityType: 'service', entityId: id });
  return ok(res, { id }, 'خدمت غیرفعال شد');
}

export async function listCategories(req, res) { const [rows] = await pool.query('SELECT * FROM service_categories WHERE deleted_at IS NULL ORDER BY sort_order,id'); return ok(res, rows, 'دسته‌بندی خدمات'); }
export async function createCategory(req, res) {
  const body = categorySchema.parse(req.body); const [result] = await pool.query('INSERT INTO service_categories(title,name,slug,description,sort_order,is_active) VALUES (?,?,?,?,?,?)', [body.title, body.name || body.title, body.slug, body.description || null, body.sortOrder, body.isActive]);
  await recordActivity({ ...actor(req), action: 'create', entityType: 'service_category', entityId: result.insertId }); return ok(res, { id: result.insertId, ...body }, 'دسته ایجاد شد', undefined, 201);
}
export async function updateCategory(req, res) {
  const id = idSchema.parse(req.params.id); const body = categorySchema.partial().parse(req.body); const map = { title: 'title', name: 'name', slug: 'slug', description: 'description', sortOrder: 'sort_order', isActive: 'is_active' }; const fields = []; const values = [];
  for (const [key, value] of Object.entries(body)) { fields.push(`${map[key]}=?`); values.push(value); }
  if (!fields.length) return fail(res, 'داده‌ای برای ویرایش ارسال نشده است', 422); const [updated] = await pool.query(`UPDATE service_categories SET ${fields.join(',')} WHERE id=? AND deleted_at IS NULL`, [...values, id]); if (!updated.affectedRows) return fail(res, 'دسته‌بندی پیدا نشد', 404);
  await recordActivity({ ...actor(req), action: 'update', entityType: 'service_category', entityId: id, metadata: body }); return ok(res, { id, ...body });
}
export async function deleteCategory(req, res) {
  const id = idSchema.parse(req.params.id); const [count] = await pool.query('SELECT COUNT(*) total FROM services WHERE category_id=? AND deleted_at IS NULL', [id]); if (Number(count[0].total)) return fail(res, 'ابتدا خدمات این دسته را منتقل کنید', 409);
  const [updated] = await pool.query('UPDATE service_categories SET deleted_at=UTC_TIMESTAMP(),is_active=0 WHERE id=? AND deleted_at IS NULL', [id]); if (!updated.affectedRows) return fail(res, 'دسته‌بندی پیدا نشد', 404); await recordActivity({ ...actor(req), action: 'delete', entityType: 'service_category', entityId: id }); return ok(res, { id });
}

export async function listCareItems(req, res) { const id = idSchema.parse(req.params.id); if (!(await requireService(id))) return fail(res, 'خدمت پیدا نشد', 404); const [rows] = await pool.query('SELECT id,item_type,title,content,sort_order FROM service_care_items WHERE service_id=? ORDER BY item_type,sort_order,id', [id]); return ok(res, rows); }
export async function replaceCareItems(req, res) { const id = idSchema.parse(req.params.id); if (!(await requireService(id))) return fail(res, 'خدمت پیدا نشد', 404); const body = z.array(z.object({ itemType: z.enum(['complication', 'pre', 'after']), title: z.string().min(1).max(190), content: z.string().min(1).max(5000), sortOrder: z.coerce.number().int().min(0).default(0) })).parse(req.body); await withTransaction(async (db) => { await db.query('DELETE FROM service_care_items WHERE service_id=?', [id]); if (body.length) await db.query('INSERT INTO service_care_items(service_id,item_type,title,content,sort_order) VALUES ?', [body.map((x) => [id, x.itemType, x.title, x.content, x.sortOrder])]); }); await recordActivity({ ...actor(req), action: 'replace', entityType: 'service_care_items', entityId: id }); return ok(res, body, 'مراقبت‌ها به‌روزرسانی شد'); }
export async function listFaqs(req, res) { const id = idSchema.parse(req.params.id); if (!(await requireService(id))) return fail(res, 'خدمت پیدا نشد', 404); const [rows] = await pool.query('SELECT id,question,answer,sort_order FROM service_faqs WHERE service_id=? ORDER BY sort_order,id', [id]); return ok(res, rows); }
export async function replaceFaqs(req, res) { const id = idSchema.parse(req.params.id); if (!(await requireService(id))) return fail(res, 'خدمت پیدا نشد', 404); const body = z.array(z.object({ question: z.string().min(1).max(500), answer: z.string().min(1).max(10000), sortOrder: z.coerce.number().int().min(0).default(0) })).parse(req.body); await withTransaction(async (db) => { await db.query('DELETE FROM service_faqs WHERE service_id=?', [id]); if (body.length) await db.query('INSERT INTO service_faqs(service_id,question,answer,sort_order) VALUES ?', [body.map((x) => [id, x.question, x.answer, x.sortOrder])]); }); await recordActivity({ ...actor(req), action: 'replace', entityType: 'service_faqs', entityId: id }); return ok(res, body, 'پرسش‌های متداول به‌روزرسانی شد'); }

export async function listPortfolioCategories(req, res) { const [rows] = await pool.query('SELECT * FROM portfolio_categories WHERE deleted_at IS NULL ORDER BY sort_order,id'); return ok(res, rows); }
export async function createPortfolioCategory(req, res) { const body = portfolioCategorySchema.parse(req.body); const [result] = await pool.query('INSERT INTO portfolio_categories(title,slug,description,sort_order,is_active) VALUES (?,?,?,?,?)', [body.title, body.slug, body.description || null, body.sortOrder, body.isActive]); await recordActivity({ ...actor(req), action: 'create', entityType: 'portfolio_category', entityId: result.insertId }); return ok(res, { id: result.insertId, ...body }, 'دسته نمونه‌کار ایجاد شد', undefined, 201); }
export async function updatePortfolioCategory(req, res) { const id = idSchema.parse(req.params.id); const body = portfolioCategorySchema.partial().parse(req.body); const map = { title: 'title', slug: 'slug', description: 'description', sortOrder: 'sort_order', isActive: 'is_active' }; const fields = []; const values = []; for (const [key, value] of Object.entries(body)) { fields.push(`${map[key]}=?`); values.push(value); } if (!fields.length) return fail(res, 'داده‌ای برای ویرایش ارسال نشده است', 422); const [updated] = await pool.query(`UPDATE portfolio_categories SET ${fields.join(',')} WHERE id=? AND deleted_at IS NULL`, [...values, id]); if (!updated.affectedRows) return fail(res, 'دسته نمونه‌کار پیدا نشد', 404); await recordActivity({ ...actor(req), action: 'update', entityType: 'portfolio_category', entityId: id, metadata: body }); return ok(res, { id, ...body }); }
export async function deletePortfolioCategory(req, res) { const id = idSchema.parse(req.params.id); const [count] = await pool.query('SELECT COUNT(*) total FROM portfolio_items WHERE category_id=? AND deleted_at IS NULL', [id]); if (Number(count[0].total)) return fail(res, 'ابتدا نمونه‌کارها را منتقل کنید', 409); const [updated] = await pool.query('UPDATE portfolio_categories SET deleted_at=UTC_TIMESTAMP(),is_active=0 WHERE id=? AND deleted_at IS NULL', [id]); if (!updated.affectedRows) return fail(res, 'دسته نمونه‌کار پیدا نشد', 404); await recordActivity({ ...actor(req), action: 'delete', entityType: 'portfolio_category', entityId: id }); return ok(res, { id }); }

export async function listPortfolio(req, res) { const p = pagination(req.query); const q = req.query.search ? `%${req.query.search}%` : null; const categoryId = req.query.categoryId ? idSchema.parse(req.query.categoryId) : null; const published = req.query.isPublished === undefined ? null : (req.query.isPublished === 'true' || req.query.isPublished === '1' ? 1 : 0); const base = 'FROM portfolio_items p WHERE p.deleted_at IS NULL AND (? IS NULL OR p.title LIKE ? OR p.slug LIKE ?) AND (? IS NULL OR p.category_id=?) AND (? IS NULL OR p.is_published=?)'; const result = await paged(pool, { select: `SELECT p.* ${base} ORDER BY p.sort_order,p.id`, count: `SELECT COUNT(*) total ${base}`, params: [q, q, q, categoryId, categoryId, published, published], ...p }); return ok(res, result.rows, 'نمونه‌کارها', result.meta); }

async function parsePortfolioBody(req, partial = false) {
  const shape = z.object({ title: z.string().trim().min(2).max(190), slug: z.string().regex(slugPattern), categoryId: idSchema, serviceId: idSchema.optional().nullable(), description: z.string().max(5000).optional().nullable(), sortOrder: z.coerce.number().int().min(0).default(0), isPublished: booleanValue.default(false) });
  const body = (partial ? shape.partial() : shape).parse(req.body); const before = req.files?.beforeImage?.[0]; const after = req.files?.afterImage?.[0];
  let beforeImage = null;
  try {
    beforeImage = before ? await processImage(before) : null;
    const afterImage = after ? await processImage(after) : null;
    return { body, beforeImage, afterImage };
  } catch (error) {
    if (beforeImage) await removeImage(beforeImage.path);
    throw error;
  }
}
export async function createPortfolio(req, res) {
  let parsed; try { parsed = await parsePortfolioBody(req); } catch (error) { if (error.status) return fail(res, error.message, error.status); throw error; }
  const { body, beforeImage, afterImage } = parsed; if (!beforeImage || !afterImage) { if (beforeImage) await removeImage(beforeImage.path); if (afterImage) await removeImage(afterImage.path); return fail(res, 'دو تصویر قبل و بعد لازم است', 422); } if (!(await requirePortfolioCategory(body.categoryId))) { await removeImage(beforeImage.path); await removeImage(afterImage.path); return fail(res, 'دسته نمونه‌کار فعال پیدا نشد', 422); }
  if (body.serviceId && !(await requireService(body.serviceId))) { await removeImage(beforeImage.path); await removeImage(afterImage.path); return fail(res, 'خدمت مرتبط پیدا نشد', 422); }
  try { const [result] = await pool.query('INSERT INTO portfolio_items(title,slug,category_id,service_id,before_image,after_image,description,sort_order,is_published,published_at) VALUES (?,?,?,?,?,?,?,?,?,IF(?,UTC_TIMESTAMP(),NULL))', [body.title, body.slug, body.categoryId, body.serviceId || null, beforeImage.path, afterImage.path, body.description || null, body.sortOrder, body.isPublished, body.isPublished]); await recordActivity({ ...actor(req), action: 'create', entityType: 'portfolio', entityId: result.insertId }); return ok(res, { id: result.insertId, ...body, beforeImage: beforeImage.path, afterImage: afterImage.path }, 'نمونه‌کار ایجاد شد', undefined, 201); } catch (error) { await removeImage(beforeImage.path); await removeImage(afterImage.path); throw error; }
}
export async function updatePortfolio(req, res) {
  const id = idSchema.parse(req.params.id); const current = await requirePortfolio(id); if (!current) return fail(res, 'نمونه‌کار پیدا نشد', 404); let parsed; try { parsed = await parsePortfolioBody(req, true); } catch (error) { if (error.status) return fail(res, error.message, error.status); throw error; }
  const { body, beforeImage, afterImage } = parsed; if (body.categoryId !== undefined && !(await requirePortfolioCategory(body.categoryId))) { if (beforeImage) await removeImage(beforeImage.path); if (afterImage) await removeImage(afterImage.path); return fail(res, 'دسته نمونه‌کار فعال پیدا نشد', 422); } if (body.serviceId && !(await requireService(body.serviceId))) { if (beforeImage) await removeImage(beforeImage.path); if (afterImage) await removeImage(afterImage.path); return fail(res, 'خدمت مرتبط پیدا نشد', 422); }
  const map = { title: 'title', slug: 'slug', categoryId: 'category_id', serviceId: 'service_id', description: 'description', sortOrder: 'sort_order', isPublished: 'is_published' }; const fields = []; const values = []; for (const [key, value] of Object.entries(body)) { fields.push(`${map[key]}=?`); values.push(value); } if (body.isPublished === true) fields.push('published_at=COALESCE(published_at,UTC_TIMESTAMP())'); if (body.isPublished === false) fields.push('published_at=NULL'); if (beforeImage) { fields.push('before_image=?'); values.push(beforeImage.path); } if (afterImage) { fields.push('after_image=?'); values.push(afterImage.path); } if (!fields.length) return fail(res, 'داده‌ای برای ویرایش ارسال نشده است', 422);
  try { const [updated] = await pool.query(`UPDATE portfolio_items SET ${fields.join(',')} WHERE id=? AND deleted_at IS NULL`, [...values, id]); if (!updated.affectedRows) { if (beforeImage) await removeImage(beforeImage.path); if (afterImage) await removeImage(afterImage.path); return fail(res, 'نمونه‌کار پیدا نشد', 404); } if (beforeImage && current.before_image !== beforeImage.path) await removeImage(current.before_image); if (afterImage && current.after_image !== afterImage.path) await removeImage(current.after_image); await recordActivity({ ...actor(req), action: 'update', entityType: 'portfolio', entityId: id, metadata: body }); return ok(res, { id, ...body, ...(beforeImage ? { beforeImage: beforeImage.path } : {}), ...(afterImage ? { afterImage: afterImage.path } : {}) }); } catch (error) { if (beforeImage) await removeImage(beforeImage.path); if (afterImage) await removeImage(afterImage.path); throw error; }
}
export async function deletePortfolio(req, res) { const id = idSchema.parse(req.params.id); const current = await requirePortfolio(id); if (!current) return fail(res, 'نمونه‌کار پیدا نشد', 404); const [updated] = await pool.query('UPDATE portfolio_items SET deleted_at=UTC_TIMESTAMP(),is_published=0 WHERE id=? AND deleted_at IS NULL', [id]); if (!updated.affectedRows) return fail(res, 'نمونه‌کار پیدا نشد', 404); await recordActivity({ ...actor(req), action: 'delete', entityType: 'portfolio', entityId: id }); return ok(res, { id }); }
