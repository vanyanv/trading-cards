import { NextResponse } from 'next/server';
import type { CardDetailData } from '@/types';
import { tcgdex } from '@/lib/pokemon-tcg-api';
import type { TCGCard } from '@/lib/pokemon-tcg-api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tcgId: string }> }
) {
  const { tcgId } = await params;

  try {
    // SDK has built-in caching (1-hour TTL configured in pokemon-tcg-api.ts)
    const card = await tcgdex.card.get(tcgId) as TCGCard | null;

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found on TCGdex' },
        { status: 404 }
      );
    }

    // SDK types are slightly looser than our app types (optional vs required fields)
    // but the underlying API data is identical, so this cast is safe.
    const data = {
      pricing: card.pricing ?? null,
      attacks: card.attacks ?? null,
      abilities: card.abilities ?? null,
      weaknesses: card.weaknesses ?? null,
      resistances: card.resistances ?? null,
      retreat: card.retreat ?? null,
      illustrator: card.illustrator ?? null,
      evolveFrom: card.evolveFrom ?? null,
      stage: card.stage ?? null,
    } as CardDetailData;

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch card details' },
      { status: 500 }
    );
  }
}
