import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pokemon-loader',
  standalone: true,
  templateUrl: './pokemon-loader.html',
  styleUrl: './pokemon-loader.css'
})
export class PokemonLoaderComponent {
  @Input() message = 'Loading Pokémon...';
}
