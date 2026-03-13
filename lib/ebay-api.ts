import eBayApi from 'ebay-api';
import type { EbayActiveListing, CardSoldListing, Edition } from '@/types';

let client: InstanceType<typeof eBayApi> | null = null;

function getClient(): InstanceType<typeof eBayApi> | null {
  if (client) return client;

  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;

  if (!appId || !certId) {
    return null;
  }

  client = new eBayApi({
    appId,
    certId,
    sandbox: false,
    siteId: eBayApi.SiteId.EBAY_US,
  });

  return client;
}

// ---------------------------------------------------------------------------
// Browse API – active card listings (unchanged)
// ---------------------------------------------------------------------------

export async function searchActiveCardListings(
  cardName: string,
  setName: string,
  cardNumber?: string
): Promise<EbayActiveListing[]> {
  const ebay = getClient();
  if (!ebay) {
    return [];
  }

  const parts = ['pokemon', cardName, setName];
  if (cardNumber) parts.push(cardNumber);
  const query = parts.join(' ');

  try {
    const response = await ebay.buy.browse.search({
      q: query,
      limit: '20',
      sort: 'price',
      filter: 'buyingOptions:{FIXED_PRICE}',
    });

    const items = response.itemSummaries || [];

    return items.map((item: Record<string, unknown>) => ({
      title: (item.title as string) || '',
      price: parseFloat((item.price as { value: string })?.value || '0'),
      condition: (item.condition as string) || 'Unknown',
      imageUrl: (item.image as { imageUrl: string })?.imageUrl || '',
      url: (item.itemWebUrl as string) || '',
      seller: (item.seller as { username: string })?.username || '',
    }));
  } catch (error) {
    console.error('eBay Browse API error:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Shared utilities (migrated from ebay-scraper.ts)
// ---------------------------------------------------------------------------

// Exclude patterns for pack listings
const PACK_EXCLUDE_PATTERNS = [
  /\blot\s+of\s+\d{2,}/i,
  /\bcollection\b/i,
  /\bbinder\b/i,
  /\bcase\b/i,
  /\bdisplay\b/i,
  /\bbox\s*(break|opening)/i,
  /\bPSA\s*\d/i,
  /\bBGS\s*[\d.]/i,
  /\bCGC\s*[\d.]/i,
  /\bgraded\b/i,
  /\bart\s+set\b/i,
  /\bcomplete\s+set\b/i,
  /\brepack\b/i,
  /\bcustom\b/i,
];

function isRelevantPackListing(title: string): boolean {
  return !PACK_EXCLUDE_PATTERNS.some((pattern) => pattern.test(title));
}

// Exclude patterns for card listings
const CARD_EXCLUDE_PATTERNS = [
  /\blot\s+of\s+\d+/i,
  /\bcollection\b/i,
  /\bbinder\b/i,
  /\bbulk\b/i,
  /\bbundle\b/i,
  /\bbooster\s*(box|pack|case)\b/i,
  /\bsealed\s*(box|case|display)\b/i,
  /\bplaymat\b/i,
  /\bsleeve/i,
  /\bdeckbox\b/i,
];

function isRelevantCardListing(title: string): boolean {
  return !CARD_EXCLUDE_PATTERNS.some((pattern) => pattern.test(title));
}

// Statistical outlier removal using interquartile range
function removeOutliersIQR(prices: number[]): number[] {
  if (prices.length < 4) return prices;

  const sorted = [...prices].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return sorted.filter((p) => p >= lowerBound && p <= upperBound);
}

function getEditionSearchTerms(edition?: Edition | null): string {
  switch (edition) {
    case '1st-edition':
      return ' "1st edition" -unlimited -shadowless';
    case 'shadowless':
      return ' shadowless -"1st edition"';
    case 'unlimited':
      return ' unlimited -"1st edition" -shadowless';
    default:
      return '';
  }
}

function getMaxPrice(edition?: Edition | null): number {
  switch (edition) {
    case '1st-edition':
      return 50000;
    case 'shadowless':
      return 15000;
    default:
      return 5000;
  }
}

export function detectGrading(title: string): string {
  const psaMatch = title.match(/\bPSA\s*(\d{1,2})\b/i);
  if (psaMatch) return `PSA ${psaMatch[1]}`;

  const bgsMatch = title.match(/\bBGS\s*([\d.]+)\b/i);
  if (bgsMatch) return `BGS ${bgsMatch[1]}`;

  const cgcMatch = title.match(/\bCGC\s*([\d.]+)\b/i);
  if (cgcMatch) return `CGC ${cgcMatch[1]}`;

  return 'Raw';
}

export function detectCondition(title: string): string | undefined {
  if (/\b(NM|near\s*mint)\b/i.test(title)) return 'NM';
  if (/\b(LP|lightly\s*played)\b/i.test(title)) return 'LP';
  if (/\b(MP|moderately\s*played)\b/i.test(title)) return 'MP';
  if (/\b(HP|heavily\s*played)\b/i.test(title)) return 'HP';
  if (/\b(DMG|damaged)\b/i.test(title)) return 'DMG';
  return undefined;
}

export function getCardEbaySearchUrl(
  cardName: string,
  setName: string,
  cardNumber?: string
): string {
  const parts = ['pokemon', cardName, setName];
  if (cardNumber) parts.push(cardNumber);
  const query = encodeURIComponent(parts.join(' '));
  return `https://www.ebay.com/sch/i.html?_nkw=${query}&LH_Complete=1&LH_Sold=1&_sop=13&_ipg=60`;
}

// ---------------------------------------------------------------------------
// Finding API helpers
// ---------------------------------------------------------------------------

interface FindingItem {
  title: string[];
  viewItemURL: string[];
  sellingStatus: { currentPrice: { __value__: string }[] }[];
  listingInfo?: { endTime: string[] }[];
}

function parseFindingItems(response: Record<string, unknown>): FindingItem[] {
  const results = response?.searchResult as
    | { item?: FindingItem[] }[]
    | undefined;
  if (!results || results.length === 0) return [];
  return results[0].item || [];
}

// ---------------------------------------------------------------------------
// Finding API – sold pack listings
// ---------------------------------------------------------------------------

export interface EbayPriceResult {
  price: number;
  listingsUsed: number;
  listingsTotal: number;
  priceRange: [number, number];
}

export async function searchSoldPackListings(
  setName: string,
  edition?: Edition | null
): Promise<EbayPriceResult | null> {
  const ebay = getClient();
  if (!ebay) return null;

  const keywords = `pokemon ${setName} booster pack -box -etb -elite${getEditionSearchTerms(edition)}`;

  try {
    const response = await ebay.finding.findCompletedItems({
      keywords,
      categoryId: '183454', // Pokémon Sealed Booster Packs
      itemFilter: [
        { name: 'SoldItemsOnly', value: 'true' },
        { name: 'ListingType', value: 'FixedPrice' },
      ],
      sortOrder: 'EndTimeSoonest',
      paginationInput: { entriesPerPage: 60 },
    });

    const items = parseFindingItems(response);
    const listingsTotal = items.length;

    // Filter out bundles/lots and extract prices
    const maxPrice = getMaxPrice(edition);
    const setLower = setName.toLowerCase();

    const relevantItems = items.filter((item) => {
      const title = item.title?.[0] || '';
      if (!isRelevantPackListing(title)) return false;
      return true;
    });

    // Prefer listings whose title mentions the set name
    const titleMatched = relevantItems.filter((item) => {
      const titleLower = (item.title?.[0] || '').toLowerCase();
      return (
        titleLower.includes(setLower) ||
        titleLower.includes(setLower.replace(/\s+/g, ''))
      );
    });
    const filteredItems =
      titleMatched.length >= 3 ? titleMatched : relevantItems;

    const rawPrices = filteredItems
      .map((item) => {
        const priceStr =
          item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0';
        return parseFloat(priceStr);
      })
      .filter((p) => p >= 1 && p <= maxPrice);

    const validPrices = removeOutliersIQR(rawPrices);

    if (validPrices.length < 3) return null;

    // Median to avoid skew
    validPrices.sort((a, b) => a - b);
    const mid = Math.floor(validPrices.length / 2);
    const median =
      validPrices.length % 2 === 0
        ? (validPrices[mid - 1] + validPrices[mid]) / 2
        : validPrices[mid];

    return {
      price: parseFloat(median.toFixed(2)),
      listingsUsed: validPrices.length,
      listingsTotal,
      priceRange: [validPrices[0], validPrices[validPrices.length - 1]],
    };
  } catch (error) {
    console.error('eBay Finding API error (packs):', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Finding API – sold card listings
// ---------------------------------------------------------------------------

export async function searchSoldCardListings(
  cardName: string,
  setName: string,
  cardNumber?: string
): Promise<CardSoldListing[]> {
  const ebay = getClient();
  if (!ebay) return [];

  const parts = ['pokemon', cardName, setName];
  if (cardNumber) parts.push(cardNumber);
  const keywords = parts.join(' ');

  try {
    const response = await ebay.finding.findCompletedItems({
      keywords,
      categoryId: '183454', // Pokémon Trading Cards
      itemFilter: [{ name: 'SoldItemsOnly', value: 'true' }],
      sortOrder: 'EndTimeSoonest',
      paginationInput: { entriesPerPage: 60 },
    });

    const items = parseFindingItems(response);

    return items
      .filter((item) => {
        const title = item.title?.[0] || '';
        return isRelevantCardListing(title);
      })
      .map((item) => {
        const title = item.title?.[0] || '';
        const priceStr =
          item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0';
        const endTime = item.listingInfo?.[0]?.endTime?.[0] || '';
        const soldDate = endTime
          ? new Date(endTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Unknown';

        return {
          title,
          price: parseFloat(priceStr),
          soldDate,
          url: item.viewItemURL?.[0] || '',
          grading: detectGrading(title),
          condition: detectCondition(title),
        };
      });
  } catch (error) {
    console.error('eBay Finding API error (cards):', error);
    return [];
  }
}
