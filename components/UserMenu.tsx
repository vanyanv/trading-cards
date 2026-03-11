'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, Library, User } from 'lucide-react';
import { getAvatar } from '@/lib/avatars';
import type { SupabaseClient } from '@supabase/supabase-js';

interface UserMenuProps {
  supabase: SupabaseClient;
  userId: string;
}

export function UserMenu({ supabase, userId }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<string>('pokeball');
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('display_name, avatar_id')
        .eq('user_id', userId)
        .single();

      if (data) {
        setDisplayName(data.display_name);
        setAvatarId(data.avatar_id ?? 'pokeball');
      }
    };
    fetchProfile();

    // Listen for profile updates from settings page
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.display_name) setDisplayName(detail.display_name);
      if (detail?.avatar_id) setAvatarId(detail.avatar_id);
    };
    window.addEventListener('profile-update', handler);
    return () => window.removeEventListener('profile-update', handler);
  }, [supabase, userId]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const avatar = getAvatar(avatarId);

  const handleSignOut = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-border px-2 py-1 transition-all hover:border-accent/30 hover:shadow-warm-sm"
      >
        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${avatar.bg}`}>
          {avatar.emoji}
        </span>
        <span className="max-w-[80px] truncate text-xs font-medium text-foreground hidden sm:block">
          {displayName || 'Trainer'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-warm-lg z-50"
          >
            <div className="border-b border-border px-3 py-2.5">
              <p className="text-xs font-semibold text-foreground truncate">{displayName || 'Trainer'}</p>
              <p className="text-[10px] text-muted mt-0.5">Pokemon Trainer</p>
            </div>
            <div className="py-1">
              <Link
                href={`/profile/${userId}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
              >
                <User className="h-3.5 w-3.5" />
                My Profile
              </Link>
              <Link
                href="/collection"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
              >
                <Library className="h-3.5 w-3.5" />
                My Collection
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
            </div>
            <div className="border-t border-border py-1">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
