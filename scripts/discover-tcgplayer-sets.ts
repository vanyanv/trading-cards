/**
 * Discovers TCGPlayer set names for all packs in the database.
 *
 * TCGdex stores short set names like "151", "Astral Radiance" while
 * TCGPlayer uses prefixed names like "SV: Scarlet & Violet 151",
 * "SWSH: Astral Radiance". This script searches TCGPlayer for each
 * set and builds a mapping file used by findPackProduct().
 *
 * Usage: npx tsx --env-file=.env.local scripts/discover-tcgplayer-sets.ts
 *
 * Outputs: lib/tcgplayer-set-map.json
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { searchProducts } from '../lib/tcgplayer-api';
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all unique set names from packs
  const { data: packs, error } = await supabase
    .from('packs')
    .select('set_name')
    .order('set_name');

  if (error || !packs) {
    console.error('Failed to fetch packs:', error?.message);
    process.exit(1);
  }

  const setNames = [...new Set(packs.map((p) => p.set_name))];
  console.log(`Found ${setNames.length} unique set names to map\n`);

  const mapping: Record<string, string> = {};
  const notFound: string[] = [];

  for (const setName of setNames) {
    // Search TCGPlayer with the "pokemon" prefix for better results
    const query = `pokemon ${setName} booster pack`;
    console.log(`Searching: "${query}"`);

    await new Promise((r) => setTimeout(r, 400)); // rate limit
    const results = await searchProducts(query);

    // Filter to booster packs
    const candidates = results.filter((r) => isBoosterPack(r.productName));

    if (candidates.length === 0) {
      console.log(`  NO MATCH for "${setName}"`);
      notFound.push(setName);
      continue;
    }

    // Find the candidate whose product name or set name contains our set name
    const setLower = setName.toLowerCase();
    const bestCandidate =
      candidates.find((c) => c.productName.toLowerCase().includes(setLower)) ??
      candidates.find((c) => c.setName.toLowerCase().includes(setLower));

    if (!bestCandidate) {
      console.log(`  NO RELEVANT MATCH for "${setName}" (${candidates.length} candidates were unrelated)`);
      notFound.push(setName);
      continue;
    }

    const tcgpSetName = bestCandidate.setName;

    if (tcgpSetName && tcgpSetName !== setName) {
      mapping[setName] = tcgpSetName;
      console.log(`  "${setName}" → "${tcgpSetName}" (via ${bestCandidate.productName})`);
    } else {
      console.log(`  "${setName}" — same name on TCGPlayer`);
    }
  }

  // Write the mapping file
  const outputPath = join(__dirname, '..', 'lib', 'tcgplayer-set-map.json');
  writeFileSync(outputPath, JSON.stringify(mapping, null, 2) + '\n');
  console.log(`\nWrote ${Object.keys(mapping).length} mappings to ${outputPath}`);

  if (notFound.length > 0) {
    console.log(`\n${notFound.length} sets not found on TCGPlayer:`);
    for (const name of notFound) {
      console.log(`  - ${name}`);
    }
  }
}

main().catch(console.error);
