import { Injectable, signal } from '@angular/core';

export const SOUND_STORAGE_KEY = 'pokedex.soundEnabled';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  readonly soundEnabled = signal<boolean>(this.loadSoundPreference());
  readonly isPlaying = signal<boolean>(false);
  readonly currentCryUrl = signal<string | null>(null);

  private audio: HTMLAudioElement | null = null;
  private readonly defaultVolume = 0.55;

  constructor() {
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      try {
        this.audio = new Audio();
        this.audio.volume = this.defaultVolume;
        this.audio.addEventListener('ended', () => {
          this.isPlaying.set(false);
          this.currentCryUrl.set(null);
        });
        this.audio.addEventListener('error', () => {
          this.isPlaying.set(false);
          this.currentCryUrl.set(null);
        });
        this.audio.addEventListener('pause', () => {
          this.isPlaying.set(false);
        });
      } catch (e) {
        console.warn('Audio is not supported in this environment:', e);
      }
    }
  }

  private audioCtx: AudioContext | null = null;

  toggleSound(): boolean {
    const nextState = !this.soundEnabled();
    this.soundEnabled.set(nextState);
    this.persistSoundPreference(nextState);
    if (!nextState) {
      this.stop();
    } else {
      this.playPokeballCatchSound();
    }
    return nextState;
  }

  playPokeballCatchSound(): void {
    if (!this.soundEnabled()) {
      return;
    }

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.defaultVolume * 0.7, now);
      masterGain.connect(ctx.destination);

      // Part 1: 3 quick Pokéball wobble clicks
      const clickTimes = [0, 0.14, 0.28];
      clickTimes.forEach((t) => {
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(650, now + t);
        clickOsc.frequency.exponentialRampToValueAtTime(180, now + t + 0.05);

        clickGain.gain.setValueAtTime(0.4, now + t);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.05);

        clickOsc.connect(clickGain);
        clickGain.connect(masterGain);

        clickOsc.start(now + t);
        clickOsc.stop(now + t + 0.055);
      });

      // Part 2: Triumphant Pokéball Catch Chime (C5, E5, G5, C6)
      const chimeNotes = [
        { freq: 523.25, time: 0.44, dur: 0.09 }, // C5
        { freq: 659.25, time: 0.54, dur: 0.09 }, // E5
        { freq: 783.99, time: 0.64, dur: 0.11 }, // G5
        { freq: 1046.50, time: 0.76, dur: 0.32 }, // C6
      ];

      chimeNotes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        gain.gain.setValueAtTime(0.001, now + note.time);
        gain.gain.linearRampToValueAtTime(0.5, now + note.time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + note.time);
        osc.stop(now + note.time + note.dur + 0.02);
      });

      // Sparkle overtone harmonic
      const sparkleOsc = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkleOsc.type = 'triangle';
      sparkleOsc.frequency.setValueAtTime(2093.00, now + 0.76);
      sparkleGain.gain.setValueAtTime(0.001, now + 0.76);
      sparkleGain.gain.linearRampToValueAtTime(0.25, now + 0.78);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.08);

      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(masterGain);

      sparkleOsc.start(now + 0.76);
      sparkleOsc.stop(now + 1.10);
    } catch (e) {
      console.warn('Failed to play Pokeball catch sound:', e);
    }
  }

  playShinySparkleSound(): void {
    if (!this.soundEnabled()) {
      return;
    }

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.defaultVolume * 0.65, now);
      masterGain.connect(ctx.destination);

      // Rapid glittering sparkle notes (crystalline ascending twinkling stars)
      const sparkleFreqs = [
        1318.51, // E6
        1567.98, // G6
        1975.53, // B6
        2637.02, // E7
        3135.96, // G7
        3951.07, // B7
        5274.04, // E8
      ];

      sparkleFreqs.forEach((freq, index) => {
        const startTime = now + index * 0.038;
        const dur = 0.18;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.linearRampToValueAtTime(freq * 1.03, startTime + dur);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.35, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + dur + 0.02);
      });

      // Shimmering resonant chime bell
      const bellOsc = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(2093.0, now + 0.15); // C7
      bellGain.gain.setValueAtTime(0.001, now + 0.15);
      bellGain.gain.linearRampToValueAtTime(0.3, now + 0.17);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      bellOsc.connect(bellGain);
      bellGain.connect(masterGain);

      bellOsc.start(now + 0.15);
      bellOsc.stop(now + 0.58);
    } catch (e) {
      console.warn('Failed to play shiny sparkle sound:', e);
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!this.audioCtx) {
      try {
        this.audioCtx = new AudioContextClass();
      } catch (e) {
        console.warn('Could not initialize AudioContext:', e);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled.set(enabled);
    this.persistSoundPreference(enabled);
    if (!enabled) {
      this.stop();
    }
  }

  playCry(cryUrl: string | null | undefined, force = false): Promise<boolean> {
    if (!cryUrl || typeof cryUrl !== 'string') {
      return Promise.resolve(false);
    }

    if (!this.soundEnabled() && !force) {
      return Promise.resolve(false);
    }

    if (force && !this.soundEnabled()) {
      this.setSoundEnabled(true);
    }

    if (!this.audio) {
      return Promise.resolve(false);
    }

    try {
      this.stop();
      this.audio.src = cryUrl;
      this.audio.volume = this.defaultVolume;
      this.currentCryUrl.set(cryUrl);
      this.isPlaying.set(true);

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        return playPromise
          .then(() => true)
          .catch((err) => {
            console.warn('Audio playback prevented or failed:', err);
            this.isPlaying.set(false);
            this.currentCryUrl.set(null);
            return false;
          });
      }
      return Promise.resolve(true);
    } catch (err) {
      console.warn('Audio playback error:', err);
      this.isPlaying.set(false);
      this.currentCryUrl.set(null);
      return Promise.resolve(false);
    }
  }

  stop(): void {
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch {
        // Safe fallback for mock/unsupported environments
      }
    }
    this.isPlaying.set(false);
    this.currentCryUrl.set(null);
  }

  private loadSoundPreference(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return true;
    }
    try {
      const stored = localStorage.getItem(SOUND_STORAGE_KEY);
      if (stored === null) {
        return true;
      }
      return stored === 'true';
    } catch {
      return true;
    }
  }

  private persistSoundPreference(enabled: boolean): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    } catch (e) {
      console.warn('Failed to persist sound preference:', e);
    }
  }
}
