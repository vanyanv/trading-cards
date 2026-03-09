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
      .select('coins')
      .eq('user_id', user.id)
      .single();

    if (!balance || balance.coins < pack.price_coins) {
      return NextResponse.json(
        { error: 'Not enough coins' },
        { status: 400 }
      );
    }

    // Use admin client for mutations to bypass RLS for the transaction
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Deduct coins
    const { error: deductError } = await adminClient
      .from('user_balances')
      .update({
        coins: balance.coins - pack.price_coins,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (deductError) {
      return NextResponse.json(
        { error: 'Failed to deduct coins' },
        { status: 500 }
      );
    }

    // Open pack (roll cards)
    const pulledCards = await openPack(adminClient, pack.set_id);

    // Insert pulled cards into user_cards
    const userCardRows = pulledCards.map((card) => ({
      user_id: user.id,
      card_id: card.id,
      is_reverse_holo: card.is_reverse_holo,
      pack_opened_from: packId,
    }));

    const { error: insertError } = await adminClient
      .from('user_cards')
      .insert(userCardRows);

    if (insertError) {
      // Refund coins on failure
      await adminClient
        .from('user_balances')
        .update({
          coins: balance.coins,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      return NextResponse.json(
        { error: 'Failed to save cards' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      cards: pulledCards,
      newBalance: balance.coins - pack.price_coins,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
