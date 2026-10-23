import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.DB_HOST, port: env.DB_PORT, database: env.DB_NAME, user: env.DB_USER, password: env.DB_PASSWORD,
  waitForConnections: true, connectionLimit: env.DB_POOL_SIZE, charset: 'utf8mb4', timezone: 'Z', dateStrings: true,
  namedPlaceholders: false
});

export async function withTransaction(work) {
  const connection = await pool.getConnection();
  try { await connection.beginTransaction(); const result = await work(connection); await connection.commit(); return result; }
  catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}
