export enum Rarity {
  Common = 'Common',
  Uncommon = 'Uncommon',
  Rare = 'Rare',
  DoubleRare = 'Double Rare',
  IllustrationRare = 'Illustration Rare',
  UltraRare = 'Ultra Rare',
  SpecialIllustrationRare = 'Special Illustration Rare',
  HyperRare = 'Hyper Rare',
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
  created_at: string;
}

export interface Pack {
  id: string;
  name: string;
  description: string | null;
  price_coins: number;
  image_url: string;
  cards_per_pack: number;
  set_id: string;
  set_name: string;
  available: boolean;
  created_at: string;
}

export interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  card?: Card;
  is_reverse_holo: boolean;
  obtained_at: string;
  pack_opened_from: string | null;
}

export interface UserBalance {
  user_id: string;
  coins: number;
  updated_at: string;
}

export interface PulledCard extends Card {
  is_reverse_holo: boolean;
  slot_number: number;
}
