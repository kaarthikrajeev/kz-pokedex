import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, SimpleChange } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Observable } from 'rxjs';
import { PokemonDetailsComponent } from './pokemon-details';
import { PokedexService } from '../../services/pokedex';
import { SoundService } from '../../services/sound';
import { Pokemon, EvolutionChain } from '../../models/types';

describe('PokemonDetailsComponent', () => {
  let component: PokemonDetailsComponent;
  let fixture: ComponentFixture<PokemonDetailsComponent>;
  let pokedexService: PokedexService;

  const mockPokemon: Pokemon = {
    id: 1,
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    height: 0.7,
    weight: 6.9,
    sprite: 'bulbasaur.png',
    spriteShiny: 'bulbasaur-shiny.png',
    evolutionChainUrl: 'https://pokeapi.co/api/v2/evolution-chain/1/',
  };

  const mockChain: EvolutionChain = {
    id: 1,
    hasEvolutions: true,
    root: {
      pokemon: {
        id: 1,
        name: 'bulbasaur',
        sprite: '1.png',
        spriteShiny: '1s.png',
        types: ['grass', 'poison'],
        isBaby: false,
      },
      requirements: [{ description: 'Base Stage' }],
      evolvesTo: [
        {
          pokemon: {
            id: 2,
            name: 'ivysaur',
            sprite: '2.png',
            spriteShiny: '2s.png',
            types: ['grass', 'poison'],
            isBaby: false,
          },
          requirements: [{ description: 'Level 16' }],
          evolvesTo: [],
        },
      ],
    },
    stages: [
      {
        stageIndex: 0,
        pokemon: [
          {
            pokemon: {
              id: 1,
              name: 'bulbasaur',
              sprite: '1.png',
              spriteShiny: '1s.png',
              types: ['grass', 'poison'],
              isBaby: false,
            },
            requirements: [{ description: 'Base Stage' }],
          },
        ],
      },
      {
        stageIndex: 1,
        pokemon: [
          {
            pokemon: {
              id: 2,
              name: 'ivysaur',
              sprite: '2.png',
              spriteShiny: '2s.png',
              types: ['grass', 'poison'],
              isBaby: false,
            },
            fromPokemonName: 'bulbasaur',
            requirements: [{ description: 'Level 16' }],
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonDetailsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    pokedexService = TestBed.inject(PokedexService);
    fixture = TestBed.createComponent(PokemonDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load evolution chain when pokemon input changes', () => {
    spyOn(pokedexService, 'getEvolutionChainForPokemon').and.returnValue(of(mockChain));

    component.pokemon = mockPokemon;
    component.ngOnChanges({
      pokemon: new SimpleChange(null, mockPokemon, true),
    });
    fixture.detectChanges();

    expect(pokedexService.getEvolutionChainForPokemon).toHaveBeenCalledWith(mockPokemon);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.evolution-chain-title')?.textContent).toContain('Evolution Chain');
    const cards = compiled.querySelectorAll('.evolution-card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('bulbasaur');
    expect(cards[1].textContent).toContain('ivysaur');
  });

  it('should highlight current active pokemon with .evolution-card--current and show CURRENT badge', () => {
    spyOn(pokedexService, 'getEvolutionChainForPokemon').and.returnValue(of(mockChain));

    component.pokemon = mockPokemon;
    component.ngOnChanges({
      pokemon: new SimpleChange(null, mockPokemon, true),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.evolution-card');
    expect(cards[0].classList.contains('evolution-card--current')).toBeTrue();
    expect(cards[0].querySelector('.current-badge')?.textContent).toContain('CURRENT');
    expect(cards[1].classList.contains('evolution-card--current')).toBeFalse();
    expect(cards[1].querySelector('.current-badge')).toBeNull();
  });

  it('should emit pokemonSelected when clicking an evolution card', () => {
    spyOn(pokedexService, 'getEvolutionChainForPokemon').and.returnValue(of(mockChain));
    let selectedPokemon: Pokemon | undefined;
    component.pokemonSelected.subscribe((p) => (selectedPokemon = p));

    component.pokemon = mockPokemon;
    component.ngOnChanges({
      pokemon: new SimpleChange(null, mockPokemon, true),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const ivysaurCard = compiled.querySelectorAll('.evolution-card')[1] as HTMLButtonElement;
    ivysaurCard.click();

    expect(selectedPokemon).toBeDefined();
    expect(selectedPokemon?.id).toBe(2);
    expect(selectedPokemon?.name).toBe('ivysaur');
  });

  it('should isolate evolution errors and show friendly fallback without breaking details', () => {
    spyOn(pokedexService, 'getEvolutionChainForPokemon').and.returnValue(
      throwError(() => new Error('API down')),
    );

    component.pokemon = mockPokemon;
    component.ngOnChanges({
      pokemon: new SimpleChange(null, mockPokemon, true),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.pokemon-details__header')?.textContent).toContain('bulbasaur');
    expect(compiled.querySelector('.evolution-chain-error')?.textContent).toContain(
      'Evolution data unavailable.',
    );
  });

  it('should handle single-stage Pokémon without evolutions by showing No known evolution message', () => {
    const noEvoChain: EvolutionChain = {
      id: 68,
      hasEvolutions: false,
      root: {
        pokemon: {
          id: 131,
          name: 'lapras',
          sprite: '131.png',
          types: ['water', 'ice'],
          isBaby: false,
        },
        requirements: [{ description: 'Base Stage' }],
        evolvesTo: [],
      },
      stages: [
        {
          stageIndex: 0,
          pokemon: [
            {
              pokemon: {
                id: 131,
                name: 'lapras',
                sprite: '131.png',
                types: ['water', 'ice'],
                isBaby: false,
              },
              requirements: [{ description: 'Base Stage' }],
            },
          ],
        },
      ],
    };

    spyOn(pokedexService, 'getEvolutionChainForPokemon').and.returnValue(of(noEvoChain));

    component.pokemon = {
      id: 131,
      name: 'lapras',
      types: ['water', 'ice'],
      height: 2.5,
      weight: 220,
      sprite: '131.png',
    };
    component.ngOnChanges({
      pokemon: new SimpleChange(null, component.pokemon, true),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.evolution-chain-empty')?.textContent).toContain(
      'No known evolution.',
    );
  });

  it('should ignore stale evolution responses when pokemon changes rapidly', () => {
    const pikachu: Pokemon = {
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      height: 0.4,
      weight: 6,
      sprite: '25.png',
    };

    const bulbasaurChain: EvolutionChain = {
      id: 1,
      hasEvolutions: true,
      root: {
        pokemon: { id: 1, name: 'bulbasaur', sprite: '1.png', types: ['grass'], isBaby: false },
        requirements: [{ description: 'Base Stage' }],
        evolvesTo: [],
      },
      stages: [{ stageIndex: 0, pokemon: [{ pokemon: { id: 1, name: 'bulbasaur', sprite: '1.png', types: ['grass'], isBaby: false }, requirements: [{ description: 'Base Stage' }] }] }],
    };

    const pikachuChain: EvolutionChain = {
      id: 10,
      hasEvolutions: true,
      root: {
        pokemon: { id: 25, name: 'pikachu', sprite: '25.png', types: ['electric'], isBaby: false },
        requirements: [{ description: 'Base Stage' }],
        evolvesTo: [],
      },
      stages: [{ stageIndex: 0, pokemon: [{ pokemon: { id: 25, name: 'pikachu', sprite: '25.png', types: ['electric'], isBaby: false }, requirements: [{ description: 'Base Stage' }] }] }],
    };

    let bulbasaurObserver: any;
    const bulbasaur$ = new Observable<EvolutionChain>((observer) => {
      bulbasaurObserver = observer;
    });

    spyOn(pokedexService, 'getEvolutionChainForPokemon').and.callFake((p: Pokemon): Observable<EvolutionChain> => {
      if (p.id === 1) return bulbasaur$;
      return of(pikachuChain);
    });

    // 1. First trigger Bulbasaur (request in-flight)
    component.pokemon = mockPokemon;
    component.ngOnChanges({
      pokemon: new SimpleChange(null, mockPokemon, true),
    });
    fixture.detectChanges();

    // 2. Quickly change to Pikachu before Bulbasaur finishes
    component.pokemon = pikachu;
    component.ngOnChanges({
      pokemon: new SimpleChange(mockPokemon, pikachu, false),
    });
    fixture.detectChanges();

    // Pikachu resolves immediately
    expect((component as any).evolutionChain()?.id).toBe(10);

    // 3. Stale Bulbasaur response arrives later
    bulbasaurObserver.next(bulbasaurChain);
    bulbasaurObserver.complete();
    fixture.detectChanges();

    // Must still be Pikachu (stale Bulbasaur ignored)
    expect((component as any).evolutionChain()?.id).toBe(10);
  });

  describe('Pokemon Cry Button', () => {
    it('should disable cry button when pokemon has no valid id or cryUrl', () => {
      component.pokemon = {
        id: 0,
        name: 'unknown',
        types: [],
        height: 0,
        weight: 0,
        sprite: null,
        cryUrl: null,
      };
      component.ngOnChanges({
        pokemon: new SimpleChange(null, component.pokemon, true),
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cryBtn = compiled.querySelector('.pokemon-cry-button') as HTMLButtonElement;
      expect(cryBtn).toBeTruthy();
      expect(cryBtn.disabled).toBeTrue();
      expect(cryBtn.classList.contains('pokemon-cry-button--disabled')).toBeTrue();
    });

    it('should automatically resolve fallback cryUrl from pokemon id if cryUrl property was omitted', () => {
      const soundService = TestBed.inject(SoundService);
      spyOn(soundService, 'playCry').and.returnValue(Promise.resolve(true));

      component.pokemon = {
        id: 1,
        name: 'bulbasaur',
        types: ['grass'],
        height: 0.7,
        weight: 6.9,
        sprite: 'bulbasaur.png',
      };
      component.ngOnChanges({
        pokemon: new SimpleChange(null, component.pokemon, true),
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cryBtn = compiled.querySelector('.pokemon-cry-button') as HTMLButtonElement;
      expect(cryBtn).toBeTruthy();
      expect(cryBtn.disabled).toBeFalse();

      cryBtn.click();
      expect(soundService.playCry).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/1.ogg',
        true,
      );
    });

    it('should enable cry button and trigger soundService.playCry with force=true on click', () => {
      const soundService = TestBed.inject(SoundService);
      spyOn(soundService, 'playCry').and.returnValue(Promise.resolve(true));

      component.pokemon = {
        id: 25,
        name: 'pikachu',
        types: ['electric'],
        height: 0.4,
        weight: 6,
        sprite: 'pikachu.png',
        cryUrl: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg',
      };
      component.ngOnChanges({
        pokemon: new SimpleChange(null, component.pokemon, true),
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cryBtn = compiled.querySelector('.pokemon-cry-button') as HTMLButtonElement;
      expect(cryBtn).toBeTruthy();
      expect(cryBtn.disabled).toBeFalse();

      cryBtn.click();
      expect(soundService.playCry).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg',
        true,
      );
    });

    it('should reflect playing state in class and aria attributes', () => {
      const soundService = TestBed.inject(SoundService);
      const cryUrl = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg';

      component.pokemon = {
        id: 25,
        name: 'pikachu',
        types: ['electric'],
        height: 0.4,
        weight: 6,
        sprite: 'pikachu.png',
        cryUrl,
      };
      component.ngOnChanges({
        pokemon: new SimpleChange(null, component.pokemon, true),
      });
      fixture.detectChanges();

      soundService.isPlaying.set(true);
      soundService.currentCryUrl.set(cryUrl);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cryBtn = compiled.querySelector('.pokemon-cry-button') as HTMLButtonElement;
      expect(cryBtn.classList.contains('pokemon-cry-button--playing')).toBeTrue();
      expect(cryBtn.getAttribute('aria-pressed')).toBe('true');
    });

    it('should resolve cries.legacy if latest cry is not available', () => {
      component.pokemon = {
        id: 25,
        name: 'pikachu',
        types: ['electric'],
        height: 0.4,
        weight: 6,
        sprite: 'pikachu.png',
        cries: {
          latest: null,
          legacy: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/25.ogg',
        },
      };
      expect((component as any).effectiveCryUrl).toBe(
        'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/25.ogg',
      );
    });

    it('should return correct cryButtonTitle and cryButtonAriaLabel in all conditions', () => {
      const soundService = TestBed.inject(SoundService);
      component.pokemon = null;
      expect((component as any).cryButtonTitle).toBe('Cry audio unavailable');
      expect((component as any).cryButtonAriaLabel).toBe('No cry audio available for Pokemon');

      component.pokemon = {
        id: 25,
        name: 'pikachu',
        types: ['electric'],
        height: 0.4,
        weight: 6,
        sprite: 'pikachu.png',
        cryUrl: 'pikachu.ogg',
      };
      soundService.soundEnabled.set(false);
      expect((component as any).cryButtonTitle).toBe('Sound disabled (click to play cry)');
      expect((component as any).cryButtonAriaLabel).toBe('Play cry for pikachu');

      soundService.soundEnabled.set(true);
      expect((component as any).cryButtonTitle).toBe('Play Pokémon Cry');

      soundService.isPlaying.set(true);
      soundService.currentCryUrl.set('pikachu.ogg');
      expect((component as any).cryButtonTitle).toBe('Playing Pokémon Cry...');
      expect((component as any).cryButtonAriaLabel).toBe('Playing cry audio for pikachu');
    });
  });

  describe('Favorite & Interaction Features', () => {
    it('should toggle favorite and play catch sound when favorited', () => {
      const soundService = TestBed.inject(SoundService);
      spyOn(soundService, 'playPokeballCatchSound');

      component.pokemon = mockPokemon;
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');

      (component as any).toggleFavorite(event);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect((component as any).isFavorite).toBeTrue();
      expect(soundService.playPokeballCatchSound).toHaveBeenCalled();

      (component as any).toggleFavorite(event);
      expect((component as any).isFavorite).toBeFalse();
    });

    it('should handle image load and error events', () => {
      spyOn(component.imageError, 'emit');
      const errEvent = new Event('error');

      (component as any).onSpriteError(errEvent);
      expect((component as any).spriteLoading()).toBeFalse();
      expect(component.imageError.emit).toHaveBeenCalledWith(errEvent);

      (component as any).onSpriteLoad();
      expect((component as any).spriteLoading()).toBeFalse();
    });

    it('should calculate total stats correctly with and without stats array', () => {
      component.pokemon = {
        ...mockPokemon,
        stats: [
          { name: 'hp', displayName: 'HP', baseStat: 45, percentage: 18 },
          { name: 'attack', displayName: 'ATK', baseStat: 49, percentage: 20 },
        ],
      };
      expect((component as any).totalStats).toBe(94);
      expect((component as any).stats.length).toBe(2);

      component.pokemon = {
        ...mockPokemon,
        stats: [],
        totalStats: 318,
      };
      expect((component as any).totalStats).toBe(318);
    });

    it('should choose shiny sprite in getSpriteForEvolution when shiny is active', () => {
      const evoPoke = {
        id: 2,
        name: 'ivysaur',
        sprite: '2.png',
        spriteShiny: '2s.png',
        types: ['grass'],
        isBaby: false,
      };

      component.shiny = false;
      expect((component as any).getSpriteForEvolution(evoPoke)).toBe('2.png');

      component.shiny = true;
      expect((component as any).getSpriteForEvolution(evoPoke)).toBe('2s.png');
    });

    it('should reset evolution state when pokemon is set to null', () => {
      component.pokemon = null;
      component.ngOnChanges({
        pokemon: new SimpleChange(mockPokemon, null, false),
      });

      expect((component as any).evolutionChain()).toBeNull();
      expect((component as any).evolutionLoading()).toBeFalse();
      expect((component as any).evolutionError()).toBeNull();
    });
  });
});
