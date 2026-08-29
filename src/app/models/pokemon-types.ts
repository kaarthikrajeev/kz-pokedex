export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy'
] as const;

export type PokemonTypeValue = (typeof POKEMON_TYPES)[number];
export type PokemonFilterType = 'all' | PokemonTypeValue;
