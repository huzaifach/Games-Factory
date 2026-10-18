'use strict';
/* WOBBLE WORLD — 00-util.js : math, easing, color helpers */

const TAU = Math.PI * 2;
const STAGE_W = 800;
const STAGE_H = 1200;

const Util = {
  clamp(v, a, b) { return v < a ? a : (v > b ? b : v); },
  lerp(a, b, t) { return a + (b - a) * t; },
  rand(a, b) { return a + Math.random() * (b - a); },
  randi(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  chance(p) { return Math.random() < p; },
  dist(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); },
  dist2(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return dx * dx + dy * dy; },

  easeOutCubic(t) { t = Util.clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); },
  easeInOutQuad(t) { t = Util.clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  easeOutBack(t) {
    t = Util.clamp(t, 0, 1);
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeOutElastic(t) {
    t = Util.clamp(t, 0, 1);
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1;
  },

  // angle helpers
  angDiff(a, b) {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  },
  angLerp(a, b, t) { return a + Util.angDiff(a, b) * Util.clamp(t, 0, 1); },

  // ---- color helpers (hex like '#ff8fb3') ----
  hexToRgb(hex) {
    const h = hex.replace('#', '');
    const v = h.length === 3
      ? h.split('').map(c => c + c).join('')
      : h;
    return {
      r: parseInt(v.substr(0, 2), 16),
      g: parseInt(v.substr(2, 2), 16),
      b: parseInt(v.substr(4, 2), 16)
    };
  },
  rgba(hex, a) {
    const c = Util.hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  },
  mixHex(h1, h2, t) {
    const a = Util.hexToRgb(h1), b = Util.hexToRgb(h2);
    const r = Math.round(Util.lerp(a.r, b.r, t));
    const g = Math.round(Util.lerp(a.g, b.g, t));
    const bl = Math.round(Util.lerp(a.b, b.b, t));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  },
  // amt: -100 (black) .. +100 (white)
  shade(hex, amt) {
    const c = Util.hexToRgb(hex);
    const f = amt / 100;
    const t = v => Math.round(Util.clamp(f > 0 ? v + (255 - v) * f : v * (1 + f), 0, 255));
    const r = t(c.r), g = t(c.g), b = t(c.b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  now() {
    return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
  },

  // roundRect path helper (works even where ctx.roundRect is missing)
  rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  // ellipse helper
  ell(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
  }
};
