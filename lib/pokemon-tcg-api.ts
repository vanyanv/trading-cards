import TCGdex from '@tcgdex/sdk';
import type {
  Card as SDKCard,
  CardResume as SDKCardResume,
  Set as SDKSet,
  SetResume as SDKSetResume,
} from '@tcgdex/sdk';

// Shared SDK instance with 1-hour cache
const tcgdex = new TCGdex('en');
tcgdex.setCacheTTL(3600);

// The API returns pricing data but the SDK doesn't type it.
// Since Model.fill() copies all fields, pricing is available at runtime.
export interface TCGdexPricing {
  cardmarket?: {
    updated?: string;
    unit?: string;
    avg?: number | null;
    low?: number | null;
    trend?: number | null;
    avg1?: number | null;
    avg7?: number | null;
    avg30?: number | null;
    'avg-holo'?: number | null;
    'low-holo'?: number | null;
    'trend-holo'?: number | null;
    'avg1-holo'?: number | null;
    'avg7-holo'?: number | null;
    'avg30-holo'?: number | null;
  };
  tcgplayer?: {
    updated?: string;
    unit?: string;
    normal?: { lowPrice?: number | null; midPrice?: number | null; highPrice?: number | null; marketPrice?: number | null; directLowPrice?: number | null };
    holofoil?: { lowPrice?: number | null; midPrice?: number | null; highPrice?: number | null; marketPrice?: number | null; directLowPrice?: number | null };
    'reverse-holofoil'?: { lowPrice?: number | null; midPrice?: number | null; highPrice?: number | null; marketPrice?: number | null; directLowPrice?: number | null };
    '1stEditionHolofoil'?: { lowPrice?: number | null; midPrice?: number | null; highPrice?: number | null; marketPrice?: number | null; directLowPrice?: number | null };
    '1stEditionNormal'?: { lowPrice?: number | null; midPrice?: number | null; highPrice?: number | null; marketPrice?: number | null; directLowPrice?: number | null };
  };
}

// Backwards-compatible type aliases
// TCGCard extends the SDK Card with pricing (untyped in SDK but returned by API)
type TCGCard = SDKCard & { pricing?: TCGdexPricing };
type TCGSet = SDKSetResume;
type TCGPBooster = { id: string; name: string };
type TCGPSetDetail = SDKSet;
type TCGPCardDetail = SDKCard;

// --- Regular TCG API ---

export async function fetchSets(): Promise<SDKSetResume[]> {
  const sets = await tcgdex.set.list();
  return sets;
}

export async function fetchCard(cardId: string, retries = 3): Promise<TCGCard> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const card = await tcgdex.card.get(cardId);
      if (card) return card as TCGCard;
      throw new Error(`Card ${cardId} not found`);
    } catch (err) {
      if (attempt < retries) {
        const delay = 1000 * attempt;
        console.warn(`  Retry ${attempt}/${retries} for ${cardId}, waiting ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Failed to fetch card ${cardId} after ${retries} retries`);
}

export async function fetchCardsBySet(setId: string): Promise<TCGCard[]> {
  const set = await tcgdex.set.get(setId);
  if (!set) throw new Error(`Set ${setId} not found`);

  const cardStubs = set.cards;
  console.log(`  Fetching ${cardStubs.length} card details...`);

  const batchSize = 5;
  const allCards: TCGCard[] = [];

  for (let i = 0; i < cardStubs.length; i += batchSize) {
    const batch = cardStubs.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((stub) => fetchCard(stub.id))
    );
    allCards.push(...results);
    if (i + batchSize < cardStubs.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return allCards;
}

// --- TCG Pocket API ---

export async function fetchTCGPSets(): Promise<{ id: string; name: string; logo?: string; cardCount: { total: number; official: number } }[]> {
  const serie = await tcgdex.serie.get('tcgp');
  if (!serie) throw new Error('Failed to fetch TCGP series');
  return serie.sets;
}

export async function fetchTCGPSetDetail(setId: string): Promise<TCGPSetDetail> {
  const set = await tcgdex.set.get(setId);
  if (!set) throw new Error(`Failed to fetch TCGP set ${setId}`);
  return set;
}

export async function fetchTCGPCard(cardId: string, retries = 3): Promise<TCGPCardDetail> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const card = await tcgdex.card.get(cardId);
      if (card) return card;
      throw new Error(`TCGP card ${cardId} not found`);
    } catch (err) {
      if (attempt < retries) {
        const delay = 1000 * attempt;
        console.warn(`  Retry ${attempt}/${retries} for ${cardId}, waiting ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Failed to fetch TCGP card ${cardId} after ${retries} retries`);
}

// --- Pricing helpers ---

export async function fetchCardPricing(cardId: string): Promise<TCGdexPricing | null> {
  try {
    const card = await fetchCard(cardId);
    return card.pricing ?? null;
  } catch {
    return null;
  }
}

export async function fetchBulkPricing(cardIds: string[]): Promise<Map<string, TCGdexPricing>> {
  const results = new Map<string, TCGdexPricing>();
  const batchSize = 5;

  for (let i = 0; i < cardIds.length; i += batchSize) {
    const batch = cardIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        const pricing = await fetchCardPricing(id);
        return { id, pricing };
      })
    );

    for (const { id, pricing } of batchResults) {
      if (pricing) results.set(id, pricing);
    }

    if (i + batchSize < cardIds.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}

// Export the SDK instance for direct use in API routes
export { tcgdex };
export type { TCGCard, TCGSet, TCGPSetDetail, TCGPCardDetail, TCGPBooster };
