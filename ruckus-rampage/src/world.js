/* RUCKUS RAMPAGE — arena: layout, pre-rendered theme art, rope physics, hazards,
   conveyor, bumper dhols, collapsing tiles, sudden-death shrink. */
var RR = (typeof RR !== 'undefined') ? RR : {};

RR.Arena = {
  scene: null, theme: 'neon', W: 0, H: 0,
  cx: 0, floorY: 0, halfW: 0, initHalfW: 0,
  blast: null, ropes: null, conveyor: null, tiles: [], bumpers: [],
  shrink: false, shrinkMin: 150,
  bgRT: null, crowdRT: null, crowdC: null,
  platG: null, ropeG: null, bumpG: null,
  ropeWob: 0, ropeWobV: 0, time: 0,

  THEMES: {
    neon:  { sky0: 0x14102e, sky1: 0x2a1f66, trim: 0xff2e88, trim2: 0x29f3ff, plat: 0x332a6e, platD: 0x241d52, music: 'neon' },
    roof:  { sky0: 0x2b1a4e, sky1: 0xb4503f, trim: 0xff9f1c, trim2: 0xffd23f, plat: 0x4a3670, platD: 0x352655, music: 'roof' },
    beach: { sky0: 0x0e3a5a, sky1: 0x3fa7c4, trim: 0x29f3ff, trim2: 0xb8e62e, plat: 0xd9b77c, platD: 0xb8945e, music: 'beach' }
  },

  /* pure layout math (also used for logic arena descriptor) */
  computeLayout: function (W, H) {
    var cx = W / 2, floorY = Math.round(H * 0.70);
    var halfW = Math.min(W * 0.36, 470);
    return {
      cx: cx, floorY: floorY, halfW: halfW,
      blast: { l: cx - halfW - 300, r: cx + halfW + 300, t: floorY - 640, b: floorY + 320 },
      ropes: { topY: floorY - 150 },
      conveyor: { x0: cx - 130, x1: cx + 130, y: floorY - 118, dir: 1, on: true, flipT: 6 },
      tiles: this._tileDefs(cx, halfW),
      bumpers: [
        { x: cx - halfW - 135, y: floorY - 290, r: 46, squash: 0 },
        { x: cx + halfW + 135, y: floorY - 290, r: 46, squash: 0 },
        { x: cx, y: floorY - 480, r: 52, squash: 0 }
      ]
    };
  },
  _tileDefs: function (cx, halfW) {
    var tw = 92, tiles = [], off = [0, 1.9, 3.8, 5.7];
    var xs = [cx - halfW, cx - halfW + tw, cx + halfW - tw * 2, cx + halfW - tw];
    for (var i = 0; i < 4; i++)
      tiles.push({ x0: xs[i], x1: xs[i] + tw, state: 'solid', t: off[i], dead: false });
    return tiles;
  },

  build: function (scene, themeId, W, H) {
    this.scene = scene; this.theme = themeId; this.W = W; this.H = H; this.time = 0;
    var L = this.computeLayout(W, H);
    this.cx = L.cx; this.floorY = L.floorY;
    this.halfW = L.halfW; this.initHalfW = L.halfW;
    this.blast = L.blast; this.ropes = L.ropes;
    this.conveyor = L.conveyor; this.tiles = L.tiles; this.bumpers = L.bumpers;
    this.shrink = false;

    /* destroy old */
    var self = this;
    ['bgRT', 'crowdRT', 'platG', 'ropeG', 'bumpG'].forEach(function (k) {
      if (self[k]) { self[k].destroy(); self[k] = null; }
    });
    if (this.crowdC) { this.crowdC.destroy(); this.crowdC = null; }

    var T = this.THEMES[themeId];
    /* --- static background --- */
    var bg = scene.add.graphics();
    bg.fillGradientStyle(T.sky0, T.sky0, T.sky1, T.sky1, 1);
    bg.fillRect(0, 0, W, H);
    this._themeProps(bg, T, W, H);
    /* void glow under platform */
    bg.fillStyle(0x000000, 0.45);
    bg.fillEllipse(this.cx, this.floorY + 150, this.halfW * 2.6, 220);
    this.bgRT = scene.add.renderTexture(0, 0, W, H).setDepth(-10).setOrigin(0);
    this.bgRT.draw(bg); bg.destroy();

    /* --- crowd (separate layer so it can jump) --- */
    var cr = scene.add.graphics();
    this._crowd(cr, W, H, T);
    this.crowdRT = scene.add.renderTexture(0, 0, W, H).setOrigin(0);
    this.crowdRT.draw(cr); cr.destroy();
    this.crowdC = scene.add.container(0, 0, [this.crowdRT]).setDepth(-5);

    /* --- dynamic layers --- */
    this.platG = scene.add.graphics().setDepth(10);
    this.ropeG = scene.add.graphics().setDepth(12);
    this.bumpG = scene.add.graphics().setDepth(11);
  },

  /* descriptor for logic.js (plain data, live values) */
  descriptor: function () {
    return {
      cx: this.cx, floorY: this.floorY, halfW: this.halfW,
      blast: this.blast, ropes: this.ropes, conveyor: this.conveyor,
      tiles: this.tiles, bumpers: this.bumpers
    };
  },

  startShrink: function () { this.shrink = true; },

  wobbleRopes: function () { this.ropeWobV += 9; },
  snapRopes: function () { this.ropeWobV += 22; },
  crowdJump: function () {
    if (!this.crowdC) return;
    var sc = this.scene;
    sc.tweens.killTweensOf(this.crowdC);
    sc.tweens.add({ targets: this.crowdC, y: -16, duration: 160, ease: 'Quad.easeOut', yoyo: true });
  },

  update: function (dt, world) {
    this.time += dt;
    var i, t;
    /* rope spring */
    this.ropeWobV += (-this.ropeWob * 90 - this.ropeWobV * 9) * dt;
    this.ropeWob += this.ropeWobV * dt;
    /* conveyor flip */
    var cv = this.conveyor;
    cv.flipT -= dt;
    if (cv.flipT <= 0) { cv.flipT = 6; cv.dir *= -1; }
    /* tiles cycle */
    for (i = 0; i < this.tiles.length; i++) {
      t = this.tiles[i];
      if (t.dead) { t.state = 'gone'; continue; }
      t.t += dt;
      var cyc = t.t % 8.8;
      t.state = cyc < 5 ? 'solid' : (cyc < 6.2 ? 'warn' : (cyc < 8.8 ? 'gone' : 'solid'));
    }
    /* bumper squash decay */
    for (i = 0; i < this.bumpers.length; i++)
      if (this.bumpers[i].squash > 0) this.bumpers[i].squash -= dt * 4;
    /* sudden-death shrink */
    if (this.shrink && this.halfW > this.shrinkMin) {
      this.halfW = Math.max(this.shrinkMin, this.halfW - 15 * dt);
      this.blast.l = this.cx - this.halfW - 300;
      this.blast.r = this.cx + this.halfW + 300;
      for (i = 0; i < this.tiles.length; i++) {
        t = this.tiles[i];
        if (t.x0 < this.cx - this.halfW || t.x1 > this.cx + this.halfW) { t.dead = true; t.state = 'gone'; }
      }
      /* bumpers drift inward with the shrink */
      this.bumpers[0].x = this.cx - this.halfW - 135;
      this.bumpers[1].x = this.cx + this.halfW + 135;
    }
    this._drawDynamic(world);
  },

  /* ============ dynamic drawing ============ */
  _drawDynamic: function (world) {
    var T = this.THEMES[this.theme], time = this.time;
    var g = this.platG; g.clear();
    var x0 = this.cx - this.halfW, x1 = this.cx + this.halfW, fy = this.floorY;

    /* fighter shadows */
    if (world && world.fighters) {
      for (var fi = 0; fi < world.fighters.length; fi++) {
        var f = world.fighters[fi];
        if (!f.alive) continue;
        var h = RR.U.clamp((fy - f.y) / 500, 0, 1);
        if (Math.abs(f.x - this.cx) < this.halfW + 120 && f.y < fy + 40) {
          g.fillStyle(0x000000, 0.3 * (1 - h));
          g.fillEllipse(f.x, fy + 8, f.r * 1.7 * (1 - h * 0.4), 14 * (1 - h * 0.4));
        }
      }
    }

    /* platform body */
    g.fillStyle(T.platD, 1);
    g.fillRoundedRect(x0 - 8, fy - 6, (x1 - x0) + 16, 40, 14);
    g.fillStyle(T.plat, 1);
    g.fillRoundedRect(x0 - 8, fy - 22, (x1 - x0) + 16, 26, 12);
    /* neon trim */
    g.lineStyle(4, T.trim, 0.95);
    g.strokeRoundedRect(x0 - 8, fy - 22, (x1 - x0) + 16, 26, 12);

    /* collapsing tiles (drawn over platform edges) */
    for (var ti = 0; ti < this.tiles.length; ti++) {
      var tl = this.tiles[ti];
      if (tl.state === 'gone') continue;
      var flash = tl.state === 'warn' && Math.floor(time * 10) % 2 === 0;
      g.fillStyle(flash ? 0xff5d5d : T.trim2, flash ? 1 : 0.9);
      g.fillRoundedRect(tl.x0 + 3, fy - 24, (tl.x1 - tl.x0) - 6, 28, 8);
      if (tl.state === 'warn') {
        g.lineStyle(3, 0xffffff, 0.9);
        g.lineBetween(tl.x0 + 10, fy - 20, tl.x1 - 10, fy - 2);
        g.lineBetween(tl.x1 - 10, fy - 20, tl.x0 + 10, fy - 2);
      }
    }

    /* conveyor platform */
    var cv = this.conveyor;
    if (cv.on) {
      g.fillStyle(0x14102e, 1);
      g.fillRoundedRect(cv.x0, cv.y, cv.x1 - cv.x0, 22, 10);
      g.lineStyle(3, T.trim2, 0.9);
      g.strokeRoundedRect(cv.x0, cv.y, cv.x1 - cv.x0, 22, 10);
      /* animated chevrons show direction */
      g.lineStyle(4, T.trim2, 1);
      var off = (time * 120 * cv.dir) % 44;
      for (var chx = cv.x0 + 14 + off - 44; chx < cv.x1 - 10; chx += 44) {
        var cxp = chx < cv.x0 + 6 ? chx + 44 : chx;
        if (cxp > cv.x1 - 18) continue;
        var d = cv.dir;
        g.lineBetween(cxp, cv.y + 5, cxp + 10 * d, cv.y + 11);
        g.lineBetween(cxp + 10 * d, cv.y + 11, cxp, cv.y + 17);
      }
    }

    /* corner pylons (move with shrink) */
    for (var pi = 0; pi < 2; pi++) {
      var px = pi === 0 ? x0 - 14 : x1 + 14;
      g.fillStyle(0x14102e, 1); g.fillRoundedRect(px - 10, fy - 170, 20, 152, 8);
      g.lineStyle(3, T.trim, 1); g.strokeRoundedRect(px - 10, fy - 170, 20, 152, 8);
      var pulse = 0.6 + Math.sin(time * 5 + pi * 2) * 0.4;
      g.fillStyle(T.trim, pulse); g.fillCircle(px, fy - 178, 10);
    }

    /* shrink warning vignette */
    if (this.shrink) {
      var sa = 0.25 + Math.sin(time * 6) * 0.12;
      g.lineStyle(10, 0xff5d5d, sa);
      g.strokeRoundedRect(x0 - 14, fy - 30, (x1 - x0) + 28, 40, 16);
    }

    this._drawRopes(T, time);
    this._drawBumpers(T, time);
  },

  /* sample a quadratic bezier as line segments (Graphics has no quadraticCurveTo) */
  _qbez: function (g, x0, y0, cx, cy, x1, y1, seg) {
    seg = seg || 8;
    var px = x0, py = y0;
    for (var i = 1; i <= seg; i++) {
      var t = i / seg, u = 1 - t;
      var x = u * u * x0 + 2 * u * t * cx + t * t * x1;
      var y = u * u * y0 + 2 * u * t * cy + t * t * y1;
      g.lineBetween(px, py, x, y); px = x; py = y;
    }
  },

  _drawRopes: function (T, time) {
    var g = this.ropeG; g.clear();
    var fy = this.floorY, x0 = this.cx - this.halfW, x1 = this.cx + this.halfW;
    var wob = this.ropeWob;
    /* end nets: 3 elastic segments per end, reach inward */
    for (var e = 0; e < 2; e++) {
      var ex = e === 0 ? x0 - 14 : x1 + 14, side = e === 0 ? 1 : -1;
      for (var ri = 0; ri < 3; ri++) {
        var ry = fy - 42 - ri * 48;
        var stretch = 64 + wob * (1 + ri * 0.25);
        var kx = ex + side * stretch, ky = ry + Math.sin(time * 3 + ri) * 3;
        var wobAmt = RR.U.clamp(Math.abs(wob) / 30, 0, 1);
        g.lineStyle(5, T.trim, 0.95);
        this._qbez(g, ex, ry, ex + side * stretch * 0.5, ry + wob * 0.8, kx, ky);
        g.fillStyle(T.trim2, 1); g.fillCircle(kx, ky, 7);
        if (wobAmt > 0.15) { g.lineStyle(2, 0xffffff, wobAmt * 0.7); g.strokeCircle(kx, ky, 12); }
      }
    }
    /* decorative front ropes spanning the width */
    for (var fr = 0; fr < 3; fr++) {
      var fry = fy - 190 + fr * 52;
      g.lineStyle(4, T.trim2, 0.5);
      var sag = 26 + Math.sin(time * 2 + fr) * 5 + Math.abs(wob) * 1.4;
      this._qbez(g, x0 - 14, fry, this.cx, fry + sag, x1 + 14, fry);
    }
  },

  _drawBumpers: function (T, time) {
    var g = this.bumpG; g.clear();
    for (var i = 0; i < this.bumpers.length; i++) {
      var b = this.bumpers[i];
      var sq = b.squash > 0 ? b.squash : 0;
      var rx = b.r * (1 + sq * 0.35), ry = b.r * (1 - sq * 0.3);
      /* drum body: striped dhol */
      g.fillStyle(0xd94f30, 1); g.fillEllipse(b.x, b.y, rx * 2, ry * 2);
      g.fillStyle(0xffd23f, 1);
      g.fillEllipse(b.x - rx * 0.45, b.y, rx * 0.5, ry * 1.7);
      g.fillEllipse(b.x + rx * 0.45, b.y, rx * 0.5, ry * 1.7);
      g.lineStyle(4, 0x7a2b18, 1); g.strokeEllipse(b.x, b.y, rx * 2, ry * 2);
      /* skins */
      g.fillStyle(0xf5e6c8, 1);
      g.fillEllipse(b.x, b.y - ry * 0.92, rx * 0.9, ry * 0.42);
      g.fillEllipse(b.x, b.y + ry * 0.92, rx * 0.9, ry * 0.42);
      /* glow ring */
      var gl = 0.35 + Math.sin(time * 4 + i * 2) * 0.15;
      g.lineStyle(3, T.trim2, gl); g.strokeCircle(b.x, b.y, rx + 8);
    }
  },

  onBumperHit: function (i) { if (this.bumpers[i]) this.bumpers[i].squash = 1; },

  /* ============ static pre-render ============ */
  _themeProps: function (g, T, W, H) {
    var i;
    /* floating dust motes / stars */
    for (i = 0; i < 40; i++) {
      g.fillStyle(0xffffff, RR.U.rand(0.04, 0.14));
      g.fillCircle(RR.U.rand(0, W), RR.U.rand(0, H * 0.6), RR.U.rand(1.5, 3.5));
    }
    if (this.theme === 'roof') {
      /* sun + skyline */
      g.fillStyle(0xffd23f, 0.9); g.fillCircle(W * 0.78, H * 0.3, 54);
      g.fillStyle(0x1c1236, 1);
      for (i = 0; i < 9; i++) {
        var bw = W / 9, bh = RR.U.rand(H * 0.12, H * 0.3);
        g.fillRect(i * bw + 6, H * 0.62 - bh, bw - 12, bh);
        g.fillStyle(0xffd23f, 0.5);
        for (var wy = 0; wy < 3; wy++) for (var wx = 0; wx < 2; wx++)
          g.fillRect(i * bw + 16 + wx * 22, H * 0.62 - bh + 12 + wy * 26, 10, 14);
        g.fillStyle(0x1c1236, 1);
      }
      /* water tank + clothesline + fairy lights */
      g.fillStyle(0x241d52, 1); g.fillRoundedRect(W * 0.06, H * 0.34, 90, 70, 10);
      g.lineStyle(3, 0x8a8f9d, 0.8);
      g.lineBetween(W * 0.2, H * 0.2, W * 0.45, H * 0.26);
      for (i = 0; i <= 8; i++) {
        var lx = W * 0.2 + (W * 0.25) * (i / 8), ly = H * 0.2 + (H * 0.06) * (i / 8);
        g.fillStyle(i % 2 ? 0xff2e88 : 0x29f3ff, 0.95); g.fillCircle(lx, ly + 4, 5);
      }
      /* pigeons */
      g.fillStyle(0x14102e, 0.9);
      for (i = 0; i < 5; i++) {
        var px = RR.U.rand(W * 0.3, W * 0.7), py = RR.U.rand(H * 0.08, H * 0.2);
        g.fillEllipse(px, py, 16, 7); g.fillTriangle(px + 6, py, px + 12, py - 5, px + 10, py + 2);
      }
    } else if (this.theme === 'beach') {
      g.fillStyle(0xfff3b0, 0.95); g.fillCircle(W * 0.15, H * 0.18, 60);
      /* waves */
      for (i = 0; i < 3; i++) {
        g.lineStyle(6, 0xffffff, 0.35 - i * 0.08);
        g.beginPath();
        for (var wx2 = 0; wx2 <= W; wx2 += 24)
          g.lineTo(wx2, H * (0.86 + i * 0.045) + Math.sin(wx2 * 0.03 + i * 2) * 8);
        g.strokePath();
      }
      /* umbrellas */
      var ux = [W * 0.08, W * 0.92];
      for (i = 0; i < 2; i++) {
        g.lineStyle(5, 0x8a5a2b, 1); g.lineBetween(ux[i], H * 0.62, ux[i], H * 0.42);
        g.fillStyle(i ? 0xff2e88 : 0x29f3ff, 0.95);
        g.fillTriangle(ux[i] - 46, H * 0.44, ux[i] + 46, H * 0.44, ux[i], H * 0.34);
      }
      /* crabs */
      g.fillStyle(0xd94f30, 0.9);
      for (i = 0; i < 3; i++) {
        var cx2 = RR.U.rand(W * 0.2, W * 0.8);
        g.fillEllipse(cx2, H * 0.93, 26, 16);
      }
    } else {
      /* neon: grid floor glow + light pillars */
      g.lineStyle(2, T.trim2, 0.16);
      for (i = 0; i <= 12; i++) g.lineBetween((W / 12) * i, H * 0.55, (W / 12) * i, H);
      for (i = 0; i < 4; i++) {
        var gx = W * (0.15 + i * 0.23);
        g.fillStyle(T.trim, 0.1);
        g.fillRect(gx - 14, H * 0.1, 28, H * 0.5);
      }
    }
  },

  _crowd: function (g, W, H, T) {
    /* layered silhouettes behind the arena */
    var rows = [
      { y: H * 0.52, s: 0.8, a: 0.5 }, { y: H * 0.58, s: 1.0, a: 0.75 }, { y: H * 0.65, s: 1.25, a: 1 }
    ];
    for (var ri = 0; ri < rows.length; ri++) {
      var row = rows[ri], n = Math.ceil(W / 46);
      for (var i = 0; i < n; i++) {
        var px = i * 46 + RR.U.rand(-8, 8), py = row.y + RR.U.rand(-6, 6);
        var s = row.s * RR.U.rand(0.85, 1.15);
        var col = ri === 2 ? 0x0d0a24 : 0x171233;
        g.fillStyle(col, row.a);
        g.fillEllipse(px, py, 34 * s, 44 * s);           /* body */
        g.fillCircle(px, py - 30 * s, 15 * s);            /* head */
        /* waving arms */
        var wave = RR.U.rand(0, 6.28);
        g.lineStyle(7 * s, col, row.a);
        g.lineBetween(px - 14 * s, py - 8 * s, px - 22 * s, py - 30 * s - Math.sin(wave) * 8);
        g.lineBetween(px + 14 * s, py - 8 * s, px + 22 * s, py - 30 * s + Math.sin(wave) * 8);
        /* glow stick */
        if (Math.random() < 0.3) {
          g.fillStyle(Math.random() < 0.5 ? T.trim : T.trim2, 0.9);
          g.fillCircle(px + RR.U.rand(-24, 24), py - 44 * s, 4);
        }
      }
    }
  }
};
