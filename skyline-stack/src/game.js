'use strict';
/* SKYLINE STACK — vanilla canvas game. No frameworks, zero external requests.
 * Sections: helpers / config / themes / save / dom / boot+loader / prerender /
 *   state / tower / crane / input / resolve+juice / update / render /
 *   hud+toasts / tutorial / howto demos / share / menus / main loop / debug.
 */
(function () {
'use strict';
var L = window.SkylineLogic;
var Audio = window.SkylineAudio;

/* ================= helpers ================= */
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function rand(a, b) { return a + Math.random() * (b - a); }
function randi(a, b) { return Math.floor(rand(a, b + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeOutBack(t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

/* ================= config ================= */
var W = 420;              // logical width
var FH = 26;              // floor height (logical px)
var RAIL_Y = 66;          // crane rail screen-y (logical)
var CABLE_L = 165;
var GRAV = 2600;
var DETAIL_FLOORS = 40;   // full-detail draw window (top N floors)

/* ================= theme art ================= */
var THEME_ART = {
  neon: {
    sky: ['#160f38', '#3c1a63', '#8e2f6d', '#e86a5a', '#ff9a4d'],
    sun: { x: 0.5, y: 0.80, c: '#ffb347', r: 110, a: 0.55 },
    moon: null, stars: 0.85,
    far: '#2a1f5c', mid: '#372a72', near: '#463489', winLit: '#ffd97a', winLitP: 0.30, beacon: true,
    floorTop: '#4a3670', floorBot: '#322357', trim: '#39f5d6', trim2: '#ff4fd8',
    cloud: '#7a5296', cloudA: 0.5, rain: false, shimmer: false,
    winWarm: '#ffca7a', winDark: '#241c48', sill: '#241c48'
  },
  desert: {
    sky: ['#241243', '#6e2a5e', '#c65a68', '#f08a52', '#ffc46b'],
    sun: { x: 0.62, y: 0.62, c: '#ffd98a', r: 80, a: 0.5 },
    moon: null, stars: 0.4,
    dunes: true, far: '#4e2a52', mid: '#6e3a5c', near: '#8a5a50', winLit: '#ffe6b0', winLitP: 0.26, beacon: false,
    floorTop: '#8a5a4a', floorBot: '#59364a', trim: '#ff9e5c', trim2: '#ffd98a',
    cloud: '#d88a6a', cloudA: 0.35, rain: false, shimmer: true,
    winWarm: '#ffe6b0', winDark: '#3a2440', sill: '#3a2440', winCool: '#7df5e8'
  },
  monsoon: {
    sky: ['#0b1734', '#1d3a63', '#3f6a8e', '#6f97ad'],
    sun: null,
    moon: { x: 0.22, y: 0.20, c: '#e8f2ff', r: 34, a: 0.9 },
    stars: 0.5,
    far: '#1c2f52', mid: '#27436e', near: '#33567f', winLit: '#ffe9b0', winLitP: 0.34, beacon: true,
    floorTop: '#42536e', floorBot: '#2a3550', trim: '#5ce1ff', trim2: '#b8f1ff',
    cloud: '#3d5a7d', cloudA: 0.65, rain: true, shimmer: false,
    winWarm: '#ffe9b0', winDark: '#1c2740', sill: '#1c2740', winCool: '#cfe8ff'
  }
};

/* ================= save ================= */
var SAVE_KEY = 'skylinestack.v1';
function defaultSave() {
  return { best: 0, bestByTheme: {}, stars: 0, themes: ['neon'], theme: 'neon',
           tutorialSeen: false, muted: false, runs: 0 };
}
function loadSave() {
  try {
    var s = window.localStorage.getItem(SAVE_KEY);
    if (!s) return defaultSave();
    var d = JSON.parse(s), base = defaultSave();
    for (var k in base) if (d[k] === undefined) d[k] = base[k];
    return d;
  } catch (e) { return defaultSave(); }
}
function storeSave() {
  try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) {}
}

/* ================= dom ================= */
function $(id) { return document.getElementById(id); }
var canvas, ctx;
var el = {}; // filled in boot

/* ================= view ================= */
var view = { cssW: 0, cssH: 0, s: 1, H: 760, dpr: 1 };

/* ================= game state ================= */
var G = null;
function newState() {
  return {
    state: 'boot', theme: 'neon',
    time: 0, timeScale: 1, slowmoT: 0, trauma: 0,
    height: 0, combo: 0, bestCombo: 0,
    floors: [],           // {w,x,seed,tenant,deco,growFrom,growT,litP}
    camY: 0,
    sway: 0, swayV: 0,
    crane: { phase: rand(0, 6.28), x: W / 2, px: W / 2, vx: 0, theta: 0, thetaV: 0, lastDir: 1 },
    block: null,          // {x,y,vx,vy,w,st, snapT, snapFrom}
    parts: [], texts: [], debris: [],
    wind: { next: 6, tele: 0, gust: 0, gustDur: 0, str: 0, dir: 1, teleToastDone: false },
    tut: { active: false, drops: 0 },
    save: loadSave(),
    fps: 60, frameOps: 0, degraded: false, slowFrames: 0,
    errors: [],
    menuTower: [], menuPhase: 0,
    over: null,           // game-over info
    pausedFrom: null
  };
}
/* world helpers (depend on G.camY) */
function anchorY() { return view.H * 0.60; }
function sy(wy) { return wy - G.camY + anchorY(); }        // world y -> logical screen y
function swayOff(h) { return G.sway * Math.min(h, 1100); } // horizontal lean at height h
function towerTopY() { return -G.height * FH; }

/* ================= prerender caches ================= */
var cache = { sky: null, layers: [], clouds: [], silh: null, stars: [] };
function mkCanvas(w, h) {
  var c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}
function art() { return THEME_ART[G.theme]; }

function prerender() {
  var a = art(), H = Math.ceil(view.H);
  /* --- sky --- */
  var sky = mkCanvas(W, H), c = sky.getContext('2d');
  var gr = c.createLinearGradient(0, 0, 0, H);
  var stops = a.sky;
  for (var i = 0; i < stops.length; i++) gr.addColorStop(i / (stops.length - 1), stops[i]);
  c.fillStyle = gr; c.fillRect(0, 0, W, H);
  if (a.sun) {
    var sx = a.sun.x * W, syy = a.sun.y * H;
    var rg = c.createRadialGradient(sx, syy, 4, sx, syy, a.sun.r);
    rg.addColorStop(0, a.sun.c); rg.addColorStop(1, 'rgba(255,180,80,0)');
    c.globalAlpha = a.sun.a; c.fillStyle = rg;
    c.fillRect(sx - a.sun.r, syy - a.sun.r, a.sun.r * 2, a.sun.r * 2);
    c.globalAlpha = 1;
  }
  if (a.moon) {
    var mx = a.moon.x * W, my = a.moon.y * H;
    var mg = c.createRadialGradient(mx, my, 4, mx, my, a.moon.r * 2.4);
    mg.addColorStop(0, a.moon.c); mg.addColorStop(1, 'rgba(232,242,255,0)');
    c.globalAlpha = a.moon.a; c.fillStyle = mg;
    c.fillRect(mx - a.moon.r * 2.4, my - a.moon.r * 2.4, a.moon.r * 4.8, a.moon.r * 4.8);
    c.globalAlpha = 1;
    c.fillStyle = a.moon.c; c.beginPath(); c.arc(mx, my, a.moon.r * 0.55, 0, 6.29); c.fill();
  }
  /* stars (upper 45%) */
  cache.stars = [];
  var n = Math.round(70 * a.stars);
  for (var s = 0; s < n; s++) {
    var st = { x: Math.random() * W, y: Math.random() * H * 0.45, r: rand(0.5, 1.6), p: rand(0, 6.28) };
    cache.stars.push(st);
    c.fillStyle = 'rgba(255,255,255,' + rand(0.25, 0.8).toFixed(2) + ')';
    c.beginPath(); c.arc(st.x, st.y, st.r, 0, 6.29); c.fill();
  }
  cache.sky = sky;
  /* --- skyline / dune layers --- */
  cache.layers = [];
  var cols = [a.far, a.mid, a.near];
  for (var li = 0; li < 3; li++) {
    var lw = W * 2, lh = 150 + li * 40;
    var lc = mkCanvas(lw, lh), x2 = lc.getContext('2d');
    x2.fillStyle = cols[li];
    if (a.dunes) {
      x2.beginPath(); x2.moveTo(0, lh);
      for (var dx = 0; dx <= lw; dx += 8) {
        var dy = lh - (26 + li * 22) - Math.sin(dx * 0.008 + li * 2.1) * (10 + li * 7) - Math.sin(dx * 0.02 + li) * 5;
        x2.lineTo(dx, dy);
      }
      x2.lineTo(lw, lh); x2.closePath(); x2.fill();
      if (li === 0) { // distant dome + minaret silhouette
        x2.beginPath(); x2.arc(lw * 0.68, lh - 30, 26, Math.PI, 0); x2.fill();
        x2.fillRect(lw * 0.68 - 3, lh - 90, 6, 62);
        x2.beginPath(); x2.arc(lw * 0.68, lh - 92, 7, 0, 6.29); x2.fill();
      }
      if (li === 2) { // palm clusters
        for (var p = 0; p < 7; p++) {
          var px = (p * 173 + 40) % lw, py = lh - 24;
          x2.fillRect(px - 2, py - 26, 4, 28);
          for (var fr = 0; fr < 5; fr++) {
            var fa = -Math.PI * 0.85 + fr * Math.PI / 5;
            x2.beginPath(); x2.moveTo(px, py - 26);
            x2.quadraticCurveTo(px + Math.cos(fa) * 14, py - 30 + Math.sin(fa) * 10, px + Math.cos(fa) * 20, py - 22 + Math.sin(fa) * 12);
            x2.lineWidth = 3; x2.strokeStyle = cols[li]; x2.stroke();
          }
        }
      }
    } else {
      var bx = 0;
      var seed = li * 131 + 7;
      function srnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      while (bx < lw) {
        var bw = 26 + srnd() * 46, bh = 40 + srnd() * (70 + li * 36);
        x2.fillRect(bx, lh - bh, bw, bh);
        if (srnd() < 0.5) x2.fillRect(bx + bw * 0.3, lh - bh - 10, bw * 0.16, 10); // antenna nub
        // windows
        var lit = a.winLit;
        for (var wy = lh - bh + 6; wy < lh - 8; wy += 11) {
          for (var wx = bx + 4; wx < bx + bw - 4; wx += 9) {
            if (srnd() < a.winLitP) { x2.fillStyle = lit; x2.fillRect(wx, wy, 4, 5); x2.fillStyle = cols[li]; }
          }
        }
        if (a.beacon && srnd() < 0.3) { x2.fillStyle = '#ff4d5e'; x2.fillRect(bx + bw / 2 - 1, lh - bh - 13, 3, 3); x2.fillStyle = cols[li]; }
        bx += bw + srnd() * 14;
      }
    }
    cache.layers.push({ c: lc, w: lw, h: lh, par: [0.10, 0.22, 0.38][li] });
  }
  /* --- clouds --- */
  cache.clouds = [];
  for (var ci = 0; ci < 3; ci++) {
    var cc = mkCanvas(150, 60), cx = cc.getContext('2d');
    cx.fillStyle = a.cloud;
    for (var b = 0; b < 7; b++) {
      cx.globalAlpha = 0.5;
      cx.beginPath(); cx.arc(25 + b * 17 + rand(-6, 6), 34 + rand(-8, 8), rand(12, 22), 0, 6.29); cx.fill();
    }
    cache.clouds.push(cc);
  }
  /* --- tower silhouette strip (for old floors) --- */
  var sc = mkCanvas(60, 240), sx2 = sc.getContext('2d');
  sx2.fillStyle = 'rgba(16,12,34,0.88)'; sx2.fillRect(0, 0, 60, 240);
  sx2.fillStyle = 'rgba(255,202,122,0.5)';
  for (var qy = 8; qy < 240; qy += 22) for (var qx = 6; qx < 54; qx += 16) {
    if (Math.random() < 0.4) sx2.fillRect(qx, qy, 7, 9);
  }
  cache.silh = sc;
  initCloudField();
}

/* drifting cloud instances */
var cloudField = [];
function initCloudField() {
  cloudField = [];
  for (var i = 0; i < 6; i++) {
    cloudField.push({ x: rand(0, W), y: rand(0.04, 0.5), sp: rand(0.004, 0.014), img: randi(0, 2), sc: rand(0.7, 1.5), a: rand(0.25, 0.5) });
  }
}
var birdFlocks = [];
function maybeSpawnBirds(dt) {
  if (Math.random() < dt / 22 && birdFlocks.length < 2) {
    var dir = Math.random() < 0.5 ? 1 : -1;
    var flock = { x: dir > 0 ? -40 : W + 40, y: rand(0.08, 0.3), dir: dir, t: 0, n: randi(3, 6) };
    birdFlocks.push(flock);
  }
}

/* ================= tenant stories ================= */
var STORIES = [
  { id: 'cat',       kicker: 'the cat claims the sunny window' },
  { id: 'reader',    kicker: 'quiet reading nights begin' },
  { id: 'party',     kicker: 'housewarming party!' },
  { id: 'plants',    kicker: 'a jungle grows indoors' },
  { id: 'stargazer', kicker: 'stargazing nights begin' },
  { id: 'chef',      kicker: 'dinner smells amazing up here' }
];
var FAMILIES = ['the Ahmeds', 'the Patels', 'the Khans', 'the Sharmas', 'the Alis', "the D'Souzas",
  'the Rahmans', 'the Iyers', 'the Balochs', 'the Siddiquis', 'the Farooquis', 'the Menons'];
var recentStories = [];
function pickStory() {
  var pool = STORIES.filter(function (s) { return recentStories.indexOf(s.id) < 0; });
  if (!pool.length) { recentStories = []; pool = STORIES.slice(); }
  var st = pick(pool);
  recentStories.push(st.id);
  if (recentStories.length > 3) recentStories.shift();
  return st;
}

/* ================= run control ================= */
function applyTheme(id) {
  G.theme = id;
  G.save.theme = id;
  storeSave();
  prerender();
  refreshThemeCards();
}
function startRun() {
  G.height = 0; G.combo = 0; G.bestCombo = 0;
  G.floors = []; G.parts = []; G.texts = []; G.debris = [];
  G.sway = 0; G.swayV = 0; G.trauma = 0; G.timeScale = 1; G.slowmoT = 0;
  G.wind = { next: rand(5, 8), tele: 0, gust: 0, gustDur: 0, str: 0, dir: 1, teleToastDone: false };
  G.over = null;
  var cw = L.BASE_W;
  G.floors.push({ w: cw, x: 0, seed: Math.random() * 10, tenant: null, deco: null, growFrom: cw, growT: 1, litP: 0.25 });
  G.camY = towerTopY();
  G.crane.phase = rand(0, 6.28); G.crane.theta = 0; G.crane.thetaV = 0;
  G.tut.active = !G.save.tutorialSeen;
  G.tut.drops = 0;
  spawnBlock();
  setState('playing');
  Audio.ensure(); Audio.startMusic(); Audio.setWind(0);
  G.save.runs++; storeSave();
  if (G.tut.active) showHint('Tap when the block lines up with the tower!');
  else showHint('Tap anywhere to drop the floor!', 2.2);
  updateHud(true);
}
function endRunMissed(b) {
  // block tumbles away; run ends after the fall
  G.block = { x: b.x, y: b.y, vx: clamp((b.x - 210) * 1.2, -160, 160), vy: -120, w: b.w, st: 'tumble', rot: 0, vr: rand(-4, 4), t: 0 };
  G.over = { t: 0, pending: true };
  G.combo = 0;
  Audio.crash();
  G.trauma = Math.min(1, G.trauma + 0.7);
  slowmo(0.35, 0.7);
}
function finishGameOver() {
  var h = G.height, s = G.save, newBest = false, newThemes = [];
  if (h > s.best) { s.best = h; newBest = true; }
  var tb = s.bestByTheme[G.theme] || 0;
  if (h > tb) s.bestByTheme[G.theme] = h;
  var st = L.starFor(h);
  if (st > s.stars) s.stars = st;
  L.unlockedThemes(s.best).forEach(function (id) {
    if (s.themes.indexOf(id) < 0) { s.themes.push(id); newThemes.push(id); }
  });
  storeSave();
  G.over = { height: h, best: s.best, newBest: newBest, stars: st, newThemes: newThemes,
             score: L.scoreFor(h, G.bestCombo), bestCombo: G.bestCombo };
  setState('gameover');
  Audio.stopMusic(); Audio.setWind(0);
  if (newBest) Audio.fanfare();
  fillGameOver();
  updateHud(true);
}

/* ================= crane + block ================= */
function craneTargets() {
  var amp = L.carriageAmp(G.height), sp = L.craneSpeed(G.height);
  return { amp: amp, sp: sp };
}
function spawnBlock() {
  var top = G.floors[G.floors.length - 1];
  var t = craneTargets();
  // start the carriage phase where the block is near an edge, so the player waits a beat
  G.block = { x: 0, y: 0, vx: 0, vy: 0, w: top.w, st: 'swing', px: 0 };
  positionBlock(0);
}
function positionBlock(dt) {
  var cr = G.crane, t = craneTargets();
  var prevX = cr.x;
  cr.phase += t.sp * dt;
  cr.x = W / 2 + t.amp * Math.sin(cr.phase);
  cr.vx = dt > 0 ? (cr.x - prevX) / dt : 0;
  var dir = Math.cos(cr.phase) >= 0 ? 1 : -1;
  if (dir !== cr.lastDir) { cr.lastDir = dir; if (G.state === 'playing' && dt > 0) Audio.tick(); }
  // pendulum cable: driven by carriage accel + wind
  var acc = dt > 0 ? (cr.vx - cr.pvx || 0) / dt : 0;
  cr.pvx = cr.vx;
  var windPush = G.wind.gust > 0 ? G.wind.dir * G.wind.str * 1.5 : 0;
  var thAcc = -(6.0) * Math.sin(cr.theta) - 0.9 * cr.thetaV - acc * 0.0011 + windPush;
  cr.thetaV += thAcc * dt;
  cr.theta = clamp(cr.theta + cr.thetaV * dt, -0.55, 0.55);
  var bx = cr.x + CABLE_L * Math.sin(cr.theta);
  var by = RAIL_Y + 30 + CABLE_L * Math.cos(cr.theta);
  var b = G.block;
  b.px = b.x;
  b.x = bx; b.y = by;
  b.vx = dt > 0 ? (b.x - b.px) / dt : 0;
}
function dropBlock() {
  var b = G.block;
  if (!b || b.st !== 'swing') return;
  b.st = 'fall'; b.vy = 0;
  b.vx = b.vx * 0.35; // keep a hint of cable momentum, stay predictable
  hideHint();
}
function prevCenterWorld() {
  var top = G.floors[G.floors.length - 1];
  return W / 2 + top.x + swayOff(G.height * FH);
}
function resolveLanding() {
  var b = G.block, top = G.floors[G.floors.length - 1];
  var prevC = prevCenterWorld();
  var r = L.resolveDrop(b.x - prevC, b.w, 0, top.w);
  var landY = towerTopY();
  if (r.type === 'perfect') onPerfect(r, landY);
  else if (r.type === 'saved') onSaved(r, landY);
  else if (r.type === 'shear') onShear(r, landY, prevC);
  else onMissed(b);
}
function growFloor(top, newW) {
  top.growFrom = top.w; top.w = newW; top.growT = 0;
}
function onPerfect(r, landY) {
  var top = G.floors[G.floors.length - 1];
  G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
  var nx = { w: r.newW, x: top.x + r.newX, seed: Math.random() * 10, tenant: null, deco: null, growFrom: top.w, growT: 0, litP: 0.25 };
  growFloor(nx, r.newW); // animate width from old to new
  G.floors.push(nx); G.height++;
  var cx = W / 2 + nx.x + swayOff(G.height * FH);
  bloom(cx, landY - FH / 2, art().trim);
  dust(cx, landY, 6);
  addText(cx, landY - FH - 26, G.combo > 1 ? 'PERFECT ×' + G.combo : 'PERFECT', art().trim, 20);
  Audio.chime(G.combo);
  G.trauma = Math.min(1, G.trauma + 0.22);
  afterFloorPlaced(nx);
  spawnBlock();
}
function onSaved(r, landY) {
  // magnet snap: animate the block sliding into place during slow-mo
  var b = G.block;
  var top = G.floors[G.floors.length - 1];
  var targetX = prevCenterWorld();
  b.st = 'snap'; b.snapT = 0; b.snapFrom = b.x; b.snapTo = targetX; b.landY = landY;
  slowmo(0.25, 0.55);
  Audio.savedWhoosh();
  magnetStreaks(targetX, landY - FH / 2);
  addText(targetX, landY - FH - 30, 'SAVED!', '#ffffff', 30);
  G._pendingSaved = { top: top, r: r, landY: landY };
}
function finishSaved() {
  var p = G._pendingSaved; G._pendingSaved = null;
  var top = p.top, r = p.r, landY = p.landY;
  var nx = { w: r.newW, x: top.x + r.newX, seed: Math.random() * 10, tenant: null, deco: null, growFrom: r.newW, growT: 1, litP: 0.25 };
  G.floors.push(nx); G.height++;
  dust(W / 2 + nx.x + swayOff(G.height * FH), landY, 8);
  Audio.thud(0.8);
  afterFloorPlaced(nx);
  spawnBlock();
}
function onShear(r, landY, prevC) {
  var b = G.block, top = G.floors[G.floors.length - 1];
  var nx = { w: r.newW, x: top.x + r.newX, seed: Math.random() * 10, tenant: null, deco: null, growFrom: top.w, growT: 0, litP: 0.25 };
  growFloor(nx, r.newW);
  G.floors.push(nx); G.height++;
  G.combo = 0;
  var cx = W / 2 + nx.x + swayOff(G.height * FH);
  if (r.debris) {
    G.debris.push({ x: prevC + r.debris.x, y: landY - FH / 2, w: r.debris.w, vx: (r.dx > 0 ? 1 : -1) * rand(60, 130), vy: -60, rot: 0, vr: rand(-5, 5), t: 0 });
  }
  dust(cx, landY, 10);
  addText(cx, landY - FH - 24, 'CLOSE!', '#ffb347', 17);
  Audio.shearCrack(); Audio.thud(0.9);
  G.trauma = Math.min(1, G.trauma + 0.35);
  afterFloorPlaced(nx);
  spawnBlock();
}
function onMissed(b) {
  endRunMissed(b);
}
function afterFloorPlaced(nx) {
  var h = G.height;
  // tenant event every 5 floors
  if (h % 5 === 0 && h >= 5) {
    var story = pickStory();
    nx.tenant = { story: story.id, kicker: story.kicker, family: pick(FAMILIES), t: 0 };
    nx.litP = 0.85;
    showToast('Floor ' + h + ' · ' + nx.tenant.family + ' moved in — ' + story.kicker + '!');
    if (story.id === 'party') { Audio.giggle(); confetti(W / 2 + nx.x, -h * FH - 40); }
  }
  // rooftop milestones (permanent, on the earning floor)
  if (h === 25) { nx.deco = 'garden'; showBanner('ROOFTOP GARDEN', 'Floor 25 — the tower grows green!'); Audio.fanfare(); }
  if (h === 50) { nx.deco = 'pool'; showBanner('SKY POOL', 'Floor 50 — swim above the clouds!'); Audio.fanfare(); }
  if (h === 100) { nx.deco = 'antenna'; showBanner('THE ANTENNA', 'Floor 100 — touching the sky!'); Audio.fanfare(); }
  // stars
  var st = L.starFor(h);
  if (st > 0 && L.STAR_STEPS[st - 1] === h) {
    showBanner('★ STAR ' + st + ' OF 5', h + ' floors — keep building!');
    Audio.fanfare();
  }
  // theme unlocks
  L.THEMES.forEach(function (t) {
    if (t.unlockAt === h && G.save.themes.indexOf(t.id) < 0) {
      G.save.themes.push(t.id); storeSave();
      showBanner('NEW THEME UNLOCKED', t.name + ' — change it from the menu!');
      Audio.fanfare(); refreshThemeCards();
    }
  });
  // tutorial progress
  if (G.tut.active) {
    G.tut.drops++;
    if (G.tut.drops >= 5) {
      G.tut.active = false; G.save.tutorialSeen = true; storeSave();
      showToast("You're building! Reach for the sky.");
    } else {
      showHint('Tap when the block lines up with the tower!');
    }
  }
  updateHud();
}
function slowmo(scale, dur) {
  G.timeScale = scale; G.slowmoT = dur;
}

/* ================= input ================= */
function onTap(px, py) {
  Audio.ensure();
  if (G.state === 'playing') {
    if (G.block && G.block.st === 'swing') { Audio.uiTap(); dropBlock(); }
  }
}
function bindInput() {
  var wrap = $('stage');
  wrap.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button') || e.target.closest('.card')) return;
    var r = canvas.getBoundingClientRect();
    onTap(e.clientX - r.left, e.clientY - r.top);
  });
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (G.state === 'menu') startRun();
      else if (G.state === 'playing') onTap(0, 0);
      else if (G.state === 'gameover') startRun();
    } else if (e.code === 'KeyM') { toggleMute(); }
    else if (e.code === 'KeyP' || e.code === 'Escape') {
      if (G.state === 'playing') pauseGame(); else if (G.state === 'paused') resumeGame();
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && G.state === 'playing') pauseGame();
  });
  window.addEventListener('resize', resize);
  window.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}

