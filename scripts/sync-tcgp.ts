/**
 * Sync TCG Pocket cards and boosters from TCGdex API into Supabase.
 *
 * Usage: npx tsx --env-file=.env.local scripts/sync-tcgp.ts
 *
 * Creates a separate pack for each booster in each set, with a featured
 * card image as the pack cover art.
 */

import { createClient } from '@supabase/supabase-js';
import {
  fetchTCGPSets,
  fetchTCGPSetDetail,
  fetchTCGPCard,
  type TCGPCardDetail,
} from '../lib/pokemon-tcg-api';
import { Rarity } from '../types';
import { TCGP_RELEASE_DATES } from '../lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Skip promo sets — they don't have boosters
const SKIP_SET_IDS = ['P-A'];

// Map TCG Pocket rarity strings to our enum
function mapTCGPRarity(apiRarity: string | undefined): Rarity {
  if (!apiRarity) return Rarity.OneDiamond;

  const mapping: Record<string, Rarity> = {
    'One Diamond': Rarity.OneDiamond,
    'Two Diamond': Rarity.TwoDiamond,
    'Three Diamond': Rarity.ThreeDiamond,
    'Four Diamond': Rarity.FourDiamond,
    'One Star': Rarity.OneStar,
    'Two Star': Rarity.TwoStar,
    'Three Star': Rarity.ThreeStar,
    Crown: Rarity.Crown,
    'One Shiny': Rarity.OneShiny,
    'Two Shiny': Rarity.TwoShiny,
  };

  const mapped = mapping[apiRarity];
  if (!mapped) {
    console.warn(`  Unknown TCGP rarity: "${apiRarity}" — defaulting to One Diamond`);
    return Rarity.OneDiamond;
  }
  return mapped;
}

// Rarity priority for picking featured cards (higher = better)
const RARITY_PRIORITY: Record<string, number> = {
  [Rarity.OneDiamond]: 0,
  [Rarity.TwoDiamond]: 1,
  [Rarity.ThreeDiamond]: 2,
  [Rarity.FourDiamond]: 3,
  [Rarity.OneStar]: 5,
  [Rarity.TwoStar]: 6,
  [Rarity.ThreeStar]: 7,
  [Rarity.Crown]: 8,
  [Rarity.OneShiny]: 4,
  [Rarity.TwoShiny]: 5,
};

