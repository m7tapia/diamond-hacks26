-- Add '1min' interval option for demo/showcase purposes
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_interval_check;
ALTER TABLE alerts ADD CONSTRAINT alerts_interval_check 
  CHECK (interval IN ('1min', 'hourly', '6h', 'daily', 'weekly'));
