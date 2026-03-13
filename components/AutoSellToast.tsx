'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign } from 'lucide-react';

interface AutoSellToastProps {
  count: number;
  totalEarned: number;
  onDismiss: () => void;
}

export function AutoSellToast({ count, totalEarned, onDismiss }: AutoSellToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-green-500/20 bg-green-500/10 px-5 py-2.5 shadow-lg backdrop-blur-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
              <DollarSign className="h-3.5 w-3.5 text-green-400" />
            </span>
            <span className="text-sm font-medium text-green-300">
              Auto-sold {count} card{count !== 1 ? 's' : ''} for +${totalEarned.toFixed(2)}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
