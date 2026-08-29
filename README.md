🚀 Angular Pokédex v1.1.0
🌍 Expanded Beyond Kanto

The Pokédex has been upgraded from the original Kanto-only experience to support browsing Pokémon from the complete PokeAPI collection.

This release focuses on improved scalability, performance, filtering, loading experience, and API efficiency.

✨ What's New
🌐 All Pokémon Support
Replaced the Kanto-specific Pokédex loading approach.
Pokémon are now loaded from the PokeAPI Pokémon resource.
The application is no longer limited to the Kanto region.
Pokémon are loaded incrementally instead of fetching the complete dataset at startup.
♾️ Infinite Scroll & Pagination
Added efficient PokeAPI pagination.
Pokémon are loaded in batches of 24 entries.
Added IntersectionObserver-based infinite scrolling.
Additional Pokémon are automatically loaded when reaching the end of the list.
Prevents unnecessary duplicate API requests during scrolling.
🦴 Skeleton Loading
Added Neo-Brutalist Pokémon card skeletons while loading new Pokémon pages.
Existing Pokémon remain visible while the next page loads.
Added sprite-level loading placeholders to prevent layout shifts.
Pokémon cards can render their available information while sprites continue loading.
🔍 Improved Type Filtering
Added support for selecting up to two Pokémon types simultaneously.
Multiple selected types use AND filtering.

Example:

FIRE + FLYING

Only Pokémon containing both types are displayed.

Selecting ALL clears active type filters.
Active filters are visually highlighted.
Prevents selecting more than two types.
✨ Improved Shiny Sprite Handling
Improved normal and shiny sprite switching reliability.
Added caching to reduce unnecessary sprite loading.
Preloads normal and shiny sprites when Pokémon details are opened.
Handles unavailable shiny or normal sprites safely.
⚡ Performance & Caching Improvements
Completed Pokémon detail responses are cached in memory.
In-flight detail requests are shared to prevent duplicate API calls.
Previously loaded Pokémon are retained while browsing.
Sprite URLs are preloaded only once per session.
Browser-native image caching is reused.
🎨 UI & UX Improvements
Added clearer selected states for Pokémon type filters.
Improved loading feedback across the application.
Added reusable Neo-Brutalist skeleton cards.
Improved sprite loading experience.
Maintained consistent card sizing when search or filtering produces only one or two Pokémon.
Preserved the existing Neo-Brutalist Pokédex visual style.
🏗️ Technical Improvements
Angular 20 standalone architecture maintained.
Angular Signals continue to manage application state.
Efficient paginated API loading added.
IntersectionObserver used instead of continuous scroll listeners.
Existing reusable PokemonLoaderComponent integrated into loading flows.
Search, filtering, caching, and pagination work together without unnecessary data duplication.
🔄 Updated Data Flow
PokeAPI
   ↓
Paginated Pokémon List
   ↓
Load Current Batch
   ↓
Fetch Required Pokémon Details
   ↓
Cache Results
   ↓
Append to Pokémon List
   ↓
Search + Type Filters
   ↓
Pokémon Grid
   ↓
IntersectionObserver
   ↓
Load Next Batch
🐛 Improvements
Reduced unnecessary API requests.
Prevented duplicate loading during rapid scrolling.
Improved shiny sprite switching reliability.
Prevented stale Pokémon detail responses from replacing the currently selected Pokémon.
Prevented oversized cards when search/filter results contain only one or two Pokémon.
Added safer handling for unavailable sprites.
🚀 Try It

Angular Pokédex Live Demo

📦 Version

v1.1.0

Previous Release
v1.0.0
Kanto Pokédex
- Kanto Pokémon browsing
- Name search
- Pokémon details
- Normal and shiny sprites
- Initial API integration
Current Release
v1.1.0
Expanded Pokédex
- All Pokémon support
- Pagination
- Infinite scrolling
- Skeleton loading
- Sprite loading states
- Multi-type filtering
- Improved caching
- Improved shiny sprite handling
- Performance improvements
