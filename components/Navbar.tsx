'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import { DollarSign } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';
import type { User } from '@supabase/supabase-js';

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [displayBalance, setDisplayBalance] = useState(0);
  const pathname = usePathname();
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
          .select('balance_usd')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setBalance(data.balance_usd);
          setDisplayBalance(data.balance_usd);
        }
      }
    };

    getUser();

    const {
      data: { subscription },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (!session?.user) setBalance(null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Listen for balance updates from sell/buy flows
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.balance != null) setBalance(detail.balance);
    };
    window.addEventListener('balance-update', handler);
    return () => window.removeEventListener('balance-update', handler);
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

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {user ? (
            <>
              {balance !== null && (
                <div className="flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-sm">
                  <DollarSign className="h-3.5 w-3.5 text-accent" />
                  <span className="tabular-nums font-semibold text-accent">{displayBalance.toFixed(2)}</span>
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
