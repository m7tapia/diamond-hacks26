-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  reset_token TEXT UNIQUE,
  reset_token_expires_at TIMESTAMPTZ,
  master_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_token TEXT UNIQUE NOT NULL,
  item TEXT NOT NULL,
  location TEXT NOT NULL,
  radius_miles INT NOT NULL DEFAULT 20,
  interval TEXT NOT NULL DEFAULT 'daily'
    CHECK (interval IN ('1min', 'hourly', '6h', 'daily', 'weekly')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ
);

CREATE TABLE seen_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (alert_id, platform, listing_id)
);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_alert_token ON alerts(alert_token);
CREATE INDEX idx_seen_listings_alert_id ON seen_listings(alert_id);
CREATE INDEX idx_users_master_token ON users(master_token);
