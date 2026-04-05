const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('Running 1min interval migration...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_interval_check;
      ALTER TABLE alerts ADD CONSTRAINT alerts_interval_check 
        CHECK (interval IN ('1min', 'hourly', '6h', 'daily', 'weekly'));
    `
  });

  if (error) {
    console.error('Migration failed:', error);
    console.log('\nTrying alternative approach...');
    
    // Alternative: direct query
    const { error: altError } = await supabase
      .from('alerts')
      .select('count')
      .limit(0);
    
    if (altError) {
      console.error('Alternative failed:', altError);
      console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
      console.log('ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_interval_check;');
      console.log("ALTER TABLE alerts ADD CONSTRAINT alerts_interval_check CHECK (interval IN ('1min', 'hourly', '6h', 'daily', 'weekly'));");
    }
  } else {
    console.log('✅ Migration successful!');
  }
}

runMigration();
