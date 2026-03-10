'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import { Coins, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [coins, setCoins] = useState<number | null>(null);
  const [displayCoins, setDisplayCoins] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!supabase) return;

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('user_balances')
          .select('coins')
          .eq('user_id', user.id)
          .single();
        if (data) setCoins(data.coins);
      }
    };

    getUser();

    const {
      data: { subscription },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (!session?.user) setCoins(null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (coins === null) return;
    const diff = coins - displayCoins;
    if (diff === 0) return;

    const step = Math.ceil(Math.abs(diff) / 15);
    const interval = setInterval(() => {
      setDisplayCoins((prev) => {
        const next = diff > 0 ? prev + step : prev - step;
        if ((diff > 0 && next >= coins) || (diff < 0 && next <= coins)) {
          clearInterval(interval);
          return coins;
        }
        return next;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [coins, displayCoins]);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            PokePacks
          </Link>

          {user && (
            <Link
              href="/collection"
              className={cn(
                'text-sm transition-colors',
                pathname === '/collection'
                  ? 'text-foreground font-medium'
                  : 'text-muted hover:text-foreground'
              )}
            >
              Collection
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {coins !== null && (
                <div className="flex items-center gap-1.5 text-sm text-muted">
                  <Coins className="h-3.5 w-3.5" />
                  <span className="tabular-nums font-medium text-foreground">{displayCoins}</span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-80 active:opacity-70"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
