/**
 * Sync real pack prices from eBay sold listings into the packs table.
 *
 * Usage: npx tsx --env-file=.env.local scripts/sync-pack-prices.ts
 *
 * Scrapes eBay for recent sold booster pack listings for each set
 * and updates the price_usd column with the average sold price.
 * Falls back to era-based estimates if scraping fails.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

const EXCLUDE_PATTERNS = [
  /\blot\s+of\s+\d{2,}/i,
  /\bcollection\b/i,
  /\bbinder\b/i,
  /\bcase\b/i,
  /\bdisplay\b/i,
  /\bbox\s*(break|opening)/i,
  /\bbooster\s*box\b/i,
  /\betb\b/i,
  /\belite\s*trainer/i,
];

// Era-based fallback prices
function getEraFallbackPrice(setId: string): number {
  if (setId.startsWith('sv') || setId.startsWith('swsh')) return 4.49;
  if (setId.startsWith('sm')) return 5.0;
  if (setId.startsWith('xy') || setId.startsWith('g1')) return 10.0;
  if (setId.startsWith('bw')) return 20.0;
  if (setId.startsWith('hgss') || setId.startsWith('col')) return 30.0;
  if (setId.startsWith('pl')) return 35.0;
  if (setId.startsWith('dp')) return 30.0;
  if (setId.startsWith('ex') || setId.startsWith('ecard')) return 80.0;
  if (setId.startsWith('neo')) return 150.0;
  if (setId.startsWith('gym')) return 200.0;
  if (setId.startsWith('base')) return 250.0;
  return 4.49;
}

async function scrapePackPrice(setName: string): Promise<number | null> {
  const query = encodeURIComponent(`pokemon ${setName} booster pack -box -etb -elite`);
  const url = `https://www.ebay.com/sch/i.html?_nkw=${query}&LH_Complete=1&LH_Sold=1&_sop=13&_ipg=60`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Extract prices from sold listings
    const pricePattern = /<span[^>]*class="[^"]*s-item__price[^"]*"[^>]*>[\s\S]*?\$([0-9,]+\.\d{2})/g;
    const titlePattern = /<span[^>]*role="heading"[^>]*>([^<]*)<\/span>/g;

    const prices: number[] = [];
    const titles: string[] = [];

    let match;
    while ((match = titlePattern.exec(html)) !== null) {
      const title = match[1].trim();
      if (title && title !== 'Shop on eBay') titles.push(title);
    }
    while ((match = pricePattern.exec(html)) !== null) {
      prices.push(parseFloat(match[1].replace(/,/g, '')));
    }

    // Filter out irrelevant listings and extreme prices (likely boxes/bundles)
    const validPrices: number[] = [];
    const count = Math.min(titles.length, prices.length);
    for (let i = 0; i < count; i++) {
      if (EXCLUDE_PATTERNS.some((p) => p.test(titles[i]))) continue;
      // Single booster packs are typically $2-$500
      if (prices[i] >= 1 && prices[i] <= 500) {
        validPrices.push(prices[i]);
      }
    }

    if (validPrices.length < 3) return null; // Not enough data

    // Use median to avoid outlier skew
    validPrices.sort((a, b) => a - b);
    const mid = Math.floor(validPrices.length / 2);
    const median = validPrices.length % 2 === 0
      ? (validPrices[mid - 1] + validPrices[mid]) / 2
      : validPrices[mid];

    return parseFloat(median.toFixed(2));
  } catch {
    return null;
  }
}

async function main() {
  console.log('Pack Price Sync (via eBay sold listings)');
  console.log('========================================\n');

  const { data: packs, error } = await supabase
    .from('packs')
    .select('id, set_id, set_name, price_usd')
    .order('set_name');

  if (error || !packs) {
    console.error('Failed to fetch packs:', error?.message);
    process.exit(1);
  }

  console.log(`Found ${packs.length} packs to price\n`);

  let scraped = 0;
  let fallback = 0;
  let failed = 0;

  for (const pack of packs) {
    // Rate limit: wait between requests to avoid being blocked
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

    const ebayPrice = await scrapePackPrice(pack.set_name);

    let priceUsd: number;
    let source: string;

    if (ebayPrice !== null) {
      priceUsd = ebayPrice;
      source = 'eBay';
      scraped++;
    } else {
      priceUsd = getEraFallbackPrice(pack.set_id);
      source = 'estimate';
      fallback++;
    }

    const { error: updateError } = await supabase
      .from('packs')
      .update({ price_usd: priceUsd })
      .eq('id', pack.id);

    if (updateError) {
      console.error(`  Error updating ${pack.set_name}:`, updateError.message);
      failed++;
    } else {
      const change = pack.price_usd
        ? ` (was $${pack.price_usd})`
        : '';
      console.log(`  ${pack.set_name}: $${priceUsd.toFixed(2)} [${source}]${change}`);
    }
  }

  console.log(`\nDone! eBay: ${scraped}, Fallback: ${fallback}, Failed: ${failed}`);
}

main().catch(console.error);
