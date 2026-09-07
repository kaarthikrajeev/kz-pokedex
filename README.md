# 🔴⚪ Angular Pokédex ⚪🔴

⚡ A vibrant, responsive Pokédex built with **Angular 20**! It loads Pokémon from [PokeAPI](https://pokeapi.co/) using efficient pagination and infinite scroll, provides local name and type filtering, and opens a detailed view with both normal and ✨shiny✨ sprites.

---

## ✨ Features

*   📖 **Complete Roster:** Lists all Pokémon from the PokeAPI with numbered cards.
*   🗺️ **Region Selection:** Dedicated interactive region selector panel supporting all 9 Pokémon generations (Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, Hisui, Paldea) and All Regions with region-bounded pagination and counts.
*   🔄 **Infinite Scroll:** Loads Pokémon efficiently using pagination (24 per page).
*   📊 **Total Count Tracking:** Displays the total number of Pokémon available from PokeAPI (reusing pagination metadata to avoid unnecessary requests), alongside the currently visible filtered Pokémon count.
*   🎨 **Vibrant UI:** Displays Pokémon sprites and type badges with type-specific colors.
*   🔍 **Smart Search:** Filters the list by name in real-time while typing.
*   🧬 **Advanced Filtering:** Filters by Pokémon type (supports selecting up to 2 types simultaneously with AND logic) and favorites.
*   📱 **Native Popovers:** Opens details in a native dialog element.
*   📏 **Detailed Stats:** Shows types, height, weight, and species descriptions.
*   🌿 **Evolution Chain:** Visualizes complete linear, branching, and multi-stage evolution paths with interactive Pokémon cards, baby stage indicators, and human-readable evolution requirements (e.g., Level, Evolution Stone, Trade, Friendship, Time of Day).
*   🔄 **Interactive Evolution Navigation:** Seamlessly switch the active detail view by clicking any Pokémon in the evolution chain without reloading the modal.
*   🌟 **Shiny Toggle:** Switches reliably between normal and shiny sprites across main figures and evolution chain cards.
*   🦴 **Smooth Loading:** Shows skeleton loaders while fetching new pages and evolution trees.
*   🔴 **Poké Ball Spinners:** Shows a detail skeleton and rotating Poké Ball loader during API requests.
*   🖼️ **Sprite States:** Shows a sprite loader while normal or shiny images load.
*   🛡️ **Safe Fallbacks:** Handles missing images, shiny sprites, or missing evolution data gracefully without breaking the modal.
*   🛑 **Race Condition Protection:** Prevents stale detail or evolution responses from replacing the currently selected Pokémon.
*   🧠 **Smart Caching:** Caches completed detail data, evolution trees, and shares in-flight requests.
*   ⚡ **Preloading:** Preloads each opened Pokémon's normal and shiny sprite URL once per session.

## 🛠️ Tech Stack

*   🛡️ **Angular 20** (Zoneless Change Detection, Standalone components, Signals, modern control flow)
*   🟦 **TypeScript**
*   🌐 **Angular HttpClient & RxJS**
*   🎨 **CSS**
*   🧪 **Jasmine, Karma, & ChromeHeadless**

## 🎒 Requirements

*   🟢 **Node.js LTS**
*   📦 **npm**
*   📡 **Internet access** (required to catch 'em all remotely via API)
*   🌐 **Chrome or Chromium** for browser-based tests

## 🚀 Getting Started

Equip your dependencies:

```bash
npm install
```

Run the development server:

```bash
npm start
```

Navigate to `http://localhost:4200/` to explore the Pokédex!

---

## 🏛️ Architecture

`App` coordinates the detailed view state and delegates list orchestration to `PokemonListStateService`:

```
PokeAPI
  -> PokedexService (caching, deduplication, HTTP logic)
  -> PokemonListStateService (search, pagination, filters)
  -> App Component (modal state, orchestrator)
  -> Standalone UI Components
```

### Standalone UI Components:
* 🎴 **`PokemonCardComponent`**: Renders one list entry, type badges, favorite status toggle with sound effect, and emits selection events.
* 🔍 **`PokemonDetailsComponent`**: Renders the dialog content, sprite loading state, stats breakdown, cries audio player, interactive evolution tree, and shiny toggle.
* 🔴 **`PokemonLoaderComponent`**: Provides the reusable rotating Poké Ball loader.

### Modern Angular 20 Features:
* **`provideZonelessChangeDetection()`**: Completely zoneless reactivity powered by Signals and Computed values.
* **`rxResource` Integration**: Pokémon details are queried using Angular 20's `rxResource()`, providing native `.isLoading()` / `.error()` status signals and automatic request cancellation when switching between Pokémon.
* **Caching & Deduplication**: In-memory `Map` caching with `shareReplay` for in-flight requests and `localStorage` persistence.

---

## 🧪 Testing Suite & Architecture

The application has a comprehensive automated test suite built with **Jasmine**, **Karma**, and **ChromeHeadless**, fully compatible with Zoneless Angular 20.

### Test Commands

```bash
# Run unit tests once in headless Chrome
npm test

# Run tests in continuous watch mode for development
npm run test:watch

# Run CI test suite with JUnit XML reporting
npm run test:ci

# Run test suite with code coverage analysis and enforce coverage thresholds
npm run test:coverage
```

### Coverage Thresholds & Quality Metrics

* **Statements:** $\ge 90\%$ (Current: **93.10%**)
* **Branches:** $\ge 80\%$ (Current: **81.51%**)
* **Functions:** $\ge 90\%$ (Current: **94.63%**)
* **Lines:** $\ge 90\%$ (Current: **94.30%**)
* **Total Tests:** 163 specs passing (0 failures)

### Reporting & Artifacts

* **Code Coverage Report:** `coverage/kz-pokedex/index.html` (and LCOV `coverage/kz-pokedex/lcov.info`)
* **CI JUnit XML Report:** `coverage/junit/test-results.xml`

### Test Architecture & Central Mocks

* **Central Mock Factory (`src/testing/mock-data.ts`):** Provides strongly typed, centralized helper functions for synthesizing mock Pokémon models, PokeAPI detail payloads, species responses, evolution chains, and paginated lists with zero external network dependencies.
* **Component Testing:** Covers `App`, `PokemonCardComponent`, `PokemonDetailsComponent`, and `PokemonLoaderComponent` across all user interactions, keyboard accessibility (`Enter`/`Space`), image error fallbacks, dialog/popover states, and audio/visual cues.
* **Service Testing:** Full branch coverage across `PokedexService`, `PokemonListStateService`, `FavoritesService`, and `SoundService` (including Web Audio API synthesize logic, localStorage persistence, and cache eviction).
