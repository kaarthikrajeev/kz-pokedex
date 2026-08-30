import { Injectable, computed, inject, signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { PokedexService } from './pokedex';
import { FavoritesService } from './favorites';
import { Pokemon } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class PokemonListStateService {
  readonly #pokemonService = inject(PokedexService);
  readonly #favoritesService = inject(FavoritesService);

  readonly pokemon = signal<Pokemon[]>([]);
  readonly searchQuery = signal<string>('');
  readonly selectedTypes = signal<string[]>([]);
  readonly showFavoritesOnly = signal<boolean>(false);
  readonly searchResults = signal<Pokemon[]>([]);
  
  readonly loading = signal(false);
  readonly pageLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalPokemonCount = signal<number>(0);

  readonly pageSize = 24;
  private pageOffset = 0;
  private searchSubject = new Subject<string>();

  readonly isSearching = computed(() => this.searchQuery().trim().length > 0);

  readonly filteredPokemon = computed(() => {
    const isSearching = this.isSearching();
    const search = this.searchQuery().toLowerCase();
    const selectedTypes = this.selectedTypes();
    const favSet = this.#favoritesService.favorites();
    const favoritesOnly = this.showFavoritesOnly();

    let sourceList = isSearching ? this.searchResults() : this.pokemon();

    if (favoritesOnly) {
      const allKnown = new Map<number, Pokemon>();
      this.pokemon().forEach(p => allKnown.set(p.id, p));
      this.searchResults().forEach(p => allKnown.set(p.id, p));
      this.#pokemonService.pokemonCache().forEach(p => allKnown.set(p.id, p));
      
      const combinedList: Pokemon[] = [];
      favSet.forEach(id => {
        if (allKnown.has(id)) {
          combinedList.push(allKnown.get(id)!);
        } else {
          // Create a placeholder for favorites that haven't been loaded yet
          combinedList.push({
            id,
            name: `Unknown #${id}`,
            types: [],
            height: 0,
            weight: 0,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
            spriteShiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
            description: '',
            baseExperience: 0,
            abilities: [],
            stats: [],
            totalStats: 0
          });
        }
      });
      sourceList = combinedList;
    }

    const filtered = sourceList.filter((pokemon) => {
      if (favoritesOnly && !favSet.has(pokemon.id)) {
        return false;
      }
      const matchesSearch = isSearching || !search || pokemon.name.toLowerCase().includes(search);
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.every((type) => pokemon.types.includes(type));
      return matchesSearch && matchesType;
    });

    return [...filtered].sort((a, b) => {
      const aFav = favSet.has(a.id);
      const bFav = favSet.has(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.id - b.id;
    });
  });

  readonly hasMore = computed(() => {
    if (this.isSearching()) {
      return false;
    }
    if (this.showFavoritesOnly()) {
      return false;
    }
    return this.pokemon().length < this.totalPokemonCount();
  });

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query) {
          this.searchResults.set([]);
          this.loading.set(false);
          return of([]);
        }
        this.loading.set(true);
        return this.#pokemonService.searchPokemon(query).pipe(
          catchError(() => {
            this.error.set('Unable to search Pokémon right now.');
            return of([]);
          })
        );
      })
    ).subscribe(results => {
      this.searchResults.set(results);
      this.loading.set(false);
    });
  }

  loadInitialPage(): void {
    this.loading.set(true);
    this.error.set(null);

    this.#pokemonService.getPokemonPage(this.pageSize, 0).subscribe({
      next: (response) => {
        this.pokemon.set(response.pokemon);
        this.totalPokemonCount.set(response.total);
        this.pageOffset = this.pageSize;
      },
      error: () => {
        this.error.set('Unable to load Pokémon right now. Please try again later.');
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  loadNextPage(): void {
    if (this.pageLoading() || !this.hasMore()) {
      return;
    }

    this.pageLoading.set(true);
    this.error.set(null);

    this.#pokemonService.getPokemonPage(this.pageSize, this.pageOffset).subscribe({
      next: (response) => {
        this.pokemon.update((current) => [...current, ...response.pokemon]);
        this.pageOffset += response.pokemon.length;
      },
      error: () => {
        this.error.set('Failed to load more Pokémon. Scroll to retry.');
      },
      complete: () => {
        this.pageLoading.set(false);
      },
    });
  }

  search(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  toggleFavoritesFilter(): void {
    this.showFavoritesOnly.update((value) => !value);
  }

  filterByType(type: string): void {
    if (type === 'all') {
      this.selectedTypes.set([]);
      return;
    }

    this.selectedTypes.update((selected) => {
      const isSelected = selected.includes(type);
      if (isSelected) {
        return selected.filter((t) => t !== type);
      }
      if (selected.length >= 2) {
        return selected;
      }
      return [...selected, type];
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedTypes.set([]);
    this.showFavoritesOnly.set(false);
  }

  isTypeDisabled(type: string): boolean {
    const selected = this.selectedTypes();
    return selected.length >= 2 && !selected.includes(type);
  }
}
