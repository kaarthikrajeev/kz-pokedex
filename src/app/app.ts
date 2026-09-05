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
import { rxResource } from '@angular/core/rxjs-interop';
import { CommonModule, DOCUMENT } from '@angular/common';
import { PokedexService } from './services/pokedex';
import { FavoritesService } from './services/favorites';
import { SoundService } from './services/sound';
import { PokemonListStateService } from './services/pokemon-list-state';
import { Pokemon } from './models/types';
import { PokemonCardComponent } from './shared/pokemon-card/pokemon-card';
import { PokemonDetailsComponent } from './shared/pokemon-details/pokemon-details';
import { PokemonLoaderComponent } from './shared/pokemon-loader/pokemon-loader';
import { POKEMON_TYPES, sanitizePokemonType } from './models/pokemon-types';
import { of } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, PokemonCardComponent, PokemonDetailsComponent, PokemonLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None,
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  readonly #document = inject(DOCUMENT);
  readonly #pokemonService = inject(PokedexService);
  protected readonly state = inject(PokemonListStateService);
  protected readonly favoritesService = inject(FavoritesService);
  protected readonly soundService = inject(SoundService);

  protected activePokemonStub = signal<Pokemon | null>(null);
  protected isShiny = signal(false);

  protected pokemonDetailResource = rxResource<Pokemon | undefined, number | undefined>({
    params: () => this.activePokemonStub()?.id,
    stream: ({ params: id }) => {
      if (id === undefined) return of(undefined);
      return this.#pokemonService.getPokemonDetails(id);
    }
  });

  protected pokemonTypes = POKEMON_TYPES;
  protected readonly favorites = this.favoritesService.favorites;
  protected readonly sanitizeType = sanitizePokemonType;

  @ViewChild('sentinel', { static: false }) sentinelRef?: ElementRef<HTMLElement>;

  private intersectionObserver: IntersectionObserver | null = null;

  protected currentSprite = computed(() => {
    const pokemon = this.pokemonDetailResource.value();

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
  private readonly fallbackSprite = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2296%22%20height%3D%2296%22%20viewBox%3D%220%200%2096%2096%22%3E%3Crect%20width%3D%2296%22%20height%3D%2296%22%20fill%3D%22%23dfe6ef%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2212%22%20width%3D%2272%22%20height%3D%2272%22%20fill%3D%22%23f6f1ea%22%20stroke%3D%22%23111111%22%20stroke-width%3D%224%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2254%25%22%20text-anchor%3D%22middle%22%20font-size%3D%2230%22%20font-family%3D%22Arial%2C%20sans-serif%22%20fill%3D%22%23111111%22%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E";

  constructor() {
    effect((onCleanup) => {
      const isOpen = Boolean(this.activePokemonStub());
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

    effect(() => {
      const pokemonDetails = this.pokemonDetailResource.value();
      if (pokemonDetails) {
        this.preloadSprite(pokemonDetails.sprite);
        this.preloadSprite(pokemonDetails.spriteShiny);
        if (pokemonDetails.cryUrl && this.soundService.soundEnabled()) {
          this.soundService.playCry(pokemonDetails.cryUrl, false);
        }
      }
    });
  }

  ngOnInit() {
    this.state.loadInitialPage();
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
          if (entry.isIntersecting && !this.state.pageLoading() && this.state.hasMore()) {
            this.state.loadNextPage();
          }
        });
      },
      { rootMargin: '200px' },
    );

    this.intersectionObserver.observe(this.sentinelRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.soundService.stop();
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    const body = this.#document?.body;
    if (body) {
      body.classList.remove('modal-open');
      body.style.removeProperty('overflow');
    }
  }

  protected openPokemonDetails(pokemon: Pokemon) {
    this.soundService.stop();
    const dialog = this.#document.getElementById('details') as HTMLDialogElement | null;
    if (dialog && !dialog.matches(':popover-open')) {
      try {
        dialog.showPopover();
      } catch (e) {
        console.warn('Popover API not fully supported or already open', e);
      }
    }

    if (this.activePokemonStub()?.id !== pokemon.id) {
      this.isShiny.set(false);
    }
    
    this.activePokemonStub.set(pokemon);
  }

  protected toggleShiny(event: Event): void {
    event.stopPropagation();
    const nextShiny = !this.isShiny();
    this.isShiny.set(nextShiny);
    if (nextShiny) {
      this.soundService.playShinySparkleSound();
    }
  }

  protected closeDetails(): void {
    this.soundService.stop();
    this.activePokemonStub.set(null);
    this.isShiny.set(false);
  }

  protected onDetailsToggle(event: Event): void {
    if ((event as ToggleEvent).newState === 'closed' && this.activePokemonStub()) {
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
