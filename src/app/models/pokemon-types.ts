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

/**
 * Set-based allowlist for O(1) validation of Pokémon type names.
 * Used to sanitize API/localStorage data before it reaches class bindings.
 */
export const VALID_POKEMON_TYPES: ReadonlySet<string> = new Set<string>(POKEMON_TYPES);

/**
 * Allowlist of valid base stat identifiers and their display labels.
 * Keys are the only values permitted in CSS class name interpolation (e.g. `stat-bar-fill--hp`).
 */
export const VALID_STAT_NAMES: Readonly<Record<string, string>> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SP. ATK',
  'special-defense': 'SP. DEF',
  speed: 'SPEED',
} as const;

const VALID_STAT_NAME_SET: ReadonlySet<string> = new Set(Object.keys(VALID_STAT_NAMES));

/**
 * Returns the type name unchanged if it is a known Pokémon type, otherwise 'unknown'.
 * Prevents arbitrary strings from being interpolated into CSS class names.
 */
export function sanitizePokemonType(type: unknown): string {
  if (typeof type === 'string' && VALID_POKEMON_TYPES.has(type)) {
    return type;
  }
  return 'unknown';
}

/**
 * Returns the stat name unchanged if it is a known base stat, otherwise 'unknown'.
 * Prevents arbitrary strings from being interpolated into CSS class names.
 */
export function sanitizeStatName(name: unknown): string {
  if (typeof name === 'string' && VALID_STAT_NAME_SET.has(name)) {
    return name;
  }
  return 'unknown';
}