async function syncTCGPSet(setId: string) {
  console.log(`\nSyncing TCGP set: ${setId}...`);

  const setDetail = await fetchTCGPSetDetail(setId);
  console.log(`  Set: ${setDetail.name}, ${setDetail.cards.length} cards, ${setDetail.boosters?.length || 0} boosters`);

  if (!setDetail.boosters || setDetail.boosters.length === 0) {
    console.log(`  No boosters found, skipping...`);
    return;
  }

  // Fetch all card details
  const cardDetails: TCGPCardDetail[] = [];
  const batchSize = 5;

  for (let i = 0; i < setDetail.cards.length; i += batchSize) {
    const batch = setDetail.cards.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((stub) => fetchTCGPCard(stub.id).catch((err) => {
        console.error(`  Failed to fetch ${stub.id}: ${(err as Error).message}`);
        return null;
      }))
    );
    cardDetails.push(...results.filter((r): r is TCGPCardDetail => r !== null));

    if (i + batchSize < setDetail.cards.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`  Fetched ${cardDetails.length} card details`);

  // Upsert cards
  let inserted = 0;
  let errors = 0;

  for (const card of cardDetails) {
    const rarity = mapTCGPRarity(card.rarity);
    const boosterIds = card.boosters?.map((b) => b.id) || [];

    const subtypes: string[] = [];
    if (card.stage) subtypes.push(card.stage);
    if (card.suffix) subtypes.push(card.suffix);

    const { error } = await supabase.from('cards').upsert(
      {
        name: card.name,
        image_url: card.image ? `${card.image}/low.png` : '',
        image_url_hires: card.image ? `${card.image}/high.png` : '',
        rarity,
        set_id: card.set.id,
        set_name: card.set.name,
        hp: card.hp ? String(card.hp) : null,
        types: card.types || [],
        subtypes,
        supertype: card.category,
        tcg_id: card.id,
        booster_ids: boosterIds.length > 0 ? boosterIds : null,
      },
      { onConflict: 'tcg_id' }
    );

    if (error) {
      console.error(`  Error inserting ${card.name} (${card.id}):`, error.message);
      errors++;
    } else {
      inserted++;
    }
  }

  console.log(`  Inserted/updated: ${inserted}, Errors: ${errors}`);

  // Create a pack entry for each booster
  for (const booster of setDetail.boosters) {
    // Find cards in this booster
    const boosterCards = cardDetails.filter(
      (c) => c.boosters?.some((b) => b.id === booster.id)
    );

    // Pick featured card: find a card named after the booster with highest rarity,
    // fallback to the highest rarity card in the booster
    const boosterName = booster.name.toLowerCase();
    let featuredCard: TCGPCardDetail | undefined;

    // First try: card named after the booster (e.g., "Mewtwo ex" for Mewtwo booster)
    const namedCards = boosterCards
      .filter((c) => c.name.toLowerCase().includes(boosterName))
      .sort((a, b) => (RARITY_PRIORITY[mapTCGPRarity(b.rarity)] || 0) - (RARITY_PRIORITY[mapTCGPRarity(a.rarity)] || 0));

    if (namedCards.length > 0) {
      featuredCard = namedCards[0];
    }

    // Fallback: highest rarity card in booster
    if (!featuredCard) {
      const sorted = [...boosterCards].sort(
        (a, b) => (RARITY_PRIORITY[mapTCGPRarity(b.rarity)] || 0) - (RARITY_PRIORITY[mapTCGPRarity(a.rarity)] || 0)
      );
      featuredCard = sorted[0];
    }

    const featuredImage = featuredCard?.image ? `${featuredCard.image}/high.png` : null;

    const packData = {
      name: `${setDetail.name} - ${booster.name}`,
      description: `${booster.name} booster from ${setDetail.name} (TCG Pocket)`,
      price_usd: 0.50,
      image_url: setDetail.logo ? `${setDetail.logo}.png` : '',
      featured_card_image: featuredImage,
      cards_per_pack: 5,
      set_id: setDetail.id,
      set_name: setDetail.name,
      booster_id: booster.id,
      available: true,
      release_date: setDetail.releaseDate || TCGP_RELEASE_DATES[setDetail.id] || null,
    };

    // Check if pack already exists
    const { data: existing } = await supabase
      .from('packs')
      .select('id')
      .eq('set_id', setDetail.id)
      .eq('booster_id', booster.id)
      .single();

    const { error } = existing
      ? await supabase.from('packs').update(packData).eq('id', existing.id)
      : await supabase.from('packs').insert(packData);

    if (error) {
      console.error(`  Error creating pack for ${booster.name}:`, error.message);
    } else {
      console.log(`  Pack created: ${setDetail.name} - ${booster.name}${featuredCard ? ` (featured: ${featuredCard.name})` : ''}`);
    }
  }
}

async function main() {
  console.log('Pokemon TCG Pocket Card Sync (via TCGdex)');
  console.log('==========================================');

  const sets = await fetchTCGPSets();
  console.log(`\nFound ${sets.length} TCGP sets`);

  const targetSets = sets.filter((s) => !SKIP_SET_IDS.includes(s.id));
  console.log(`Syncing ${targetSets.length} sets (skipping promos)`);

  const failedSets: string[] = [];

  for (const set of targetSets) {
    try {
      await syncTCGPSet(set.id);
    } catch (err) {
      console.error(`  FAILED to sync ${set.id}:`, (err as Error).message);
      failedSets.push(set.id);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  if (failedSets.length > 0) {
    console.log(`\nRetrying ${failedSets.length} failed sets...`);
    for (const setId of failedSets) {
      try {
        await new Promise((r) => setTimeout(r, 2000));
        await syncTCGPSet(setId);
      } catch (err) {
        console.error(`  RETRY FAILED for ${setId}:`, (err as Error).message);
      }
    }
  }

  console.log('\nTCGP sync complete!');
}

main().catch(console.error);
