/**
 * Sync cards from TCGdex API into Supabase.
 *
 * Usage: npx tsx --env-file=.env.local scripts/sync-cards.ts
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

async function syncSet(setId: string) {
  console.log(`\nSyncing set: ${setId}...`);

  const cards = await fetchCardsBySet(setId);
  console.log(`  Found ${cards.length} cards`);

  let inserted = 0;
  let errors = 0;

  for (const card of cards) {
    const rarity = mapRarity(card.rarity);

    const { error } = await supabase.from('cards').upsert(
      {
        name: card.name,
        image_url: `${card.image}/low.png`,
        image_url_hires: `${card.image}/high.png`,
        rarity,
        set_id: card.set.id,
        set_name: card.set.name,
        hp: card.hp ? String(card.hp) : null,
        types: card.types || [],
        subtypes: card.stage ? [card.stage] : [],
        supertype: card.category,
        tcg_id: card.id,
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

  // Create pack entry for this set
  if (cards.length > 0) {
    const set = cards[0].set;
    const { error } = await supabase.from('packs').upsert(
      {
        name: set.name,
        description: `Booster pack from the ${set.name} set`,
        price_coins: DEFAULT_PACK_PRICE,
        image_url: set.logo ? `${set.logo}.png` : '',
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

  for (const setId of TARGET_SET_IDS) {
    await syncSet(setId);
  }

  console.log('\nSync complete!');
}

main().catch(console.error);
