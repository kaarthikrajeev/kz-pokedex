import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PokedexService, formatEvolutionRequirements } from './pokedex';
import { Pokemon } from '../models/types';

describe('PokedexService', () => {
  let service: PokedexService;
  let httpMock: HttpTestingController;
  const STORAGE_KEY = 'pokedex_pokemon_details_cache_v2';

  const mockPikachu: Pokemon = {
    id: 25,
    name: 'pikachu',
    types: ['electric'],
    height: 0.4,
    weight: 6,
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
    spriteShiny:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png',
    description:
      'When several of these Pokémon gather, their electricity could build and cause lightning storms.',
    baseExperience: 112,
    abilities: [{ name: 'static', isHidden: false }],
    stats: [{ name: 'hp', displayName: 'HP', baseStat: 35, percentage: 14 }],
    totalStats: 35,
    cryUrl: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg',
  };

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    });
    service = TestBed.inject(PokedexService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(STORAGE_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load initial cache from localStorage into Signal on instantiation', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockPikachu]));

    const freshService = new PokedexService(TestBed.inject(HttpClient));
    const cacheMap = freshService.pokemonCache();

    expect(cacheMap.get('25')).toEqual(mockPikachu);
    expect(cacheMap.get('pikachu')).toEqual(mockPikachu);
  });

  it('should return cached Pokemon from Signal instantly without hitting network', (done) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockPikachu]));
    const freshService = new PokedexService(TestBed.inject(HttpClient));

    freshService.getPokemonDetails('pikachu').subscribe((pokemon) => {
      expect(pokemon).toEqual(mockPikachu);
      done();
    });

    httpMock.expectNone('https://pokeapi.co/api/v2/pokemon/pikachu');
  });

  it('should refetch from network if cached entry is incomplete (missing stats or abilities)', (done) => {
    const incompletePikachu: Pokemon = {
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      height: 0.4,
      weight: 6,
      sprite: '25.png',
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify([incompletePikachu]));
    const freshService = new PokedexService(TestBed.inject(HttpClient));

    freshService.getPokemonDetails('pikachu').subscribe((pokemon) => {
      expect(pokemon.stats?.length).toBe(6);
      expect(pokemon.abilities?.length).toBe(1);
      done();
    });

    const pokemonReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/pikachu');
    pokemonReq.flush({
      id: 25,
      name: 'pikachu',
      base_experience: 112,
      types: [{ type: { name: 'electric' } }],
      abilities: [{ ability: { name: 'static' }, is_hidden: false }],
      stats: [{ base_stat: 35, stat: { name: 'hp' } }],
      height: 4,
      weight: 60,
    });

    const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/25');
    speciesReq.flush({
      flavor_text_entries: [{ language: { name: 'en' }, flavor_text: 'Electric mouse.' }],
    });
  });

  it('should fetch from API on cache miss, update Signal, and persist to localStorage', (done) => {
    service.getPokemonDetails('pikachu').subscribe((pokemon) => {
      expect(pokemon.id).toBe(25);
      expect(pokemon.name).toBe('pikachu');
      expect(pokemon.types).toEqual(['electric']);
      expect(pokemon.description).toBe('An electric mouse.');
      expect(pokemon.baseExperience).toBe(112);
      expect(pokemon.abilities).toEqual([
        { name: 'static', isHidden: false },
        { name: 'lightning-rod', isHidden: true },
      ]);
      expect(pokemon.stats?.length).toBe(6);
      expect(pokemon.totalStats).toBe(320);

      expect(service.pokemonCache().get('25')).toEqual(pokemon);
      expect(service.pokemonCache().get('pikachu')).toEqual(pokemon);

      const savedRaw = localStorage.getItem(STORAGE_KEY);
      expect(savedRaw).toBeTruthy();
      const savedList = JSON.parse(savedRaw!);
      expect(savedList).toEqual([pokemon]);

      done();
    });

    const pokemonReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/pikachu');
    pokemonReq.flush({
      id: 25,
      name: 'pikachu',
      base_experience: 112,
      types: [{ type: { name: 'electric' } }],
      abilities: [
        { ability: { name: 'static' }, is_hidden: false },
        { ability: { name: 'lightning-rod' }, is_hidden: true },
      ],
      stats: [
        { base_stat: 35, stat: { name: 'hp' } },
        { base_stat: 55, stat: { name: 'attack' } },
        { base_stat: 40, stat: { name: 'defense' } },
        { base_stat: 50, stat: { name: 'special-attack' } },
        { base_stat: 50, stat: { name: 'special-defense' } },
        { base_stat: 90, stat: { name: 'speed' } },
      ],
      height: 4,
      weight: 60,
      sprites: {
        front_default:
          'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
        front_shiny:
          'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png',
      },
    });

    const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/25');
    speciesReq.flush({
      flavor_text_entries: [
        {
          language: { name: 'en' },
          flavor_text: 'An electric mouse.',
        },
      ],
    });
  });

  it('should deduplicate concurrent requests for the same Pokemon', () => {
    let result1: Pokemon | undefined;
    let result2: Pokemon | undefined;

    service.getPokemonDetails('pikachu').subscribe((res) => (result1 = res));
    service.getPokemonDetails('pikachu').subscribe((res) => (result2 = res));

    const pokemonReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/pikachu');

    pokemonReq.flush({
      id: 25,
      name: 'pikachu',
      types: [{ type: { name: 'electric' } }],
      height: 4,
      weight: 60,
      sprites: { front_default: 'pikachu.png' },
    });

    const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/25');
    speciesReq.flush({
      flavor_text_entries: [{ language: { name: 'en' }, flavor_text: 'Electric mouse.' }],
    });

    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
    expect(result1).toEqual(result2);
  });

  describe('Evolution Chain', () => {
    const mockBulbasaurChainApi = {
      id: 1,
      baby_trigger_item: null,
      chain: {
        is_baby: false,
        species: {
          name: 'bulbasaur',
          url: 'https://pokeapi.co/api/v2/pokemon-species/1/',
        },
        evolution_details: [],
        evolves_to: [
          {
            is_baby: false,
            species: {
              name: 'ivysaur',
              url: 'https://pokeapi.co/api/v2/pokemon-species/2/',
            },
            evolution_details: [
              {
                min_level: 16,
                trigger: { name: 'level-up' },
              },
            ],
            evolves_to: [
              {
                is_baby: false,
                species: {
                  name: 'venusaur',
                  url: 'https://pokeapi.co/api/v2/pokemon-species/3/',
                },
                evolution_details: [
                  {
                    min_level: 32,
                    trigger: { name: 'level-up' },
                  },
                ],
                evolves_to: [],
              },
            ],
          },
        ],
      },
    };

    it('should extract evolution_chain.url from species in getPokemonDetails', (done) => {
      service.getPokemonDetails('bulbasaur').subscribe((pokemon) => {
        expect(pokemon.evolutionChainUrl).toBe('https://pokeapi.co/api/v2/evolution-chain/1/');
        done();
      });

      const pokemonReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/bulbasaur');
      pokemonReq.flush({
        id: 1,
        name: 'bulbasaur',
        types: [{ type: { name: 'grass' } }],
        species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' },
      });

      const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/1/');
      speciesReq.flush({
        flavor_text_entries: [{ language: { name: 'en' }, flavor_text: 'Seed pokemon.' }],
        evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/1/' },
      });
    });

    it('should load and parse linear evolution chain correctly', (done) => {
      service.getEvolutionChain('1').subscribe((chain) => {
        expect(chain.id).toBe(1);
        expect(chain.hasEvolutions).toBeTrue();
        expect(chain.stages.length).toBe(3);

        expect(chain.stages[0].pokemon[0].pokemon.name).toBe('bulbasaur');
        expect(chain.stages[0].pokemon[0].pokemon.id).toBe(1);

        expect(chain.stages[1].pokemon[0].pokemon.name).toBe('ivysaur');
        expect(chain.stages[1].pokemon[0].pokemon.id).toBe(2);
        expect(chain.stages[1].pokemon[0].requirements[0].description).toBe('Level 16');

        expect(chain.stages[2].pokemon[0].pokemon.name).toBe('venusaur');
        expect(chain.stages[2].pokemon[0].pokemon.id).toBe(3);
        expect(chain.stages[2].pokemon[0].requirements[0].description).toBe('Level 32');

        done();
      });

      const chainReq = httpMock.expectOne('https://pokeapi.co/api/v2/evolution-chain/1');
      chainReq.flush(mockBulbasaurChainApi);

      // Expect type hydration calls
      const p1 = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/1');
      p1.flush({ types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }] });
      const p2 = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/2');
      p2.flush({ types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }] });
      const p3 = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/3');
      p3.flush({ types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }] });
    });

    it('should cache evolution chain and return cached data on repeated requests', (done) => {
      service.getEvolutionChain('1').subscribe(() => {
        // Second call should come directly from cache
        service.getEvolutionChain('1').subscribe((cachedChain) => {
          expect(cachedChain.id).toBe(1);
          expect(cachedChain.stages.length).toBe(3);
          done();
        });
      });

      const chainReq = httpMock.expectOne('https://pokeapi.co/api/v2/evolution-chain/1');
      chainReq.flush(mockBulbasaurChainApi);

      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/1').flush({ types: [] });
      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/2').flush({ types: [] });
      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/3').flush({ types: [] });
    });

    it('should deduplicate concurrent in-flight requests for the same evolution chain', () => {
      let r1: any;
      let r2: any;

      service.getEvolutionChain('https://pokeapi.co/api/v2/evolution-chain/1/').subscribe((res) => (r1 = res));
      service.getEvolutionChain('https://pokeapi.co/api/v2/evolution-chain/1/').subscribe((res) => (r2 = res));

      const chainReq = httpMock.expectOne('https://pokeapi.co/api/v2/evolution-chain/1/');
      chainReq.flush(mockBulbasaurChainApi);

      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/1').flush({ types: [] });
      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/2').flush({ types: [] });
      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/3').flush({ types: [] });

      expect(r1).toBeDefined();
      expect(r2).toBeDefined();
      expect(r1).toEqual(r2);
    });

    it('should parse branching evolution chains correctly (e.g. Eevee)', (done) => {
      const mockEeveeChainApi = {
        id: 67,
        baby_trigger_item: null,
        chain: {
          is_baby: false,
          species: { name: 'eevee', url: 'https://pokeapi.co/api/v2/pokemon-species/133/' },
          evolution_details: [],
          evolves_to: [
            {
              is_baby: false,
              species: { name: 'vaporeon', url: 'https://pokeapi.co/api/v2/pokemon-species/134/' },
              evolution_details: [{ trigger: { name: 'use-item' }, item: { name: 'water-stone' } }],
              evolves_to: [],
            },
            {
              is_baby: false,
              species: { name: 'jolteon', url: 'https://pokeapi.co/api/v2/pokemon-species/135/' },
              evolution_details: [{ trigger: { name: 'use-item' }, item: { name: 'thunder-stone' } }],
              evolves_to: [],
            },
            {
              is_baby: false,
              species: { name: 'flareon', url: 'https://pokeapi.co/api/v2/pokemon-species/136/' },
              evolution_details: [{ trigger: { name: 'use-item' }, item: { name: 'fire-stone' } }],
              evolves_to: [],
            },
          ],
        },
      };

      service.getEvolutionChain('67').subscribe((chain) => {
        expect(chain.id).toBe(67);
        expect(chain.hasEvolutions).toBeTrue();
        expect(chain.stages.length).toBe(2);
        expect(chain.stages[0].pokemon.length).toBe(1);
        expect(chain.stages[0].pokemon[0].pokemon.name).toBe('eevee');
        expect(chain.stages[1].pokemon.length).toBe(3);
        expect(chain.stages[1].pokemon[0].pokemon.name).toBe('vaporeon');
        expect(chain.stages[1].pokemon[0].requirements[0].description).toBe('Use Water Stone');
        expect(chain.stages[1].pokemon[1].pokemon.name).toBe('jolteon');
        expect(chain.stages[1].pokemon[1].requirements[0].description).toBe('Use Thunder Stone');
        expect(chain.stages[1].pokemon[2].pokemon.name).toBe('flareon');
        expect(chain.stages[1].pokemon[2].requirements[0].description).toBe('Use Fire Stone');
        done();
      });

      const chainReq = httpMock.expectOne('https://pokeapi.co/api/v2/evolution-chain/67');
      chainReq.flush(mockEeveeChainApi);

      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/133').flush({ types: [] });
      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/134').flush({ types: [] });
      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/135').flush({ types: [] });
      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/136').flush({ types: [] });
    });

    it('should parse recursive chains beyond 3 stages', (done) => {
      const mock4StageChainApi = {
        id: 999,
        chain: {
          is_baby: true,
          species: { name: 'stage1', url: 'https://pokeapi.co/api/v2/pokemon-species/101/' },
          evolution_details: [],
          evolves_to: [
            {
              is_baby: false,
              species: { name: 'stage2', url: 'https://pokeapi.co/api/v2/pokemon-species/102/' },
              evolution_details: [{ min_level: 10, trigger: { name: 'level-up' } }],
              evolves_to: [
                {
                  is_baby: false,
                  species: { name: 'stage3', url: 'https://pokeapi.co/api/v2/pokemon-species/103/' },
                  evolution_details: [{ min_level: 20, trigger: { name: 'level-up' } }],
                  evolves_to: [
                    {
                      is_baby: false,
                      species: { name: 'stage4', url: 'https://pokeapi.co/api/v2/pokemon-species/104/' },
                      evolution_details: [{ min_level: 30, trigger: { name: 'level-up' } }],
                      evolves_to: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      service.getEvolutionChain('999').subscribe((chain) => {
        expect(chain.stages.length).toBe(4);
        expect(chain.stages[3].pokemon[0].pokemon.name).toBe('stage4');
        expect(chain.stages[0].pokemon[0].pokemon.isBaby).toBeTrue();
        done();
      });

      httpMock.expectOne('https://pokeapi.co/api/v2/evolution-chain/999').flush(mock4StageChainApi);
      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/101').flush({ types: [] });
      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/102').flush({ types: [] });
      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/103').flush({ types: [] });
      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/104').flush({ types: [] });
    });

    it('should handle single-stage Pokémon without evolution (e.g. Lapras)', (done) => {
      const mockLaprasChainApi = {
        id: 68,
        chain: {
          is_baby: false,
          species: { name: 'lapras', url: 'https://pokeapi.co/api/v2/pokemon-species/131/' },
          evolution_details: [],
          evolves_to: [],
        },
      };

      service.getEvolutionChain('68').subscribe((chain) => {
        expect(chain.id).toBe(68);
        expect(chain.hasEvolutions).toBeFalse();
        expect(chain.stages.length).toBe(1);
        expect(chain.stages[0].pokemon[0].pokemon.name).toBe('lapras');
        done();
      });

      httpMock.expectOne('https://pokeapi.co/api/v2/evolution-chain/68').flush(mockLaprasChainApi);
      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/131').flush({ types: [] });
    });

    it('should load evolution chain using getEvolutionChainForPokemon', (done) => {
      const pokemonWithoutUrl: Pokemon = {
        id: 25,
        name: 'pikachu',
        types: ['electric'],
        height: 0.4,
        weight: 6,
        sprite: '25.png',
      };

      service.getEvolutionChainForPokemon(pokemonWithoutUrl).subscribe((chain) => {
        expect(chain.id).toBe(10);
        done();
      });

      const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/25');
      speciesReq.flush({
        evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/10/' },
      });

      const chainReq = httpMock.expectOne('https://pokeapi.co/api/v2/evolution-chain/10/');
      chainReq.flush({
        id: 10,
        chain: {
          species: { name: 'pichu', url: 'https://pokeapi.co/api/v2/pokemon-species/172/' },
          evolves_to: [],
        },
      });

      httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/172').flush({ types: [] });
    });

    it('should format different evolution triggers and requirements accurately', () => {
      // Level up
      expect(formatEvolutionRequirements([{ min_level: 16, trigger: { name: 'level-up' } }])[0].description).toBe('Level 16');

      // Use Item
      expect(formatEvolutionRequirements([{ trigger: { name: 'use-item' }, item: { name: 'water-stone' } }])[0].description).toBe('Use Water Stone');

      // Trade
      expect(formatEvolutionRequirements([{ trigger: { name: 'trade' } }])[0].description).toBe('Trade');

      // Trade + Held Item
      expect(formatEvolutionRequirements([{ trigger: { name: 'trade' }, held_item: { name: 'kings-rock' } }])[0].description).toBe('Trade + Hold Kings Rock');

      // High Friendship + Time of Day
      expect(formatEvolutionRequirements([{ trigger: { name: 'level-up' }, min_happiness: 220, time_of_day: 'night' }])[0].description).toBe('High Friendship + Night');

      // Known Move
      expect(formatEvolutionRequirements([{ trigger: { name: 'level-up' }, known_move: { name: 'rollout' } }])[0].description).toBe('Learn Rollout');

      // Rain + Level
      expect(formatEvolutionRequirements([{ min_level: 50, needs_overworld_rain: true }])[0].description).toBe('Level 50 + During Rain');

      // Gender requirement
      expect(formatEvolutionRequirements([{ trigger: { name: 'use-item' }, item: { name: 'dawn-stone' }, gender: 1 }])[0].description).toBe('Use Dawn Stone + (Female)');

      // Turn upside down
      expect(formatEvolutionRequirements([{ min_level: 30, turn_upside_down: true }])[0].description).toBe('Level 30 + Upside Down');

      // Physical stats
      expect(formatEvolutionRequirements([{ min_level: 20, relative_physical_stats: 1 }])[0].description).toBe('Level 20 + Atk > Def');

      // Empty / base details
      expect(formatEvolutionRequirements([])[0].description).toBe('Base Stage');
    });
  });

  describe('Pokemon Cries mapping', () => {
    it('should map latest cry as primary cryUrl', (done) => {
      service.getPokemonDetails('25').subscribe((pokemon) => {
        expect(pokemon.cryUrl).toBe('https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg');
        expect(pokemon.cries?.latest).toBe('https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg');
        expect(pokemon.cries?.legacy).toBe('https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/25.ogg');
        done();
      });

      const pokemonReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/25');
      pokemonReq.flush({
        id: 25,
        name: 'pikachu',
        cries: {
          latest: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg',
          legacy: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/25.ogg',
        },
        types: [{ type: { name: 'electric' } }],
        stats: [{ base_stat: 35, stat: { name: 'hp' } }],
        abilities: [{ ability: { name: 'static' }, is_hidden: false }],
      });

      const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/25');
      speciesReq.flush({ flavor_text_entries: [] });
    });

    it('should fall back to legacy cry if latest is not available', (done) => {
      service.getPokemonDetails('26').subscribe((pokemon) => {
        expect(pokemon.cryUrl).toBe('https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/26.ogg');
        expect(pokemon.cries?.latest).toBeNull();
        expect(pokemon.cries?.legacy).toBe('https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/26.ogg');
        done();
      });

      const pokemonReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/26');
      pokemonReq.flush({
        id: 26,
        name: 'raichu',
        cries: {
          latest: null,
          legacy: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/26.ogg',
        },
        types: [{ type: { name: 'electric' } }],
        stats: [{ base_stat: 60, stat: { name: 'hp' } }],
        abilities: [{ ability: { name: 'static' }, is_hidden: false }],
      });

      const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/26');
      speciesReq.flush({ flavor_text_entries: [] });
    });

    it('should set cryUrl to null if no cries are available', (done) => {
      service.getPokemonDetails('999').subscribe((pokemon) => {
        expect(pokemon.cryUrl).toBeNull();
        expect(pokemon.cries?.latest).toBeNull();
        expect(pokemon.cries?.legacy).toBeNull();
        done();
      });

      const pokemonReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/999');
      pokemonReq.flush({
        id: 999,
        name: 'unknown-mon',
        types: [{ type: { name: 'normal' } }],
        stats: [],
        abilities: [],
      });

      const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/999');
      speciesReq.flush({ flavor_text_entries: [] });
    });
  });
});
