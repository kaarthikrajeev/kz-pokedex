import {
  createMockPokemon,
  createMockPokemonApiDetails,
  createMockSpeciesApiResponse,
  createMockEvolutionChain,
  createMockEvolutionChainApiResponse,
  createMockPaginatedResponse,
} from './mock-data';

describe('Testing Mock Data Factories', () => {
  it('should create default and customized Pokemon models', () => {
    const defaultPoke = createMockPokemon();
    expect(defaultPoke.id).toBe(25);
    expect(defaultPoke.name).toBe('pikachu');
    expect(defaultPoke.types).toEqual(['electric']);
    expect(defaultPoke.abilities?.length).toBe(2);
    expect(defaultPoke.stats?.length).toBe(6);

    const customPoke = createMockPokemon({
      id: 1,
      name: 'bulbasaur',
      types: ['grass', 'poison'],
      totalStats: 320,
    });
    expect(customPoke.id).toBe(1);
    expect(customPoke.name).toBe('bulbasaur');
    expect(customPoke.types).toEqual(['grass', 'poison']);
    expect(customPoke.totalStats).toBe(320);
  });

  it('should create mock PokeAPI details responses', () => {
    const details = createMockPokemonApiDetails({
      id: 4,
      name: 'charmander',
      cries: {
        latest: 'charmander.ogg',
        legacy: 'charmander-legacy.ogg',
      },
    });
    expect(details.id).toBe(4);
    expect(details.name).toBe('charmander');
    expect(details.cries?.latest).toBe('charmander.ogg');
  });

  it('should create mock Species API responses', () => {
    const species = createMockSpeciesApiResponse({
      id: 7,
      name: 'squirtle',
      flavor_text_entries: [
        {
          flavor_text: 'Shoots water at prey.',
          language: { name: 'en', url: '' },
          version: { name: 'red', url: '' },
        },
      ],
    });
    expect(species.id).toBe(7);
    expect(species.name).toBe('squirtle');
    expect(species.flavor_text_entries.length).toBe(1);
  });

  it('should create mock EvolutionChain models', () => {
    const chain = createMockEvolutionChain({
      id: 1,
      hasEvolutions: true,
    });
    expect(chain.id).toBe(1);
    expect(chain.hasEvolutions).toBeTrue();
    expect(chain.root.pokemon.name).toBe('bulbasaur');
    expect(chain.stages.length).toBe(3);
  });

  it('should create mock EvolutionChain API responses', () => {
    const apiChain = createMockEvolutionChainApiResponse({
      id: 10,
    });
    expect(apiChain.id).toBe(10);
    expect(apiChain.chain.species.name).toBe('bulbasaur');
  });

  it('should create mock paginated list responses', () => {
    const paginatedDefault = createMockPaginatedResponse();
    expect(paginatedDefault.count).toBe(1351);
    expect(paginatedDefault.results.length).toBe(3);

    const paginatedCustom = createMockPaginatedResponse(50, [
      { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
    ]);
    expect(paginatedCustom.count).toBe(50);
    expect(paginatedCustom.results.length).toBe(2);
  });
});
