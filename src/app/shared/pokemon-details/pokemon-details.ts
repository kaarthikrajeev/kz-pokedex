import { Component, EventEmitter, Input, Output, SimpleChanges, signal } from '@angular/core';
import { Pokemon } from '../../models/types';
import { PokemonLoaderComponent } from '../pokemon-loader/pokemon-loader';

@Component({
  selector: 'app-pokemon-details',
  standalone: true,
  imports: [PokemonLoaderComponent],
  templateUrl: './pokemon-details.html'
})
export class PokemonDetailsComponent {
  @Input() pokemon: Pokemon | null = null;
  @Input() loading = false;
  @Input() shiny = false;
  @Input() sprite = '';
  protected spriteLoading = signal(true);
  @Output() shinyToggle = new EventEmitter<Event>();
  @Output() imageError = new EventEmitter<Event>();

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
}
