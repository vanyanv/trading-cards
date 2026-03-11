export const queryKeys = {
  packs: {
    available: ['packs', 'available'] as const,
  },
  cards: {
    bySet: (setId: string) => ['cards', 'set', setId] as const,
    detail: (cardId: string) => ['cards', 'detail', cardId] as const,
  },
  collection: {
    userCards: (userId: string) => ['collection', 'userCards', userId] as const,
  },
  packDetail: (packId: string) => ['pack', 'detail', packId] as const,
} as const;
