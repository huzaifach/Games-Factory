/* RUCKUS RAMPAGE — weapons: spawn pads, loose pickups, thrown chappals, code-drawn icons. */
var RR = (typeof RR !== 'undefined') ? RR : {};

RR.Weapons = {
  scene: null, g: null, list: [], thrown: [],
  pads: [], spawnT: 0,

  init: function (scene, arena) {
    this.scene = scene;
    this.g = scene.add.graphics().setDepth(40);
    this.list = []; this.thrown = []; this.spawnT = 1.2;
    /* 4 spawn pads spread across the platform */
    var cx = arena.cx, fy = arena.floorY, hw = arena.halfW;
    this.pads = [
      { x: cx - hw * 0.62, y: fy }, { x: cx - hw * 0.2, y: fy },
      { x: cx + hw * 0.2, y: fy }, { x: cx + hw * 0.62, y: fy }
    ];
  },

  reset: function () { this.list = []; this.thrown = []; this.spawnT = 1.2; },

  looseCount: function () {
    var n = 0;
    for (var i = 0; i < this.list.length; i++) if (!this.list[i].held) n++;
    return n + this.thrown.length;
  },

  spawnTick: function (dt, world) {
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    this.spawnT = 3.5;
    if (this.looseCount() >= 6) return;
    var free = this.pads.filter(function (p) {
      return !this.list.some(function (w) { return !w.held && Math.abs(w.x - p.x) < 60; });
    }, this);
    if (!free.length) return;
    var pad = RR.U.choice(free);
    var id = RR.U.choice(RR.WEAPON_LIST);
    this.list.push({
      id: id, x: pad.x, y: pad.y - 130, vy: 0, held: null,
      uses: RR.WEAPONS[id].uses, bob: Math.random() * 6, dropT: 0.4
    });
    world.fx.word(RR.WEAPONS[id].name + '!', pad.x, pad.y - 170, '#ffffff');
  },

  /* auto-pickup: walk over a weapon to grab it */
  pickupCheck: function (f, world) {
    if (f.weapon || !f.alive || f.tumbling) return;
    var reach = f.up.sticky ? 95 : 48;
    for (var i = 0; i < this.list.length; i++) {
      var w = this.list[i];
      if (w.held || w.dropT > 0) continue;
      if (RR.U.dist2(f.x, f.y, w.x, w.y) < (reach + 20) * (reach + 20)) {
        w.held = f;
        f.weapon = { id: w.id, uses: w.uses };
        world.audio.pickup();
        world.fx.word(RR.WEAPONS[w.id].name + '!', f.x, f.y - 70, '#ffd23f');
        break;
      }
    }
  },

  throwChappal: function (f, world) {
    var target = world.nearestFoe(f, 900);
    var dx = target ? (target.x - f.x) : f.face * 400;
    var dy = target ? (target.y - 40 - f.y) : -120;
    var m = Math.hypot(dx, dy) || 1, sp = 880;
    this.thrown.push({
      id: 'chappal', x: f.x + f.face * 40, y: f.y - 20,
      vx: (dx / m) * sp, vy: (dy / m) * sp - 100,
      thrower: f, life: 2.4, spin: 0
    });
  },

  update: function (dt, world) {
    var i, w;
    /* loose weapons: drop-in + bob */
    for (i = this.list.length - 1; i >= 0; i--) {
      w = this.list[i];
      if (w.held) continue;
      w.bob += dt * 3;
      if (w.dropT > 0) {
        w.dropT -= dt; w.vy += 2600 * dt; w.y += w.vy * dt;
        var fy = world.arena.floorY - 24;
        if (w.y >= fy) { w.y = fy; w.vy = 0; w.dropT = 0; world.fx.dust(w.x, w.y + 14); }
      }
    }
    /* thrown chappals: light gravity + homing */
    for (i = this.thrown.length - 1; i >= 0; i--) {
      var c = this.thrown[i];
      c.life -= dt; c.spin += dt * 14;
      c.vy += 700 * dt;
      var tgt = world.nearestFoe(c.thrower, 700);
      if (tgt) {
        var dx = tgt.x - c.x, dy = (tgt.y - 20) - c.y, d = Math.hypot(dx, dy) || 1;
        var turn = 900 * dt;
        c.vx += RR.U.clamp((dx / d) * 900 - c.vx, -turn, turn);
        c.vy += RR.U.clamp((dy / d) * 900 - c.vy, -turn, turn) * 0.6;
      }
      c.x += c.vx * dt; c.y += c.vy * dt;
      var hit = false;
      for (var fi = 0; fi < world.fighters.length; fi++) {
        var o = world.fighters[fi];
        if (o === c.thrower || !o.alive || o.invuln > 0) continue;
        if (RR.U.dist2(c.x, c.y, o.x, o.y) < (42 + o.r) * (42 + o.r)) {
          var def = RR.WEAPONS.chappal;
          c.thrower.applyHit(o, def, c.vx, c.vy, world, false);
          world.fx.word('CHAPPALED!', o.x, o.y - 70, '#ffd23f');
          world.audio.slap();
          world.onBigHit(c.thrower, o, 'chappal');
          hit = true; break;
        }
      }
      var landed = c.y >= world.arena.floorY - 24 && Math.abs(c.x - world.arena.cx) < world.arena.halfW;
      if (hit || c.life <= 0 || landed || c.y > world.arena.floorY + 300) {
        this.thrown.splice(i, 1);
        if (!hit && landed) this.list.push({ id: 'chappal', x: c.x, y: world.arena.floorY - 24, vy: 0, held: null, uses: -1, bob: 0, dropT: 0 });
      }
    }
  },

  draw: function (time) {
    var g = this.g; g.clear();
    var i, w;
    /* spawn pads */
    for (i = 0; i < this.pads.length; i++) {
      var p = this.pads[i];
      g.lineStyle(3, 0x29f3ff, 0.35 + Math.sin(time * 4 + i) * 0.12);
      g.strokeEllipse(p.x, p.y - 22, 74, 20);
    }
    /* loose weapons */
    for (i = 0; i < this.list.length; i++) {
      w = this.list[i];
      if (w.held) continue;
      var by = w.y + Math.sin(w.bob) * 6 - 6;
      g.fillStyle(0xffffff, 0.14 + Math.sin(w.bob * 1.3) * 0.05);
      g.fillCircle(w.x, by, 30);
      this.drawIcon(g, w.id, w.x, by, 1);
    }
    /* thrown chappals */
    for (i = 0; i < this.thrown.length; i++) {
      var c = this.thrown[i];
      /* motion streak */
      g.lineStyle(5, 0xffd23f, 0.4);
      g.lineBetween(c.x, c.y, c.x - c.vx * 0.05, c.y - c.vy * 0.05);
      this.drawIcon(g, 'chappal', c.x, c.y, 1.1, c.spin);
    }
  },

  /* code-drawn weapon icons. scale s, optional rotation. */
  drawIcon: function (g, id, x, y, s, rot) {
    s = s || 1;
    if (id === 'stick') {
      g.fillStyle(0x8a5a2b, 1);
      g.fillRoundedRect(x - 5 * s, y - 26 * s, 10 * s, 44 * s, 5 * s);
      g.fillStyle(0xffd23f, 1); g.fillCircle(x, y - 30 * s, 13 * s);
      g.lineStyle(3 * s, 0x8a5a2b, 1); g.strokeCircle(x, y - 30 * s, 13 * s);
      g.fillStyle(0x8a5a2b, 1); g.fillCircle(x, y - 30 * s, 4 * s);
    } else if (id === 'glove') {
      g.fillStyle(0xcc3333, 1); g.fillCircle(x + 4 * s, y - 4 * s, 15 * s);
      g.fillStyle(0xff5d5d, 1); g.fillCircle(x - 1 * s, y - 9 * s, 8 * s);
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(x - 14 * s, y + 6 * s, 26 * s, 10 * s, 4 * s);
    } else if (id === 'pillow') {
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(x - 20 * s, y - 14 * s, 40 * s, 28 * s, 10 * s);
      g.lineStyle(2.5 * s, 0x29f3ff, 0.8);
      g.lineBetween(x - 20 * s, y - 5 * s, x + 20 * s, y - 5 * s);
      g.lineBetween(x - 20 * s, y + 5 * s, x + 20 * s, y + 5 * s);
    } else if (id === 'chappal') {
      var r2 = rot || Math.sin(x * 0.05) * 0.2;
      g.fillStyle(0x8a5a2b, 1);
      g.fillEllipse(x, y, 34 * s, 20 * s);
      g.lineStyle(3.5 * s, 0x3d2b16, 1);
      g.lineBetween(x - 8 * s, y, x - 2 * s, y - 12 * s);
      g.lineBetween(x + 8 * s, y, x + 2 * s, y - 12 * s);
      g.fillStyle(0xffd23f, 0.9); g.fillCircle(x + Math.cos(r2) * 8 * s, y + Math.sin(r2) * 4 * s, 3.5 * s);
    } else if (id === 'magnet') {
      g.lineStyle(11 * s, 0xff2e88, 1);
      g.beginPath(); g.arc(x, y - 2 * s, 15 * s, Math.PI, 0); g.strokePath();
      g.fillStyle(0xffffff, 1);
      g.fillRect(x - 20 * s, y - 4 * s, 10 * s, 12 * s);
      g.fillRect(x + 10 * s, y - 4 * s, 10 * s, 12 * s);
    }
  }
};
