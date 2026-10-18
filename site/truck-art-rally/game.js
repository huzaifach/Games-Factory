/* ============================================================
   TRUCK ART RALLY — vertical slice (M1)
   Desi-cultural arcade racer + generative truck-art studio.
   100% code-drawn. Zero image assets. Zero external requests.
   Phaser 3.60.0 (global lib). English UI only.
   ============================================================ */
'use strict';

/* ---------------- utils ---------------- */
const TAU = Math.PI * 2;
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function rand(a, b) { return a + Math.random() * (b - a); }
function randi(a, b) { return Math.floor(rand(a, b + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function hexToRgb(h) {
  h = h.replace('#', '');
  return { r: parseInt(h.substr(0, 2), 16), g: parseInt(h.substr(2, 2), 16), b: parseInt(h.substr(4, 2), 16) };
}
function shade(hex, amt) { // amt -100..100
  const c = hexToRgb(hex);
  const f = (v) => clamp(Math.round(v + amt * 2.55), 0, 255);
  return '#' + [f(c.r), f(c.g), f(c.b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/* ---------------- storage ---------------- */
const Store = {
  get(k, def) {
    try { const v = localStorage.getItem('tar_' + k); return v === null ? def : JSON.parse(v); }
    catch (e) { return def; }
  },
  set(k, v) { try { localStorage.setItem('tar_' + k, JSON.stringify(v)); } catch (e) {} }
};

/* ============================================================
   AUDIO — fully synthesized WebAudio. No audio files.
   ============================================================ */
const AudioSys = {
  ctx: null, master: null, engineOsc: null, engineGain: null, engineFilter: null,
  rainGain: null, started: false, muted: false,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    // persistent engine: sawtooth + lowpass, pitch follows speed
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 55;
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 320;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.0;
    this.engineOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.master);
    this.engineOsc.start();
    // rain bed: looped filtered noise
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const rf = this.ctx.createBiquadFilter();
    rf.type = 'highpass'; rf.frequency.value = 1800;
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.0;
    src.connect(rf); rf.connect(this.rainGain); this.rainGain.connect(this.master);
    src.start();
    this.started = true;
  },
  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  setEngine(speed01, throttle) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(48 + speed01 * 105 + throttle * 18, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(240 + speed01 * 900, t, 0.1);
    this.engineGain.gain.setTargetAtTime(0.028 + speed01 * 0.05 + throttle * 0.02, t, 0.1);
  },
  setRain(on) {
    if (!this.ctx) return;
    this.rainGain.gain.setTargetAtTime(on && !this.muted ? 0.05 : 0.0, this.ctx.currentTime, 0.8);
  },
  blip(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, filterFreq, type) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.ceil(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type || 'lowpass'; f.frequency.value = filterFreq || 800;
    const g = this.ctx.createGain(); g.gain.value = vol || 0.25;
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t);
  },
  // ---- named SFX ----
  click() { this.blip(660, 0.07, 'triangle', 0.16, 880); },
  coin() { this.blip(880, 0.09, 'square', 0.1, 1320); setTimeout(() => this.blip(1320, 0.12, 'square', 0.08, 1760), 70); },
  horn() { // classic desi air horn: dual detuned saws
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [392, 415].forEach(f => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
      g.gain.setValueAtTime(0.22, t + 0.42);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + 0.6);
    });
    this.noise(0.5, 0.06, 2500, 'bandpass');
  },
  dhol() { // dhol-beat stinger: bass thump + slap
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.22);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.35);
    this.noise(0.12, 0.2, 3200, 'highpass');
    setTimeout(() => {
      if (!this.ctx || this.muted) return;
      const t2 = this.ctx.currentTime;
      const o2 = this.ctx.createOscillator(), g2 = this.ctx.createGain();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(180, t2);
      o2.frequency.exponentialRampToValueAtTime(60, t2 + 0.18);
      g2.gain.setValueAtTime(0.4, t2);
      g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.24);
      o2.connect(g2); g2.connect(this.master); o2.start(t2); o2.stop(t2 + 0.3);
    }, 160);
  },
  skid(dur) { this.noise(dur || 0.4, 0.10, 1400, 'bandpass'); },
  crash() {
    this.noise(0.35, 0.5, 500, 'lowpass');
    this.blip(120, 0.3, 'sawtooth', 0.25, 40);
  },
  nearMiss() { this.blip(1200, 0.18, 'sine', 0.14, 2400); },
  siren(dur) { // two-tone police wail
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime, durS = dur || 6;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator();
    o.type = 'triangle'; o.frequency.value = 700;
    lfo.type = 'square'; lfo.frequency.value = 1.6;
    const lg = this.ctx.createGain(); lg.gain.value = 140;
    lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.10, t + 0.3);
    g.gain.setValueAtTime(0.10, t + durS - 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + durS);
    o.connect(g); g.connect(this.master);
    o.start(t); lfo.start(t); o.stop(t + durS + 0.1); lfo.stop(t + durS + 0.1);
  },
  fanfare() { // medal jingle
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => this.blip(f, 0.22, 'triangle', 0.2), i * 130));
  },
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
    return this.muted;
  },
  quietEngine() {
    if (this.ctx && this.engineGain) this.engineGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.1);
  }
};

/* ============================================================
   TRUCK PAINTER — generative truck-art mural, rear view.
   One 512x256 composite canvas, regenerated only on paint change.
   Spec: { paint, motif, chrome, banner }
   ============================================================ */
const PAINTS = [
  { name: 'Ruby', c: '#b3122e' }, { name: 'Emerald', c: '#0e7a4f' },
  { name: 'Sapphire', c: '#1446b8' }, { name: 'Amber', c: '#c77b0e' },
  { name: 'Magenta', c: '#a4137c' }, { name: 'Teal', c: '#0e7f8c' },
  { name: 'Violet', c: '#5e2ca5' }, { name: 'Crimson Night', c: '#5e1020' }
];
const MOTIFS = [
  { id: 'floral', name: 'Floral Medallion', price: 0, desc: 'Jewel-tone flower medallions' },
  { id: 'peacock', name: 'Peacock Pride', price: 300, desc: 'Full peacock fan panel' },
  { id: 'roses', name: 'Rose Garden', price: 600, desc: 'Climbing roses + doves' }
];
const CHROMES = [
  { id: 'silver', name: 'Silver Chrome', price: 0 },
  { id: 'gold', name: 'Gold Chrome', price: 400 },
  { id: 'rainbow', name: 'Rainbow Chrome', price: 800 }
];
const BANNERS = [
  'HORN OK PLEASE', 'USE DIPPER AT NIGHT', 'BLOW HORN',
  'KEEP DISTANCE', 'ROAD KING'
];
const BANNER_PRICE = 150;

function defaultSpec() {
  return { paint: PAINTS[0].c, motif: 'floral', chrome: 'silver', banner: BANNERS[0] };
}
function loadSpec() {
  const s = Store.get('active_truck', null);
  if (s && s.paint && s.motif && s.chrome && s.banner) return s;
  return defaultSpec();
}

/* --- small drawing helpers (ctx = 2d context) --- */
function gradV(ctx, x, y, h, stops) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  stops.forEach(s => g.addColorStop(s[0], s[1]));
  return g;
}
function flower(ctx, cx, cy, r, petal, center, petals) {
  petals = petals || 10;
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * TAU;
    ctx.save(); ctx.rotate(a);
    const pg = ctx.createLinearGradient(0, 0, 0, -r);
    pg.addColorStop(0, shade(center, 30)); pg.addColorStop(0.5, petal); pg.addColorStop(1, shade(petal, -45));
    ctx.fillStyle = pg;
    ctx.strokeStyle = 'rgba(20,8,4,0.85)'; ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.55, -r * 0.35, 0, -r);
    ctx.quadraticCurveTo(-r * 0.55, -r * 0.35, 0, 0);
    ctx.fill(); ctx.stroke();
    // glow edge
    ctx.strokeStyle = 'rgba(255,240,200,0.55)'; ctx.lineWidth = Math.max(1, r * 0.03);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.12);
    ctx.quadraticCurveTo(r * 0.4, -r * 0.4, 0, -r * 0.88);
    ctx.stroke();
    ctx.restore();
  }
  // stamen ring
  ctx.fillStyle = shade(center, 45);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a1c05';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16, r * 0.05, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.1, 0, TAU); ctx.fill();
  ctx.restore();
}
function leaf(ctx, x, y, len, ang, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, shade(color, -30)); g.addColorStop(1, shade(color, 25));
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(10,30,10,0.8)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.35, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.35, 0, 0);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}
function chromeFill(ctx, x, y, w, h, kind) {
  let stops;
  if (kind === 'gold') stops = [[0, '#5e3c08'], [0.28, '#8a5f1a'], [0.45, '#ffe9a8'], [0.55, '#fffbe8'], [0.68, '#d9a83c'], [1, '#4a2f06']];
  else if (kind === 'rainbow') stops = [[0, '#3a1050'], [0.25, '#7a2ca5'], [0.4, '#2c9ac5'], [0.55, '#f2f2f2'], [0.7, '#e0a83c'], [0.85, '#c53d7a'], [1, '#2c1050']];
  else stops = [[0, '#3c4450'], [0.28, '#6a7688'], [0.45, '#e8f0fa'], [0.55, '#ffffff'], [0.68, '#9aa6b5'], [1, '#2c333d']];
  ctx.fillStyle = gradV(ctx, x, y, h, stops);
  ctx.fillRect(x, y, w, h);
}
function scallopRibbon(ctx, x, y, w, h, fillTop, fillBot) {
  // ribbon with swallow-tail ends and scalloped edge
  ctx.save();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, fillTop); g.addColorStop(1, fillBot);
  ctx.fillStyle = g;
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.beginPath();
  const tail = 16;
  ctx.moveTo(x - tail, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - tail, y + h);
  ctx.lineTo(x - tail + 7, y + h / 2);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w + tail, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w + tail, y + h);
  ctx.lineTo(x + w + tail - 7, y + h / 2);
  ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillRect(x, y, w, h);
  // scallops on top edge
  ctx.fillStyle = fillBot;
  const n = Math.floor(w / 18);
  for (let i = 0; i <= n; i++) {
    ctx.beginPath();
    ctx.arc(x + (i / n) * w, y, 9, 0, Math.PI);
    ctx.fill();
  }
  ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2;
  ctx.strokeRect(x, y + 2, w, h - 4);
  ctx.restore();
}

