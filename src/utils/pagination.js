import { listMeta } from './response.js';
export function pagination(query) { const page = Math.max(1, Number.parseInt(query.page, 10) || 1); const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20)); return { page, limit, offset: (page - 1) * limit }; }
export async function paged(connection, { select, count, params = [], page, limit, offset }) { const [rows] = await connection.query(`${select} LIMIT ? OFFSET ?`, [...params, limit, offset]); const [totals] = await connection.query(count, params); return { rows, meta: listMeta(page, limit, Number(totals[0].total)) }; }
