import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { FavoritesService, FAVORITES_STORAGE_KEY } from './services/favorites';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideHttpClient()]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Pokédex');
  });

  it('should lock body scroll when activePokemon is set and unlock when cleared', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();

    expect(document.body.classList.contains('modal-open')).toBeFalse();

    app.activePokemonStub.set({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      height: 0.4,
      weight: 6,
      sprite: null,
    });
    fixture.detectChanges();

    expect(document.body.classList.contains('modal-open')).toBeTrue();
    expect(document.body.style.overflow).toBe('hidden');

    app.activePokemonStub.set(null);
    fixture.detectChanges();

    expect(document.body.classList.contains('modal-open')).toBeFalse();
    expect(document.body.style.overflow).toBe('');
  });

  it('should prioritize favorited Pokemon at the top of the roster in numerical order', () => {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    const favoritesService = TestBed.inject(FavoritesService);

    favoritesService.clearFavorites();
    favoritesService.toggleFavorite(25);

    app.state.pokemon.set([
      { id: 1, name: 'bulbasaur', types: ['grass'], height: 0.7, weight: 6.9, sprite: null },
      { id: 4, name: 'charmander', types: ['fire'], height: 0.6, weight: 8.5, sprite: null },
      { id: 25, name: 'pikachu', types: ['electric'], height: 0.4, weight: 6, sprite: null },
    ]);
    fixture.detectChanges();

    const roster = app.state.filteredPokemon();
    expect(roster.map((p: any) => p.id)).toEqual([25, 1, 4]);
  });

  it('should filter roster strictly to favorites when showFavoritesOnly is active', () => {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    const favoritesService = TestBed.inject(FavoritesService);

    favoritesService.clearFavorites();
    favoritesService.toggleFavorite(4);

    app.state.pokemon.set([
      { id: 1, name: 'bulbasaur', types: ['grass'], height: 0.7, weight: 6.9, sprite: null },
      { id: 4, name: 'charmander', types: ['fire'], height: 0.6, weight: 8.5, sprite: null },
      { id: 7, name: 'squirtle', types: ['water'], height: 0.5, weight: 9, sprite: null },
    ]);

    app.state.showFavoritesOnly.set(true);
    fixture.detectChanges();

    const roster = app.state.filteredPokemon();
    expect(roster.length).toBe(1);
    expect(roster[0].name).toBe('charmander');
  });

  it('should render the global sound toggle and allow toggling sound state', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const soundToggle = compiled.querySelector('.topbar__sound-toggle') as HTMLButtonElement;
    expect(soundToggle).toBeTruthy();

    expect(app.soundService.soundEnabled()).toBeTrue();
    soundToggle.click();
    fixture.detectChanges();

    expect(app.soundService.soundEnabled()).toBeFalse();
    expect(soundToggle.classList.contains('topbar__sound-toggle--muted')).toBeTrue();
  });

  it('should stop sound playback when closing details or destroying app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();

    spyOn(app.soundService, 'stop');

    app.closeDetails();
    expect(app.soundService.stop).toHaveBeenCalled();

    app.ngOnDestroy();
    expect(app.soundService.stop).toHaveBeenCalledTimes(2);
  });

  it('should play shiny sparkle sound when switching to shiny mode', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();

    spyOn(app.soundService, 'playShinySparkleSound');

    app.isShiny.set(false);
    app.toggleShiny(new MouseEvent('click'));

    expect(app.isShiny()).toBeTrue();
    expect(app.soundService.playShinySparkleSound).toHaveBeenCalled();
  });
});
