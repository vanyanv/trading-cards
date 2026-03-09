'use client';

import { Rarity } from '@/types';
import { RARITY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { Sparkles } from 'lucide-react';

export function RarityBadge({
  rarity,
  className,
}: {
  rarity: Rarity;
  className?: string;
}) {
  const config = RARITY_CONFIG[rarity];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.badgeClass,
        className
      )}
    >
      {rarity === Rarity.HyperRare && <Sparkles className="h-3 w-3" />}
      {config.label}
    </span>
  );
}
