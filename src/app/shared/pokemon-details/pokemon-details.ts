import { Component, EventEmitter, Input, Output, SimpleChanges, inject, signal } from '@angular/core';
import { Pokemon, PokemonAbility, PokemonStat } from '../../models/types';
import { PokemonLoaderComponent } from '../pokemon-loader/pokemon-loader';
import { FavoritesService } from '../../services/favorites';
import { sanitizePokemonType, sanitizeStatName } from '../../models/pokemon-types';

@Component({
  selector: 'app-pokemon-details',
  standalone: true,
  imports: [PokemonLoaderComponent],
  templateUrl: './pokemon-details.html',
  styleUrl: './pokemon-details.css',
})
export class PokemonDetailsComponent {
  private readonly favoritesService = inject(FavoritesService);

  @Input() pokemon: Pokemon | null = null;
  @Input() loading = false;
  @Input() shiny = false;
  @Input() sprite = '';
  protected spriteLoading = signal(true);
  @Output() shinyToggle = new EventEmitter<Event>();
  @Output() imageError = new EventEmitter<Event>();

  protected readonly sanitizeType = sanitizePokemonType;
  protected readonly sanitizeStat = sanitizeStatName;

  protected get isFavorite(): boolean {
    return this.pokemon?.id ? this.favoritesService.isFavorite(this.pokemon.id) : false;
  }

  protected toggleFavorite(event: Event): void {
    event.stopPropagation();
    if (this.pokemon?.id) {
      this.favoritesService.toggleFavorite(this.pokemon.id);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sprite']) {
      this.spriteLoading.set(Boolean(this.sprite));
    }
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
}