/* ================= particles / floating texts ================= */
function addPart(p) {
  if (G.parts.length >= (G.degraded ? 130 : 260)) G.parts.shift();
  G.parts.push(p); G.frameOps++;
}
function bloom(x, y, color) {
  for (var i = 0; i < 16; i++) {
    var a = rand(0, 6.28), sp = rand(60, 260);
    addPart({ t: 'spark', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0, max: rand(0.4, 0.8), size: rand(2, 4.5), color: color });
  }
  addPart({ t: 'ring', x: x, y: y, vx: 0, vy: 0, life: 0, max: 0.45, size: 8, color: color });
  addPart({ t: 'flash', x: x, y: y, vx: 0, vy: 0, life: 0, max: 0.16, size: 70, color: color });
}
function dust(x, y, n) {
  for (var i = 0; i < n; i++) {
    addPart({ t: 'dust', x: x + rand(-30, 30), y: y + rand(-4, 4), vx: rand(-50, 50), vy: rand(-70, -10), life: 0, max: rand(0.4, 0.9), size: rand(3, 7), color: 'rgba(210,190,170,0.5)' });
  }
}
function confetti(x, y) {
  var cols = ['#ff4fd8', '#39f5d6', '#ffd97a', '#5ce1ff', '#ff8a4d'];
  for (var i = 0; i < 40; i++) {
    addPart({ t: 'conf', x: x + rand(-40, 40), y: y + rand(-20, 20), vx: rand(-90, 90), vy: rand(-160, -30), life: 0, max: rand(0.9, 1.6), size: rand(3, 6), color: pick(cols), rot: rand(0, 6.28), vr: rand(-8, 8) });
  }
}
function magnetStreaks(x, y) {
  for (var i = 0; i < 10; i++) {
    var a = rand(0, 6.28), d = rand(60, 110);
    addPart({ t: 'streak', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: 0, vy: 0, tx: x, ty: y, life: 0, max: 0.4, size: rand(2, 3.5), color: '#ffffff' });
  }
}
function addText(x, y, text, color, size) {
  if (G.texts.length >= 14) G.texts.shift();
  G.texts.push({ x: x, y: y, text: text, color: color, size: size, life: 0, max: 1.1 });
}

