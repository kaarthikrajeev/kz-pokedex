import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { map, catchError, switchMap, shareReplay } from 'rxjs/operators';
import { Pokemon } from '../models/types';

const POKE_API_BASE_URL = 'https://pokeapi.co/api/v2';
const POKEMON_SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const POKEMON_SHINY_SPRITE_BASE_URL = `${POKEMON_SPRITE_BASE_URL}/shiny`;

@Injectable({
  providedIn: 'root',
})
export class PokedexService {
  private readonly pokemonCache = new Map<string, Pokemon>();
  private readonly pokemonRequests = new Map<string, Observable<Pokemon>>();

  constructor(private readonly http: HttpClient) {}

  getPokedex(): Observable<Pokemon[]> {
    return this.http.get<any>(`${POKE_API_BASE_URL}/pokedex/kanto`).pipe(
      map((response): Pokemon[] => {
        const entries = response?.pokemon_entries ?? [];

        return entries
          .map((entry: any) => {
            const id = Number(entry.entry_number ?? 0);
            const name = String(entry.pokemon_species?.name ?? '').trim();

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
              description: ''
            } satisfies Pokemon;
          })
          .filter((pokemon: any): pokemon is Pokemon => Boolean(pokemon));
      }),
      switchMap((pokemonList: Pokemon[]) =>
        forkJoin(
          pokemonList.map((pokemon) =>
            this.http.get<any>(`${POKE_API_BASE_URL}/pokemon/${pokemon.id}`).pipe(
              map((details) => ({
                ...pokemon,
                types: Array.isArray(details?.types)
                  ? details.types.map((entry: any) => entry.type?.name).filter(Boolean)
                  : []
              })),
              catchError(() => of(pokemon))
            )
          )
        )
      ),
      catchError(() => throwError(() => new Error('Unable to load the Pokémon list right now.')))
    );
  }

  getPokemonDetails(nameOrId: string | number): Observable<Pokemon> {
    const cacheKey = String(nameOrId).toLowerCase();
    const cachedPokemon = this.pokemonCache.get(cacheKey);

    if (cachedPokemon) {
      return of(cachedPokemon);
    }

    const cachedRequest = this.pokemonRequests.get(cacheKey);

    if (cachedRequest) {
      return cachedRequest;
    }

    const request = forkJoin({
      pokemon: this.http.get<any>(`${POKE_API_BASE_URL}/pokemon/${nameOrId}`),
      species: this.http.get<any>(`${POKE_API_BASE_URL}/pokemon-species/${nameOrId}`)
    }).pipe(
      map(({ pokemon, species }) => {
        const mappedPokemon = this.mapPokemonDetails(pokemon, species);
        this.pokemonCache.set(cacheKey, mappedPokemon);
        return mappedPokemon;
      }),
      catchError(() => {
        this.pokemonRequests.delete(cacheKey);
        return throwError(() => new Error('Unable to load Pokémon details right now.'));
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.pokemonRequests.set(cacheKey, request);
    return request;
  }

  private getSpriteUrl(id: number): string {
    return `${POKEMON_SPRITE_BASE_URL}/${id}.png`;
  }

  private getShinySpriteUrl(id: number): string {
    return `${POKEMON_SHINY_SPRITE_BASE_URL}/${id}.png`;
  }

  private mapPokemonDetails(pokemon: any, species: any): Pokemon {
    const types = Array.isArray(pokemon?.types)
      ? pokemon.types.map((entry: any) => entry.type?.name).filter(Boolean)
      : [];

    return {
      id: Number(pokemon?.id ?? 0),
      name: String(pokemon?.name ?? ''),
      types,
      height: Number((pokemon?.height ?? 0) / 10),
      weight: Number((pokemon?.weight ?? 0) / 10),
      sprite: pokemon?.sprites?.front_default ?? this.getSpriteUrl(Number(pokemon?.id ?? 0)),
      spriteShiny: pokemon?.sprites?.front_shiny ?? pokemon?.sprites?.front_default ?? this.getSpriteUrl(Number(pokemon?.id ?? 0)),
      description: this.getDescription(species)
    };
  }

  private getDescription(species: any): string {
    const entries = Array.isArray(species?.flavor_text_entries) ? species.flavor_text_entries : [];
    const englishEntry = entries.find((entry: any) => entry.language?.name === 'en');
    const description = englishEntry?.flavor_text ?? entries[0]?.flavor_text ?? 'No description available.';

    return description.replace(/\f/g, ' ').replace(/\s*\n\s*/g, ' ').trim();
  }
}
