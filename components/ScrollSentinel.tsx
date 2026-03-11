'use client';

import { Loader2 } from 'lucide-react';

interface ScrollSentinelProps {
  sentinelRef: (node: HTMLElement | null) => void;
  hasMore: boolean;
}

export function ScrollSentinel({ sentinelRef, hasMore }: ScrollSentinelProps) {
  return (
    <div ref={sentinelRef} className="flex items-center justify-center h-16">
      {hasMore && (
        <Loader2 className="w-5 h-5 text-muted animate-spin" />
      )}
    </div>
  );
}
