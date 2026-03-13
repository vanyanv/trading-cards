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
// TCGCard extends the SDK Card with pricing and variants (untyped in SDK but returned by API)
type TCGCard = SDKCard & {
  pricing?: TCGdexPricing;
  variants?: {
    normal?: boolean;
    holo?: boolean;
    reverse?: boolean;
    firstEdition?: boolean;
  };
};
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

export async function fetchSetDetail(setId: string): Promise<SDKSet> {
  const set = await tcgdex.set.get(setId);
  if (!set) throw new Error(`Set ${setId} not found`);
  return set;
}

// --- Booster set discovery ---

// Series that contain purchasable booster expansion sets
const BOOSTER_SERIES_IDS = [
  'base', 'gym', 'neo', 'ecard',
  'ex', 'dp', 'pl', 'hgss',
  'bw', 'xy', 'sm', 'swsh', 'sv',
];

// Standalone booster sets that may not appear under their parent series
// These are checked against discovered sets to avoid duplicates
const STANDALONE_BOOSTER_SET_IDS = ['g1', 'cel25', 'col1'];

// Patterns that indicate non-booster sets within a series
const NON_BOOSTER_PATTERNS = [
  /p$/,       // promo sets (swshp, smp, xyp, etc.)
  /^pop/,     // POP series
  /^mcd/,     // McDonald's promos
  /^tk/,      // Trainer kits
  /^si$/,     // Southern Islands
];

// Sets to always exclude (pass pattern filter but aren't purchasable booster packs)
const BLOCKLIST_SET_IDS = new Set<string>([
  // Add edge cases here as discovered
]);

function isBoosterSet(setId: string): boolean {
  if (BLOCKLIST_SET_IDS.has(setId)) return false;
  if (NON_BOOSTER_PATTERNS.some((p) => p.test(setId))) return false;
  return true;
}

/**
 * Dynamically discover all booster expansion set IDs from TCGdex.
 * Uses series enumeration + pattern filtering instead of a hardcoded list.
 */
export async function fetchBoosterSetIds(): Promise<string[]> {
  // Step 1: Get all series (returns SerieResume[] with id/name only)
  const allSeries = await tcgdex.serie.list();

  // Step 2: Filter to known booster series
  const boosterSeries = allSeries.filter((s) =>
    BOOSTER_SERIES_IDS.includes(s.id)
  );

  console.log(`  Found ${allSeries.length} series, ${boosterSeries.length} are booster series`);

  // Step 3: For each series, fetch full detail to get its sets
  const discoveredSetIds = new Set<string>();

  for (const serie of boosterSeries) {
    const detail = await tcgdex.serie.get(serie.id);
    if (!detail) {
      console.warn(`  Warning: Could not fetch series detail for ${serie.id}`);
      continue;
    }

    for (const set of detail.sets) {
      if (isBoosterSet(set.id)) {
        discoveredSetIds.add(set.id);
      }
    }
  }

  // Step 4: Add standalone booster sets (only if not already discovered)
  for (const setId of STANDALONE_BOOSTER_SET_IDS) {
    if (!discoveredSetIds.has(setId)) {
      discoveredSetIds.add(setId);
    }
  }

  const result = Array.from(discoveredSetIds);
  console.log(`  Discovered ${result.length} booster sets`);
  return result;
}

// --- Set detail helpers ---

export async function fetchSetSerieId(setId: string): Promise<string | null> {
  try {
    const set = await tcgdex.set.get(setId);
    if (!set) return null;
    return set.serie?.id ?? null;
  } catch {
    return null;
  }
}

export async function fetchSerieLogoUrl(serieId: string): Promise<string | null> {
  try {
    const serie = await tcgdex.serie.get(serieId);
    if (!serie || !serie.logo) return null;
    return `${serie.logo}.webp`;
  } catch {
    return null;
  }
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
