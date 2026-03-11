'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, DollarSign, CheckCircle2, Loader2 } from 'lucide-react';
import { RarityBadge } from './RarityBadge';
import type { Card, Rarity } from '@/types';

interface SellItem {
  card: Card;
  quantity: number;
  sellPrice: number;
}

export function SellConfirmModal({
  items,
  totalSellValue,
  onConfirm,
  onClose,
}: {
  items: SellItem[];
  totalSellValue: number;
  onConfirm: () => Promise<{ amountReceived: number; newBalance: number }>;
  onClose: () => void;
}) {
  const [state, setState] = useState<'confirm' | 'loading' | 'success'>('confirm');
  const [amountReceived, setAmountReceived] = useState(0);

  const handleConfirm = async () => {
    setState('loading');
    try {
      const result = await onConfirm();
      setAmountReceived(result.amountReceived);
      setState('success');
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch {
      setState('confirm');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget && state === 'confirm') onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-warm-lg"
        >
          {state === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-14 px-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
              >
                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              </motion.div>
              <p className="mt-4 font-heading text-2xl font-bold">Cards Sold!</p>
              <div className="mt-2 flex items-center gap-1">
                <DollarSign className="h-5 w-5 text-accent" />
                <span className="text-xl font-bold text-accent tabular-nums">
                  +{amountReceived.toFixed(2)}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">Added to your balance</p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="font-heading text-lg font-bold">Confirm Sale</h2>
                  <p className="text-xs text-muted mt-0.5">You receive 60% of market value</p>
                </div>
                <button
                  onClick={onClose}
                  disabled={state === 'loading'}
                  className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Card list */}
              <div className="max-h-80 overflow-y-auto px-5 py-3">
                {items.map((item, i) => (
                  <motion.div
                    key={`${item.card.id}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
                  >
                    <Image
                      src={item.card.image_url}
                      alt={item.card.name}
                      width={36}
                      height={48}
                      className="h-12 w-9 rounded object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.card.name}
                        {item.quantity > 1 && (
                          <span className="ml-1 text-muted-dim">&times;{item.quantity}</span>
                        )}
                      </p>
                      <RarityBadge rarity={item.card.rarity as Rarity} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted line-through tabular-nums">
                        ${((item.card.price ?? 0) * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm font-bold text-accent tabular-nums">
                        ${(item.sellPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted">You receive</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <span className="font-heading text-xl font-bold text-accent tabular-nums">
                      {totalSellValue.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={state === 'loading'}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={state === 'loading'}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
                  >
                    {state === 'loading' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4" />
                        Confirm Sell
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
