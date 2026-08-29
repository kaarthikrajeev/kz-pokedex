import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Pokemon } from '../../models/types';
import { FavoritesService } from '../../services/favorites';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  templateUrl: './pokemon-card.html',
})
export class PokemonCardComponent {
  private readonly favoritesService = inject(FavoritesService);

  @Input({ required: true }) pokemon!: Pokemon;
  @Input() sprite = '';
  @Output() selected = new EventEmitter<Pokemon>();
  @Output() imageError = new EventEmitter<Event>();

  protected get isFavorite(): boolean {
    return this.favoritesService.isFavorite(this.pokemon?.id);
  }

  protected toggleFavorite(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.pokemon?.id) {
      this.favoritesService.toggleFavorite(this.pokemon.id);
    }
  }

  protected formatNumber(value: number): string {
    return value.toString().padStart(3, '0');
  }
}
