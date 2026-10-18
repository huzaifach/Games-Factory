/* DUSKLINE src/art.js — 100% code-drawn HD textures. Called once at boot. */
(function () {
'use strict';
var D = window.DUSK = window.DUSK || {};

function hexRgb(hex) { return ((hex >> 16) & 255) + ',' + ((hex >> 8) & 255) + ',' + (hex & 255); }

/* Per-color soft radial glows, painted with canvas gradients (robust on every
   renderer — overlapping translucent Graphics fills can corrupt under SwiftShader). */
D.makeGlowBank = function (scene) {
  function one(key, rgb) {
    if (scene.textures.exists(key)) return;
    var cv = scene.textures.createCanvas(key, 128, 128);
    var ctx = cv.getContext();
    var gr = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(' + rgb + ',0.55)');
    gr.addColorStop(0.45, 'rgba(' + rgb + ',0.20)');
    gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128);
    cv.refresh();
  }
  Object.keys(D.COLORS).forEach(function (k) { one('glow_' + k, hexRgb(D.COLORS[k])); });
  one('glow_white', '255,255,255');
  one('glow_ink', '150,110,255');
};

/* Composite helper: shapes are drawn into Graphics g; the final texture gets a
   canvas-gradient glow baked underneath. Avoids multi-layer alpha fills. */
function compositeGlow(scene, g, tmpKey, finalKey, size, glowKey) {
  g.generateTexture(tmpKey, size, size);
  var cv = scene.textures.createCanvas(finalKey, size, size);
  var ctx = cv.getContext();
  var glowImg = scene.textures.get(glowKey).getSourceImage();
  ctx.drawImage(glowImg, 0, 0, size, size);
  ctx.drawImage(scene.textures.get(tmpKey).getSourceImage(), 0, 0);
  cv.refresh();
  scene.textures.remove(tmpKey);
}

function glowDot(g, x, y, r, color, alpha) {
  // bright core only (2 layers max — safe). Soft outer glow is baked via compositeGlow.
  g.fillStyle(0xffffff, (alpha || 1) * 0.95);
  g.fillCircle(x, y, r * 0.55);
  g.fillStyle(color, alpha || 1);
  g.fillCircle(x, y, r * 0.8);
}

function softShadow(g, x, y, rx, ry) {
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(x, y, rx, ry);
}

D.buildTextures = function (scene) {
  var g = scene.make.graphics({ x: 0, y: 0, add: false });
  D.makeGlowBank(scene);

  /* ============ HEROES (96px, distinct silhouettes) ============ */
  var heroes = D.HEROES;
  heroes.forEach(function (h) {
    var key = 'hero_' + h.id, c = D.COLORS[h.color], s = 96, cx = s / 2, cy = s / 2;
    g.clear();
    softShadow(g, cx, cy + 26, 44, 12);
    g.fillStyle(0x0b0e24, 1); g.lineStyle(5, c, 1);
    if (h.silhouette === 'tri') {
      // SEHER: triangle blade-dancer with inner core
      g.beginPath(); g.moveTo(cx, cy - 26); g.lineTo(cx + 24, cy + 18); g.lineTo(cx - 24, cy + 18); g.closePath();
      g.fillPath(); g.strokePath();
      g.fillStyle(0xffffff, 1); g.fillCircle(cx, cy + 2, 7);
      g.lineStyle(3, 0xffffff, 0.9);
      g.beginPath(); g.moveTo(cx, cy - 26); g.lineTo(cx, cy + 2); g.strokePath();
    } else if (h.silhouette === 'orb') {
      // RAAT: robed circle + crescent
      g.fillCircle(cx, cy, 24); g.strokeCircle(cx, cy, 24);
      g.fillStyle(c, 0.9);
      g.slice(cx, cy, 20, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), true); g.fillPath();
      g.fillStyle(0xffffff, 1); g.fillCircle(cx - 6, cy - 4, 5);
      g.lineStyle(3, 0xffffff, 0.85); g.strokeCircle(cx, cy, 29);
    } else {
      // TOOFAN: angular dart with prongs
      g.beginPath(); g.moveTo(cx, cy - 28); g.lineTo(cx + 12, cy + 6); g.lineTo(cx + 22, cy + 20);
      g.lineTo(cx + 6, cy + 14); g.lineTo(cx, cy + 24); g.lineTo(cx - 6, cy + 14);
      g.lineTo(cx - 22, cy + 20); g.lineTo(cx - 12, cy + 6); g.closePath();
      g.fillPath(); g.strokePath();
      g.fillStyle(0xffffff, 1); g.fillCircle(cx, cy - 2, 6);
      g.lineStyle(3, c, 1);
      g.beginPath(); g.moveTo(cx - 22, cy + 20); g.lineTo(cx - 30, cy + 30); g.strokePath();
      g.beginPath(); g.moveTo(cx + 22, cy + 20); g.lineTo(cx + 30, cy + 30); g.strokePath();
    }
    compositeGlow(scene, g, '_tmp_' + key, key, s, 'glow_' + h.color);
  });

  /* ============ ENEMIES — luminous ink-blobs, distinct shapes ============ */
  D.ENEMIES.forEach(function (e) { drawEnemy(scene, g, e, 1, e.id); });
  // elite variant: crown ring
  D.ENEMIES.forEach(function (e) { drawEnemy(scene, g, e, 1.35, e.id + '_elite'); });
  D.BOSSES.forEach(function (b) { drawBoss(scene, g, b); });

  /* ============ PICKUPS ============ */
  // shard
  (function () {
    g.clear(); var s = 40, cx = 20, cy = 20;
    glowDot(g, cx, cy, 10, 0x7df9ff, 0.6);
    g.fillStyle(0xbff6ff, 1);
    g.beginPath(); g.moveTo(cx, cy - 12); g.lineTo(cx + 8, cy); g.lineTo(cx, cy + 12); g.lineTo(cx - 8, cy); g.closePath();
    g.fillPath();
    g.fillStyle(0xffffff, 1); g.fillTriangle(cx - 3, cy - 6, cx + 3, cy - 6, cx, cy + 2);
    compositeGlow(scene, g, '_tmp_shard', 'pick_shard', s, 'glow_cyan');
  })();
  // heart
  (function () {
    g.clear(); var s = 44, cx = 22, cy = 22;
    glowDot(g, cx, cy, 12, 0xff5c7a, 0.6);
    g.fillStyle(0xff5c7a, 1);
    g.fillCircle(cx - 7, cy - 4, 9); g.fillCircle(cx + 7, cy - 4, 9);
    g.fillTriangle(cx - 15, cy, cx + 15, cy, cx, cy + 14);
    g.fillStyle(0xffffff, 0.85); g.fillCircle(cx - 7, cy - 6, 3.5);
    compositeGlow(scene, g, '_tmp_heart', 'pick_heart', s, 'glow_rose');
  })();
  // star (magnet burst / rank gem)
  (function () {
    g.clear(); var s = 48, cx = 24, cy = 24;
    glowDot(g, cx, cy, 12, 0xffc93c, 0.6);
    g.fillStyle(0xffc93c, 1);
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, r1 = 16, r2 = 7;
      g.fillTriangle(cx, cy,
        cx + Math.cos(a - 0.18) * r1, cy + Math.sin(a - 0.18) * r1,
        cx + Math.cos(a + 0.18) * r2, cy + Math.sin(a + 0.18) * r2);
    }
    g.fillStyle(0xffffff, 1); g.fillCircle(cx, cy, 5);
    compositeGlow(scene, g, '_tmp_star', 'pick_star', s, 'glow_gold');
  })();

  /* ============ PROJECTILES (per color family) ============ */
  Object.keys(D.COLORS).forEach(function (ck) {
    var c = D.COLORS[ck];
    g.clear(); glowDot(g, 16, 16, 10, c, 0.9);
    compositeGlow(scene, g, '_tmp_proj_' + ck, 'proj_' + ck, 32, 'glow_' + ck);
    g.clear();
    g.lineStyle(4, 0xffffff, 1); g.lineStyle(8, c, 0.85);
    g.beginPath(); g.moveTo(4, 28); g.lineTo(28, 4); g.strokePath();
    g.lineStyle(3, 0xffffff, 1);
    g.beginPath(); g.moveTo(8, 24); g.lineTo(24, 8); g.strokePath();
    g.generateTexture('blade_' + ck, 32, 32);
  });
  // meteor
  (function () {
    g.clear(); glowDot(g, 24, 24, 14, 0xff6a4c, 0.8);
    g.fillStyle(0x3a1c10, 1); g.fillCircle(24, 24, 11);
    g.fillStyle(0xffb37a, 1); g.fillCircle(20, 20, 5);
    compositeGlow(scene, g, '_tmp_meteor', 'meteor', 48, 'glow_ember');
  })();
  // thorn
  (function () {
    g.clear(); var cx = 24, cy = 28;
    glowDot(g, cx, cy - 6, 12, 0x5cff9d, 0.5);
    g.fillStyle(0x1d5c33, 1); g.lineStyle(3, 0x5cff9d, 1);
    g.beginPath(); g.moveTo(cx, cy + 8); g.lineTo(cx - 10, cy - 12); g.lineTo(cx - 4, cy - 10);
    g.lineTo(cx, cy - 22); g.lineTo(cx + 4, cy - 10); g.lineTo(cx + 10, cy - 12); g.closePath();
    g.fillPath(); g.strokePath();
    compositeGlow(scene, g, '_tmp_thorn', 'thorn', 48, 'glow_jade');
  })();
  // enemy spit
  (function () {
    g.clear(); glowDot(g, 12, 12, 8, 0xa6ff5c, 0.9); compositeGlow(scene, g, '_tmp_espit', 'espit', 24, 'glow_jade');
  })();
  // nova ring
  (function () {
    g.clear(); g.lineStyle(10, 0xffffff, 0.9); g.strokeCircle(64, 64, 52);
    g.lineStyle(18, 0xb06cff, 0.5); g.strokeCircle(64, 64, 52);
    g.generateTexture('novaring', 128, 128);
  })();
  // gust arc
  (function () {
    g.clear();
    for (var i = 0; i < 3; i++) {
      g.lineStyle(10 - i * 2, 0x5cff9d, 0.5 - i * 0.12);
      g.beginPath(); g.arc(20, 100, 60 + i * 22, Phaser.Math.DegToRad(235), Phaser.Math.DegToRad(305)); g.strokePath();
    }
    g.generateTexture('gust', 160, 120);
  })();

  /* ============ BACKGROUND ============ */
  buildBackground(g, scene);

  /* ============ UI bits ============ */
  // vignette (white->transparent radial drawn as dark edges via gradient texture)
  (function () {
    var s = 256, cv = scene.textures.createCanvas('vignette', s, s);
    var ctx = cv.getContext();
    var gr = ctx.createRadialGradient(s/2, s/2, s*0.32, s/2, s/2, s*0.72);
    gr.addColorStop(0, 'rgba(10,4,20,0)');
    gr.addColorStop(1, 'rgba(10,4,20,0.85)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, s, s);
    cv.refresh();
  })();
  // soft round particle
  (function () {
    g.clear(); glowDot(g, 16, 16, 12, 0xffffff, 0.9); compositeGlow(scene, g, '_tmp_px', 'px', 32, 'glow_white');
  })();
  // large soft blotch for ground color variation
  (function () {
    g.clear();
    for (var i = 6; i >= 1; i--) {
      g.fillStyle(0xffffff, 0.05);
      g.fillCircle(128, 128, 30 + i * 16);
    }
    g.generateTexture('blotch', 256, 256);
  })();
  // joystick base + knob
  (function () {
    g.clear(); var s = 160, c = s / 2;
    g.lineStyle(4, 0xffffff, 0.35); g.fillStyle(0xffffff, 0.06); g.fillCircle(c, c, 74); g.strokeCircle(c, c, 74);
    g.lineStyle(2, 0xffffff, 0.18); g.strokeCircle(c, c, 52);
    g.generateTexture('joy_base', s, s);
    g.clear();
    g.fillStyle(0xffffff, 0.28); g.fillCircle(40, 40, 36);
    g.lineStyle(4, 0xffffff, 0.6); g.strokeCircle(40, 40, 36);
    g.fillStyle(0xffffff, 0.5); g.fillCircle(40, 40, 14);
    g.generateTexture('joy_knob', 80, 80);
  })();
  // button / card
  (function () {
    g.clear();
    g.fillStyle(0x141a38, 0.92); g.fillRoundedRect(0, 0, 200, 80, 18);
    g.lineStyle(3, 0x4ce0ff, 0.8); g.strokeRoundedRect(3, 3, 194, 74, 16);
    g.fillStyle(0xffffff, 0.06); g.fillRoundedRect(6, 6, 188, 30, 12);
    g.generateTexture('btn', 200, 80);
    g.clear();
    g.fillStyle(0x10142e, 0.96); g.fillRoundedRect(0, 0, 300, 400, 22);
    g.lineStyle(3, 0x8a7bff, 0.7); g.strokeRoundedRect(3, 3, 294, 394, 20);
    g.generateTexture('card', 300, 400);
  })();
  // banner strip
  (function () {
    g.clear();
    g.fillStyle(0x0a0d22, 0.88); g.fillRect(0, 0, 720, 110);
    g.fillStyle(0xffc93c, 0.9); g.fillRect(0, 0, 720, 4); g.fillRect(0, 106, 720, 4);
    g.generateTexture('banner', 720, 110);
  })();
  // oasis ring
  (function () {
    g.clear();
    for (var i = 6; i >= 1; i--) {
      g.lineStyle(6, 0x5cff9d, 0.10 + (6 - i) * 0.03);
      g.strokeCircle(128, 128, 40 + i * 14);
    }
    g.fillStyle(0x5cff9d, 0.10); g.fillCircle(128, 128, 120);
    g.generateTexture('oasis', 256, 256);
  })();
  // telegraph circle
  (function () {
    g.clear();
    g.lineStyle(5, 0xff4c4c, 0.85); g.strokeCircle(64, 64, 56);
    g.fillStyle(0xff4c4c, 0.12); g.fillCircle(64, 64, 56);
    g.generateTexture('telegraph', 128, 128);
  })();

  g.destroy();
};

