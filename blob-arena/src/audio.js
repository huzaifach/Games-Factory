/* ============================================================
   BLOB ARENA — audio.js
   100% synthesized WebAudio: ambient deep-sea music, pops, chimes,
   gulps, dash whoosh, storm tension riser, fanfares. Zero assets.
   ============================================================ */
'use strict';

function makeAudio() {
  var AC = window.AudioContext || window.webkitAudioContext || null;
  var ctx = null, master = null, musicBus = null, sfxBus = null;
  var muted = false, started = false;
  var stormNodes = null, padTimer = null, chordIdx = 0;

  /* Am — F — C — G, deep and slow */
  var CHORDS = [
    [110.00, 130.81, 164.81, 220.00],
    [87.31, 110.00, 130.81, 174.61],
    [130.81, 164.81, 196.00, 261.63],
    [98.00, 123.47, 146.83, 196.00]
  ];

  function init() {
    if (started || !AC) return false;
    try {
      ctx = new AC();
    } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.5; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    started = true;
    startPad();
    return true;
  }

  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  function setMuted(m) {
    muted = m;
    if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.05);
  }
  function isMuted() { return muted; }

  /* ------------------------------ music pad ------------------------------ */
  function playChord(freqs) {
    if (!started) return;
    var t = ctx.currentTime;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.4;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 2.2);
    g.gain.setValueAtTime(0.16, t + 5.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 8.2);
    lp.connect(g); g.connect(musicBus);
    for (var i = 0; i < freqs.length; i++) {
      var o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freqs[i] * (1 + (Math.random() - 0.5) * 0.004);
      o.connect(lp); o.start(t); o.stop(t + 8.4);
    }
    /* soft sub pulse under the chord */
    var sub = ctx.createOscillator(); sub.type = 'sine';
    sub.frequency.value = freqs[0] / 2;
    var sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.10, t + 1.6);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 7.8);
    sub.connect(sg); sg.connect(musicBus);
    sub.start(t); sub.stop(t + 8.2);
  }

  function startPad() {
    playChord(CHORDS[0]);
    padTimer = setInterval(function () {
      if (muted) return;
      chordIdx = (chordIdx + 1) % CHORDS.length;
      playChord(CHORDS[chordIdx]);
    }, 7600);
  }

  /* ------------------------------- SFX helpers ------------------------------- */
  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!started) return;
    var t = ctx.currentTime + (delay || 0);
    var o = ctx.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur, vol, filterFreq, type, delay) {
    if (!started) return;
    var t = ctx.currentTime + (delay || 0);
    var len = Math.max(1, (dur + 0.05) * ctx.sampleRate) | 0;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = type || 'lowpass';
    f.frequency.value = filterFreq || 1200;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfxBus);
    src.start(t); src.stop(t + dur + 0.05);
  }

  /* --------------------------------- SFX --------------------------------- */
  function pop(combo) {
    /* delicious pellet pop — pitch climbs with the combo */
    var base = 520 * Math.pow(1.0595, Math.min(combo, 24));
    tone(base, 0.14, 'sine', 0.32, base * 1.6);
    tone(base * 2, 0.09, 'triangle', 0.12, base * 2.6, 0.015);
  }

  function gulp(big) {
    /* satisfying absorb gulp */
    tone(big ? 300 : 380, 0.22, 'sine', 0.4, 90);
    noise(0.16, 0.18, 900, 'bandpass');
    if (big) tone(150, 0.3, 'triangle', 0.3, 55, 0.05);
  }

  function thud() {
    tone(90, 0.35, 'sine', 0.5, 38);
    noise(0.2, 0.2, 500);
  }

  function dash() {
    noise(0.35, 0.3, 2400, 'highpass');
    tone(220, 0.3, 'sawtooth', 0.10, 880);
  }

  function fanfare() {
    var seq = [523.25, 659.25, 783.99, 1046.5];
    for (var i = 0; i < seq.length; i++) {
      tone(seq[i], 0.34, 'triangle', 0.28, null, i * 0.11);
      tone(seq[i] / 2, 0.34, 'sine', 0.16, null, i * 0.11);
    }
  }

  function click() { tone(660, 0.06, 'triangle', 0.18, 880); }

  function countBeep(last) {
    tone(last ? 880 : 520, last ? 0.4 : 0.16, 'triangle', 0.3);
  }

  function whistle() {  /* round end */
    tone(1200, 0.5, 'sine', 0.25, 700);
    tone(900, 0.6, 'sine', 0.2, 1400, 0.35);
  }

  function crownJingle() {
    var seq = [659.25, 783.99, 1046.5, 1318.5, 1567.98];
    for (var i = 0; i < seq.length; i++) tone(seq[i], 0.4, 'triangle', 0.26, null, i * 0.13);
  }

  /* Storm tension riser: runs while the storm is active. */
  function stormStart() {
    if (!started || stormNodes) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(55, t);
    o.frequency.linearRampToValueAtTime(220, t + 28);
    var f = ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(220, t);
    f.frequency.linearRampToValueAtTime(2600, t + 28);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 6);
    g.gain.setValueAtTime(0.14, t + 24);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 30);
    o.connect(f); f.connect(g); g.connect(sfxBus);
    o.start(t); o.stop(t + 30.2);
    /* heartbeat under the riser */
    var hb = setInterval(function () {
      tone(58, 0.18, 'sine', 0.4, 40);
      setTimeout(function () { tone(52, 0.16, 'sine', 0.32, 38); }, 260);
    }, 1100);
    stormNodes = { osc: o, hb: hb };
    setTimeout(function () { stormStop(); }, 30500);
  }
  function stormStop() {
    if (stormNodes) { clearInterval(stormNodes.hb); stormNodes = null; }
  }

  return {
    init: init, resume: resume, setMuted: setMuted, isMuted: isMuted,
    pop: pop, gulp: gulp, thud: thud, dash: dash,
    fanfare: fanfare, click: click, countBeep: countBeep,
    whistle: whistle, crownJingle: crownJingle,
    stormStart: stormStart, stormStop: stormStop
  };
}
