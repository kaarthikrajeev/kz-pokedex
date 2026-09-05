import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SoundService, SOUND_STORAGE_KEY } from './sound';

describe('SoundService', () => {
  let service: SoundService;

  beforeEach(() => {
    localStorage.removeItem(SOUND_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(SoundService);
  });

  afterEach(() => {
    service.stop();
    localStorage.removeItem(SOUND_STORAGE_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default soundEnabled to true', () => {
    expect(service.soundEnabled()).toBeTrue();
  });

  it('should load sound preference from localStorage on init', () => {
    localStorage.setItem(SOUND_STORAGE_KEY, 'false');
    const freshService = new SoundService();
    expect(freshService.soundEnabled()).toBeFalse();
  });

  it('should toggle sound and persist to localStorage', () => {
    expect(service.soundEnabled()).toBeTrue();

    const result1 = service.toggleSound();
    expect(result1).toBeFalse();
    expect(service.soundEnabled()).toBeFalse();
    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('false');

    const result2 = service.toggleSound();
    expect(result2).toBeTrue();
    expect(service.soundEnabled()).toBeTrue();
    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('true');
  });

  it('should stop audio playback when toggling sound off', () => {
    spyOn(service, 'stop');
    service.toggleSound();
    expect(service.stop).toHaveBeenCalled();
  });

  it('should set sound enabled explicitly and persist', () => {
    service.setSoundEnabled(false);
    expect(service.soundEnabled()).toBeFalse();
    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('false');

    service.setSoundEnabled(true);
    expect(service.soundEnabled()).toBeTrue();
    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('true');
  });

  it('should not play cry if URL is empty or null', async () => {
    const result1 = await service.playCry(null);
    expect(result1).toBeFalse();

    const result2 = await service.playCry('');
    expect(result2).toBeFalse();
  });

  it('should not play cry if sound is disabled and not forced', async () => {
    service.setSoundEnabled(false);
    const result = await service.playCry('https://example.com/cry.ogg', false);
    expect(result).toBeFalse();
    expect(service.isPlaying()).toBeFalse();
  });

  it('should auto-enable sound and attempt playback if forced when muted', async () => {
    service.setSoundEnabled(false);
    
    // Mock audio element play
    if ((service as any).audio) {
      spyOn((service as any).audio, 'play').and.returnValue(Promise.resolve());
    }

    const playResult = await service.playCry('https://example.com/cry.ogg', true);
    expect(service.soundEnabled()).toBeTrue();
  });

  it('should play Pokeball catch sound when toggling sound from disabled to enabled', () => {
    service.setSoundEnabled(false);
    spyOn(service, 'playPokeballCatchSound');

    service.toggleSound();
    expect(service.playPokeballCatchSound).toHaveBeenCalled();
  });

  it('should not throw error when executing playPokeballCatchSound', () => {
    expect(() => service.playPokeballCatchSound()).not.toThrow();
  });

  it('should ignore playPokeballCatchSound when sound is disabled', () => {
    service.setSoundEnabled(false);
    expect(() => service.playPokeballCatchSound()).not.toThrow();
  });

  it('should not throw error when executing playShinySparkleSound', () => {
    expect(() => service.playShinySparkleSound()).not.toThrow();
  });

  it('should ignore playShinySparkleSound when sound is disabled', () => {
    service.setSoundEnabled(false);
    expect(() => service.playShinySparkleSound()).not.toThrow();
  });
});
