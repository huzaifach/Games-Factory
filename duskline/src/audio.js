/* DUSKLINE src/audio.js — 100% synthesized WebAudio: dark-synth loop + SFX. */
(function () {
'use strict';
var D = window.DUSK = window.DUSK || {};

function AudioSys() {
  this.ctx = null; this.master = null; this.musicGain = null; this.sfxGain = null;
  this.muted = false; this.started = false;
  this.seqTimer = null; this.step = 0; this.intensity = 0; // 0 calm,1 tense,2 battle,3 dawn
  this._noiseBuf = null;
}

AudioSys.prototype.init = function (muted) {
  if (this.ctx) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  this.ctx = new AC();
  this.master = this.ctx.createGain(); this.master.gain.value = 0.9;
  var comp = this.ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 8;
  this.master.connect(comp); comp.connect(this.ctx.destination);
  this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.42; this.musicGain.connect(this.master);
  this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.5; this.sfxGain.connect(this.master);
  this.muted = !!muted; this.master.gain.value = this.muted ? 0 : 0.9;
  // shared noise buffer
  var len = this.ctx.sampleRate * 1.2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
  var ch = buf.getChannelData(0);
  for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  this._noiseBuf = buf;
};

AudioSys.prototype.unlock = function () {
  if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
};

AudioSys.prototype.setMuted = function (m) {
  this.muted = m;
  if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
};

/* ---------- music: dark synth sequencer, 92bpm D minor ---------- */
var BASSLINE = [38, 38, 41, 38, 36, 36, 43, 41]; // D2 D2 F2 D2 C2 C2 G2 F2 (midi)
var ARP = [62, 65, 69, 72, 69, 65, 67, 70, 69, 65, 62, 60, 62, 65, 67, 65];
var PADCH = [[50, 53, 57], [48, 52, 55], [46, 50, 53], [43, 47, 50]]; // Dm Bb Gm? voicings

function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }

AudioSys.prototype._tone = function (freq, t, dur, type, vol, dest, slideTo) {
  var o = this.ctx.createOscillator(), g = this.ctx.createGain();
  o.type = type || 'sawtooth'; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || this.sfxGain);
  o.start(t); o.stop(t + dur + 0.05);
};

AudioSys.prototype._noise = function (t, dur, vol, filterFreq, type, dest) {
  var src = this.ctx.createBufferSource(); src.buffer = this._noiseBuf; src.loop = true;
  var f = this.ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = filterFreq || 1200;
  var g = this.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(dest || this.sfxGain);
  src.start(t); src.stop(t + dur + 0.05);
};

AudioSys.prototype.startMusic = function () {
  if (!this.ctx || this.seqTimer) return;
  this.started = true; this.step = 0;
  var self = this, spb = 60 / 92 / 2; // 8th notes at 92bpm
  var next = this.ctx.currentTime + 0.1;
  this.seqTimer = setInterval(function () {
    if (!self.ctx) return;
    while (next < self.ctx.currentTime + 0.35) { self._scheduleStep(self.step, next, spb); self.step = (self.step + 1) % 64; next += spb; }
  }, 90);
};

AudioSys.prototype._scheduleStep = function (s, t, spb) {
  var I = this.intensity, mg = this.musicGain, ctx = this.ctx;
  // sub-bass drone every 8 steps
  if (s % 8 === 0) {
    var bn = BASSLINE[(s / 8) | 0];
    this._tone(midi(bn), t, spb * 7, 'sine', 0.5, mg);
    this._tone(midi(bn), t, spb * 7, 'triangle', 0.22, mg);
  }
  // bass pulse 8ths in battle
  if (I >= 2 && s % 2 === 0) this._tone(midi(BASSLINE[(s / 8) | 0] - 12), t, spb * 0.9, 'square', 0.10, mg);
  // arp 16ths — use 8th grid with octave shimmer
  if (I >= 1 || s % 2 === 0) {
    var an = ARP[s % 16] + (I >= 3 ? 12 : 0);
    this._tone(midi(an), t, spb * 1.6, I >= 2 ? 'sawtooth' : 'triangle', I >= 2 ? 0.07 : 0.11, mg);
  }
  // pad at bar starts
  if (s % 16 === 0) {
    var ch = PADCH[(s / 16) | 0];
    for (var i = 0; i < ch.length; i++) this._tone(midi(ch[i]), t, spb * 15, 'sawtooth', 0.035, mg);
  }
  // hats
  if (s % 2 === 1) this._noise(t, 0.05, I >= 2 ? 0.10 : 0.05, 7000, 'highpass', mg);
  // kick-ish thump on quarters in battle
  if (I >= 2 && s % 4 === 0) this._tone(58, t, 0.16, 'sine', 0.5, mg, 34);
  // dawn: sparkle
  if (I === 3 && s % 8 === 4) this._tone(midi(ARP[(s * 3) % 16] + 24), t, 0.5, 'sine', 0.06, mg);
};

AudioSys.prototype.stopMusic = function () {
  if (this.seqTimer) { clearInterval(this.seqTimer); this.seqTimer = null; }
  this.started = false;
};

AudioSys.prototype.setIntensity = function (i) { this.intensity = i; };

/* ---------- SFX ---------- */
AudioSys.prototype._now = function () { return this.ctx ? this.ctx.currentTime : 0; };

