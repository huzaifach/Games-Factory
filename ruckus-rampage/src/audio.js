/* RUCKUS RAMPAGE — audio: fully synthesized WebAudio. Music + SFX + crowd. */
var RR = (typeof RR !== 'undefined') ? RR : {};

RR.Audio = {
  ctx: null, master: null, musicGain: null, sfxGain: null, crowdGain: null,
  muted: false, started: false, musicTimer: null, step: 0, nextStepTime: 0,
  theme: 'neon',

  /* must be called from a user gesture */
  init: function () {
    if (this.started) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.42;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.master);
      this.crowdGain = this.ctx.createGain(); this.crowdGain.gain.value = 0.0;
      this.crowdGain.connect(this.master);
      this._startCrowdBed();
      this.started = true;
      this.setMuted(RR.Save.data ? !!RR.Save.data.muted : false);
    } catch (e) { /* audio unavailable: game stays silent, never crashes */ }
  },
  resume: function () {
    if (this.ctx && this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch (e) {} }
  },
  setMuted: function (m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
    if (RR.Save.data) { RR.Save.data.muted = m; RR.Save.save(); }
  },

  /* ---------- tiny synth helpers ---------- */
  _osc: function (type, freq, t0, dur, vol, dest, freqEnd) {
    var c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },
  _noise: function (t0, dur, vol, filterFreq, type, dest, q) {
    var c = this.ctx;
    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter(); f.type = type || 'lowpass';
    f.frequency.value = filterFreq || 1200; f.Q.value = q || 0.8;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(dest || this.sfxGain);
    src.start(t0); src.stop(t0 + dur + 0.05);
  },
  now: function () { return this.ctx ? this.ctx.currentTime : 0; },

  /* ---------- SFX ---------- */
  thwack: function (big) {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._noise(t, 0.12, big ? 0.7 : 0.45, 900);
    this._osc('sine', 160, t, 0.14, big ? 0.8 : 0.5, this.sfxGain, 55);
  },
  boing: function () {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._osc('sine', 120, t, 0.35, 0.55, this.sfxGain, 620);
    this._osc('triangle', 240, t, 0.3, 0.25, this.sfxGain, 900);
  },
  slap: function () { /* chappal */
    if (!this.ctx || this.muted) return; var t = this.now();
    this._noise(t, 0.07, 0.6, 2600, 'bandpass', this.sfxGain, 2);
    this._osc('sine', 300, t, 0.08, 0.4, this.sfxGain, 90);
  },
  poof: function () { /* pillow */
    if (!this.ctx || this.muted) return; var t = this.now();
    this._noise(t, 0.25, 0.35, 700);
  },
  magnetZap: function () {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._osc('sawtooth', 180, t, 0.3, 0.3, this.sfxGain, 1400);
    this._osc('square', 90, t + 0.28, 0.12, 0.4, this.sfxGain, 60);
  },
  springPunch: function () {
    if (!this.ctx || this.muted) return;
    this.boing(); var t = this.now();
    this._noise(t + 0.12, 0.1, 0.5, 1000);
  },
  jump: function () {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._osc('sine', 280, t, 0.12, 0.18, this.sfxGain, 560);
  },
  land: function () {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._noise(t, 0.06, 0.2, 400);
  },
  koWhistle: function () {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._osc('sine', 1400, t, 0.5, 0.3, this.sfxGain, 2600);
  },
  megaHorn: function () {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._osc('sawtooth', 110, t, 0.7, 0.5, this.sfxGain, 55);
    this._osc('sawtooth', 165, t, 0.7, 0.35, this.sfxGain, 82);
    this._noise(t, 0.6, 0.4, 500);
  },
  click: function () {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._osc('square', 660, t, 0.06, 0.2, this.sfxGain, 880);
  },
  countBeep: function (last) {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._osc('square', last ? 880 : 440, t, last ? 0.35 : 0.15, 0.3);
  },
  fanfare: function () {
    if (!this.ctx || this.muted) return; var t = this.now();
    var notes = [523, 659, 784, 1047];
    for (var i = 0; i < notes.length; i++)
      this._osc('triangle', notes[i], t + i * 0.12, 0.22, 0.4);
  },
  sadTrom: function () {
    if (!this.ctx || this.muted) return; var t = this.now();
    var notes = [392, 370, 349, 311];
    for (var i = 0; i < notes.length; i++)
      this._osc('sawtooth', notes[i], t + i * 0.22, 0.3, 0.25, this.sfxGain, notes[i] * 0.97);
  },
  draftPick: function () {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._osc('triangle', 523, t, 0.12, 0.4);
    this._osc('triangle', 784, t + 0.1, 0.12, 0.4);
    this._osc('triangle', 1047, t + 0.2, 0.25, 0.45);
  },
  ropeTwang: function () {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._osc('triangle', 180, t, 0.2, 0.25, this.sfxGain, 90);
  },
  pickup: function () {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._osc('square', 520, t, 0.07, 0.22, this.sfxGain, 780);
  },
  ooh: function (big) { this._crowdSwell(big ? 0.5 : 0.25, big ? 1.2 : 0.7); },
  cheer: function () { this._crowdSwell(0.55, 1.6); },

  /* ---------- crowd bed ---------- */
  _startCrowdBed: function () {
    var c = this.ctx, len = c.sampleRate * 2;
    var buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.6;
    var lfo = c.createOscillator(); lfo.frequency.value = 0.13;
    var lfoG = c.createGain(); lfoG.gain.value = 0.02;
    lfo.connect(lfoG); lfoG.connect(this.crowdGain.gain);
    src.connect(f); f.connect(this.crowdGain);
    src.start(); lfo.start();
  },
  setCrowd: function (level) { /* 0..1 excitement */
    if (!this.ctx) return;
    var t = this.now();
    this.crowdGain.gain.cancelScheduledValues(t);
    this.crowdGain.gain.setTargetAtTime(0.015 + level * 0.05, t, 0.8);
  },
  _crowdSwell: function (vol, dur) {
    if (!this.ctx || this.muted) return; var t = this.now();
    this._noise(t, dur, vol, 1100, 'bandpass', this.crowdGain, 0.7);
  },

  /* ---------- dhol-beat match music (lookahead scheduler) ---------- */
  startMusic: function (theme) {
    if (!this.ctx) return;
    this.theme = theme || 'neon';
    this.stopMusic();
    this.step = 0;
    this.nextStepTime = this.now() + 0.1;
    var self = this;
    this.musicTimer = setInterval(function () { self._schedule(); }, 40);
  },
  stopMusic: function () {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  },
  _bpm: function () { return this.theme === 'beach' ? 132 : (this.theme === 'roof' ? 148 : 140); },
  _schedule: function () {
    if (!this.ctx || this.muted) { if (this.ctx) { this.nextStepTime = Math.max(this.nextStepTime, this.now() + 0.1); } return; }
    var spb = 60 / this._bpm() / 2; /* 8th notes */
    while (this.nextStepTime < this.now() + 0.15) {
      this._playStep(this.step, this.nextStepTime);
      this.nextStepTime += spb;
      this.step = (this.step + 1) % 32;
    }
  },
  _playStep: function (s, t) {
    var M = this.musicGain;
    /* dhol low drum: four-on-the-floor-ish bhangra groove */
    if (s % 8 === 0 || s % 8 === 3 || s % 8 === 6 || (s % 16 === 14))
      this._osc('sine', 150, t, 0.16, 0.75, M, 55);            /* dhun thump */
    if (s % 4 === 2) this._noise(t, 0.06, 0.3, 3000, 'highpass', M); /* slap */
    if (s % 8 === 4) this._noise(t, 0.12, 0.4, 1800, 'bandpass', M, 1.5); /* snare-ish */
    /* bassline: minor groove */
    var bass = [110, 0, 110, 0, 130.8, 0, 98, 0, 110, 0, 110, 0, 146.8, 130.8, 98, 87.3];
    if (bass[s % 16]) this._osc('triangle', bass[s % 16], t, 0.2, 0.32, M);
    /* sparkle riff every 2 bars */
    if (s >= 16) {
      var riff = [440, 0, 523, 0, 587, 659, 0, 523, 440, 0, 392, 0, 440, 0, 0, 0];
      var n = riff[(s - 16) % 16];
      if (n) this._osc('square', n, t, 0.09, 0.07, M);
    }
  }
};
