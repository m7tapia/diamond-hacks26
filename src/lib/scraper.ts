import { BrowserUse } from 'browser-use-sdk/v3';
import { z } from 'zod';
import { Platform, RawListing } from '@/types';
import { MAX_LISTINGS_PER_PLATFORM } from './constants';

const ListingSchema = z.object({
  title: z.string(),
  price: z.number().nullable(),
  url: z.string(),
  imageUrl: z.string().nullable(),
  platformListingId: z.string(),
  distance: z.string().nullable(),
  description: z.string().nullable(),
  sellerInfo: z.string().nullable(),
  photoCount: z.number(),
});

const PlatformResultSchema = z.object({
  listings: z.array(ListingSchema),
});

// JSON Schema sent to Browser Use so the agent knows the expected output shape
const outputJsonSchema = {
  type: 'object',
  properties: {
    listings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          price: { type: ['number', 'null'] },
          url: { type: 'string' },
          imageUrl: { type: ['string', 'null'] },
          platformListingId: { type: 'string' },
          distance: { type: ['string', 'null'] },
          description: { type: ['string', 'null'] },
          sellerInfo: { type: ['string', 'null'] },
          photoCount: { type: 'number' },
        },
        required: ['title', 'url', 'platformListingId', 'photoCount'],
      },
    },
  },
  required: ['listings'],
};

function buildPrompt(platform: Platform, item: string, location: string, radiusMiles: number): string {
  const n = MAX_LISTINGS_PER_PLATFORM;

  const instructions: Record<Platform, string> = {
    facebook: `Go to https://www.facebook.com/marketplace. Search for "${item}". Set the location to "${location}" and radius to ${radiusMiles} miles if possible. Extract up to ${n} listings.`,
    offerup: `Go to https://offerup.com. Search for "${item}". Set location to "${location}" if possible. Extract up to ${n} listings.`,
    craigslist: `Go to https://craigslist.org. Search for "${item}". Set location/postal code to "${location}" and distance to ${radiusMiles} miles. Extract up to ${n} listings.`,
  };

  return `${instructions[platform]}

For each listing extract:
- title: listing title
- price: numeric price (no $ sign), or null if not listed
- url: full URL to the listing
- imageUrl: cover photo URL, or null
- platformListingId: unique ID from the listing URL
- distance: distance string like "4.1 miles", or null
- description: first 300 characters of description, or null
- sellerInfo: seller name/rating if visible, or null
- photoCount: number of photos (default 1)

If no listings are found, return an empty listings array.`;
}

async function scrapePlatform(
  client: BrowserUse,
  platform: Platform,
  item: string,
  location: string,
  radiusMiles: number
): Promise<RawListing[]> {
  const prompt = buildPrompt(platform, item, location, radiusMiles);
  console.log(`[scraper] Starting ${platform} agent...`);

  try {
    const result = await client.run(prompt, {
      model: 'gemini-3-flash' as const,
      outputSchema: outputJsonSchema,
    });

    console.log(`[scraper] ${platform} status: ${result.status}`);

    if (result.status === 'error' || result.status === 'timed_out') {
      console.error(`[scraper] ${platform} task failed. Status: ${result.status}`);
      return [];
    }

    if (!result.output) {
      console.log(`[scraper] ${platform}: no output`);
      return [];
    }

    let raw: unknown;
    try {
      raw = typeof result.output === 'string' ? JSON.parse(result.output) : result.output;
    } catch {
      console.error(`[scraper] ${platform}: output is not valid JSON:`, result.output);
      return [];
    }

    const parsed = PlatformResultSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(`[scraper] ${platform}: output did not match schema:`, parsed.error.message);
      return [];
    }

    const listings = parsed.data.listings.map((l) => ({ ...l, platform }));
    console.log(`[scraper] ${platform}: ${listings.length} listings`);
    return listings;
  } catch (e) {
    console.error(`[scraper] ${platform} failed:`, e);
    return [];
  }
}

export async function scrapeAll(item: string, location: string, radiusMiles: number): Promise<RawListing[]> {
  const apiKey = process.env.BROWSER_USE_API_KEY;
  if (!apiKey) throw new Error('BROWSER_USE_API_KEY is not set');

  const client = new BrowserUse({ apiKey });
  const platforms: Platform[] = ['facebook', 'offerup', 'craigslist'];

  console.log(`[scraper] Launching 3 agents in parallel for "${item}" near ${location}`);

  // Run all 3 platforms in parallel — free tier allows 3 concurrent sessions
  const results = await Promise.allSettled(
    platforms.map((p) => scrapePlatform(client, p, item, location, radiusMiles))
  );

  const allListings: RawListing[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      allListings.push(...r.value);
    }
  }

  console.log(`[scraper] Total: ${allListings.length} listings across all platforms`);
  return allListings;
}