/* ================= update ================= */
function update(dt) {
  G.time += dt;
  var sdt = dt * G.timeScale; // scaled dt for world
  // slow-mo recovery (real time)
  if (G.slowmoT > 0) { G.slowmoT -= dt; if (G.slowmoT <= 0) G.timeScale = 1; }
  // fps ema
  G.fps = lerp(G.fps, 1 / Math.max(dt, 1e-4), 0.05);
  if (G.fps < 42) { G.slowFrames++; if (G.slowFrames > 120 && !G.degraded) { G.degraded = true; } }
  else G.slowFrames = Math.max(0, G.slowFrames - 2);
  // trauma decay
  G.trauma = Math.max(0, G.trauma - dt * 1.6);

  if (G.state === 'playing' || G.state === 'gameover') {
    updateWind(dt);
    updateSway(sdt);
    // floor grow animation
    for (var i = Math.max(0, G.floors.length - 3); i < G.floors.length; i++) {
      var f = G.floors[i];
      if (f.growT < 1) f.growT = Math.min(1, f.growT + dt * 4);
    }
    // tenant story clocks
    for (var j = 0; j < G.floors.length; j++) {
      var tn = G.floors[j].tenant;
      if (tn && tn.t < 7) tn.t += dt;
    }
  }
  if (G.state === 'playing') {
    var b = G.block;
    if (b && b.st === 'swing') positionBlock(sdt);
    else if (b && b.st === 'fall') {
      var wnd = G.wind.gust > 0 ? G.wind.dir * G.wind.str * 170 : 0;
      b.vx += wnd * sdt;
      b.vy += GRAV * sdt;
      b.x += b.vx * sdt; b.y += b.vy * sdt;
      if (b.y + FH / 2 >= towerTopY()) { b.y = towerTopY() - FH / 2; resolveLanding(); }
      else if (b.y > G.camY + (view.H - anchorY()) + 100) { onMissed(b); } // fell past screen (safety)
    }
    else if (b && b.st === 'snap') {
      b.snapT += dt / 0.38; // snap runs on real time (slow-mo makes it readable)
      var k = easeOutBack(clamp(b.snapT, 0, 1));
      b.x = lerp(b.snapFrom, b.snapTo, k);
      b.y = b.landY - FH / 2;
      if (b.snapT >= 1) finishSaved();
    }
    // camera follows tower top
    var target = towerTopY();
    G.camY += (target - G.camY) * Math.min(1, 5 * dt);
  }
  if (G.state === 'menu') {
    G.menuPhase += dt * 0.5;
    var t2 = craneTargetsMenu();
    G.crane.phase += t2.sp * dt;
    G.crane.x = W / 2 + t2.amp * Math.sin(G.crane.phase);
    G.camY += ((-13 * FH) - G.camY) * Math.min(1, 2 * dt);
  }
  // tumbling miss block / debris physics
  if (G.block && G.block.st === 'tumble') {
    var tb = G.block; tb.t += dt;
    tb.vy += GRAV * 0.7 * dt; tb.x += tb.vx * dt; tb.y += tb.vy * dt; tb.rot += tb.vr * dt;
    if (G.over && G.over.pending && tb.t > 1.1) { G.over.pending = false; finishGameOver(); }
  }
  for (var d = G.debris.length - 1; d >= 0; d--) {
    var db = G.debris[d]; db.t += sdt;
    db.vy += GRAV * 0.8 * sdt; db.x += db.vx * sdt; db.y += db.vy * sdt; db.rot += db.vr * sdt;
    if (db.t > 2.2) G.debris.splice(d, 1);
  }
  // particles
  for (var p = G.parts.length - 1; p >= 0; p--) {
    var pt = G.parts[p]; pt.life += sdt;
    if (pt.life >= pt.max) { G.parts.splice(p, 1); continue; }
    if (pt.t === 'streak') {
      var kk = 1 - Math.pow(1 - clamp(pt.life / pt.max, 0, 1), 2);
      pt.x = lerp(pt.x, pt.tx, kk * 0.4); pt.y = lerp(pt.y, pt.ty, kk * 0.4);
    } else {
      pt.vy += (pt.t === 'conf' ? 500 : 160) * sdt * (pt.t === 'spark' ? 0.4 : 1);
      pt.x += pt.vx * sdt; pt.y += pt.vy * sdt;
      if (pt.vr) pt.rot += pt.vr * sdt;
    }
  }
  for (var q = G.texts.length - 1; q >= 0; q--) {
    var tx = G.texts[q]; tx.life += dt; tx.y -= 34 * dt;
    if (tx.life >= tx.max) G.texts.splice(q, 1);
  }
  // ambient
  for (var ci = 0; ci < cloudField.length; ci++) {
    var cl = cloudField[ci];
    cl.x += cl.sp * sdt * (1 + G.wind.str * 6);
    if (cl.x > W + 90) cl.x = -90;
  }
  maybeSpawnBirds(sdt);
  for (var bi = birdFlocks.length - 1; bi >= 0; bi--) {
    var fl = birdFlocks[bi]; fl.t += sdt; fl.x += fl.dir * 46 * sdt;
    if (fl.x < -80 || fl.x > W + 80) birdFlocks.splice(bi, 1);
  }
  // wind audio bed follows
  if (Audio.ctx) Audio.setWind(G.wind.gust > 0 ? G.wind.str : (G.wind.tele > 0 ? 0.15 : 0));
}
function craneTargetsMenu() { return { amp: 120, sp: 1.4 }; }

