/**
 * Sync cards from Pokemon TCG API into Supabase.
 *
 * Usage: npx tsx scripts/sync-cards.ts
 *
 * Fetches cards from specified sets and upserts them into the cards table.
 * Also creates pack entries for each set.
 */

import { createClient } from '@supabase/supabase-js';
import { fetchCardsBySet, fetchSets } from '../lib/pokemon-tcg-api';
import { Rarity } from '../types';
import { DEFAULT_PACK_PRICE } from '../lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Sets to sync — add more set IDs here
const TARGET_SET_IDS = ['sv1', 'sv2', 'sv3'];

// Map Pokemon TCG API rarity strings to our enum
function mapRarity(apiRarity: string | undefined): Rarity | null {
  if (!apiRarity) return null;

  const mapping: Record<string, Rarity> = {
    Common: Rarity.Common,
    Uncommon: Rarity.Uncommon,
    Rare: Rarity.Rare,
    'Double Rare': Rarity.DoubleRare,
    'Illustration Rare': Rarity.IllustrationRare,
    'Ultra Rare': Rarity.UltraRare,
    'Special Illustration Rare': Rarity.SpecialIllustrationRare,
    'Hyper Rare': Rarity.HyperRare,
    // Legacy rarity mappings
    'Rare Holo': Rarity.Rare,
    'Rare Holo V': Rarity.DoubleRare,
    'Rare Holo VMAX': Rarity.DoubleRare,
    'Rare Holo VSTAR': Rarity.DoubleRare,
    'Rare Ultra': Rarity.UltraRare,
    'Rare Secret': Rarity.HyperRare,
    'Rare Rainbow': Rarity.HyperRare,
    'Rare Holo EX': Rarity.DoubleRare,
    'Rare Holo GX': Rarity.DoubleRare,
    ACE: Rarity.UltraRare,
    'ACE SPEC Rare': Rarity.UltraRare,
    Promo: Rarity.Rare,
  };

  return mapping[apiRarity] ?? null;
}

async function syncSet(setId: string) {
  console.log(`\nSyncing set: ${setId}...`);

  const cards = await fetchCardsBySet(setId);
  console.log(`  Found ${cards.length} cards`);

  let inserted = 0;
  let skipped = 0;

  for (const card of cards) {
    const rarity = mapRarity(card.rarity);
    if (!rarity) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from('cards').upsert(
      {
        name: card.name,
        image_url: card.images.small,
        image_url_hires: card.images.large,
        rarity,
        set_id: card.set.id,
        set_name: card.set.name,
        hp: card.hp || null,
        types: card.types || [],
        subtypes: card.subtypes || [],
        supertype: card.supertype,
        tcg_id: card.id,
      },
      { onConflict: 'tcg_id' }
    );

    if (error) {
      console.error(`  Error inserting ${card.name}:`, error.message);
    } else {
      inserted++;
    }
  }

  console.log(`  Inserted/updated: ${inserted}, Skipped: ${skipped}`);

  // Create pack entry for this set
  if (cards.length > 0) {
    const set = cards[0].set;
    const { error } = await supabase.from('packs').upsert(
      {
        name: set.name,
        description: `Booster pack from the ${set.name} set`,
        price_coins: DEFAULT_PACK_PRICE,
        image_url: set.images.logo,
        cards_per_pack: 10,
        set_id: set.id,
        set_name: set.name,
        available: true,
      },
      { onConflict: 'set_id' }
    );

    if (error) {
      console.error(`  Error creating pack for ${set.name}:`, error.message);
    } else {
      console.log(`  Pack created for ${set.name}`);
    }
  }
}

async function main() {
  console.log('Pokemon TCG Card Sync');
  console.log('=====================');

  // Show available sets
  const sets = await fetchSets();
  console.log(`\nAvailable sets: ${sets.length}`);
  console.log(
    'Target sets:',
    TARGET_SET_IDS.map(
      (id) => `${id} (${sets.find((s) => s.id === id)?.name || 'unknown'})`
    ).join(', ')
  );

  for (const setId of TARGET_SET_IDS) {
    await syncSet(setId);
  }

  console.log('\nSync complete!');
}

main().catch(console.error);
