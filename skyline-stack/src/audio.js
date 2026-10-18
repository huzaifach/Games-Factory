'use strict';
/* SKYLINE STACK — synthesized audio engine (WebAudio, zero audio files).
 * Classic script: sets window.SkylineAudio (a singleton).
 */
(function (root) {
  var PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5..C6 pentatonic-ish
  var CHORDS = [ // Am - F - C - G, warm dusk progression (Hz)
    [110.0, 164.81, 261.63, 329.63],
    [87.31, 174.61, 220.0, 261.63],
    [98.0, 196.0, 261.63, 329.63],
    [98.0, 196.0, 246.94, 392.0]
  ];

  function AudioEngine() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.windGain = null;
    this.windFilter = null;
    this.muted = false;
    this.musicTimer = null;
    this.step = 0;
    this.nextNoteTime = 0;
    try {
      var s = root.localStorage.getItem('skylinestack.v1');
      if (s) this.muted = !!JSON.parse(s).muted;
    } catch (e) { /* private mode */ }
  }

  AudioEngine.prototype.ensure = function () {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    try {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.34;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.master);
      // looping wind bed (noise -> bandpass -> gain)
      var len = this.ctx.sampleRate * 2;
      var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      var src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass'; this.windFilter.frequency.value = 480; this.windFilter.Q.value = 0.7;
      this.windGain = this.ctx.createGain(); this.windGain.gain.value = 0;
      src.connect(this.windFilter); this.windFilter.connect(this.windGain); this.windGain.connect(this.master);
      src.start();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    } catch (e) { return false; }
  };

  AudioEngine.prototype.setMuted = function (m) {
    this.muted = !!m;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
  };

  AudioEngine.prototype.now = function () { return this.ctx ? this.ctx.currentTime : 0; };

  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }

  AudioEngine.prototype.tone = function (freq, type, a, dec, peak, dest, slideTo) {
    if (!this.ctx) return;
    var t = this.now();
    var o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + a + dec);
    var g = this.ctx.createGain(); env(g, t, a, peak, dec);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t); o.stop(t + a + dec + 0.05);
  };

  AudioEngine.prototype.noise = function (dur, filterType, freq, q, peak, slideTo) {
    if (!this.ctx) return;
    var t = this.now();
    var len = Math.ceil(this.ctx.sampleRate * dur);
    var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = this.ctx.createBufferSource(); src.buffer = buf;
    var f = this.ctx.createBiquadFilter(); f.type = filterType; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
    if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    var g = this.ctx.createGain(); env(g, t, 0.008, peak, dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t);
  };

  // ---------- SFX ----------
  AudioEngine.prototype.uiTap = function () { this.tone(760, 'sine', 0.005, 0.07, 0.25); };
  AudioEngine.prototype.tick = function () { this.tone(420, 'triangle', 0.004, 0.05, 0.12); }; // carriage turn
  AudioEngine.prototype.thud = function (k) {
    k = k || 1;
    this.tone(95, 'sine', 0.006, 0.16, 0.5 * k, null, 38);
    this.noise(0.09, 'lowpass', 500, 0.8, 0.22 * k);
  };
  AudioEngine.prototype.chime = function (combo) {
    var idx = Math.min(combo, 24);
    var f = PENTA[idx % PENTA.length] * (idx >= PENTA.length ? 2 : 1);
    this.tone(f, 'sine', 0.005, 0.5, 0.4);
    this.tone(f * 2, 'triangle', 0.005, 0.35, 0.14);
    this.tone(f * 3, 'sine', 0.005, 0.22, 0.06);
  };
  AudioEngine.prototype.savedWhoosh = function () {
    this.noise(0.45, 'bandpass', 600, 1.2, 0.35, 2400);
    this.tone(300, 'sine', 0.02, 0.4, 0.2, null, 900);
  };
  AudioEngine.prototype.shearCrack = function () {
    this.noise(0.12, 'highpass', 1800, 0.7, 0.4);
    this.tone(140, 'square', 0.004, 0.12, 0.16, null, 60);
  };
  AudioEngine.prototype.crash = function () {
    this.noise(0.8, 'lowpass', 900, 0.6, 0.5, 120);
    this.tone(220, 'sawtooth', 0.01, 0.7, 0.2, null, 40);
  };
  AudioEngine.prototype.giggle = function () {
    var self = this, t0 = this.now();
    [660, 740, 830, 920].forEach(function (f, i) {
      setTimeout(function () { self.tone(f, 'sine', 0.01, 0.09, 0.22); }, i * 90);
    });
  };
  AudioEngine.prototype.fanfare = function () {
    var self = this;
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      setTimeout(function () {
        self.tone(f, 'sawtooth', 0.01, 0.28, 0.16);
        self.tone(f / 2, 'triangle', 0.01, 0.3, 0.12);
      }, i * 130);
    });
  };
  AudioEngine.prototype.thunder = function () {
    this.noise(1.6, 'lowpass', 140, 0.5, 0.3, 60);
  };

  /** Wind bed level 0..1 (called every frame; smoothed internally). */
  AudioEngine.prototype.setWind = function (v) {
    if (!this.ctx || !this.windGain) return;
    var t = this.now();
    this.windGain.gain.setTargetAtTime(Math.min(1, v) * 0.5, t, 0.4);
    this.windFilter.frequency.setTargetAtTime(320 + Math.min(1, v) * 700, t, 0.4);
  };

  // ---------- music ----------
  AudioEngine.prototype.startMusic = function () {
    if (!this.ensure() || this.musicTimer) return;
    var self = this;
    this.step = 0;
    this.nextNoteTime = this.now() + 0.1;
    this.musicTimer = setInterval(function () { self.schedule(); }, 100);
  };
  AudioEngine.prototype.stopMusic = function () {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  };
  AudioEngine.prototype.schedule = function () {
    if (!this.ctx) return;
    var BEAT = 60 / 92 / 2; // 8th notes at 92bpm
    while (this.nextNoteTime < this.now() + 0.3) {
      this.playStep(this.step, this.nextNoteTime);
      this.nextNoteTime += BEAT;
      this.step = (this.step + 1) % 64; // 8 bars of 8ths
    }
  };
  AudioEngine.prototype.playStep = function (step, t) {
    var bar = Math.floor(step / 8) % 4;
    var chord = CHORDS[bar];
    var self = this;
    // pad: chord tone on bar starts (soft attack)
    if (step % 8 === 0) {
      chord.forEach(function (f) {
        var o = self.ctx.createOscillator(); o.type = 'triangle';
        o.frequency.value = f * (Math.random() < 0.5 ? 1.003 : 0.997);
        var flt = self.ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 850;
        var g = self.ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.05, t + 1.2);
        g.gain.linearRampToValueAtTime(0.0001, t + 3.4);
        o.connect(flt); flt.connect(g); g.connect(self.musicGain);
        o.start(t); o.stop(t + 3.6);
      });
    }
    // bass root on beats
    if (step % 4 === 0) {
      var o = self.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = chord[0];
      var g = self.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.11, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g); g.connect(self.musicGain); o.start(t); o.stop(t + 0.6);
    }
    // pluck melody: gentle random walk on pentatonic, plays on some 8ths
    if (step % 2 === 0 && ((step * 7919) % 10) < 6) {
      var deg = (step * 3 + bar * 2) % PENTA.length;
      var f = PENTA[deg];
      var o2 = self.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f;
      var g2 = self.ctx.createGain();
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.linearRampToValueAtTime(0.07, t + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o2.connect(g2); g2.connect(self.musicGain); o2.start(t); o2.stop(t + 0.7);
    }
  };

  root.SkylineAudio = new AudioEngine();
})(typeof self !== 'undefined' ? self : this);
