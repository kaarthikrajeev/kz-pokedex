# AI Context & Memory: Angular Pokédex

This file is created for future AI reference regarding the `kz-pokedex` project structure, architecture, and UI/UX design.

## 🏛️ Project Architecture
- **Framework:** Angular 20 (Standalone components, Signals, modern control flow).
- **Language:** TypeScript.
- **Data Source:** [PokeAPI](https://pokeapi.co/).
- **Testing:** Jasmine, Karma, ChromeHeadless.

## Zoneless Change Detection
- **Zoneless Angular Adoption**: The application successfully uses `provideZonelessChangeDetection()` and operates completely without `zone.js`.
- **Change Detection Patterns**: 
  1. Prefer Signals for template-facing reactive state.
  2. Prefer `computed()` for derived state.
  3. Avoid `effect()` for derived state.
  4. Do not rely on Zone.js to trigger UI updates.
  5. Prefer Angular-native event/state mechanisms.
  6. Avoid unnecessary `ChangeDetectorRef.detectChanges()`.
  7. Use RxJS for asynchronous stream composition where appropriate.
  8. Use `takeUntilDestroyed()` for lifecycle-safe subscriptions.
  9. Do not introduce timers when an Angular/RxJS mechanism is more appropriate.
  10. Keep third-party integrations isolated when they operate outside Angular.

## Angular Resource / httpResource Architecture
- **Where rxResource is used**: `App` component uses `rxResource()` to fetch Pokémon details interactively.
- **Why it is used**: Natively provides `.isLoading()` and `.error()` reactive states, and automatically cancels stale in-flight requests when the user rapidly clicks between Pokémon cards.
- **Where HttpClient/RxJS is still used**: `PokedexService` still uses `HttpClient` and RxJS (`switchMap`, `shareReplay`) to orchestrate dependent API calls (fetching Pokemon + Species data) and parsing the results into a unified `Pokemon` model.
- **Caching Interaction**: By passing `this.#pokemonService.getPokemonDetails(id)` directly into `rxResource`'s `stream` loader, we preserve our robust in-memory `Map` cache and localStorage persistence, rather than bypassing it with `httpResource()`.
- **Cancellation**: Angular's `rxResource` automatically aborts/cancels previous streams if the `params()` signal updates, mitigating race conditions without manual ID tracking.
- **What should NOT be migrated automatically**: 
  - **Evolution Chain / Species details**: They already utilize dependent RxJS compositions internally within `PokedexService`. Creating separate resources for them would introduce complexity in combining results back into the mapped `Pokemon` model unless a larger architectural shift is undertaken.
  - **Pagination / Search**: They require list accumulation and infinite scrolling state, which `resource()` does not handle out-of-the-box as gracefully as our custom Signal-based state service.

## 📂 Source Structure
- `src/app/`
  - `models/`: Type definitions and interfaces (`pokemon-types.ts`, `types.ts`).
  - `services/`: API interaction, state management, caching (`pokedex.ts`).
  - `shared/`: Reusable standalone components.
    - `pokemon-card/`: The list entry component.
    - `pokemon-details/`: The dialog/modal for detailed stats.
    - `pokemon-loader/`: Reusable rotating Poké Ball loader.
  - `styles/` & `src/styles/`: Contains stylesheets, notably `types.css` for Pokémon-type-specific colors.

## 🧠 State & Data Management
- **PokedexService**:
  - Employs an in-memory Map for caching completed detail responses and parsed evolution chains.
  - Uses `shareReplay` to share in-flight requests and avoid duplicate network calls.
  - Extracts `evolution_chain.url` from species data and recursively parses evolution trees into stage views (`EvolutionChain`, `EvolutionNode`, `EvolutionStage`).
  - Hydrates missing types for Pokémon in the chain without duplicate full-pokedex requests.
- **PokemonListStateService**:
  - Extracted from `App` component to handle pagination, search state, filtering, and intersection observer orchestration.
  - Exposes Signals (`pokemon`, `searchQuery`, `selectedTypes`) and computed derived state (`filteredPokemon`, `hasMore`).
- **App Component**:
  - Handles page orchestration, modal detailed view state (`activePokemon`, `isShiny`), and preloads normal/shiny image URLs when a Pokémon is opened.
  - Orchestrates interactive navigation from evolution chain clicks back into the main detail loader.

## 🎨 UI & Layout (From visual references)
- **Theme:** Dark mode background with a clean, grid-based layout.
- **Header:** Title "ALL REGIONS POKÉDEX", accompanied by two statistics counters:
  - **TOTAL POKÉMON:** Derives the global total from the PokeAPI pagination `count` field (reused directly from the initial page load to avoid duplicate requests).
  - **VISIBLE ENTRIES:** The currently visible, filtered number of entries based on search and selected types.
- **Search:** A prominent input bar for searching by name or number.
- **Type Filter:** A row of colored, blocky buttons representing all Pokémon types (e.g., Normal, Fire, Water, Grass) supporting up to 2 active type filters (AND logic).
- **Grid Layout:** Displays Pokémon cards in a responsive grid (e.g., 4 columns on desktop).
  - Each card shows the Pokédex number (`#001`), sprite image, name, and type badges.
- **Detail Modal (`pokemon-details`):**
  - Native popover/dialog.
  - Displays larger sprite, Pokédex number, Name.
  - A yellow "sparkle" button on the top-right of the sprite box to toggle Shiny mode.
  - Type badges.
  - `HEIGHT` and `WEIGHT` in side-by-side boxes.
  - Flavor text description block and base stat bars.
  - **Evolution Chain Section:**
    - Full-width Neo-Brutalist container with connecting arrows (`→` / `↓`).
    - Handles linear, branching (e.g., Eevee), baby, and multi-stage paths.
    - Displays human-readable condition badges (Level, Evolution Stone, Trade, Friendship, Time of Day, Moves).
    - Current Pokémon highlighted with yellow accent (`.evolution-card--current`).
    - Clickable cards that switch the active Pokémon detail smoothly.
    - Isolated loading and error states without blocking the parent detail view.
  - Small loader inside the image box for sprites, and a full Poké Ball loader for API requests.
