// GCAudio — 100% WebAudio-synthesized sound engine for Gully Champion.
// Plain script (no modules/imports). Exposes window.GCAudio.
// All public methods are safe no-ops when audio is not ready or is muted.
// Every method is wrapped in try/catch so a sound failure can never crash the game.
(function () {
  'use strict';

  // ---------------------------------------------------------------- helpers
  function clamp01(v) {
    v = Number(v);
    if (!isFinite(v)) return 0;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  class GCAudio {
    constructor() {
      this._ctx = null;        // AudioContext
      this._master = null;     // master gain (mute ramp target)
      this._noiseBuf = null;   // shared 2s white-noise buffer
      this._muted = false;
      // crowd bed nodes
      this._crowd = null;      // { src, filter, gain, lfo, lfoGain }
      // groove scheduler state
      this._groove = null;     // { timer, step, nextTime, tempo, bassNotes, pluckNotes, mood }
    }

    // ------------------------------------------------------------- core
    // Create/resume the AudioContext. Call from the first user gesture.
    // Safe to call repeatedly.
    init() {
      try {
        if (!this._ctx) {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this._ctx = new AC();
          // master gain -> compressor -> destination
          var comp = this._ctx.createDynamicsCompressor();
          comp.threshold.value = -18;
          comp.knee.value = 24;
          comp.ratio.value = 8;
          comp.attack.value = 0.003;
          comp.release.value = 0.25;
          comp.connect(this._ctx.destination);
          this._master = this._ctx.createGain();
          this._master.gain.value = this._muted ? 0 : 1;
          this._master.connect(comp);
          // shared 2s white-noise buffer
          var len = Math.floor(this._ctx.sampleRate * 2);
          this._noiseBuf = this._ctx.createBuffer(1, len, this._ctx.sampleRate);
          var d = this._noiseBuf.getChannelData(0);
          for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        }
        if (this._ctx.state === 'suspended') this._ctx.resume();
      } catch (e) { /* never throw from init */ }
    }

    get ready() {
      try {
        return !!(this._ctx && this._ctx.state === 'running');
      } catch (e) { return false; }
    }

    get muted() { return this._muted; }

    setMuted(m) {
      try {
        this._muted = !!m;
        if (this._ctx && this._master) {
          var t = this._ctx.currentTime;
          this._master.gain.cancelScheduledValues(t);
          this._master.gain.setValueAtTime(this._master.gain.value, t);
          this._master.gain.linearRampToValueAtTime(this._muted ? 0 : 1, t + 0.15);
        }
      } catch (e) { /* no-op */ }
    }

    toggleMuted() {
      try { this.setMuted(!this._muted); } catch (e) { /* no-op */ }
      return this._muted;
    }

    // -------------------------------------------------- small synth tools
    // One-shot envelope helper: gain 0 -> peak -> 0 over (a + d).
    _env(gainNode, t, peak, a, d) {
      gainNode.gain.setValueAtTime(0.0001, t);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }

    // Noise burst through a filter. opts: { type, freq, q, peak, attack, decay, dest }
    _noiseBurst(opts) {
      var ctx = this._ctx;
      var t = ctx.currentTime;
      var src = ctx.createBufferSource();
      src.buffer = this._noiseBuf;
      src.loop = true;
      src.playbackRate.value = 0.7 + Math.random() * 0.6;
      var f = ctx.createBiquadFilter();
      f.type = opts.type || 'bandpass';
      f.frequency.value = opts.freq || 1000;
      f.Q.value = opts.q != null ? opts.q : 1;
      var g = ctx.createGain();
      this._env(g, t, opts.peak || 0.5, opts.attack || 0.002, opts.decay || 0.1);
      src.connect(f); f.connect(g); g.connect(opts.dest || this._master);
      src.start(t, Math.random() * 1.5);
      src.stop(t + (opts.attack || 0.002) + (opts.decay || 0.1) + 0.05);
    }

    // Pitched tone with pitch drop. opts: { type, f0, f1, peak, attack, decay, dest }
    _tone(opts) {
      var ctx = this._ctx;
      var t = ctx.currentTime;
      var o = ctx.createOscillator();
      o.type = opts.type || 'sine';
      o.frequency.setValueAtTime(opts.f0, t);
      if (opts.f1) o.frequency.exponentialRampToValueAtTime(Math.max(opts.f1, 1), t + (opts.attack || 0.005) + (opts.decay || 0.2));
      var g = ctx.createGain();
      this._env(g, t, opts.peak || 0.5, opts.attack || 0.005, opts.decay || 0.2);
      o.connect(g); g.connect(opts.dest || this._master);
      o.start(t);
      o.stop(t + (opts.attack || 0.005) + (opts.decay || 0.2) + 0.05);
    }

    // Scheduled (future-time) pitched note — used by groove + fanfare.
    _noteAt(t, opts) {
      var ctx = this._ctx;
      var o = ctx.createOscillator();
      o.type = opts.type || 'triangle';
      o.frequency.value = opts.freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(opts.peak || 0.2, 0.0002), t + (opts.attack || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + (opts.decay || 0.25));
      o.connect(g); g.connect(opts.dest || this._master);
      o.start(t);
      o.stop(t + (opts.decay || 0.25) + 0.05);
    }

    // Scheduled noise hit (hats/snare) at time t.
    _noiseAt(t, opts) {
      var ctx = this._ctx;
      var src = ctx.createBufferSource();
      src.buffer = this._noiseBuf;
      src.loop = true;
      src.playbackRate.value = 1 + Math.random() * 0.2;
      var f = ctx.createBiquadFilter();
      f.type = opts.type || 'highpass';
      f.frequency.value = opts.freq || 7000;
      var g = ctx.createGain();
      var dur = opts.decay || 0.05;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(opts.peak || 0.15, 0.0002), t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(opts.dest || this._master);
      src.start(t, Math.random() * 1.5);
      src.stop(t + dur + 0.05);
    }

    // ------------------------------------------------------------- UI/SFX
    uiClick() {
      try {
        if (!this.ready || this.muted) return;
        this._tone({ type: 'triangle', f0: 1250, f1: 700, peak: 0.18, attack: 0.002, decay: 0.05 });
      } catch (e) { /* no-op */ }
    }

    batCrack(power01) {
      try {
        if (!this.ready || this.muted) return;
        var p = clamp01(power01);
        // bandpassed noise burst — 0.002s attack, harder/brighter with power
        this._noiseBurst({
          type: 'bandpass', freq: 1800 + p * 1400, q: 0.8,
          peak: 0.35 + p * 0.55, attack: 0.002, decay: 0.08 + p * 0.1
        });
        // low thump: sine 180 -> 60 Hz, deeper/louder with power
        this._tone({
          type: 'sine', f0: 180, f1: 55,
          peak: 0.5 + p * 0.6, attack: 0.002, decay: 0.16 + p * 0.14
        });
      } catch (e) { /* no-op */ }
    }

    ballBounce() {
      try {
        if (!this.ready || this.muted) return;
        // soft tape-ball tap: gentle lowpass thump
        this._tone({ type: 'sine', f0: 320, f1: 130, peak: 0.22, attack: 0.003, decay: 0.09 });
      } catch (e) { /* no-op */ }
    }

    crowdCheer(intensity01) {
      try {
        if (!this.ready || this.muted) return;
        var p = clamp01(intensity01);
        var ctx = this._ctx, t = ctx.currentTime;
        // wash of bandpassed noise swelling up
        var src = ctx.createBufferSource();
        src.buffer = this._noiseBuf; src.loop = true;
        var f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.5;
        var g = ctx.createGain();
        var dur = 0.8 + p * 0.8;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12 + p * 0.3, t + 0.12);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f); f.connect(g); g.connect(this._master);
        src.start(t, Math.random());
        src.stop(t + dur + 0.05);
        // a few "whistle/voice" peaks on top for big moments
        if (p > 0.5) {
          for (var i = 0; i < 3; i++) {
            var dt = t + 0.1 + Math.random() * dur * 0.5;
            this._noteAt(dt, { type: 'sine', freq: 2200 + Math.random() * 1800, peak: 0.05, attack: 0.01, decay: 0.25 });
          }
        }
      } catch (e) { /* no-op */ }
    }

    crowdGasp() {
      try {
        if (!this.ready || this.muted) return;
        var ctx = this._ctx, t = ctx.currentTime;
        // sharp inhale "oooh": rising bandpass sweep on noise
        var src = ctx.createBufferSource();
        src.buffer = this._noiseBuf; src.loop = true;
        var f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.Q.value = 2;
        f.frequency.setValueAtTime(400, t);
        f.frequency.exponentialRampToValueAtTime(1600, t + 0.35);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.4, t + 0.12);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        src.connect(f); f.connect(g); g.connect(this._master);
        src.start(t, Math.random());
        src.stop(t + 0.65);
      } catch (e) { /* no-op */ }
    }

    sixStinger() {
      try {
        if (!this.ready || this.muted) return;
        var ctx = this._ctx, t = ctx.currentTime;
        // triumphant brass-ish stab: stacked sawtooth chord, quick punch
        var notes = [130.81, 164.81, 196.0, 261.63]; // C3 E3 G3 C4
        for (var i = 0; i < notes.length; i++) {
          this._noteAt(t, { type: 'sawtooth', freq: notes[i], peak: 0.12, attack: 0.01, decay: 0.5 });
          this._noteAt(t, { type: 'square', freq: notes[i] * 2, peak: 0.03, attack: 0.01, decay: 0.4 });
        }
        this._noiseBurst({ type: 'highpass', freq: 5000, peak: 0.08, attack: 0.002, decay: 0.2 });
      } catch (e) { /* no-op */ }
    }

    fourChime() {
      try {
        if (!this.ready || this.muted) return;
        var t = this._ctx.currentTime;
        // bright pleasant chime: two bell tones a fifth apart
        this._noteAt(t, { type: 'triangle', freq: 1046.5, peak: 0.22, attack: 0.004, decay: 0.6 });   // C6
        this._noteAt(t + 0.09, { type: 'triangle', freq: 1568.0, peak: 0.2, attack: 0.004, decay: 0.7 }); // G6
      } catch (e) { /* no-op */ }
    }

    wicketSting() {
      try {
        if (!this.ready || this.muted) return;
        var t = this._ctx.currentTime;
        // sad descending sting
        var seq = [392.0, 329.63, 261.63, 196.0]; // G4 E4 C4 G3
        for (var i = 0; i < seq.length; i++) {
          this._noteAt(t + i * 0.16, { type: 'triangle', freq: seq[i], peak: 0.2, attack: 0.01, decay: 0.35 });
        }
        this._noteAt(t + 0.64, { type: 'sine', freq: 130.81, peak: 0.22, attack: 0.01, decay: 0.6 });
      } catch (e) { /* no-op */ }
    }

    umpireWhistle() {
      try {
        if (!this.ready || this.muted) return;
        var ctx = this._ctx, t = ctx.currentTime;
        // two-tone pea whistle
        function toot(at, freq) {
          var o = ctx.createOscillator();
          o.type = 'square'; o.frequency.value = freq;
          // pea rattle: fast amplitude wobble
          var wob = ctx.createOscillator();
          wob.type = 'sine'; wob.frequency.value = 42;
          var wobG = ctx.createGain(); wobG.gain.value = 0.35;
          var g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, at);
          g.gain.exponentialRampToValueAtTime(0.14, at + 0.02);
          g.gain.setValueAtTime(0.14, at + 0.18);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.24);
          wob.connect(wobG); wobG.connect(g.gain);
          o.connect(g); g.connect(this._master);
          o.start(at); o.stop(at + 0.3);
          wob.start(at); wob.stop(at + 0.3);
        }
        toot.call(this, t, 2350);
        toot.call(this, t + 0.28, 1950);
      } catch (e) { /* no-op */ }
    }

    catchPop() {
      try {
        if (!this.ready || this.muted) return;
        // glove pop: tight low-mid burst
        this._noiseBurst({ type: 'bandpass', freq: 900, q: 1.5, peak: 0.4, attack: 0.002, decay: 0.07 });
        this._tone({ type: 'sine', f0: 400, f1: 180, peak: 0.25, attack: 0.002, decay: 0.08 });
      } catch (e) { /* no-op */ }
    }

    throwWhoosh() {
      try {
        if (!this.ready || this.muted) return;
        var ctx = this._ctx, t = ctx.currentTime;
        // whoosh: bandpass sweep rising on noise
        var src = ctx.createBufferSource();
        src.buffer = this._noiseBuf; src.loop = true;
        var f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.Q.value = 1.2;
        f.frequency.setValueAtTime(600, t);
        f.frequency.exponentialRampToValueAtTime(4500, t + 0.28);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.28, t + 0.1);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        src.connect(f); f.connect(g); g.connect(this._master);
        src.start(t, Math.random());
        src.stop(t + 0.4);
      } catch (e) { /* no-op */ }
    }

    diveThud() {
      try {
        if (!this.ready || this.muted) return;
        // soft ground thud: lowpass noise + low sine
        this._noiseBurst({ type: 'lowpass', freq: 350, peak: 0.3, attack: 0.004, decay: 0.16 });
        this._tone({ type: 'sine', f0: 120, f1: 50, peak: 0.4, attack: 0.004, decay: 0.18 });
      } catch (e) { /* no-op */ }
    }

    countdownBeep(final) {
      try {
        if (!this.ready || this.muted) return;
        this._tone({ type: 'square', f0: final ? 1320 : 880, peak: 0.12, attack: 0.002, decay: final ? 0.3 : 0.12 });
      } catch (e) { /* no-op */ }
    }

    cupWinFanfare() {
      try {
        if (!this.ready || this.muted) return;
        var t = this._ctx.currentTime;
        // 3-4s celebration fanfare: rising brass line + final chord + crowd swell
        var line = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C4 D4? E4 G4 C5 E5 G5
        for (var i = 0; i < line.length; i++) {
          this._noteAt(t + i * 0.22, { type: 'sawtooth', freq: line[i], peak: 0.1, attack: 0.01, decay: 0.4 });
          this._noteAt(t + i * 0.22, { type: 'triangle', freq: line[i] * 2, peak: 0.04, attack: 0.01, decay: 0.35 });
        }
        var fin = t + line.length * 0.22 + 0.05;
        var chord = [261.63, 329.63, 392.0, 523.25, 659.25]; // C major add
        for (var j = 0; j < chord.length; j++) {
          this._noteAt(fin, { type: 'sawtooth', freq: chord[j], peak: 0.08, attack: 0.02, decay: 1.4 });
          this._noteAt(fin, { type: 'triangle', freq: chord[j] * 2, peak: 0.035, attack: 0.02, decay: 1.2 });
        }
        this._noiseBurst({ type: 'highpass', freq: 6000, peak: 0.05, attack: 0.01, decay: 0.8 });
        this.crowdCheer(1);
      } catch (e) { /* no-op */ }
    }

    umpireSay(text) {
      try {
        if (!this.ready || this.muted) return;
        if (!('speechSynthesis' in window)) return;
        var synth = window.speechSynthesis;
        synth.cancel();
        var u = new SpeechSynthesisUtterance(String(text));
        u.rate = 0.95;
        u.pitch = 0.8;
        u.volume = 1;
        synth.speak(u);
      } catch (e) { /* no-op */ }
    }

    // ------------------------------------------------------- crowd bed
    startCrowd() {
      try {
        if (!this.ready) return;
        if (this._crowd) return; // already running
        var ctx = this._ctx;
        var src = ctx.createBufferSource();
        src.buffer = this._noiseBuf; src.loop = true;
        var filter = ctx.createBiquadFilter();
        filter.type = 'bandpass'; filter.frequency.value = 500; filter.Q.value = 0.6;
        var gain = ctx.createGain();
        gain.gain.value = 0.045; // subtle bed
        // slow LFO (0.1 Hz) on gain for living-room crowd movement
        var lfo = ctx.createOscillator();
        lfo.type = 'sine'; lfo.frequency.value = 0.1;
        var lfoGain = ctx.createGain(); lfoGain.gain.value = 0.018;
        lfo.connect(lfoGain); lfoGain.connect(gain.gain);
        src.connect(filter); filter.connect(gain); gain.connect(this._master);
        src.start();
        lfo.start();
        this._crowd = { src: src, gain: gain, lfo: lfo, base: 0.045 };
      } catch (e) { /* no-op */ }
    }

    stopCrowd() {
      try {
        if (!this._crowd || !this._ctx) { this._crowd = null; return; }
        var c = this._crowd, ctx = this._ctx, t = ctx.currentTime;
        this._crowd = null;
        c.gain.gain.cancelScheduledValues(t);
        c.gain.gain.setValueAtTime(c.gain.gain.value, t);
        c.gain.gain.linearRampToValueAtTime(0.0001, t + 0.4);
        (function (crowd) {
          setTimeout(function () {
            try { crowd.src.stop(); crowd.lfo.stop(); } catch (e2) { /* no-op */ }
            try { crowd.gain.disconnect(); } catch (e3) { /* no-op */ }
          }, 500);
        })(c);
      } catch (e) { /* no-op */ }
    }

    swellCrowd(amount01, ms) {
      try {
        if (!this.ready || this.muted || !this._crowd) return;
        var amt = clamp01(amount01);
        var dur = Math.max(200, Number(ms) || 1000) / 1000;
        var ctx = this._ctx, t = ctx.currentTime;
        var g = this._crowd.gain.gain;
        var target = this._crowd.base + amt * 0.22;
        g.cancelScheduledValues(t);
        g.setValueAtTime(g.value, t);
        g.linearRampToValueAtTime(target, t + dur * 0.3);
        g.linearRampToValueAtTime(this._crowd.base, t + dur);
      } catch (e) { /* no-op */ }
    }

    // ------------------------------------------------- background groove
    // Light looping groove per gali mood. Subtle bed, not a concert.
    startGroove(galiId) {
      try {
        if (!this.ready) return;
        this.stopGroove();
        var moods = {
          rooftop:  { tempo: 96,  hat: 0.10, bass: 0.16, pluck: 0.07, sparse: false },
          beach:    { tempo: 112, hat: 0.12, bass: 0.14, pluck: 0.09, sparse: false },
          mountain: { tempo: 84,  hat: 0.07, bass: 0.18, pluck: 0.06, sparse: true },
          night:    { tempo: 76,  hat: 0.05, bass: 0.15, pluck: 0.05, sparse: true }
        };
        var mood = moods[galiId] || moods.rooftop;
        var stepDur = 60 / mood.tempo / 2; // 8th notes
        // simple 4-note bass loop (A minor-ish), pentatonic pluck motif
        var bassNotes = [110.0, 110.0, 130.81, 98.0];       // A2 A2 C3 G2
        var pluckNotes = [440.0, 523.25, 587.33, 523.25, 440.0, 392.0, 329.63, 392.0]; // A4 C5 D5...
        var self = this;
        var groove = {
          mood: mood, step: 0, nextTime: this._ctx.currentTime + 0.1,
          timer: null, stepDur: stepDur, bassNotes: bassNotes, pluckNotes: pluckNotes
        };
        groove.timer = setInterval(function () {
          try {
            if (!self._ctx || self.muted || self._groove !== groove) return;
            var ahead = self._ctx.currentTime + 0.2; // 200ms lookahead
            while (groove.nextTime < ahead) {
              self._scheduleStep(groove, groove.nextTime);
              groove.nextTime += groove.stepDur;
              groove.step++;
            }
          } catch (e) { /* never kill the scheduler */ }
        }, 100);
        this._groove = groove;
      } catch (e) { /* no-op */ }
    }

    _scheduleStep(groove, t) {
      var ctx = this._ctx, mood = groove.mood, s = groove.step;
      var bar16 = s % 16;
      var sparse = mood.sparse;
      // kick: sine 120 -> 45 Hz on beats (skip some when sparse)
      if (bar16 % 4 === 0 && !(sparse && bar16 === 8)) {
        // kick: sine pitch drop 120 -> 45 Hz
        var o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.32, t + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g); g.connect(this._master);
        o.start(t); o.stop(t + 0.22);
      }
      // hats: highpassed noise offbeats, sparser at night
      if (bar16 % 2 === 1 && !(sparse && bar16 % 4 === 3)) {
        this._noiseAt(t, { type: 'highpass', freq: 7500, peak: mood.hat, decay: 0.04 });
      }
      // bass: triangle 4-note loop on downbeats
      if (bar16 % 4 === 0) {
        var bn = groove.bassNotes[(bar16 / 4) | 0];
        this._noteAt(t, { type: 'triangle', freq: bn, peak: mood.bass, attack: 0.008, decay: 0.28 });
      }
      // pluck: pentatonic motif, low gain; night/mountain play half the notes
      var playPluck = (bar16 % 2 === 0) && !(sparse && bar16 % 4 === 2);
      if (playPluck) {
        var pn = groove.pluckNotes[(s >> 1) % groove.pluckNotes.length];
        this._noteAt(t, { type: 'square', freq: pn, peak: mood.pluck * 0.6, attack: 0.004, decay: 0.14 });
        this._noteAt(t, { type: 'triangle', freq: pn, peak: mood.pluck, attack: 0.004, decay: 0.18 });
      }
    }

    stopGroove() {
      try {
        if (this._groove) {
          clearInterval(this._groove.timer);
          this._groove = null;
        }
      } catch (e) { /* no-op */ }
    }
  }

  window.GCAudio = GCAudio;
})();