function updateWind(dt) {
  var w = G.wind, h = G.height;
  var maxStr = L.windStrengthAt(h);
  if (maxStr <= 0) { w.str = 0; w.gust = 0; w.tele = 0; return; }
  if (w.gust > 0) {
    w.gust -= dt;
    if (w.gust <= 0) { w.next = rand(8, 14); w.teleToastDone = false; }
  } else if (w.tele > 0) {
    w.tele -= dt;
    if (w.tele <= 0) {
      w.gust = w.gustDur = rand(2.5, 4);
      w.str = maxStr * rand(0.6, 1);
      w.dir = Math.random() < 0.5 ? -1 : 1;
    }
  } else {
    w.next -= dt;
    if (w.next <= 0) {
      w.tele = 1.6; w.teleToastDone = false;
    }
  }
  // telegraph toast once
  if (w.tele > 0 && !w.teleToastDone) {
    w.teleToastDone = true;
    showToast('Gust incoming — hold steady…');
    Audio.noise(0.5, 'bandpass', 500, 1, 0.2, 1600);
  }
}
function updateSway(sdt) {
  var w = G.wind;
  var target = 0;
  if (w.gust > 0) target = w.dir * w.str * 0.045;
  target += Math.sin(G.time * 0.7) * 0.004; // idle breathing
  var k = 9, c = 3.4;
  G.swayV += ((target - G.sway) * k - G.swayV * c) * sdt;
  G.sway = clamp(G.sway + G.swayV * sdt, -0.06, 0.06);
}

