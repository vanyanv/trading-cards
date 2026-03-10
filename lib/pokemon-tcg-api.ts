const BASE_URL = 'https://api.tcgdex.net/v2/en';

interface TCGCard {
  id: string;
  name: string;
  category: string;
  stage?: string;
  hp?: number;
  types?: string[];
  rarity?: string;
  image: string;
  set: {
    id: string;
    name: string;
    logo?: string;
    symbol?: string;
    cardCount: { total: number; official: number };
  };
}

interface TCGSet {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount: { total: number; official: number };
}

export async function fetchSets(): Promise<TCGSet[]> {
  const res = await fetch(`${BASE_URL}/sets`);
  if (!res.ok) throw new Error(`Failed to fetch sets: ${res.status}`);
  return res.json();
}

export async function fetchCardsBySet(setId: string): Promise<TCGCard[]> {
  // First get the set to get the list of card IDs
  const res = await fetch(`${BASE_URL}/sets/${setId}`);
  if (!res.ok) throw new Error(`Failed to fetch set: ${res.status}`);
  const setData = await res.json();

  const cardStubs: { id: string }[] = setData.cards;
  console.log(`  Fetching ${cardStubs.length} card details...`);

  // Fetch full card details in parallel batches
  const batchSize = 20;
  const allCards: TCGCard[] = [];

  for (let i = 0; i < cardStubs.length; i += batchSize) {
    const batch = cardStubs.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((stub) => fetchCard(stub.id))
    );
    allCards.push(...results);
  }

  return allCards;
}

export async function fetchCard(cardId: string): Promise<TCGCard> {
  const res = await fetch(`${BASE_URL}/cards/${cardId}`);
  if (!res.ok) throw new Error(`Failed to fetch card ${cardId}: ${res.status}`);
  return res.json();
}

export type { TCGCard, TCGSet };
