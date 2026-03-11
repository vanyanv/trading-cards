import { Rarity, type Card, type PulledCard } from '@/types';
import { rollHitSlotRarity, rollReverseHoloRarity, rollTCGPHitSlotRarity } from './rarity';

/**
 * Open a pack: selects cards matching real Pokemon TCG slot structure.
 *
 * Regular TCG (10 cards):
 *   Slots 1-4: Common
 *   Slots 5-7: Uncommon
 *   Slot 8: Reverse Holo (any rarity with foil treatment)
 *   Slot 9: Rare (guaranteed)
 *   Slot 10: Hit slot (rare or higher, weighted by real pull rates)
 *
 * TCG Pocket (5 cards):
 *   Slots 1-3: One Diamond (common)
 *   Slot 4: Two Diamond (uncommon)
 *   Slot 5: Hit slot (Three Diamond or higher)
 */
export async function openPack(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  setId: string,
  boosterId?: string | null,
  cardsPerPack: number = 10,
  edition?: string | null
): Promise<PulledCard[]> {
  // Fetch all cards for this set
  let query = supabase.from('cards').select('*').eq('set_id', setId);
  const { data: setCards, error } = await query;

  if (error) throw new Error(`Failed to fetch cards: ${error.message}`);
  if (!setCards || setCards.length === 0)
    throw new Error('No cards found for this set');

  // Filter to booster-specific cards if applicable
  let allCards = setCards as Card[];
  if (boosterId) {
    const boosterCards = allCards.filter(
      (c) => c.booster_ids && c.booster_ids.includes(boosterId)
    );
    if (boosterCards.length > 0) {
      allCards = boosterCards;
    }
  }

  const cardsByRarity = new Map<Rarity, Card[]>();
  for (const card of allCards) {
    const existing = cardsByRarity.get(card.rarity as Rarity) || [];
    existing.push(card);
    cardsByRarity.set(card.rarity as Rarity, existing);
  }

  const isTCGP = cardsPerPack === 5;

  // Helper to pick a random card of a given rarity, with fallback
  const pickCard = (rarity: Rarity): Card => {
    const pool = cardsByRarity.get(rarity);
    if (pool && pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    // Fallback: try lower rarities
    const fallbackOrder = isTCGP
      ? [Rarity.OneDiamond, Rarity.TwoDiamond, Rarity.ThreeDiamond]
      : [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.DoubleRare];
    for (const fb of fallbackOrder) {
      const fbPool = cardsByRarity.get(fb);
      if (fbPool && fbPool.length > 0) {
        return fbPool[Math.floor(Math.random() * fbPool.length)];
      }
    }
    // Last resort: any card
    return allCards[Math.floor(Math.random() * allCards.length)];
  };

  const pulled: PulledCard[] = [];

  if (isTCGP) {
    // TCG Pocket: 5 cards
    // Slots 1-3: One Diamond
    for (let i = 1; i <= 3; i++) {
      const card = pickCard(Rarity.OneDiamond);
      pulled.push({ ...card, is_reverse_holo: false, slot_number: i });
    }

    // Slot 4: Two Diamond
    const uncommonCard = pickCard(Rarity.TwoDiamond);
    pulled.push({ ...uncommonCard, is_reverse_holo: false, slot_number: 4 });

    // Slot 5: Hit slot
    const hitRarity = rollTCGPHitSlotRarity();
    const hitCard = pickCard(hitRarity);
    pulled.push({ ...hitCard, is_reverse_holo: false, slot_number: 5 });
  } else {
    // Regular TCG: 10 cards
    // Slots 1-4: Common
    for (let i = 1; i <= 4; i++) {
      const card = pickCard(Rarity.Common);
      pulled.push({ ...card, is_reverse_holo: false, slot_number: i });
    }

    // Slots 5-7: Uncommon
    for (let i = 5; i <= 7; i++) {
      const card = pickCard(Rarity.Uncommon);
      pulled.push({ ...card, is_reverse_holo: false, slot_number: i });
    }

    // Slot 8: Reverse Holo
    const reverseRarity = rollReverseHoloRarity();
    const reverseCard = pickCard(reverseRarity);
    pulled.push({ ...reverseCard, is_reverse_holo: true, slot_number: 8 });

    // Slot 9: Guaranteed Rare
    const rareCard = pickCard(Rarity.Rare);
    pulled.push({ ...rareCard, is_reverse_holo: false, slot_number: 9 });

    // Slot 10: Hit slot
    const hitRarity = rollHitSlotRarity();
    const hitCard = pickCard(hitRarity);
    pulled.push({ ...hitCard, is_reverse_holo: false, slot_number: 10 });
  }

  // Tag pulled cards with edition if applicable
  if (edition) {
    for (const card of pulled) {
      card.edition = edition as PulledCard['edition'];
    }
  }

  return pulled;
}
