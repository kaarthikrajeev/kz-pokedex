import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { PokedexService } from './services/pokedex';
import { Pokemon } from './models/types';
import { PokemonCardComponent } from './shared/pokemon-card/pokemon-card';
import { PokemonDetailsComponent } from './shared/pokemon-details/pokemon-details';
import { PokemonLoaderComponent } from './shared/pokemon-loader/pokemon-loader';

@Component({
  selector: 'app-root',
  imports: [PokemonCardComponent, PokemonDetailsComponent, PokemonLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None
})
export class App {
  #pokemonService = inject(PokedexService);
  #pokemon = signal<Pokemon[]>([]);
  protected filteredPokemon = signal<Pokemon[]>([]);
  protected activePokemon = signal<Pokemon | null>(null);
  protected isShiny = signal(false);
  protected loading = signal(false);
  protected detailsLoading = signal(false);
  protected error = signal<string | null>(null);
  protected currentSprite = computed(() => {
    const pokemon = this.activePokemon();

    if (!pokemon) {
      return '';
    }

    const normalSprite = pokemon.sprite ?? '';
    const selectedSprite = this.isShiny() && pokemon.spriteShiny ? pokemon.spriteShiny : normalSprite;

    if (!this.failedSpriteUrls().has(selectedSprite)) {
      return selectedSprite;
    }

    return this.isShiny() && normalSprite && !this.failedSpriteUrls().has(normalSprite)
      ? normalSprite
      : this.fallbackSprite;
  });

  private readonly failedSpriteUrls = signal<Set<string>>(new Set());
  private readonly preloadedSprites = new Set<string>();
  private detailRequestId = 0;
  private readonly fallbackSprite = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect width="96" height="96" fill="#dfe6ef"/>
      <rect x="12" y="12" width="72" height="72" fill="#f6f1ea" stroke="#111111" stroke-width="4"/>
      <text x="50%" y="54%" text-anchor="middle" font-size="30" font-family="Arial, sans-serif" fill="#111111">?</text>
    </svg>
  `)}`;

  ngOnInit() {
    this.loading.set(true);
    this.error.set(null);

    this.#pokemonService.getPokedex().subscribe({
      next: (pokemon) => {
        this.#pokemon.set(pokemon);
        this.filteredPokemon.set(pokemon);
      },
      error: () => {
        this.error.set('Unable to load the Pokémon list right now. Please try again later.');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  protected search(event: Event) {
    const term = (event.target as HTMLInputElement | null)?.value.trim().toLowerCase() ?? '';
    const filtered = !term
      ? this.#pokemon()
      : this.#pokemon().filter((pokemon) => pokemon.name.toLowerCase().includes(term));

    this.filteredPokemon.set(filtered);
  }

  protected openPokemonDetails(pokemon: Pokemon) {
    const requestId = ++this.detailRequestId;
    this.detailsLoading.set(true);
    this.error.set(null);
    if (this.activePokemon()?.id !== pokemon.id) {
      this.isShiny.set(false);
    }

    this.#pokemonService.getPokemonDetails(pokemon.name).subscribe({
      next: (pokemonDetails) => {
        if (requestId !== this.detailRequestId) {
          return;
        }

        this.activePokemon.set(pokemonDetails);
        this.detailsLoading.set(false);
        this.preloadSprite(pokemonDetails.sprite);
        this.preloadSprite(pokemonDetails.spriteShiny);
      },
      error: () => {
        if (requestId !== this.detailRequestId) {
          return;
        }

        this.activePokemon.set(null);
        this.detailsLoading.set(false);
        this.error.set('Unable to load Pokémon details right now.');
      }
    });
  }

  protected toggleShiny(event: Event): void {
    event.stopPropagation();
    this.isShiny.update((value) => !value);
  }

  protected closeDetails(): void {
    this.detailRequestId++;
    this.activePokemon.set(null);
    this.detailsLoading.set(false);
    this.isShiny.set(false);
  }

  protected onDetailsToggle(event: Event): void {
    if ((event as ToggleEvent).newState === 'closed' && this.activePokemon()) {
      this.closeDetails();
    }
  }

  protected formatNumber(value: number): string {
    return value.toString().padStart(3, '0');
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;

    if (!img || !img.currentSrc || img.currentSrc === this.fallbackSprite) {
      return;
    }

    this.failedSpriteUrls.update((urls) => new Set(urls).add(img.currentSrc));
  }

  protected spriteUrl(url: string | null): string {
    if (!url || this.failedSpriteUrls().has(url)) {
      return this.fallbackSprite;
    }

    return url;
  }

  private preloadSprite(url: string | null | undefined): void {
    if (!url || this.preloadedSprites.has(url)) {
      return;
    }

    this.preloadedSprites.add(url);
    const image = new Image();
    image.src = url;
  }
}

