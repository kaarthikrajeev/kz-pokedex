import { POKEMON_REGIONS, getRegionById, isPokemonInRegion } from './regions';

describe('Regions Model & Helpers', () => {
  it('should define 11 regions with proper ranges and ordering', () => {
    expect(POKEMON_REGIONS.length).toBe(11);
    expect(POKEMON_REGIONS[0].id).toBe('ALL');
    expect(POKEMON_REGIONS[1].id).toBe('KANTO');
    expect(POKEMON_REGIONS[2].id).toBe('JOHTO');
    expect(POKEMON_REGIONS[3].id).toBe('HOENN');
    expect(POKEMON_REGIONS[4].id).toBe('SINNOH');
    expect(POKEMON_REGIONS[5].id).toBe('UNOVA');
    expect(POKEMON_REGIONS[6].id).toBe('KALOS');
    expect(POKEMON_REGIONS[7].id).toBe('ALOLA');
    expect(POKEMON_REGIONS[8].id).toBe('GALAR');
    expect(POKEMON_REGIONS[9].id).toBe('HISUI');
    expect(POKEMON_REGIONS[10].id).toBe('PALDEA');
  });

  describe('getRegionById', () => {
    it('should retrieve region by exact uppercase ID', () => {
      const kanto = getRegionById('KANTO');
      expect(kanto.id).toBe('KANTO');
      expect(kanto.startId).toBe(1);
      expect(kanto.endId).toBe(151);
      expect(kanto.totalCount).toBe(151);
    });

    it('should retrieve region case-insensitively', () => {
      const johto = getRegionById('johto');
      expect(johto.id).toBe('JOHTO');
      expect(johto.startId).toBe(152);
      expect(johto.endId).toBe(251);
    });

    it('should retrieve region by name string', () => {
      const all = getRegionById('ALL REGIONS');
      expect(all.id).toBe('ALL');
    });

    it('should fallback to ALL region if invalid or empty id is provided', () => {
      expect(getRegionById('')).toEqual(POKEMON_REGIONS[0]);
      expect(getRegionById('UNKNOWN_REGION')).toEqual(POKEMON_REGIONS[0]);
    });
  });

  describe('isPokemonInRegion', () => {
    it('should return true for any pokemon ID when region is ALL', () => {
      expect(isPokemonInRegion(1, 'ALL')).toBeTrue();
      expect(isPokemonInRegion(150, 'ALL')).toBeTrue();
      expect(isPokemonInRegion(1000, 'ALL')).toBeTrue();
    });

    it('should correctly identify if a pokemon belongs to Kanto (#1-#151)', () => {
      expect(isPokemonInRegion(1, 'KANTO')).toBeTrue();
      expect(isPokemonInRegion(151, 'KANTO')).toBeTrue();
      expect(isPokemonInRegion(152, 'KANTO')).toBeFalse();
    });

    it('should correctly identify if a pokemon belongs to Johto (#152-#251)', () => {
      expect(isPokemonInRegion(151, 'JOHTO')).toBeFalse();
      expect(isPokemonInRegion(152, 'JOHTO')).toBeTrue();
      expect(isPokemonInRegion(251, 'JOHTO')).toBeTrue();
      expect(isPokemonInRegion(252, 'JOHTO')).toBeFalse();
    });

    it('should correctly identify if a pokemon belongs to Paldea (#906-#1025)', () => {
      expect(isPokemonInRegion(905, 'PALDEA')).toBeFalse();
      expect(isPokemonInRegion(906, 'PALDEA')).toBeTrue();
      expect(isPokemonInRegion(1025, 'PALDEA')).toBeTrue();
      expect(isPokemonInRegion(1026, 'PALDEA')).toBeFalse();
    });
  });
});