/* --- motif painters (central mural area) --- */
function paintFloralMural(ctx, x, y, w, h, spec) {
  // big central medallion + corner flourishes
  const cx = x + w / 2, cy = y + h / 2, R = Math.min(w, h) * 0.42;
  // halo rings
  for (let i = 4; i >= 1; i--) {
    ctx.strokeStyle = i % 2 ? 'rgba(255,233,168,0.85)' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = i % 2 ? 3 : 6;
    ctx.beginPath(); ctx.arc(cx, cy, R + i * 7, 0, TAU); ctx.stroke();
  }
  flower(ctx, cx, cy, R, '#d81b4c', '#ffb13d', 12);
  flower(ctx, cx - R * 1.15, cy, R * 0.42, '#2c9ac5', '#ffe9a8', 8);
  flower(ctx, cx + R * 1.15, cy, R * 0.42, '#2c9ac5', '#ffe9a8', 8);
  flower(ctx, cx, cy - R * 1.02, R * 0.34, '#7a2ca5', '#7df0c5', 8);
  // corner vines
  const corners = [[x + 8, y + 8, 1, 1], [x + w - 8, y + 8, -1, 1], [x + 8, y + h - 8, 1, -1], [x + w - 8, y + h - 8, -1, -1]];
  corners.forEach(([vx, vy, sx, sy]) => {
    ctx.strokeStyle = '#1d6b34'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(vx, vy);
    ctx.quadraticCurveTo(vx + sx * 46, vy, vx + sx * 60, vy + sy * 40);
    ctx.stroke();
    leaf(ctx, vx + sx * 30, vy + sy * 8, 16, sx > 0 ? (sy > 0 ? 0.5 : -0.5) : (sy > 0 ? Math.PI - 0.5 : Math.PI + 0.5), '#2c9a4c');
    flower(ctx, vx + sx * 60, vy + sy * 42, 11, '#e86a9a', '#ffe9a8', 7);
  });
}
function paintPeacockMural(ctx, x, y, w, h, spec) {
  const cx = x + w / 2, baseY = y + h - 12;
  // tail fan: 9 feathers
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI; // fan upward
    const fx = cx + Math.cos(a) * w * 0.36, fy = baseY + Math.sin(a) * h * 0.78;
    // feather shaft
    ctx.strokeStyle = '#0e5a3a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, baseY); ctx.quadraticCurveTo(cx + (fx - cx) * 0.5, baseY - 20, fx, fy); ctx.stroke();
    // eye
    const er = 13;
    const eg = ctx.createRadialGradient(fx, fy, 1, fx, fy, er);
    eg.addColorStop(0, '#0b2a6b'); eg.addColorStop(0.45, '#129a8c');
    eg.addColorStop(0.72, '#d9a83c'); eg.addColorStop(1, 'rgba(217,168,60,0)');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(fx, fy, er, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(fx, fy, er * 0.72, 0, TAU); ctx.stroke();
  }
  // body
  ctx.fillStyle = '#1446b8';
  ctx.strokeStyle = '#0b2a6b'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, baseY - 6, 16, 26, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // neck + head
  ctx.strokeStyle = '#1446b8'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, baseY - 26);
  ctx.quadraticCurveTo(cx + 26, baseY - 52, cx + 12, baseY - 66); ctx.stroke();
  ctx.fillStyle = '#1446b8';
  ctx.beginPath(); ctx.arc(cx + 12, baseY - 68, 9, 0, TAU); ctx.fill();
  // crest
  ctx.strokeStyle = '#d9a83c'; ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(cx + 12, baseY - 74);
    ctx.lineTo(cx + 12 + i * 7, baseY - 86); ctx.stroke();
    ctx.fillStyle = '#129a8c';
    ctx.beginPath(); ctx.arc(cx + 12 + i * 7, baseY - 87, 2.6, 0, TAU); ctx.fill();
  }
  // eye + beak
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + 15, baseY - 70, 3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx + 16, baseY - 70, 1.5, 0, TAU); ctx.fill();
  // side florals
  flower(ctx, x + 26, y + h / 2, 16, '#d81b4c', '#ffb13d', 8);
  flower(ctx, x + w - 26, y + h / 2, 16, '#d81b4c', '#ffb13d', 8);
}
function paintRosesMural(ctx, x, y, w, h, spec) {
  // climbing rose vines from both bottom corners meeting at top center
  function rose(cx, cy, r, c1, c2) {
    ctx.save(); ctx.translate(cx, cy);
    for (let ring = 3; ring >= 1; ring--) {
      const rr = r * ring / 3;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + ring * 0.5;
        ctx.fillStyle = ring === 1 ? c2 : c1;
        ctx.strokeStyle = 'rgba(90,10,20,0.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * rr * 0.55, Math.sin(a) * rr * 0.55, rr * 0.52, 0, TAU);
        ctx.fill(); ctx.stroke();
      }
    }
    ctx.fillStyle = shade(c2, 40);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, TAU); ctx.fill();
    ctx.restore();
  }
  [[1, '#e0304e', '#ff8fa8'], [-1, '#c22440', '#ff7d9c']].forEach(([side, c1, c2]) => {
    const x0 = side > 0 ? x + 14 : x + w - 14;
    ctx.strokeStyle = '#1d6b34'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y + h - 6);
    ctx.bezierCurveTo(x0 + side * 60, y + h * 0.66, x + w / 2 - side * 70, y + h * 0.4, x + w / 2, y + 16);
    ctx.stroke();
    const spots = [[0.12, 0.85], [0.3, 0.62], [0.52, 0.45], [0.74, 0.28], [0.92, 0.14]];
    spots.forEach(([t], idx) => {
      const px = lerp(x0, x + w / 2, t) + (idx % 2 ? 8 : -8);
      const py = lerp(y + h - 10, y + 20, t);
      leaf(ctx, px, py, 15, side > 0 ? 0.6 : Math.PI - 0.6, '#2c9a4c');
      if (idx % 2 === 0) rose(px + (idx % 4 === 0 ? 10 : -10), py - 8, 13 + (idx % 3) * 2, c1, c2);
    });
  });
  // doves at top
  function dove(dx, dy, s, flip) {
    ctx.save(); ctx.translate(dx, dy); ctx.scale(flip ? -s : s, s);
    ctx.fillStyle = '#f4f6fa'; ctx.strokeStyle = '#8a94a8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(14, -6, 6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(16, -7, 1.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffb13d';
    ctx.beginPath(); ctx.moveTo(20, -6); ctx.lineTo(24, -4); ctx.lineTo(20, -2); ctx.fill();
    // wings
    ctx.fillStyle = '#e8ecf4';
    ctx.beginPath(); ctx.moveTo(-4, -2);
    ctx.quadraticCurveTo(-14, -22, -26, -18);
    ctx.quadraticCurveTo(-16, -8, -4, 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  dove(x + w / 2 - 44, y + 30, 1, false);
  dove(x + w / 2 + 44, y + 26, 0.9, true);
  // heart between
  ctx.fillStyle = '#e0304e';
  ctx.font = 'bold 22px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('♥', x + w / 2, y + 34);
}

/* --- main truck composite --- */
function paintTruckCanvas(spec) {
  const W = 512, H = 256;
  const c = mkCanvas(W, H), ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // marker lights on top
  for (let i = 0; i < 5; i++) {
    const lx = 116 + i * 70;
    const lg = ctx.createRadialGradient(lx, 12, 1, lx, 12, 12);
    lg.addColorStop(0, '#fff3c0'); lg.addColorStop(0.5, '#ffb13d'); lg.addColorStop(1, 'rgba(255,177,61,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(lx, 12, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a2a08';
    ctx.fillRect(lx - 8, 16, 16, 5);
  }

  // cargo box
  const bx = 60, by = 26, bw = 392, bh = 142;
  const baseG = gradV(ctx, bx, by, bh, [[0, shade(spec.paint, 32)], [0.45, spec.paint], [1, shade(spec.paint, -42)]]);
  ctx.fillStyle = baseG;
  ctx.fillRect(bx, by, bw, bh);
  // metallic sheen sweep
  const sheen = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.35, 'rgba(255,255,255,0.14)');
  sheen.addColorStop(0.6, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(bx, by, bw, bh);
  // chrome trim frame
  ctx.lineWidth = 7; ctx.strokeStyle = '#20242c';
  ctx.strokeRect(bx - 4, by - 4, bw + 8, bh + 8);
  chromeFill(ctx, bx - 4, by - 4, bw + 8, 7, spec.chrome);
  chromeFill(ctx, bx - 4, by + bh - 3, bw + 8, 7, spec.chrome);
  chromeFill(ctx, bx - 4, by - 4, 7, bh + 8, spec.chrome);
  chromeFill(ctx, bx + bw - 3, by - 4, 7, bh + 8, spec.chrome);

  // top border strip: repeating diamond-flower pattern
  ctx.save();
  ctx.beginPath(); ctx.rect(bx + 8, by + 6, bw - 16, 20); ctx.clip();
  for (let x = bx + 14; x < bx + bw - 6; x += 26) {
    flower(ctx, x, by + 16, 8, '#ffb13d', '#d81b4c', 6);
  }
  ctx.restore();

  // central mural
  const mx = bx + 46, my = by + 34, mw = bw - 92, mh = bh - 66;
  // mural backdrop panel (deep contrasting)
  ctx.fillStyle = 'rgba(12,8,20,0.55)';
  ctx.fillRect(mx - 6, my - 6, mw + 12, mh + 12);
  ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2;
  ctx.strokeRect(mx - 6, my - 6, mw + 12, mh + 12);
  if (spec.motif === 'peacock') paintPeacockMural(ctx, mx, my, mw, mh, spec);
  else if (spec.motif === 'roses') paintRosesMural(ctx, mx, my, mw, mh, spec);
  else paintFloralMural(ctx, mx, my, mw, mh, spec);

  // side vine columns
  [[bx + 22, 1], [bx + bw - 22, -1]].forEach(([sx, dir]) => {
    ctx.strokeStyle = '#1d6b34'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx, by + 34);
    ctx.quadraticCurveTo(sx + dir * 10, by + 70, sx, by + 110);
    ctx.stroke();
    flower(ctx, sx, by + 52, 9, '#2c9ac5', '#ffe9a8', 7);
    flower(ctx, sx, by + 92, 9, '#e86a9a', '#ffe9a8', 7);
    leaf(ctx, sx, by + 72, 12, dir > 0 ? 0.4 : Math.PI - 0.4, '#2c9a4c');
  });

  // nazar-battu: warding eye on lower-left of tailgate
  (function nazar(ex, ey, r) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex, ey, r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1446b8';
    ctx.beginPath(); ctx.arc(ex, ey, r * 0.55, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.arc(ex, ey, r * 0.28, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#20242c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ex, ey, r, 0, TAU); ctx.stroke();
  })(bx + 30, by + bh - 24, 10);

  // poetry banner ribbon across lower third
  scallopRibbon(ctx, bx + 56, by + bh - 40, bw - 112, 30, '#a3132e', '#5e0a1a');
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 17px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 3;
  ctx.fillText(spec.banner, bx + bw / 2, by + bh - 24);
  ctx.shadowColor = 'transparent';

  // bumper (chrome base; animated flare drawn separately in-game)
  const bumpY = by + bh + 6, bumpH = 26;
  chromeFill(ctx, bx - 10, bumpY, bw + 20, bumpH, spec.chrome);
  ctx.strokeStyle = '#20242c'; ctx.lineWidth = 3;
  ctx.strokeRect(bx - 10, bumpY, bw + 20, bumpH);
  // bumper studs
  for (let x = bx + 6; x < bx + bw; x += 34) {
    const sg = ctx.createRadialGradient(x, bumpY + 13, 1, x, bumpY + 13, 7);
    sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.6, '#9aa6b5'); sg.addColorStop(1, '#3c4450');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(x, bumpY + 13, 6, 0, TAU); ctx.fill();
  }

  // taillights
  [[bx - 2, 1], [bx + bw + 2, -1]].forEach(([tx]) => {
    const tg = ctx.createRadialGradient(tx, bumpY - 12, 1, tx, bumpY - 12, 12);
    tg.addColorStop(0, '#ff6a6a'); tg.addColorStop(0.6, '#d81b1b'); tg.addColorStop(1, 'rgba(216,27,27,0)');
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.arc(tx, bumpY - 12, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a0f0f';
    ctx.fillRect(tx - 9, bumpY - 20, 18, 16);
    ctx.fillStyle = '#ff8a8a';
    ctx.fillRect(tx - 6, bumpY - 17, 12, 10);
  });

  // mudflaps with roses
  [[bx + 40, 1], [bx + bw - 40, -1]].forEach(([fx]) => {
    ctx.fillStyle = '#151312';
    ctx.fillRect(fx - 26, bumpY + bumpH - 2, 52, 34);
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2;
    ctx.strokeRect(fx - 26, bumpY + bumpH - 2, 52, 34);
    flower(ctx, fx, bumpY + bumpH + 13, 11, '#d81b4c', '#ffb13d', 8);
  });

  // tassels (baked base; sway animated via overlay sprites in-game)
  for (let i = 0; i < 5; i++) {
    const tx = bx + 60 + i * 68, ty = bumpY + bumpH;
    const cols = ['#e0304e', '#ffb13d', '#2c9ac5', '#7a2ca5', '#2c9a4c'];
    ctx.strokeStyle = cols[i]; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty + 16); ctx.stroke();
    ctx.fillStyle = cols[i];
    ctx.beginPath(); ctx.arc(tx, ty + 20, 6, 0, TAU); ctx.fill();
  }

  // number plate
  ctx.fillStyle = '#f4f6fa';
  ctx.fillRect(bx + bw / 2 - 34, bumpY + 4, 68, 18);
  ctx.strokeStyle = '#20242c'; ctx.lineWidth = 2;
  ctx.strokeRect(bx + bw / 2 - 34, bumpY + 4, 68, 18);
  ctx.fillStyle = '#20242c';
  ctx.font = 'bold 13px "Courier New", monospace'; ctx.textAlign = 'center';
  ctx.fillText('ART 001', bx + bw / 2, bumpY + 17);

  return c;
}

/* wheel texture (separate, rotates) */
function paintWheelCanvas() {
  const S = 72, c = mkCanvas(S, S), ctx = c.getContext('2d');
  // tire
  const tg = ctx.createRadialGradient(S/2, S/2, 8, S/2, S/2, 34);
  tg.addColorStop(0, '#2a2a2e'); tg.addColorStop(0.8, '#17171a'); tg.addColorStop(1, '#0a0a0c');
  ctx.fillStyle = tg;
  ctx.beginPath(); ctx.arc(S/2, S/2, 34, 0, TAU); ctx.fill();
  // tread
  ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 4;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(S/2 + Math.cos(a) * 28, S/2 + Math.sin(a) * 28);
    ctx.lineTo(S/2 + Math.cos(a) * 33, S/2 + Math.sin(a) * 33);
    ctx.stroke();
  }
  // chrome hub
  const hg = ctx.createRadialGradient(S/2, S/2, 2, S/2, S/2, 18);
  hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.6, '#9aa6b5'); hg.addColorStop(1, '#3c4450');
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(S/2, S/2, 18, 0, TAU); ctx.fill();
  // spokes
  ctx.strokeStyle = '#2c333d'; ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    ctx.beginPath(); ctx.moveTo(S/2, S/2);
    ctx.lineTo(S/2 + Math.cos(a) * 16, S/2 + Math.sin(a) * 16); ctx.stroke();
  }
  return c;
}

/* ============================================================
   TEXTURE FACTORY — traffic, roadside, particles. All code-drawn.
   ============================================================ */
