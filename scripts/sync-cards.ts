/**
 * Sync cards from TCGdex API into Supabase.
 *
 * Usage: npx tsx --env-file=.env.local scripts/sync-cards.ts
 *
 * Fetches cards from specified sets and upserts them into the cards table.
 * Also creates pack entries for each set.
 */

import { createClient } from '@supabase/supabase-js';
import { fetchCard, fetchCardsBySet, fetchSets, type TCGCard, type TCGdexPricing } from '../lib/pokemon-tcg-api';
import { Rarity, type Edition } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// All purchasable booster sets (Base Set through present)
const TARGET_SET_IDS = [
  // Base / Classic (1999–2002)
  'base1',   // Base Set
  'base2',   // Jungle
  'base3',   // Fossil
  'base4',   // Base Set 2
  'base5',   // Team Rocket
  'gym1',    // Gym Heroes
  'gym2',    // Gym Challenge
  'neo1',    // Neo Genesis
  'neo2',    // Neo Discovery
  'neo3',    // Neo Revelation
  'neo4',    // Neo Destiny
  // e-Card (2002–2003)
  'ecard1',  // Expedition Base Set
  'ecard2',  // Aquapolis
  'ecard3',  // Skyridge
  // EX era (2003–2007)
  'ex1',     // Ruby & Sapphire
  'ex2',     // Sandstorm
  'ex3',     // Dragon
  'ex4',     // Team Magma vs Team Aqua
  'ex5',     // Hidden Legends
  'ex6',     // FireRed & LeafGreen
  'ex7',     // Team Rocket Returns
  'ex8',     // Deoxys
  'ex9',     // Emerald
  'ex10',    // Unseen Forces
  'ex11',    // Delta Species
  'ex12',    // Legend Maker
  'ex13',    // Holon Phantoms
  'ex14',    // Crystal Guardians
  'ex15',    // Dragon Frontiers
  'ex16',    // Power Keepers
  // Diamond & Pearl (2007–2009)
  'dp1',     // Diamond & Pearl
  'dp2',     // Mysterious Treasures
  'dp3',     // Secret Wonders
  'dp4',     // Great Encounters
  'dp5',     // Majestic Dawn
  'dp6',     // Legends Awakened
  'dp7',     // Stormfront
  // Platinum (2009)
  'pl1',     // Platinum
  'pl2',     // Rising Rivals
  'pl3',     // Supreme Victors
  'pl4',     // Arceus
  // HeartGold SoulSilver (2010–2011)
  'hgss1',   // HeartGold SoulSilver
  'hgss2',   // Unleashed
  'hgss3',   // Undaunted
  'hgss4',   // Triumphant
  'col1',    // Call of Legends
  // Black & White (2011–2013)
  'bw1',     // Black & White
  'bw2',     // Emerging Powers
  'bw3',     // Noble Victories
  'bw4',     // Next Destinies
  'bw5',     // Dark Explorers
  'bw6',     // Dragons Exalted
  'bw7',     // Boundaries Crossed
  'bw8',     // Plasma Storm
  'bw9',     // Plasma Freeze
  'bw10',    // Plasma Blast
  'bw11',    // Legendary Treasures
  // XY (2014–2016)
  'xy1',     // XY
  'xy2',     // Flashfire
  'xy3',     // Furious Fists
  'xy4',     // Phantom Forces
  'xy5',     // Primal Clash
  'xy6',     // Roaring Skies
  'xy7',     // Ancient Origins
  'xy8',     // BREAKthrough
  'xy9',     // BREAKpoint
  'g1',      // Generations
  'xy10',    // Fates Collide
  'xy11',    // Steam Siege
  'xy12',    // Evolutions
  // Sun & Moon (2017–2019)
  'sm1',     // Sun & Moon
  'sm2',     // Guardians Rising
  'sm3',     // Burning Shadows
  'sm3.5',   // Shining Legends
  'sm4',     // Crimson Invasion
  'sm5',     // Ultra Prism
  'sm6',     // Forbidden Light
  'sm7',     // Celestial Storm
  'sm7.5',   // Dragon Majesty
  'sm8',     // Lost Thunder
  'sm9',     // Team Up
  'sm10',    // Unbroken Bonds
  'sm11',    // Unified Minds
  'sm115',   // Hidden Fates
  'sm12',    // Cosmic Eclipse
  // Sword & Shield (2020–2023)
  'swsh1',   // Sword & Shield
  'swsh2',   // Rebel Clash
  'swsh3',   // Darkness Ablaze
  'swsh3.5', // Champion's Path
  'swsh4',   // Vivid Voltage
  'swsh4.5', // Shining Fates
  'swsh5',   // Battle Styles
  'swsh6',   // Chilling Reign
  'swsh7',   // Evolving Skies
  'cel25',   // Celebrations
  'swsh8',   // Fusion Strike
  'swsh9',   // Brilliant Stars
  'swsh10',  // Astral Radiance
  'swsh10.5', // Pokémon GO
  'swsh11',  // Lost Origin
  'swsh12',  // Silver Tempest
  'swsh12.5', // Crown Zenith
  // Scarlet & Violet (2023–present)
  'sv01',    // Scarlet & Violet
  'sv02',    // Paldea Evolved
  'sv03',    // Obsidian Flames
  'sv03.5',  // 151
  'sv04',    // Paradox Rift
  'sv04.5',  // Paldean Fates
  'sv05',    // Temporal Forces
  'sv06',    // Twilight Masquerade
  'sv06.5',  // Shrouded Fable
  'sv07',    // Stellar Crown
  'sv08',    // Surging Sparks
  'sv08.5',  // Prismatic Evolutions
  'sv09',    // Journey Together
  'sv10',    // Destined Rivals
  'sv10.5b', // Black Bolt
  'sv10.5w', // White Flare
];

