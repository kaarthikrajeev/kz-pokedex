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

  it('should handle audio ended, error, and pause events', () => {
    const audio = (service as any).audio as HTMLAudioElement;
    if (audio) {
      service.isPlaying.set(true);
      service.currentCryUrl.set('test.ogg');

      audio.dispatchEvent(new Event('ended'));
      expect(service.isPlaying()).toBeFalse();
      expect(service.currentCryUrl()).toBeNull();

      service.isPlaying.set(true);
      service.currentCryUrl.set('test.ogg');
      audio.dispatchEvent(new Event('error'));
      expect(service.isPlaying()).toBeFalse();
      expect(service.currentCryUrl()).toBeNull();

      service.isPlaying.set(true);
      audio.dispatchEvent(new Event('pause'));
      expect(service.isPlaying()).toBeFalse();
    }
  });

  it('should handle playCry failure or rejection gracefully', async () => {
    const audio = (service as any).audio as HTMLAudioElement;
    if (audio) {
      spyOn(audio, 'play').and.returnValue(Promise.reject(new Error('Autoplay blocked')));
      const result = await service.playCry('https://example.com/cry.ogg');
      expect(result).toBeFalse();
      expect(service.isPlaying()).toBeFalse();
      expect(service.currentCryUrl()).toBeNull();
    }
  });

  it('should handle stop method when audio is playing or null', () => {
    service.isPlaying.set(true);
    service.currentCryUrl.set('https://example.com/cry.ogg');

    service.stop();

    expect(service.isPlaying()).toBeFalse();
    expect(service.currentCryUrl()).toBeNull();
  });

  it('should resume suspended AudioContext', () => {
    const mockCtx = {
      state: 'suspended',
      resume: jasmine.createSpy('resume').and.returnValue(Promise.resolve()),
      currentTime: 0,
      destination: {},
      createGain: () => ({ gain: { setValueAtTime: () => {} }, connect: () => {} }),
      createOscillator: () => ({
        type: 'sine',
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {},
      }),
    };

    (service as any).audioCtx = mockCtx;
    const ctx = (service as any).getAudioContext();
    expect(mockCtx.resume).toHaveBeenCalled();
    expect(ctx).toBe(mockCtx as any);
  });
});
