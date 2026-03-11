import type { Pack, Edition } from '@/types';
import { EDITION_CONFIG, EDITION_ORDER } from './constants';

export interface PackGroup {
  groupKey: string;
  displayPack: Pack;
  editionVariants: Pack[];
  hasMultipleEditions: boolean;
}

export function groupPacks(packs: Pack[]): PackGroup[] {
  const map = new Map<string, Pack[]>();

  for (const pack of packs) {
    const key = pack.booster_id
      ? `${pack.set_id}_${pack.booster_id}`
      : pack.set_id;

    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(pack);
  }

  const groups: PackGroup[] = [];

  for (const [groupKey, variants] of map) {
    // Sort edition variants by canonical order
    const editionVariants = variants
      .filter((p) => p.edition != null)
      .sort((a, b) => {
        const ai = EDITION_ORDER.indexOf(a.edition as Edition);
        const bi = EDITION_ORDER.indexOf(b.edition as Edition);
        return ai - bi;
      });

    const modernPack = variants.find((p) => p.edition == null);

    // Pick display pack: prefer unlimited (cheapest multiplier), then modern
    let displayPack: Pack;
    if (editionVariants.length > 0) {
      // Pick the one with the lowest price multiplier as the default display
      displayPack = editionVariants.reduce((best, curr) => {
        const bestMult = EDITION_CONFIG[best.edition as Edition]?.priceMultiplier ?? 1;
        const currMult = EDITION_CONFIG[curr.edition as Edition]?.priceMultiplier ?? 1;
        return currMult < bestMult ? curr : best;
      });
    } else {
      displayPack = modernPack ?? variants[0];
    }

    groups.push({
      groupKey,
      displayPack,
      editionVariants,
      hasMultipleEditions: editionVariants.length > 1,
    });
  }

  return groups;
}
