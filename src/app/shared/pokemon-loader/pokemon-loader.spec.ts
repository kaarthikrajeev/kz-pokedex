import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PokemonLoaderComponent } from './pokemon-loader';

describe('PokemonLoaderComponent', () => {
  let component: PokemonLoaderComponent;
  let fixture: ComponentFixture<PokemonLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonLoaderComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonLoaderComponent);
    component = fixture.componentInstance;
  });

  it('should create the loader component', () => {
    expect(component).toBeTruthy();
  });

  it('should display default loading message and accessibility attributes', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const loader = element.querySelector('.pokemon-loader') as HTMLElement;
    const text = element.querySelector('.pokemon-loader__text');

    expect(loader).toBeTruthy();
    expect(loader.getAttribute('role')).toBe('status');
    expect(loader.getAttribute('aria-live')).toBe('polite');
    expect(loader.getAttribute('aria-label')).toBe('Loading Pokémon...');
    expect(text?.textContent?.trim()).toBe('Loading Pokémon...');
  });

  it('should render custom loading message when provided', () => {
    component.message = 'Loading evolution chain...';
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const loader = element.querySelector('.pokemon-loader') as HTMLElement;
    const text = element.querySelector('.pokemon-loader__text');

    expect(loader.getAttribute('aria-label')).toBe('Loading evolution chain...');
    expect(text?.textContent?.trim()).toBe('Loading evolution chain...');
  });

  it('should render visual pokeball structure elements with aria-hidden', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const wrapper = element.querySelector('.pokemon-loader__ball-wrapper');
    const ball = element.querySelector('.pokemon-loader__ball');
    const topHalf = element.querySelector('.pokemon-loader__half--top');
    const bottomHalf = element.querySelector('.pokemon-loader__half--bottom');
    const divider = element.querySelector('.pokemon-loader__divider');
    const button = element.querySelector('.pokemon-loader__button');

    expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
    expect(ball).toBeTruthy();
    expect(topHalf).toBeTruthy();
    expect(bottomHalf).toBeTruthy();
    expect(divider).toBeTruthy();
    expect(button).toBeTruthy();
  });

  it('should not render text element if message is empty', () => {
    component.message = '';
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const text = element.querySelector('.pokemon-loader__text');
    expect(text).toBeNull();
  });
});
