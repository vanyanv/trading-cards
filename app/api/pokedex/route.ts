import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const setId = request.nextUrl.searchParams.get('set_id');

    if (setId) {
      // Fetch all cards in a set with ownership flag
      const { data, error } = await supabase.rpc('get_set_cards_with_ownership', {
        p_user_id: user.id,
        p_set_id: setId,
      });

      if (error) {
        console.error('Pokedex set cards RPC error:', error);
        return NextResponse.json({ error: 'Failed to fetch set cards' }, { status: 500 });
      }

      return NextResponse.json(data ?? []);
    }

    // Fetch set completion overview
    const { data, error } = await supabase.rpc('get_user_set_completion', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Pokedex completion RPC error:', error);
      return NextResponse.json({ error: 'Failed to fetch set completion' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