AudioSys.prototype.shoot = function (kind) {
  if (!this.ctx) return; var t = this._now();
  var map = { orbit: [660, 'triangle', 0.10], proj: [520, 'square', 0.08], nova: [180, 'sine', 0.16],
    homing: [440, 'sine', 0.09], bolt: [880, 'sawtooth', 0.06], ring: [300, 'sine', 0.08],
    meteor: [140, 'sawtooth', 0.14], beam: [740, 'sawtooth', 0.07], gust: [0, 'noise', 0.10],
    thorns: [360, 'triangle', 0.09], spray: [600, 'square', 0.05], evo: [220, 'sawtooth', 0.12] };
  var m = map[kind] || map.proj;
  if (m[1] === 'noise') this._noise(t, 0.25, m[2], 900, 'bandpass');
  else this._tone(m[0] * (0.94 + Math.random() * 0.12), t, 0.14, m[1], m[2], this.sfxGain, m[0] * 0.5);
};

AudioSys.prototype.hit = function (big) {
  if (!this.ctx) return; var t = this._now();
  this._noise(t, big ? 0.22 : 0.09, big ? 0.30 : 0.14, big ? 900 : 2200, 'lowpass');
  this._tone(big ? 120 : 220, t, 0.12, 'square', big ? 0.22 : 0.10, this.sfxGain, 60);
};

AudioSys.prototype.explode = function () {
  if (!this.ctx) return; var t = this._now();
  this._noise(t, 0.5, 0.4, 700, 'lowpass');
  this._tone(90, t, 0.4, 'sine', 0.5, this.sfxGain, 32);
  this._tone(1600, t, 0.2, 'sawtooth', 0.08, this.sfxGain, 200);
};

AudioSys.prototype.pickup = function (n) {
  if (!this.ctx) return; var t = this._now();
  var f = 660 * Math.pow(2, Math.min(n, 24) / 24);
  this._tone(f, t, 0.12, 'sine', 0.12, this.sfxGain, f * 1.5);
};

AudioSys.prototype.rankup = function () {
  if (!this.ctx) return; var t = this._now(), self = this;
  [523, 659, 784, 1047].forEach(function (f, i) {
    self._tone(f, t + i * 0.09, 0.35, 'triangle', 0.16, self.sfxGain);
  });
};

AudioSys.prototype.fuse = function () {
  if (!this.ctx) return; var t = this._now(), self = this;
  [392, 523, 659, 784, 1047, 1319].forEach(function (f, i) {
    self._tone(f, t + i * 0.07, 0.5, 'sawtooth', 0.07, self.sfxGain);
    self._tone(f * 2, t + i * 0.07, 0.4, 'sine', 0.09, self.sfxGain);
  });
  this._noise(t, 0.8, 0.12, 3000, 'highpass');
};

AudioSys.prototype.hurt = function () {
  if (!this.ctx) return; var t = this._now();
  this._tone(140, t, 0.25, 'sawtooth', 0.3, this.sfxGain, 55);
  this._noise(t, 0.18, 0.25, 500, 'lowpass');
};

AudioSys.prototype.heal = function () {
  if (!this.ctx) return; var t = this._now();
  this._tone(520, t, 0.3, 'sine', 0.10, this.sfxGain, 880);
};

AudioSys.prototype.uiClick = function () {
  if (!this.ctx) return; var t = this._now();
  this._tone(700, t, 0.07, 'triangle', 0.12, this.sfxGain, 900);
};

AudioSys.prototype.uiHover = function () {
  if (!this.ctx) return; var t = this._now();
  this._tone(980, t, 0.04, 'sine', 0.05, this.sfxGain);
};

AudioSys.prototype.eventHorn = function () {
  if (!this.ctx) return; var t = this._now(), self = this;
  [196, 185].forEach(function (f, i) {
    self._tone(f, t + i * 0.35, 0.5, 'sawtooth', 0.16, self.sfxGain);
    self._tone(f / 2, t + i * 0.35, 0.5, 'square', 0.10, self.sfxGain);
  });
};

AudioSys.prototype.bossRoar = function () {
  if (!this.ctx) return; var t = this._now();
  this._tone(70, t, 1.1, 'sawtooth', 0.4, this.sfxGain, 38);
  this._tone(105, t + 0.05, 1.0, 'square', 0.2, this.sfxGain, 52);
  this._noise(t, 0.9, 0.3, 400, 'lowpass');
};

AudioSys.prototype.bossDie = function () {
  if (!this.ctx) return; var t = this._now(), self = this;
  this.explode();
  [1047, 784, 659, 523, 392].forEach(function (f, i) {
    self._tone(f, t + 0.3 + i * 0.12, 0.5, 'triangle', 0.14, self.sfxGain);
  });
};

AudioSys.prototype.stinger = function (win) {
  if (!this.ctx) return; var t = this._now(), self = this;
  var seq = win ? [523, 659, 784, 1047, 1319, 1568] : [392, 370, 349, 311, 262];
  seq.forEach(function (f, i) {
    self._tone(f, t + i * (win ? 0.13 : 0.22), win ? 0.5 : 0.6, win ? 'triangle' : 'sawtooth', 0.15, self.sfxGain);
  });
};

AudioSys.prototype.dodge = function () {
  if (!this.ctx) return; var t = this._now();
  this._tone(1200, t, 0.15, 'sine', 0.10, this.sfxGain, 2400);
};

D.audio = new AudioSys();

})();
