export interface Region {
  id: string;
  name: string;
  displayName: string;
  generation: string;
  startId: number;
  endId: number;
  startOffset: number;
  totalCount: number;
}

export const POKEMON_REGIONS: readonly Region[] = [
  {
    id: 'ALL',
    name: 'ALL REGIONS',
    displayName: 'All Regions',
    generation: 'All Generations',
    startId: 1,
    endId: 100000,
    startOffset: 0,
    totalCount: 1351,
  },
  {
    id: 'KANTO',
    name: 'KANTO',
    displayName: 'Kanto',
    generation: 'Generation I',
    startId: 1,
    endId: 151,
    startOffset: 0,
    totalCount: 151,
  },
  {
    id: 'JOHTO',
    name: 'JOHTO',
    displayName: 'Johto',
    generation: 'Generation II',
    startId: 152,
    endId: 251,
    startOffset: 151,
    totalCount: 100,
  },
  {
    id: 'HOENN',
    name: 'HOENN',
    displayName: 'Hoenn',
    generation: 'Generation III',
    startId: 252,
    endId: 386,
    startOffset: 251,
    totalCount: 135,
  },
  {
    id: 'SINNOH',
    name: 'SINNOH',
    displayName: 'Sinnoh',
    generation: 'Generation IV',
    startId: 387,
    endId: 493,
    startOffset: 386,
    totalCount: 107,
  },
  {
    id: 'UNOVA',
    name: 'UNOVA',
    displayName: 'Unova',
    generation: 'Generation V',
    startId: 494,
    endId: 649,
    startOffset: 493,
    totalCount: 156,
  },
  {
    id: 'KALOS',
    name: 'KALOS',
    displayName: 'Kalos',
    generation: 'Generation VI',
    startId: 650,
    endId: 721,
    startOffset: 649,
    totalCount: 72,
  },
  {
    id: 'ALOLA',
    name: 'ALOLA',
    displayName: 'Alola',
    generation: 'Generation VII',
    startId: 722,
    endId: 809,
    startOffset: 721,
    totalCount: 88,
  },
  {
    id: 'GALAR',
    name: 'GALAR',
    displayName: 'Galar',
    generation: 'Generation VIII',
    startId: 810,
    endId: 898,
    startOffset: 809,
    totalCount: 89,
  },
  {
    id: 'HISUI',
    name: 'HISUI',
    displayName: 'Hisui',
    generation: 'Legends: Arceus',
    startId: 899,
    endId: 905,
    startOffset: 898,
    totalCount: 7,
  },
  {
    id: 'PALDEA',
    name: 'PALDEA',
    displayName: 'Paldea',
    generation: 'Generation IX',
    startId: 906,
    endId: 1025,
    startOffset: 905,
    totalCount: 120,
  },
] as const;

export function getRegionById(id: string): Region {
  const normalized = (id ?? '').trim().toUpperCase();
  const found = POKEMON_REGIONS.find((r) => r.id === normalized || r.name === normalized);
  return found ?? POKEMON_REGIONS[0];
}

export function isPokemonInRegion(pokemonId: number, regionId: string): boolean {
  const region = getRegionById(regionId);
  if (region.id === 'ALL') {
    return true;
  }
  return pokemonId >= region.startId && pokemonId <= region.endId;
}
