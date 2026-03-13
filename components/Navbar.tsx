'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import { Package, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  // Lock body scroll when sidebar open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { href: '/browse', label: 'Browse', match: (p: string) => p.startsWith('/browse') },
    { href: '/community', label: 'Community', match: (p: string) => p.startsWith('/community') },
    { href: '/stats', label: 'Stats', match: (p: string) => p.startsWith('/stats') },
    ...(user
      ? [{ href: '/collection', label: 'Collection', match: (p: string) => p === '/collection' }]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface sm:bg-surface/85 sm:backdrop-blur-xl">
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

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-elevated text-foreground transition-colors hover:bg-border sm:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Desktop nav links — hidden on mobile */}
          <div className="hidden items-center gap-8 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => prefetchRoute(link.href)}
                className={cn(
                  'text-sm transition-colors',
                  link.match(pathname)
                    ? 'text-foreground font-medium'
                    : 'text-muted hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user ? (
            <>
              {/* Unopened packs badge */}
              {unopenedCount > 0 && (
                <Link
                  href="/collection"
                  className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors hover:opacity-80 sm:px-2.5 sm:py-1 sm:text-sm"
                  style={{
                    backgroundColor: 'rgba(234,179,8,0.12)',
                    color: '#eab308',
                    border: '1px solid rgba(234,179,8,0.2)',
                  }}
                >
                  <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="tabular-nums">{unopenedCount}</span>
                </Link>
              )}

              {/* Balance display */}
              {balance !== null && (
                <div
                  className="flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums sm:px-3 sm:py-1 sm:text-sm"
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

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-14 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-14 bottom-0 z-50 w-64 border-r border-border bg-surface shadow-warm-lg sm:hidden"
            >
              <div className="flex flex-col gap-1 p-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                      link.match(pathname)
                        ? 'bg-accent-soft text-foreground'
                        : 'text-muted hover:bg-surface-elevated hover:text-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
