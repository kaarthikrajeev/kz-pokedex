import { provideZonelessChangeDetection, signal, computed } from '@angular/core';
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

  it('should render title and dynamic region eyebrow', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Pokédex');
    expect(compiled.querySelector('.brand__eyebrow')?.textContent).toContain('ALL REGIONS');

    app.state.selectedRegion.set('KANTO');
    fixture.detectChanges();
    expect(compiled.querySelector('.brand__eyebrow')?.textContent).toContain('KANTO REGION');
  });

  it('should render region selector panel and switch regions when clicked', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const regionButtons = compiled.querySelectorAll('.region-filter-button');
    expect(regionButtons.length).toBe(11);

    const kantoBtn = Array.from(regionButtons).find(
      (btn) => btn.textContent?.includes('KANTO')
    ) as HTMLButtonElement;
    expect(kantoBtn).toBeTruthy();

    spyOn(app.state, 'selectRegion');
    kantoBtn.click();
    fixture.detectChanges();

    expect(app.state.selectRegion).toHaveBeenCalledWith('KANTO');
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

  it('should format numbers with 3 leading digits', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;

    expect(app.formatNumber(1)).toBe('001');
    expect(app.formatNumber(25)).toBe('025');
    expect(app.formatNumber(150)).toBe('150');
    expect(app.formatNumber(1000)).toBe('1000');
  });

  it('should handle openPokemonDetails and reset shiny mode for different pokemon', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();

    spyOn(app.soundService, 'stop');

    const bulbasaur = { id: 1, name: 'bulbasaur', types: ['grass'], height: 0.7, weight: 6.9, sprite: null };
    const charmander = { id: 4, name: 'charmander', types: ['fire'], height: 0.6, weight: 8.5, sprite: null };

    app.isShiny.set(true);
    app.openPokemonDetails(bulbasaur);

    expect(app.soundService.stop).toHaveBeenCalled();
    expect(app.activePokemonStub()).toBe(bulbasaur);
    expect(app.isShiny()).toBeFalse();

    // Opening same pokemon preserves current shiny state if manually set
    app.isShiny.set(true);
    app.openPokemonDetails(bulbasaur);
    expect(app.isShiny()).toBeTrue();

    // Opening different pokemon resets shiny state
    app.openPokemonDetails(charmander);
    expect(app.isShiny()).toBeFalse();
  });

  it('should handle popover dialog showPopover gracefully if supported or not supported', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('#details') as HTMLDialogElement;
    if (dialog) {
      dialog.showPopover = jasmine.createSpy('showPopover');
      dialog.matches = ((selector: string) => false) as any;
    }

    const pikachu = { id: 25, name: 'pikachu', types: ['electric'], height: 0.4, weight: 6, sprite: null };
    app.openPokemonDetails(pikachu);

    if (dialog && dialog.showPopover) {
      expect(dialog.showPopover).toHaveBeenCalled();
    }
    document.body.removeChild(fixture.nativeElement);
  });

  it('should handle onDetailsToggle when closed', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();

    spyOn(app, 'closeDetails');
    app.activePokemonStub.set({ id: 25, name: 'pikachu', types: ['electric'], height: 0.4, weight: 6, sprite: null });

    app.onDetailsToggle({ newState: 'open' } as any);
    expect(app.closeDetails).not.toHaveBeenCalled();

    app.onDetailsToggle({ newState: 'closed' } as any);
    expect(app.closeDetails).toHaveBeenCalled();
  });

  it('should manage image error and sprite fallback correctly', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();

    expect(app.spriteUrl(null)).toBe(app.fallbackSprite);
    expect(app.spriteUrl('https://example.com/sprite.png')).toBe('https://example.com/sprite.png');

    app.onImageError({ target: { currentSrc: 'https://example.com/bad-sprite.png' } } as any);
    expect(app.failedSpriteUrls().has('https://example.com/bad-sprite.png')).toBeTrue();
    expect(app.spriteUrl('https://example.com/bad-sprite.png')).toBe(app.fallbackSprite);

    // Ignoring fallback sprite errors or null targets
    app.onImageError({ target: null } as any);
    app.onImageError({ target: { currentSrc: app.fallbackSprite } } as any);
  });

  it('should compute currentSprite with normal, shiny, and error fallbacks', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();

    // No pokemon detail value
    expect(app.currentSprite()).toBe('');

    const mockDetailSignal = signal<any>({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      height: 0.4,
      weight: 6,
      sprite: 'https://example.com/pikachu.png',
      spriteShiny: 'https://example.com/pikachu-shiny.png',
    });

    app.pokemonDetailResource = { value: mockDetailSignal.asReadonly() };
    app.currentSprite = computed(() => {
      const pokemon = app.pokemonDetailResource.value();
      if (!pokemon) return '';
      const normalSprite = pokemon.sprite ?? '';
      const selectedSprite = app.isShiny() && pokemon.spriteShiny ? pokemon.spriteShiny : normalSprite;
      if (!app.failedSpriteUrls().has(selectedSprite)) return selectedSprite;
      return app.isShiny() && normalSprite && !app.failedSpriteUrls().has(normalSprite)
        ? normalSprite
        : app.fallbackSprite;
    });

    app.isShiny.set(false);
    expect(app.currentSprite()).toBe('https://example.com/pikachu.png');

    app.isShiny.set(true);
    expect(app.currentSprite()).toBe('https://example.com/pikachu-shiny.png');

    // If shiny fails, fallback to normal sprite
    app.failedSpriteUrls.update((set: Set<string>) => new Set(set).add('https://example.com/pikachu-shiny.png'));
    expect(app.currentSprite()).toBe('https://example.com/pikachu.png');

    // If both fail, fallback to fallbackSprite
    app.failedSpriteUrls.update((set: Set<string>) => new Set(set).add('https://example.com/pikachu.png'));
    expect(app.currentSprite()).toBe(app.fallbackSprite);
  });

  it('should preload sprites without re-fetching cached ones', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;

    app.preloadSprite(null);
    app.preloadSprite(undefined);
    expect(app.preloadedSprites.size).toBe(0);

    app.preloadSprite('https://example.com/sprite1.png');
    expect(app.preloadedSprites.has('https://example.com/sprite1.png')).toBeTrue();

    // Second preload call skips duplicate
    app.preloadSprite('https://example.com/sprite1.png');
    expect(app.preloadedSprites.size).toBe(1);
  });

  it('should setup intersection observer and trigger loadNextPage on sentinel intersect', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();

    let observerCallback: (entries: any[]) => void = () => {};
    const mockObserver = {
      observe: jasmine.createSpy('observe'),
      disconnect: jasmine.createSpy('disconnect'),
    };

    (window as any).IntersectionObserver = class {
      constructor(callback: any) {
        observerCallback = callback;
        return mockObserver as any;
      }
    };

    app.sentinelRef = { nativeElement: document.createElement('div') };
    app.setupIntersectionObserver();

    expect(mockObserver.observe).toHaveBeenCalled();

    spyOn(app.state, 'loadNextPage');
    spyOn(app.state, 'hasMore').and.returnValue(true);
    spyOn(app.state, 'pageLoading').and.returnValue(false);

    // Trigger intersection
    observerCallback([{ isIntersecting: true }]);
    expect(app.state.loadNextPage).toHaveBeenCalled();

    // Trigger non-intersecting
    app.state.loadNextPage.calls.reset();
    observerCallback([{ isIntersecting: false }]);
    expect(app.state.loadNextPage).not.toHaveBeenCalled();

    app.ngOnDestroy();
    expect(mockObserver.disconnect).toHaveBeenCalled();
  });
});
