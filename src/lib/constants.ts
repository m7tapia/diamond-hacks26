import { AlertInterval } from '@/types';

export const INTERVAL_LABELS: Record<AlertInterval, string> = {
  hourly: 'Hourly',
  '6h': 'Every 6 hours',
  daily: 'Daily',
  weekly: 'Weekly',
};

export const INTERVAL_CRON: Record<AlertInterval, string> = {
  hourly: '0 * * * *',
  '6h': '0 */6 * * *',
  daily: '0 9 * * *',
  weekly: '0 9 * * 1',
};

export const INTERVAL_MS: Record<AlertInterval, number> = {
  hourly: 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

export const RECENCY_BOOST = 25;
export const MIN_SCOUT_SCORE = parseInt(process.env.MIN_SCOUT_SCORE ?? '40', 10);
export const MAX_LISTINGS_PER_PLATFORM = 15;