/* draw one enemy ink-blob with a distinct silhouette */
function drawEnemy(scene, g, e, scale, key) {
  var s = Math.ceil(e.r * 2 * scale) + 44;
  var cx = s / 2, cy = s / 2, r = e.r * scale, c = e.color;
  g.clear();
  // blob shadow
  g.fillStyle(0x000000, 0.32); g.fillEllipse(cx, cy + r * 0.85, r * 1.7, r * 0.6);
  // (soft outer glow is baked underneath via compositeGlow — canvas gradient)
  var body = 0x0d1026;
  g.fillStyle(body, 1); g.lineStyle(Math.max(3, r * 0.16), c, 1);
  var sh = e.shape;
  if (sh === 'hound' || sh === 'gnat') {
    // pointed blob with tail spikes
    g.beginPath();
    g.moveTo(cx + r * 1.25, cy);
    g.lineTo(cx + r * 0.4, cy - r * 0.75); g.lineTo(cx - r * 0.5, cy - r * 0.9);
    g.lineTo(cx - r * 0.9, cy - r * 0.4); g.lineTo(cx - r * 1.1, cy);
    g.lineTo(cx - r * 0.9, cy + r * 0.4); g.lineTo(cx - r * 0.5, cy + r * 0.9);
    g.lineTo(cx + r * 0.4, cy + r * 0.75); g.closePath(); g.fillPath(); g.strokePath();
  } else if (sh === 'razor') {
    // blob with back spikes
    blobPath(g, cx, cy, r, 10, 0.12);
    g.fillStyle(c, 1);
    for (var k = 0; k < 5; k++) {
      var a = Math.PI + (k - 2) * 0.35;
      g.fillTriangle(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5,
        cx + Math.cos(a - 0.12) * r * 0.9, cy + Math.sin(a - 0.12) * r * 0.9,
        cx + Math.cos(a + 0.12) * r * 0.9, cy + Math.sin(a + 0.12) * r * 0.9);
      var sx = cx + Math.cos(a) * r * 1.15, sy = cy + Math.sin(a) * r * 1.15;
      g.fillTriangle(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6,
        sx + Math.cos(a - 0.1) * r * 0.25, sy + Math.sin(a - 0.1) * r * 0.25,
        sx + Math.cos(a + 0.1) * r * 0.25, sy + Math.sin(a + 0.1) * r * 0.25);
    }
    g.fillStyle(body, 1); g.lineStyle(Math.max(3, r * 0.16), c, 1);
    g.fillCircle(cx, cy, r * 0.72); g.strokeCircle(cx, cy, r * 0.72);
  } else if (sh === 'matry') {
    // round blob with inner ring (nested doll)
    g.fillCircle(cx, cy, r); g.strokeCircle(cx, cy, r);
    g.lineStyle(3, c, 0.8); g.strokeCircle(cx, cy, r * 0.55);
    g.fillStyle(c, 0.85); g.fillCircle(cx, cy, r * 0.2);
  } else if (sh === 'flower') {
    // 6-petal flower
    for (var p = 0; p < 6; p++) {
      var pa = p * Math.PI / 3;
      g.fillStyle(body, 1);
      g.fillEllipse(cx + Math.cos(pa) * r * 0.75, cy + Math.sin(pa) * r * 0.75, r * 0.9, r * 0.55);
      g.lineStyle(2.5, c, 0.9);
      g.strokeEllipse(cx + Math.cos(pa) * r * 0.75, cy + Math.sin(pa) * r * 0.75, r * 0.9, r * 0.55);
    }
    g.fillStyle(body, 1); g.fillCircle(cx, cy, r * 0.5); g.lineStyle(3, c, 1); g.strokeCircle(cx, cy, r * 0.5);
    g.fillStyle(0xffffff, 1); g.fillCircle(cx, cy, r * 0.16);
  } else if (sh === 'crab') {
    // wide armored blob with plate lines
    g.fillEllipse(cx, cy, r * 2.1, r * 1.5); g.strokeEllipse(cx, cy, r * 2.1, r * 1.5);
    g.lineStyle(2.5, 0xffffff, 0.5);
    for (var q = -1; q <= 1; q++) {
      g.beginPath(); g.moveTo(cx + q * r * 0.4, cy - r * 0.6); g.lineTo(cx + q * r * 0.4, cy + r * 0.6); g.strokePath();
    }
  } else if (sh === 'mole') {
    // low dome with digger ridges
    g.fillEllipse(cx, cy + r * 0.15, r * 1.9, r * 1.25); g.strokeEllipse(cx, cy + r * 0.15, r * 1.9, r * 1.25);
    g.lineStyle(3, c, 0.9);
    g.beginPath(); g.arc(cx, cy + r * 0.9, r * 0.9, Math.PI, 0); g.strokePath();
  } else if (sh === 'titan') {
    // massive hexagon brute
    hexPath(g, cx, cy, r);
    g.fillStyle(body, 1); g.fillPath(); g.lineStyle(r * 0.14, c, 1); g.strokePath();
    g.lineStyle(3, 0xffffff, 0.6); hexPath(g, cx, cy, r * 0.55); g.strokePath();
  } else if (sh === 'wisp') {
    // small bright wisp with tail
    g.fillStyle(c, 0.35);
    g.fillTriangle(cx - r * 0.4, cy - r * 0.3, cx - r * 1.6, cy, cx - r * 0.4, cy + r * 0.3);
    g.fillStyle(body, 1); g.fillCircle(cx, cy, r * 0.8); g.lineStyle(3, c, 1); g.strokeCircle(cx, cy, r * 0.8);
    g.fillStyle(0xffffff, 1); g.fillCircle(cx + r * 0.15, cy - r * 0.1, r * 0.28);
  } else if (sh === 'jaw') {
    // jaw: two arcs like open mouth
    g.lineStyle(Math.max(4, r * 0.2), c, 1);
    g.beginPath(); g.arc(cx, cy + r * 0.35, r * 0.85, Math.PI * 1.15, Math.PI * 1.85); g.strokePath();
    g.beginPath(); g.arc(cx, cy - r * 0.1, r * 0.85, Math.PI * 0.15, Math.PI * 0.85); g.strokePath();
    g.fillStyle(body, 1); g.fillCircle(cx, cy, r * 0.45);
  } else {
    blobPath(g, cx, cy, r, 9, 0.14);
  }
  // glossy highlight (all)
  g.fillStyle(0xffffff, 0.28);
  g.fillEllipse(cx - r * 0.3, cy - r * 0.42, r * 0.5, r * 0.28);
  // eyes — menacing, per-type count
  var eyeN = (sh === 'titan' || sh === 'flower') ? 3 : 2;
  g.fillStyle(0xffffff, 1);
  for (var ei = 0; ei < eyeN; ei++) {
    var ex = cx + (ei - (eyeN - 1) / 2) * r * 0.42, ey = cy - r * 0.05;
    g.fillCircle(ex, ey, Math.max(2.5, r * 0.14));
    g.fillStyle(c, 1); g.fillCircle(ex, ey, Math.max(1.2, r * 0.07)); g.fillStyle(0xffffff, 1);
  }
  // elite crown
  if (key.indexOf('_elite') >= 0) {
    g.lineStyle(4, 0xffc93c, 1);
    g.beginPath();
    for (var ci = 0; ci <= 12; ci++) {
      var ca = ci / 12 * Math.PI * 2;
      var cr = r * 1.28 + (ci % 2 === 0 ? r * 0.22 : 0);
      var px = cx + Math.cos(ca) * cr, py = cy + Math.sin(ca) * cr;
      if (ci === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath(); g.strokePath();
  }
  var glowKey = enemyGlowKey(c);
  compositeGlow(scene, g, '_tmp_e_' + key, 'enemy_' + key, s, glowKey);
}

var ENEMY_GLOW = {
  0xff8a3c: 'ember', 0xffe14c: 'gold', 0xff4c6a: 'rose', 0xb06cff: 'violet',
  0xc99aff: 'violet', 0x5cff9d: 'jade', 0x4ce0ff: 'cyan', 0xd98a4c: 'ember',
  0xff5c5c: 'ember', 0x8ad8ff: 'cyan', 0xff9a4c: 'ember',
  0xff5c3c: 'ember', 0x8a3cff: 'violet'
};
function enemyGlowKey(hex) {
  return 'glow_' + (ENEMY_GLOW[hex] || 'white');
}

function blobPath(g, cx, cy, r, lobes, wob) {
  g.beginPath();
  for (var i = 0; i <= lobes * 4; i++) {
    var a = i / (lobes * 4) * Math.PI * 2;
    var rr = r * (1 + Math.sin(a * lobes) * wob);
    var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath(); g.fillPath(); g.strokePath();
}

function hexPath(g, cx, cy, r) {
  g.beginPath();
  for (var i = 0; i < 6; i++) {
    var a = i / 6 * Math.PI * 2 - Math.PI / 2;
    var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
}

function drawBoss(scene, g, b) {
  var e = { id: b.id, r: b.r, color: b.color, shape: b.shape };
  g.clear();
  var s = Math.ceil(b.r * 2) + 90, cx = s / 2, cy = s / 2, r = b.r, c = b.color;
  g.fillStyle(0x000000, 0.4); g.fillEllipse(cx, cy + r * 0.9, r * 1.9, r * 0.6);
  // (outer glow baked via compositeGlow)
  g.fillStyle(0x0d1026, 1); g.lineStyle(8, c, 1);
  if (b.shape === 'tyrant') {
    // horned tyrant: hexagon + horns
    g.fillStyle(c, 1);
    g.fillTriangle(cx - r * 0.7, cy - r * 0.4, cx - r * 1.5, cy - r * 1.1, cx - r * 0.4, cy - r * 0.8);
    g.fillTriangle(cx + r * 0.7, cy - r * 0.4, cx + r * 1.5, cy - r * 1.1, cx + r * 0.4, cy - r * 0.8);
    hexPath(g, cx, cy, r); g.fillStyle(0x0d1026, 1); g.fillPath(); g.strokePath();
    g.lineStyle(4, 0xffffff, 0.7); hexPath(g, cx, cy, r * 0.6); g.strokePath();
    // mouth
    g.fillStyle(0x000000, 1); g.fillEllipse(cx, cy + r * 0.35, r * 0.9, r * 0.4);
    g.fillStyle(0xffffff, 1);
    for (var tI = 0; tI < 5; tI++) g.fillTriangle(cx - r * 0.36 + tI * r * 0.18, cy + r * 0.18, cx - r * 0.27 + tI * r * 0.18, cy + r * 0.18, cx - r * 0.315 + tI * r * 0.18, cy + r * 0.34);
  } else {
    // nightmaw: giant jaw with teeth ring
    g.lineStyle(10, c, 1);
    g.beginPath(); g.arc(cx, cy + r * 0.4, r * 0.9, Math.PI * 1.1, Math.PI * 1.9); g.strokePath();
    g.beginPath(); g.arc(cx, cy - r * 0.15, r * 0.9, Math.PI * 0.1, Math.PI * 0.9); g.strokePath();
    g.fillStyle(0x05060f, 1); g.fillCircle(cx, cy + r * 0.1, r * 0.62);
    g.fillStyle(0xffffff, 1);
    for (var k = 0; k < 8; k++) {
      var a = k / 8 * Math.PI * 2;
      var bx = cx + Math.cos(a) * r * 0.62, by = cy + r * 0.1 + Math.sin(a) * r * 0.62;
      g.fillTriangle(bx - 7, by - 7, bx + 7, by - 7, bx + Math.cos(a) * 16, by + Math.sin(a) * 16 - 7);
    }
    g.fillStyle(c, 1); g.fillCircle(cx, cy - r * 0.55, r * 0.16);
    g.fillStyle(0xffffff, 1); g.fillCircle(cx, cy - r * 0.55, r * 0.07);
  }
  g.fillStyle(0xffffff, 0.25); g.fillEllipse(cx - r * 0.3, cy - r * 0.45, r * 0.5, r * 0.25);
  compositeGlow(scene, g, '_tmp_boss_' + b.id, 'boss_' + b.id, s, enemyGlowKey(c));
}

/* ============ BACKGROUND: sky, stars, dune ridges, sand ============ */
function buildBackground(g, scene) {
  var W = 720, H = 480;
  // sky gradient canvas
  var sky = scene.textures.createCanvas('sky', 16, 480);
  if (sky) {
    var ctx = sky.getContext();
    var gr = ctx.createLinearGradient(0, 0, 0, 480);
    gr.addColorStop(0.0, '#070a1e');
    gr.addColorStop(0.45, '#141a3f');
    gr.addColorStop(0.75, '#3a2358');
    gr.addColorStop(1.0, '#7a2f4a');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 16, 480);
    sky.refresh();
  }
  // moon
  (function () {
    g.clear(); var s = 200, c = s / 2;
    for (var i = 5; i >= 1; i--) { g.fillStyle(0xf5e6c8, 0.07); g.fillCircle(c, c, 60 + i * 16); }
    g.fillStyle(0xf7ecd4, 1); g.fillCircle(c, c, 58);
    g.fillStyle(0xe8d5ae, 0.7); g.fillCircle(c - 16, c - 10, 12); g.fillCircle(c + 12, c + 18, 9); g.fillCircle(c + 20, c - 18, 7);
    g.generateTexture('moon', s, s);
  })();
  // dune ridge layer (tileable strip) — 3 variants
  var ridgeCols = [
    { top: 0x2a1e4e, rim: 0x8a5cff },  // far
    { top: 0x241a44, rim: 0xff5ca8 },  // mid
    { top: 0x1c1436, rim: 0xffc93c }   // near
  ];
  ridgeCols.forEach(function (rc, li) {
    g.clear();
    var w = 720, h = 190, base = h - 20;
    g.fillStyle(rc.top, 1);
    g.beginPath(); g.moveTo(0, h);
    for (var x = 0; x <= w; x += 12) {
      var y = base - Math.sin(x / w * Math.PI * 3 + li * 1.7) * 42 - Math.sin(x / w * Math.PI * 7 + li) * 14 - li * 8;
      g.lineTo(x, y);
    }
    g.lineTo(w, h); g.closePath(); g.fillPath();
    // glowing rim along crest
    g.lineStyle(3, rc.rim, 0.75);
    g.beginPath();
    for (var x2 = 0; x2 <= w; x2 += 12) {
      var y2 = base - Math.sin(x2 / w * Math.PI * 3 + li * 1.7) * 42 - Math.sin(x2 / w * Math.PI * 7 + li) * 14 - li * 8;
      if (x2 === 0) g.moveTo(x2, y2); else g.lineTo(x2, y2);
    }
    g.strokePath();
    // shimmer dots on ridge
    g.fillStyle(0xffffff, 0.5);
    for (var d = 0; d < 26; d++) {
      var dx = (d * 173 + li * 61) % w;
      var dy = base - Math.sin(dx / w * Math.PI * 3 + li * 1.7) * 42 - Math.sin(dx / w * Math.PI * 7 + li) * 14 - li * 8 - 4;
      g.fillCircle(dx, dy, 1.6);
    }
    g.generateTexture('ridge' + li, w, h);
  });
  // sand tile with grain + faint glowing cracks
  (function () {
    g.clear(); var s = 256;
    g.fillStyle(0x151231, 1); g.fillRect(0, 0, s, s);
    var seed = 12345;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    for (var i = 0; i < 260; i++) {
      var a = rnd() * 0.10;
      g.fillStyle(rnd() > 0.5 ? 0xffffff : 0x8a7bff, a);
      g.fillCircle(rnd() * s, rnd() * s, 0.8 + rnd() * 1.4);
    }
    g.lineStyle(1.5, 0xffc93c, 0.16);
    for (var cI = 0; cI < 4; cI++) {
      var sx = rnd() * s, sy = rnd() * s;
      g.beginPath(); g.moveTo(sx, sy);
      for (var sI = 0; sI < 5; sI++) { sx += (rnd() - 0.5) * 60; sy += (rnd() - 0.5) * 60; g.lineTo(sx, sy); }
      g.strokePath();
    }
    g.generateTexture('sand', s, s);
  })();
}

})();
