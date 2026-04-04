export type AlertInterval = 'hourly' | '6h' | 'daily' | 'weekly';
export type AlertStatus = 'active' | 'paused' | 'cancelled';
export type Platform = 'facebook' | 'offerup' | 'craigslist' | 'ebay';

export interface User {
  id: string;
  email: string;
  master_token: string;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  alert_token: string;
  item: string;
  location: string;
  radius_miles: number;
  interval: AlertInterval;
  status: AlertStatus;
  created_at: string;
  last_run_at: string | null;
  next_run_at: string | null;
}

export interface RawListing {
  title: string;
  price: number | null;
  url: string;
  imageUrl: string | null;
  platform: Platform;
  platformListingId: string;
  distance: string | null;
  description: string | null;
  sellerInfo: string | null;
  photoCount: number;
}

export interface ScoredListing extends RawListing {
  rawScore: number;
  effectiveScore: number;
  isNew: boolean;
  reasons: string[];
  summary: string;
}
