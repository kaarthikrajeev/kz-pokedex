export interface Ability {
  is_hidden: boolean;
  slot: number;
  ability: {
    name: string;
    url: string;
  };
}

export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Move {
  move: {
    name: string;
    url: string;
  };
  version_group_details: any[];
}

export interface Stat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface Type {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonAbility {
  name: string;
  isHidden: boolean;
}

export interface PokemonStat {
  name: string;
  displayName: string;
  baseStat: number;
  percentage: number;
}

export interface PokemonCries {
  latest?: string | null;
  legacy?: string | null;
}

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  height: number;
  weight: number;
  sprite: string | null;
  spriteShiny?: string | null;
  description?: string;
  baseExperience?: number;
  abilities?: PokemonAbility[];
  stats?: PokemonStat[];
  totalStats?: number;
  evolutionChainUrl?: string;
  cries?: PokemonCries;
  cryUrl?: string | null;
}

export interface EvolutionRequirement {
  trigger?: string;
  minLevel?: number | null;
  item?: string | null;
  heldItem?: string | null;
  timeOfDay?: string | null;
  minHappiness?: number | null;
  minAffection?: number | null;
  minBeauty?: number | null;
  knownMove?: string | null;
  knownMoveType?: string | null;
  location?: string | null;
  gender?: string | null;
  tradeSpecies?: string | null;
  partySpecies?: string | null;
  partyType?: string | null;
  relativePhysicalStats?: string | null;
  needsOverworldRain?: boolean;
  turnUpsideDown?: boolean;
  description: string;
}

export interface EvolutionPokemon {
  id: number;
  name: string;
  sprite: string;
  spriteShiny?: string;
  types: string[];
  isBaby: boolean;
}

export interface EvolutionNode {
  pokemon: EvolutionPokemon;
  requirements: EvolutionRequirement[];
  evolvesTo: EvolutionNode[];
}

export interface EvolutionStagePokemon {
  pokemon: EvolutionPokemon;
  fromPokemonName?: string;
  requirements: EvolutionRequirement[];
}

export interface EvolutionStage {
  stageIndex: number;
  pokemon: EvolutionStagePokemon[];
}

export interface EvolutionChain {
  id: number;
  babyTriggerItem?: string | null;
  root: EvolutionNode;
  stages: EvolutionStage[];
  hasEvolutions: boolean;
}