/* ================= render ================= */
function render() {
  G.frameOps = 0;
  var s = view.s, dpr = view.dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawSkyScreen();
  drawSkyline();
  drawClouds();
  drawBirds();
  if (G.theme === 'monsoon') drawRain();
  if (G.theme === 'desert') drawHeatShimmer();
  // world pass (camera + shake)
  var shx = 0, shy = 0;
  if (G.trauma > 0) {
    var tr = G.trauma * G.trauma;
    shx = tr * 10 * (Math.sin(G.time * 91) * 0.6 + Math.sin(G.time * 47) * 0.4);
    shy = tr * 8 * (Math.cos(G.time * 83) * 0.6 + Math.cos(G.time * 59) * 0.4);
  }
  ctx.setTransform(dpr * s, 0, 0, dpr * s, shx * dpr * s, shy * dpr * s);
  drawGround();
  drawTower();
  drawDebris();
  drawParts();
  drawCraneAndBlock();
  drawTexts();
  drawComboBadge();
  if (G.tut.active && G.state === 'playing') drawTutRing();
  if (G.theme === 'monsoon' && Math.random() < 0.001) lightningFlash();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // back to css px (DOM handles the rest)
}
function drawSkyScreen() {
  var cw = view.cssW, ch = view.cssH;
  var sk = cache.sky;
  ctx.drawImage(sk, 0, 0, sk.width, sk.height, 0, 0, cw, ch);
  G.frameOps++;
}
function drawSkyline() {
  var cw = view.cssW, ch = view.cssH, s = view.s;
  for (var i = 0; i < cache.layers.length; i++) {
    var Lr = cache.layers[i];
    var lh = Lr.h * s * 0.9;
    var yBase = ch - lh + 40 * s - G.camY * Lr.par * s * 0.35;
    var xoff = -((G.time * 2 * Lr.par) % (Lr.w));
    var dw = Lr.w * s * 0.9;
    ctx.drawImage(Lr.c, xoff * s * 0.9, yBase, dw, lh);
    ctx.drawImage(Lr.c, xoff * s * 0.9 + dw, yBase, dw, lh);
    G.frameOps += 2;
  }
}
function drawClouds() {
  var s = view.s;
  for (var i = 0; i < cloudField.length; i++) {
    var cl = cloudField[i], img = cache.clouds[cl.img];
    var y = cl.y * view.cssH - G.camY * 0.05 * s;
    ctx.globalAlpha = cl.a * art().cloudA * 2;
    var w = 150 * cl.sc * s, h = 60 * cl.sc * s;
    ctx.drawImage(img, cl.x * s - w / 2, y - h / 2, w, h);
    G.frameOps++;
  }
  ctx.globalAlpha = 1;
}
function drawBirds() {
  ctx.strokeStyle = 'rgba(20,12,36,0.8)'; ctx.lineWidth = 2;
  for (var i = 0; i < birdFlocks.length; i++) {
    var fl = birdFlocks[i], flap = Math.sin(fl.t * 10) * 4;
    for (var b = 0; b < fl.n; b++) {
      var bx = (fl.x + b * 22 * fl.dir) * view.s, by = (fl.y * view.cssH + Math.sin(b * 1.7) * 10 - G.camY * 0.05 * view.s);
      ctx.beginPath();
      ctx.moveTo(bx - 7, by); ctx.quadraticCurveTo(bx - 2, by - 4 - flap, bx, by);
      ctx.quadraticCurveTo(bx + 2, by - 4 - flap, bx + 7, by);
      ctx.stroke(); G.frameOps++;
    }
  }
}
function drawRain() {
  var s = view.s, cw = view.cssW, ch = view.cssH;
  ctx.strokeStyle = 'rgba(180,220,255,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath();
  var slant = (G.wind.gust > 0 ? G.wind.dir * G.wind.str * 30 : 6);
  for (var i = 0; i < 120; i++) {
    var rx = ((i * 97.3 + G.time * 700) % (cw + 40)) - 20;
    var ry = ((i * 57.7 + G.time * 1100) % (ch + 40)) - 20;
    ctx.moveTo(rx, ry); ctx.lineTo(rx - slant * 0.4, ry + 14);
  }
  ctx.stroke(); G.frameOps++;
}
function drawHeatShimmer() {
  var s = view.s;
  ctx.fillStyle = 'rgba(255,200,140,0.05)';
  for (var i = 0; i < 8; i++) {
    var x = ((i * 53 + G.time * 24) % (W + 40)) - 20;
    var y = view.H * (0.72 + 0.03 * Math.sin(G.time * 2 + i));
    ctx.fillRect(x, y, 3, 26);
  }
}
var flashT = 0;
function lightningFlash() { flashT = 0.12; Audio.thunder(); }
function drawGround() {
  var gy = sy(0), a = art();
  if (gy < -100 || gy > view.H + 100) return;
  var g = ctx.createLinearGradient(0, gy - 60, 0, gy + 120);
  g.addColorStop(0, a.near); g.addColorStop(1, '#0d0a20');
  ctx.fillStyle = g;
  ctx.fillRect(0, gy - 4, W, view.H - gy + 104);
  // street glow dots
  ctx.fillStyle = a.winLit;
  for (var i = 0; i < 24; i++) {
    var x = (i * 37 + 11) % W;
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(G.time * 2 + i);
    ctx.fillRect(x, gy + 18 + (i % 3) * 22, 3, 3);
  }
  ctx.globalAlpha = 1;
  // podium
  var pw = L.BASE_W + 56;
  ctx.fillStyle = 'rgba(10,8,24,0.9)';
  roundRect(W / 2 - pw / 2, gy - 34, pw, 34, 6); ctx.fill();
  ctx.fillStyle = a.trim; ctx.globalAlpha = 0.8;
  ctx.fillRect(W / 2 - pw / 2, gy - 36, pw, 3);
  ctx.globalAlpha = 1;
  // entrance glow
  var eg = ctx.createLinearGradient(0, gy - 24, 0, gy);
  eg.addColorStop(0, a.winWarm); eg.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = eg;
  ctx.fillRect(W / 2 - 16, gy - 26, 32, 26);
  G.frameOps += 4;
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function drawTower() {
  var n = G.floors.length, a = art();
  if (!n) return;
  var firstDetail = Math.max(0, n - DETAIL_FLOORS);
  // silhouette for old floors
  if (firstDetail > 0) {
    var topY = sy(-firstDetail * FH), botY = sy(0);
    var wAvg = 150;
    ctx.drawImage(cache.silh, W / 2 - wAvg / 2, topY, wAvg, botY - topY);
    G.frameOps++;
  }
  for (var i = firstDetail; i < n; i++) drawFloor(i, a);
}
function drawFloor(i, a) {
  var f = G.floors[i];
  var hgt = (i + 1) * FH;
  var cx = W / 2 + f.x + swayOff(hgt);
  var wdt = f.growT < 1 ? lerp(f.growFrom, f.w, easeOutCubic(f.growT)) : f.w;
  var yTop = sy(-hgt);
  if (yTop < -80 || yTop > view.H + 80) return;
  // body
  var g = ctx.createLinearGradient(0, yTop, 0, yTop + FH);
  g.addColorStop(0, a.floorTop); g.addColorStop(1, a.floorBot);
  ctx.fillStyle = g;
  ctx.fillRect(cx - wdt / 2, yTop, wdt, FH);
  if (G.theme === 'monsoon') { // wet sheen
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(cx - wdt / 2 + 12, yTop); ctx.lineTo(cx - wdt / 2 + 26, yTop);
    ctx.lineTo(cx - wdt / 2 + 10, yTop + FH); ctx.lineTo(cx - wdt / 2 - 4, yTop + FH);
    ctx.closePath(); ctx.fill();
  }
  // neon trim: halo + core on top edge, faint sides
  ctx.fillStyle = a.trim2; ctx.globalAlpha = 0.30;
  ctx.fillRect(cx - wdt / 2 - 2, yTop - 4, wdt + 4, 7);
  ctx.globalAlpha = 1; ctx.fillStyle = a.trim;
  ctx.fillRect(cx - wdt / 2, yTop - 2, wdt, 3);
  ctx.globalAlpha = 0.5;
  ctx.fillRect(cx - wdt / 2 - 1, yTop, 2, FH);
  ctx.fillRect(cx + wdt / 2 - 1, yTop, 2, FH);
  ctx.globalAlpha = 1;
  // windows
  drawWindows(cx, yTop, wdt, f, a, hgt);
  // rooftop deco
  if (f.deco) drawDeco(f.deco, cx, yTop, wdt, a);
  G.frameOps += 6;
}
function drawWindows(cx, yTop, wdt, f, a, hgt) {
  var cols = Math.max(2, Math.floor(wdt / 24));
  var ww = 10, wh = 8, gapX = (wdt - 16) / cols;
  for (var r = 0; r < 2; r++) {
    for (var cix = 0; cix < cols; cix++) {
      var wx = cx - wdt / 2 + 8 + cix * gapX + (gapX - ww) / 2;
      var wy = yTop + 5 + r * 11;
      var hsh = Math.sin(f.seed * 12.9 + cix * 78.2 + r * 39.4) * 43758.5;
      hsh = hsh - Math.floor(hsh);
      var lit = hsh < f.litP;
      if (f.tenant && f.tenant.t < 7 && cix === Math.floor(cols / 2) && r === 0) lit = true;
      if (lit) {
        var fl = 0.9 + 0.1 * Math.sin(G.time * 3 + f.seed + cix);
        var wg = ctx.createLinearGradient(0, wy, 0, wy + wh);
        var cool = a.winCool && hsh > f.litP * 0.6;
        var wc = cool ? a.winCool : a.winWarm;
        wg.addColorStop(0, wc); wg.addColorStop(1, 'rgba(120,70,30,0.9)');
        ctx.globalAlpha = fl;
        ctx.fillStyle = wg;
        ctx.fillRect(wx, wy, ww, wh);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = a.winDark;
        ctx.fillRect(wx, wy, ww, wh);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(wx, wy, ww, 2);
      }
      // tenant story silhouette in the middle window
      if (f.tenant && cix === Math.floor(cols / 2) && r === 0 && lit) {
        drawStory(f.tenant, wx, wy, ww, wh);
      }
    }
  }
  G.frameOps += 2;
}
function drawStory(tn, wx, wy, ww, wh) {
  ctx.fillStyle = '#141021';
  var t = tn.t, id = tn.story;
  if (id === 'cat') {
    var px = wx + (t < 7 ? (t / 7) * (ww + 8) - 4 : ww / 2);
    ctx.beginPath(); ctx.ellipse(px, wy + wh - 2, 4, 2.6, 0, 0, 6.29); ctx.fill(); // body
    ctx.beginPath(); ctx.arc(px + 4, wy + wh - 5, 2, 0, 6.29); ctx.fill();          // head
    ctx.beginPath(); // tail
    ctx.moveTo(px - 4, wy + wh - 3);
    ctx.quadraticCurveTo(px - 8, wy + wh - 8, px - 6 + Math.sin(G.time * 6) * 2, wy + wh - 10);
    ctx.lineWidth = 1.6; ctx.strokeStyle = '#141021'; ctx.stroke();
  } else if (id === 'reader') {
    var rock = Math.sin(t * 2.2) * 2;
    ctx.fillRect(wx + 2, wy + wh - 5 + rock * 0.3, 6, 4);                    // chair
    ctx.beginPath(); ctx.arc(wx + 5, wy + 2 + rock * 0.3, 2, 0, 6.29); ctx.fill(); // head
    ctx.fillStyle = '#ffca7a'; ctx.globalAlpha = 0.85;
    ctx.fillRect(wx + ww - 3, wy + 1, 2, 5); ctx.globalAlpha = 1; ctx.fillStyle = '#141021'; // lamp
  } else if (id === 'party') {
    for (var i = 0; i < 3; i++) {
      ctx.fillStyle = 'hsl(' + ((G.time * 160 + i * 120) % 360) + ',90%,60%)';
      var bx = wx + 1 + i * 3, byy = wy + wh - 2 - Math.abs(Math.sin(G.time * 6 + i * 2)) * 5;
      ctx.beginPath(); ctx.arc(bx, byy, 1.6, 0, 6.29); ctx.fill();
    }
    ctx.fillStyle = '#141021';
  } else if (id === 'plants') {
    for (var p = 0; p < 3; p++) {
      var hx = wx + 2 + p * 3, sway = Math.sin(G.time * 2 + p) * 1.5;
      ctx.fillRect(hx - 1, wy + 1, 2, 2);
      ctx.beginPath(); ctx.moveTo(hx, wy + 3); ctx.quadraticCurveTo(hx + sway, wy + 6, hx + sway * 1.4, wy + 8);
      ctx.lineWidth = 1.4; ctx.strokeStyle = '#141021'; ctx.stroke();
    }
  } else if (id === 'stargazer') {
    ctx.save(); ctx.translate(wx + ww / 2, wy + wh - 1); ctx.rotate(-0.6);
    ctx.fillRect(-1, -7, 2, 7); ctx.restore();
    ctx.fillRect(wx + ww / 2 - 3, wy + wh - 3, 6, 2); // tripod base
    var tw = 0.5 + 0.5 * Math.sin(G.time * 5);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + tw * 0.6) + ')';
    ctx.fillRect(wx + ww - 3, wy + 1, 2, 2); ctx.fillStyle = '#141021';
  } else if (id === 'chef') {
    ctx.fillRect(wx + 2, wy + wh - 4, 6, 3); // pot
    ctx.strokeStyle = 'rgba(20,16,33,0.8)'; ctx.lineWidth = 1.2;
    for (var s2 = 0; s2 < 3; s2++) {
      var st2 = (G.time * 1.4 + s2 * 0.33) % 1;
      ctx.beginPath();
      ctx.moveTo(wx + 3 + s2 * 2, wy + wh - 4 - st2 * 6);
      ctx.quadraticCurveTo(wx + 4 + s2 * 2, wy + wh - 6 - st2 * 6, wx + 3 + s2 * 2, wy + wh - 8 - st2 * 6);
      ctx.stroke();
    }
    ctx.strokeStyle = '#141021';
  }
  G.frameOps += 3;
}
function drawDeco(kind, cx, yTop, wdt, a) {
  if (kind === 'garden') {
    for (var i = 0; i < 3; i++) {
      var px = cx - wdt / 2 + 14 + i * (wdt - 28) / 2;
      ctx.fillStyle = '#5a3a2a'; ctx.fillRect(px - 7, yTop - 12, 14, 10); // planter
      for (var lf = 0; lf < 5; lf++) {
        var la = -Math.PI / 2 + (lf - 2) * 0.35 + Math.sin(G.time * 2 + i + lf) * 0.12;
        ctx.strokeStyle = lf % 2 ? '#3fae5a' : '#57c96b'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(px, yTop - 12);
        ctx.lineTo(px + Math.cos(la) * 11, yTop - 12 + Math.sin(la) * 11); ctx.stroke();
      }
      ctx.fillStyle = '#ff8ab0';
      ctx.beginPath(); ctx.arc(px + 3, yTop - 20, 1.8, 0, 6.29); ctx.fill();
    }
  } else if (kind === 'pool') {
    var pw2 = Math.min(wdt - 30, 120);
    var pg = ctx.createLinearGradient(0, yTop - 16, 0, yTop - 2);
    pg.addColorStop(0, '#5ce1ff'); pg.addColorStop(1, '#1a7fd4');
    ctx.fillStyle = '#0e2a44'; ctx.fillRect(cx - pw2 / 2 - 3, yTop - 18, pw2 + 6, 16);
    ctx.fillStyle = pg; ctx.fillRect(cx - pw2 / 2, yTop - 16, pw2, 12);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.4;
    for (var wv = 0; wv < 2; wv++) {
      ctx.beginPath();
      for (var qx = 0; qx <= pw2; qx += 6) {
        var qy = yTop - 10 + Math.sin(G.time * 3 + qx * 0.2 + wv * 2) * 1.6;
        qx === 0 ? ctx.moveTo(cx - pw2 / 2 + qx, qy) : ctx.lineTo(cx - pw2 / 2 + qx, qy);
      }
      ctx.stroke();
    }
  } else if (kind === 'antenna') {
    ctx.fillStyle = '#1a1430';
    ctx.fillRect(cx - 3, yTop - 52, 6, 52);
    ctx.fillRect(cx - 14, yTop - 40, 28, 3);
    ctx.fillRect(cx - 9, yTop - 28, 18, 3);
    ctx.strokeStyle = 'rgba(20,16,40,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 3, yTop - 50); ctx.lineTo(cx - wdt / 2 + 6, yTop - 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 3, yTop - 50); ctx.lineTo(cx + wdt / 2 - 6, yTop - 2); ctx.stroke();
    var bl = 0.4 + 0.6 * Math.abs(Math.sin(G.time * Math.PI / 2));
    ctx.fillStyle = 'rgba(255,60,70,' + bl.toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(cx, yTop - 54, 4, 0, 6.29); ctx.fill();
    ctx.fillStyle = 'rgba(255,60,70,' + (bl * 0.25).toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(cx, yTop - 54, 9, 0, 6.29); ctx.fill();
  }
  G.frameOps += 8;
}

