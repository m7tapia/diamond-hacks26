const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract host from Supabase URL
const urlObj = new URL(supabaseUrl);
const host = urlObj.hostname;

const client = new Client({
  host,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: serviceRoleKey,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✓ Connected');

    console.log('\nRunning migration: Adding password_hash column to users table...');
    
    // Check if column already exists
    const checkResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='password_hash'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✓ Column password_hash already exists');
      await client.end();
      process.exit(0);
    }

    // Add column
    await client.query('ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT \'\';');
    console.log('✓ Added password_hash column to users table');

    // Note: Update existing rows to have a placeholder hash (empty for now)
    console.log('✓ Migration completed successfully');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    await client.end();
    process.exit(1);
  }
}

runMigration();
