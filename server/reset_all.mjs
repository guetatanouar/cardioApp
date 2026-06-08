import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:guetat@localhost:5432/cardiomanager'
});

async function reset() {
  console.log('Resetting all passwords to admin123...');

  const hash = await bcrypt.hash('admin123', 10);

  await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash, 'admin']);
  console.log('Admin password updated.');

  await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash, 'secretaire']);
  console.log('Secretaire password updated.');

  await pool.query('UPDATE patient_accounts SET password_hash = $1', [hash]);
  console.log('Patient passwords updated.');

  await pool.end();
  console.log('Done! All passwords: admin123');
}

reset().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});
