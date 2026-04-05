import { BrowserUse } from 'browser-use-sdk/v3';
import { z } from 'zod';
import { RawListing } from '@/types';
import { MAX_LISTINGS_PER_PLATFORM } from './constants';

const ListingSchema = z.object({
  title: z.string(),
  price: z.number().nullable(),
  url: z.string(),
  imageUrl: z.string().nullable(),
  platformListingId: z.string(),
  distance: z.string().nullable(),
  description: z.string().nullable(),
  fullDescription: z.string().nullable(),
  sellerInfo: z.string().nullable(),
  sellerReviews: z.string().nullable(),
  timePosted: z.string().nullable(),
  photoCount: z.number(),
  highlights: z.array(z.string()),
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
          fullDescription: { type: ['string', 'null'] },
          sellerInfo: { type: ['string', 'null'] },
          sellerReviews: { type: ['string', 'null'] },
          timePosted: { type: ['string', 'null'] },
          photoCount: { type: 'number' },
          highlights: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'url', 'platformListingId', 'photoCount'],
      },
    },
  },
  required: ['listings'],
};

function buildPrompt(item: string, location: string, radiusMiles: number): string {
  const n = MAX_LISTINGS_PER_PLATFORM;

  return `Go to https://offerup.com. Search for "${item}". Set location to "${location}" and apply a radius filter of ${radiusMiles} miles or similar. ONLY extract listings that are within ${radiusMiles} miles of the specified location. Extract up to ${n} listings.

For each listing, you need to click into the listing detail page to extract complete information:
- title: listing title (extract exact text as shown)
- price: numeric price (no $ sign), or null if not listed
- url: COMPLETE, ABSOLUTE URL to the individual listing page. Must start with https://offerup.com. This URL must be clickable and take users directly to the listing.
- imageUrl: the primary/cover photo image URL (look for <img> src attributes, typically the first/main listing photo). This should be a direct image URL (jpg, png, webp), not a thumbnail or placeholder. If no image exists, use null.
- platformListingId: unique ID from the listing URL (the part after the last slash or a query parameter)
- distance: distance string like "4.1 miles", or null
]
- description: first 150 characters of description for preview, or null
- fullDescription: the COMPLETE description text from the listing detail page. Extract ALL text EXACTLY as written - preserve apostrophes, quotes, line breaks, and all formatting. Do not convert special characters to HTML entities. Extract the raw text.
- sellerInfo: seller name if visible, or null
- sellerReviews: seller rating and review count (e.g., "4.8 stars (127 reviews)", "5.0 stars (3 reviews)", "No reviews yet"), or null if not available
- timePosted: when the listing was posted (e.g., "2 hours ago", "1 day ago", "3 weeks ago"), or null if not visible
- photoCount: total number of photos available for this listing (default 1)

CRITICAL REQUIREMENTS:
1. ONLY include listings within ${radiusMiles} miles - skip any listing outside this radius
2. Click into EACH listing to access the detail page where you can find the full description, seller reviews, and time posted
3. For url: Ensure it's a complete, absolute URL that starts with https://offerup.com
4. For imageUrl: Extract the actual image source URL from the img tag's src attribute. Do not leave this null if an image is visible.
5. For fullDescription: Extract the ENTIRE description EXACTLY as the seller wrote it - preserve all punctuation, apostrophes ('), quotes ("), and formatting. Do not encode special characters.
6. For sellerReviews: Look for the seller's profile section on the listing page. Extract both the star rating and the number of reviews.
7. For timePosted: Look for text like "Posted 2 hours ago" or similar timestamp information.

COMPLETION INSTRUCTION:
Once you have extracted all ${n} listings (or all available listings if fewer than ${n}), IMMEDIATELY return the JSON output and END the task. Do not browse further or wait. Your task is complete as soon as all data is extracted.

If no listings are found within the radius, return an empty listings array and END immediately.`;
}

async function scrapeOfferUp(
  client: BrowserUse,
  item: string,
  location: string,
  radiusMiles: number
): Promise<RawListing[]> {
  const prompt = buildPrompt(item, location, radiusMiles);
  console.log(`[scraper] Starting OfferUp agent...`);
  console.log(`[scraper] OfferUp prompt (exact):\n${prompt}`);
  console.log(`[scraper] OfferUp prompt length: ${prompt.length} characters`);

  try {
    const result = await client.run(prompt, {
      model: 'claude-sonnet-4.6' as const,
      outputSchema: outputJsonSchema,
    });

    console.log(`[scraper] OfferUp status: ${result.status}`);

    if (result.status === 'error' || result.status === 'timed_out') {
      console.error(`[scraper] OfferUp task failed. Status: ${result.status}`);
      return [];
    }

    if (!result.output) {
      console.log(`[scraper] OfferUp: no output`);
      return [];
    }

    let raw: unknown;
    try {
      raw = typeof result.output === 'string' ? JSON.parse(result.output) : result.output;
    } catch {
      console.error(`[scraper] OfferUp: output is not valid JSON:`, result.output);
      return [];
    }

    const parsed = PlatformResultSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(`[scraper] OfferUp: output did not match schema:`, parsed.error.message);
      return [];
    }

    const listings = parsed.data.listings.map((l) => ({ ...l, platform: 'offerup' as const }));
    console.log(`[scraper] OfferUp: ${listings.length} listings`);
    
    // Log URLs and images for debugging
    listings.forEach((l, i) => {
      
      console.log(`[scraper] OfferUp #${i + 1}:`);
      console.log(`  - url: ${l.url}`);
      console.log(`  - imageUrl: ${l.imageUrl ? 'present' : 'NULL'}`);
      console.log(`  - fullDescription: ${l.fullDescription ? `${l.fullDescription.substring(0, 50)}...` : 'NULL'}`);
      console.log(`  - sellerReviews: ${l.sellerReviews || 'NULL'}`);
      console.log(`  - timePosted: ${l.timePosted || 'NULL'}`);
      
      // Warn if URL doesn't look absolute
      if (l.url && !l.url.startsWith('http://') && !l.url.startsWith('https://')) {
        console.warn(`  ⚠️  URL appears to be relative: ${l.url}`);
      }
    });
    
    return listings;
  } catch (e) {
    console.error(`[scraper] OfferUp failed:`, e);
    return [];
  }
}

export async function scrapeAll(item: string, location: string, radiusMiles: number): Promise<RawListing[]> {
  const apiKey = process.env.BROWSER_USE_API_KEY;
  if (!apiKey) throw new Error('BROWSER_USE_API_KEY is not set');

  const client = new BrowserUse({ apiKey });

  console.log(`[scraper] Launching OfferUp agent for "${item}" near ${location} (${radiusMiles} miles)`);

  const listings = await scrapeOfferUp(client, item, location, radiusMiles);

  console.log(`[scraper] Total: ${listings.length} listings from OfferUp`);
  return listings;
}
