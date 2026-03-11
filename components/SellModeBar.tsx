'use client';

import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart } from 'lucide-react';

export function SellModeBar({
  selectedCount,
  totalSellValue,
  onSell,
  onCancel,
}: {
  selectedCount: number;
  totalSellValue: number;
  onSell: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
            <ShoppingCart className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {selectedCount} card{selectedCount !== 1 ? 's' : ''} selected
            </p>
            <p className="text-xs text-muted">
              Sell value: <span className="font-semibold text-accent tabular-nums">${totalSellValue.toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={onSell}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <DollarSign className="h-4 w-4" />
            Sell for ${totalSellValue.toFixed(2)}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
