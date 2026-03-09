const BASE_URL = 'https://api.pokemontcg.io/v2';

const headers: Record<string, string> = {};
if (process.env.POKEMON_TCG_API_KEY) {
  headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY;
}

interface TCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  rarity?: string;
  set: {
    id: string;
    name: string;
    images: { symbol: string; logo: string };
  };
  images: {
    small: string;
    large: string;
  };
}

interface TCGSet {
  id: string;
  name: string;
  series: string;
  total: number;
  releaseDate: string;
  images: { symbol: string; logo: string };
}

export async function fetchSets(): Promise<TCGSet[]> {
  const res = await fetch(`${BASE_URL}/sets?orderBy=-releaseDate`, {
    headers,
  });
  if (!res.ok) throw new Error(`Failed to fetch sets: ${res.status}`);
  const data = await res.json();
  return data.data;
}

export async function fetchCardsBySet(setId: string): Promise<TCGCard[]> {
  const allCards: TCGCard[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const res = await fetch(
      `${BASE_URL}/cards?q=set.id:${setId}&pageSize=${pageSize}&page=${page}`,
      { headers }
    );
    if (!res.ok) throw new Error(`Failed to fetch cards: ${res.status}`);
    const data = await res.json();
    allCards.push(...data.data);

    if (data.data.length < pageSize) break;
    page++;
  }

  return allCards;
}

export async function fetchCard(cardId: string): Promise<TCGCard> {
  const res = await fetch(`${BASE_URL}/cards/${cardId}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch card: ${res.status}`);
  const data = await res.json();
  return data.data;
}

export type { TCGCard, TCGSet };
