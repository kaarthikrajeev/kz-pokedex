import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FavoritesService, FAVORITES_STORAGE_KEY } from './favorites';

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(() => {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(FavoritesService);
  });

  afterEach(() => {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.favorites().size).toBe(0);
  });

  it('should hydrate from localStorage on instantiation', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([1, 4, 7]));

    const freshService = new FavoritesService();
    expect(freshService.isFavorite(1)).toBeTrue();
    expect(freshService.isFavorite(4)).toBeTrue();
    expect(freshService.isFavorite(7)).toBeTrue();
    expect(freshService.isFavorite(25)).toBeFalse();
    expect(freshService.favorites().size).toBe(3);
  });

  it('should toggle favorite on and off and persist to localStorage', () => {
    expect(service.isFavorite(25)).toBeFalse();

    // Toggle ON
    service.toggleFavorite(25);
    expect(service.isFavorite(25)).toBeTrue();
    expect(service.favorites().has(25)).toBeTrue();

    const stored = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]');
    expect(stored).toEqual([25]);

    // Toggle OFF
    service.toggleFavorite(25);
    expect(service.isFavorite(25)).toBeFalse();
    expect(service.favorites().has(25)).toBeFalse();

    const storedAfter = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]');
    expect(storedAfter).toEqual([]);
  });

  it('should handle corrupted JSON in localStorage gracefully', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, 'invalid-json{');

    const freshService = new FavoritesService();
    expect(freshService.favorites().size).toBe(0);
  });
});
