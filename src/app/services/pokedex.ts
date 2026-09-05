import { Injectable, signal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { map, catchError, switchMap, shareReplay } from 'rxjs/operators';
import {
  Pokemon,
  PokemonAbility,
  PokemonStat,
  PaginatedResponse,
  NamedAPIResource,
  EvolutionChain,
  EvolutionNode,
  EvolutionPokemon,
  EvolutionRequirement,
  EvolutionStage,
  EvolutionStagePokemon,
} from '../models/types';
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
  private readonly evolutionChainCache = new Map<string, EvolutionChain>();
  private readonly evolutionRequests = new Map<string, Observable<EvolutionChain>>();

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
      if (!cachedPokemon.cryUrl && cachedPokemon.id) {
        cachedPokemon.cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${cachedPokemon.id}.ogg`;
      }
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
    this.evolutionChainCache.clear();
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

  getEvolutionChain(urlOrId: string | number): Observable<EvolutionChain> {
    const rawKey = String(urlOrId).trim();
    if (!rawKey) {
      return throwError(() => new Error('Invalid evolution chain identifier.'));
    }

    const cacheKey = rawKey.toLowerCase();
    const cached = this.evolutionChainCache.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    const cachedRequest = this.evolutionRequests.get(cacheKey);
    if (cachedRequest) {
      return cachedRequest;
    }

    const url = rawKey.startsWith('http')
      ? rawKey
      : `${POKE_API_BASE_URL}/evolution-chain/${rawKey}`;

    const request = this.http.get<any>(url).pipe(
      switchMap((apiResponse) => this.hydrateAndBuildEvolutionChain(apiResponse, url)),
      map((chain) => {
        this.saveEvolutionChainToCache(chain, url);
        this.evolutionRequests.delete(cacheKey);
        return chain;
      }),
      catchError(() => {
        this.evolutionRequests.delete(cacheKey);
        return throwError(() => new Error('Unable to load evolution chain.'));
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.evolutionRequests.set(cacheKey, request);
    return request;
  }

  getEvolutionChainForPokemon(pokemon: Pokemon): Observable<EvolutionChain> {
    if (pokemon.evolutionChainUrl) {
      return this.getEvolutionChain(pokemon.evolutionChainUrl);
    }

    return this.http.get<any>(`${POKE_API_BASE_URL}/pokemon-species/${pokemon.id}`).pipe(
      switchMap((species) => {
        const evoUrl = species?.evolution_chain?.url;
        if (!evoUrl) {
          return throwError(() => new Error('No evolution chain found for species.'));
        }
        return this.getEvolutionChain(evoUrl);
      }),
      catchError(() => throwError(() => new Error('Unable to load evolution chain.'))),
    );
  }

  private saveEvolutionChainToCache(chain: EvolutionChain, url: string): void {
    const chainIdKey = String(chain.id).toLowerCase();
    this.evolutionChainCache.set(chainIdKey, chain);
    this.evolutionChainCache.set(url.toLowerCase(), chain);
    this.indexSpeciesInEvolutionChain(chain.root, chain);
  }

  private indexSpeciesInEvolutionChain(node: EvolutionNode, chain: EvolutionChain): void {
    if (!node?.pokemon) return;
    this.evolutionChainCache.set(`species:${node.pokemon.id}`, chain);
    this.evolutionChainCache.set(`species:${node.pokemon.name.toLowerCase()}`, chain);
    for (const child of node.evolvesTo) {
      this.indexSpeciesInEvolutionChain(child, chain);
    }
  }

  private collectSpeciesFromChain(
    chainNode: any,
    collected: { id: number; name: string }[] = [],
  ): { id: number; name: string }[] {
    if (!chainNode || !chainNode.species) {
      return collected;
    }

    const speciesUrl = String(chainNode.species.url ?? '');
    const id = this.extractSpeciesIdFromUrl(speciesUrl);
    const name = String(chainNode.species.name ?? '').trim();

    if (id && name) {
      collected.push({ id, name });
    }

    const evolvesTo = Array.isArray(chainNode.evolves_to) ? chainNode.evolves_to : [];
    for (const child of evolvesTo) {
      this.collectSpeciesFromChain(child, collected);
    }

    return collected;
  }

  private hydrateAndBuildEvolutionChain(
    apiResponse: any,
    requestUrl: string,
  ): Observable<EvolutionChain> {
    const rawChain = apiResponse?.chain;
    if (!rawChain) {
      return throwError(() => new Error('Malformed evolution chain data.'));
    }

    const allSpecies = this.collectSpeciesFromChain(rawChain);
    const uniqueIds = Array.from(new Set(allSpecies.map((s) => s.id)));

    const typeObservables = uniqueIds.map((id) => {
      const cached = this.pokemonCache().get(String(id));
      if (cached && cached.types && cached.types.length > 0) {
        return of({ id, types: cached.types });
      }
      return this.http.get<any>(`${POKE_API_BASE_URL}/pokemon/${id}`).pipe(
        map((details) => ({
          id,
          types: Array.isArray(details?.types)
            ? details.types
                .map((entry: any) => sanitizePokemonType(entry.type?.name))
                .filter((t: string) => t !== 'unknown')
            : [],
        })),
        catchError(() => of({ id, types: [] })),
      );
    });

    return (typeObservables.length ? forkJoin(typeObservables) : of([])).pipe(
      map((typeResults) => {
        const typesMap = new Map<number, string[]>();
        for (const res of typeResults) {
          typesMap.set(res.id, res.types);
        }

        const chainId = Number(apiResponse?.id ?? this.extractSpeciesIdFromUrl(requestUrl));
        const babyTriggerItem = apiResponse?.baby_trigger_item?.name
          ? formatItemName(apiResponse.baby_trigger_item.name)
          : null;

        const rootNode = this.parseEvolutionNode(rawChain, typesMap);
        const stages = this.buildEvolutionStages(rootNode);
        const hasEvolutions = rootNode.evolvesTo.length > 0;

        return {
          id: chainId,
          babyTriggerItem,
          root: rootNode,
          stages,
          hasEvolutions,
        };
      }),
    );
  }

  private parseEvolutionNode(rawNode: any, typesMap: Map<number, string[]>): EvolutionNode {
    const speciesUrl = String(rawNode?.species?.url ?? '');
    const id = this.extractSpeciesIdFromUrl(speciesUrl);
    const name = String(rawNode?.species?.name ?? '').trim();
    const isBaby = Boolean(rawNode?.is_baby);
    const types = typesMap.get(id) ?? [];
    const requirements = formatEvolutionRequirements(rawNode?.evolution_details ?? []);

    const rawEvolvesTo = Array.isArray(rawNode?.evolves_to) ? rawNode.evolves_to : [];
    const evolvesTo: EvolutionNode[] = rawEvolvesTo.map((child: any) =>
      this.parseEvolutionNode(child, typesMap),
    );

    return {
      pokemon: {
        id,
        name,
        sprite: this.getSpriteUrl(id),
        spriteShiny: this.getShinySpriteUrl(id),
        types,
        isBaby,
      },
      requirements,
      evolvesTo,
    };
  }

  private buildEvolutionStages(root: EvolutionNode): EvolutionStage[] {
    const stageMap = new Map<number, EvolutionStagePokemon[]>();

    const traverse = (node: EvolutionNode, depth: number, fromName?: string) => {
      if (!stageMap.has(depth)) {
        stageMap.set(depth, []);
      }

      stageMap.get(depth)!.push({
        pokemon: node.pokemon,
        fromPokemonName: fromName,
        requirements: node.requirements,
      });

      for (const child of node.evolvesTo) {
        traverse(child, depth + 1, node.pokemon.name);
      }
    };

    traverse(root, 0);

    const stages: EvolutionStage[] = [];
    const sortedDepths = Array.from(stageMap.keys()).sort((a, b) => a - b);
    for (const depth of sortedDepths) {
      stages.push({
        stageIndex: depth,
        pokemon: stageMap.get(depth)!,
      });
    }

    return stages;
  }

  private extractSpeciesIdFromUrl(url: string): number {
    const match = url.match(/\/(?:pokemon-species|pokemon|evolution-chain)\/(\d+)\/?/);
    return match ? Number(match[1]) : 0;
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
              if (!item.cryUrl && !item.cries) {
                item.cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${item.id}.ogg`;
              }
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

    const latestCry = pokemon?.cries?.latest ? String(pokemon.cries.latest) : null;
    const legacyCry = pokemon?.cries?.legacy ? String(pokemon.cries.legacy) : null;
    const cryUrl = latestCry || legacyCry || null;

    const mapped: Pokemon = {
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
      cries: {
        latest: latestCry,
        legacy: legacyCry,
      },
      cryUrl,
    };

    if (species?.evolution_chain?.url) {
      mapped.evolutionChainUrl = String(species.evolution_chain.url);
    }

    return mapped;
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

export function formatItemName(name: string): string {
  if (!name) return '';
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatEvolutionRequirements(details: any[]): EvolutionRequirement[] {
  if (!Array.isArray(details) || details.length === 0) {
    return [{ description: 'Base Stage' }];
  }

  return details.map((detail) => {
    const parts: string[] = [];

    const minLevel = detail?.min_level != null ? Number(detail.min_level) : null;
    const item = detail?.item?.name ? formatItemName(detail.item.name) : null;
    const heldItem = detail?.held_item?.name ? formatItemName(detail.held_item.name) : null;
    const trigger = String(detail?.trigger?.name ?? '').trim();
    const minHappiness = detail?.min_happiness != null ? Number(detail.min_happiness) : null;
    const minAffection = detail?.min_affection != null ? Number(detail.min_affection) : null;
    const minBeauty = detail?.min_beauty != null ? Number(detail.min_beauty) : null;
    const rawTimeOfDay = String(detail?.time_of_day ?? '').trim();
    const timeOfDay = rawTimeOfDay
      ? rawTimeOfDay.charAt(0).toUpperCase() + rawTimeOfDay.slice(1)
      : null;
    const location = detail?.location?.name ? formatItemName(detail.location.name) : null;
    const knownMove = detail?.known_move?.name ? formatItemName(detail.known_move.name) : null;
    const knownMoveType = detail?.known_move_type?.name
      ? formatItemName(detail.known_move_type.name)
      : null;
    const tradeSpecies = detail?.trade_species?.name
      ? formatItemName(detail.trade_species.name)
      : null;
    const partySpecies = detail?.party_species?.name
      ? formatItemName(detail.party_species.name)
      : null;
    const partyType = detail?.party_type?.name ? formatItemName(detail.party_type.name) : null;
    const needsOverworldRain = Boolean(detail?.needs_overworld_rain);
    const turnUpsideDown = Boolean(detail?.turn_upside_down);

    let gender: string | null = null;
    if (detail?.gender === 1) gender = 'Female';
    else if (detail?.gender === 2) gender = 'Male';

    let relativePhysicalStats: string | null = null;
    if (detail?.relative_physical_stats === 1) relativePhysicalStats = 'Atk > Def';
    else if (detail?.relative_physical_stats === -1) relativePhysicalStats = 'Atk < Def';
    else if (detail?.relative_physical_stats === 0) relativePhysicalStats = 'Atk = Def';

    if (minLevel != null) {
      parts.push(`Level ${minLevel}`);
    } else if (item) {
      parts.push(`Use ${item}`);
    } else if (trigger === 'trade') {
      parts.push('Trade');
    } else if (trigger === 'shed') {
      parts.push('Shed');
    } else if (trigger && trigger !== 'level-up') {
      parts.push(formatItemName(trigger));
    }

    if (heldItem) {
      parts.push(`Hold ${heldItem}`);
    }

    if (minHappiness != null) {
      parts.push('High Friendship');
    }

    if (minAffection != null) {
      parts.push('High Affection');
    }

    if (minBeauty != null) {
      parts.push('High Beauty');
    }

    if (timeOfDay) {
      parts.push(timeOfDay);
    }

    if (location) {
      parts.push(`at ${location}`);
    }

    if (knownMove) {
      parts.push(`Learn ${knownMove}`);
    }

    if (knownMoveType) {
      parts.push(`${knownMoveType} Move`);
    }

    if (tradeSpecies) {
      parts.push(`for ${tradeSpecies}`);
    }

    if (partySpecies) {
      parts.push(`with ${partySpecies}`);
    }

    if (partyType) {
      parts.push(`with ${partyType}-type`);
    }

    if (gender) {
      parts.push(`(${gender})`);
    }

    if (relativePhysicalStats) {
      parts.push(relativePhysicalStats);
    }

    if (needsOverworldRain) {
      parts.push('During Rain');
    }

    if (turnUpsideDown) {
      parts.push('Upside Down');
    }

    const description = parts.length > 0 ? parts.join(' + ') : 'Level Up';

    return {
      trigger,
      minLevel,
      item,
      heldItem,
      timeOfDay,
      minHappiness,
      minAffection,
      minBeauty,
      knownMove,
      knownMoveType,
      location,
      gender,
      tradeSpecies,
      partySpecies,
      partyType,
      relativePhysicalStats,
      needsOverworldRain,
      turnUpsideDown,
      description,
    };
  });
}