const TexFactory = {
  /* --- traffic: rear views, each ~120x120 --- */
  rickshaw(variant) {
    const S = 120, c = mkCanvas(S, S), ctx = c.getContext('2d');
    const cols = [['#e8b10e', '#1d6b34'], ['#d81b4c', '#20242c'], ['#2c9ac5', '#7a2ca5']][variant % 3];
    // body
    ctx.fillStyle = cols[0];
    ctx.beginPath();
    ctx.moveTo(25, 95); ctx.lineTo(25, 55); ctx.quadraticCurveTo(25, 40, 40, 40);
    ctx.lineTo(80, 40); ctx.quadraticCurveTo(95, 40, 95, 55); ctx.lineTo(95, 95);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#20242c'; ctx.lineWidth = 3; ctx.stroke();
    // canopy
    ctx.fillStyle = cols[1];
    ctx.beginPath();
    ctx.moveTo(20, 45); ctx.quadraticCurveTo(60, 5, 100, 45);
    ctx.lineTo(100, 52); ctx.lineTo(20, 52); ctx.closePath(); ctx.fill();
    // windshield
    ctx.fillStyle = 'rgba(180,220,255,0.75)';
    ctx.fillRect(38, 50, 44, 18);
    // decorative stripe
    ctx.fillStyle = '#ffe9a8'; ctx.fillRect(25, 72, 70, 6);
    flower(ctx, 60, 88, 7, '#d81b4c', '#ffb13d', 6);
    // wheels
    ctx.fillStyle = '#17171a';
    ctx.beginPath(); ctx.arc(32, 98, 12, 0, TAU); ctx.arc(88, 98, 12, 0, TAU); ctx.fill();
    // taillight
    ctx.fillStyle = '#ff3b3b'; ctx.fillRect(52, 78, 16, 8);
    // exhaust puff anchor
    return c;
  },
  bus(variant) {
    const W = 150, H = 130, c = mkCanvas(W, H), ctx = c.getContext('2d');
    const cols = [['#c22440', '#ffb13d'], ['#0e7a4f', '#ffe9a8'], ['#1446b8', '#e86a9a']][variant % 3];
    ctx.fillStyle = cols[0];
    roundRect(ctx, 10, 15, W - 20, 95, 12); ctx.fill();
    ctx.strokeStyle = '#20242c'; ctx.lineWidth = 3;
    roundRect(ctx, 10, 15, W - 20, 95, 12); ctx.stroke();
    // windows
    ctx.fillStyle = 'rgba(170,215,255,0.85)';
    for (let i = 0; i < 4; i++) ctx.fillRect(22 + i * 30, 28, 24, 22);
    // art stripe + flowers
    ctx.fillStyle = cols[1]; ctx.fillRect(10, 62, W - 20, 10);
    for (let i = 0; i < 5; i++) flower(ctx, 26 + i * 26, 92, 8, '#ffe9a8', '#d81b4c', 6);
    // destination board
    ctx.fillStyle = '#111'; ctx.fillRect(50, 4, 50, 12);
    ctx.fillStyle = '#7df0c5'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText(['LHR 42', 'KHI 7', 'ISB 9'][variant % 3], 75, 13);
    // wheels + lights
    ctx.fillStyle = '#17171a';
    ctx.beginPath(); ctx.arc(35, 112, 14, 0, TAU); ctx.arc(115, 112, 14, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff3b3b'; ctx.fillRect(14, 76, 12, 10); ctx.fillRect(W - 26, 76, 12, 10);
    return c;
  },
  bike(variant) {
    const S = 90, c = mkCanvas(S, S), ctx = c.getContext('2d');
    const cols = ['#d81b1b', '#1446b8', '#0e7a4f'][variant % 3];
    // rider silhouette
    ctx.fillStyle = '#2a2f3a';
    ctx.beginPath(); ctx.arc(45, 26, 9, 0, TAU); ctx.fill(); // helmet
    ctx.fillStyle = shade(cols, -10);
    roundRect(ctx, 36, 36, 18, 26, 6); ctx.fill(); // torso
    // bike body
    ctx.fillStyle = cols;
    ctx.beginPath();
    ctx.moveTo(30, 66); ctx.lineTo(60, 66); ctx.lineTo(56, 78); ctx.lineTo(34, 78);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#17171a';
    ctx.beginPath(); ctx.arc(32, 82, 8, 0, TAU); ctx.arc(58, 82, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff3b3b'; ctx.fillRect(40, 60, 10, 6);
    return c;
  },
  donkeyCart(variant) {
    const W = 140, H = 120, c = mkCanvas(W, H), ctx = c.getContext('2d');
    // cart bed (wood)
    ctx.fillStyle = '#8a5a2a';
    ctx.fillRect(45, 55, 80, 30);
    ctx.strokeStyle = '#4a2f10'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(45 + i * 16, 55); ctx.lineTo(45 + i * 16, 85); ctx.stroke();
    }
    // hay
    ctx.fillStyle = '#d9b83c';
    for (let i = 0; i < 14; i++) {
      ctx.fillRect(50 + Math.random() * 66, 44 + Math.random() * 12, 8, 3);
    }
    // big wooden wheels
    [[45, 92], [125, 92]].forEach(([wx, wy]) => {
      ctx.strokeStyle = '#4a2f10'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(wx, wy, 18, 0, TAU); ctx.stroke();
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        ctx.beginPath(); ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(a) * 17, wy + Math.sin(a) * 17); ctx.stroke();
      }
    });
    // donkey (rear view: body + ears)
    ctx.fillStyle = '#6a625a';
    ctx.beginPath(); ctx.ellipse(22, 62, 12, 18, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); // ears
    ctx.moveTo(14, 46); ctx.lineTo(10, 30); ctx.lineTo(18, 42); ctx.closePath();
    ctx.moveTo(30, 46); ctx.lineTo(34, 30); ctx.lineTo(26, 42); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a847c'; // tail
    ctx.fillRect(8, 62, 5, 20);
    return c;
  },
  police() {
    const W = 130, H = 110, c = mkCanvas(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#eef1f6';
    roundRect(ctx, 15, 30, W - 30, 60, 10); ctx.fill();
    ctx.strokeStyle = '#20242c'; ctx.lineWidth = 3;
    roundRect(ctx, 15, 30, W - 30, 60, 10); ctx.stroke();
    ctx.fillStyle = '#1446b8'; ctx.fillRect(15, 52, W - 30, 12);
    ctx.fillStyle = 'rgba(140,190,240,0.9)';
    ctx.fillRect(30, 36, 70, 16);
    ctx.fillStyle = '#20242c'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('POLICE', 65, 82);
    ctx.fillStyle = '#17171a';
    ctx.beginPath(); ctx.arc(35, 92, 12, 0, TAU); ctx.arc(95, 92, 12, 0, TAU); ctx.fill();
    return c;
  },
  /* --- roadside --- */
  dhabaSign(text, bg, fg) {
    const W = 256, H = 128, c = mkCanvas(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 6; ctx.strokeRect(6, 6, W - 12, H - 12);
    // string lights
    for (let x = 14; x < W - 10; x += 22) {
      const on = Math.random() > 0.25;
      ctx.fillStyle = on ? '#ffe27a' : '#5a4a2a';
      ctx.beginPath(); ctx.arc(x, 16, 4, 0, TAU); ctx.fill();
      if (on) {
        const g = ctx.createRadialGradient(x, 16, 1, x, 16, 10);
        g.addColorStop(0, 'rgba(255,226,122,0.8)'); g.addColorStop(1, 'rgba(255,226,122,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, 16, 10, 0, TAU); ctx.fill();
      }
    }
    ctx.fillStyle = fg;
    ctx.font = 'bold 30px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, 66);
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText('★ ★ ★', W / 2, 98);
    // poles
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(20, H - 8, 10, 40); ctx.fillRect(W - 30, H - 8, 10, 40);
    return c;
  },
  palm() {
    const W = 90, H = 160, c = mkCanvas(W, H), ctx = c.getContext('2d');
    ctx.strokeStyle = '#5a4028'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(W/2, H); ctx.quadraticCurveTo(W/2 + 12, H/2, W/2, 46); ctx.stroke();
    ctx.fillStyle = '#1d6b34';
    for (let i = 0; i < 7; i++) {
      const a = (i / 6) * Math.PI - Math.PI / 2 + 0.35;
      ctx.save(); ctx.translate(W/2, 46); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(34, 0, 34, 9, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#6b4a1e';
    ctx.beginPath(); ctx.arc(W/2 - 8, 50, 7, 0, TAU); ctx.arc(W/2 + 8, 50, 7, 0, TAU); ctx.fill();
    return c;
  },
  pole() { // electricity pole
    const W = 40, H = 200, c = mkCanvas(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#2c2c30'; ctx.fillRect(16, 0, 8, H);
    ctx.fillRect(2, 20, 36, 6);
    ctx.strokeStyle = '#151517'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(2, 23); ctx.quadraticCurveTo(W/2, 60, W - 2, 23); ctx.stroke();
    return c;
  },
  bird() {
    const c = mkCanvas(36, 20), ctx = c.getContext('2d');
    ctx.strokeStyle = '#2a2f3a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(2, 12); ctx.quadraticCurveTo(10, 2, 18, 12);
    ctx.quadraticCurveTo(26, 2, 34, 12); ctx.stroke();
    return c;
  },
  cloud(w, tint) {
    const c = mkCanvas(220, 90), ctx = c.getContext('2d');
    ctx.fillStyle = tint;
    [[60, 55, 34], [100, 45, 42], [145, 52, 36], [110, 62, 40]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    });
    return c;
  }
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ============================================================
   GLOBAL GAME STATE
   ============================================================ */
const G = {
  W: 960, H: 540,
  budget: Store.get('budget', 500),
  owned: Store.get('owned', { motifs: ['floral'], chromes: ['silver'], banners: ['HORN OK PLEASE'] }),
  spec: loadSpec(),
  best: Store.get('best', {}), // legId -> { score, medal }
};
function saveEconomy() {
  Store.set('budget', G.budget);
  Store.set('owned', G.owned);
  Store.set('active_truck', G.spec);
  Store.set('best', G.best);
}
function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }

const LEGS = [
  { id: 'lahore', name: 'LAHORE HIGHWAY', place: 'Grand Trunk Road, Pakistan', sub: 'Day · Dense traffic', secs: 90,
    curveAmp: 0.12, density: 1.0, weather: 'none',
    sky: ['#6db9f2', '#cfeafb'], hill: '#7fa86b', road: ['#6b5a4a', '#655544'],
    laneGlow: '#ffe27a', ambient: 'day' },
  { id: 'salt', name: 'SALT RANGE', place: 'Mountain pass at sunset', sub: 'Dusk · Winding road', secs: 90,
    curveAmp: 1.0, density: 0.65, weather: 'none',
    sky: ['#7a3b6e', '#ff9a56'], hill: '#5e3a52', road: ['#5a4a52', '#54464e'],
    laneGlow: '#ffb13d', ambient: 'dusk' },
  { id: 'karachi', name: 'KARACHI COASTAL', place: 'Coastal highway in the rain', sub: 'Night · Wet road', secs: 90,
    curveAmp: 0.35, density: 0.85, weather: 'rain',
    sky: ['#0a0e1e', '#1b2a4a'], hill: '#0e1626', road: ['#232833', '#20252f'],
    laneGlow: '#7df0ff', ambient: 'night' },
];
function medalFor(score) {
  if (score >= 5000) return 'gold';
  if (score >= 3000) return 'silver';
  if (score >= 1500) return 'bronze';
  return null;
}
const MEDAL_COLORS = { gold: '#ffd76a', silver: '#cfd8e3', bronze: '#d08a4e' };

/* --- UI helper: chunky truck-art button --- */
function makeButton(scene, x, y, w, h, label, cb, opts) {
  opts = opts || {};
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const bg = opts.bg || '#a3132e', edge = opts.edge || '#ffe9a8';
  function draw(press) {
    g.clear();
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(-w/2 + 3, -h/2 + 5, w, h, 12);
    const gg = g; // gradient not available; layered fills
    gg.fillStyle(bg, 1); gg.fillRoundedRect(-w/2, -h/2, w, h, 12);
    gg.fillStyle(0xffffff, press ? 0.02 : 0.12);
    gg.fillRoundedRect(-w/2, -h/2, w, h/2, { tl: 12, tr: 12, bl: 0, br: 0 });
    gg.lineStyle(3, Phaser.Display.Color.HexStringToColor(edge).color, 1);
    gg.strokeRoundedRect(-w/2, -h/2, w, h, 12);
  }
  draw(false);
  const t = scene.add.text(0, 0, label, {
    fontFamily: '"Trebuchet MS", Verdana, sans-serif', fontSize: (opts.fs || 20) + 'px',
    fontStyle: 'bold', color: opts.color || '#ffe9a8', align: 'center'
  }).setOrigin(0.5);
  c.add([g, t]);
  c.setSize(w, h);
  // NOTE (Phaser 3.60 quirk, verified by hit-test): for Containers the input
  // system maps the pointer to top-left-anchored local space, so the hitArea
  // must be (0,0,w,h) — NOT centered. A centered rect shifts every button's
  // clickable zone half a size down-right.
  c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
  if (c.input) c.input.cursor = 'pointer';
  c.on('pointerdown', () => { draw(true); scene.tweens.add({ targets: c, scaleX: 0.94, scaleY: 0.94, duration: 70 }); });
  c.on('pointerup', () => {
    draw(false); scene.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 90 });
    AudioSys.click(); cb();
  });
  c.on('pointerout', () => { draw(false); c.setScale(1); });
  c._redraw = draw;
  return c;
}
function panelBg(scene, w, h) {
  const g = scene.add.graphics();
  g.fillStyle(0x141a26, 0.92); g.fillRoundedRect(0, 0, w, h, 14);
  g.lineStyle(3, 0xffe9a8, 0.9); g.strokeRoundedRect(0, 0, w, h, 14);
  g.lineStyle(1, 0xff5f3d, 0.5); g.strokeRoundedRect(6, 6, w - 12, h - 12, 10);
  return g;
}
function floralStrip(scene, w) {
  // mini decorative strip for panel headers — baked canvas reused
  if (!scene.textures.exists('strip')) {
    const c = mkCanvas(240, 20), ctx = c.getContext('2d');
    for (let x = 12; x < 240; x += 24) flower(ctx, x, 10, 8, '#d81b4c', '#ffb13d', 6);
    scene.textures.addCanvas('strip', c);
  }
  const img = scene.add.image(0, 0, 'strip').setDisplaySize(w, w * 20 / 240);
  return img;
}

/* ============================================================
   BOOT — builds every texture, honest loading, tap-to-start gate
   ============================================================ */
class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }
  create() {
    window.__tar_scene = 'boot';
    G.W = this.scale.width; G.H = this.scale.height;
    const fill = document.getElementById('loadfill');
    const msg = document.getElementById('loadmsg');
    const steps = [
      ['Painting truck…', () => this.buildTruck()],
      ['Warming engines…', () => this.buildVehicles()],
      ['Raising dhabas…', () => this.buildRoadside()],
      ['Tuning dhol…', () => this.buildBits()],
    ];
    let i = 0;
    const next = () => {
      if (i < steps.length) {
        msg.textContent = steps[i][0];
        try { steps[i][1](); } catch (e) { this.fail(e); return; }
        i++;
        fill.style.width = Math.round((i / (steps.length + 1)) * 100) + '%';
        setTimeout(next, 60);
      } else {
        fill.style.width = '100%';
        msg.textContent = 'Ready — tap anywhere to start';
        this.ready();
      }
    };
    next();
    this.scale.on('resize', () => { G.W = this.scale.width; G.H = this.scale.height; });
  }
  fail(e) {
    const msg = document.getElementById('loadmsg');
    const btn = document.getElementById('retrybtn');
    msg.textContent = 'Something failed to load. Check your connection and try again.';
    msg.style.color = '#ff8a8a';
    btn.style.display = 'block';
    btn.onclick = () => window.location.reload();
    if (window.console) console.error('Boot failed:', e);
  }
  buildTruck() {
    if (this.textures.exists('truck')) this.textures.remove('truck');
    this.textures.addCanvas('truck', paintTruckCanvas(G.spec));
    if (!this.textures.exists('wheel')) this.textures.addCanvas('wheel', paintWheelCanvas());
    // tassel sprite for sway overlays
    if (!this.textures.exists('tassel')) {
      const c = mkCanvas(16, 30), ctx = c.getContext('2d');
      ctx.strokeStyle = '#e0304e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(8, 2); ctx.lineTo(8, 18); ctx.stroke();
      const g = ctx.createRadialGradient(8, 23, 1, 8, 23, 7);
      g.addColorStop(0, '#ff8fa8'); g.addColorStop(1, '#a3132e');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(8, 23, 6, 0, TAU); ctx.fill();
      this.textures.addCanvas('tassel', c);
    }
  }
  buildVehicles() {
    const kinds = ['rickshaw', 'bus', 'bike', 'cart'];
    kinds.forEach(k => {
      for (let v = 0; v < 3; v++) {
        const key = 'v_' + k + v;
        if (this.textures.exists(key)) this.textures.remove(key);
        this.textures.addCanvas(key, TexFactory[k === 'cart' ? 'donkeyCart' : k](v));
      }
    });
    if (this.textures.exists('v_police')) this.textures.remove('v_police');
    this.textures.addCanvas('v_police', TexFactory.police());
    // police light bar (two colors, blinked in update)
    ['pr', 'pb'].forEach((k2, i2) => {
      if (this.textures.exists('light_' + k2)) this.textures.remove('light_' + k2);
      const c = mkCanvas(30, 16), ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(15, 8, 1, 15, 8, 15);
      const col = i2 === 0 ? '#ff2b2b' : '#2b6bff';
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 30, 16);
      this.textures.addCanvas('light_' + k2, c);
    });
  }
  buildRoadside() {
    const signs = [
      ['CHAI STOP', '#7a1f1f', '#ffe9a8'], ['TRUCK STOP', '#1f4a7a', '#ffe9a8'],
      ['HIGHWAY HOTEL', '#1f6b34', '#ffffff'], ['COLD DRINKS', '#5e2ca5', '#ffe27a'],
      ['ROADSIDE EATS', '#8a4a10', '#ffffff'], ['FUEL & FOOD', '#0e5a6b', '#ffe9a8']
    ];
    signs.forEach(([txt, bg, fg], i) => {
      const key = 'sign' + i;
      if (this.textures.exists(key)) this.textures.remove(key);
      this.textures.addCanvas(key, TexFactory.dhabaSign(txt, bg, fg));
    });
    if (!this.textures.exists('palm')) this.textures.addCanvas('palm', TexFactory.palm());
    if (!this.textures.exists('pole')) this.textures.addCanvas('pole', TexFactory.pole());
    if (!this.textures.exists('bird')) this.textures.addCanvas('bird', TexFactory.bird());
    // rock wall strip for salt range
    if (this.textures.exists('rocks')) this.textures.remove('rocks');
    const rc = mkCanvas(480, 160), rctx = rc.getContext('2d');
    const rg = rctx.createLinearGradient(0, 0, 0, 160);
    rg.addColorStop(0, '#8a6a5a'); rg.addColorStop(1, '#4a3830');
    rctx.fillStyle = rg; rctx.fillRect(0, 0, 480, 160);
    for (let i = 0; i < 40; i++) {
      rctx.fillStyle = 'rgba(0,0,0,' + rand(0.05, 0.22) + ')';
      rctx.beginPath();
      rctx.ellipse(rand(0, 480), rand(0, 160), rand(8, 40), rand(6, 22), rand(0, 3), 0, TAU);
      rctx.fill();
    }
    this.textures.addCanvas('rocks', rc);
    // city silhouette for night
    if (this.textures.exists('city')) this.textures.remove('city');
    const cc = mkCanvas(480, 140), cctx = cc.getContext('2d');
    cctx.fillStyle = '#0a0f1e'; cctx.fillRect(0, 0, 480, 140);
    for (let x = 0; x < 480; x += randi(18, 34)) {
      const bh = rand(40, 120);
      cctx.fillStyle = '#101a30'; cctx.fillRect(x, 140 - bh, rand(16, 28), bh);
      cctx.fillStyle = 'rgba(255,220,130,0.85)';
      for (let wy = 140 - bh + 8; wy < 132; wy += 14)
        for (let wx = x + 3; wx < x + 24; wx += 9)
          if (Math.random() > 0.45) cctx.fillRect(wx, wy, 4, 6);
    }
    this.textures.addCanvas('city', cc);
  }
  buildBits() {
    if (!this.textures.exists('dot')) {
      const c = mkCanvas(32, 32), ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(16, 16, 1, 16, 16, 16);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
      this.textures.addCanvas('dot', c);
    }
    if (!this.textures.exists('flare')) {
      const c = mkCanvas(128, 32), ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 128, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 32);
      this.textures.addCanvas('flare', c);
    }
    if (!this.textures.exists('coin')) {
      const c = mkCanvas(36, 36), ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(14, 12, 2, 18, 18, 17);
      g.addColorStop(0, '#fff3c0'); g.addColorStop(0.6, '#ffb13d'); g.addColorStop(1, '#8a5f1a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(18, 18, 16, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#5e3c08'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(18, 18, 14, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#5e3c08'; ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center'; ctx.fillText('★', 18, 24);
      this.textures.addCanvas('coin', c);
    }
  }
  ready() {
    document.getElementById('game').style.cursor = 'pointer';
    const go = () => {
      AudioSys.resume();
      document.getElementById('loader').style.display = 'none';
      this.scene.start('menu');
    };
    this.input.once('pointerdown', go);
    document.getElementById('loader').addEventListener('click', go, { once: true });
  }
}