// Map TCGdex rarity strings to our enum
function mapRarity(apiRarity: string | undefined): Rarity {
  if (!apiRarity || apiRarity === 'None') return Rarity.Common;

  const mapping: Record<string, Rarity> = {
    Common: Rarity.Common,
    Uncommon: Rarity.Uncommon,
    Rare: Rarity.Rare,
    'Double rare': Rarity.DoubleRare,
    'Illustration rare': Rarity.IllustrationRare,
    'Ultra Rare': Rarity.UltraRare,
    'Special illustration rare': Rarity.SpecialIllustrationRare,
    'Hyper rare': Rarity.HyperRare,
    // Holo rares
    'Holo Rare': Rarity.Rare,
    'Rare Holo': Rarity.Rare,
    // V/VMAX/VSTAR era
    'Holo Rare V': Rarity.DoubleRare,
    'Holo Rare VMAX': Rarity.DoubleRare,
    'Holo Rare VSTAR': Rarity.DoubleRare,
    // Older era ultra rares
    'Rare Holo LV.X': Rarity.UltraRare,
    'Rare PRIME': Rarity.UltraRare,
    'LEGEND': Rarity.UltraRare,
    // SWSH era special rarities
    'Amazing Rare': Rarity.UltraRare,
    'Radiant Rare': Rarity.UltraRare,
    // Secret/hyper tier
    'Secret Rare': Rarity.HyperRare,
    'Shiny Ultra Rare': Rarity.HyperRare,
    'Crown': Rarity.HyperRare,
    'Mega Hyper Rare': Rarity.HyperRare,
    // Shiny vault
    'Shiny rare': Rarity.UltraRare,
    'Shiny rare V': Rarity.UltraRare,
    'Shiny rare VMAX': Rarity.UltraRare,
    // Other
    'ACE SPEC Rare': Rarity.UltraRare,
    'Full Art Trainer': Rarity.UltraRare,
    'Classic Collection': Rarity.Rare,
    'Black White Rare': Rarity.Rare,
  };

  const mapped = mapping[apiRarity];
  if (!mapped) {
    console.warn(`  Unknown rarity: "${apiRarity}" — defaulting to Rare`);
    return Rarity.Rare;
  }
  return mapped;
}

// Extract the best available price and compute a trend direction
function extractPricing(pricing: TCGdexPricing | undefined): {
  price: number | null;
  priceTrend: 'up' | 'down' | 'stable' | null;
  priceSource: 'tcgplayer' | 'cardmarket' | null;
} {
  if (!pricing) return { price: null, priceTrend: null, priceSource: null };

  // Prefer TCGPlayer market price (USD), fall back to Cardmarket avg
  let price: number | null = null;
  let priceSource: 'tcgplayer' | 'cardmarket' | null = null;

  if (pricing.tcgplayer) {
    const tp = pricing.tcgplayer;
    price =
      tp.holofoil?.marketPrice ??
      tp.normal?.marketPrice ??
      tp['reverse-holofoil']?.marketPrice ??
      tp['1stEditionHolofoil']?.marketPrice ??
      tp['1stEditionNormal']?.marketPrice ??
      null;
    if (price != null) priceSource = 'tcgplayer';
  }

  if (price == null && pricing.cardmarket) {
    price = pricing.cardmarket.avg ?? null;
    if (price != null) priceSource = 'cardmarket';
  }

  // Determine trend from cardmarket short-term vs long-term averages
  let priceTrend: 'up' | 'down' | 'stable' | null = null;
  if (pricing.cardmarket) {
    const { avg7, avg30 } = pricing.cardmarket;
    if (avg7 != null && avg30 != null && avg30 > 0) {
      const change = (avg7 - avg30) / avg30;
      if (change > 0.1) priceTrend = 'up';
      else if (change < -0.1) priceTrend = 'down';
      else priceTrend = 'stable';
    }
  }

  return { price, priceTrend, priceSource };
}

