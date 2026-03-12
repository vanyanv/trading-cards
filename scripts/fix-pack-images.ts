/**
 * Fix pack images by restoring TCGdex set logos.
 *
 * Usage: npx tsx --env-file=.env.local scripts/fix-pack-images.ts
 *
 * This resets all pack image_url values to the TCGdex set logo,
 * undoing any incorrect TCGPlayer image overwrites.
 */

import { createClient } from '@supabase/supabase-js';
import { fetchSets } from '../lib/pokemon-tcg-api';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fixing pack images...\n');

  // Fetch all sets from TCGdex to get their logos
  const sets = await fetchSets();
  const setLogos = new Map<string, string>();
  for (const set of sets) {
    if (set.logo) {
      setLogos.set(set.id, `${set.logo}.png`);
    }
  }

  console.log(`Loaded ${setLogos.size} set logos from TCGdex\n`);

  // Fetch all packs
  const { data: packs, error } = await supabase
    .from('packs')
    .select('id, set_id, set_name, image_url')
    .order('set_name');

  if (error || !packs) {
    throw new Error(`Failed to fetch packs: ${error?.message}`);
  }

  let updated = 0;
  let skipped = 0;

  for (const pack of packs) {
    const logo = setLogos.get(pack.set_id);
    if (!logo) {
      console.log(`  SKIP ${pack.set_name}: no TCGdex logo found`);
      skipped++;
      continue;
    }

    if (pack.image_url === logo) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('packs')
      .update({ image_url: logo })
      .eq('id', pack.id);

    if (updateError) {
      console.log(`  ERROR ${pack.set_name}: ${updateError.message}`);
    } else {
      console.log(`  FIXED ${pack.set_name}: ${pack.image_url} → ${logo}`);
      updated++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