/* ============================================================
   MENU
   ============================================================ */
class MenuScene extends Phaser.Scene {
  constructor() { super('menu'); this.ui = []; }
  create() {
    window.__tar_scene = 'menu';
    this.ui.forEach(o => o.destroy()); this.ui = [];
    this.cameras.main.setBackgroundColor('#0b0e14');
    AudioSys.quietEngine();
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
  }
  layout() {
    this.tweens.killAll();
    this.ui.forEach(o => o.destroy()); this.ui = [];
    const W = this.scale.width, H = this.scale.height;
    // backdrop: night gradient + city + road glow
    const bg = this.add.graphics(); this.ui.push(bg);
    const g = this.add.graphics();
    const grad = { 0: '#1b2a4a', 0.6: '#0b0e14' };
    // simple vertical bands
    const top = Phaser.Display.Color.HexStringToColor('#232f52').color;
    g.fillGradientStyle(0x232f52, 0x232f52, 0x0b0e14, 0x0b0e14, 1);
    g.fillRect(0, 0, W, H);
    this.ui.push(g);
    const city = this.add.image(W / 2, H * 0.62, 'city')
      .setDisplaySize(Math.max(W, 960), Math.max(W, 960) * 140 / 480).setAlpha(0.8);
    this.ui.push(city);
    // road glow at bottom
    const rg = this.add.graphics(); this.ui.push(rg);
    rg.fillStyle(0x000000, 1); rg.fillRect(0, H * 0.7, W, H * 0.3);
    rg.fillStyle(0xffe27a, 0.25); rg.fillRect(0, H * 0.7, W, 4);

    // hero truck
    const ts = Math.min(W / 560, H / 340);
    const truck = this.add.image(W / 2, H * 0.40, 'truck').setScale(ts * 0.85);
    this.ui.push(truck);
    this.tweens.add({ targets: truck, y: H * 0.40 - 8, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const title = this.add.text(W / 2, H * 0.10, 'TRUCK ART RALLY', {
      fontFamily: '"Trebuchet MS", Verdana, sans-serif', fontSize: Math.min(54, W / 14) + 'px',
      fontStyle: 'bold', color: '#ffd76a', align: 'center',
      stroke: '#5e0a1a', strokeThickness: 8
    }).setOrigin(0.5);
    this.ui.push(title);
    this.ui.push(floralStrip(this, Math.min(420, W * 0.7)).setPosition(W / 2, H * 0.10 + Math.min(54, W / 14) * 0.75));
    const sub = this.add.text(W / 2, H * 0.10 + Math.min(54, W / 14) * 0.75 + 22,
      'Paint it loud. Drive it proud.', {
      fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'italic', color: '#9fb2cc'
    }).setOrigin(0.5);
    this.ui.push(sub);

    // buttons (stacked from the bottom so small screens never clip)
    const bw = Math.min(340, W * 0.8), bh = H < 480 ? 48 : 62, gap = H < 480 ? 10 : 14;
    const b3y = H - 40 - bh / 2;
    const b1 = makeButton(this, W / 2, b3y - 2 * (bh + gap), bw, bh, '🎨  PAINT STUDIO', () => this.scene.start('studio'));
    const b2 = makeButton(this, W / 2, b3y - (bh + gap), bw, bh, '🏁  START TOUR', () => this.scene.start('legs'), { bg: '#0e5a3a' });
    const b3 = makeButton(this, W / 2, b3y, bw, bh, '❓  HOW TO PLAY', () => this.showHowTo(), { bg: '#3a2a5e' });
    this.ui.push(b1, b2, b3);

    // budget + mute
    const coin = this.add.image(W - 150, 34, 'coin').setScale(0.9); this.ui.push(coin);
    this.budgetTxt = this.add.text(W - 128, 34, fmt(G.budget), {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffd76a'
    }).setOrigin(0, 0.5);
    this.ui.push(this.budgetTxt);
    const mute = makeButton(this, 54, 34, 76, 44, AudioSys.muted ? '🔇' : '🔊', () => {
      AudioSys.resume();
      const m = AudioSys.toggleMute();
      mute.list[1].setText(m ? '🔇' : '🔊');
    }, { bg: '#232f52', fs: 20 });
    this.ui.push(mute);
    const ver = this.add.text(12, H - 14, 'Vertical slice · M1 · v0.1', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#5a6a85'
    });
    this.ui.push(ver);
  }
  showHowTo() {
    AudioSys.click();
    if (this.howUI) { this.howUI.destroy(true); this.howUI = null; return; }
    const W = this.scale.width, H = this.scale.height;
    const ui = this.add.container(0, 0).setDepth(90);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive();
    const pw = Math.min(560, W * 0.94), ph = Math.min(400, H * 0.9);
    const p = panelBg(this, pw, ph); p.setPosition(W / 2 - pw / 2, H / 2 - ph / 2);
    const t = this.add.text(W / 2, H / 2 - ph / 2 + 28, 'HOW TO PLAY', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#ffd76a'
    }).setOrigin(0.5);
    ui.add([dim, p, t]);
    ui.add(floralStrip(this, pw * 0.6).setPosition(W / 2, H / 2 - ph / 2 + 54));
    const lines = [
      '🎨 Paint your truck, then race across Pakistan.',
      '😱 Near-misses, drifts and jumps raise STYLE.',
      '🔥 High style = more speed and more coins.',
      '🪙 Coins buy motifs, chrome and poetry banners.',
      '🏅 Finish each 90-second leg to win medals.',
      '🚔 Max style attracts the police — dodge them!',
      '',
      'Drag to steer · hold DRIFT to slide · tap HORN',
      '(desktop: ← → arrows + Space + H)'
    ];
    const body = this.add.text(W / 2, H / 2 - ph / 2 + 78, lines.join('\n'), {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: Math.min(15, W / 46) + 'px',
      color: '#e8ecf4', align: 'center', lineSpacing: 6
    }).setOrigin(0.5, 0);
    ui.add(body);
    const close = makeButton(this, W / 2, H / 2 + ph / 2 - 34, 220, 48, 'GOT IT ✓', () => {
      ui.destroy(true); this.howUI = null;
    }, { fs: 16 });
    ui.add(close);
    dim.on('pointerup', () => { ui.destroy(true); this.howUI = null; });
    this.howUI = ui;
    this.ui.push(ui);
    ui.setAlpha(0); ui.setScale(0.92);
    this.tweens.add({ targets: ui, alpha: 1, scaleX: 1, scaleY: 1, duration: 250, ease: 'Back.easeOut' });
  }
}

/* ============================================================
   LEG SELECT
   ============================================================ */
class LegSelectScene extends Phaser.Scene {
  constructor() { super('legs'); this.ui = []; }
  create() {
    window.__tar_scene = 'legs';
    this.cameras.main.setBackgroundColor('#0b0e14');
    AudioSys.quietEngine();
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
  }
  layout() {
    this.ui.forEach(o => o.destroy()); this.ui = [];
    const W = this.scale.width, H = this.scale.height;
    const g = this.add.graphics();
    g.fillGradientStyle(0x1b2a4a, 0x1b2a4a, 0x0b0e14, 0x0b0e14, 1);
    g.fillRect(0, 0, W, H); this.ui.push(g);
    const title = this.add.text(W / 2, 56, 'GRAND TRUNK ROAD TOUR', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: Math.min(34, W / 20) + 'px',
      fontStyle: 'bold', color: '#ffd76a', stroke: '#5e0a1a', strokeThickness: 6
    }).setOrigin(0.5);
    this.ui.push(title);
    this.ui.push(floralStrip(this, Math.min(360, W * 0.6)).setPosition(W / 2, 92));
    const tourSub = this.add.text(W / 2, 112, 'A truck-art road trip across Pakistan', {
      fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#9fb2cc'
    }).setOrigin(0.5);
    this.ui.push(tourSub);

    const cw = Math.min(280, W * 0.86), ch = Math.min(150, H * 0.19);
    const startY = 140;
    LEGS.forEach((leg, i) => {
      const y = startY + i * (ch + 18);
      const p = panelBg(this, cw, ch).setPosition(W / 2 - cw / 2, y); this.ui.push(p);
      const dot = this.add.circle(W / 2 - cw / 2 + 26, y + ch / 2, 12,
        Phaser.Display.Color.HexStringToColor(leg.sky[0]).color);
      this.ui.push(dot);
      const nm = this.add.text(W / 2 - cw / 2 + 48, y + 22, leg.name, {
        fontFamily: '"Trebuchet MS", sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#ffe9a8'
      });
      this.ui.push(nm);
      const sb = this.add.text(W / 2 - cw / 2 + 48, y + 48, leg.place + ' · ' + leg.sub + ' · ' + leg.secs + 's', {
        fontFamily: '"Trebuchet MS", sans-serif', fontSize: '14px', color: '#9fb2cc'
      });
      this.ui.push(sb);
      const best = G.best[leg.id];
      const bt = this.add.text(W / 2 - cw / 2 + 48, y + 72,
        best ? ('Best style: ' + fmt(best.score) + (best.medal ? '  ·  ' + best.medal.toUpperCase() + ' medal' : '')) : 'Not driven yet — make it yours!', {
        fontFamily: '"Trebuchet MS", sans-serif', fontSize: '14px',
        color: best ? MEDAL_COLORS[best.medal] || '#9fb2cc' : '#5a6a85'
      });
      this.ui.push(bt);
      if (best && best.medal) {
        const m = this.add.text(W / 2 + cw / 2 - 34, y + 28, '🏅', { fontSize: '30px' }).setOrigin(0.5);
        m.setTint(Phaser.Display.Color.HexStringToColor(MEDAL_COLORS[best.medal]).color);
        this.ui.push(m);
      }
      const go = this.add.zone(W / 2, y + ch / 2, cw, ch).setInteractive({ useHandCursor: true });
      go.on('pointerup', () => { AudioSys.click(); this.scene.start('race', { leg: leg.id }); });
      go.on('pointerover', () => p.setAlpha(0.75));
      go.on('pointerout', () => p.setAlpha(1));
      this.ui.push(go);
      const arrow = this.add.text(W / 2 + cw / 2 - 30, y + ch / 2, '▶', {
        fontSize: '26px', color: '#ffb13d'
      }).setOrigin(0.5);
      this.ui.push(arrow);
    });
    const back = makeButton(this, W / 2, H - 44, 200, 52, '← BACK', () => this.scene.start('menu'), { bg: '#232f52' });
    this.ui.push(back);
  }
}

/* ============================================================
   STUDIO — generative truck-art garage + shop
   ============================================================ */
class StudioScene extends Phaser.Scene {
  constructor() { super('studio'); this.ui = []; this.tab = 'paint'; this.tassels = []; }
  create() {
    window.__tar_scene = 'studio';
    window.__tar_studio = this;
    this.work = Object.assign({}, G.spec);
    this.cameras.main.setBackgroundColor('#0b0e14');
    AudioSys.quietEngine();
    this.slots = Store.get('slots', [null, null, null]);
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
  }
  layout() {
    this.tweens.killAll();
    this.ui.forEach(o => o.destroy()); this.ui = [];
    this.tassels = [];
    this.truckImg = null; this.wheelL = null; this.wheelR = null; this.truckC = null;
    const W = this.scale.width, H = this.scale.height;
    // garage backdrop
    const g = this.add.graphics(); this.ui.push(g);
    g.fillGradientStyle(0x2a3140, 0x2a3140, 0x0b0e14, 0x0b0e14, 1);
    g.fillRect(0, 0, W, H);
    // floor
    g.fillStyle(0x141821, 1); g.fillRect(0, H * 0.66, W, H * 0.34);
    g.fillStyle(0xffe27a, 0.18); g.fillRect(0, H * 0.66, W, 3);
    // wall lamps
    for (let i = 0; i < 5; i++) {
      const lx = W * (0.1 + i * 0.2);
      g.fillStyle(0xffe9a8, 0.9); g.fillCircle(lx, 40, 6);
      g.fillStyle(0xffe9a8, 0.08); g.fillTriangle(lx - 60, 44, lx + 60, 44, lx, H * 0.66);
    }
    // hanging sign — dedicated garage board
    if (!this.textures.exists('garage_sign')) {
      const gc = mkCanvas(320, 130), gx = gc.getContext('2d');
      gx.fillStyle = '#5e0a1a'; gx.fillRect(0, 0, 320, 130);
      gx.strokeStyle = '#ffe9a8'; gx.lineWidth = 6; gx.strokeRect(6, 6, 308, 118);
      for (let x = 20; x < 310; x += 26) {
        gx.fillStyle = '#ffe27a';
        gx.beginPath(); gx.arc(x, 18, 5, 0, TAU); gx.fill();
      }
      gx.fillStyle = '#ffe9a8'; gx.textAlign = 'center';
      gx.font = 'bold 40px Georgia, serif';
      gx.fillText('TRUCK ART', 160, 72);
      gx.font = 'bold 14px Georgia, serif';
      gx.fillText('★ PAINT · CHROME · POETRY ★', 160, 108);
      this.textures.addCanvas('garage_sign', gc);
    }
    const sign = this.add.image(W / 2, 66, 'garage_sign').setDisplaySize(Math.min(260, W * 0.44), Math.min(106, W * 0.18));
    this.ui.push(sign);

    // top bar
    const back = makeButton(this, 70, 34, 110, 44, '← BACK', () => {
      G.spec = Object.assign({}, this.work); saveEconomy(); this.scene.start('menu');
    }, { bg: '#232f52', fs: 16 });
    this.ui.push(back);
    const title = this.add.text(W / 2, 34, 'PAINT STUDIO', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#ffd76a'
    }).setOrigin(0.5); this.ui.push(title);
    this.coinIco = this.add.image(W - 150, 34, 'coin').setScale(0.9); this.ui.push(this.coinIco);
    this.budgetTxt = this.add.text(W - 128, 34, fmt(G.budget), {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffd76a'
    }).setOrigin(0, 0.5); this.ui.push(this.budgetTxt);

