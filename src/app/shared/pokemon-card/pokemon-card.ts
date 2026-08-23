import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Pokemon } from '../../models/types';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  templateUrl: './pokemon-card.html'
})
export class PokemonCardComponent {
  @Input({ required: true }) pokemon!: Pokemon;
  @Input() sprite = '';
  @Output() selected = new EventEmitter<Pokemon>();
  @Output() imageError = new EventEmitter<Event>();

  protected formatNumber(value: number): string {
    return value.toString().padStart(3, '0');
  }
}