/* ---- crane, block, guide ---- */
function drawCraneAndBlock() {
  var a = art(), cr = G.crane;
  var showCrane = (G.state === 'playing' || G.state === 'paused' || G.state === 'gameover' || G.state === 'menu');
  if (!showCrane) return;
  // rail (always — it's scenery)
  ctx.fillStyle = '#141021';
  ctx.fillRect(0, RAIL_Y - 8, W, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, RAIL_Y - 8, W, 3);
  ctx.fillStyle = '#ffb347';
  for (var hx = 8; hx < W; hx += 26) { ctx.fillRect(hx, RAIL_Y - 8, 12, 14); ctx.fillStyle = '#141021'; ctx.fillRect(hx + 12, RAIL_Y - 8, 2, 14); ctx.fillStyle = '#ffb347'; }
  G.frameOps += 2;
  if (G.state === 'menu') return; // keep the menu title clean — no carriage/cable over it
  // carriage
  var tilt = clamp(cr.vx * 0.0004, -0.06, 0.06);
  ctx.save(); ctx.translate(cr.x, RAIL_Y); ctx.rotate(tilt);
  ctx.fillStyle = '#23203a';
  roundRect(-24, -6, 48, 22, 5); ctx.fill();
  ctx.fillStyle = '#2f2b4d';
  roundRect(-24, -6, 48, 8, 4); ctx.fill();
  ctx.fillStyle = '#0e0b1e';
  [-16, -5, 6, 17].forEach(function (wx) { ctx.beginPath(); ctx.arc(wx, -8, 4.5, 0, 6.29); ctx.fill(); });
  ctx.fillStyle = a.winWarm; ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.arc(0, 12, 3, 0, 6.29); ctx.fill(); ctx.globalAlpha = 1;
  ctx.restore();
  // cable + block
  var b = G.block;
  var hasBlock = b && (b.st === 'swing' || b.st === 'snap' || b.st === 'fall');
  var tipX = cr.x + CABLE_L * Math.sin(cr.theta), tipY = RAIL_Y + 30 + CABLE_L * Math.cos(cr.theta);
  ctx.strokeStyle = '#0e0b1e'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cr.x, RAIL_Y + 16);
  ctx.lineTo(hasBlock ? b.x : tipX, hasBlock ? b.y - FH / 2 : tipY); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cr.x + 1.5, RAIL_Y + 16);
  ctx.lineTo((hasBlock ? b.x : tipX) + 1.5, (hasBlock ? b.y - FH / 2 : tipY)); ctx.stroke();
  if (b && b.st === 'tumble') {
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
    drawMiniFloor(b.w, a); ctx.restore();
  } else if (hasBlock) {
    if (b.st === 'fall' || b.st === 'snap') drawDropGuide(b);
    drawMiniFloorAt(b.x, b.y, b.w, a);
  }
  G.frameOps += 10;
}
function drawMiniFloor(w, a) {
  var g = ctx.createLinearGradient(0, -FH / 2, 0, FH / 2);
  g.addColorStop(0, a.floorTop); g.addColorStop(1, a.floorBot);
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -FH / 2, w, FH);
  ctx.fillStyle = a.trim; ctx.fillRect(-w / 2, -FH / 2 - 2, w, 3);
  ctx.fillStyle = a.winDark;
  var cols = Math.max(2, Math.floor(w / 24));
  for (var i = 0; i < cols; i++) ctx.fillRect(-w / 2 + 8 + i * ((w - 16) / cols), -6, 10, 8);
}
function drawMiniFloorAt(x, y, w, a) { ctx.save(); ctx.translate(x, y); drawMiniFloor(w, a); ctx.restore(); }
function drawDropGuide(b) {
  var topY = towerTopY();
  var gy = sy(topY);
  if (gy < -40 || gy > view.H + 40) return;
  var a = art();
  ctx.strokeStyle = a.trim; ctx.globalAlpha = G.tut.active ? 0.85 : 0.4;
  ctx.lineWidth = G.tut.active ? 2.5 : 1.5;
  ctx.setLineDash([7, 7]);
  ctx.beginPath(); ctx.moveTo(b.x, b.y + FH / 2 + 4); ctx.lineTo(b.x, gy - 6); ctx.stroke();
  ctx.setLineDash([]);
  // landing brackets on the target floor
  var tc = prevCenterWorld(), tw = G.floors[G.floors.length - 1].w;
  ctx.lineWidth = 2.5;
  [[-1, -1], [1, -1]].forEach(function (s2) {
    var bx = tc + s2[0] * tw / 2;
    ctx.beginPath();
    ctx.moveTo(bx - s2[0] * 14, gy - 10); ctx.lineTo(bx, gy - 10); ctx.lineTo(bx, gy + 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  G.frameOps += 3;
}
function drawParts() {
  for (var i = 0; i < G.parts.length; i++) {
    var p = G.parts[i], k = p.life / p.max;
    if (p.t === 'spark') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, sy(p.y) - p.size / 2, p.size, p.size);
      ctx.globalCompositeOperation = 'source-over';
    } else if (p.t === 'ring') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.8 * (1 - k);
      ctx.strokeStyle = p.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, sy(p.y), p.size + k * 64, 0, 6.29); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else if (p.t === 'flash') {
      ctx.globalCompositeOperation = 'lighter';
      var fg = ctx.createRadialGradient(p.x, sy(p.y), 2, p.x, sy(p.y), p.size);
      fg.addColorStop(0, p.color); fg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 0.55 * (1 - k);
      ctx.fillStyle = fg;
      ctx.fillRect(p.x - p.size, sy(p.y) - p.size, p.size * 2, p.size * 2);
      ctx.globalCompositeOperation = 'source-over';
    } else if (p.t === 'dust') {
      ctx.globalAlpha = 0.5 * (1 - k);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, sy(p.y), p.size * (1 + k), 0, 6.29); ctx.fill();
    } else if (p.t === 'conf') {
      ctx.globalAlpha = 1 - k * 0.6;
      ctx.save(); ctx.translate(p.x, sy(p.y)); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    } else if (p.t === 'streak') {
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = p.color; ctx.lineWidth = p.size;
      ctx.beginPath(); ctx.moveTo(p.x, sy(p.y)); ctx.lineTo(p.tx, sy(p.ty)); ctx.stroke();
    }
    G.frameOps++;
  }
  ctx.globalAlpha = 1;
}
function drawDebris() {
  for (var i = 0; i < G.debris.length; i++) {
    var d = G.debris[i], a = art();
    ctx.save(); ctx.translate(d.x, sy(d.y)); ctx.rotate(d.rot);
    ctx.globalAlpha = clamp(1 - d.t / 2.2, 0, 1);
    drawMiniFloor(d.w, a);
    ctx.restore(); G.frameOps += 2;
  }
  ctx.globalAlpha = 1;
}
function drawTexts() {
  ctx.textAlign = 'center';
  for (var i = 0; i < G.texts.length; i++) {
    var t = G.texts[i], k = t.life / t.max;
    var pop = t.life < 0.18 ? easeOutBack(t.life / 0.18) : 1;
    ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
    ctx.font = '800 ' + Math.round(t.size * pop) + 'px "Avenir Next","Segoe UI",system-ui,sans-serif';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,8,24,0.85)';
    var yy = sy(t.y);
    ctx.strokeText(t.text, t.x, yy);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, yy);
    G.frameOps += 2;
  }
  ctx.globalAlpha = 1;
}
function drawComboBadge() {
  if (G.combo < 3 || G.state !== 'playing') return;
  var y = sy(towerTopY()) - 64, x = W - 74;
  var pulse = 1 + 0.06 * Math.sin(G.time * 8);
  ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse);
  ctx.fillStyle = 'rgba(10,8,24,0.72)';
  roundRect(-46, -17, 92, 34, 17); ctx.fill();
  ctx.strokeStyle = art().trim; ctx.lineWidth = 2;
  roundRect(-46, -17, 92, 34, 17); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
  ctx.font = '800 17px "Avenir Next","Segoe UI",system-ui,sans-serif';
  ctx.fillText('×' + G.combo + ' COMBO', 0, 6);
  ctx.restore(); G.frameOps += 3;
}
function drawTutRing() {
  var b = G.block;
  if (!b || b.st !== 'swing') return;
  var tc = prevCenterWorld();
  var lined = Math.abs(b.x - tc) < L.MAGNET_TOL;
  var pulse = 1 + 0.18 * Math.sin(G.time * 7);
  ctx.save();
  ctx.strokeStyle = lined ? '#39ff88' : 'rgba(255,255,255,0.9)';
  ctx.lineWidth = lined ? 4 : 2.5;
  ctx.globalAlpha = 0.65 + 0.35 * Math.sin(G.time * 7);
  ctx.beginPath(); ctx.arc(b.x, b.y, 30 * pulse, 0, 6.29); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = lined ? '#39ff88' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '800 15px "Avenir Next","Segoe UI",system-ui,sans-serif';
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,8,24,0.85)';
  var label = lined ? 'NOW!' : 'TAP WHEN LINED UP';
  ctx.strokeText(label, b.x, b.y - 42);
  ctx.fillText(label, b.x, b.y - 42);
  ctx.restore(); G.frameOps += 3;
}