    // truck preview
    this.refreshTruckTexture();
    const ts = Math.min(W / 620, (H * 0.42) / 300);
    this.truckC = this.add.container(W / 2, H * 0.44);
    this.truckImg = this.add.image(0, 0, 'truck').setScale(ts);
    this.truckC.add(this.truckImg);
    // animated tassel overlays (bumper positions in 512x256 space)
    const bumperY = 200; // approx in texture space
    [116, 184, 252, 320, 388].forEach((tx, i) => {
      const t = this.add.image((tx - 256) * ts, (bumperY - 128) * ts + 20 * ts, 'tassel').setScale(ts);
      t.setData('ph', i * 1.3);
      this.truckC.add(t); this.tassels.push(t);
    });
    // wheels
    const wy = (216 - 128) * ts;
    this.wheelL = this.add.image((90 - 256) * ts, wy, 'wheel').setScale(ts * 1.05);
    this.wheelR = this.add.image((422 - 256) * ts, wy, 'wheel').setScale(ts * 1.05);
    this.truckC.add([this.wheelL, this.wheelR]);
    this.ui.push(this.truckC);
    // light sweep across the truck
    const sweep = this.add.image(W / 2 - 300 * ts, H * 0.44, 'flare')
      .setScale(ts * 2.2, ts * 6).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    this.ui.push(sweep);
    this.tweens.add({ targets: sweep, x: W / 2 + 300 * ts, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: this.truckC, y: H * 0.44 - 6, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // tabs
    const tabs = [['paint', 'PAINT'], ['motif', 'MOTIF'], ['chrome', 'CHROME'], ['poetry', 'POETRY']];
    const tabW = Math.min(150, W / 4.6);
    tabs.forEach(([id, label], i) => {
      const b = makeButton(this, W / 2 + (i - 1.5) * (tabW + 8), H * 0.665, tabW, 44, label, () => {
        this.tab = id; AudioSys.click(); this.layoutPickers();
      }, { bg: this.tab === id ? '#a3132e' : '#232f52', fs: 15 });
      b.setData('tab', id);
      this.ui.push(b);
    });

    // picker zone
    this.pickerZone = this.add.container(0, 0); this.ui.push(this.pickerZone);
    this.hint = this.add.text(W / 2, H * 0.665 + 34, '', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '14px', color: '#9fb2cc', align: 'center'
    }).setOrigin(0.5, 0); this.ui.push(this.hint);
    this.layoutPickers();

    // bottom row: randomize + slots + race button
    const by = H - 52;
    const rnd = makeButton(this, W * 0.5 - Math.min(300, W * 0.32), by, 190, 52, '🎲 SURPRISE ME', () => this.randomize(), { bg: '#5e2ca5', fs: 16 });
    this.ui.push(rnd);
    const race = makeButton(this, W * 0.5 + Math.min(300, W * 0.32), by, 190, 52, '🏁 RACE →', () => {
      G.spec = Object.assign({}, this.work); saveEconomy(); this.scene.start('legs');
    }, { bg: '#0e5a3a', fs: 16 });
    this.ui.push(race);
    // save slots
    this.slotBtns = [];
    for (let i = 0; i < 3; i++) {
      const sx = W / 2 + (i - 1) * 120;
      const sb = makeButton(this, sx, by, 104, 52, this.slots[i] ? 'LOAD ' + (i + 1) : 'SAVE ' + (i + 1), () => this.slotTap(i), { bg: '#3a2a08', fs: 14 });
      this.ui.push(sb); this.slotBtns.push(sb);
    }
  }
  refreshTruckTexture() {
    if (this.textures.exists('truck')) this.textures.remove('truck');
    this.textures.addCanvas('truck', paintTruckCanvas(this.work));
    if (this.truckImg) this.truckImg.setTexture('truck');
  }
  spend(amount) {
    if (G.budget < amount) {
      this.hint.setText('Not enough coins — go race to earn more!');
      AudioSys.blip(180, 0.2, 'square', 0.15);
      return false;
    }
    G.budget -= amount; saveEconomy();
    this.budgetTxt.setText(fmt(G.budget));
    AudioSys.coin();
    return true;
  }
  layoutPickers() {
    this.pickerZone.removeAll(true);
    const W = this.scale.width, H = this.scale.height;
    const y = H * 0.665 + 78;
    if (this.tab === 'paint') {
      const sw = Math.min(56, (W - 60) / 8 - 8);
      PAINTS.forEach((p, i) => {
        const x = W / 2 + (i - 3.5) * (sw + 8);
        const s = this.add.container(x, y);
        const g = this.add.graphics();
        g.fillStyle(Phaser.Display.Color.HexStringToColor(p.c).color, 1);
        g.fillCircle(0, 0, sw / 2);
        g.lineStyle(this.work.paint === p.c ? 4 : 2, 0xffe9a8, 1);
        g.strokeCircle(0, 0, sw / 2 + (this.work.paint === p.c ? 3 : 0));
        const z = this.add.zone(0, 0, sw + 10, sw + 10).setInteractive({ useHandCursor: true });
        z.on('pointerup', () => { this.work.paint = p.c; AudioSys.click(); this.refreshTruckTexture(); this.layoutPickers(); });
        s.add([g, z]);
        this.pickerZone.add(s);
        const nm = this.add.text(x, y + sw / 2 + 12, p.name, {
          fontFamily: 'sans-serif', fontSize: '11px', color: this.work.paint === p.c ? '#ffd76a' : '#9fb2cc'
        }).setOrigin(0.5);
        this.pickerZone.add(nm);
      });
      this.hint.setText('Pick a base paint — free forever.');
    } else if (this.tab === 'motif') {
      const cw = Math.min(220, (W - 60) / 3 - 12), ch = 64;
      MOTIFS.forEach((m, i) => {
        const x = W / 2 + (i - 1) * (cw + 12);
        const owned = G.owned.motifs.includes(m.id);
        const active = this.work.motif === m.id;
        const b = makeButton(this, x, y, cw, ch,
          m.name + '\n' + (owned ? (active ? '● EQUIPPED' : 'OWNED — tap to equip') : m.price + ' coins'),
          () => {
            if (owned) { this.work.motif = m.id; this.refreshTruckTexture(); this.layoutPickers(); }
            else if (this.spend(m.price)) { G.owned.motifs.push(m.id); this.work.motif = m.id; saveEconomy(); this.refreshTruckTexture(); this.layoutPickers(); }
          }, { bg: active ? '#a3132e' : '#232f52', fs: 13 });
        this.pickerZone.add(b);
      });
      this.hint.setText('Motifs are the soul of the mural — earn coins by racing with style.');
    } else if (this.tab === 'chrome') {
      const cw = Math.min(220, (W - 60) / 3 - 12), ch = 64;
      CHROMES.forEach((m, i) => {
        const x = W / 2 + (i - 1) * (cw + 12);
        const owned = G.owned.chromes.includes(m.id);
        const active = this.work.chrome === m.id;
        const b = makeButton(this, x, y, cw, ch,
          m.name + '\n' + (owned ? (active ? '● EQUIPPED' : 'OWNED — tap to equip') : m.price + ' coins'),
          () => {
            if (owned) { this.work.chrome = m.id; this.refreshTruckTexture(); this.layoutPickers(); }
            else if (this.spend(m.price)) { G.owned.chromes.push(m.id); this.work.chrome = m.id; saveEconomy(); this.refreshTruckTexture(); this.layoutPickers(); }
          }, { bg: active ? '#a3132e' : '#232f52', fs: 13 });
        this.pickerZone.add(b);
      });
      this.hint.setText('Chrome bumpers catch the light — and the judges\' eyes.');
    } else {
      const cw = Math.min(180, (W - 60) / 3 - 10);
      BANNERS.forEach((bn, i) => {
        const row = Math.floor(i / 3), col = i % 3;
        const perRow = 3;
        const colsThisRow = Math.min(perRow, BANNERS.length - row * perRow);
        const x = W / 2 + (col - (colsThisRow - 1) / 2) * (cw + 10);
        const yy = y + row * 56 - (BANNERS.length > 3 ? 24 : 0);
        const owned = G.owned.banners.includes(bn);
        const active = this.work.banner === bn;
        const b = makeButton(this, x, yy, cw, 46, (owned ? '' : BANNER_PRICE + ' coins · ') + bn, () => {
          if (owned) { this.work.banner = bn; this.refreshTruckTexture(); this.layoutPickers(); }
          else if (this.spend(BANNER_PRICE)) { G.owned.banners.push(bn); this.work.banner = bn; saveEconomy(); this.refreshTruckTexture(); this.layoutPickers(); }
        }, { bg: active ? '#a3132e' : '#232f52', fs: 11 });
        this.pickerZone.add(b);
      });
      this.hint.setText('Poetry on the tailgate — the truck speaks before the horn does.');
    }
  }
  randomize() {
    AudioSys.dhol();
    this.work.paint = pick(PAINTS).c;
    const ownedM = MOTIFS.filter(m => G.owned.motifs.includes(m.id));
    this.work.motif = pick(ownedM.length ? ownedM : MOTIFS).id;
    const ownedC = CHROMES.filter(m => G.owned.chromes.includes(m.id));
    this.work.chrome = pick(ownedC.length ? ownedC : CHROMES).id;
    this.work.banner = pick(G.owned.banners);
    this.refreshTruckTexture(); this.layoutPickers();
    this.tweens.add({ targets: this.truckC, angle: 3, duration: 90, yoyo: true, repeat: 3, onComplete: () => this.truckC.setAngle(0) });
  }
  slotTap(i) {
    if (this.slots[i]) {
      this.work = Object.assign({}, this.slots[i]);
      this.refreshTruckTexture(); this.layoutPickers();
      this.hint.setText('Truck ' + (i + 1) + ' loaded.');
      AudioSys.click();
    } else {
      this.slots[i] = Object.assign({}, this.work);
      Store.set('slots', this.slots);
      this.hint.setText('Truck ' + (i + 1) + ' saved — it will wait for you here.');
      AudioSys.coin();
    }
    this.slotBtns[i].list[1].setText(this.slots[i] ? 'LOAD ' + (i + 1) : 'SAVE ' + (i + 1));
  }
  update(time, delta) {
    const t = time / 1000;
    this.tassels.forEach(ts => { ts.setRotation(Math.sin(t * 3.2 + ts.getData('ph')) * 0.35); });
    if (this.wheelL) {
      this.wheelL.rotation += delta * 0.004;
      this.wheelR.rotation += delta * 0.004;
    }
  }
}

/* ============================================================
   RACE — pseudo-3D Grand Trunk Road, style-point racing
   ============================================================ */
const SEG_LEN = 200, DRAW = 44, ROAD_W = 2200;
const CAM_H = 1050, CAM_DEPTH = 0.84, PLAYER_Z = CAM_DEPTH * CAM_H;
const MAX_SPEED = 7200, ACCEL = 5200, BRAKE = 9000, OFFROAD_DECEL = 7000;

class RaceScene extends Phaser.Scene {
  constructor() { super('race'); this.ui = []; }
  init(data) { this.legId = data.leg || 'lahore'; }
  create() {
    this.leg = LEGS.find(l => l.id === this.legId);
    this.ui.forEach(o => o.destroy()); this.ui = [];
    this.W = this.scale.width; this.H = this.scale.height;
    this.state = 'countdown'; this.countT = 0;
    this.position = 0; this.speed = 0; this.playerU = 0; this.playerV = 0;
    this.timeLeft = this.leg.secs;
    this.score = 0; this.style = 0; this.styleMilestone = 0;
    this.drifting = false; this.driftT = 0; this.airT = 0; this.airVy = 0; this.truckY = 0;
    this.slowmo = 0; this.timeScale = 1;
    this.traffic = []; this.spawnT = 0;
    this.police = null; this.policeT = 0; this.chaseActive = false; this.chaseT = 0; this.busted = false;
    this.chaseDone = false;
    this.crashCd = 0; this.hornCd = 0; this.nearCd = 0;
    this.shakeT = 0;
    this.signT = 400; this.signs = [];
    this.birds = []; this.birdT = 2;
    this.particles = [];
    this.bumpNext = 9000;
    this.finished = false;
    this.acc = 0; this.endBeep = false;
    this.steerTouch = null; // {id, startX, startU}
    this.keys = {};

    // ---- layers ----
    this.skyG = this.add.graphics();           // sky gradient
    this.sunSpr = this.add.image(0, 0, 'dot'); // sun/moon glow
    this.clouds = [];
    for (let i = 0; i < 4; i++) {
      const tint = this.leg.ambient === 'night' ? 'rgba(30,40,70,0.8)' : 'rgba(255,255,255,0.85)';
      if (!this.textures.exists('cloud' + i)) this.textures.addCanvas('cloud' + i, TexFactory.cloud(220, tint));
      const cl = this.add.image(Math.random() * this.W, rand(20, this.H * 0.3), 'cloud' + i);
      cl.setData('spd', rand(4, 12));
      this.clouds.push(cl);
    }
    this.hillImg = this.add.image(0, 0, this.leg.ambient === 'night' ? 'city' : (this.legId === 'salt' ? 'rocks' : 'city'))
      .setAlpha(this.legId === 'salt' ? 0.9 : 0.55);
    this.roadG = this.add.graphics();          // road ribbon
    this.sideG = this.add.graphics();          // roadside sprites drawn here? no — use images
    this.sideLayer = this.add.container(0, 0).setDepth(5); // dhaba signs, palms, poles (images, sorted by z)
    this.trafficLayer = this.add.container(0, 0).setDepth(6);
    // player container: truck + tassels + wheels + flare
    this.playerC = this.add.container(0, 0).setDepth(30);
    this.truckImg = this.add.image(0, 0, 'truck');
    this.playerC.add(this.truckImg);
    this.ptassels = [];
    [116, 184, 252, 320, 388].forEach((tx, i) => {
      const t = this.add.image(tx - 256, 88, 'tassel');
      t.setData('ph', i * 1.4);
      this.playerC.add(t); this.ptassels.push(t);
    });
    this.pWheelL = this.add.image(90 - 256, 88, 'wheel');
    this.pWheelR = this.add.image(422 - 256, 88, 'wheel');
    this.playerC.add([this.pWheelL, this.pWheelR]);
    this.flare = this.add.image(0, -40, 'flare').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.playerC.add(this.flare);
    // headlight cone (night)
    this.headlight = this.add.graphics().setDepth(25);
    // particle layer (simple images pooled)
    this.pLayer = this.add.container(0, 0).setDepth(35);
    for (let i = 0; i < 130; i++) {
      const p = this.add.image(-100, -100, 'dot').setVisible(false);
      p.setData({ vx: 0, vy: 0, life: 0, maxLife: 1, grow: 0, grav: 0 });
      this.pLayer.add(p); this.particles.push(p);
    }
    this.pIdx = 0;
    // rain (karachi)
    this.rain = [];
    if (this.leg.weather === 'rain') {
      for (let i = 0; i < 90; i++) {
        const r = this.add.image(rand(0, this.W), rand(0, this.H), 'dot')
          .setTint(0x9fc8e8).setAlpha(0.35).setScale(0.12, 1.6).setDepth(40);
        r.setData({ vy: rand(900, 1400), vx: -120 });
        this.rain.push(r);
      }
    }
    this.flashG = this.add.graphics().setDepth(49); // zoom-punch vignette / slow-mo tint

    this.buildHUD();
    this.layoutAll();
    this.scale.on('resize', this.layoutAll, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layoutAll, this));

