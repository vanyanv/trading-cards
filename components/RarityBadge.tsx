'use client';

import { Rarity } from '@/types';
import { RARITY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/cn';

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
        'inline-flex items-center gap-1.5 text-xs font-medium',
        className
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <span style={{ color: config.color }}>{config.label}</span>
    </span>
  );
}
