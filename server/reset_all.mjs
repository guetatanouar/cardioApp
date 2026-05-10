import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:guetat@localhost:5432/cardiomanager'
});

async function reset() {
  console.log('Resetting admin and secretaire accounts...');

  const password = await bcrypt.hash('admin123', 10);
  const password2 = await bcrypt.hash('secretaire123', 10);
  console.log('Generated hash:', password);
  console.log('Password for both accounts: admin123');

  // Remove existing accounts and their permissions
  await pool.query("DELETE FROM secretaire_permissions WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin', 'secretaire'))");
  await pool.query("DELETE FROM users WHERE username IN ('admin', 'secretaire')");

  // Re-insert admin
  await pool.query(
    `INSERT INTO users (id, username, email, password, name, role, initials, title)
     VALUES (1, 'admin', 'p.moreau@cabinet-cardio.fr', $1, 'Dr. Pierre Moreau', 'admin', 'PM', 'Cardiologue')`,
    [password]
  );
  console.log('Admin created: admin / admin123');

  // Re-insert secretaire
  await pool.query(
    `INSERT INTO users (id, username, email, password, name, role, initials, title)
     VALUES (2, 'secretaire', 's.dubois@cabinet-cardio.fr', $1, 'Sophie Dubois', 'secretaire', 'SD', 'Secrétaire médicale')`,
    [password2]
  );
  console.log('Secretaire created: secretaire / admin123');

  // Add default empty permissions for secretaire
  await pool.query(
    `INSERT INTO secretaire_permissions (user_id) VALUES (2)
     ON CONFLICT (user_id) DO NOTHING`
  );
  console.log('Default permissions created for secretaire (all disabled).');

  await pool.end();
  console.log('Done! Connect with:\n  admin / admin123\n  secretaire / admin123');
}

reset().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});
