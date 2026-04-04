import { GoogleGenAI } from '@google/genai';
import { RawListing, ScoredListing } from '@/types';
import { RECENCY_BOOST } from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface GeminiScoreResult {
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
    photoCount: l.photoCount,
    sellerInfo: l.sellerInfo,
    distance: l.distance,
    platform: l.platform,
  }));

  const prompt = `You are a deal-scoring AI for a marketplace search app. The user is searching for: "${item}".

Score each listing on two dimensions, each from 0 to 50:
- value_score (0-50): How underpriced this listing appears relative to typical market value for "${item}". 50 = exceptional deal (50%+ below market), 25 = fair price, 0 = overpriced.
- match_score (0-50): How closely the listing matches "${item}". 50 = perfect match, 25 = reasonable match with some caveats, 0 = completely unrelated.

Also provide:
- reasons: 3-6 short bullet strings explaining the score. Use "⚠️" prefix for warnings. Examples: "strong local price discount (~40% below market)", "⚠️ only 1 blurry photo", "close match to requested item", "detailed description with specs".
- summary: A 2-4 sentence plain-language summary of the listing written for a buyer. Include condition, relevant specs, anything notable the seller mentioned. Be factual and concise.

Listings:
${JSON.stringify(listingData, null, 2)}

Return ONLY a valid JSON array (no markdown) where each element has: index (number), value_score (number), match_score (number), reasons (string[]), summary (string).`;

  let scoreResults: GeminiScoreResult[] = [];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text ?? '';
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      scoreResults = JSON.parse(match[0]) as GeminiScoreResult[];
    }
  } catch (e) {
    console.error('Gemini scoring failed:', e);
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
  const scoreMap = new Map<number, GeminiScoreResult>();
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
