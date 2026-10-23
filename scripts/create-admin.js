import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { pool } from '../src/config/db.js';
import { hashPassword } from '../src/utils/crypto.js';

const rl = readline.createInterface({ input, output });
try {
  const email = (await rl.question('Admin email: ')).trim().toLowerCase();
  const password = await rl.question('Admin password (min 12 chars): ', { hideEchoBack: true });
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 12) throw new Error('ایمیل یا رمز عبور معتبر نیست');
  const [result] = await pool.query('INSERT INTO admins (email,password_hash) VALUES (?,?)', [email, await hashPassword(password)]);
  console.log(`Admin created with id ${result.insertId}`);
} catch (error) { console.error(error.message); process.exitCode = 1; } finally { rl.close(); await pool.end(); }
