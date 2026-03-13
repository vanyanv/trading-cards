/**
 * One-off script to research TCGPlayer product IDs for booster packs.
 *
 * Usage: npx tsx scripts/find-pack-product-ids.ts
 *
 * Searches TCGPlayer for each set name and logs candidate products.
 * Review the output and manually verify IDs on tcgplayer.com before adding
 * them to VINTAGE_PACK_IDS in lib/tcgplayer-api.ts.
 */

import { searchProducts, getProductDetails } from '../lib/tcgplayer-api';

// Sets we need product IDs for, grouped by era.
// Names must match what TCGdex returns for set.name.
const SETS_TO_RESEARCH = [
  // ex-era (no editions)
  'EX Ruby & Sapphire',
  'EX Sandstorm',
  'EX Dragon',
  'EX Team Magma vs Team Aqua',
  'EX Fire Red & Leaf Green',
  'EX Deoxys',
  'EX Emerald',
  'EX Unseen Forces',
  'EX Delta Species',
  'EX Legend Maker',
  'EX Holon Phantoms',
  'EX Crystal Guardians',
  'EX Dragon Frontiers',
  'EX Power Keepers',
  // DP-era
  'Diamond & Pearl',
  'Mysterious Treasures',
  'Secret Wonders',
  'Great Encounters',
  'Majestic Dawn',
  'Legends Awakened',
  'Stormfront',
  'Platinum',
  'Rising Rivals',
  'Supreme Victors',
  'Arceus',
  // HGSS-era
  'HeartGold SoulSilver',
  'HS—Unleashed',
  'HS—Undaunted',
  'HS—Triumphant',
  'Call of Legends',
  // BW-era
  'Black & White',
  'Emerging Powers',
  'Noble Victories',
  'Next Destinies',
  'Dark Explorers',
  'Dragons Exalted',
  'Boundaries Crossed',
  'Plasma Storm',
  'Plasma Freeze',
  'Plasma Blast',
  'Legendary Treasures',
  // XY-era
  'XY',
  'Flashfire',
  'Furious Fists',
  'Phantom Forces',
  'Primal Clash',
  'Roaring Skies',
  'Ancient Origins',
  'BREAKthrough',
  'BREAKpoint',
  'Fates Collide',
  'Steam Siege',
  'Evolutions',
];

const EXCLUDE_PATTERNS = [
  /\bbox\b/i,
  /\betb\b/i,
  /\belite\s*trainer/i,
  /\bcase\b/i,
  /\bdisplay\b/i,
  /\bbundle\b/i,
  /\bcollection\b/i,
  /\btin\b/i,
  /\bblister\b/i,
  /\btheme\s*deck/i,
  /\bstarter/i,
  /\btrainer\s*kit/i,
];

function isBoosterPack(name: string): boolean {
  const lower = name.toLowerCase();
  if (!lower.includes('booster') && !lower.includes('pack')) return false;
  return !EXCLUDE_PATTERNS.some((p) => p.test(name));
}

async function main() {
  console.log('TCGPlayer Product ID Research');
  console.log('============================\n');

  const results: { setName: string; productId: number; productName: string; setNameTcg: string; productType: string; marketPrice: number | null }[] = [];
  const notFound: string[] = [];

  for (const setName of SETS_TO_RESEARCH) {
    // Clean up set name for search (remove "EX " prefix, "HS—" prefix)
    let searchName = setName;
    if (searchName.startsWith('EX ')) searchName = searchName.slice(3);
    if (searchName.startsWith('HS—')) searchName = 'HS ' + searchName.slice(3);

    const query = `pokemon ${searchName} booster pack`;
    console.log(`\nSearching: "${query}"`);

    await new Promise((r) => setTimeout(r, 500)); // rate limit
    const searchResults = await searchProducts(query);

    const candidates = searchResults.filter((r) => isBoosterPack(r.productName));

    if (candidates.length === 0) {
      console.log(`  NO CANDIDATES FOUND`);
      notFound.push(setName);
      continue;
    }

    // Get details for top candidates (up to 5)
    const topCandidates = candidates.slice(0, 5);
    for (const candidate of topCandidates) {
      await new Promise((r) => setTimeout(r, 200));
      const details = await getProductDetails(candidate.productId);

      const productType = details?.productTypeName ?? 'unknown';
      const marketPrice = details?.marketPrice ?? candidate.marketPrice;

      console.log(`  [${candidate.productId}] ${candidate.productName}`);
      console.log(`    Set: ${candidate.setName} | Type: ${productType} | Price: $${marketPrice ?? 'N/A'}`);

      results.push({
        setName,
        productId: candidate.productId,
        productName: candidate.productName,
        setNameTcg: candidate.setName,
        productType,
        marketPrice,
      });
    }
  }

  // Print summary for easy copy-paste
  console.log('\n\n=== READY-TO-PASTE MAPPING ===');
  console.log('(Review each entry on tcgplayer.com before committing)\n');

  const seen = new Set<string>();
  for (const r of results) {
    if (seen.has(r.setName)) continue;

    // Pick the best candidate: prefer "Booster Pack" product type with a market price
    const candidates = results.filter((c) => c.setName === r.setName);
    const best =
      candidates.find((c) => c.productType === 'Booster Pack' && c.marketPrice != null) ??
      candidates.find((c) => c.productType === 'Booster Pack') ??
      candidates.find((c) => c.marketPrice != null) ??
      candidates[0];

    seen.add(r.setName);
    console.log(`  '${r.setName}|': ${best.productId}, // ${best.productName} ($${best.marketPrice ?? 'N/A'}) [${best.productType}]`);
  }

  if (notFound.length > 0) {
    console.log('\n\n=== NOT FOUND (need manual research) ===');
    for (const name of notFound) {
      console.log(`  - ${name}`);
    }
  }
}

main().catch(console.error);
