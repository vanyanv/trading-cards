import { Rarity, type Card, type PulledCard } from '@/types';
import { rollHitSlotRarity, rollReverseHoloRarity } from './rarity';

interface SupabaseQueryClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): Promise<{ data: Card[] | null; error: { message: string } | null }>;
    };
  };
}

/**
 * Open a pack: selects 10 cards matching real Pokemon TCG slot structure.
 *
 * Slots 1-4: Common
 * Slots 5-7: Uncommon
 * Slot 8: Reverse Holo (any rarity with foil treatment)
 * Slot 9: Rare (guaranteed)
 * Slot 10: Hit slot (rare or higher, weighted by real pull rates)
 */
export async function openPack(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  setId: string
): Promise<PulledCard[]> {
  // Fetch all cards for this set grouped by rarity
  const { data: allCards, error } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId);

  if (error) throw new Error(`Failed to fetch cards: ${error.message}`);
  if (!allCards || allCards.length === 0)
    throw new Error('No cards found for this set');

  const cardsByRarity = new Map<Rarity, Card[]>();
  for (const card of allCards) {
    const existing = cardsByRarity.get(card.rarity as Rarity) || [];
    existing.push(card as Card);
    cardsByRarity.set(card.rarity as Rarity, existing);
  }

  const pulled: PulledCard[] = [];

  // Helper to pick a random card of a given rarity, with fallback
  const pickCard = (rarity: Rarity): Card => {
    const pool = cardsByRarity.get(rarity);
    if (pool && pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    // Fallback: try lower rarities
    const fallbackOrder = [
      Rarity.Common,
      Rarity.Uncommon,
      Rarity.Rare,
      Rarity.DoubleRare,
    ];
    for (const fb of fallbackOrder) {
      const fbPool = cardsByRarity.get(fb);
      if (fbPool && fbPool.length > 0) {
        return fbPool[Math.floor(Math.random() * fbPool.length)];
      }
    }
    // Last resort: any card
    return allCards[Math.floor(Math.random() * allCards.length)] as Card;
  };

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

  return pulled;
}
