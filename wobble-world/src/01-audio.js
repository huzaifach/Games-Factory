'use strict';
/* WOBBLE WORLD — 01-audio.js : 100% synthesized WebAudio SFX + generative music.
   No samples, no external files. Everything is guarded so the game runs fine
   with audio disabled (Node test harness, muted browsers). */

class JellyAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.musicTimer = null;
    this.chordIdx = 0;
    // gentle I - V - vi - IV in C major, as frequencies
    this.chords = [
      [261.63, 329.63, 392.00],  // C
      [196.00, 246.94, 392.00],  // G
      [220.00, 261.63, 329.63],  // Am
      [174.61, 220.00, 349.23]   // F
    ];
    this.penta = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
  }

  get ready() { return !!this.ctx; }

  // Must be called from a user gesture at least once.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        try { this.ctx.resume(); } catch (e) { /* ignore */ }
      }
      return true;
    }
    try {
      const AC = (typeof window !== 'undefined')
        ? (window.AudioContext || window.webkitAudioContext)
        : null;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.master);
      return true;
    } catch (e) {
      this.ctx = null;
      return false;
    }
  }

  setMuted(m) {
    this.muted = !!m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
    }
  }

  // --- primitive builders -------------------------------------------------
  _tone(o) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + (o.delay || 0);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(o.f0 || 440, t0);
      if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t0 + (o.dur || 0.2));
      // wobble LFO on frequency for "boing" feel
      if (o.wobble) {
        const lfo = this.ctx.createOscillator();
        const lg = this.ctx.createGain();
        lfo.frequency.value = o.wobble;
        lg.gain.value = (o.f0 || 440) * 0.25;
        lfo.connect(lg); lg.connect(osc.frequency);
        lfo.start(t0); lfo.stop(t0 + (o.dur || 0.2) + 0.05);
      }
      const vol = o.vol || 0.2, dur = o.dur || 0.2;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.01));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(o.music ? this.musicGain : this.master);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    } catch (e) { /* never break the game for audio */ }
  }

  _noise(o) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + (o.delay || 0);
      const dur = o.dur || 0.2;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const flt = this.ctx.createBiquadFilter();
      flt.type = o.ftype || 'lowpass';
      flt.frequency.setValueAtTime(o.f0 || 800, t0);
      if (o.f1) flt.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + dur);
      flt.Q.value = o.q || 0.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t0 + (o.attack || 0.01));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(flt); flt.connect(g); g.connect(this.master);
      src.start(t0); src.stop(t0 + dur + 0.05);
    } catch (e) { /* ignore */ }
  }

  // --- SFX ---------------------------------------------------------------
  uiClick() { this._tone({ f0: 700, f1: 900, dur: 0.07, type: 'triangle', vol: 0.12 }); }

  boing(strength) {
    const s = Util.clamp(strength || 0.5, 0.1, 1);
    this._tone({ f0: 160 + s * 120, f1: 90, dur: 0.28, type: 'sine', vol: 0.25 * s + 0.08, wobble: 22 });
    this._tone({ f0: 320 + s * 200, f1: 180, dur: 0.18, type: 'triangle', vol: 0.10 * s, delay: 0.02 });
  }

  splat(hard) {
    const h = hard ? 1 : 0.55;
    this._noise({ dur: 0.16, f0: 900, f1: 220, vol: 0.22 * h });
    this._tone({ f0: 130, f1: 55, dur: 0.18, type: 'sine', vol: 0.22 * h });
  }

  squelch() {
    this._noise({ dur: 0.22, f0: 1400, f1: 350, ftype: 'bandpass', q: 1.6, vol: 0.16 });
    this._tone({ f0: 300, f1: 140, dur: 0.16, type: 'triangle', vol: 0.08, delay: 0.03 });
  }

  giggle() {
    // happy ascending blips
    const notes = [620, 740, 880, 990, 1180];
    for (let i = 0; i < notes.length; i++) {
      this._tone({ f0: notes[i], f1: notes[i] * 1.12, dur: 0.12, type: 'sine', vol: 0.14, delay: i * 0.07 });
    }
  }

  pop() {
    this._tone({ f0: 480, f1: 950, dur: 0.09, type: 'square', vol: 0.07 });
    this._noise({ dur: 0.05, f0: 2500, vol: 0.06 });
  }

  sparkle() {
    const notes = [1320, 1560, 1860];
    for (let i = 0; i < notes.length; i++) {
      this._tone({ f0: notes[i], dur: 0.25, type: 'sine', vol: 0.07, delay: i * 0.05 });
    }
  }

  snap() {
    this._tone({ f0: 900, f1: 1400, dur: 0.08, type: 'triangle', vol: 0.12 });
    this._tone({ f0: 1800, dur: 0.2, type: 'sine', vol: 0.05, delay: 0.05 });
  }

  splash() {
    this._noise({ dur: 0.3, f0: 1800, f1: 500, ftype: 'bandpass', q: 1.1, vol: 0.16 });
    this._tone({ f0: 220, f1: 110, dur: 0.22, type: 'sine', vol: 0.1 });
  }

  stretchSfx(t) {
    // subtle rising whine while stretching (throttled by caller)
    this._tone({ f0: 200 + t * 300, f1: 240 + t * 340, dur: 0.12, type: 'sine', vol: 0.04 });
  }

  wakeUp() {
    const notes = [392, 523, 659];
    for (let i = 0; i < notes.length; i++) {
      this._tone({ f0: notes[i], dur: 0.15, type: 'triangle', vol: 0.12, delay: i * 0.09 });
    }
  }

  // --- generative music ----------------------------------------------------
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const playChord = () => {
      if (this.muted || !this.ctx) return;
      const chord = this.chords[this.chordIdx % this.chords.length];
      this.chordIdx++;
      for (let i = 0; i < chord.length; i++) {
        // soft detuned pad voices
        this._tone({ f0: chord[i] * 0.5, dur: 7.5, type: 'triangle', vol: 0.035, music: true, attack: 2.5 });
        this._tone({ f0: chord[i] * 0.5 * 1.003, dur: 7.5, type: 'sine', vol: 0.03, music: true, attack: 2.5 });
      }
      // occasional music-box pluck on the pentatonic
      if (Util.chance(0.75)) {
        const n = Util.pick(this.penta);
        this._tone({ f0: n, dur: 1.6, type: 'sine', vol: 0.045, music: true, attack: 0.01, delay: Util.rand(1, 5) });
        this._tone({ f0: n * 2, dur: 1.2, type: 'sine', vol: 0.018, music: true, attack: 0.01, delay: Util.rand(1, 5) });
      }
    };
    playChord();
    try {
      this.musicTimer = setInterval(() => {
        try { playChord(); } catch (e) { /* ignore */ }
      }, 8000);
    } catch (e) { this.musicTimer = null; }
  }

  stopMusic() {
    if (this.musicTimer) {
      try { clearInterval(this.musicTimer); } catch (e) { /* ignore */ }
      this.musicTimer = null;
    }
  }
}
