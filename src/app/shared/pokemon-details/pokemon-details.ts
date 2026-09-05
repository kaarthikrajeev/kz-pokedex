import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import {
  Pokemon,
  PokemonAbility,
  PokemonStat,
  EvolutionChain,
  EvolutionPokemon,
} from '../../models/types';
import { PokemonLoaderComponent } from '../pokemon-loader/pokemon-loader';
import { FavoritesService } from '../../services/favorites';
import { PokedexService } from '../../services/pokedex';
import { SoundService } from '../../services/sound';
import { sanitizePokemonType, sanitizeStatName } from '../../models/pokemon-types';

@Component({
  selector: 'app-pokemon-details',
  standalone: true,
  imports: [PokemonLoaderComponent],
  templateUrl: './pokemon-details.html',
  styleUrl: './pokemon-details.css',
})
export class PokemonDetailsComponent {
  private readonly pokedexService = inject(PokedexService);
  private readonly favoritesService = inject(FavoritesService);
  protected readonly soundService = inject(SoundService);

  @Input() pokemon: Pokemon | null = null;
  @Input() loading = false;
  @Input() shiny = false;
  @Input() sprite = '';
  protected spriteLoading = signal(true);
  @Output() shinyToggle = new EventEmitter<Event>();
  @Output() imageError = new EventEmitter<Event>();
  @Output() pokemonSelected = new EventEmitter<Pokemon>();

  protected readonly evolutionChain = signal<EvolutionChain | null>(null);
  protected readonly evolutionLoading = signal(false);
  protected readonly evolutionError = signal<string | null>(null);
  private evolutionRequestId = 0;

  protected readonly sanitizeType = sanitizePokemonType;
  protected readonly sanitizeStat = sanitizeStatName;

  protected get isFavorite(): boolean {
    return this.pokemon?.id ? this.favoritesService.isFavorite(this.pokemon.id) : false;
  }

  protected toggleFavorite(event: Event): void {
    event.stopPropagation();
    if (this.pokemon?.id) {
      const added = this.favoritesService.toggleFavorite(this.pokemon.id);
      if (added) {
        this.soundService.playPokeballCatchSound();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sprite']) {
      this.spriteLoading.set(Boolean(this.sprite));
    }

    if (changes['pokemon']) {
      if (this.pokemon) {
        this.loadEvolutionChain(this.pokemon);
      } else {
        this.evolutionRequestId++;
        this.evolutionChain.set(null);
        this.evolutionLoading.set(false);
        this.evolutionError.set(null);
      }
    }
  }

  private loadEvolutionChain(pokemon: Pokemon): void {
    const requestId = ++this.evolutionRequestId;
    this.evolutionLoading.set(true);
    this.evolutionError.set(null);
    this.evolutionChain.set(null);

    this.pokedexService.getEvolutionChainForPokemon(pokemon).subscribe({
      next: (chain) => {
        if (requestId !== this.evolutionRequestId) {
          return;
        }
        this.evolutionChain.set(chain);
        this.evolutionLoading.set(false);
      },
      error: () => {
        if (requestId !== this.evolutionRequestId) {
          return;
        }
        this.evolutionError.set('Evolution data unavailable.');
        this.evolutionLoading.set(false);
      },
    });
  }

  protected onSelectEvolutionPokemon(evoPokemon: EvolutionPokemon): void {
    const cached = this.pokedexService.pokemonCache().get(String(evoPokemon.id));
    const pokemonToSelect: Pokemon = cached ?? {
      id: evoPokemon.id,
      name: evoPokemon.name,
      types: evoPokemon.types,
      height: 0,
      weight: 0,
      sprite: evoPokemon.sprite,
      spriteShiny: evoPokemon.spriteShiny,
      description: '',
    };
    this.pokemonSelected.emit(pokemonToSelect);
  }

  protected isCurrentPokemon(id: number): boolean {
    return this.pokemon?.id === id;
  }

  protected getSpriteForEvolution(evo: EvolutionPokemon): string {
    if (this.shiny && evo.spriteShiny) {
      return evo.spriteShiny;
    }
    return evo.sprite;
  }

  protected onSpriteLoad(): void {
    this.spriteLoading.set(false);
  }

  protected onSpriteError(event: Event): void {
    this.spriteLoading.set(false);
    this.imageError.emit(event);
  }

  protected formatNumber(value: number): string {
    return value.toString().padStart(3, '0');
  }

  protected get abilities(): PokemonAbility[] {
    return this.pokemon?.abilities ?? [];
  }

  protected get stats(): PokemonStat[] {
    return this.pokemon?.stats ?? [];
  }

  protected get totalStats(): number {
    if (!this.pokemon?.stats || this.pokemon.stats.length === 0) {
      return this.pokemon?.totalStats ?? 0;
    }
    return this.pokemon.stats.reduce((sum, stat) => sum + stat.baseStat, 0);
  }

  protected get effectiveCryUrl(): string | null {
    if (this.pokemon?.cryUrl) {
      return this.pokemon.cryUrl;
    }
    if (this.pokemon?.cries?.latest) {
      return this.pokemon.cries.latest;
    }
    if (this.pokemon?.cries?.legacy) {
      return this.pokemon.cries.legacy;
    }
    if (this.pokemon?.id) {
      return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${this.pokemon.id}.ogg`;
    }
    return null;
  }

  protected get hasCry(): boolean {
    return Boolean(this.effectiveCryUrl);
  }

  protected get isPlayingCry(): boolean {
    const url = this.effectiveCryUrl;
    return (
      this.soundService.isPlaying() &&
      Boolean(url) &&
      this.soundService.currentCryUrl() === url
    );
  }

  protected get isSoundEnabled(): boolean {
    return this.soundService.soundEnabled();
  }

  protected get cryButtonAriaLabel(): string {
    if (!this.hasCry) {
      return 'No cry audio available for ' + (this.pokemon?.name ?? 'Pokemon');
    }
    if (this.isPlayingCry) {
      return 'Playing cry audio for ' + (this.pokemon?.name ?? 'Pokemon');
    }
    return 'Play cry for ' + (this.pokemon?.name ?? 'Pokemon');
  }

  protected get cryButtonTitle(): string {
    if (!this.hasCry) {
      return 'Cry audio unavailable';
    }
    if (this.isPlayingCry) {
      return 'Playing Pokémon Cry...';
    }
    if (!this.isSoundEnabled) {
      return 'Sound disabled (click to play cry)';
    }
    return 'Play Pokémon Cry';
  }

  protected playCry(event: Event): void {
    event.stopPropagation();
    const url = this.effectiveCryUrl;
    if (url) {
      this.soundService.playCry(url, true);
    }
  }
}
