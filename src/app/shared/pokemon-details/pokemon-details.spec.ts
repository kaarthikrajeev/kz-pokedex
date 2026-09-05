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
  });
});
