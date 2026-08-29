import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { PokedexService } from './services/pokedex';
import { Pokemon } from './models/types';
import { PokemonCardComponent } from './shared/pokemon-card/pokemon-card';
import { PokemonDetailsComponent } from './shared/pokemon-details/pokemon-details';
import { PokemonLoaderComponent } from './shared/pokemon-loader/pokemon-loader';
import { POKEMON_TYPES } from './models/pokemon-types';

@Component({
  selector: 'app-root',
  imports: [CommonModule, PokemonCardComponent, PokemonDetailsComponent, PokemonLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None,
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  readonly #document = inject(DOCUMENT);
  #pokemonService = inject(PokedexService);
  #pokemon = signal<Pokemon[]>([]);
  protected searchQuery = signal<string>('');
  protected selectedTypes = signal<string[]>([]);
  protected activePokemon = signal<Pokemon | null>(null);

  constructor() {
    effect((onCleanup) => {
      const isOpen = Boolean(this.activePokemon());
      const body = this.#document?.body;
      if (body) {
        body.classList.toggle('modal-open', isOpen);
        if (isOpen) {
          body.style.overflow = 'hidden';
        } else {
          body.style.removeProperty('overflow');
        }
      }

      onCleanup(() => {
        if (body) {
          body.classList.remove('modal-open');
          body.style.removeProperty('overflow');
        }
      });
    });
  }
  protected isShiny = signal(false);
  protected loading = signal(false);
  protected pageLoading = signal(false);
  protected detailsLoading = signal(false);
  protected error = signal<string | null>(null);
  protected pokemonTypes = POKEMON_TYPES;

  @ViewChild('sentinel', { static: false }) sentinelRef?: ElementRef<HTMLElement>;

  protected readonly pageSize = 24;
  private pageOffset = 0;
  private totalPokemon = 0;
  private intersectionObserver: IntersectionObserver | null = null;

  protected filteredPokemon = computed(() => {
    const allPokemon = this.#pokemon();
    const search = this.searchQuery().toLowerCase();
    const selectedTypes = this.selectedTypes();

    return allPokemon.filter((pokemon) => {
      const matchesSearch = !search || pokemon.name.toLowerCase().includes(search);
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.every((type) => pokemon.types.includes(type));
      return matchesSearch && matchesType;
    });
  });

  protected hasMore = computed(() => {
    return this.#pokemon().length < this.totalPokemon;
  });

  protected currentSprite = computed(() => {
    const pokemon = this.activePokemon();

    if (!pokemon) {
      return '';
    }

    const normalSprite = pokemon.sprite ?? '';
    const selectedSprite =
      this.isShiny() && pokemon.spriteShiny ? pokemon.spriteShiny : normalSprite;

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

    this.#pokemonService.getPokemonPage(this.pageSize, 0).subscribe({
      next: (response) => {
        this.#pokemon.set(response.pokemon);
        this.totalPokemon = response.total;
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

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined' || !this.sentinelRef) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.pageLoading() && this.hasMore()) {
            this.loadNextPage();
          }
        });
      },
      { rootMargin: '200px' },
    );

    this.intersectionObserver.observe(this.sentinelRef.nativeElement);
  }

  private loadNextPage(): void {
    if (this.pageLoading() || !this.hasMore()) {
      return;
    }

    this.pageLoading.set(true);
    this.error.set(null);

    this.#pokemonService.getPokemonPage(this.pageSize, this.pageOffset).subscribe({
      next: (response) => {
        this.#pokemon.update((current) => [...current, ...response.pokemon]);
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

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    const body = this.#document?.body;
    if (body) {
      body.classList.remove('modal-open');
      body.style.removeProperty('overflow');
    }
  }

  protected search(event: Event) {
    const term = (event.target as HTMLInputElement | null)?.value.trim() ?? '';
    this.searchQuery.set(term);
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
      },
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

  protected filterByType(type: string): void {
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

  protected isTypeDisabled(type: string): boolean {
    const selected = this.selectedTypes();
    return selected.length >= 2 && !selected.includes(type);
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.selectedTypes.set([]);
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
