/* RUCKUS RAMPAGE — fx: pooled particles, comic word pops, kill feed, confetti,
   rings, dust, hit-pause requests. One Graphics for all particles. */
var RR = (typeof RR !== 'undefined') ? RR : {};

RR.FX = {
  scene: null, g: null, parts: [], pops: [], feedLines: [],
  hitpauseT: 0, time: 0,

  init: function (scene) {
    this.scene = scene;
    this.g = scene.add.graphics().setDepth(120);
    this.parts = [];
    for (var i = 0; i < 220; i++)
      this.parts.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 4, color: 0xffffff, grav: 0, shape: 0, flutter: 0 });
    this.pops = [];
    for (var p = 0; p < 12; p++) {
      var t = scene.add.text(0, 0, '', {
        fontFamily: RR.CFG.FONT, fontSize: '34px', color: '#ffffff', fontStyle: 'bold',
        stroke: '#14102e', strokeThickness: 6
      }).setOrigin(0.5).setDepth(160).setVisible(false);
      this.pops.push({ txt: t, t: 0, vy: 0 });
    }
    /* kill feed: 5 lines top-left */
    this.feedLines = [];
    for (var f = 0; f < 5; f++) {
      var ft = scene.add.text(14, 64 + f * 30, '', {
        fontFamily: RR.CFG.FONT, fontSize: '19px', color: '#ffffff', fontStyle: 'bold',
        stroke: '#14102e', strokeThickness: 4, backgroundColor: 'rgba(20,16,46,0.55)'
      }).setDepth(155).setAlpha(0);
      this.feedLines.push({ txt: ft, t: 0 });
    }
  },

  reset: function () {
    for (var i = 0; i < this.parts.length; i++) this.parts[i].on = false;
    for (var p = 0; p < this.pops.length; p++) { this.pops[p].t = 0; this.pops[p].txt.setVisible(false); }
    this.hitpauseT = 0;
  },

  _spawn: function (x, y, vx, vy, life, size, color, grav, shape, flutter) {
    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      if (!p.on) {
        p.on = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy;
        p.life = life; p.max = life; p.size = size; p.color = color;
        p.grav = grav || 0; p.shape = shape || 0; p.flutter = flutter || 0;
        return;
      }
    }
  },

  burst: function (x, y, color, n, grav) {
    n = n || 12;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = RR.U.rand(120, 520);
      this._spawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp, RR.U.rand(0.3, 0.7),
        RR.U.rand(3, 8), color, grav === undefined ? 900 : grav, Math.random() < 0.25 ? 1 : 0);
    }
  },

  /* impact star-burst: jagged star drawn as particles + a flash star */
  starBurst: function (x, y, big) {
    var n = big ? 26 : 14;
    this.burst(x, y, 0xffffff, n, 500);
    this.burst(x, y, 0xffd23f, Math.floor(n / 2), 500);
    this.burst(x, y, 0xff2e88, Math.floor(n / 3), 500);
    this.ring(x, y, big ? 0xffd23f : 0xffffff);
  },

  feathers: function (x, y) {
    for (var i = 0; i < 16; i++) {
      var a = Math.random() * Math.PI * 2, sp = RR.U.rand(60, 260);
      this._spawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 120, RR.U.rand(0.8, 1.4),
        RR.U.rand(4, 9), 0xffffff, 320, 1, 1);
    }
  },

  poof: function (x, y) {
    for (var i = 0; i < 10; i++) {
      var a = Math.random() * Math.PI * 2, sp = RR.U.rand(40, 160);
      this._spawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp, RR.U.rand(0.4, 0.8),
        RR.U.rand(8, 16), 0xcfc4ff, -60, 0);
    }
  },

  dust: function (x, y) {
    for (var i = 0; i < 6; i++)
      this._spawn(x + RR.U.rand(-16, 16), y, RR.U.rand(-90, 90), RR.U.rand(-140, -30),
        RR.U.rand(0.3, 0.6), RR.U.rand(4, 9), 0x9c8b7a, 500, 0);
  },

  ring: function (x, y, color) {
    /* expanding ring = special particle with negative... use shape 2 */
    this._spawn(x, y, 0, 0, 0.45, 10, color, 0, 2);
  },

  confetti: function (W) {
    var cols = [0xff2e88, 0x29f3ff, 0xffd23f, 0xb8e62e, 0xffffff, 0xb388ff];
    for (var i = 0; i < 90; i++)
      this._spawn(RR.U.rand(0, W), RR.U.rand(-40, -10), RR.U.rand(-60, 60), RR.U.rand(120, 320),
        RR.U.rand(1.6, 2.6), RR.U.rand(5, 10), cols[i % cols.length], 260, 1, 1);
  },

  trail: function (x, y, color) {
    this._spawn(x, y, RR.U.rand(-30, 30), RR.U.rand(-30, 30), 0.35, RR.U.rand(6, 12), color, 0, 0);
  },

  word: function (str, x, y, color) {
    for (var i = 0; i < this.pops.length; i++) {
      var p = this.pops[i];
      if (p.t <= 0) {
        p.t = 0.9; p.vy = -130;
        p.txt.setText(str).setColor(color || '#ffffff').setPosition(x, y)
          .setScale(0.3).setAlpha(1).setVisible(true).setAngle(RR.U.rand(-8, 8));
        return;
      }
    }
  },

  feed: function (line) {
    /* shift lines down, newest on top */
    for (var i = this.feedLines.length - 1; i > 0; i--) {
      var a = this.feedLines[i], b = this.feedLines[i - 1];
      a.txt.setText(b.txt.text); a.t = b.t; a.txt.setAlpha(b.txt.alpha);
    }
    var top = this.feedLines[0];
    top.txt.setText(line); top.t = 4.5; top.txt.setAlpha(1);
  },

  clearFeed: function () {
    for (var i = 0; i < this.feedLines.length; i++) {
      this.feedLines[i].t = 0;
      this.feedLines[i].txt.setText('').setAlpha(0);
    }
  },

  hitpause: function (dur) { this.hitpauseT = Math.max(this.hitpauseT, dur); },

  update: function (dt) {
    this.time += dt;
    var g = this.g; g.clear();
    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      if (!p.on) continue;
      p.life -= dt;
      if (p.life <= 0) { p.on = false; continue; }
      p.vy += p.grav * dt;
      if (p.flutter) p.vx += Math.sin(this.time * 10 + i) * 160 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      var a = RR.U.clamp(p.life / p.max, 0, 1);
      if (p.shape === 2) { /* expanding ring */
        var rr = p.size + (1 - a) * 130;
        g.lineStyle(6 * a + 1, p.color, a);
        g.strokeCircle(p.x, p.y, rr);
      } else if (p.shape === 1) {
        g.fillStyle(p.color, a * 0.95);
        g.fillRect(p.x - p.size / 2, p.y - p.size / 4, p.size, p.size / 2);
      } else {
        g.fillStyle(p.color, a);
        g.fillCircle(p.x, p.y, p.size * (0.5 + a * 0.5));
      }
    }
    /* word pops */
    for (var q = 0; q < this.pops.length; q++) {
      var pp = this.pops[q];
      if (pp.t <= 0) continue;
      pp.t -= dt;
      if (pp.t <= 0) { pp.txt.setVisible(false); continue; }
      var sc = RR.U.easeOutBack(RR.U.clamp(1 - pp.t / 0.9, 0, 1));
      pp.txt.setScale(Math.max(0.3, sc));
      pp.txt.y += pp.vy * dt; pp.vy *= (1 - 2 * dt);
      pp.txt.setAlpha(RR.U.clamp(pp.t / 0.4, 0, 1));
    }
    /* feed fade */
    for (var f = 0; f < this.feedLines.length; f++) {
      var fl = this.feedLines[f];
      if (fl.t > 0) {
        fl.t -= dt;
        if (fl.t < 1) fl.txt.setAlpha(Math.max(0, fl.t));
      }
    }
  }
};
