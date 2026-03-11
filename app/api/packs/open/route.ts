import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openPack } from '@/lib/pack-opening';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { packId } = await request.json();
    if (!packId) {
      return NextResponse.json({ error: 'Pack ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the pack
    const { data: pack, error: packError } = await supabase
      .from('packs')
      .select('*')
      .eq('id', packId)
      .single();

    if (packError || !pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }

    if (!pack.available) {
      return NextResponse.json(
        { error: 'Pack not available' },
        { status: 400 }
      );
    }

    // Check user balance
    const { data: balance } = await supabase
      .from('user_balances')
      .select('balance_usd')
      .eq('user_id', user.id)
      .single();

    const packPrice = pack.price_usd ?? 4.49;
    if (!balance || balance.balance_usd < packPrice) {
      return NextResponse.json(
        { error: 'Not enough balance' },
        { status: 400 }
      );
    }

    // Use admin client for mutations to bypass RLS for the transaction
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Deduct balance
    const newBalance = parseFloat((balance.balance_usd - packPrice).toFixed(2));
    const { error: deductError } = await adminClient
      .from('user_balances')
      .update({
        balance_usd: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (deductError) {
      return NextResponse.json(
        { error: 'Failed to deduct balance' },
        { status: 500 }
      );
    }

    // Open pack (roll cards)
    const pulledCards = await openPack(adminClient, pack.set_id, pack.booster_id, pack.cards_per_pack, pack.edition);

    // Insert pulled cards into user_cards
    const userCardRows = pulledCards.map((card) => ({
      user_id: user.id,
      card_id: card.id,
      is_reverse_holo: card.is_reverse_holo,
      edition: pack.edition || null,
      pack_opened_from: packId,
    }));

    const { error: insertError } = await adminClient
      .from('user_cards')
      .insert(userCardRows);

    if (insertError) {
      // Refund on failure
      await adminClient
        .from('user_balances')
        .update({
          balance_usd: balance.balance_usd,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      return NextResponse.json(
        { error: 'Failed to save cards' },
        { status: 500 }
      );
    }

    // Increment open count for trending (fire-and-forget)
    adminClient.rpc('increment_open_count', { pack_id: packId }).then();

    return NextResponse.json({
      cards: pulledCards,
      newBalance,
      packCost: packPrice,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
