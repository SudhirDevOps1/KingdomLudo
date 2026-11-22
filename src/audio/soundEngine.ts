export interface SoundConfig {
  enabled: boolean;
  masterMuted: boolean;
  sfxVolume: number;
  musicVolume: number;
  ambientVolume: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  private enabled = true;
  private masterMuted = false;
  private sfxVolume = 0.75;
  private musicVolume = 0.45;
  private ambientVolume = 0.55;

  private ambienceRunning = false;
  private oceanSource: AudioBufferSourceNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private birdTimer: ReturnType<typeof setInterval> | null = null;
  private musicStep = 0;

  private ensureContext(): AudioContext | null {
    if (!this.enabled || this.masterMuted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.ambientGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.syncGains();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private syncGains(): void {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.musicGain || !this.ambientGain) {
      return;
    }
    const t = this.ctx.currentTime;
    const masterTarget = !this.enabled || this.masterMuted ? 0 : 1;
    this.masterGain.gain.setTargetAtTime(masterTarget, t, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume, t, 0.04);
    this.musicGain.gain.setTargetAtTime(this.musicVolume, t, 0.06);
    this.ambientGain.gain.setTargetAtTime(this.ambientVolume, t, 0.06);
  }

  public configure(
    enabledOrConfig: boolean | Partial<SoundConfig>,
    sfxVolume?: number,
  ): void {
    if (typeof enabledOrConfig === 'boolean') {
      this.enabled = enabledOrConfig;
      if (typeof sfxVolume === 'number') {
        this.sfxVolume = Math.max(0, Math.min(1, sfxVolume));
      }
    } else {
      if (typeof enabledOrConfig.enabled === 'boolean') {
        this.enabled = enabledOrConfig.enabled;
      }
      if (typeof enabledOrConfig.masterMuted === 'boolean') {
        this.masterMuted = enabledOrConfig.masterMuted;
      }
      if (typeof enabledOrConfig.sfxVolume === 'number') {
        this.sfxVolume = Math.max(0, Math.min(1, enabledOrConfig.sfxVolume));
      }
      if (typeof enabledOrConfig.musicVolume === 'number') {
        this.musicVolume = Math.max(0, Math.min(1, enabledOrConfig.musicVolume));
      }
      if (typeof enabledOrConfig.ambientVolume === 'number') {
        this.ambientVolume = Math.max(0, Math.min(1, enabledOrConfig.ambientVolume));
      }
    }
    this.syncGains();
    if ((!this.enabled || this.masterMuted) && this.ambienceRunning) {
      this.stopAmbience();
    }
  }

  private createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Smooth brown/pink rolloff for natural surf & breeze
      lastOut = (lastOut + 0.03 * white) / 1.03;
      data[i] = lastOut * 3.2;
    }
    return buffer;
  }

  public startAmbience(): void {
    if (this.ambienceRunning || !this.enabled || this.masterMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain || !this.musicGain) return;

    this.ambienceRunning = true;
    const noiseBuf = this.createNoiseBuffer(ctx, 4.0);

    // 1. Ocean surf wave swell (slow LFO-modulated low-pass filter)
    const oceanSrc = ctx.createBufferSource();
    oceanSrc.buffer = noiseBuf;
    oceanSrc.loop = true;

    const oceanFilter = ctx.createBiquadFilter();
    oceanFilter.type = 'lowpass';
    oceanFilter.frequency.value = 340;
    oceanFilter.Q.value = 0.7;

    const oceanSwashGain = ctx.createGain();
    oceanSwashGain.gain.value = 0.14;

    const waveLfo = ctx.createOscillator();
    waveLfo.frequency.value = 0.14; // ~7s wave period
    const waveDepth = ctx.createGain();
    waveDepth.gain.value = 180;
    waveLfo.connect(waveDepth);
    waveDepth.connect(oceanFilter.frequency);

    oceanSrc.connect(oceanFilter);
    oceanFilter.connect(oceanSwashGain);
    oceanSwashGain.connect(this.ambientGain);
    oceanSrc.start();
    waveLfo.start();
    this.oceanSource = oceanSrc;

    // 2. Gentle waterfall & courtyard breeze shimmer (band-pass)
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = noiseBuf;
    windSrc.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 820;
    windFilter.Q.value = 0.9;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.045;
    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambientGain);
    windSrc.start();
    this.windSource = windSrc;

    // 3. Occasional distant island birds
    this.birdTimer = setInterval(() => {
      if (!this.ambienceRunning || !this.ctx || !this.ambientGain || this.ambientVolume <= 0.02) {
        return;
      }
      if (Math.random() > 0.55) return;
      const now = this.ctx.currentTime;
      const chirp = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      chirp.type = 'sine';
      const f = 1800 + Math.random() * 900;
      chirp.frequency.setValueAtTime(f, now);
      chirp.frequency.exponentialRampToValueAtTime(f * 1.32, now + 0.06);
      chirp.frequency.exponentialRampToValueAtTime(f * 0.92, now + 0.14);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.025, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      chirp.connect(g);
      g.connect(this.ambientGain);
      chirp.start(now);
      chirp.stop(now + 0.18);
    }, 3400);

    // 4. Serene Royal Courtyard Pentatonic Harp/Pad Loop
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 392.0, 329.63];
    this.musicStep = 0;
    this.musicTimer = setInterval(() => {
      if (!this.ambienceRunning || !this.ctx || !this.musicGain || this.musicVolume <= 0.02) {
        return;
      }
      const now = this.ctx.currentTime;
      const freq = scale[this.musicStep % scale.length];
      this.musicStep += 1;

      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.055, now + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 1.5);
    }, 1550);
  }

  public stopAmbience(): void {
    this.ambienceRunning = false;
    if (this.oceanSource) {
      try {
        this.oceanSource.stop();
      } catch {
        // ignore
      }
      this.oceanSource = null;
    }
    if (this.windSource) {
      try {
        this.windSource.stop();
      } catch {
        // ignore
      }
      this.windSource = null;
    }
    if (this.birdTimer) {
      clearInterval(this.birdTimer);
      this.birdTimer = null;
    }
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public playDiceRoll(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // Layer 1: Filtered rattle bursts (cup rattle)
    for (let i = 0; i < 6; i++) {
      const t = now + i * 0.048;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = i % 2 === 0 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(260 + (i * 73) % 180, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.038);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 + (i % 3) * 300, t);
      filter.Q.setValueAtTime(3.5, t);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.042);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.045);
    }
  }

  public playDiceLand(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // Deep wooden impact
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);

    // High transient clack
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(980, now);
    click.frequency.exponentialRampToValueAtTime(220, now + 0.025);
    clickGain.gain.setValueAtTime(0.2, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
    click.connect(clickGain);
    clickGain.connect(this.sfxGain);
    click.start(now);
    click.stop(now + 0.03);
  }

  public playTurnAlert(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // Two-tone bright notification chime (E5 -> B5)
    [659.25, 987.77].forEach((freq, idx) => {
      const t = now + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  public playSixCelebration(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // Royal triumphant fanfare chord (C5 - E5 - G5 - C6)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = now + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  public playFootstep(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.03);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playHop(stepIndex = 0): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 340 + (stepIndex % 6) * 28;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.07);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playCapture(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // Layer 1: Metallic shield strike clash
    [320, 480, 720].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.015);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
      gain.gain.setValueAtTime(0.28, now + idx * 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.015);
      osc.stop(now + 0.24);
    });

    // Layer 2: Deep thunder thud
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.25);
    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.3);

    // Sad defeat whimper pitch slide
    setTimeout(() => {
      this.playTearDrop();
    }, 180);
  }

  public playTearDrop(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1250, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.09);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playSafeZone(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // 4-note ascending celestial chime (C5 - E5 - G5 - C6)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = now + idx * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  public playHomeEntry(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  public playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const fanfare = [392.0, 523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((freq, idx) => {
      const t = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  public playUiClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.035);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }
}

export const soundEngine = new SoundEngine();
