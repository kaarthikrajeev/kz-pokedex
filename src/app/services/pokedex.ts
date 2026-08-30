import { Injectable, signal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { map, catchError, switchMap, shareReplay } from 'rxjs/operators';
import { Pokemon, PokemonAbility, PokemonStat, PaginatedResponse, NamedAPIResource } from '../models/types';
import { sanitizePokemonType, sanitizeStatName, VALID_STAT_NAMES } from '../models/pokemon-types';

const POKE_API_BASE_URL = 'https://pokeapi.co/api/v2';
const POKEMON_SPRITE_BASE_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const POKEMON_SHINY_SPRITE_BASE_URL = `${POKEMON_SPRITE_BASE_URL}/shiny`;
const POKEMON_CACHE_STORAGE_KEY = 'pokedex_pokemon_details_cache_v2';

@Injectable({
  providedIn: 'root',
})
export class PokedexService {
  private readonly cacheSignal = signal<Map<string, Pokemon>>(this.loadInitialCache());
  public readonly pokemonCache: Signal<Map<string, Pokemon>> = this.cacheSignal.asReadonly();
  private readonly pokemonRequests = new Map<string, Observable<Pokemon>>();

  constructor(private readonly http: HttpClient) {}

  getPokemonPage(
    limit: number,
    offset: number,
  ): Observable<{ pokemon: Pokemon[]; total: number; hasMore: boolean }> {
    return this.http.get<PaginatedResponse<NamedAPIResource>>(`${POKE_API_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`).pipe(
      map((response): { pokemon: Pokemon[]; total: number } => {
        const results = Array.isArray(response?.results) ? response.results : [];
        const total = Number(response?.count ?? 0);

        return {
          pokemon: results
            .map((entry): Pokemon | null => {
              const name = String(entry.name ?? '').trim();
              const url = String(entry.url ?? '').trim();
              const id = this.extractIdFromUrl(url);

              if (!id || !name) {
                return null;
              }

              return {
                id,
                name,
                types: [],
                height: 0,
                weight: 0,
                sprite: this.getSpriteUrl(id),
                spriteShiny: this.getShinySpriteUrl(id),
                description: '',
              };
            })
            .filter((pokemon): pokemon is Pokemon => pokemon !== null),
          total,
        };
      }),
      switchMap(({ pokemon: pokemonList, total }) =>
        this.hydratePokemonTypes(pokemonList).pipe(
          map((pokemonWithTypes) => ({
            pokemon: pokemonWithTypes,
            total,
            hasMore: offset + pokemonList.length < total,
          })),
        )
      ),
      catchError(() => throwError(() => new Error('Unable to load Pokémon page.'))),
    );
  }

  getPokemonDetails(nameOrId: string | number): Observable<Pokemon> {
    const cacheKey = String(nameOrId).toLowerCase();
    const cachedPokemon = this.pokemonCache().get(cacheKey);

    if (cachedPokemon && this.hasCompleteDetails(cachedPokemon)) {
      return of(cachedPokemon);
    }

    const cachedRequest = this.pokemonRequests.get(cacheKey);

    if (cachedRequest) {
      return cachedRequest;
    }

    const request = this.http.get<any>(`${POKE_API_BASE_URL}/pokemon/${nameOrId}`).pipe(
      switchMap(pokemon => {
        const speciesUrl = pokemon?.species?.url;
        const speciesReq = speciesUrl 
          ? this.http.get<any>(speciesUrl)
          : this.http.get<any>(`${POKE_API_BASE_URL}/pokemon-species/${pokemon.id}`);
          
        return speciesReq.pipe(
          map(species => ({ pokemon, species })),
          catchError(() => of({ pokemon, species: null }))
        );
      }),
      map(({ pokemon, species }) => {
        const mappedPokemon = this.mapPokemonDetails(pokemon, species);
        this.savePokemonToCache(mappedPokemon);
        this.pokemonRequests.delete(cacheKey);
        return mappedPokemon;
      }),
      catchError(() => {
        this.pokemonRequests.delete(cacheKey);
        return throwError(() => new Error('Unable to load Pokémon details right now.'));
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.pokemonRequests.set(cacheKey, request);
    return request;
  }

  private searchIndex: { id: number; name: string }[] | null = null;
  private searchIndexRequest: Observable<{ id: number; name: string }[]> | null = null;

  getSearchIndex(): Observable<{ id: number; name: string }[]> {
    if (this.searchIndex) return of(this.searchIndex);
    if (this.searchIndexRequest) return this.searchIndexRequest;
    
    this.searchIndexRequest = this.http.get<PaginatedResponse<NamedAPIResource>>(`${POKE_API_BASE_URL}/pokemon?limit=100000`).pipe(
      map((response): { id: number; name: string }[] => {
        const results = Array.isArray(response?.results) ? response.results : [];
        const index = results.map((entry) => ({
          id: this.extractIdFromUrl(entry.url),
          name: String(entry.name ?? '').trim()
        })).filter((p) => p.id && p.name);
        this.searchIndex = index;
        return index;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.searchIndexRequest;
  }

  searchPokemon(query: string): Observable<Pokemon[]> {
    query = query.trim().toLowerCase();
    if (!query) {
      return of([]);
    }

    const isNumeric = /^\d+$/.test(query);
    if (isNumeric) {
      return this.getPokemonDetails(query).pipe(
        map(p => [p]),
        catchError(() => of([]))
      );
    }

    return this.getSearchIndex().pipe(
      switchMap(index => {
        const exactMatch = index.find(p => p.name === query);
        if (exactMatch) {
          return this.getPokemonDetails(exactMatch.id).pipe(
            map(p => [p]),
            catchError(() => of([]))
          );
        }

        const matches = index.filter(p => p.name.includes(query)).slice(0, 50);
        if (matches.length === 0) return of([]);

        const pokemonList: Pokemon[] = matches.map(m => ({
          id: m.id,
          name: m.name,
          types: [],
          height: 0,
          weight: 0,
          sprite: this.getSpriteUrl(m.id),
          spriteShiny: this.getShinySpriteUrl(m.id),
          description: ''
        }));

        return this.hydratePokemonTypes(pokemonList);
      })
    );
  }

  private hydratePokemonTypes(pokemonList: Pokemon[]): Observable<Pokemon[]> {
    if (!pokemonList.length) {
      return of([]);
    }
    return forkJoin(
      pokemonList.map((pokemon) => {
        const cached = this.pokemonCache().get(String(pokemon.id));
        if (cached && cached.types && cached.types.length > 0) {
          return of({
            ...pokemon,
            types: cached.types,
          });
        }

        return this.http.get<any>(`${POKE_API_BASE_URL}/pokemon/${pokemon.id}`).pipe(
          map((details) => ({
            ...pokemon,
            types: Array.isArray(details?.types)
              ? details.types.map((entry: any) => sanitizePokemonType(entry.type?.name)).filter((t: string) => t !== 'unknown')
              : [],
          })),
          catchError(() => of(pokemon)),
        );
      }),
    );
  }

  clearCache(): void {
    this.cacheSignal.set(new Map());
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(POKEMON_CACHE_STORAGE_KEY);
      } catch (error) {
        console.warn('Failed to clear Pokémon cache from localStorage:', error);
      }
    }
  }

  cachePokemon(pokemon: Pokemon): void {
    this.savePokemonToCache(pokemon);
  }

  private savePokemonToCache(pokemon: Pokemon): void {
    const updatedMap = new Map(this.cacheSignal());
    updatedMap.set(String(pokemon.id), pokemon);
    if (pokemon.name) {
      updatedMap.set(pokemon.name.toLowerCase(), pokemon);
    }
    this.cacheSignal.set(updatedMap);
    this.persistToStorage(updatedMap);
  }

  private loadInitialCache(): Map<string, Pokemon> {
    const map = new Map<string, Pokemon>();
    if (typeof window === 'undefined' || !window.localStorage) {
      return map;
    }

    try {
      const rawData = localStorage.getItem(POKEMON_CACHE_STORAGE_KEY);
      if (rawData) {
        const parsed: Pokemon[] = JSON.parse(rawData);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && typeof item.id === 'number') {
              map.set(String(item.id), item);
              if (item.name) {
                map.set(item.name.toLowerCase(), item);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load Pokémon cache from localStorage:', error);
    }

    return map;
  }

  private persistToStorage(map: Map<string, Pokemon>): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const uniquePokemonMap = new Map<number, Pokemon>();
      for (const pokemon of map.values()) {
        if (pokemon && typeof pokemon.id === 'number') {
          uniquePokemonMap.set(pokemon.id, pokemon);
        }
      }
      const uniqueList = Array.from(uniquePokemonMap.values());
      localStorage.setItem(POKEMON_CACHE_STORAGE_KEY, JSON.stringify(uniqueList));
    } catch (error) {
      console.warn('Failed to persist Pokémon cache to localStorage:', error);
    }
  }

  private hasCompleteDetails(pokemon: Pokemon): boolean {
    return Boolean(
      pokemon &&
        Array.isArray(pokemon.stats) &&
        pokemon.stats.length > 0 &&
        Array.isArray(pokemon.abilities) &&
        pokemon.abilities.length > 0,
    );
  }

  private getSpriteUrl(id: number): string {
    return `${POKEMON_SPRITE_BASE_URL}/${id}.png`;
  }

  private getShinySpriteUrl(id: number): string {
    return `${POKEMON_SHINY_SPRITE_BASE_URL}/${id}.png`;
  }

  private extractIdFromUrl(url: string): number {
    const match = url.match(/\/pokemon\/(\d+)\//);
    return match ? Number(match[1]) : 0;
  }

  private mapPokemonDetails(pokemon: any, species: any): Pokemon {
    const types = Array.isArray(pokemon?.types)
      ? pokemon.types.map((entry: any) => sanitizePokemonType(entry.type?.name)).filter((t: string) => t !== 'unknown')
      : [];

    const baseExperience = Number(pokemon?.base_experience ?? 0);

    const abilities: PokemonAbility[] = Array.isArray(pokemon?.abilities)
      ? pokemon.abilities
          .map((entry: any) => ({
            name: String(entry.ability?.name ?? '').trim(),
            isHidden: Boolean(entry.is_hidden),
          }))
          .filter((a: PokemonAbility) => Boolean(a.name))
      : [];

    const statLabels: Record<string, string> = VALID_STAT_NAMES;

    const rawStats = Array.isArray(pokemon?.stats) ? pokemon.stats : [];
    let totalStats = 0;

    const stats: PokemonStat[] = Object.keys(statLabels).map((statKey) => {
      const sanitizedKey = sanitizeStatName(statKey);
      const found = rawStats.find((s: any) => sanitizeStatName(s.stat?.name) === sanitizedKey);
      const baseStat = Number(found?.base_stat ?? 0);
      totalStats += baseStat;
      const percentage = Math.min(100, Math.round((baseStat / 255) * 100));

      return {
        name: sanitizedKey,
        displayName: statLabels[statKey],
        baseStat,
        percentage,
      };
    });

    return {
      id: Number(pokemon?.id ?? 0),
      name: String(pokemon?.name ?? ''),
      types,
      height: Number((pokemon?.height ?? 0) / 10),
      weight: Number((pokemon?.weight ?? 0) / 10),
      sprite: pokemon?.sprites?.front_default ?? this.getSpriteUrl(Number(pokemon?.id ?? 0)),
      spriteShiny:
        pokemon?.sprites?.front_shiny ??
        pokemon?.sprites?.front_default ??
        this.getSpriteUrl(Number(pokemon?.id ?? 0)),
      description: this.getDescription(species),
      baseExperience,
      abilities,
      stats,
      totalStats,
    };
  }

  private getDescription(species: any): string {
    const entries = Array.isArray(species?.flavor_text_entries) ? species.flavor_text_entries : [];
    const englishEntry = entries.find((entry: any) => entry.language?.name === 'en');
    const description =
      englishEntry?.flavor_text ?? entries[0]?.flavor_text ?? 'No description available.';

    return description
      .replace(/\f/g, ' ')
      .replace(/\s*\n\s*/g, ' ')
      .trim();
  }
}
