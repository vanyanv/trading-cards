'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import { Package } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';
import type { User } from '@supabase/supabase-js';

const formatBalance = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [unopenedCount, setUnopenedCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const prefetchedRoutes = useRef(new Set<string>());

  const prefetchRoute = useCallback((href: string) => {
    if (prefetchedRoutes.current.has(href)) return;
    prefetchedRoutes.current.add(href);
    router.prefetch(href);
  }, [router]);

  const fetchBalanceAndPacks = useCallback(async (userId: string) => {
    if (!supabase) return;
    const [balanceRes, packsRes] = await Promise.all([
      supabase
        .from('user_balances')
        .select('balance_usd')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('unopened_packs')
        .select('id', { count: 'exact', head: true })
    ]);

    if (balanceRes.data) {
      setBalance(balanceRes.data.balance_usd);
      setDisplayBalance(balanceRes.data.balance_usd);
    }
    if (packsRes.count != null) {
      setUnopenedCount(packsRes.count);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        fetchBalanceAndPacks(user.id);
      }
    };

    getUser();

    const {
      data: { subscription },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        // Fetch balance + packs immediately on login
        fetchBalanceAndPacks(newUser.id);
      } else {
        setBalance(null);
        setUnopenedCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchBalanceAndPacks]);

  // Refetch balance + packs on navigation (e.g. after leaving pack-opening page)
  useEffect(() => {
    if (user) {
      fetchBalanceAndPacks(user.id);
    }
  }, [pathname, user, fetchBalanceAndPacks]);

  // Listen for balance updates from sell/buy flows
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.balance != null) setBalance(detail.balance);
    };
    window.addEventListener('balance-update', handler);
    return () => window.removeEventListener('balance-update', handler);
  }, []);

  // Listen for unopened packs count updates
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.delta != null) {
        setUnopenedCount((prev) => Math.max(0, prev + detail.delta));
      }
    };
    window.addEventListener('unopened-packs-update', handler);
    return () => window.removeEventListener('unopened-packs-update', handler);
  }, []);

  useEffect(() => {
    if (balance === null) return;
    // Animate displayBalance toward the target balance
    const interval = setInterval(() => {
      setDisplayBalance((prev) => {
        const diff = balance - prev;
        if (Math.abs(diff) < 0.02) {
          clearInterval(interval);
          return balance;
        }
        const step = Math.max(0.01, Math.abs(diff) / 10);
        return parseFloat((diff > 0 ? prev + step : prev - step).toFixed(2));
      });
    }, 20);

    return () => clearInterval(interval);
  }, [balance]);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight text-foreground"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-[11px] font-extrabold text-background">
              P
            </span>
            <span className="hidden sm:inline">PokePacks</span>
          </Link>

          <Link
            href="/browse"
            onMouseEnter={() => prefetchRoute('/browse')}
            className={cn(
              'text-sm transition-colors',
              pathname.startsWith('/browse')
                ? 'text-foreground font-medium'
                : 'text-muted hover:text-foreground'
            )}
          >
            Browse
          </Link>

          <Link
            href="/community"
            onMouseEnter={() => prefetchRoute('/community')}
            className={cn(
              'text-sm transition-colors',
              pathname.startsWith('/community')
                ? 'text-foreground font-medium'
                : 'text-muted hover:text-foreground'
            )}
          >
            Community
          </Link>

          <Link
            href="/stats"
            onMouseEnter={() => prefetchRoute('/stats')}
            className={cn(
              'text-sm transition-colors',
              pathname.startsWith('/stats')
                ? 'text-foreground font-medium'
                : 'text-muted hover:text-foreground'
            )}
          >
            Stats
          </Link>

          {user && (
            <Link
              href="/collection"
              onMouseEnter={() => prefetchRoute('/collection')}
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

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user ? (
            <>
              {/* Unopened packs badge */}
              {unopenedCount > 0 && (
                <Link
                  href="/collection"
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: 'rgba(234,179,8,0.12)',
                    color: '#eab308',
                    border: '1px solid rgba(234,179,8,0.2)',
                  }}
                >
                  <Package className="h-3.5 w-3.5" />
                  <span className="tabular-nums">{unopenedCount}</span>
                </Link>
              )}

              {/* Balance display */}
              {balance !== null && (
                <div
                  className="flex items-center rounded-full px-3 py-1 text-sm font-semibold tabular-nums"
                  style={{
                    backgroundColor: 'rgba(34,197,94,0.1)',
                    color: '#4ade80',
                    border: '1px solid rgba(34,197,94,0.2)',
                  }}
                >
                  ${formatBalance(displayBalance)}
                </div>
              )}
              <UserMenu supabase={supabase!} userId={user.id} />
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link
                href="/login"
                className="px-1 text-xs sm:text-sm text-muted transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-foreground px-2.5 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-background transition-all hover:opacity-85 active:scale-[0.98]"
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
