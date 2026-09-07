import {
  POKEMON_TYPES,
  VALID_POKEMON_TYPES,
  VALID_STAT_NAMES,
  sanitizePokemonType,
  sanitizeStatName,
} from './pokemon-types';

describe('Pokemon Types & Models Validation', () => {
  describe('POKEMON_TYPES & VALID_POKEMON_TYPES', () => {
    it('should define all 18 core pokemon types', () => {
      expect(POKEMON_TYPES.length).toBe(18);
      expect(VALID_POKEMON_TYPES.size).toBe(18);
      expect(VALID_POKEMON_TYPES.has('fire')).toBeTrue();
      expect(VALID_POKEMON_TYPES.has('water')).toBeTrue();
      expect(VALID_POKEMON_TYPES.has('grass')).toBeTrue();
      expect(VALID_POKEMON_TYPES.has('electric')).toBeTrue();
      expect(VALID_POKEMON_TYPES.has('fairy')).toBeTrue();
    });
  });

  describe('VALID_STAT_NAMES', () => {
    it('should map the 6 core stats to their display names', () => {
      expect(VALID_STAT_NAMES['hp']).toBe('HP');
      expect(VALID_STAT_NAMES['attack']).toBe('ATK');
      expect(VALID_STAT_NAMES['defense']).toBe('DEF');
      expect(VALID_STAT_NAMES['special-attack']).toBe('SP. ATK');
      expect(VALID_STAT_NAMES['special-defense']).toBe('SP. DEF');
      expect(VALID_STAT_NAMES['speed']).toBe('SPEED');
    });
  });

  describe('sanitizePokemonType', () => {
    it('should return valid pokemon types unchanged', () => {
      expect(sanitizePokemonType('grass')).toBe('grass');
      expect(sanitizePokemonType('fire')).toBe('fire');
      expect(sanitizePokemonType('poison')).toBe('poison');
      expect(sanitizePokemonType('dragon')).toBe('dragon');
    });

    it('should return "unknown" for invalid, malformed, or non-string inputs', () => {
      expect(sanitizePokemonType('invalid-type')).toBe('unknown');
      expect(sanitizePokemonType('')).toBe('unknown');
      expect(sanitizePokemonType(null)).toBe('unknown');
      expect(sanitizePokemonType(undefined)).toBe('unknown');
      expect(sanitizePokemonType(123)).toBe('unknown');
      expect(sanitizePokemonType({})).toBe('unknown');
    });
  });

  describe('sanitizeStatName', () => {
    it('should return valid stat names unchanged', () => {
      expect(sanitizeStatName('hp')).toBe('hp');
      expect(sanitizeStatName('attack')).toBe('attack');
      expect(sanitizeStatName('defense')).toBe('defense');
      expect(sanitizeStatName('special-attack')).toBe('special-attack');
      expect(sanitizeStatName('special-defense')).toBe('special-defense');
      expect(sanitizeStatName('speed')).toBe('speed');
    });

    it('should return "unknown" for invalid, malformed, or non-string inputs', () => {
      expect(sanitizeStatName('accuracy')).toBe('unknown');
      expect(sanitizeStatName('evasion')).toBe('unknown');
      expect(sanitizeStatName('')).toBe('unknown');
      expect(sanitizeStatName(null)).toBe('unknown');
      expect(sanitizeStatName(undefined)).toBe('unknown');
      expect(sanitizeStatName(42)).toBe('unknown');
      expect(sanitizeStatName([])).toBe('unknown');
    });
  });
});
