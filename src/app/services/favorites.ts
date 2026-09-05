import { Injectable, signal, Signal } from '@angular/core';

export const FAVORITES_STORAGE_KEY = 'kz_pokedex_favorites';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly favoritesSignal = signal<Set<number>>(this.loadInitialFavorites());
  public readonly favorites: Signal<Set<number>> = this.favoritesSignal.asReadonly();

  isFavorite(pokemonId: number): boolean {
    return this.favoritesSignal().has(pokemonId);
  }

  toggleFavorite(pokemonId: number): boolean {
    const current = new Set(this.favoritesSignal());
    let added = false;
    if (current.has(pokemonId)) {
      current.delete(pokemonId);
    } else {
      current.add(pokemonId);
      added = true;
    }
    this.favoritesSignal.set(current);
    this.persistToStorage(current);
    return added;
  }

  clearFavorites(): void {
    const empty = new Set<number>();
    this.favoritesSignal.set(empty);
    this.persistToStorage(empty);
  }

  private loadInitialFavorites(): Set<number> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return new Set();
    }
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return new Set(
            parsed.filter((id): id is number => typeof id === 'number' && Number.isInteger(id)),
          );
        }
      }
    } catch (error) {
      console.warn('Failed to load favorites from localStorage:', error);
    }
    return new Set();
  }

  private persistToStorage(favorites: Set<number>): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favorites)));
    } catch (error) {
      console.warn('Failed to save favorites to localStorage:', error);
    }
  }
}
