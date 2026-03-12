/**
 * Backfill release dates for existing packs from TCGdex API.
 *
 * Usage: npx tsx --env-file=.env.local scripts/backfill-release-dates.ts
 */

import { createClient } from '@supabase/supabase-js';
import { fetchSetDetail } from '../lib/pokemon-tcg-api';
import { TCGP_RELEASE_DATES } from '../lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Backfill Release Dates');
  console.log('======================');

  // Query all distinct set_id values from the packs table
  const { data: rows, error: fetchError } = await supabase
    .from('packs')
    .select('set_id');

  if (fetchError) {
    console.error('Error fetching set_ids from packs:', fetchError.message);
    process.exit(1);
  }

  const setIds = [...new Set((rows ?? []).map((r) => r.set_id as string).filter(Boolean))];
  console.log(`\nFound ${setIds.length} distinct set_id(s) to process.\n`);

  let updatedCount = 0;
  let noDateCount = 0;
  const noDateSets: string[] = [];

  for (const setId of setIds) {
    let releaseDate: string | null = null;

    // Try TCGdex API first
    try {
      const set = await fetchSetDetail(setId);
      if (set.releaseDate) {
        releaseDate = set.releaseDate;
      }
    } catch (err) {
      console.warn(`  [${setId}] TCGdex API error: ${(err as Error).message}`);
    }

    // Fall back to TCGP_RELEASE_DATES for TCG Pocket sets
    if (!releaseDate && TCGP_RELEASE_DATES[setId]) {
      releaseDate = TCGP_RELEASE_DATES[setId];
      console.log(`  [${setId}] Using TCGP fallback date: ${releaseDate}`);
    }

    if (releaseDate) {
      const { error: updateError } = await supabase
        .from('packs')
        .update({ release_date: releaseDate })
        .eq('set_id', setId);

      if (updateError) {
        console.error(`  [${setId}] Error updating packs: ${updateError.message}`);
      } else {
        console.log(`  [${setId}] Updated release_date = ${releaseDate}`);
        updatedCount++;
      }
    } else {
      console.warn(`  [${setId}] No release date found — skipping`);
      noDateCount++;
      noDateSets.push(setId);
    }

    // 300ms delay between API calls
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('\n=== BACKFILL SUMMARY ===');
  console.log(`Sets processed:  ${setIds.length}`);
  console.log(`Sets updated:    ${updatedCount}`);
  console.log(`No date found:   ${noDateCount}${noDateSets.length > 0 ? ` (${noDateSets.join(', ')})` : ''}`);
}

main().catch(console.error);
