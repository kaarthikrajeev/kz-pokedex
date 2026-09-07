import {
  Pokemon,
  EvolutionChain,
  EvolutionNode,
  EvolutionStage,
} from '../app/models/types';

export function createMockPokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  const id = overrides.id ?? 25;
  const name = overrides.name ?? 'pikachu';

  return {
    id,
    name,
    types: overrides.types ?? ['electric'],
    height: overrides.height ?? 0.4,
    weight: overrides.weight ?? 6.0,
    sprite:
      overrides.sprite ??
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    spriteShiny:
      overrides.spriteShiny ??
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
    description:
      overrides.description ??
      'When several of these Pokémon gather, their electricity could build and cause lightning storms.',
    baseExperience: overrides.baseExperience ?? 112,
    abilities: overrides.abilities ?? [
      { name: 'static', isHidden: false },
      { name: 'lightning-rod', isHidden: true },
    ],
    stats: overrides.stats ?? [
      { name: 'hp', displayName: 'HP', baseStat: 35, percentage: 14 },
      { name: 'attack', displayName: 'ATK', baseStat: 55, percentage: 22 },
      { name: 'defense', displayName: 'DEF', baseStat: 40, percentage: 16 },
      { name: 'special-attack', displayName: 'SP. ATK', baseStat: 50, percentage: 20 },
      { name: 'special-defense', displayName: 'SP. DEF', baseStat: 50, percentage: 20 },
      { name: 'speed', displayName: 'SPEED', baseStat: 90, percentage: 35 },
    ],
    totalStats: overrides.totalStats ?? 320,
    evolutionChainUrl: overrides.evolutionChainUrl ?? 'https://pokeapi.co/api/v2/evolution-chain/10/',
    cries: overrides.cries ?? {
      latest: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`,
      legacy: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${id}.ogg`,
    },
    cryUrl:
      overrides.cryUrl ??
      `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`,
  };
}

export function createMockPokemonApiDetails(overrides: any = {}): any {
  const id = overrides.id ?? 25;
  const name = overrides.name ?? 'pikachu';

  return {
    id,
    name,
    base_experience: overrides.base_experience ?? 112,
    height: overrides.height ?? 4,
    weight: overrides.weight ?? 60,
    sprites: overrides.sprites ?? {
      front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      front_shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
    },
    types: overrides.types ?? [
      { slot: 1, type: { name: 'electric', url: 'https://pokeapi.co/api/v2/type/13/' } },
    ],
    abilities: overrides.abilities ?? [
      {
        ability: { name: 'static', url: 'https://pokeapi.co/api/v2/ability/9/' },
        is_hidden: false,
        slot: 1,
      },
      {
        ability: { name: 'lightning-rod', url: 'https://pokeapi.co/api/v2/ability/31/' },
        is_hidden: true,
        slot: 3,
      },
    ],
    stats: overrides.stats ?? [
      { base_stat: 35, effort: 0, stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' } },
      { base_stat: 55, effort: 0, stat: { name: 'attack', url: 'https://pokeapi.co/api/v2/stat/2/' } },
      { base_stat: 40, effort: 0, stat: { name: 'defense', url: 'https://pokeapi.co/api/v2/stat/3/' } },
      { base_stat: 50, effort: 0, stat: { name: 'special-attack', url: 'https://pokeapi.co/api/v2/stat/4/' } },
      { base_stat: 50, effort: 0, stat: { name: 'special-defense', url: 'https://pokeapi.co/api/v2/stat/5/' } },
      { base_stat: 90, effort: 2, stat: { name: 'speed', url: 'https://pokeapi.co/api/v2/stat/6/' } },
    ],
    cries: overrides.cries ?? {
      latest: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`,
      legacy: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${id}.ogg`,
    },
    ...overrides,
  };
}

export function createMockSpeciesApiResponse(overrides: any = {}): any {
  return {
    id: overrides.id ?? 25,
    name: overrides.name ?? 'pikachu',
    evolution_chain: overrides.evolution_chain ?? {
      url: 'https://pokeapi.co/api/v2/evolution-chain/10/',
    },
    flavor_text_entries: overrides.flavor_text_entries ?? [
      {
        flavor_text: 'When several of these Pokémon gather, their electricity could build and cause lightning storms.',
        language: { name: 'en', url: 'https://pokeapi.co/api/v2/language/9/' },
      },
    ],
    ...overrides,
  };
}

export function createMockEvolutionChain(overrides: Partial<EvolutionChain> = {}): EvolutionChain {
  const rootNode: EvolutionNode = {
    pokemon: {
      id: 1,
      name: 'bulbasaur',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
      spriteShiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png',
      types: ['grass', 'poison'],
      isBaby: false,
    },
    requirements: [{ description: 'Base Stage' }],
    evolvesTo: [
      {
        pokemon: {
          id: 2,
          name: 'ivysaur',
          sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png',
          spriteShiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/2.png',
          types: ['grass', 'poison'],
          isBaby: false,
        },
        requirements: [{ description: 'Level 16', minLevel: 16 }],
        evolvesTo: [
          {
            pokemon: {
              id: 3,
              name: 'venusaur',
              sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png',
              spriteShiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/3.png',
              types: ['grass', 'poison'],
              isBaby: false,
            },
            requirements: [{ description: 'Level 32', minLevel: 32 }],
            evolvesTo: [],
          },
        ],
      },
    ],
  };

  const stages: EvolutionStage[] = [
    {
      stageIndex: 0,
      pokemon: [{ pokemon: rootNode.pokemon, requirements: [{ description: 'Base Stage' }] }],
    },
    {
      stageIndex: 1,
      pokemon: [
        {
          pokemon: rootNode.evolvesTo[0].pokemon,
          fromPokemonName: 'bulbasaur',
          requirements: [{ description: 'Level 16', minLevel: 16 }],
        },
      ],
    },
    {
      stageIndex: 2,
      pokemon: [
        {
          pokemon: rootNode.evolvesTo[0].evolvesTo[0].pokemon,
          fromPokemonName: 'ivysaur',
          requirements: [{ description: 'Level 32', minLevel: 32 }],
        },
      ],
    },
  ];

  return {
    id: overrides.id ?? 1,
    babyTriggerItem: overrides.babyTriggerItem ?? null,
    root: overrides.root ?? rootNode,
    stages: overrides.stages ?? stages,
    hasEvolutions: overrides.hasEvolutions ?? true,
  };
}

export function createMockEvolutionChainApiResponse(overrides: any = {}): any {
  return {
    id: overrides.id ?? 1,
    baby_trigger_item: overrides.baby_trigger_item ?? null,
    chain: overrides.chain ?? {
      is_baby: false,
      species: { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon-species/1/' },
      evolution_details: [],
      evolves_to: [
        {
          is_baby: false,
          species: { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon-species/2/' },
          evolution_details: [{ trigger: { name: 'level-up' }, min_level: 16 }],
          evolves_to: [
            {
              is_baby: false,
              species: { name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon-species/3/' },
              evolution_details: [{ trigger: { name: 'level-up' }, min_level: 32 }],
              evolves_to: [],
            },
          ],
        },
      ],
    },
    ...overrides,
  };
}

export function createMockPaginatedResponse(count = 1351, results: { name: string; url: string }[] = []) {
  return {
    count,
    next: 'https://pokeapi.co/api/v2/pokemon?offset=24&limit=24',
    previous: null,
    results:
      results.length > 0
        ? results
        : [
            { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
            { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
            { name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon/3/' },
          ],
  };
}
