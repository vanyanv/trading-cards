import type { EbaySoldListing, CardSoldListing, Edition } from '@/types';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Filters out listings that are likely bundles, lots, or non-pack items
const EXCLUDE_PATTERNS = [
  /\blot\s+of\s+\d{2,}/i,
  /\bcollection\b/i,
  /\bbinder\b/i,
  /\bcase\b/i,
  /\bdisplay\b/i,
  /\bbox\s*(break|opening)/i,
];

function isRelevantListing(title: string): boolean {
  return !EXCLUDE_PATTERNS.some((pattern) => pattern.test(title));
}

function parseSoldListings(html: string): EbaySoldListing[] {
  const listings: EbaySoldListing[] = [];

  // eBay sold listings are in s-item containers
  // Match item blocks - each listing contains a link with title and a price
  const itemPattern =
    /<div[^>]*class="[^"]*s-item__info[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g;

  // Broader approach: find all item links and associated prices
  // Item titles are in <a> tags with class s-item__link
  const titlePattern =
    /<a[^>]*class="[^"]*s-item__link[^"]*"[^>]*href="([^"]*)"[^>]*>[\s\S]*?<span[^>]*role="heading"[^>]*>([^<]*)<\/span>/g;

  // Prices are in spans with class s-item__price
  const pricePattern =
    /<span[^>]*class="[^"]*s-item__price[^"]*"[^>]*>[\s\S]*?\$([0-9,]+\.\d{2})/g;

  // Sold dates appear as "Sold Mon DD, YYYY"
  const datePattern = /Sold\s+([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})/g;

  // Extract all titles with URLs
  const titles: { url: string; title: string }[] = [];
  let match;
  while ((match = titlePattern.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].trim();
    if (title && title !== 'Shop on eBay' && url.includes('/itm/')) {
      titles.push({ url, title });
    }
  }

  // Extract all prices
  const prices: number[] = [];
  while ((match = pricePattern.exec(html)) !== null) {
    const price = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(price)) {
      prices.push(price);
    }
  }

  // Extract all dates
  const dates: string[] = [];
  while ((match = datePattern.exec(html)) !== null) {
    dates.push(match[1]);
  }

  // Combine: titles, prices, and dates should align by index
  const count = Math.min(titles.length, prices.length);
  for (let i = 0; i < count; i++) {
    const { url, title } = titles[i];
    if (!isRelevantListing(title)) continue;

    listings.push({
      title,
      price: prices[i],
      soldDate: dates[i] || 'Unknown',
      url,
    });
  }

  return listings;
}

// Pack-specific eBay sold listing functions

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
      return 500;
  }
}

export async function scrapePackSoldPrice(
  setName: string,
  edition?: Edition | null
): Promise<number | null> {
  const query = encodeURIComponent(
    `pokemon ${setName} booster pack -box -etb -elite${getEditionSearchTerms(edition)}`
  );
  const url = `https://www.ebay.com/sch/i.html?_nkw=${query}&LH_Complete=1&LH_Sold=1&_sop=13&_ipg=60`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': randomUserAgent(),
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const listings = parseSoldListings(html);

    // Filter to valid price range
    const maxPrice = getMaxPrice(edition);
    const validPrices = listings
      .map((l) => l.price)
      .filter((p) => p >= 1 && p <= maxPrice);

    if (validPrices.length < 3) return null;

    // Median to avoid outlier skew
    validPrices.sort((a, b) => a - b);
    const mid = Math.floor(validPrices.length / 2);
    const median =
      validPrices.length % 2 === 0
        ? (validPrices[mid - 1] + validPrices[mid]) / 2
        : validPrices[mid];

    return parseFloat(median.toFixed(2));
  } catch {
    return null;
  }
}

// Card-specific eBay sold listing functions

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

function buildCardSearchUrl(
  cardName: string,
  setName: string,
  cardNumber?: string
): string {
  const parts = ['pokemon', cardName, setName];
  if (cardNumber) parts.push(cardNumber);
  const query = encodeURIComponent(parts.join(' '));
  return `https://www.ebay.com/sch/i.html?_nkw=${query}&LH_Complete=1&LH_Sold=1&_sop=13&_ipg=60`;
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

export async function scrapeCardSoldListings(
  cardName: string,
  setName: string,
  cardNumber?: string
): Promise<CardSoldListing[]> {
  const url = buildCardSearchUrl(cardName, setName, cardNumber);

  const res = await fetch(url, {
    headers: {
      'User-Agent': randomUserAgent(),
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!res.ok) {
    throw new Error(`eBay card fetch failed: ${res.status}`);
  }

  const html = await res.text();
  const rawListings = parseSoldListings(html);

  return rawListings
    .filter((l) => isRelevantCardListing(l.title))
    .map((l) => ({
      ...l,
      grading: detectGrading(l.title),
      condition: detectCondition(l.title),
    }));
}

export function getCardEbaySearchUrl(
  cardName: string,
  setName: string,
  cardNumber?: string
): string {
  return buildCardSearchUrl(cardName, setName, cardNumber);
}
