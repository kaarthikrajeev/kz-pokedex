import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PokedexService } from './pokedex';
import { Pokemon } from '../models/types';

describe('PokedexService', () => {
  let service: PokedexService;
  let httpMock: HttpTestingController;
  const STORAGE_KEY = 'pokedex_pokemon_details_cache';

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
  };

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideZonelessChangeDetection()],
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

  it('should fetch from API on cache miss, update Signal, and persist to localStorage', (done) => {
    service.getPokemonDetails('pikachu').subscribe((pokemon) => {
      expect(pokemon.id).toBe(25);
      expect(pokemon.name).toBe('pikachu');
      expect(pokemon.types).toEqual(['electric']);
      expect(pokemon.description).toBe('An electric mouse.');

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
      types: [{ type: { name: 'electric' } }],
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
