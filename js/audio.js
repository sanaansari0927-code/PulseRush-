/**
 * REFLEX REACTOR — Web Audio API Synthesizer
 * High-performance, zero-asset, procedural arcade sound design.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true; // default muted per requirements until enabled
    this.masterGain = null;
    this.pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    this.initFromStorage();
  }

  initFromStorage() {
    try {
      const savedMute = localStorage.getItem('reflex_muted');
      if (savedMute !== null) {
        this.isMuted = JSON.parse(savedMute);
      }
    } catch (e) {
      this.isMuted = true;
    }
  }

  // Ensure AudioContext is initialized after user gesture
  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.28, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('reflex_muted', JSON.stringify(this.isMuted));
    } catch (e) {}

    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.28, t);
    }
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    try {
      localStorage.setItem('reflex_muted', JSON.stringify(this.isMuted));
    } catch (e) {}
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.28, this.ctx.currentTime);
    }
  }

  /**
   * Countdown beep
   * @param {number|string} count 3, 2, 1 or 'GO'
   */
  playCountdown(count) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const isGo = (count === 'GO' || count === 0);
    const freq = isGo ? 880 : 440; // A5 for GO, A4 for ticks
    const duration = isGo ? 0.35 : 0.15;

    osc.type = isGo ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1174.66, t + duration); // D6 ramp
    }

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  /**
   * Correct hit chime with streak pitch modulation
   * @param {number} streak Current consecutive hits
   */
  playHit(streak = 1) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const noteIndex = Math.min((streak - 1) % this.pentatonicScale.length, this.pentatonicScale.length - 1);
    const baseFreq = this.pentatonicScale[noteIndex];

    // Primary crystal chime
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, t);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.12);

    gain1.gain.setValueAtTime(0.35, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    // Harmonic sparkle
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2, t);

    gain2.gain.setValueAtTime(0.15, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc1.start(t);
    osc1.stop(t + 0.22);
    osc2.start(t);
    osc2.stop(t + 0.18);
  }

  /**
   * Inactive click miss buzzer
   */
  playMiss() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(70, t + 0.22);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Timeout miss sound
   */
  playTimeout() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.28);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  /**
   * Milestone fanfare for 5, 10, 15+ streaks
   */
  playMilestone() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
    chord.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  /**
   * Game Over Fanfare
   */
  playGameOver(isNewBest = false) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = isNewBest
      ? [392.00, 523.25, 659.25, 783.99, 1046.50]
      : [440.00, 392.00, 349.23, 329.63];

    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isNewBest ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  /**
   * UI Click
   */
  playClick() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Target spawn soft blip
   */
  playSpawn() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.06);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }
}

// Export singleton instance
window.soundEngine = new SoundEngine();

