'use client';

import { motion } from 'framer-motion';

interface SetProgressBarProps {
  setName: string;
  ownedCount: number;
  totalCount: number;
  compact?: boolean;
}

export function SetProgressBar({ setName, ownedCount, totalCount, compact }: SetProgressBarProps) {
  const pct = totalCount > 0 ? (ownedCount / totalCount) * 100 : 0;
  const isComplete = ownedCount === totalCount && totalCount > 0;

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <div className="flex items-center justify-between">
        <span className={`font-medium text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
          {setName}
        </span>
        <span className={`tabular-nums text-muted ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {ownedCount}/{totalCount}
          <span className="ml-1">({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div className={`w-full overflow-hidden rounded-full bg-surface-elevated ${compact ? 'h-1.5' : 'h-2.5'}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-accent'}`}
        />
      </div>
    </div>
  );
}
