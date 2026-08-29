import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PokedexService } from './pokedex';
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

    const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/pikachu');
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

    const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/pikachu');
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
    const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/pikachu');

    pokemonReq.flush({
      id: 25,
      name: 'pikachu',
      types: [{ type: { name: 'electric' } }],
      height: 4,
      weight: 60,
      sprites: { front_default: 'pikachu.png' },
    });

    speciesReq.flush({
      flavor_text_entries: [{ language: { name: 'en' }, flavor_text: 'Electric mouse.' }],
    });

    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
    expect(result1).toEqual(result2);
  });
});