// Sets that received 1st Edition print runs
const FIRST_EDITION_SET_IDS = [
  'base1', 'base2', 'base3', 'base5',
  'gym1', 'gym2',
  'neo1', 'neo2', 'neo3', 'neo4',
];

// Only Base Set had the Shadowless variant
const SHADOWLESS_SET_IDS = ['base1'];

// Edition price multipliers
const EDITION_PRICE_MULTIPLIERS: Record<Edition, number> = {
  '1st-edition': 5.0,
  'shadowless': 3.0,
  'unlimited': 1.0,
};

// Era-based real-world pack pricing (USD)
function getPackPriceUsd(setId: string): number {
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
  return 4.49; // default for unknown sets
}

// Fallback estimates for cards without API pricing
const RARITY_ESTIMATE_PRICES: Record<string, number> = {
  [Rarity.Common]: 0.10,
  [Rarity.Uncommon]: 0.25,
  [Rarity.Rare]: 1.50,
  [Rarity.DoubleRare]: 5.0,
  [Rarity.IllustrationRare]: 8.0,
  [Rarity.UltraRare]: 15.0,
  [Rarity.SpecialIllustrationRare]: 30.0,
  [Rarity.HyperRare]: 60.0,
};

async function syncSet(setId: string) {
  console.log(`\nSyncing set: ${setId}...`);

  const cards = await fetchCardsBySet(setId);
  console.log(`  Found ${cards.length} cards`);

  let inserted = 0;
  let errors = 0;

  for (const card of cards) {
    const rarity = mapRarity(card.rarity);

    // Build subtypes from stage + suffix (e.g. ["Stage 1", "V"])
    const subtypes: string[] = [];
    if (card.stage) subtypes.push(card.stage);
    if (card.suffix) subtypes.push(card.suffix);

    // Extract best available price from TCGdex pricing
    const { price, priceTrend, priceSource } = extractPricing(card.pricing);

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
        price,
        price_trend: priceTrend,
        price_source: priceSource,
      },
      { onConflict: 'tcg_id' }
    );

    if (error) {
      console.error(`  Error inserting ${card.name}:`, error.message);
      errors++;
    } else {
      inserted++;
    }
  }

  console.log(`  Inserted/updated: ${inserted}, Errors: ${errors}`);

  // Create pack entry/entries for this set
  if (cards.length > 0) {
    const set = cards[0].set;
    const basePrice = getPackPriceUsd(set.id);
    const imageUrl = set.logo ? `${set.logo}.png` : '';

    if (FIRST_EDITION_SET_IDS.includes(set.id)) {
      // Vintage set: create edition variant packs
      const editions: Edition[] = ['1st-edition', 'unlimited'];
      if (SHADOWLESS_SET_IDS.includes(set.id)) {
        editions.push('shadowless');
      }

      for (const edition of editions) {
        const editionLabel =
          edition === '1st-edition' ? '1st Edition' :
          edition === 'shadowless' ? 'Shadowless' : 'Unlimited';
        const price = parseFloat((basePrice * EDITION_PRICE_MULTIPLIERS[edition]).toFixed(2));

        // Use select-then-upsert since composite unique index uses partial indexes
        const { data: existing } = await supabase
          .from('packs')
          .select('id')
          .eq('set_id', set.id)
          .eq('edition', edition)
          .is('booster_id', null)
          .maybeSingle();

        const packData = {
          name: `${set.name} — ${editionLabel}`,
          description: `${editionLabel} booster pack from the ${set.name} set`,
          price_usd: price,
          image_url: imageUrl,
          cards_per_pack: 10,
          set_id: set.id,
          set_name: set.name,
          edition,
          available: true,
        };

        let error;
        if (existing) {
          ({ error } = await supabase.from('packs').update(packData).eq('id', existing.id));
        } else {
          ({ error } = await supabase.from('packs').insert(packData));
        }

        if (error) {
          console.error(`  Error creating ${editionLabel} pack for ${set.name}:`, error.message);
        } else {
          console.log(`  Pack created: ${set.name} — ${editionLabel} ($${price})`);
        }
      }
    } else {
      // Modern set: single pack, no edition
      const { error } = await supabase.from('packs').upsert(
        {
          name: set.name,
          description: `Booster pack from the ${set.name} set`,
          price_usd: basePrice,
          image_url: imageUrl,
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
}

async function main() {
  console.log('Pokemon TCG Card Sync (via TCGdex)');
  console.log('===================================');

  // Show available sets
  const sets = await fetchSets();
  console.log(`\nAvailable sets: ${sets.length}`);
  console.log(
    'Target sets:',
    TARGET_SET_IDS.map(
      (id) => `${id} (${sets.find((s) => s.id === id)?.name || 'unknown'})`
    ).join(', ')
  );

  const failedSets: string[] = [];
  for (const setId of TARGET_SET_IDS) {
    try {
      await syncSet(setId);
    } catch (err) {
      console.error(`  FAILED to sync ${setId}:`, (err as Error).message);
      failedSets.push(setId);
      // Wait a bit before continuing after a failure
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  if (failedSets.length > 0) {
    console.log(`\nRetrying ${failedSets.length} failed sets...`);
    for (const setId of failedSets) {
      try {
        await new Promise((r) => setTimeout(r, 2000));
        await syncSet(setId);
      } catch (err) {
        console.error(`  RETRY FAILED for ${setId}:`, (err as Error).message);
      }
    }
  }

  // Fallback pass: assign estimate prices to cards missing API pricing
  console.log('\nApplying fallback prices for cards without API data...');
  for (const [rarity, estimatePrice] of Object.entries(RARITY_ESTIMATE_PRICES)) {
    const { count, error } = await supabase
      .from('cards')
      .update({
        price: estimatePrice,
        price_source: 'estimate',
        price_trend: 'stable',
      })
      .is('price', null)
      .eq('rarity', rarity);

    if (error) {
      console.error(`  Error updating ${rarity} fallback:`, error.message);
    } else {
      console.log(`  ${rarity}: ${count ?? 0} cards set to $${estimatePrice.toFixed(2)}`);
    }
  }

  // Detailed pricing pass: write per-variant pricing to card_pricing_details
  console.log('\nSyncing detailed per-variant pricing...');
  const { data: allCards } = await supabase
    .from('cards')
    .select('id, tcg_id')
    .not('price_source', 'eq', 'estimate')
    .not('price', 'is', null);

  if (allCards && allCards.length > 0) {
    let detailCount = 0;
    const detailBatchSize = 5;

    for (let i = 0; i < allCards.length; i += detailBatchSize) {
      const batch = allCards.slice(i, i + detailBatchSize);
      const detailResults = await Promise.all(
        batch.map(async (card) => {
          try {
            const tcgCard = await fetchCard(card.tcg_id);
            return { cardId: card.id, pricing: tcgCard.pricing };
          } catch {
            return { cardId: card.id, pricing: null };
          }
        })
      );

      for (const { cardId, pricing } of detailResults) {
        if (!pricing) continue;

        const tp = pricing.tcgplayer as Record<string, Record<string, number | null>> | undefined;
        const cm = pricing.cardmarket as Record<string, number | null> | undefined;

        // Map variants from tcgplayer
        const variants = ['normal', 'holofoil', 'reverse-holofoil', '1stEditionHolofoil', '1stEditionNormal']
          .filter((v) => tp?.[v]);

        for (const variant of variants) {
          const vp = tp?.[variant];
          const row = {
            card_id: cardId,
            variant,
            tcgplayer_low: vp?.lowPrice ?? null,
            tcgplayer_mid: vp?.midPrice ?? null,
            tcgplayer_high: vp?.highPrice ?? null,
            tcgplayer_market: vp?.marketPrice ?? null,
            tcgplayer_direct_low: vp?.directLowPrice ?? null,
            cardmarket_avg: cm?.avg ?? null,
            cardmarket_low: cm?.low ?? null,
            cardmarket_trend: cm?.trend ?? null,
            cardmarket_avg7: cm?.avg7 ?? null,
            cardmarket_avg30: cm?.avg30 ?? null,
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('card_pricing_details')
            .upsert(row, { onConflict: 'card_id,variant' });

          if (!error) detailCount++;
        }

        // If no tcgplayer variants but has cardmarket data, insert as 'normal'
        if (variants.length === 0 && cm) {
          const row = {
            card_id: cardId,
            variant: 'normal',
            tcgplayer_low: null,
            tcgplayer_mid: null,
            tcgplayer_high: null,
            tcgplayer_market: null,
            tcgplayer_direct_low: null,
            cardmarket_avg: cm.avg ?? null,
            cardmarket_low: cm.low ?? null,
            cardmarket_trend: cm.trend ?? null,
            cardmarket_avg7: cm.avg7 ?? null,
            cardmarket_avg30: cm.avg30 ?? null,
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('card_pricing_details')
            .upsert(row, { onConflict: 'card_id,variant' });

          if (!error) detailCount++;
        }
      }

      if (i + detailBatchSize < allCards.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    console.log(`  Synced ${detailCount} pricing detail rows`);
  }

  console.log('\nSync complete!');
}

main().catch(console.error);
