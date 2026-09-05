# 🔴⚪ Angular Pokédex ⚪🔴

⚡ A vibrant, responsive Pokédex built with **Angular 20**! It loads Pokémon from [PokeAPI](https://pokeapi.co/) using efficient pagination and infinite scroll, provides local name and type filtering, and opens a detailed view with both normal and ✨shiny✨ sprites.

---

## ✨ Features

*   📖 **Complete Roster:** Lists all Pokémon from the PokeAPI with numbered cards.
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

## Angular Resource / httpResource Architecture
- **rxResource Integration:** The detailed PokÃ©mon view leverages Angular 20's `rxResource` to automatically manage loading states, error states, and cancellation of stale requests during rapid navigation.
- **Cache Integrity:** By wrapping the existing `PokedexService` Observable within `rxResource`, the application retains its highly optimized `Map`-based caching and RxJS-based request deduplication (`shareReplay`), ensuring we do not fetch the same data twice while still benefiting from modern signal-driven reactivity.

## 🏛️ Architecture
App coordinates the detailed view state and delegates list orchestration to `PokemonListStateService`:

Plaintext
PokeAPI
  -> PokedexService (caching, deduplication, HTTP logic)
  -> PokemonListStateService (search, pagination, filters)
  -> App Component (modal state, orchestrator)
  -> Standalone UI Components
The UI is split into standalone components:

🎴 PokemonCardComponent: Renders one list entry and emits selection events.

🔍 PokemonDetailsComponent: Renders the dialog content, sprite loading state, skeleton, and shiny toggle.

🔴 PokemonLoaderComponent: Provides the reusable rotating Poké Ball loader.

💾 Caching and Sprite Loading
🧠 Completed detail responses and parsed evolution chains are stored in in-memory Maps.

🤝 Duplicate detail and evolution requests made while a request is pending share one observable through shareReplay.

🚀 Normal and shiny image URLs are preloaded only when a Pokémon is opened.

🛡️ An in-memory Set prevents duplicate preloads during the current session.

📦 The browser's native HTTP image cache is reused (no cache-busting query parameters).

🌀 The full Poké Ball loader is used for API loading. Secondary skeleton/spinners are used for evolution trees. A smaller loader inside the detail image box is used for sprites.