'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { getAvatar } from '@/lib/avatars';
import { RARITY_CONFIG } from '@/lib/constants';
import type { LeaderboardEntry, PokedexLeaderboardEntry, Rarity } from '@/types';

const MEDAL_STYLES: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-500', border: 'border-amber-200 dark:border-amber-800' },
  2: { bg: 'bg-gray-50 dark:bg-gray-900/30', text: 'text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
  3: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-amber-700', border: 'border-orange-200 dark:border-orange-800' },
};

type LeaderboardProps =
  | {
      variant?: 'value';
      entries: LeaderboardEntry[];
      currentUserId: string | null;
    }
  | {
      variant: 'pokedex';
      entries: PokedexLeaderboardEntry[];
      currentUserId: string | null;
    };

export function Leaderboard(props: LeaderboardProps) {
  const { entries, currentUserId, variant = 'value' } = props;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-16">
        <Trophy className="mb-3 h-10 w-10 text-muted" />
        <p className="text-sm font-medium text-foreground">No collectors yet</p>
        <p className="mt-1 text-xs text-muted">Be the first to start your collection!</p>
      </div>
    );
  }

  const getPodiumValue = (entry: LeaderboardEntry | PokedexLeaderboardEntry) => {
    if (variant === 'pokedex') {
      return `${(entry as PokedexLeaderboardEntry).unique_cards} cards`;
    }
    const val = (entry as LeaderboardEntry).collection_value;
    return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPodiumSub = (entry: LeaderboardEntry | PokedexLeaderboardEntry) => {
    if (variant === 'pokedex') {
      return `${(entry as PokedexLeaderboardEntry).sets_started} sets`;
    }
    return `${(entry as LeaderboardEntry).unique_cards} unique cards`;
  };

  return (
    <div className="space-y-3">
      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[entries[1], entries[0], entries[2]].map((entry, i) => {
            const rank = [2, 1, 3][i];
            const medal = MEDAL_STYLES[rank];
            const avatar = getAvatar(entry.avatar_id);
            return (
              <Link key={entry.user_id} href={`/profile/${entry.user_id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className={`flex flex-col items-center rounded-2xl border ${medal.border} ${medal.bg} p-4 transition-shadow hover:shadow-warm-md ${
                    rank === 1 ? 'pt-3' : 'mt-4'
                  }`}
                >
                  <span className={`mb-2 text-lg font-bold ${medal.text}`}>#{rank}</span>
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${avatar.bg}`}>
                    {avatar.emoji}
                  </span>
                  <span className="mt-2 max-w-full truncate text-sm font-semibold text-foreground">
                    {entry.display_name || 'Trainer'}
                  </span>
                  <span className="mt-1 text-lg font-bold text-accent">
                    {getPodiumValue(entry)}
                  </span>
                  <span className="text-[10px] text-muted">{getPodiumSub(entry)}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted">Rank</th>
                <th className="px-4 py-3 text-xs font-medium text-muted">Trainer</th>
                {variant === 'value' ? (
                  <>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted">Value</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted">Cards</th>
                    <th className="hidden px-4 py-3 text-xs font-medium text-muted md:table-cell">Best Card</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted">Unique Cards</th>
                    <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted md:table-cell">Sets</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const avatar = getAvatar(entry.avatar_id);
                const isCurrentUser = entry.user_id === currentUserId;

                return (
                  <motion.tr
                    key={entry.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`border-b border-border/50 transition-colors last:border-0 hover:bg-surface-elevated ${
                      isCurrentUser ? 'bg-accent-soft' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${entry.rank <= 3 ? MEDAL_STYLES[entry.rank]?.text ?? 'text-muted' : 'text-muted'}`}>
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/profile/${entry.user_id}`}
                        className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
                      >
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${avatar.bg}`}>
                          {avatar.emoji}
                        </span>
                        <span className="font-medium text-foreground">
                          {entry.display_name || 'Trainer'}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-[10px] text-accent">(you)</span>
                          )}
                        </span>
                      </Link>
                    </td>
                    {variant === 'value' ? (
                      <>
                        <td className="px-4 py-3 text-right">
                          <span className="tabular-nums font-semibold text-foreground">
                            ${Number((entry as LeaderboardEntry).collection_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="tabular-nums text-muted">{(entry as LeaderboardEntry).unique_cards}</span>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          {(entry as LeaderboardEntry).rarest_card && (
                            <div className="flex items-center gap-2">
                              <img
                                src={(entry as LeaderboardEntry).rarest_card!.image_url}
                                alt={(entry as LeaderboardEntry).rarest_card!.name}
                                className="h-8 w-6 rounded object-cover"
                              />
                              <div>
                                <p className="max-w-[140px] truncate text-xs font-medium text-foreground">
                                  {(entry as LeaderboardEntry).rarest_card!.name}
                                </p>
                                <p
                                  className="text-[10px] font-medium"
                                  style={{ color: RARITY_CONFIG[(entry as LeaderboardEntry).rarest_card!.rarity as Rarity]?.color }}
                                >
                                  {RARITY_CONFIG[(entry as LeaderboardEntry).rarest_card!.rarity as Rarity]?.label ?? (entry as LeaderboardEntry).rarest_card!.rarity}
                                </p>
                              </div>
                            </div>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-right">
                          <span className="tabular-nums font-semibold text-foreground">
                            {(entry as PokedexLeaderboardEntry).unique_cards}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-right md:table-cell">
                          <span className="tabular-nums text-muted">
                            {(entry as PokedexLeaderboardEntry).sets_started}
                          </span>
                        </td>
                      </>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