    AudioSys.resume();
    AudioSys.setRain(this.leg.weather === 'rain');
    // countdown text
    this.countTxt = this.add.text(this.W / 2, this.H * 0.4, '3', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '110px', fontStyle: 'bold',
      color: '#ffd76a', stroke: '#5e0a1a', strokeThickness: 10
    }).setOrigin(0.5).setDepth(50);
    this.hintTxt = this.add.text(this.W / 2, this.H * 0.55,
      this.scale.width < this.scale.height ? 'Drag to steer · hold DRIFT to slide' : 'Drag or ← → to steer · SPACE = drift · H = horn', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '16px', color: '#ffe9a8',
      backgroundColor: 'rgba(0,0,0,0.45)', padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setDepth(50);
    if (!this._kbBound) {
      this.input.keyboard.on('keydown', (e) => { this.keys[e.code] = true; if (e.code === 'KeyH') this.doHorn(); if (e.code === 'KeyP') this.togglePause(); });      this.input.keyboard.on('keyup', (e) => { this.keys[e.code] = false; });
      this._kbBound = true;
    }
    this.setupTouch();
    window.__tar_debug = { scene: 'race', leg: this.legId, state: 'countdown' };
    window.__tar_scene = 'race';
    window.__tar_race = this;
  }

  /* ---------- projection ---------- */
  curveAt(dist) {
    const z = dist * 0.00006;
    if (this.legId === 'salt') return 4.2 * Math.sin(z * 1.35) + 2.2 * Math.sin(z * 0.42 + 1.3);
    if (this.legId === 'karachi') return 2.0 * Math.sin(z * 0.9 + 2.0);
    return 1.1 * Math.sin(z * 0.7);
  }
  /* ---------- road render ---------- */
  drawSky() {
    // static per leg — redrawn only on resize, NOT per frame
    const W = this.W, H = this.H, g = this.skyG;
    g.clear();
    const top = Phaser.Display.Color.HexStringToColor(this.leg.sky[0]).color;
    const bot = Phaser.Display.Color.HexStringToColor(this.leg.sky[1]).color;
    g.fillGradientStyle(top, top, bot, bot, 1);
    g.fillRect(0, 0, W, this.horizon + 2);
    const sunX = W * 0.78, sunY = this.horizon * (this.leg.ambient === 'dusk' ? 0.82 : 0.4);
    const sunCol = this.leg.ambient === 'night' ? 0xdfe8ff : (this.leg.ambient === 'dusk' ? 0xffb13d : 0xfff3c0);
    const sunR = this.leg.ambient === 'night' ? 26 : 40;
    this.sunSpr.setPosition(sunX, sunY).setTint(sunCol).setDisplaySize(sunR * 4, sunR * 4).setAlpha(0.9);
  }
  renderRoad() {
    const g = this.roadG, W = this.W, H = this.H;
    g.clear();

    const camZ = this.position - PLAYER_Z;
    const camX = this.playerU * ROAD_W / 2;
    const camY = CAM_H + this.truckY * 0; // camera steady; truck bounces visually
    let x = 0, dx = 0;
    let maxY = H;
    this.segCache = [];
    // ground: one base fill + alternating darker bands every 3 segments (cheap)
    g.fillStyle(this.legHillA, 1);
    g.fillRect(0, this.horizon, W, H - this.horizon);
    const bandTops = [];
    for (let n = 0; n < DRAW; n++) {
      const z1 = this.position + n * SEG_LEN;
      const z2 = z1 + SEG_LEN;
      const curve = this.curveAt(z1 + SEG_LEN / 2);
      const p1 = this.proj(z1, camX - x, camY, camZ);
      const p2 = this.proj(z2, camX - x - dx, camY, camZ);
      x += dx; dx += curve;
      if (p1.z <= CAM_DEPTH || p2.y >= p1.y || p2.y >= maxY) { this.segCache.push(null); continue; }
      const r1 = this.rumbleW(p1.scale), r2 = this.rumbleW(p2.scale);
      const w1 = this.roadW(p1.scale), w2 = this.roadW(p2.scale);
      const l1 = this.laneW(p1.scale), l2 = this.laneW(p2.scale);
      const alt = Math.floor(z1 / SEG_LEN / 3) % 2 === 0;
      const grp = Math.floor(n / 3);
      if (n % 3 === 0) bandTops[grp] = p1.y;
      if (n % 3 === 2 || n === DRAW - 1) {
        const yFar = p2.y, yNear = bandTops[grp];
        if (yNear !== undefined && grp % 2 === 1) {
          g.fillStyle(this.legHillB, 1);
          g.fillRect(0, yFar, W, yNear - yFar + 1);
        }
      }
      // rumble strips
      g.fillStyle(alt ? 0xc23b2e : 0xe8e4da, 1);
      g.beginPath();
      g.moveTo(p1.x - w1 - r1, p1.y); g.lineTo(p1.x - w1, p1.y);
      g.lineTo(p2.x - w2, p2.y); g.lineTo(p2.x - w2 - r2, p2.y);
      g.closePath(); g.fillPath();
      g.beginPath();
      g.moveTo(p1.x + w1 + r1, p1.y); g.lineTo(p1.x + w1, p1.y);
      g.lineTo(p2.x + w2, p2.y); g.lineTo(p2.x + w2 + r2, p2.y);
      g.closePath(); g.fillPath();
      // asphalt
      g.fillStyle(alt ? this.legRoadA : this.legRoadB, 1);
      g.beginPath();
      g.moveTo(p1.x - w1, p1.y); g.lineTo(p1.x + w1, p1.y);
      g.lineTo(p2.x + w2, p2.y); g.lineTo(p2.x - w2, p2.y);
      g.closePath(); g.fillPath();
      // lane glow lines (near half only — far ones are sub-pixel)
      if (alt && n < 26) {
        g.fillStyle(this.legLane, 0.75);
        [-1 / 3, 1 / 3].forEach(f => {
          g.beginPath();
          g.moveTo(p1.x - w1 * -f - l1, p1.y); g.lineTo(p1.x - w1 * -f + l1, p1.y);
          g.lineTo(p2.x - w2 * -f + l2, p2.y); g.lineTo(p2.x - w2 * -f - l2, p2.y);
          g.closePath(); g.fillPath();
        });
      }
      // neon reflections on wet road (karachi)
      if (this.leg.weather === 'rain' && n % 3 === 0 && n < 30) {
        g.fillStyle(n % 6 === 0 ? 0x2bd8ff : 0xff3bd8, 0.07);
        g.fillRect(p2.x - w2 * 0.7, p2.y, w2 * 1.4, p1.y - p2.y + 1);
      }
      maxY = p1.y;
      this.segCache.push({ cx: p1.x, scale: p1.scale, y: p1.y, curveX: x });
    }
  }
  proj(worldZ, camXoff, camY, camZ) {
    const cz = worldZ - camZ;
    const scale = CAM_DEPTH / Math.max(cz, 1);
    return {
      x: this.W / 2 + scale * (0 - camXoff) * this.W / 2,
      y: this.horizon + scale * camY * this.H * 0.5,
      scale: scale, z: cz
    };
  }
  rumbleW(s) { return s * 160 * this.W / 2 / 480; }
  roadW(s) { return s * (ROAD_W / 2) * this.W / 2; }
  laneW(s) { return Math.max(1, s * 22 * this.W / 2 / 480); }

  /* ---------- per-leg derived colors ---------- */
  setupLegColors() {
    const C = Phaser.Display.Color.HexStringToColor;
    this.legHillA = C(this.leg.hill).color;
    this.legHillB = C(shade(this.leg.hill, -22)).color;
    this.legRoadA = C(this.leg.road[0]).color;
    this.legRoadB = C(this.leg.road[1]).color;
    this.legLane = C(this.leg.laneGlow).color;
  }

  /* ---------- HUD ---------- */
  buildHUD() {
    const d = 60; // depth
    this.hudTimer = this.add.text(16, 12, '1:30', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '30px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000', strokeThickness: 5
    }).setDepth(d);
    this.hudLeg = this.add.text(this.W / 2, 14, this.leg.name, {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#ffe9a8'
    }).setOrigin(0.5, 0).setDepth(d);
    this.hudCoin = this.add.image(this.W - 132, 26, 'coin').setScale(0.8).setDepth(d);
    this.hudBudget = this.add.text(this.W - 112, 26, fmt(G.budget), {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#ffd76a'
    }).setOrigin(0, 0.5).setDepth(d);
    // style gauge (chrome rim + flame fill)
    this.gaugeX = 16; this.gaugeY = this.H - 66; this.gaugeW = 230; this.gaugeH = 26;
    this.gaugeG = this.add.graphics().setDepth(d);
    this.gaugeLabel = this.add.text(16, this.H - 92, 'STYLE', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#ffb13d'
    }).setDepth(d);
    this.stylePop = this.add.text(16, this.H - 130, '', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#7df0c5',
      stroke: '#000', strokeThickness: 4
    }).setDepth(d);
    this.hudSpeed = this.add.text(this.W - 16, this.H - 66, '0 km/h', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '24px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000', strokeThickness: 5
    }).setOrigin(1, 0.5).setDepth(d);
    this.scoreTxt = this.add.text(this.W - 16, 52, '0', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '24px', fontStyle: 'bold',
      color: '#7df0c5', stroke: '#000', strokeThickness: 4
    }).setOrigin(1, 0).setDepth(d);
    this.scoreLabel = this.add.text(this.W - 16, 82, 'STYLE PTS', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '11px', color: '#9fb2cc'
    }).setOrigin(1, 0).setDepth(d);
    // drift + horn buttons (touch)
    this.driftBtn = makeButton(this, this.W - 90, this.H - 150, 130, 64, 'DRIFT', () => {}, { bg: '#5e2ca5', fs: 18 });
    this.driftBtn.setDepth(d);
    this.driftHeld = false;
    this.driftBtn.on('pointerdown', () => { this.driftHeld = true; });
    this.driftBtn.on('pointerup', () => { this.driftHeld = false; });
    this.driftBtn.on('pointerout', () => { this.driftHeld = false; });
    this.hornBtn = makeButton(this, 90, this.H - 150, 130, 64, '📯 HORN', () => this.doHorn(), { bg: '#8a5f1a', fs: 18 });
    this.hornBtn.setDepth(d);
    // pause
    this.pauseBtn = makeButton(this, this.W - 40, 76, 56, 40, 'II', () => this.togglePause(), { bg: '#232f52', fs: 16 });
    this.pauseBtn.setDepth(d);
    this.banner = this.add.text(this.W / 2, this.H * 0.3, '', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '44px', fontStyle: 'bold',
      color: '#ffd76a', stroke: '#5e0a1a', strokeThickness: 8, align: 'center'
    }).setOrigin(0.5).setDepth(d + 5).setAlpha(0);
    this.drawGauge();
  }
  drawGauge() {
    const g = this.gaugeG;
    g.clear();
    const { gaugeX: x, gaugeY: y, gaugeW: w, gaugeH: h } = this;
    g.fillStyle(0x000000, 0.5); g.fillRoundedRect(x, y, w, h, 13);
    // chrome rim
    g.lineStyle(4, 0xe8f0fa, 1); g.strokeRoundedRect(x, y, w, h, 13);
    g.lineStyle(1, 0x5a6a85, 1); g.strokeRoundedRect(x + 3, y + 3, w - 6, h - 6, 10);
    const f = clamp(this.style / 100, 0, 1);
    if (f > 0.01) {
      const fw = (w - 10) * f;
      const hot = f > 0.7;
      g.fillStyle(hot ? 0xff5f3d : 0xffb13d, 1);
      g.fillRoundedRect(x + 5, y + 5, fw, h - 10, 8);
      g.fillStyle(0xffffff, 0.35);
      g.fillRoundedRect(x + 5, y + 5, fw, (h - 10) / 2, { tl: 8, tr: 8, bl: 0, br: 0 });
    }
  }
  showBanner(txt, color, dur) {
    this.banner.setText(txt).setColor(color || '#ffd76a').setAlpha(1).setScale(0.6);
    this.tweens.killTweensOf(this.banner);
    this.tweens.add({ targets: this.banner, scaleX: 1.05, scaleY: 1.05, alpha: 1, duration: 180, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.banner, alpha: 0, duration: 400, delay: dur || 1200 });
  }

  /* ---------- layout / resize ---------- */
  layoutAll() {
    this.W = this.scale.width; this.H = this.scale.height;
    this.horizon = this.H * 0.42;
    this.setupLegColors();
    if (!this.hudTimer) return;
    this.hudLeg.setPosition(this.W / 2, 14);
    this.hudCoin.setPosition(this.W - 132, 26);
    this.hudBudget.setPosition(this.W - 112, 26);
    this.gaugeY = this.H - 66;
    this.gaugeLabel.setPosition(16, this.H - 92);
    this.stylePop.setPosition(16, this.H - 130);
    this.hudSpeed.setPosition(this.W - 16, this.H - 66);
    this.scoreTxt.setPosition(this.W - 16, 52);
    this.scoreLabel.setPosition(this.W - 16, 82);
    this.driftBtn.setPosition(this.W - 90, this.H - 150);
    this.hornBtn.setPosition(90, this.H - 150);
    this.pauseBtn.setPosition(this.W - 40, 76);
    this.banner.setPosition(this.W / 2, this.H * 0.3);
    if (this.countTxt) this.countTxt.setPosition(this.W / 2, this.H * 0.4);
    if (this.hintTxt) this.hintTxt.setPosition(this.W / 2, this.H * 0.55);
    this.hillImg.setPosition(this.W / 2, this.horizon + 6)
      .setDisplaySize(Math.max(this.W * 1.4, 960), Math.max(this.W * 1.4, 960) * (this.legId === 'salt' ? 160 : 140) / 480);
    this.clouds.forEach(c => { c.x = clamp(c.x, 0, this.W); c.y = rand(20, this.H * 0.3); });
    this.drawGauge();
    this.drawSky();
    this.positionPlayer(0);
  }
  positionPlayer(dt) {
    const s = this.W / 960;
    const baseY = this.H * 0.86;
    this.playerC.setPosition(this.W / 2, baseY + this.truckY);
    const ts = 0.62 * s * (this.airT > 0 ? 1.04 : 1);
    this.truckImg.setScale(ts);
    const wob = this.drifting ? Math.sin(performance.now() / 60) * 0.02 : 0;
    this.playerC.setRotation(clamp(this.playerV * 0.06, -0.12, 0.12) + (this.drifting ? -Math.sign(this.playerV || 1) * 0.1 : 0) + wob);
    this.ptassels.forEach((t, i) => {
      t.setPosition((([116, 184, 252, 320, 388][i]) - 256) * ts, 88 * ts);
      t.setScale(ts);
      t.setRotation(Math.sin(performance.now() / 300 + t.getData('ph')) * (0.25 + this.speed / MAX_SPEED * 0.45));
    });
    this.pWheelL.setPosition((90 - 256) * ts, 88 * ts).setScale(ts * 1.02);
    this.pWheelR.setPosition((422 - 256) * ts, 88 * ts).setScale(ts * 1.02);
    if (dt) { this.pWheelL.rotation += dt * this.speed * 0.004; this.pWheelR.rotation += dt * this.speed * 0.004; }
    this.flare.setPosition(0, -30 * ts).setScale(ts * 2.4, ts * 1.2)
      .setAlpha(clamp(this.speed / MAX_SPEED, 0, 1) * 0.4);
    // headlight cone at night
    this.headlight.clear();
    if (this.leg.ambient === 'night') {
      this.headlight.fillStyle(0xfff3c0, 0.10);
      this.headlight.beginPath();
      this.headlight.moveTo(this.W / 2 - 60 * s, baseY - 40 * s);
      this.headlight.lineTo(this.W / 2 + 60 * s, baseY - 40 * s);
      this.headlight.lineTo(this.W / 2 + 200 * s, this.horizon + 40);
      this.headlight.lineTo(this.W / 2 - 200 * s, this.horizon + 40);
      this.headlight.closePath(); this.headlight.fillPath();
    }
  }

  /* ---------- input ---------- */
  setupTouch() {
    this.input.on('pointerdown', (p) => {
      if (this.state !== 'racing' || this.paused) return;
      if (p.y > this.H * 0.68) return; // button zone
      if (p.y < 120 && p.x > this.W - 120) return; // pause button
      if (this.steerTouch) return;
      this.steerTouch = { id: p.id, startX: p.x, startU: this.playerU };
    });
    this.input.on('pointermove', (p) => {
      if (this.steerTouch && p.id === this.steerTouch.id && p.isDown) {
        this.steerTouch.targetU = clamp(this.steerTouch.startU + (p.x - this.steerTouch.startX) / this.W * 2.6, -1.05, 1.05);
      }
    });
    const end = (p) => { if (this.steerTouch && p.id === this.steerTouch.id) this.steerTouch = null; };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);
  }
  doHorn() {
    if (this.state !== 'racing' || this.hornCd > 0) return;
    this.hornCd = 0.8;
    AudioSys.horn();
    this.addStyle(3); this.score += 10;
    // nearby traffic wobbles (fun!)
    this.traffic.forEach(v => {
      const zr = v.z - this.position;
      if (zr > 0 && zr < 2500) v.wob = 1;
    });
    this.hornRing();
  }
  hornRing() {
    const s = this.W / 960;
    const ring = this.add.image(this.W / 2, this.H * 0.8, 'dot')
      .setTint(0xffe27a).setScale(2 * s).setAlpha(0.7).setDepth(45);
    this.tweens.add({
      targets: ring, scaleX: 22 * s, scaleY: 22 * s, alpha: 0, duration: 500,
      onComplete: () => ring.destroy()
    });
  }
  togglePause() {
    if (this.state !== 'racing') return;
    this.paused = !this.paused;
    AudioSys.setEngine(0, 0);
    if (this.paused) {
      const W = this.W, H = this.H;
      this.pauseUI = this.add.container(0, 0).setDepth(100);
      const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);
      const p = panelBg(this, 340, 240); p.setPosition(W / 2 - 170, H / 2 - 120);
      const t = this.add.text(W / 2, H / 2 - 80, 'PAUSED', {
        fontFamily: '"Trebuchet MS", sans-serif', fontSize: '34px', fontStyle: 'bold', color: '#ffd76a'
      }).setOrigin(0.5);
      const r = makeButton(this, W / 2, H / 2 - 10, 240, 54, '▶ RESUME', () => this.togglePause());
      const q = makeButton(this, W / 2, H / 2 + 58, 240, 54, '🏁 QUIT RACE', () => {
        AudioSys.setRain(false); this.scene.start('legs');
      }, { bg: '#5e2ca5' });
      this.pauseUI.add([dim, p, t, r, q]);
    } else if (this.pauseUI) { this.pauseUI.destroy(true); this.pauseUI = null; }
  }

  /* ---------- style & score ---------- */
  addStyle(n) {
    if (this.state !== 'racing') return;
    const before = this.style;
    this.style = clamp(this.style + n, 0, 100);
    this.drawGauge();
    [70, 85, 100].forEach(m => {
      if (before < m && this.style >= m) {
        AudioSys.dhol();
        this.showBanner(m === 100 ? 'FULL STYLE! 🔥' : 'STYLE UP!', '#7df0c5', 900);
      }
    });
    if (this.style >= 80 && !this.chaseActive && !this.busted && !this.chaseDone) this.startChase();
  }
  addScore(n, label) {
    this.score += n;
    if (label) {
      this.stylePop.setText('+' + n + ' ' + label).setAlpha(1);
      this.tweens.killTweensOf(this.stylePop);
      this.tweens.add({ targets: this.stylePop, alpha: 0, y: this.H - 160, duration: 900, onComplete: () => this.stylePop.setY(this.H - 130) });
    }
    this.scoreTxt.setText(fmt(this.score));
  }

  /* ---------- traffic ---------- */
  spawnTraffic() {
    if (this.traffic.length >= 14) return;
    const kinds = [
      { k: 'rickshaw', w: 420, sp: [3000, 3800], wt: 3 },
      { k: 'bus', w: 560, sp: [2600, 3200], wt: 2 },
      { k: 'bike', w: 300, sp: [3600, 4400], wt: 3 },
      { k: 'cart', w: 480, sp: [2000, 2400], wt: this.legId === 'lahore' ? 2 : 1 },
    ];
    const tot = kinds.reduce((a, b) => a + b.wt, 0);
    let r = Math.random() * tot, kd = kinds[0];
    for (const k2 of kinds) { r -= k2.wt; if (r <= 0) { kd = k2; break; } }
    const lane = pick([-1, 0, 1]);
    const tex = 'v_' + kd.k + randi(0, 2);
    const img = this.add.image(-200, -200, tex).setOrigin(0.5, 1);
    this.trafficLayer.add(img);
    this.traffic.push({
      u: lane * 0.42 + rand(-0.06, 0.06), z: this.position + rand(4000, 14000),
      speed: rand(kd.sp[0], kd.sp[1]), img: img, w: kd.w, wob: 0,
      laneT: 0, kind: kd.k, passed: false
    });
  }
  updateTraffic(dt) {
    // spawn
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnTraffic();
      this.spawnT = rand(0.5, 1.6) / this.leg.density;
    }
    const toRemove = [];
    this.traffic.forEach(v => {
      v.z += v.speed * dt;
      v.laneT += dt;
      // gentle lane wobble + horn wobble
      let wobX = Math.sin(v.laneT * 1.7) * 0.02;
      if (v.wob > 0) { wobX += Math.sin(v.laneT * 22) * 0.06 * v.wob; v.wob -= dt * 1.4; }
      const zr = v.z - this.position;
      if (zr < -600) { toRemove.push(v); return; }
      const n = clamp(Math.floor(zr / SEG_LEN), 0, DRAW - 1);
      const seg = this.segCache[n];
      if (!seg || n < 2) { v.img.setVisible(false); return; }
      v.img.setVisible(true);
      const sx = seg.cx + seg.scale * (v.u + wobX) * (ROAD_W / 2) * this.W / 2;
      const pxW = seg.scale * v.w * this.W / 2;
      const sc = pxW / v.img.width;
      v.img.setPosition(sx, seg.y).setScale(sc);
      v.img.depth = 20 - n * 0.05;
      // brake glow when player close behind
      // (cheap: skip)
      // collision
      if (this.crashCd <= 0 && zr > -40 && zr < 300) {
        const du = Math.abs((v.u + wobX) - this.playerU);
        if (du < 0.20) this.crash(v);
      }
      // near miss: crossing the hit plane without collision
      if (!v.passed && zr < 0) {
        v.passed = true;
        const du = Math.abs(v.u - this.playerU);
        if (du >= 0.20 && du < 0.48 && this.speed > 3800) this.nearMiss(v);
        else if (du < 0.9) { this.addScore(25, 'OVERTAKE'); }
      }
    });
    toRemove.forEach(v => { v.img.destroy(); this.traffic.splice(this.traffic.indexOf(v), 1); });
    this.trafficLayer.sort('depth');
  }
  crash(v) {
    this.crashCd = 1.2;
    AudioSys.crash();
    this.cameras.main.shake(220, 0.012);
    this.speed *= 0.35;
    this.style = clamp(this.style - 25, 0, 100); this.drawGauge();
    this.score = Math.max(0, this.score - 100);
    this.scoreTxt.setText(fmt(this.score));
    this.showBanner('CRASH!', '#ff6a6a', 800);
    this.burst(this.W / 2, this.H * 0.78, 0x9aa6b5, 24, 300);
    if (this.chaseActive) this.bustedChase();
  }
  nearMiss(v) {
    if (this.nearCd > 0) return;
    this.nearCd = 0.5;
    AudioSys.nearMiss();
    this.addStyle(14);
    this.addScore(150, 'NEAR MISS!');
    // slow-mo + zoom punch
    this.slowmo = 0.38;
    this.cameras.main.zoomTo(1.06, 130);
    this.time.delayedCall(260, () => this.cameras.main.zoomTo(1, 320));
    this.showBanner('NEAR MISS!', '#7df0ff', 700);
  }

  /* ---------- police chase ---------- */
  startChase() {
    this.chaseActive = true; this.chaseT = 12;
    AudioSys.siren(12);
    this.showBanner('🚔 POLICE CHASE! Don\'t let them block you!', '#ff6a6a', 1800);
    const img = this.add.image(-300, -300, 'v_police').setOrigin(0.5, 1);
    const lr = this.add.image(0, 0, 'light_pr').setOrigin(0.5, 1);
    const lb = this.add.image(0, 0, 'light_pb').setOrigin(0.5, 1);
    this.trafficLayer.add([img, lr, lb]);
    // police tries to cut you off from AHEAD — visible and dramatic
    this.police = { z: this.position + 5200, u: this.playerU + 0.35, speed: MAX_SPEED * 0.8, img, lr, lb, blink: 0 };
  }
  updateChase(dt) {
    if (!this.chaseActive || !this.police) return;
    const p = this.police;
    p.z += p.speed * dt;
    p.blink += dt;
    const zr = p.z - this.position;
    // swerve to block as you close in
    if (zr < 2600) p.u += (this.playerU - p.u) * Math.min(1, 2.2 * dt);
    // ramming the blocker = busted
    if (this.crashCd <= 0 && zr > -40 && zr < 320 && Math.abs(p.u - this.playerU) < 0.20) {
      this.crashCd = 1.2;
      AudioSys.crash();
      this.cameras.main.shake(220, 0.012);
      this.speed *= 0.4;
      this.bustedChase();
    }
    const n = clamp(Math.floor(zr / SEG_LEN), 0, DRAW - 1);
    const seg = this.segCache[n];
    if (seg && n >= 2 && zr > -200) {
      const sx = seg.cx + seg.scale * p.u * (ROAD_W / 2) * this.W / 2;
      const sc = (seg.scale * 480 * this.W / 2) / p.img.width;
      p.img.setVisible(true).setPosition(sx, seg.y).setScale(sc);
      p.img.depth = 20 - n * 0.05;
      const on = Math.floor(p.blink * 6) % 2 === 0;
      p.lr.setVisible(on).setPosition(sx - 20 * sc, seg.y - 96 * sc).setScale(sc);
      p.lb.setVisible(!on).setPosition(sx + 20 * sc, seg.y - 96 * sc).setScale(sc);
      p.lr.depth = p.lb.depth = 21;
    } else { p.img.setVisible(false); p.lr.setVisible(false); p.lb.setVisible(false); }
    this.chaseT -= dt;
    if (this.chaseT <= 0) this.escapedChase();
    else if (zr < -800) { // you blew past them — they give up early, still counts
      this.chaseT = Math.min(this.chaseT, 1.5);
    }
  }
  escapedChase() {
    this.chaseActive = false; this.chaseDone = true;
    if (this.police) { this.police.img.destroy(); this.police.lr.destroy(); this.police.lb.destroy(); this.police = null; }
    this.addScore(1000, 'ESCAPED THE POLICE!');
    AudioSys.fanfare();
    this.showBanner('ESCAPED! +1000', '#ffd76a', 1500);
  }
  bustedChase() {
    this.chaseActive = false; this.chaseDone = true; this.busted = true;
    if (this.police) { this.police.img.destroy(); this.police.lr.destroy(); this.police.lb.destroy(); this.police = null; }
    this.style = 0; this.drawGauge();
    this.showBanner('BUSTED! Style lost.', '#ff6a6a', 1500);
  }

  /* ---------- particles ---------- */
  burst(x, y, tint, n, spd) {
    for (let i = 0; i < n; i++) {
      const p = this.particles[this.pIdx++ % this.particles.length];
      const a = rand(0, TAU), s = rand(spd * 0.3, spd);
      p.setVisible(true).setPosition(x, y).setTint(tint).setAlpha(0.9).setScale(rand(0.15, 0.4));
      p.setData({ vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * 0.4, life: rand(0.4, 0.9), maxLife: 0.9, grow: -0.15, grav: 500 });
    }
  }
  smoke(x, y, dark) {
    const p = this.particles[this.pIdx++ % this.particles.length];
    p.setVisible(true).setPosition(x + rand(-8, 8), y).setTint(dark ? 0x3a3a3a : 0xcfc8bd)
      .setAlpha(0.55).setScale(rand(0.25, 0.5));
    p.setData({ vx: rand(-40, 40), vy: rand(-140, -60), life: rand(0.5, 1.0), maxLife: 1.0, grow: 0.9, grav: -60 });
  }
  updateParticles(dt) {
    // (per-field access for speed)
    for (const p of this.particles) {
      let life = p.getData('life');
      if (life <= 0) { if (p.visible) p.setVisible(false); continue; }
      life -= dt;
      p.setData('life', life);
      if (life <= 0) { p.setVisible(false); continue; }
      p.x += p.getData('vx') * dt;
      p.y += p.getData('vy') * dt;
      p.setData('vy', p.getData('vy') + p.getData('grav') * dt);
      const gr = p.getData('grow');
      if (gr) p.setScale(Math.max(0.01, p.scaleX + gr * dt));
      p.setAlpha(clamp(life / p.getData('maxLife'), 0, 1) * 0.85);
    }
  }
  confetti() {
    const cols = [0xff5f3d, 0xffb13d, 0x7df0c5, 0x2c9ac5, 0xe86a9a];
    for (let i = 0; i < 70; i++) {
      const p = this.particles[this.pIdx++ % this.particles.length];
      p.setVisible(true).setPosition(rand(0, this.W), rand(-40, -10))
        .setTint(pick(cols)).setAlpha(1).setScale(rand(0.15, 0.35));
      p.setData({ vx: rand(-60, 60), vy: rand(120, 320), life: rand(1.2, 2.2), maxLife: 2.2, grow: 0, grav: 60 });
    }
  }

  /* ---------- roadside ---------- */
  updateRoadside(dt) {
    this.signT -= this.speed * dt;
    if (this.signT <= 0) {
      this.signT = rand(1800, 3200);
      const side = Math.random() > 0.5 ? 1 : -1;
      const r = Math.random();
      let tex, w;
      if (r < 0.4) { tex = 'sign' + randi(0, 5); w = 900; }
      else if (r < 0.7) { tex = 'palm'; w = 500; }
      else { tex = 'pole'; w = 300; }
      const img = this.add.image(-300, -300, tex).setOrigin(0.5, 1);
      this.sideLayer.add(img);
      this.signs.push({ u: side * rand(1.25, 1.6), z: this.position + rand(6000, 12000), img, w });
    }
    const dead = [];
    this.signs.forEach(s => {
      const zr = s.z - this.position;
      if (zr < -400) { dead.push(s); return; }
      const n = clamp(Math.floor(zr / SEG_LEN), 0, DRAW - 1);
      const seg = this.segCache[n];
      if (!seg || n < 2) { s.img.setVisible(false); return; }
      s.img.setVisible(true);
      const sx = seg.cx + seg.scale * s.u * (ROAD_W / 2) * this.W / 2;
      const sc = (seg.scale * s.w * this.W / 2) / s.img.width;
      s.img.setPosition(sx, seg.y + 4).setScale(sc);
      s.img.depth = 10 - n * 0.05;
    });
    dead.forEach(s => { s.img.destroy(); this.signs.splice(this.signs.indexOf(s), 1); });
    this.sideLayer.sort('depth');
    // birds (day/dusk)
    if (this.leg.ambient !== 'night') {
      this.birdT -= dt;
      if (this.birdT <= 0 && this.birds.length < 5) {
        this.birdT = rand(2, 6);
        const b = this.add.image(rand(0, this.W), rand(this.H * 0.1, this.horizon * 0.8), 'bird')
          .setScale(rand(0.7, 1.2));
        b.setData({ vx: rand(40, 90) * (Math.random() > 0.5 ? 1 : -1), ph: rand(0, 9) });
        this.birds.push(b);
      }
    }
    const bdead = [];
    this.birds.forEach(b => {
      b.x += b.getData('vx') * dt;
      b.setScale(b.scaleX, Math.abs(b.scaleY) * (0.6 + 0.4 * Math.abs(Math.sin(performance.now() / 130 + b.getData('ph')))) * Math.sign(b.scaleY || 1));
      if (b.x < -60 || b.x > this.W + 60) bdead.push(b);
    });
    bdead.forEach(b => { b.destroy(); this.birds.splice(this.birds.indexOf(b), 1); });
    // clouds drift
    this.clouds.forEach(c => {
      c.x += c.getData('spd') * dt;
      if (c.x > this.W + 140) c.x = -140;
    });
    // rain
    if (this.leg.weather === 'rain') {
      this.rain.forEach(r => {
        r.y += r.getData('vy') * dt;
        r.x += r.getData('vx') * dt;
        if (r.y > this.H) { r.y = -20; r.x = rand(0, this.W); }
      });
    }
    // dust motes near player at speed
    if (this.speed > 4500 && Math.random() < 0.35) {
      this.smoke(this.W / 2 + rand(-140, 140) * (this.W / 960), this.H * 0.92, false);
    }
  }

  /* ---------- main loop ---------- */
  update(time, delta) {
    const realDt = Math.min(delta / 1000, 0.05);
    if (this.paused) return;
    // slow-mo easing
    const targetTS = this.slowmo > 0 ? 0.32 : 1;
    this.timeScale += (targetTS - this.timeScale) * Math.min(1, 8 * realDt);
    if (this.slowmo > 0) this.slowmo -= realDt;

    if (this.state === 'countdown') {
      this.countT += realDt;
      const seq = ['3', '2', '1', 'GO!'];
      const idx = Math.min(3, Math.floor(this.countT / 0.8));
      if (this.countTxt.text !== seq[idx]) {
        this.countTxt.setText(seq[idx]);
        AudioSys.blip(idx < 3 ? 440 : 880, 0.15, 'square', 0.18);
        this.countTxt.setScale(0.5);
        this.tweens.add({ targets: this.countTxt, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
      }
      this.renderRoad();
      this.positionPlayer(realDt);
      if (this.countT >= 3.2) {
        this.state = 'racing';
        const ct = this.countTxt, ht = this.hintTxt;
        this.tweens.add({ targets: [ct, ht], alpha: 0, duration: 600, onComplete: () => { ct.destroy(); ht.destroy(); } });
        this.countTxt = null; this.hintTxt = null;
        this.showBanner(this.leg.name, '#ffd76a', 1400);
        AudioSys.dhol();
      }
      return;
    }

    if (this.state === 'finished') {
      this.speed = Math.max(0, this.speed - BRAKE * realDt);
      this.position += this.speed * realDt;
      this.renderRoad();
      this.updateTraffic(realDt);
      this.updateRoadside(realDt);
      this.updateParticles(realDt);
      this.positionPlayer(realDt);
      AudioSys.setEngine(this.speed / MAX_SPEED, 0);
      return;
    }

    // racing — fixed timestep
    this.acc = (this.acc || 0) + realDt * this.timeScale;
    if (this.acc > 0.25) this.acc = 0.25; // tab was hidden — don't spiral
    const STEP = 1 / 60;
    let n = 0;
    while (this.acc >= STEP && n < 5) { this.step(STEP); this.acc -= STEP; n++; }
    this.renderRoad();
    this.positionPlayer(realDt);
    this.updateParticles(realDt * this.timeScale);
    // HUD
    const t = Math.max(0, this.timeLeft);
    const mm = Math.floor(t / 60), ss = Math.floor(t % 60);
    this.hudTimer.setText(mm + ':' + String(ss).padStart(2, '0'));
    this.hudTimer.setColor(t < 10 ? '#ff6a6a' : '#ffffff');
    this.hudSpeed.setText(Math.round(this.speed / MAX_SPEED * 142) + ' km/h');
    this.drawGauge();
    AudioSys.setEngine(this.speed / MAX_SPEED, this.throttleVis || 0);
    if (window.__tar_debug) {
      window.__tar_debug.state = this.state;
      window.__tar_debug.score = Math.floor(this.score);
      window.__tar_debug.speed = Math.floor(this.speed);
      window.__tar_debug.traffic = this.traffic.length;
      window.__tar_debug.style = Math.floor(this.style);
    }
    // slow-mo vignette
    this.flashG.clear();
    if (this.timeScale < 0.8) {
      this.flashG.fillStyle(0x7df0ff, (0.8 - this.timeScale) * 0.25);
      this.flashG.fillRect(0, 0, this.W, this.H);
    }
    // countdown beep at 3s left
    if (t <= 3.2 && !this.endBeep) { this.endBeep = true; AudioSys.blip(880, 0.3, 'square', 0.2); }
  }

  step(dt) {
    // timer
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.finish(); return; }
    // steering input
    let steer = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) steer -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) steer += 1;
    this.throttleVis = (this.keys['ArrowUp'] || this.keys['KeyW']) ? 1 : 0;
    if (this.steerTouch && this.steerTouch.targetU !== undefined) {
      const diff = this.steerTouch.targetU - this.playerU;
      this.playerV = clamp(diff * 9, -2.4, 2.4);
      this.playerU = clamp(this.playerU + this.playerV * dt, -1.05, 1.05);
    } else {
      const targetV = steer * 1.9;
      this.playerV += (targetV - this.playerV) * Math.min(1, 9 * dt);
      this.playerU = clamp(this.playerU + this.playerV * dt, -1.05, 1.05);
    }
    // drift
    const wantDrift = (this.driftHeld || this.keys['Space']) && Math.abs(this.playerV) > 0.25 && this.speed > 2600;
    if (wantDrift && !this.drifting) { this.drifting = true; this.driftT = 0; AudioSys.skid(0.5); }
    if (!wantDrift) this.drifting = false;
    if (this.drifting) {
      this.driftT += dt;
      this.addStyle(9 * dt);
      this.driftScore = (this.driftScore || 0) + 40 * dt;
      if (this.driftScore > 40) { this.addScore(Math.floor(this.driftScore), 'DRIFT'); this.driftScore = 0; }
      const s = this.W / 960;
      this.smoke(this.W / 2 - 120 * s, this.H * 0.9, true);
      if (Math.random() < 0.3) this.smoke(this.W / 2 + 120 * s, this.H * 0.9, true);
      // drift slides the truck a touch wider
      this.playerU = clamp(this.playerU + Math.sign(this.playerV) * 0.35 * dt, -1.05, 1.05);
    }
    // speed
    let target = MAX_SPEED * (this.style >= 70 ? 1.15 : 1);
    const offroad = Math.abs(this.playerU) > 0.62;
    if (offroad) {
      target *= 0.55;
      if (Math.random() < 0.5) this.smoke(this.W / 2 + rand(-100, 100), this.H * 0.93, false);
      if (!this.rumbleT || this.rumbleT <= 0) { this.cameras.main.shake(90, 0.003); this.rumbleT = 0.25; }
    }
    if (this.drifting) target *= 0.97;
    if (this.airT > 0) target *= 1.05;
    this.speed += clamp(target - this.speed, -BRAKE * dt, ACCEL * dt);
    this.position += this.speed * dt;
    if (this.rumbleT > 0) this.rumbleT -= dt;
    // bumps → airtime (all legs have small bumps; salt range has big ones)
    if (this.position > this.bumpNext) {
      this.bumpNext = this.position + rand(7000, 13000);
      if (this.speed > 4200 && this.airT <= 0) {
        this.airT = 0.55;
        AudioSys.blip(300, 0.25, 'sine', 0.12, 700);
      }
    }
    if (this.airT > 0) {
      this.airT -= dt;
      const k = 1 - this.airT / 0.55;
      this.truckY = -Math.sin(k * Math.PI) * 64 * (this.W / 960);
      if (this.airT <= 0) {
        this.truckY = 0;
        // squash on landing
        this.tweens.add({ targets: this.playerC, scaleY: 0.88, duration: 90, yoyo: true });
        AudioSys.noise(0.15, 0.2, 400, 'lowpass');
        this.burst(this.W / 2, this.H * 0.9, 0xcfc8bd, 14, 220);
        this.addStyle(18);
        this.addScore(200, 'AIRTIME!');
      }
    }
    // style decay
    if (this.style > 0) { this.style = Math.max(0, this.style - 4.5 * dt); }
    // cooldowns
    if (this.crashCd > 0) this.crashCd -= dt;
    if (this.hornCd > 0) this.hornCd -= dt;
    if (this.nearCd > 0) this.nearCd -= dt;
    // world
    this.updateTraffic(dt);
    this.updateChase(dt);
    this.updateRoadside(dt);
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.state = 'finished';
    this.timeLeft = 0;
    AudioSys.setRain(false);
    this.showBanner('FINISH!', '#ffd76a', 1600);
    AudioSys.fanfare();
    this.time.delayedCall(2200, () => this.showResults());
  }
  showResults() {
    const W = this.W, H = this.H;
    const medal = medalFor(this.score);
    const earned = 250 + Math.floor(this.score / 8);
    G.budget += earned; 
    let newBest = false;
    const prev = G.best[this.legId];
    if (!prev || this.score > prev.score) {
      G.best[this.legId] = { score: Math.floor(this.score), medal: medal };
      newBest = true;
    }
    saveEconomy();
    this.hudBudget.setText(fmt(G.budget));

    const ui = this.add.container(0, 0).setDepth(100);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65);
    const pw = Math.min(460, W * 0.92), ph = Math.min(430, H * 0.86);
    const p = panelBg(this, pw, ph); p.setPosition(W / 2 - pw / 2, H / 2 - ph / 2);
    ui.add([dim, p]);
    const y0 = H / 2 - ph / 2;
    const t1 = this.add.text(W / 2, y0 + 34, this.leg.name + ' — COMPLETE!', {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffd76a'
    }).setOrigin(0.5);
    ui.add(t1);
    ui.add(floralStrip(this, pw * 0.7).setPosition(W / 2, y0 + 66));
    const t2 = this.add.text(W / 2, y0 + 110, fmt(this.score), {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '52px', fontStyle: 'bold', color: '#7df0c5'
    }).setOrigin(0.5);
    ui.add(t2);
    const t3 = this.add.text(W / 2, y0 + 148, 'STYLE POINTS' + (newBest ? '  ·  NEW BEST!' : ''), {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '15px', fontStyle: 'bold',
      color: newBest ? '#ffd76a' : '#9fb2cc'
    }).setOrigin(0.5);
    ui.add(t3);
    if (medal) {
      const m = this.add.text(W / 2, y0 + 196, '🏅 ' + medal.toUpperCase() + ' MEDAL', {
        fontFamily: '"Trebuchet MS", sans-serif', fontSize: '26px', fontStyle: 'bold',
        color: MEDAL_COLORS[medal]
      }).setOrigin(0.5);
      ui.add(m);
      this.confetti();
      AudioSys.fanfare();
    } else {
      const m = this.add.text(W / 2, y0 + 196, 'No medal yet — more near-misses next run!', {
        fontFamily: '"Trebuchet MS", sans-serif', fontSize: '15px', color: '#9fb2cc'
      }).setOrigin(0.5);
      ui.add(m);
    }
    const e = this.add.text(W / 2, y0 + 238, 'Coins earned: ' + fmt(earned), {
      fontFamily: '"Trebuchet MS", sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ffd76a'
    }).setOrigin(0.5);
    ui.add(e);
    AudioSys.coin();
    const bw2 = Math.min(200, pw / 3 - 16);
    const b1 = makeButton(this, W / 2 - bw2 - 10, y0 + ph - 60, bw2, 52, '↻ AGAIN', () => {
      this.scene.restart({ leg: this.legId });
    }, { fs: 15 });
    const b2 = makeButton(this, W / 2, y0 + ph - 60, bw2, 52, '🗺 LEGS', () => this.scene.start('legs'), { bg: '#232f52', fs: 15 });
    const b3 = makeButton(this, W / 2 + bw2 + 10, y0 + ph - 60, bw2, 52, '🎨 STUDIO', () => this.scene.start('studio'), { bg: '#5e2ca5', fs: 15 });
    ui.add([b1, b2, b3]);
    ui.setAlpha(0); ui.setScale(0.9);
    this.tweens.add({ targets: ui, alpha: 1, scaleX: 1, scaleY: 1, duration: 350, ease: 'Back.easeOut' });
  }
}

/* ============================================================
   GAME BOOT
   ============================================================ */
window.addEventListener('error', function (e) {
  var msg = document.getElementById('loadmsg');
  var btn = document.getElementById('retrybtn');
  if (msg && btn && document.getElementById('loader').style.display !== 'none') {
    msg.textContent = 'Something failed to load. Please try again.';
    msg.style.color = '#ff8a8a';
    btn.style.display = 'block';
    btn.onclick = function () { window.location.reload(); };
  }
});

function bootGame() {
  ['loadfill', 'loadmsg'].forEach(function (id) {
    if (!document.getElementById(id)) throw new Error('loader DOM missing');
  });
  const config = {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0b0e14',
    scale: {
      mode: Phaser.Scale.RESIZE,
      parent: 'game',
      width: window.innerWidth,
      height: window.innerHeight
    },
    render: { antialias: true, roundPixels: false },
    scene: [BootScene, MenuScene, LegSelectScene, StudioScene, RaceScene],
    disableContextMenu: true
  };
  new Phaser.Game(config);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
