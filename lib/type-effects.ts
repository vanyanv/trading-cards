export type ParticleMotion =
  | 'rise'
  | 'float-down'
  | 'zigzag'
  | 'orbit'
  | 'burst'
  | 'drift'
  | 'twinkle'
  | 'spiral'
  | 'shimmer'
  | 'wobble';

export type ParticleShape = 'circle' | 'square' | 'star' | 'diamond' | 'line';

export interface TypeEffectConfig {
  particleColors: [string, string];
  particleMotion: ParticleMotion;
  particleShape: ParticleShape;
  revealGradient: string;
  revealColor: string;
}

export const TYPE_EFFECT_CONFIG: Record<string, TypeEffectConfig> = {
  Fire: {
    particleColors: ['#FF6B35', '#FFD700'],
    particleMotion: 'rise',
    particleShape: 'circle',
    revealGradient: 'linear-gradient(135deg, #FF6B35, #FFD700)',
    revealColor: '#FF6B35',
  },
  Water: {
    particleColors: ['#4FC3F7', '#0288D1'],
    particleMotion: 'wobble',
    particleShape: 'circle',
    revealGradient: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
    revealColor: '#4FC3F7',
  },
  Grass: {
    particleColors: ['#66BB6A', '#2E7D32'],
    particleMotion: 'float-down',
    particleShape: 'circle',
    revealGradient: 'linear-gradient(135deg, #66BB6A, #2E7D32)',
    revealColor: '#66BB6A',
  },
  Lightning: {
    particleColors: ['#FFD600', '#FFF176'],
    particleMotion: 'zigzag',
    particleShape: 'line',
    revealGradient: 'linear-gradient(135deg, #FFD600, #FFF176)',
    revealColor: '#FFD600',
  },
  Psychic: {
    particleColors: ['#CE93D8', '#7B1FA2'],
    particleMotion: 'orbit',
    particleShape: 'circle',
    revealGradient: 'linear-gradient(135deg, #CE93D8, #7B1FA2)',
    revealColor: '#CE93D8',
  },
  Fighting: {
    particleColors: ['#A1887F', '#795548'],
    particleMotion: 'burst',
    particleShape: 'square',
    revealGradient: 'linear-gradient(135deg, #A1887F, #795548)',
    revealColor: '#A1887F',
  },
  Darkness: {
    particleColors: ['#424242', '#9E9E9E'],
    particleMotion: 'drift',
    particleShape: 'circle',
    revealGradient: 'linear-gradient(135deg, #424242, #9E9E9E)',
    revealColor: '#424242',
  },
  Fairy: {
    particleColors: ['#F48FB1', '#FCE4EC'],
    particleMotion: 'twinkle',
    particleShape: 'star',
    revealGradient: 'linear-gradient(135deg, #F48FB1, #FCE4EC)',
    revealColor: '#F48FB1',
  },
  Dragon: {
    particleColors: ['#7C4DFF', '#FF6D00'],
    particleMotion: 'spiral',
    particleShape: 'diamond',
    revealGradient: 'linear-gradient(135deg, #7C4DFF, #FF6D00)',
    revealColor: '#7C4DFF',
  },
  Metal: {
    particleColors: ['#B0BEC5', '#78909C'],
    particleMotion: 'shimmer',
    particleShape: 'circle',
    revealGradient: 'linear-gradient(135deg, #B0BEC5, #78909C)',
    revealColor: '#B0BEC5',
  },
  Colorless: {
    particleColors: ['#E0E0E0', '#BDBDBD'],
    particleMotion: 'drift',
    particleShape: 'circle',
    revealGradient: 'linear-gradient(135deg, #E0E0E0, #BDBDBD)',
    revealColor: '#E0E0E0',
  },
};

/**
 * Returns the type effect config for the first type in the array,
 * falling back to Colorless if no types are provided or the type is unknown.
 */
export function getTypeEffect(
  types: string[] | null | undefined
): TypeEffectConfig {
  if (!types || types.length === 0) {
    return TYPE_EFFECT_CONFIG.Colorless;
  }

  return TYPE_EFFECT_CONFIG[types[0]] ?? TYPE_EFFECT_CONFIG.Colorless;
}
