# Angular Pokédex

A responsive Kanto-region Pokédex built with Angular 20. It loads the original 151 Pokémon from [PokeAPI](https://pokeapi.co/), provides local name filtering, and opens a detailed view with normal and shiny sprites.

## Features

- Lists all 151 Kanto Pokédex entries with numbered cards
- Displays Pokémon sprites and type badges with type-specific colors
- Filters the list by name while typing
- Opens details in a native popover dialog
- Shows types, height, weight, and species descriptions
- Toggles reliably between normal and shiny sprites
- Shows a detail skeleton and Poké Ball loader during API requests
- Shows a sprite loader while normal or shiny images load
- Falls back safely when an image or shiny sprite is unavailable
- Prevents stale detail responses from replacing the selected Pokémon
- Caches completed detail data and shares in-flight detail requests
- Preloads each opened Pokémon's normal and shiny sprite URL once per session

## Tech Stack

- Angular 20 standalone components
- TypeScript
- Angular HttpClient
- RxJS
- Angular Signals and modern template control flow
- CSS
- Jasmine, Karma, and ChromeHeadless

## Requirements

- Node.js LTS
- npm
- Internet access while using the app, because data and sprites are loaded remotely
- Chrome or Chromium for browser-based tests

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Open `http://localhost:4200/` in a browser.

## Available Scripts

| Command         | Description                                             |
| --------------- | ------------------------------------------------------- |
| `npm start`     | Starts the Angular development server                   |
| `npm run build` | Creates a production build in `dist/kz-pokedex/browser` |
| `npm run watch` | Continuously builds with the development configuration  |
| `npm test`      | Runs the Jasmine/Karma test suite                       |

For a non-interactive test run:

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

## Architecture

`App` owns page-level state and coordinates the service:

```text
PokeAPI
  -> PokedexService
  -> cached Pokemon detail data
  -> activePokemon signal
  -> isShiny signal
  -> currentSprite computed signal
  -> detail image
```

The UI is split into standalone components:

- `PokemonCardComponent` renders one list entry and emits selection events.
- `PokemonDetailsComponent` renders the dialog content, sprite loading state, skeleton, and shiny toggle.
- `PokemonLoaderComponent` provides the reusable rotating Poké Ball loader.

`PokedexService` first loads the Kanto index, then requests Pokémon data to populate list type badges. Opening a card requests the Pokémon and species endpoints in parallel. Height and weight are converted from PokeAPI's decimeters and hectograms to meters and kilograms. Descriptions prefer English flavor text and fall back to the first available entry.

## Caching and Sprite Loading

- Completed detail responses are stored in an in-memory `Map`.
- Duplicate detail requests made while a request is still pending share one observable through `shareReplay`.
- Normal and shiny image URLs are preloaded only when a Pokémon is opened.
- An in-memory `Set` prevents duplicate preloads during the current session.
- The browser's native HTTP image cache is reused; no cache-busting query parameters are added.
- The full Pokémon loader is used for API loading. A smaller loader inside the detail image box is used for sprite loading.

## Project Structure

```text
src/
  app/
    app.ts                         Page state and event coordination
    app.html                       Page layout and component composition
    app.css                        Application layout and component styles
    app.config.ts                  HttpClient, router, and zoneless providers
    models/types.ts                Pokemon domain interfaces
    services/pokedex.ts            PokeAPI requests, mapping, and caching
    shared/
      pokemon-card/               Standalone list-card component
      pokemon-details/            Standalone detail-dialog component
      pokemon-loader/              Reusable Poké Ball loader
  main.ts                          Application bootstrap
  styles.css                       Global styles and type colors
public/                            Static assets
```

## API Endpoints

The app uses these public resources:

- `GET https://pokeapi.co/api/v2/pokedex/kanto`
- `GET https://pokeapi.co/api/v2/pokemon/{name-or-id}`
- `GET https://pokeapi.co/api/v2/pokemon-species/{name-or-id}`
- Sprite files from `raw.githubusercontent.com/PokeAPI/sprites`

The app requires network access to load its runtime data. API failures are surfaced through the existing error state.

## Current Limitations

- Search currently filters by Pokémon name; the number shown in the placeholder is not a separate search mode.
- Data is cached only in memory and is cleared when the page is reloaded.
- The production build reports an existing component CSS budget warning for `app.css`; it does not prevent development builds or tests from running.

## License and Attribution

This project is for educational and personal use. Pokémon names and character designs are trademarks of Nintendo, Game Freak, and The Pokémon Company. Data is provided by [PokeAPI](https://pokeapi.co/).
