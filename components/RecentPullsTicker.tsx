'use client';

import { motion } from 'framer-motion';
import { RarityBadge } from './RarityBadge';
import { getAvatar } from '@/lib/avatars';
import type { Card, Rarity } from '@/types';
import Link from 'next/link';

interface RecentPull {
  id: string;
  obtained_at: string;
  card: Pick<Card, 'id' | 'name' | 'image_url' | 'rarity' | 'set_name'>;
  profile?: { display_name: string | null; avatar_id: string | null } | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentPullsTicker({ pulls }: { pulls: RecentPull[] }) {
  if (pulls.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="pb-20"
      >
        <div className="flex items-center gap-2.5 mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <h2 className="font-heading text-lg font-bold tracking-tight">Recent Rare Pulls</h2>
        </div>
        <div className="rounded-2xl border border-dashed border-border py-10 text-center">
          <p className="text-sm text-muted">Be the first to pull a rare card!</p>
        </div>
      </motion.section>
    );
  }

  // Duplicate items for seamless loop
  const items = [...pulls, ...pulls];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="pb-20"
    >
      <div className="flex items-center gap-2.5 mb-6">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <h2 className="font-heading text-lg font-bold tracking-tight">Recent Rare Pulls</h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface py-4">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface to-transparent" />

        <div className="marquee-track flex gap-6 px-4">
          {items.map((pull, i) => {
            const avatar = getAvatar(pull.profile?.avatar_id);
            const name = pull.profile?.display_name || 'Trainer';

            return (
              <Link
                key={`${pull.id}-${i}`}
                href={`/card/${pull.card.id}`}
                className="flex shrink-0 items-center gap-3 rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 transition-colors hover:border-accent/30"
              >
                {/* User avatar */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${avatar.bg}`}>
                    {avatar.emoji}
                  </span>
                  <span className="text-[9px] font-medium text-muted-dim max-w-12 truncate">
                    {name}
                  </span>
                </div>

                <img
                  src={pull.card.image_url}
                  alt={pull.card.name}
                  width={48}
                  height={64}
                  className="h-16 w-12 rounded-md object-contain"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground max-w-30">
                    {pull.card.name}
                  </p>
                  <RarityBadge rarity={pull.card.rarity as Rarity} />
                  <p className="mt-0.5 text-[10px] text-muted-dim">{timeAgo(pull.obtained_at)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
