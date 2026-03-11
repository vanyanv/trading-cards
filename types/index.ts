export type Edition = '1st-edition' | 'shadowless' | 'unlimited';

export enum Rarity {
  Common = 'Common',
  Uncommon = 'Uncommon',
  Rare = 'Rare',
  DoubleRare = 'Double Rare',
  IllustrationRare = 'Illustration Rare',
  UltraRare = 'Ultra Rare',
  SpecialIllustrationRare = 'Special Illustration Rare',
  HyperRare = 'Hyper Rare',
  // TCG Pocket rarities
  OneDiamond = 'One Diamond',
  TwoDiamond = 'Two Diamond',
  ThreeDiamond = 'Three Diamond',
  FourDiamond = 'Four Diamond',
  OneStar = 'One Star',
  TwoStar = 'Two Star',
  ThreeStar = 'Three Star',
  Crown = 'Crown',
  OneShiny = 'One Shiny',
  TwoShiny = 'Two Shiny',
}

export interface Card {
  id: string;
  name: string;
  image_url: string;
  image_url_hires: string;
  rarity: Rarity;
  set_id: string;
  set_name: string;
  hp: string | null;
  types: string[];
  subtypes: string[];
  supertype: string;
  tcg_id: string;
  booster_ids?: string[] | null;
  created_at: string;
  price?: number;
  price_trend?: 'up' | 'down' | 'stable';
  price_source?: 'tcgplayer' | 'cardmarket' | 'estimate';
  condition?: string;
}

export interface Pack {
  id: string;
  name: string;
  description: string | null;
  price_usd: number | null;
  image_url: string;
  featured_card_image?: string | null;
  cards_per_pack: number;
  set_id: string;
  set_name: string;
  booster_id?: string | null;
  edition?: Edition | null;
  available: boolean;
  open_count: number;
  created_at: string;
}

export interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  card?: Card;
  is_reverse_holo: boolean;
  edition?: Edition | null;
  obtained_at: string;
  pack_opened_from: string | null;
}

export interface UserBalance {
  user_id: string;
  balance_usd: number;
  updated_at: string;
}

export interface PulledCard extends Card {
  is_reverse_holo: boolean;
  edition?: Edition | null;
  slot_number: number;
}

// TCGdex detailed card data types

export interface TCGPlayerVariantPrices {
  productId: number;
  lowPrice: number | null;
  midPrice: number | null;
  highPrice: number | null;
  marketPrice: number | null;
  directLowPrice: number | null;
}

export interface TCGPlayerPricing {
  updated: string;
  unit: string;
  normal?: TCGPlayerVariantPrices;
  holofoil?: TCGPlayerVariantPrices;
  'reverse-holofoil'?: TCGPlayerVariantPrices;
  '1stEditionHolofoil'?: TCGPlayerVariantPrices;
  '1stEditionNormal'?: TCGPlayerVariantPrices;
}

export interface CardmarketPricing {
  updated: string;
  unit: string;
  idProduct: number;
  avg: number | null;
  low: number | null;
  trend: number | null;
  avg1: number | null;
  avg7: number | null;
  avg30: number | null;
  'avg-holo': number | null;
  'low-holo': number | null;
  'trend-holo': number | null;
  'avg1-holo': number | null;
  'avg7-holo': number | null;
  'avg30-holo': number | null;
}

export interface CardPricing {
  cardmarket?: CardmarketPricing;
  tcgplayer?: TCGPlayerPricing;
}

export interface CardAttack {
  name: string;
  cost: string[];
  damage: number | string;
  effect: string;
}

export interface CardAbility {
  name: string;
  effect: string;
  type: string;
}

export interface CardWeakness {
  type: string;
  value: string;
}

export interface CardDetailData {
  pricing: CardPricing | null;
  attacks: CardAttack[] | null;
  abilities: CardAbility[] | null;
  weaknesses: CardWeakness[] | null;
  resistances: CardWeakness[] | null;
  retreat: number | null;
  illustrator: string | null;
  evolveFrom: string | null;
  stage: string | null;
}

export interface EbaySoldListing {
  title: string;
  price: number;
  soldDate: string;
  url: string;
}

export interface PackPricing {
  averagePrice: number;
  lowPrice: number;
  highPrice: number;
  recentSales: EbaySoldListing[];
  searchUrl: string;
}

export interface CardPricePoint {
  date: string;
  price: number;
  source: string;
  variant: string;
}

export interface CardSoldListing extends EbaySoldListing {
  grading?: string;
  condition?: string;
}

export interface EbayActiveListing {
  title: string;
  price: number;
  condition: string;
  imageUrl: string;
  url: string;
  seller: string;
}

// Gamification types

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_id: string | null;
  member_since: string;
  unique_cards: number;
  total_cards: number;
  collection_value: number;
  rarest_card: { name: string; rarity: string; image_url: string } | null;
}

export interface SetCompletion {
  set_id: string;
  set_name: string;
  owned_count: number;
  total_count: number;
  set_image_url?: string;
}

export interface UserProfileStats {
  total_value: number;
  unique_cards: number;
  total_cards: number;
  packs_opened: number;
  sets_started: number;
  member_since: string;
}

export interface PokedexLeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_id: string | null;
  unique_cards: number;
  sets_started: number;
}

export interface PokedexCard {
  card_id: string;
  card_name: string;
  card_image_url: string;
  card_rarity: string;
  owned: boolean;
}
