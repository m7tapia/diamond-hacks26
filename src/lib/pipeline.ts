import { supabase } from './supabase';
import { scrapeAll } from './scraper';
import { scoreListings } from './scorer';
import { sendDigestEmail } from './email';
import { MIN_SCOUT_SCORE, INTERVAL_MS } from './constants';
import { Alert, User } from '@/types';

export async function runAlertPipeline(alertId: string): Promise<void> {
  console.log(`[pipeline] Starting run for alert ${alertId}`);

  // 1. Load alert + user
  const { data: alert, error: alertErr } = await supabase
    .from('alerts')
    .select('*')
    .eq('id', alertId)
    .eq('status', 'active')
    .single();

  if (alertErr || !alert) {
    console.log(`[pipeline] Alert ${alertId} not found or not active, skipping`);
    return;
  }

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', (alert as Alert).user_id)
    .single();

  if (userErr || !user) {
    console.error(`[pipeline] User not found for alert ${alertId}`);
    return;
  }

  const typedAlert = alert as Alert;
  const typedUser = user as User;

  // 2. Scrape all platforms
  console.log(`[pipeline] Scraping "${typedAlert.item}" near ${typedAlert.location}`);
  const rawListings = await scrapeAll(typedAlert.item, typedAlert.location, typedAlert.radius_miles);
  console.log(`[pipeline] Got ${rawListings.length} raw listings`);

  // 3. Load seen listing IDs
  const { data: seenRows } = await supabase
    .from('seen_listings')
    .select('platform, listing_id')
    .eq('alert_id', alertId);

  const seenIds = new Set<string>(
    (seenRows ?? []).map((r: { platform: string; listing_id: string }) => `${r.platform}:${r.listing_id}`)
  );

  // 4. Score and rank listings
  const scoredListings = await scoreListings(typedAlert.item, rawListings, seenIds);
  scoredListings.sort((a, b) => b.effectiveScore - a.effectiveScore);

  // 5. Filter by minimum threshold
  const qualifiedListings = scoredListings.filter((l) => l.effectiveScore >= MIN_SCOUT_SCORE);
  console.log(`[pipeline] ${qualifiedListings.length} listings passed threshold`);

  // 6. Send digest if any listings qualify
  if (qualifiedListings.length > 0) {
    await sendDigestEmail(typedUser, typedAlert, qualifiedListings);
    console.log(`[pipeline] Digest sent for alert ${alertId}`);
  } else {
    console.log(`[pipeline] No qualifying listings — skipping email`);
  }

  // 7. Upsert all seen listings (including ones that didn't qualify)
  const newListings = rawListings
    .filter((l) => !seenIds.has(`${l.platform}:${l.platformListingId}`))
    .map((l) => ({
      alert_id: alertId,
      platform: l.platform,
      listing_id: l.platformListingId,
    }));

  if (newListings.length > 0) {
    await supabase.from('seen_listings').upsert(newListings, {
      onConflict: 'alert_id,platform,listing_id',
    });
  }

  // 8. Update timestamps
  const now = new Date();
  const intervalMs = INTERVAL_MS[typedAlert.interval];
  const nextRunAt = new Date(now.getTime() + intervalMs);

  await supabase
    .from('alerts')
    .update({
      last_run_at: now.toISOString(),
      next_run_at: nextRunAt.toISOString(),
    })
    .eq('id', alertId);

  console.log(`[pipeline] Done for alert ${alertId}. Next run: ${nextRunAt.toISOString()}`);
}
