import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('display_name, avatar_id')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      display_name: data?.display_name ?? user.email?.split('@')[0] ?? 'Trainer',
      avatar_id: data?.avatar_id ?? 'pokeball',
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const display_name = typeof body.display_name === 'string'
      ? body.display_name.trim().slice(0, 20)
      : undefined;
    const avatar_id = typeof body.avatar_id === 'string'
      ? body.avatar_id
      : undefined;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (display_name !== undefined) updates.display_name = display_name;
    if (avatar_id !== undefined) updates.avatar_id = avatar_id;

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        ...updates,
      }, { onConflict: 'user_id' });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
