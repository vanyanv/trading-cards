export interface AvatarOption {
  id: string;
  label: string;
  emoji: string;
  bg: string; // tailwind bg class
}

export const AVATARS: AvatarOption[] = [
  // Pokeballs
  { id: 'pokeball', label: 'Poké Ball', emoji: '🔴', bg: 'bg-red-500' },
  { id: 'greatball', label: 'Great Ball', emoji: '🔵', bg: 'bg-blue-500' },
  { id: 'ultraball', label: 'Ultra Ball', emoji: '🟡', bg: 'bg-yellow-500' },
  { id: 'masterball', label: 'Master Ball', emoji: '🟣', bg: 'bg-purple-500' },
  // Types
  { id: 'fire', label: 'Fire', emoji: '🔥', bg: 'bg-orange-500' },
  { id: 'water', label: 'Water', emoji: '💧', bg: 'bg-cyan-500' },
  { id: 'grass', label: 'Grass', emoji: '🌿', bg: 'bg-green-500' },
  { id: 'lightning', label: 'Lightning', emoji: '⚡', bg: 'bg-yellow-400' },
  { id: 'psychic', label: 'Psychic', emoji: '🔮', bg: 'bg-fuchsia-500' },
  { id: 'fairy', label: 'Fairy', emoji: '✨', bg: 'bg-pink-400' },
  // Special
  { id: 'dragon', label: 'Dragon', emoji: '🐉', bg: 'bg-indigo-600' },
  { id: 'dark', label: 'Darkness', emoji: '🌙', bg: 'bg-slate-700' },
  { id: 'fighting', label: 'Fighting', emoji: '👊', bg: 'bg-amber-700' },
  { id: 'metal', label: 'Metal', emoji: '⚙️', bg: 'bg-slate-400' },
  { id: 'star', label: 'Star', emoji: '⭐', bg: 'bg-amber-400' },
  { id: 'crown', label: 'Crown', emoji: '👑', bg: 'bg-amber-500' },
];

export function getAvatar(id: string | null | undefined): AvatarOption {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
