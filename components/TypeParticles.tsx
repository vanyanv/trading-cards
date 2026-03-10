'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getTypeEffect } from '@/lib/type-effects';
import type { ParticleMotion, ParticleShape } from '@/lib/type-effects';

interface TypeParticlesProps {
  types: string[] | null | undefined;
  count?: number;
}

function getShapeStyle(shape: ParticleShape, size: number): React.CSSProperties {
  const base: React.CSSProperties = {
    width: size,
    height: size,
    position: 'absolute' as const,
  };

  switch (shape) {
    case 'circle':
      return { ...base, borderRadius: '9999px' };
    case 'square':
      return base;
    case 'star':
      return {
        ...base,
        clipPath:
          'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
      };
    case 'diamond':
      return { ...base, transform: 'rotate(45deg)' };
    case 'line':
      return { ...base, width: 2, height: 12, borderRadius: '1px' };
    default:
      return { ...base, borderRadius: '9999px' };
  }
}

function getMotionProps(
  motion: ParticleMotion,
  index: number,
  containerSize: number
) {
  const rand = () => Math.random();
  const startX = rand() * 100;
  const startY = rand() * 100;
  const duration = 2 + rand() * 2;
  const delay = rand() * 2;

  switch (motion) {
    case 'rise':
      return {
        initial: { left: `${startX}%`, bottom: '0%', opacity: 0 },
        animate: {
          y: [0, -(150 + rand() * 200)],
          x: [(rand() - 0.5) * 40, (rand() - 0.5) * 60],
          opacity: [0, 0.8, 0.6, 0.8, 0],
        },
        transition: { duration, delay, repeat: Infinity, ease: 'easeOut' as const },
      };
    case 'float-down':
      return {
        initial: { left: `${startX}%`, top: '0%', opacity: 0 },
        animate: {
          y: [0, 150 + rand() * 200],
          x: [(rand() - 0.5) * 30],
          rotate: [0, (rand() - 0.5) * 180],
          opacity: [0, 0.7, 0.5, 0],
        },
        transition: { duration: duration + 1, delay, repeat: Infinity, ease: 'easeIn' as const },
      };
    case 'wobble':
      return {
        initial: { left: `${startX}%`, bottom: '10%', opacity: 0 },
        animate: {
          y: [0, -(100 + rand() * 150)],
          x: [0, 20, -20, 15, -15, 0],
          opacity: [0, 0.7, 0.5, 0],
        },
        transition: { duration: duration + 1, delay, repeat: Infinity, ease: 'easeInOut' as const },
      };
    case 'zigzag':
      return {
        initial: { left: `${startX}%`, bottom: '0%', opacity: 0 },
        animate: {
          y: [0, -50, -100, -150, -200, -250],
          x: [0, 30, -30, 30, -30, 0],
          opacity: [0, 1, 1, 1, 0.5, 0],
        },
        transition: { duration: 1.5 + rand(), delay, repeat: Infinity, ease: 'linear' as const },
      };
    case 'orbit': {
      const angle = (index / 20) * 360;
      const radius = 80 + rand() * 60;
      return {
        initial: {
          left: '50%',
          top: '50%',
          opacity: 0,
        },
        animate: {
          rotate: [angle, angle + 360],
          opacity: [0, 0.7, 0.7, 0],
        },
        transition: { duration: duration + 2, delay, repeat: Infinity, ease: 'linear' as const },
        style: {
          transformOrigin: `0px 0px`,
          translate: `${Math.cos((angle * Math.PI) / 180) * radius}px ${Math.sin((angle * Math.PI) / 180) * radius}px`,
        },
      };
    }
    case 'burst':
      return {
        initial: { left: '50%', top: '50%', opacity: 0, scale: 0 },
        animate: {
          x: [0, Math.cos((index * 36) * Math.PI / 180) * (100 + rand() * 80)],
          y: [0, Math.sin((index * 36) * Math.PI / 180) * (100 + rand() * 80)],
          opacity: [0, 1, 0.6, 0],
          scale: [0, 1, 0.5],
        },
        transition: { duration: duration + 1, delay, repeat: Infinity, ease: 'easeOut' as const },
      };
    case 'drift':
      return {
        initial: { left: `${startX}%`, top: `${startY}%`, opacity: 0 },
        animate: {
          x: [(rand() - 0.5) * 60, (rand() - 0.5) * 60],
          y: [(rand() - 0.5) * 60, (rand() - 0.5) * 60],
          opacity: [0, 0.3, 0.2, 0],
        },
        transition: { duration: duration + 2, delay, repeat: Infinity, ease: 'easeInOut' as const },
      };
    case 'twinkle':
      return {
        initial: { left: `${startX}%`, top: `${startY}%`, opacity: 0 },
        animate: {
          y: [0, -(20 + rand() * 30)],
          opacity: [0.2, 1, 0.2],
          scale: [0.5, 1.2, 0.5],
        },
        transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' as const },
      };
    case 'spiral': {
      const spiralAngle = (index / 20) * 360;
      return {
        initial: { left: '50%', top: '50%', opacity: 0 },
        animate: {
          rotate: [spiralAngle, spiralAngle + 720],
          x: [0, Math.cos((spiralAngle * Math.PI) / 180) * 120],
          y: [0, Math.sin((spiralAngle * Math.PI) / 180) * 120],
          opacity: [0, 0.8, 0.4, 0],
          scale: [0.3, 1, 0.5],
        },
        transition: { duration: duration + 1, delay, repeat: Infinity, ease: 'easeOut' as const },
      };
    }
    case 'shimmer':
      return {
        initial: { left: `${startX}%`, top: `${startY}%`, opacity: 0 },
        animate: {
          x: [-20, 20, -20],
          opacity: [0.2, 0.8, 0.2],
          scale: [0.8, 1.2, 0.8],
        },
        transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' as const },
      };
    default:
      return {
        initial: { left: `${startX}%`, top: `${startY}%`, opacity: 0 },
        animate: { opacity: [0, 0.5, 0] },
        transition: { duration, delay, repeat: Infinity },
      };
  }
}

export function TypeParticles({ types, count = 20 }: TypeParticlesProps) {
  const config = getTypeEffect(types);

  const particles = useMemo(() => {
    const isMobile =
      typeof window !== 'undefined' && window.innerWidth < 768;
    const particleCount = isMobile ? Math.floor(count / 2) : count;

    return Array.from({ length: particleCount }, (_, i) => {
      const size = 3 + Math.random() * 6;
      const colorIndex = Math.random() > 0.5 ? 0 : 1;
      const color = config.particleColors[colorIndex];
      const motionProps = getMotionProps(config.particleMotion, i, 300);
      const shapeStyle = getShapeStyle(config.particleShape, size);

      return {
        id: i,
        color,
        size,
        motionProps,
        shapeStyle,
      };
    });
  }, [count, config]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            ...p.shapeStyle,
            ...p.motionProps.style,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            willChange: 'transform, opacity',
          }}
          initial={p.motionProps.initial}
          animate={p.motionProps.animate}
          transition={p.motionProps.transition}
        />
      ))}
    </div>
  );
}
