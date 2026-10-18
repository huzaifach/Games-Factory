/* BAZAAR SIEGE — audio.js
 * AudioEngine: 100% synthesized WebAudio. Zero audio files.
 * Every method is guarded (try/catch + ready checks); safe to call before unlock.
 * The AudioContext is created on the first user gesture via unlock(). */
(function (global) {
  var BS = (global.BS = global.BS || {});

  function AudioEngine() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.muted = false;
    this.ambienceOn = false;
    this.intensity = 0.3; // 0..1, drives dhol loop tempo + brightness
    this._dholTimer = null;
    this._dholStep = 0;
    this._noiseBuf = null;
  }

  AudioEngine.prototype._ready = function () {
    return !!(this.ctx && this.master && !this.muted);
  };

  /* Create the context. Must be called from a user gesture (button tap). */
  AudioEngine.prototype.unlock = function () {
    try {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') { this.ctx.resume(); }
        return true;
      }
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) { return false; }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.5;
      this.musicBus.connect(this.master);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.9;
      this.sfxBus.connect(this.master);
      return true;
    } catch (e) { return false; }
  };

  AudioEngine.prototype._noise = function () {
    if (this._noiseBuf) { return this._noiseBuf; }
    try {
      var len = this.ctx.sampleRate * 1;
      var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) { d[i] = Math.random() * 2 - 1; }
      this._noiseBuf = buf;
      return buf;
    } catch (e) { return null; }
  };

  /* Simple enveloped oscillator hit. */
  AudioEngine.prototype._tone = function (opts) {
    try {
      if (!this._ready()) { return; }
      var t = this.ctx.currentTime + (opts.delay || 0);
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      o.type = opts.type || 'sine';
      o.frequency.setValueAtTime(opts.freq || 440, t);
      if (opts.slide) { o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t + (opts.dur || 0.2)); }
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(opts.vol || 0.3, t + (opts.attack || 0.01));
      g.gain.exponentialRampToValueAtTime(0.0001, t + (opts.dur || 0.2));
      o.connect(g); g.connect(opts.bus || this.sfxBus);
      o.start(t); o.stop(t + (opts.dur || 0.2) + 0.05);
    } catch (e) { /* guarded */ }
  };

  AudioEngine.prototype._noiseHit = function (opts) {
    try {
      if (!this._ready()) { return; }
      var buf = this._noise();
      if (!buf) { return; }
      var t = this.ctx.currentTime + (opts.delay || 0);
      var s = this.ctx.createBufferSource();
      s.buffer = buf; s.loop = true;
      var f = this.ctx.createBiquadFilter();
      f.type = opts.filter || 'lowpass';
      f.frequency.setValueAtTime(opts.freq || 800, t);
      if (opts.slide) { f.frequency.exponentialRampToValueAtTime(Math.max(40, opts.slide), t + (opts.dur || 0.3)); }
      var g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(opts.vol || 0.3, t + (opts.attack || 0.01));
      g.gain.exponentialRampToValueAtTime(0.0001, t + (opts.dur || 0.3));
      s.connect(f); f.connect(g); g.connect(opts.bus || this.sfxBus);
      s.start(t); s.stop(t + (opts.dur || 0.3) + 0.05);
    } catch (e) { /* guarded */ }
  };

  /* Dhol-style drum hit: low thump + skin slap. */
  AudioEngine.prototype._dhol = function (vol, delay, low) {
    this._tone({ freq: low || 90, slide: 45, dur: 0.28, vol: vol, delay: delay, type: 'sine', bus: this.musicBus });
    this._noiseHit({ freq: 2500, slide: 500, dur: 0.06, vol: vol * 0.5, delay: delay, filter: 'bandpass', bus: this.musicBus });
  };

  /* Start the bazaar ambience: dhol groove loop + night shimmer. */
  AudioEngine.prototype.startAmbience = function () {
    try {
      if (!this.ctx || this.ambienceOn) { return; }
      this.ambienceOn = true;
      var self = this;
      var stepDur = function () { return 0.32 - self.intensity * 0.14; }; // faster when danger rises
      // A 8-step dhol pattern: BASS rest slap BASS | slap rest BASS slap
      var pattern = [1, 0, 2, 1, 2, 0, 1, 2];
      var tick = function () {
        try {
          if (!self.ctx || !self.ambienceOn) { return; }
          var p = pattern[self._dholStep % pattern.length];
          if (p === 1) { self._dhol(0.5, 0, 85); }
          else if (p === 2) { self._dhol(0.3, 0, 130); }
          // Sparse night-shimmer chime on bright steps.
          if (self._dholStep % 8 === 0 && self.intensity < 0.7) {
            self._tone({ freq: 1320, dur: 0.8, vol: 0.05, type: 'sine', bus: self.musicBus, delay: 0.05 });
          }
          self._dholStep++;
          self._dholTimer = setTimeout(tick, stepDur() * 1000);
        } catch (e) { /* guarded */ }
      };
      tick();
    } catch (e) { /* guarded */ }
  };

  AudioEngine.prototype.stopAmbience = function () {
    try {
      this.ambienceOn = false;
      if (this._dholTimer) { clearTimeout(this._dholTimer); this._dholTimer = null; }
    } catch (e) { /* guarded */ }
  };

  /* 0..1 danger level: speeds the dhol loop and brightens it. */
  AudioEngine.prototype.setIntensity = function (x) {
    try {
      this.intensity = Math.max(0, Math.min(1, x));
      if (this.musicBus && this.ctx) {
        var f = 0.35 + this.intensity * 0.35;
        this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicBus.gain.linearRampToValueAtTime(f, this.ctx.currentTime + 0.5);
      }
    } catch (e) { /* guarded */ }
  };

  /* Per-turret shots: 6 variants. */
  AudioEngine.prototype.shot = function (type) {
    try {
      switch (type) {
        case 'rickshaw': // whoosh + pop
          this._noiseHit({ freq: 1200, slide: 300, dur: 0.18, vol: 0.16, filter: 'bandpass' });
          this._tone({ freq: 300, slide: 90, dur: 0.15, vol: 0.14, type: 'square' });
          break;
        case 'kite': // zip
          this._tone({ freq: 1800, slide: 3200, dur: 0.09, vol: 0.08, type: 'sawtooth' });
          break;
        case 'chai': // glug-splash
          this._tone({ freq: 500, slide: 180, dur: 0.16, vol: 0.13, type: 'sine' });
          this._noiseHit({ freq: 900, dur: 0.12, vol: 0.08, filter: 'highpass', delay: 0.05 });
          break;
        case 'lantern': // deep lob whoomp
          this._tone({ freq: 160, slide: 70, dur: 0.3, vol: 0.2, type: 'sine' });
          break;
        case 'dhol': // drum strike
          this._dhol(0.4, 0, 100);
          break;
        case 'prism': // shimmering zap
          this._tone({ freq: 2400, slide: 900, dur: 0.22, vol: 0.1, type: 'sawtooth' });
          this._tone({ freq: 3600, slide: 1800, dur: 0.18, vol: 0.06, type: 'sine', delay: 0.03 });
          break;
        default:
          this._tone({ freq: 600, slide: 300, dur: 0.1, vol: 0.1 });
      }
    } catch (e) { /* guarded */ }
  };

  AudioEngine.prototype.explosion = function (size) {
    try {
      var s = size === 'big' ? 1 : size === 'small' ? 0.4 : 0.7;
      this._noiseHit({ freq: 900 * s + 200, slide: 120, dur: 0.35 * s + 0.1, vol: 0.3 * s + 0.1, filter: 'lowpass' });
      this._tone({ freq: 120, slide: 40, dur: 0.3, vol: 0.25 * s, type: 'sine' });
    } catch (e) { /* guarded */ }
  };

  /* Rising magical swirl for merges. */
  AudioEngine.prototype.mergeSwirl = function () {
    try {
      var self = this;
      [523, 659, 784, 1047, 1319].forEach(function (f, i) {
        self._tone({ freq: f, dur: 0.35, vol: 0.12, type: 'triangle', delay: i * 0.07 });
      });
      this._noiseHit({ freq: 3000, slide: 6000, dur: 0.5, vol: 0.08, filter: 'highpass' });
    } catch (e) { /* guarded */ }
  };

  AudioEngine.prototype.coin = function () {
    this._tone({ freq: 1568, dur: 0.08, vol: 0.1, type: 'square' });
    this._tone({ freq: 2093, dur: 0.14, vol: 0.1, type: 'square', delay: 0.06 });
  };

  AudioEngine.prototype.leak = function () {
    this._tone({ freq: 220, slide: 110, dur: 0.4, vol: 0.25, type: 'sawtooth' });
    this._noiseHit({ freq: 500, slide: 150, dur: 0.3, vol: 0.15, filter: 'lowpass', delay: 0.05 });
  };

  AudioEngine.prototype.place = function () {
    this._tone({ freq: 440, slide: 660, dur: 0.12, vol: 0.16, type: 'triangle' });
    this._noiseHit({ freq: 2000, dur: 0.08, vol: 0.08, filter: 'highpass', delay: 0.04 });
  };

  AudioEngine.prototype.sell = function () {
    this._tone({ freq: 880, slide: 440, dur: 0.14, vol: 0.14, type: 'triangle' });
    this.coin();
  };

  AudioEngine.prototype.uiClick = function () {
    this._tone({ freq: 700, dur: 0.06, vol: 0.12, type: 'triangle' });
  };

  AudioEngine.prototype.banner = function () {
    this._tone({ freq: 392, dur: 0.18, vol: 0.16, type: 'triangle' });
    this._tone({ freq: 523, dur: 0.22, vol: 0.16, type: 'triangle', delay: 0.12 });
  };

  /* Festival stingers: monsoon / blackout / wedding. */
  AudioEngine.prototype.stingerFestival = function (kind) {
    try {
      if (kind === 'monsoon') {
        this._noiseHit({ freq: 4000, dur: 0.7, vol: 0.12, filter: 'highpass' });
        [440, 554, 659].forEach(function (f, i) {
          this._tone({ freq: f, dur: 0.4, vol: 0.12, type: 'triangle', delay: i * 0.12 });
        }, this);
      } else if (kind === 'blackout') {
        this._tone({ freq: 330, slide: 110, dur: 0.7, vol: 0.18, type: 'sawtooth' });
        this._tone({ freq: 165, slide: 82, dur: 0.8, vol: 0.15, type: 'sine', delay: 0.1 });
      } else if (kind === 'wedding') {
        var self = this;
        [523, 659, 784, 1047].forEach(function (f, i) {
          self._dhol(0.35, i * 0.14, 95);
          self._tone({ freq: f, dur: 0.3, vol: 0.1, type: 'triangle', delay: i * 0.14 });
        });
      } else {
        this.banner();
      }
    } catch (e) { /* guarded */ }
  };

  AudioEngine.prototype.bossDrums = function () {
    try {
      var self = this;
      [0, 0.22, 0.44, 0.7].forEach(function (d, i) {
        self._dhol(i === 3 ? 0.6 : 0.45, d, 70);
      });
    } catch (e) { /* guarded */ }
  };

  AudioEngine.prototype.win = function () {
    try {
      var self = this;
      [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) {
        self._tone({ freq: f, dur: 0.35, vol: 0.14, type: 'triangle', delay: i * 0.13 });
      });
    } catch (e) { /* guarded */ }
  };

  AudioEngine.prototype.lose = function () {
    try {
      var self = this;
      [392, 370, 349, 311].forEach(function (f, i) {
        self._tone({ freq: f, dur: 0.5, vol: 0.14, type: 'triangle', delay: i * 0.22 });
      });
    } catch (e) { /* guarded */ }
  };

  AudioEngine.prototype.toggleMute = function () {
    try {
      this.muted = !this.muted;
      if (this.master && this.ctx) {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime + 0.1);
      }
    } catch (e) { /* guarded */ }
    return this.muted;
  };

  BS.AudioEngine = AudioEngine;
  // One shared instance for all scenes.
  BS.audio = new AudioEngine();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioEngine;
  }
})(typeof window !== 'undefined' ? window : globalThis);