/* ================= DOM: hud / toast / banner / hint ================= */
function showToast(text, dur) {
  var box = $('toasts');
  while (box.children.length >= 2) box.removeChild(box.firstChild);
  var d = document.createElement('div');
  d.className = 'toast'; d.textContent = text;
  box.appendChild(d);
  setTimeout(function () { d.classList.add('out'); setTimeout(function () { d.remove(); }, 400); }, dur || 2600);
}
var bannerTimer = null;
function showBanner(title, sub) {
  $('banner-title').textContent = title;
  $('banner-sub').textContent = sub || '';
  var b = $('banner');
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  if (bannerTimer) clearTimeout(bannerTimer);
  bannerTimer = setTimeout(function () { b.classList.remove('show'); }, 2100);
}
var hintTimer = null;
function showHint(text, dur) {
  var h = $('hint');
  h.textContent = text; h.classList.add('show');
  if (hintTimer) clearTimeout(hintTimer);
  if (dur) hintTimer = setTimeout(hideHint, dur * 1000);
}
function hideHint() {
  $('hint').classList.remove('show');
  if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
}
function updateHud(force) {
  $('hud-height').textContent = G.height;
  var best = Math.max(G.save.best, G.height);
  $('hud-best').textContent = 'BEST ' + best;
  // wind meter
  var wm = $('windmeter'), show = G.height >= 12;
  wm.classList.toggle('hidden', !show);
  if (show) {
    var active = G.wind.gust > 0, tele = G.wind.tele > 0;
    var lvl = active ? G.wind.str : (tele ? 0.25 : 0);
    $('wind-fill').style.width = Math.round(lvl * 100) + '%';
    $('wind-arrow').textContent = G.wind.dir > 0 ? '→' : '←';
    $('wind-arrow').style.opacity = active ? 1 : 0.35;
    $('wind-label').textContent = G.height < L.WIND_START_FLOOR ? 'WIND STARTS AT FLOOR 15' :
      (active ? 'GUST!' : (tele ? 'GUST INCOMING…' : 'WIND'));
    wm.classList.toggle('gust', active);
    wm.classList.toggle('tele', tele && !active);
  }
  // mute icon
  $('btn-mute').textContent = Audio.muted ? '🔇' : '🔊';
  $('btn-mute-menu').textContent = Audio.muted ? '🔇' : '🔊';
}

/* ================= screens / state ================= */
var SCREENS = ['screen-loader', 'screen-menu', 'screen-howto', 'screen-pause', 'screen-gameover'];
function setState(s) {
  G.state = s;
  SCREENS.forEach(function (id) { $(id).classList.add('hidden'); });
  $('hud').classList.add('hidden');
  if (s === 'menu') {
    $('screen-menu').classList.remove('hidden');
    buildMenuTower();
    $('menu-best').textContent = G.save.best > 0 ? 'BEST HEIGHT: ' + G.save.best + ' FLOORS' : 'NO TOWER YET — BUILD YOUR FIRST!';
    refreshThemeCards();
  } else if (s === 'howto') {
    $('screen-howto').classList.remove('hidden');
    startHowtoDemos();
  } else if (s === 'playing') {
    $('hud').classList.remove('hidden');
    stopHowtoDemos();
  } else if (s === 'paused') {
    $('hud').classList.remove('hidden');
    $('screen-pause').classList.remove('hidden');
    stopHowtoDemos();
  } else if (s === 'gameover') {
    $('screen-gameover').classList.remove('hidden');
    stopHowtoDemos();
  }
  updateHud(true);
}
function buildMenuTower() {
  G.floors = [];
  var x = 0;
  for (var i = 0; i < 13; i++) {
    x += rand(-26, 26); x = clamp(x, -50, 50);
    var f = { w: L.BASE_W - i * 4, x: x, seed: Math.random() * 10, tenant: null, deco: null, growFrom: 0, growT: 1, litP: 0.55 };
    if (i === 12) f.deco = 'garden';
    if (i === 7) { f.tenant = { story: 'reader', kicker: '', family: '', t: 8 }; }
    G.floors.push(f);
  }
  G.height = 13;
}
function pauseGame() {
  if (G.state !== 'playing') return;
  G.pausedFrom = 'playing';
  setState('paused');
  Audio.setWind(0);
}
function resumeGame() {
  if (G.state !== 'paused') return;
  setState('playing');
}
function toggleMute() {
  Audio.ensure();
  Audio.setMuted(!Audio.muted);
  G.save.muted = Audio.muted; storeSave();
  updateHud(true);
}
function fillGameOver() {
  var o = G.over;
  $('go-height').textContent = o.height;
  $('go-best').textContent = 'BEST ' + o.best;
  $('go-newbest').classList.toggle('hidden', !o.newBest);
  var stars = '';
  for (var i = 0; i < 5; i++) stars += i < o.stars ? '★' : '☆';
  $('go-stars').textContent = stars;
  var ns = L.nextStarAt(o.height);
  $('go-next').textContent = ns ? 'NEXT STAR AT ' + ns + ' FLOORS' : 'ALL 5 STARS EARNED!';
  if (o.bestCombo >= 5) $('go-combo').textContent = 'BEST COMBO ×' + o.bestCombo;
  else $('go-combo').textContent = '';
}

/* ================= theme cards ================= */
function refreshThemeCards() {
  var row = $('theme-row');
  row.innerHTML = '';
  L.THEMES.forEach(function (t) {
    var unlocked = G.save.themes.indexOf(t.id) >= 0;
    var card = document.createElement('button');
    card.className = 'theme-card' + (G.theme === t.id ? ' sel' : '') + (unlocked ? '' : ' locked');
    var sw = document.createElement('span'); sw.className = 'swatch sw-' + t.id;
    var nm = document.createElement('span'); nm.className = 'tname'; nm.textContent = t.name;
    var tg = document.createElement('span'); tg.className = 'ttag'; tg.textContent = t.tagline || '';
    var st = document.createElement('span'); st.className = 'tstate';
    st.textContent = unlocked ? (G.theme === t.id ? '● IN USE' : 'TAP TO USE') : '🔒 ' + t.unlockAt + ' FLOORS';
    card.appendChild(sw); card.appendChild(nm); card.appendChild(tg); card.appendChild(st);
    if (unlocked) card.addEventListener('click', function () { Audio.ensure(); Audio.uiTap(); applyTheme(t.id); });
    row.appendChild(card);
  });
}

/* ================= share card ================= */
function shareCard() {
  var o = G.over || { height: G.height, best: G.save.best, stars: L.starFor(G.height) };
  var a = art(), cw = 1080, chh = 1350;
  var c = mkCanvas(cw, chh), x = c.getContext('2d');
  var g = x.createLinearGradient(0, 0, 0, chh);
  a.sky.forEach(function (col, i) { g.addColorStop(i / (a.sky.length - 1), col); });
  x.fillStyle = g; x.fillRect(0, 0, cw, chh);
  if (a.sun) {
    var rg = x.createRadialGradient(cw * a.sun.x, chh * 0.66, 10, cw * a.sun.x, chh * 0.66, 260);
    rg.addColorStop(0, a.sun.c); rg.addColorStop(1, 'rgba(255,180,80,0)');
    x.fillStyle = rg; x.fillRect(0, 0, cw, chh);
  }
  // tower silhouette from actual floors
  var n = G.floors.length, baseY = 1080, fhh = Math.min(26, 700 / Math.max(n, 1));
  for (var i = 0; i < n; i++) {
    var f = G.floors[i];
    var fw = (f.w / 240) * 560 + 60;
    var fx = cw / 2 + (f.x / 240) * 560;
    var fy = baseY - (i + 1) * fhh;
    var fg = x.createLinearGradient(0, fy, 0, fy + fhh);
    fg.addColorStop(0, a.floorTop); fg.addColorStop(1, a.floorBot);
    x.fillStyle = fg; x.fillRect(fx - fw / 2, fy, fw, fhh);
    x.fillStyle = a.trim; x.fillRect(fx - fw / 2, fy, fw, 3);
  }
  // text
  x.textAlign = 'center';
  x.fillStyle = 'rgba(10,8,24,0.55)'; x.fillRect(0, 0, cw, 300);
  x.fillStyle = '#ffffff';
  x.font = '800 84px "Avenir Next","Segoe UI",system-ui,sans-serif';
  x.fillText('SKYLINE STACK', cw / 2, 120);
  x.fillStyle = a.trim;
  x.font = '800 150px "Avenir Next","Segoe UI",system-ui,sans-serif';
  x.fillText(o.height + '', cw / 2, 1170);
  x.fillStyle = '#ffffff'; x.font = '600 44px "Avenir Next","Segoe UI",system-ui,sans-serif';
  x.fillText('FLOORS · ' + L.themeById(G.theme).name.toUpperCase(), cw / 2, 1240);
  var stars = '';
  for (var s2 = 0; s2 < 5; s2++) stars += s2 < o.stars ? '★' : '☆';
  x.fillStyle = '#ffd97a'; x.font = '600 52px "Avenir Next","Segoe UI",system-ui,sans-serif';
  x.fillText(stars, cw / 2, 240);
  try {
    c.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url; link.download = 'skyline-stack-' + o.height + '.png';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      showToast('Share card saved!');
    });
  } catch (e) { showToast('Could not save the card on this device.'); }
}

