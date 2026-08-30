# AI Context & Memory: Angular Pokédex

This file is created for future AI reference regarding the `kz-pokedex` project structure, architecture, and UI/UX design.

## 🏛️ Project Architecture
- **Framework:** Angular 20 (Standalone components, Signals, modern control flow).
- **Language:** TypeScript.
- **Data Source:** [PokeAPI](https://pokeapi.co/).
- **Testing:** Jasmine, Karma, ChromeHeadless.

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
  - Employs an in-memory Map for caching completed detail responses.
  - Uses `shareReplay` to share in-flight requests and avoid duplicate network calls.
- **PokemonListStateService**:
  - Extracted from `App` component to handle pagination, search state, filtering, and intersection observer orchestration.
  - Exposes Signals (`pokemon`, `searchQuery`, `selectedTypes`) and computed derived state (`filteredPokemon`, `hasMore`).
- **App Component**:
  - Handles page orchestration, modal detailed view state (`activePokemon`, `isShiny`), and preloads normal/shiny image URLs when a Pokémon is opened.

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
  - Flavor text description block at the bottom.
  - Small loader inside the image box for sprites, and a full Poké Ball loader for API requests.
