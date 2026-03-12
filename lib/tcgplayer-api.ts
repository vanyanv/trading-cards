import type { TCGPlayerProductDetails, Edition } from '@/types';

const BASE_URL = 'https://mp-search-api.tcgplayer.com/v1';
const IMAGE_BASE_URL = 'https://product-images.tcgplayer.com/fit-in/437x437';

export function getProductImageUrl(productId: number): string {
  return `${IMAGE_BASE_URL}/${productId}.jpg`;
}

export function getTcgplayerProductUrl(
  productUrlName: string,
  productId: number
): string {
  return `https://www.tcgplayer.com/product/${productId}/pokemon-${productUrlName}`;
}

export async function getProductDetails(
  productId: number
): Promise<TCGPlayerProductDetails | null> {
  try {
    const res = await fetch(`${BASE_URL}/product/${productId}/details`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();

    return {
      productId: data.productId,
      productName: data.productName,
      marketPrice: data.marketPrice ?? null,
      lowestPrice: data.lowestPrice ?? null,
      medianPrice: data.medianPrice ?? null,
      lowestPriceWithShipping: data.lowestPriceWithShipping ?? null,
      imageCount: data.imageCount ?? 0,
      setName: data.setName ?? '',
      setUrlName: data.setUrlName ?? '',
      productUrlName: data.productUrlName ?? '',
      productTypeName: data.productTypeName ?? '',
      activeListings: data.activeListings ?? 0,
      sellers: data.sellers ?? 0,
    };
  } catch {
    return null;
  }
}

export async function getProductDetailsBatch(
  productIds: number[],
  concurrency = 5
): Promise<Map<number, TCGPlayerProductDetails>> {
  const results = new Map<number, TCGPlayerProductDetails>();

  // Process in batches to limit concurrency
  for (let i = 0; i < productIds.length; i += concurrency) {
    const batch = productIds.slice(i, i + concurrency);
    const details = await Promise.all(batch.map(getProductDetails));
    for (let j = 0; j < batch.length; j++) {
      if (details[j] != null) {
        results.set(batch[j], details[j]!);
      }
    }
  }

  return results;
}

function getEditionSearchTerms(edition?: Edition | null): string {
  switch (edition) {
    case '1st-edition':
      return ' 1st edition';
    case 'shadowless':
      return ' shadowless';
    case 'unlimited':
      return ' unlimited';
    default:
      return '';
  }
}

function matchesEdition(
  productName: string,
  edition?: Edition | null
): boolean {
  const lower = productName.toLowerCase();
  switch (edition) {
    case '1st-edition':
      return lower.includes('1st edition');
    case 'shadowless':
      return lower.includes('shadowless');
    case 'unlimited':
      return lower.includes('unlimited') || (!lower.includes('1st edition') && !lower.includes('shadowless'));
    default:
      return true;
  }
}

const EXCLUDE_PRODUCT_PATTERNS = [
  /\bbox\b/i,
  /\betb\b/i,
  /\belite\s*trainer/i,
  /\bcase\b/i,
  /\bdisplay\b/i,
  /\bbundle\b/i,
  /\bcollection\b/i,
  /\btin\b/i,
];

function isBoosterPack(productName: string): boolean {
  const lower = productName.toLowerCase();
  if (!lower.includes('booster pack') && !lower.includes('booster')) return false;
  return !EXCLUDE_PRODUCT_PATTERNS.some((p) => p.test(productName));
}

export interface TCGPlayerSearchResult {
  productId: number;
  productName: string;
  marketPrice: number | null;
  lowestPrice: number | null;
  imageUrl: string;
  setName: string;
  productUrlName: string;
}

export async function searchProducts(
  query: string
): Promise<TCGPlayerSearchResult[]> {
  try {
    const res = await fetch(`${BASE_URL}/search/request?q=&isList=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        algorithm: '',
        from: 0,
        size: 50,
        filters: {
          term: {
            productLineName: ['pokemon'],
          },
          range: {},
          match: {},
        },
        listingSearch: {
          filters: {
            term: {},
            range: {},
            exclude: { channelExclusion: 0 },
          },
          context: { cart: {} },
        },
        context: { cart: {}, shippingCountry: 'US' },
        settings: {},
        sort: {},
        query,
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const results: TCGPlayerSearchResult[] = [];

    const resultSets = data?.results;
    if (!Array.isArray(resultSets)) return [];

    for (const resultSet of resultSets) {
      const aggregations = resultSet?.aggregations;
      if (!aggregations) continue;

      // The search response nests results in aggregations
      const totalResults = resultSet?.totalResults ?? 0;
      if (totalResults === 0) continue;

      // Results are in the main results array
      const items = resultSet?.results;
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        results.push({
          productId: item.productId,
          productName: item.productName ?? '',
          marketPrice: item.marketPrice ?? null,
          lowestPrice: item.lowestPrice ?? null,
          imageUrl: getProductImageUrl(item.productId),
          setName: item.setName ?? '',
          productUrlName: item.productUrlName ?? '',
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

// Hardcoded product IDs for vintage packs that the search endpoint can't find.
// TCGPlayer's search returns irrelevant modern products for these queries.
// Format: "setName|edition" → productId
const VINTAGE_PACK_IDS: Record<string, number> = {
  'Base Set|1st-edition': 138132,
  'Base Set|shadowless': 138132,
  'Base Set|unlimited': 138131,
  'Jungle|1st-edition': 138128,
  'Jungle|unlimited': 138129,
  'Fossil|1st-edition': 138133,
  'Fossil|unlimited': 138134,
  'Team Rocket|1st-edition': 138136,
  'Team Rocket|unlimited': 138135,
  'Gym Heroes|1st-edition': 138137,
  'Gym Heroes|unlimited': 138138,
  'Gym Challenge|1st-edition': 138140,
  'Gym Challenge|unlimited': 138139,
  'Neo Genesis|1st-edition': 138141,
  'Neo Genesis|unlimited': 138142,
  'Neo Discovery|1st-edition': 138144,
  'Neo Discovery|unlimited': 138143,
  'Neo Revelation|1st-edition': 138145,
  'Neo Revelation|unlimited': 138146,
  'Neo Destiny|1st-edition': 138148,
  'Neo Destiny|unlimited': 138147,
  'Base Set 2|': 138149,
  'Legendary Collection|': 138150,
  'Expedition|': 138151,
  'Aquapolis|': 138152,
  'Skyridge|': 138153,
  // ex-era sets
  'Hidden Legends|': 98595,
};

export function isVintagePack(setName: string, edition?: Edition | null): boolean {
  const key = `${setName}|${edition ?? ''}`;
  return key in VINTAGE_PACK_IDS;
}

export async function findPackProduct(
  setName: string,
  edition?: Edition | null
): Promise<TCGPlayerSearchResult | null> {
  // Check hardcoded vintage mapping first
  const key = `${setName}|${edition ?? ''}`;
  const vintageId = VINTAGE_PACK_IDS[key];
  if (vintageId) {
    const details = await getProductDetails(vintageId);
    if (details) {
      return {
        productId: vintageId,
        productName: details.productName,
        marketPrice: details.marketPrice,
        lowestPrice: details.lowestPrice,
        imageUrl: getProductImageUrl(vintageId),
        setName: details.setName,
        productUrlName: details.productUrlName,
      };
    }
  }

  // Fall back to search for non-vintage packs
  const query = `${setName} booster pack${getEditionSearchTerms(edition)}`;
  const results = await searchProducts(query);

  // Filter to booster packs that match the edition
  const candidates = results.filter(
    (r) => isBoosterPack(r.productName) && matchesEdition(r.productName, edition)
  );

  if (candidates.length === 0) return null;

  // Only return if the set name actually matches — avoid false positives
  const setLower = setName.toLowerCase();
  const match = candidates.find((c) =>
    c.setName.toLowerCase().includes(setLower) ||
    c.productName.toLowerCase().includes(setLower)
  );

  return match ?? null;
}
