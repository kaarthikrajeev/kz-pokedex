import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { PokemonListStateService } from './pokemon-list-state';
import { PokedexService } from './pokedex';
import { FavoritesService } from './favorites';
import { createMockPokemon } from '../../testing/mock-data';
import { POKEMON_REGIONS } from '../models/regions';

describe('PokemonListStateService', () => {
  let service: PokemonListStateService;
  let pokedexService: jasmine.SpyObj<PokedexService>;
  let favoritesService: jasmine.SpyObj<FavoritesService>;
  let mockFavoritesSignal: WritableSignal<Set<number>>;

  const mockBulbasaur = createMockPokemon({ id: 1, name: 'bulbasaur', types: ['grass', 'poison'] });
  const mockCharmander = createMockPokemon({ id: 4, name: 'charmander', types: ['fire'] });
  const mockSquirtle = createMockPokemon({ id: 7, name: 'squirtle', types: ['water'] });
  const mockPikachu = createMockPokemon({ id: 25, name: 'pikachu', types: ['electric'] });
  const mockChikorita = createMockPokemon({ id: 152, name: 'chikorita', types: ['grass'] });
  const mockCyndaquil = createMockPokemon({ id: 155, name: 'cyndaquil', types: ['fire'] });
  const mockSprigatito = createMockPokemon({ id: 906, name: 'sprigatito', types: ['grass'] });

  beforeEach(() => {
    mockFavoritesSignal = signal<Set<number>>(new Set<number>());

    const pokedexSpy = jasmine.createSpyObj<PokedexService>('PokedexService', [
      'getPokemonPage',
      'searchPokemon',
      'pokemonCache',
    ]);
    pokedexSpy.pokemonCache.and.returnValue(new Map());
    pokedexSpy.getPokemonPage.and.returnValue(of({ pokemon: [], total: 0, hasMore: false }));
    pokedexSpy.searchPokemon.and.returnValue(of([]));

    const favSpy = jasmine.createSpyObj<FavoritesService>('FavoritesService', ['isFavorite'], {
      favorites: mockFavoritesSignal.asReadonly(),
    });

    TestBed.configureTestingModule({
      providers: [
        PokemonListStateService,
        { provide: PokedexService, useValue: pokedexSpy },
        { provide: FavoritesService, useValue: favSpy },
        provideZonelessChangeDetection(),
      ],
    });

    pokedexService = TestBed.inject(PokedexService) as jasmine.SpyObj<PokedexService>;
    favoritesService = TestBed.inject(FavoritesService) as jasmine.SpyObj<FavoritesService>;
    service = TestBed.inject(PokemonListStateService);
  });

  it('should be created with correct initial defaults', () => {
    expect(service).toBeTruthy();
    expect(service.pokemon()).toEqual([]);
    expect(service.searchQuery()).toBe('');
    expect(service.selectedTypes()).toEqual([]);
    expect(service.selectedRegion()).toBe('ALL');
    expect(service.activeRegion().id).toBe('ALL');
    expect(service.activeRegionLabel()).toBe('ALL REGIONS');
    expect(service.showFavoritesOnly()).toBeFalse();
    expect(service.searchResults()).toEqual([]);
    expect(service.loading()).toBeFalse();
    expect(service.pageLoading()).toBeFalse();
    expect(service.error()).toBeNull();
    expect(service.totalPokemonCount()).toBe(1351);
    expect(service.isSearching()).toBeFalse();
    expect(service.hasMore()).toBeTrue();
  });

  describe('loadInitialPage', () => {
    it('should fetch first page, set pokemon list, total count, and loading state for ALL', () => {
      pokedexService.getPokemonPage.and.returnValue(
        of({
          pokemon: [mockBulbasaur, mockCharmander],
          total: 1351,
          hasMore: true,
        }),
      );

      service.loadInitialPage();

      expect(pokedexService.getPokemonPage).toHaveBeenCalledWith(24, 0);
      expect(service.pokemon()).toEqual([mockBulbasaur, mockCharmander]);
      expect(service.totalPokemonCount()).toBe(1351);
      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();
    });

    it('should handle API error gracefully on initial page load', () => {
      pokedexService.getPokemonPage.and.returnValue(
        throwError(() => new Error('Network error')),
      );

      service.loadInitialPage();

      expect(service.error()).toBe('Unable to load Pokémon right now. Please try again later.');
    });
  });

  describe('loadNextPage', () => {
    beforeEach(() => {
      pokedexService.getPokemonPage.and.returnValue(
        of({
          pokemon: [mockBulbasaur],
          total: 100,
          hasMore: true,
        }),
      );
      service.loadInitialPage();
    });

    it('should append newly fetched pokemon and advance page offset', () => {
      pokedexService.getPokemonPage.and.returnValue(
        of({
          pokemon: [mockCharmander, mockSquirtle],
          total: 100,
          hasMore: true,
        }),
      );

      service.loadNextPage();

      expect(pokedexService.getPokemonPage).toHaveBeenCalledWith(24, 1);
      expect(service.pokemon()).toEqual([mockBulbasaur, mockCharmander, mockSquirtle]);
      expect(service.pageLoading()).toBeFalse();
    });

    it('should ignore loadNextPage if pageLoading is already active or hasMore is false', () => {
      pokedexService.getPokemonPage.calls.reset();
      service.allPokemonTotalCount.set(1); // pokemon.length === 1, hasMore === false

      service.loadNextPage();
      expect(pokedexService.getPokemonPage).not.toHaveBeenCalled();

      service.allPokemonTotalCount.set(100);
      (service.pageLoading as any).set(true);

      service.loadNextPage();
      expect(pokedexService.getPokemonPage).not.toHaveBeenCalled();
    });

    it('should set error message if next page request fails', () => {
      pokedexService.getPokemonPage.and.returnValue(
        throwError(() => new Error('Timeout')),
      );

      service.loadNextPage();

      expect(service.error()).toBe('Failed to load more Pokémon. Scroll to retry.');
    });
  });

  describe('Region Selection', () => {
    it('should switch region, update labels, total count, and load regional initial page', () => {
      pokedexService.getPokemonPage.and.returnValue(
        of({
          pokemon: [mockChikorita, mockCyndaquil],
          total: 100,
          hasMore: true,
        }),
      );

      service.selectRegion('JOHTO');

      expect(service.selectedRegion()).toBe('JOHTO');
      expect(service.activeRegionLabel()).toBe('JOHTO REGION');
      expect(service.totalPokemonCount()).toBe(100);
      expect(pokedexService.getPokemonPage).toHaveBeenCalledWith(24, 151);
      expect(service.pokemon()).toEqual([mockChikorita, mockCyndaquil]);
    });

    it('should ignore redundant selectRegion calls for same region', () => {
      pokedexService.getPokemonPage.calls.reset();
      service.selectRegion('ALL');
      expect(pokedexService.getPokemonPage).not.toHaveBeenCalled();
    });

    it('should support selecting region by lower-case name', () => {
      pokedexService.getPokemonPage.and.returnValue(
        of({
          pokemon: [mockSprigatito],
          total: 120,
          hasMore: true,
        }),
      );

      service.selectRegion('paldea');
      expect(service.selectedRegion()).toBe('PALDEA');
      expect(service.activeRegionLabel()).toBe('PALDEA REGION');
      expect(service.totalPokemonCount()).toBe(120);
      expect(pokedexService.getPokemonPage).toHaveBeenCalledWith(24, 905);
    });

    it('should limit pagination fetch to remaining pokemon in region', () => {
      service.selectRegion('HISUI'); // totalCount: 7, startOffset: 898
      pokedexService.getPokemonPage.calls.reset();
      pokedexService.getPokemonPage.and.returnValue(
        of({
          pokemon: [createMockPokemon({ id: 899, name: 'wyrdeer', types: ['normal', 'psychic'] })],
          total: 7,
          hasMore: true,
        }),
      );

      service.loadNextPage();
      expect(pokedexService.getPokemonPage).toHaveBeenCalledWith(7, 898);
    });
  });

  describe('Search & Debounce', () => {
    it('should debounce search input and update searchResults on success', (done: DoneFn) => {
      pokedexService.searchPokemon.and.returnValue(of([mockPikachu]));

      service.search('pika');
      expect(service.searchQuery()).toBe('pika');
      expect(service.isSearching()).toBeTrue();

      setTimeout(() => {
        expect(pokedexService.searchPokemon).toHaveBeenCalledWith('pika');
        expect(service.searchResults()).toEqual([mockPikachu]);
        expect(service.loading()).toBeFalse();
        done();
      }, 350);
    });

    it('should clear searchResults and skip API when query is empty', (done: DoneFn) => {
      service.search('pikachu');

      setTimeout(() => {
        pokedexService.searchPokemon.calls.reset();
        service.search('');

        setTimeout(() => {
          expect(pokedexService.searchPokemon).not.toHaveBeenCalled();
          expect(service.searchResults()).toEqual([]);
          expect(service.loading()).toBeFalse();
          done();
        }, 350);
      }, 350);
    });

    it('should handle search API error and set error message', (done: DoneFn) => {
      pokedexService.searchPokemon.and.returnValue(
        throwError(() => new Error('Search failed')),
      );

      service.search('error');

      setTimeout(() => {
        expect(service.error()).toBe('Unable to search Pokémon right now.');
        expect(service.searchResults()).toEqual([]);
        expect(service.loading()).toBeFalse();
        done();
      }, 350);
    });
  });

  describe('Type Filtering', () => {
    it('should add a type to selectedTypes', () => {
      service.filterByType('grass');
      expect(service.selectedTypes()).toEqual(['grass']);
    });

    it('should toggle off an already selected type', () => {
      service.filterByType('grass');
      service.filterByType('grass');
      expect(service.selectedTypes()).toEqual([]);
    });

    it('should allow up to two simultaneous types and reject a third', () => {
      service.filterByType('grass');
      service.filterByType('poison');
      expect(service.selectedTypes()).toEqual(['grass', 'poison']);

      // Attempt third type
      service.filterByType('fire');
      expect(service.selectedTypes()).toEqual(['grass', 'poison']);
    });

    it('should reset all selected types when selecting "all"', () => {
      service.filterByType('grass');
      service.filterByType('poison');
      expect(service.selectedTypes().length).toBe(2);

      service.filterByType('all');
      expect(service.selectedTypes()).toEqual([]);
    });

    it('should indicate whether an unselected type is disabled when 2 types are active', () => {
      service.filterByType('grass');
      expect(service.isTypeDisabled('fire')).toBeFalse();

      service.filterByType('poison');
      expect(service.isTypeDisabled('grass')).toBeFalse();
      expect(service.isTypeDisabled('poison')).toBeFalse();
      expect(service.isTypeDisabled('fire')).toBeTrue();
      expect(service.isTypeDisabled('water')).toBeTrue();
    });
  });

  describe('clearFilters & toggleFavoritesFilter', () => {
    it('should reset search query, selected types, showFavoritesOnly, and reset region to ALL', () => {
      service.search('pika');
      service.filterByType('electric');
      service.toggleFavoritesFilter();
      service.selectedRegion.set('KANTO');

      expect(service.searchQuery()).toBe('pika');
      expect(service.selectedTypes()).toEqual(['electric']);
      expect(service.showFavoritesOnly()).toBeTrue();
      expect(service.selectedRegion()).toBe('KANTO');

      service.clearFilters();

      expect(service.searchQuery()).toBe('');
      expect(service.selectedTypes()).toEqual([]);
      expect(service.showFavoritesOnly()).toBeFalse();
      expect(service.selectedRegion()).toBe('ALL');
    });
  });

  describe('filteredPokemon Computed', () => {
    beforeEach(() => {
      service.pokemon.set([mockBulbasaur, mockCharmander, mockSquirtle, mockPikachu, mockChikorita, mockSprigatito]);
    });

    it('should return all loaded pokemon in natural sorted order when no filters are active', () => {
      expect(service.filteredPokemon().map((p) => p.id)).toEqual([1, 4, 7, 25, 152, 906]);
    });

    it('should filter pokemon by active region', () => {
      service.selectedRegion.set('KANTO');
      expect(service.filteredPokemon().map((p) => p.id)).toEqual([1, 4, 7, 25]);

      service.selectedRegion.set('JOHTO');
      expect(service.filteredPokemon().map((p) => p.id)).toEqual([152]);

      service.selectedRegion.set('PALDEA');
      expect(service.filteredPokemon().map((p) => p.id)).toEqual([906]);
    });

    it('should filter pokemon by a single type', () => {
      service.filterByType('fire');
      expect(service.filteredPokemon()).toEqual([mockCharmander]);
    });

    it('should filter pokemon with dual-type AND logic', () => {
      service.filterByType('grass');
      service.filterByType('poison');
      expect(service.filteredPokemon()).toEqual([mockBulbasaur]);

      // Fire + Water has no matches
      service.clearFilters();
      service.filterByType('fire');
      service.filterByType('water');
      expect(service.filteredPokemon()).toEqual([]);
    });

    it('should prioritize favorited pokemon at top of list in numerical order within region', () => {
      mockFavoritesSignal.set(new Set([25, 4]));

      const results = service.filteredPokemon();
      expect(results.map((p) => p.id)).toEqual([4, 25, 1, 7, 152, 906]);
    });

    it('should filter strictly to favorites when showFavoritesOnly is true', () => {
      mockFavoritesSignal.set(new Set([25, 999]));
      service.toggleFavoritesFilter();

      const results = service.filteredPokemon();
      expect(results.length).toBe(2);
      expect(results[0].id).toBe(25);
      expect(results[0].name).toBe('pikachu');

      // Unknown #999 synthesized placeholder
      expect(results[1].id).toBe(999);
      expect(results[1].name).toBe('Unknown #999');
    });

    it('should filter search results by region when isSearching is true', () => {
      service.selectedRegion.set('KANTO');
      service.searchQuery.set('a');
      service.searchResults.set([mockBulbasaur, mockCharmander, mockChikorita, mockSprigatito]);

      // Only Kanto results matching 'a'
      expect(service.filteredPokemon().map((p) => p.id)).toEqual([1, 4]);
    });
  });

  describe('hasMore Computed', () => {
    it('should return true when loaded pokemon count is less than total', () => {
      service.pokemon.set([mockBulbasaur]);
      service.allPokemonTotalCount.set(1351);

      expect(service.hasMore()).toBeTrue();
    });

    it('should return false when isSearching is true', () => {
      service.pokemon.set([mockBulbasaur]);
      service.allPokemonTotalCount.set(1351);
      service.searchQuery.set('pika');

      expect(service.hasMore()).toBeFalse();
    });

    it('should return false when showFavoritesOnly is true', () => {
      service.pokemon.set([mockBulbasaur]);
      service.allPokemonTotalCount.set(1351);
      service.showFavoritesOnly.set(true);

      expect(service.hasMore()).toBeFalse();
    });

    it('should return false when all pokemon in region have been loaded', () => {
      service.selectedRegion.set('KANTO'); // Kanto total 151
      const mockArray = new Array(151).fill(mockBulbasaur);
      service.pokemon.set(mockArray);

      expect(service.hasMore()).toBeFalse();
    });
  });
});
