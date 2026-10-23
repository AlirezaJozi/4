import { pool } from '../config/db.js';

export async function recordActivity({ adminId, action, entityType, entityId = null, metadata = null, ip = null }) {
  try {
    await pool.query(
      'INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, metadata, ip_address) VALUES (?, ?, ?, ?, ?, INET6_ATON(?))',
      [adminId || null, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null, ip || null]
    );
  } catch {
    // Auditing must never break the business operation.
  }
}
