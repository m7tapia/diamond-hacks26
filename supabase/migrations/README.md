# Database Migration: Add 1-Minute Interval

To enable the `1min` interval option for demo/showcase purposes, run this SQL in your **Supabase SQL Editor**:

```sql
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_interval_check;
ALTER TABLE alerts ADD CONSTRAINT alerts_interval_check 
  CHECK (interval IN ('1min', 'hourly', '6h', 'daily', 'weekly'));
```

## Steps:
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Paste the above SQL
4. Click **Run**

## Alternatively:
Run the migration script:
```bash
node run-1min-migration.js
```

After the migration, you can create alerts with `interval: "1min"` for demo purposes.
