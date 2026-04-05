import Groq from 'groq-sdk';
import { RawListing, ScoredListing } from '@/types';
import { RECENCY_BOOST } from './constants';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

interface ScoreResult {
  index: number;
  value_score: number;
  match_score: number;
  reasons: string[];
  summary: string;
}

export async function scoreListings(
  item: string,
  listings: RawListing[],
  seenIds: Set<string>
): Promise<ScoredListing[]> {
  if (listings.length === 0) return [];

  const listingData = listings.map((l, i) => ({
    index: i,
    title: l.title,
    price: l.price,
    description: l.description,
    fullDescription: l.fullDescription,
    photoCount: l.photoCount,
    sellerInfo: l.sellerInfo,
    sellerReviews: l.sellerReviews,
    timePosted: l.timePosted,
    distance: l.distance,
    platform: l.platform,
    highlights: l.highlights,
  }));

  const prompt = `You are a deal-scoring AI for a marketplace search app. The user is searching for: "${item}".

You are analyzing OfferUp listings. Score each listing on two dimensions, each from 0 to 50:

1. value_score (0-50): How good of a deal this is based on:
   - Price comparison to typical market value for similar "${item}" listings
   - Comparison to other listings in this batch (identify if this is cheaper than comparable items)
   - Condition and quality relative to price
   - 50 = exceptional deal (significantly underpriced, 40%+ below market)
   - 25 = fair/market price
   - 0 = overpriced or poor value

2. match_score (0-50): How well this matches what the user wants:
   - Relevance to the search term "${item}"
   - Condition and completeness
   - Description quality and detail
   - 50 = perfect match to user's search
   - 25 = reasonable match with some differences
   - 0 = completely unrelated or misleading

Also provide:
- reasons: 4-7 concise bullet points explaining why this is (or isn't) a good deal. Include:
  * Price comparison to market value (e.g., "~35% below typical market price for this model")
  * Comparison to similar listings in this batch (e.g., "cheapest of 3 similar listings")
  * Listing freshness indicator based on timePosted (e.g., "posted 2 hours ago - very fresh")
  * Seller reputation if available (e.g., "seller has 4.9★ rating with 45 reviews")
  * Photo quality/count (e.g., "6 clear photos showing all angles")
  * Match quality (e.g., "exact match to search query", "⚠️ different brand than typical for this category")
  * Any red flags with "⚠️" prefix (e.g., "⚠️ only 1 blurry photo", "⚠️ no seller reviews yet")

- summary: A 2-4 sentence factual overview written for a buyer. Mention: condition, key specs/features from description, what makes it notable, and any concerns. Be specific and helpful.

IMPORTANT: Use the timePosted field to highlight listing freshness. Newer listings (hours/days old) should be noted as a positive factor.

Listings to score:
${JSON.stringify(listingData, null, 2)}

Return a JSON object with a "results" array where each element has: index (number), value_score (number), match_score (number), reasons (string[]), summary (string).`;

  let scoreResults: ScoreResult[] = [];

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const text = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(text);
    // Groq with json_object mode might wrap in {results: [...]}
    scoreResults = (parsed.results || parsed) as ScoreResult[];
  } catch (e) {
    console.error('Groq scoring failed:', e);
    // Fall back to default scores
    scoreResults = listings.map((_, i) => ({
      index: i,
      value_score: 25,
      match_score: 25,
      reasons: ['Score unavailable — using defaults'],
      summary: 'Could not generate summary.',
    }));
  }

  // Build a lookup map
  const scoreMap = new Map<number, ScoreResult>();
  for (const r of scoreResults) {
    scoreMap.set(r.index, r);
  }

  return listings.map((listing, i) => {
    const score = scoreMap.get(i) ?? {
      index: i,
      value_score: 25,
      match_score: 25,
      reasons: [],
      summary: '',
    };

    const seenKey = `${listing.platform}:${listing.platformListingId}`;
    const isNew = !seenIds.has(seenKey);
    const rawScore = Math.min(100, score.value_score + score.match_score);
    const effectiveScore = Math.min(100, rawScore + (isNew ? RECENCY_BOOST : 0));

    const reasons = isNew
      ? [...score.reasons, '🆕 new since last scan']
      : score.reasons;

    return {
      ...listing,
      rawScore,
      effectiveScore,
      isNew,
      reasons,
      summary: score.summary,
    };
  });
}
