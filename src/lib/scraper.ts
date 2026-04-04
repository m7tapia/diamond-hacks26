import { Platform, RawListing } from '@/types';
import { MAX_LISTINGS_PER_PLATFORM } from './constants';

const BROWSER_USE_API = 'https://api.browser-use.com/api/v1';

interface BrowserUseTask {
  id: string;
  status: 'created' | 'running' | 'paused' | 'finished' | 'stopped' | 'failed';
  output: string | null;
}

async function runBrowserTask(task: string): Promise<string | null> {
  const apiKey = process.env.BROWSER_USE_API_KEY;
  if (!apiKey) throw new Error('BROWSER_USE_API_KEY is not set');

  // Create task
  const createRes = await fetch(`${BROWSER_USE_API}/run-task`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ task }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Browser Use task creation failed: ${text}`);
  }

  const { id } = (await createRes.json()) as { id: string };

  // Poll for result (max 3 minutes)
  const maxAttempts = 36;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    const statusRes = await fetch(`${BROWSER_USE_API}/task/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!statusRes.ok) continue;

    const taskData = (await statusRes.json()) as BrowserUseTask;

    if (taskData.status === 'finished') {
      return taskData.output;
    }
    if (taskData.status === 'failed' || taskData.status === 'stopped') {
      console.error(`Browser Use task ${id} ended with status: ${taskData.status}`);
      return null;
    }
  }

  console.error(`Browser Use task ${id} timed out`);
  return null;
}

function parseListings(raw: string | null, platform: Platform): RawListing[] {
  if (!raw) return [];
  try {
    // Extract JSON array from output (LLM may wrap it in markdown)
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as Partial<RawListing>[];
    return parsed
      .filter((l) => l.title && l.url)
      .map((l) => ({
        title: String(l.title ?? ''),
        price: l.price != null ? Number(l.price) : null,
        url: String(l.url ?? ''),
        imageUrl: l.imageUrl ? String(l.imageUrl) : null,
        platform,
        platformListingId: String(l.platformListingId ?? l.url ?? Math.random()),
        distance: l.distance ? String(l.distance) : null,
        description: l.description ? String(l.description) : null,
        sellerInfo: l.sellerInfo ? String(l.sellerInfo) : null,
        photoCount: Number(l.photoCount ?? 1),
      }));
  } catch (e) {
    console.error(`Failed to parse ${platform} listings:`, e);
    return [];
  }
}

function buildPrompt(platform: Platform, item: string, location: string, radiusMiles: number): string {
  const schema = `{ "title": string, "price": number|null, "url": string, "imageUrl": string|null, "platformListingId": string, "distance": string|null, "description": string|null, "sellerInfo": string|null, "photoCount": number }`;
  const n = MAX_LISTINGS_PER_PLATFORM;

  const urlMap: Record<Platform, string> = {
    facebook: `https://www.facebook.com/marketplace/${encodeURIComponent(location)}/search?query=${encodeURIComponent(item)}`,
    offerup: `https://offerup.com/search?q=${encodeURIComponent(item)}&location=${encodeURIComponent(location)}`,
    craigslist: `https://craigslist.org/search/sss?query=${encodeURIComponent(item)}&postal=${encodeURIComponent(location)}&search_distance=${radiusMiles}`,
    ebay: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(item)}&_stpos=${encodeURIComponent(location)}&_sadis=${radiusMiles}&LH_PrefLoc=99`,
  };

  return `
Go to ${urlMap[platform]}.
Wait for listings to load. For the first ${n} results, extract the following data for each listing:
- title: the listing title
- price: the asking price as a number (no currency symbol), or null if not listed
- url: the full URL to this specific listing
- imageUrl: the URL of the first/cover photo, or null if none
- platformListingId: a unique identifier for this listing extracted from its URL or page
- distance: distance from search location as a string (e.g. "4.1 miles"), or null
- description: the listing description text (up to 300 characters), or null
- sellerInfo: seller name and rating/review count if visible (e.g. "John - 4.8★ 47 reviews"), or null
- photoCount: number of photos in the listing (default 1 if unknown)

Return ONLY a valid JSON array of objects matching this schema: ${schema}
No markdown, no extra text. Just the JSON array. If you cannot find any listings, return [].
`.trim();
}

async function scrapePlatform(platform: Platform, item: string, location: string, radiusMiles: number): Promise<RawListing[]> {
  try {
    const prompt = buildPrompt(platform, item, location, radiusMiles);
    const output = await runBrowserTask(prompt);
    return parseListings(output, platform);
  } catch (e) {
    console.error(`Failed to scrape ${platform}:`, e);
    return [];
  }
}

export async function scrapeAll(item: string, location: string, radiusMiles: number): Promise<RawListing[]> {
  const platforms: Platform[] = ['facebook', 'offerup', 'craigslist', 'ebay'];

  const results = await Promise.allSettled(
    platforms.map((p) => scrapePlatform(p, item, location, radiusMiles))
  );

  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
