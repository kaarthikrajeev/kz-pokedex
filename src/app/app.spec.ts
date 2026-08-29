import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideHttpClient()]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Pokédex');
  });

  it('should lock body scroll when activePokemon is set and unlock when cleared', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();

    expect(document.body.classList.contains('modal-open')).toBeFalse();

    app.activePokemon.set({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      height: 0.4,
      weight: 6,
      sprite: null,
    });
    fixture.detectChanges();

    expect(document.body.classList.contains('modal-open')).toBeTrue();
    expect(document.body.style.overflow).toBe('hidden');

    app.activePokemon.set(null);
    fixture.detectChanges();

    expect(document.body.classList.contains('modal-open')).toBeFalse();
    expect(document.body.style.overflow).toBe('');
  });
});
