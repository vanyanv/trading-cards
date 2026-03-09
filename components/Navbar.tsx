'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import { Coins, LogOut, Layers, Store } from 'lucide-react';
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

  // Animate coin counter
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

  const navLinks = [
    { href: '/store', label: 'Store', icon: Store },
    { href: '/collection', label: 'Collection', icon: Layers },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight"
          >
            PokéPacks
          </Link>

          {user && (
            <div className="hidden items-center gap-1 sm:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
                    pathname === link.href
                      ? 'bg-white/5 text-foreground'
                      : 'text-muted hover:text-foreground'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {coins !== null && (
                <div className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-sm font-medium">
                  <Coins className="h-4 w-4 text-rarity-rare" />
                  <span className="tabular-nums">{displayCoins}</span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-[0.97]"
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
