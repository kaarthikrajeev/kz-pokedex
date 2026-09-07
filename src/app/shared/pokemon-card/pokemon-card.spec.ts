import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PokemonCardComponent } from './pokemon-card';
import { FavoritesService } from '../../services/favorites';
import { PokedexService } from '../../services/pokedex';
import { SoundService } from '../../services/sound';
import { createMockPokemon } from '../../../testing/mock-data';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('PokemonCardComponent', () => {
  let component: PokemonCardComponent;
  let fixture: ComponentFixture<PokemonCardComponent>;
  let favoritesService: FavoritesService;
  let pokedexService: PokedexService;
  let soundService: SoundService;

  const mockPokemon = createMockPokemon({
    id: 25,
    name: 'pikachu',
    types: ['electric'],
    sprite: 'https://example.com/pikachu.png',
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    favoritesService = TestBed.inject(FavoritesService);
    pokedexService = TestBed.inject(PokedexService);
    soundService = TestBed.inject(SoundService);

    fixture = TestBed.createComponent(PokemonCardComponent);
    component = fixture.componentInstance;
    component.pokemon = mockPokemon;
    component.sprite = mockPokemon.sprite!;
  });

  it('should create the card component', () => {
    expect(component).toBeTruthy();
  });

  it('should render formatted ID number and capitalized name', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const numberSpan = element.querySelector('.pokemon-card__number');
    const title = element.querySelector('.pokemon-card__footer h3');

    expect(numberSpan?.textContent?.trim()).toBe('#025');
    expect(title?.textContent?.trim()).toBe('pikachu');
  });

  it('should render sprite image with correct alt attribute when sprite is provided', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const img = element.querySelector('.pokemon-card__image-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/pikachu.png');
    expect(img.getAttribute('alt')).toBe('pikachu');
  });

  it('should render placeholder when sprite is empty', () => {
    component.sprite = '';
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const placeholder = element.querySelector('.pokemon-card__placeholder');
    const img = element.querySelector('.pokemon-card__image-wrap img');

    expect(placeholder).toBeTruthy();
    expect(placeholder?.textContent?.trim()).toBe('?');
    expect(img).toBeNull();
  });

  it('should emit imageError when img fails to load', () => {
    fixture.detectChanges();
    spyOn(component.imageError, 'emit');

    const element = fixture.nativeElement as HTMLElement;
    const img = element.querySelector('.pokemon-card__image-wrap img') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));

    expect(component.imageError.emit).toHaveBeenCalled();
  });

  it('should render type badges up to a maximum of two types', () => {
    component.pokemon = createMockPokemon({
      id: 6,
      name: 'charizard',
      types: ['fire', 'flying', 'dragon'],
    });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const typeBadges = element.querySelectorAll('.pokemon-card__types .type');
    expect(typeBadges.length).toBe(2);
    expect(typeBadges[0].textContent?.trim()).toBe('fire');
    expect(typeBadges[1].textContent?.trim()).toBe('flying');
  });

  it('should emit selected event when card article is clicked', () => {
    fixture.detectChanges();
    spyOn(component.selected, 'emit');

    const card = fixture.nativeElement.querySelector('.pokemon-card') as HTMLElement;
    card.click();

    expect(component.selected.emit).toHaveBeenCalledWith(mockPokemon);
  });

  it('should emit selected event on Enter and Space keypresses on the card', () => {
    fixture.detectChanges();
    spyOn(component.selected, 'emit');

    const card = fixture.nativeElement.querySelector('.pokemon-card') as HTMLElement;
    
    // Enter key
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
    expect(component.selected.emit).toHaveBeenCalledWith(mockPokemon);

    // Space key
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));
    expect(component.selected.emit).toHaveBeenCalledTimes(2);
  });

  it('should toggle favorite, cache pokemon, and play catch sound when clicking favorite button', () => {
    fixture.detectChanges();
    spyOn(favoritesService, 'toggleFavorite').and.returnValue(true);
    spyOn(pokedexService, 'cachePokemon');
    spyOn(soundService, 'playPokeballCatchSound');

    const favButton = fixture.nativeElement.querySelector('.pokemon-card__favorite-toggle') as HTMLButtonElement;
    favButton.click();

    expect(favoritesService.toggleFavorite).toHaveBeenCalledWith(25);
    expect(pokedexService.cachePokemon).toHaveBeenCalledWith(mockPokemon);
    expect(soundService.playPokeballCatchSound).toHaveBeenCalled();
  });

  it('should reflect favorite active state and aria-pressed attribute', () => {
    spyOn(favoritesService, 'isFavorite').and.returnValue(true);
    fixture.detectChanges();

    const favButton = fixture.nativeElement.querySelector('.pokemon-card__favorite-toggle') as HTMLButtonElement;
    expect(favButton.classList.contains('pokemon-card__favorite-toggle--active')).toBeTrue();
    expect(favButton.getAttribute('aria-pressed')).toBe('true');
    expect(favButton.textContent?.trim()).toBe('★');
  });

  it('should reflect non-favorite state and hollow star', () => {
    spyOn(favoritesService, 'isFavorite').and.returnValue(false);
    fixture.detectChanges();

    const favButton = fixture.nativeElement.querySelector('.pokemon-card__favorite-toggle') as HTMLButtonElement;
    expect(favButton.classList.contains('pokemon-card__favorite-toggle--active')).toBeFalse();
    expect(favButton.getAttribute('aria-pressed')).toBe('false');
    expect(favButton.textContent?.trim()).toBe('☆');
  });
});