/* ================= how-to-play demos ================= */
var howtoRAF = 0, howtoT = 0;
function startHowtoDemos() {
  stopHowtoDemos();
  var t0 = performance.now();
  function frame(now) {
    howtoT = (now - t0) / 1000;
    drawHowtoDemo('demo1', 0); drawHowtoDemo('demo2', 1); drawHowtoDemo('demo3', 2);
    howtoRAF = requestAnimationFrame(frame);
  }
  howtoRAF = requestAnimationFrame(frame);
}
function stopHowtoDemos() { if (howtoRAF) cancelAnimationFrame(howtoRAF); howtoRAF = 0; }
function drawHowtoDemo(id, kind) {
  var cv = $(id); if (!cv) return;
  var x = cv.getContext('2d'), dw = cv.width, dh = cv.height;
  var a = THEME_ART.neon;
  var g = x.createLinearGradient(0, 0, 0, dh);
  g.addColorStop(0, '#2a1f5c'); g.addColorStop(1, '#8e2f6d');
  x.fillStyle = g; x.fillRect(0, 0, dw, dh);
  x.textAlign = 'center';
  if (kind === 0) {
    var bx = dw / 2 + Math.sin(howtoT * 2.4) * dw * 0.3;
    x.strokeStyle = '#0e0b1e'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(dw / 2, 8); x.lineTo(bx, 26); x.stroke();
    x.fillStyle = '#4a3670'; x.fillRect(bx - 26, 26, 52, 16);
    x.fillStyle = '#39f5d6'; x.fillRect(bx - 26, 24, 52, 3);
    var lined = Math.abs(bx - dw / 2) < 20;
    x.strokeStyle = lined ? '#39ff88' : 'rgba(255,255,255,0.85)';
    x.lineWidth = 3;
    x.beginPath(); x.arc(bx, 34, 16 + Math.sin(howtoT * 7) * 3, 0, 6.29); x.stroke();
    x.fillStyle = '#fff'; x.font = '800 13px sans-serif';
    x.fillText(lined ? 'NOW!' : 'WAIT…', dw / 2, dh - 10);
  } else if (kind === 1) {
    var cy = 20 + ((howtoT * 60) % (dh - 52));
    x.fillStyle = '#372a72'; x.fillRect(dw / 2 - 45, dh - 34, 90, 26);
    x.fillStyle = '#39f5d6'; x.fillRect(dw / 2 - 45, dh - 36, 90, 3);
    x.setLineDash([5, 5]); x.strokeStyle = 'rgba(255,255,255,0.5)';
    x.beginPath(); x.moveTo(dw / 2, 40); x.lineTo(dw / 2, dh - 38); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#4a3670'; x.fillRect(dw / 2 - 26, cy, 52, 16);
    x.fillStyle = '#39f5d6'; x.fillRect(dw / 2 - 26, cy - 2, 52, 3);
  } else {
    x.fillStyle = '#372a72'; x.fillRect(dw / 2 - 45, dh - 40, 90, 30);
    x.fillStyle = '#39f5d6'; x.fillRect(dw / 2 - 45, dh - 42, 90, 3);
    var k = (howtoT % 1.2) / 1.2;
    x.globalAlpha = 1 - k;
    x.strokeStyle = '#39f5d6'; x.lineWidth = 3;
    x.beginPath(); x.arc(dw / 2, dh - 40, 8 + k * 44, 0, 6.29); x.stroke();
    x.globalAlpha = 1;
    x.fillStyle = '#fff'; x.font = '800 15px sans-serif';
    x.fillText('PERFECT!', dw / 2, 30);
    x.fillStyle = '#ffd97a';
    for (var i = 0; i < 4; i++) x.fillRect(dw / 2 - 36 + i * 20, dh - 34, 8, 8);
  }
}

/* ================= wire up menus ================= */
function wireMenus() {
  $('btn-start').addEventListener('click', function () { Audio.ensure(); Audio.uiTap(); startRun(); });
  $('btn-howto').addEventListener('click', function () { Audio.ensure(); Audio.uiTap(); setState('howto'); });
  $('btn-howto-back').addEventListener('click', function () { Audio.uiTap(); setState(G.pausedFrom === 'playing' ? 'paused' : 'menu'); });
  $('btn-howto-start').addEventListener('click', function () { Audio.ensure(); Audio.uiTap(); startRun(); });
  $('btn-mute-menu').addEventListener('click', function () { toggleMute(); });
  $('btn-mute').addEventListener('click', function (e) { e.stopPropagation(); toggleMute(); });
  $('btn-pause').addEventListener('click', function (e) { e.stopPropagation(); Audio.uiTap(); pauseGame(); });
  $('btn-resume').addEventListener('click', function () { Audio.uiTap(); resumeGame(); });
  $('btn-restart').addEventListener('click', function () { Audio.uiTap(); startRun(); });
  $('btn-quit').addEventListener('click', function () { Audio.uiTap(); setState('menu'); });
  $('btn-pause-howto').addEventListener('click', function () { Audio.uiTap(); G.pausedFrom = 'playing'; setState('howto'); });
  $('btn-again').addEventListener('click', function () { Audio.ensure(); Audio.uiTap(); startRun(); });
  $('btn-go-menu').addEventListener('click', function () { Audio.uiTap(); setState('menu'); });
  $('btn-go-themes').addEventListener('click', function () { Audio.uiTap(); setState('menu'); });
  $('btn-share').addEventListener('click', function () { Audio.uiTap(); shareCard(); });
  $('btn-retry').addEventListener('click', function () { window.location.reload(); });
}

/* ================= resize ================= */
function resize() {
  var cw = window.innerWidth, ch = window.innerHeight;
  view.cssW = cw; view.cssH = ch;
  view.s = clamp(cw / W, 0.5, 2.4);
  view.H = ch / view.s;
  view.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cw * view.dpr);
  canvas.height = Math.round(ch * view.dpr);
  canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
  prerender();
}

/* ================= boot (staged loader) ================= */
var BOOT_STEPS = [
  ['Warming up the crane…', function () {
    canvas = $('game'); ctx = canvas.getContext('2d');
    ['screen-loader', 'screen-menu', 'screen-howto', 'screen-pause', 'screen-gameover'].forEach(function (id) { el[id] = $(id); });
    resize();
  }],
  ['Painting the dusk sky…', function () { prerender(); }],
  ['Stringing the lights…', function () { initCloudField(); }],
  ['Tuning the chimes…', function () { /* audio graph builds on first tap (browser policy); validate API presence */ if (!(window.AudioContext || window.webkitAudioContext)) G.errors.push('no-webaudio'); }],
  ['Raising the tower…', function () { buildMenuTower(); G.camY = -13 * FH; bindInput(); wireMenus(); }]
];
function boot() {
  G = newState();
  G.save = loadSave();
  Audio.muted = !!G.save.muted;
  applyThemeSilent(G.save.theme || 'neon');
  var bar = $('load-fill'), pct = $('load-pct'), label = $('load-label'), btn = $('btn-boot-start');
  var i = 0;
  function step() {
    if (i < BOOT_STEPS.length) {
      try { BOOT_STEPS[i][1](); }
      catch (e) { return bootError(e); }
      label.textContent = BOOT_STEPS[i][0];
      i++;
      var p = Math.round(i / BOOT_STEPS.length * 100);
      bar.style.width = p + '%'; pct.textContent = p + '%';
      requestAnimationFrame(step);
    } else {
      label.textContent = 'Ready.';
      btn.classList.remove('hidden');
      // prep the menu behind the loader (stays hidden until TAP TO ENTER)
      G.state = 'menu';
      $('menu-best').textContent = G.save.best > 0 ? 'BEST HEIGHT: ' + G.save.best + ' FLOORS' : 'NO TOWER YET — BUILD YOUR FIRST!';
      refreshThemeCards();
      updateHud(true);
    }
  }
  btn.addEventListener('click', function () {
    Audio.ensure(); Audio.uiTap(); Audio.startMusic();
    setState('menu');
  });
  window.addEventListener('error', function (e) {
    try { G.errors.push(String(e.message || e.error)); } catch (x) {}
    if (G && (G.state === 'boot' || !$('screen-loader').classList.contains('hidden') && G.state !== 'menu')) bootError(e.error || e.message);
  });
  requestAnimationFrame(step);
}
function applyThemeSilent(id) { G.theme = id; }
function bootError(e) {
  try { console.error(e); } catch (x) {}
  $('screen-loader').classList.add('hidden');
  $('errbox').classList.remove('hidden');
  $('err-msg').textContent = 'Something went wrong while starting the game.';
}

/* ================= main loop ================= */
var lastT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  var dt = (now - lastT) / 1000; lastT = now;
  if (!(dt >= 0)) dt = 0.016;
  dt = clamp(dt, 0, 1 / 30);
  if (G.state !== 'paused' && G.state !== 'boot') update(dt);
  if (G.state !== 'boot') render();
}

/* ================= debug handle (for scripted QA) ================= */
window.__skyline = {
  get state() { return G.state; },
  get height() { return G.height; },
  get combo() { return G.combo; },
  get fps() { return Math.round(G.fps); },
  get frameOps() { return G.frameOps; },
  get errors() { return G.errors.slice(); },
  get degraded() { return G.degraded; },
  get theme() { return G.theme; },
  get block() { return G.block ? { x: Math.round(G.block.x), st: G.block.st } : null; },
  get wind() { return { tele: +G.wind.tele.toFixed(2), gust: +G.wind.gust.toFixed(2), str: +G.wind.str.toFixed(2), dir: G.wind.dir }; },
  start: function () { startRun(); },
  tap: function () { onTap(0, 0); },
  miss: function () { if (G.block && (G.block.st === 'swing' || G.block.st === 'fall')) onMissed(G.block); },
  setState: setState
};

document.addEventListener('DOMContentLoaded', function () { lastT = performance.now(); boot(); requestAnimationFrame(loop); });
})();
