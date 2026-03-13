import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error } = await adminClient
      .from('user_profiles')
      .select('auto_buyback_enabled')
      .eq('user_id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ auto_buyback_enabled: true });
    }

    return NextResponse.json({
      auto_buyback_enabled: profile.auto_buyback_enabled,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { auto_buyback_enabled } = body;

    if (typeof auto_buyback_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'auto_buyback_enabled must be a boolean' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await adminClient
      .from('user_profiles')
      .update({ auto_buyback_enabled })
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update preference' },
        { status: 500 }
      );
    }

    return NextResponse.json({ auto_buyback_enabled });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
