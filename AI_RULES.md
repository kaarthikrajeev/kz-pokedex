# AI Development Rules: Angular Pokédex

This file provides mandatory instructions for all autonomous coding agents (e.g., Antigravity, Copilot, Claude, Gemini) working on this project. 

## Project Overview
* **Framework**: Angular 20 (Standalone components, Signals, modern control flow).
* **Language**: TypeScript.
* **Styling**: Neo-brutalist (thick borders, hard offset shadows, uppercase text, bold typography).
* **Data Source**: PokeAPI.
* **Testing**: Jasmine, Karma (ChromeHeadless).

## Mandatory Workflow
1. **Inspect Before Modifying**: Read `README.md`, `AI_CONTEXT.md`, and relevant component/service files before making changes.
2. **Reuse First**: Use existing models (`Pokemon`), services (`PokedexService`), and caches before writing new logic.
3. **Extend, Don't Duplicate**: Add to existing data structures instead of creating parallel state.
4. **Test & Verify**: Run `npm run build` and `npm run test` (if applicable) before concluding.

## Architecture Rules
* **No NgModules**: Strictly use Standalone Components.
* **Reactive State**: Use Angular Signals (`signal`, `computed`, `effect`) for state management over RxJS `BehaviorSubject` where applicable in components.
* **Logic Separation**: Keep HTTP calls and caching exclusively inside the `PokedexService` (or similar services). UI components must only subscribe to or read signals from these services.
* **No Unnecessary Refactors**: Do not rewrite working systems or move established business logic unless explicitly requested.

## API & Caching Rules
* **PokeAPI Metadata**: Reuse metadata available in paginated responses (like the `count` field) instead of firing duplicate `/pokemon?limit=1` requests.
* **Detail Response Cache**: `PokedexService` caches completed Pokémon details in an in-memory Map (`pokemonCache`) and persists them to `localStorage`. ALWAYS check this cache before making network calls.
* **In-Flight Request Sharing**: `PokedexService` maps in-flight detail requests via `pokemonRequests` Map and `shareReplay`. If a Pokémon is already being fetched, subscribe to the existing observable.
* **Zero Duplicate Calls**: Before initiating a new PokeAPI request, the flow MUST be: `Check Local State -> Check LocalStorage Cache -> Check In-Flight Map -> Make New API Request`.

## Pagination & Search Rules
* **Infinite Scroll**: The main roster relies on pagination (24 per page by default) with an `IntersectionObserver`. Do not load the full roster at startup.
* **Search Flow**: 
  1. Numeric & Exact names: Route directly to exact `getPokemonDetails` lookups.
  2. Partial names: Rely on a lightweight, in-memory search index (`GET /pokemon?limit=100000`).
  3. Never iterate through pagination pages to find a search result.
* **Search Cancellation**: Use RxJS `switchMap` for search inputs to prevent race conditions and cancel stale queries.

## Filtering & Counters Rules
* **Type Filters**: The application supports up to 2 simultaneous type filters using `AND` logic. Selecting 'ALL' clears filters.
* **Favorites**: Favorites filter must seamlessly combine with type filters and search.
* **Counters Integrity**: 
  * "TOTAL POKÉMON" indicates the absolute number of Pokémon in the API. It must NOT change when searching or filtering.
  * "VISIBLE ENTRIES" indicates the currently rendered list size.
  * Never make API calls to recount visible or total entries if the data is already held in memory.

## Detail View & Sprite Rules
* **Race Condition Protection**: The `PokemonDetailsComponent` or `App` component tracks a `detailRequestId` or leverages `switchMap` to ensure slow API responses don't overwrite newly selected Pokémon. Do not remove this logic.
* **Sprite Caching**: Normal and Shiny sprite URLs are generated deterministically and rely on the browser's native HTTP cache. 
* **Preloading**: Sprites are preloaded into an in-memory `Set` (`preloadedSprites`) when a detail view opens. Do not bypass or duplicate this.

## Loading UI Rules
* **Skeleton Cards**: Used during pagination fetching. Must maintain the same dimensions as real cards to prevent layout shift.
* **Poké Ball Spinners**: Used for blocking API loading operations (`<app-pokemon-loader>`).
* **Image Fallbacks**: Handled via `(error)` bindings falling back to a question mark SVG.

## UI/UX Rules
* **Neo-Brutalist Aesthetic**: Maintain strict adherence to:
  * Dark/contrast backgrounds with light UI panels.
  * Thick borders (e.g., `border: 4px solid var(--outline)`).
  * Hard offset shadows (e.g., `box-shadow: 7px 7px 0 var(--outline)`).
  * Uppercase, bold typography for headers and meta labels.
* **No Modernist Tropes**: Do not introduce glassmorphism, soft gradients, or pill-shaped drop shadows.

## Responsive Design
* **Flex/Grid Wrapping**: Ensure elements like `.topbar__stats` and `.pokemon-grid` wrap naturally. Never hardcode absolute widths that break mobile viewports.

## Testing Rules
* Execute `npm run build` to verify compilation.
* Preserve existing tests in `*.spec.ts`. If modifying business logic, update the corresponding assertions rather than deleting them.

## Documentation Rules
* Keep `README.md` and `AI_CONTEXT.md` perfectly synchronized with actual implementation details. Do not document planned or aspirational features as complete.

---

## Regression Checklist
Before finalizing changes, verify:
- [ ] Initial roster loads (24 items).
- [ ] Infinite scroll fetches the next page.
- [ ] Search by ID, Exact Name, and Partial Name functions without triggering pagination.
- [ ] Multi-type filters (up to 2) and Favorites toggle correctly filter the current view.
- [ ] "TOTAL" counter remains static; "VISIBLE" counter updates dynamically.
- [ ] Detail dialog opens, handles API latency smoothly, and displays correct types/stats.
- [ ] Shiny toggle switches sprites without redundant API calls.
- [ ] Production build (`npm run build`) completes with zero errors.

---

## 🤖 Compact Instructions for LLMs
**Inspect before you code.** Use Angular 20 Signals & Standalone components. Maintain the Neo-brutalist UI (hard shadows, thick borders). Rely on `PokedexService` for all API calls and strictly adhere to its triple-layer cache (LocalStorage Map -> In-Flight Map -> Network). Handle search via the lightweight index, not pagination loops. Keep "TOTAL POKÉMON" static. Verify your work with `npm run build`.
