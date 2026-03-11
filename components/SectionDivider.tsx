'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TYPE_EFFECT_CONFIG } from '@/lib/type-effects';

interface SectionDividerProps {
  type?: string;
}

export function SectionDivider({ type }: SectionDividerProps) {
  // Pick a type config — use provided type or random
  const typeKey = type && TYPE_EFFECT_CONFIG[type] ? type : 'Colorless';
  const config = TYPE_EFFECT_CONFIG[typeKey];
  const [color1, color2] = config.particleColors;

  // Generate particles once
  const particles = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90, // percent across the line
      size: 3 + Math.random() * 5,
      color: Math.random() > 0.5 ? color1 : color2,
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 1.5,
      yOffset: -12 + Math.random() * 24,
    }));
  }, [color1, color2]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.8 }}
      className="relative my-4 flex h-12 items-center justify-center"
    >
      {/* Gradient line */}
      <div
        className="h-px w-full max-w-md"
        style={{
          background: `linear-gradient(90deg, transparent, ${color1}40, ${color2}40, transparent)`,
        }}
      />

      {/* Floating particles along the line */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: '50%',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
          initial={{ opacity: 0, y: p.yOffset }}
          whileInView={{
            opacity: [0, 0.8, 0],
            y: [p.yOffset, p.yOffset - 10, p.yOffset],
          }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
}
