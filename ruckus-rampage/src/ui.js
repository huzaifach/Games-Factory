/* RUCKUS RAMPAGE — ui: all screens. English everywhere. Responsive to W/H. */
var RR = (typeof RR !== 'undefined') ? RR : {};

RR.UI = {
  scene: null, current: null, loadingEls: null,

  init: function (scene) { this.scene = scene; },

  hide: function () {
    if (this.current) { this.current.destroy(); this.current = null; }
  },

  dim: function (c, W, H, alpha) {
    var g = this.scene.add.graphics();
    g.fillStyle(0x0d0a24, alpha === undefined ? 0.72 : alpha);
    g.fillRect(0, 0, W, H);
    c.add(g);
  },

  panel: function (c, W, H, pw, ph, color) {
    var g = this.scene.add.graphics();
    g.fillStyle(0x1e1650, 0.97);
    g.fillRoundedRect(W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, 26);
    g.lineStyle(5, color || 0xff2e88, 1);
    g.strokeRoundedRect(W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, 26);
    c.add(g);
  },

  button: function (parent, x, y, w, h, label, cb, opts) {
    opts = opts || {};
    var sc = this.scene;
    var c = sc.add.container(x, y);
    var g = sc.add.graphics();
    var col = opts.color === undefined ? 0xff2e88 : opts.color;
    var draw = function (over) {
      g.clear();
      g.fillStyle(col, over ? 1 : 0.92);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
      g.lineStyle(4, 0xffffff, 0.85);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    };
    draw(false);
    var t = sc.add.text(0, 0, label, {
      fontFamily: RR.CFG.FONT, fontSize: (opts.fs || 26) + 'px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    c.add([g, t]);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', function () { draw(true); });
    c.on('pointerout', function () { draw(false); });
    c.on('pointerdown', function () {
      sc.tweens.add({ targets: c, scaleX: 0.93, scaleY: 0.93, duration: 70, yoyo: true });
      RR.Audio.click();
    });
    c.on('pointerup', function () { cb(); });
    parent.add(c);
    return c;
  },

  title2: function (parent, x, y, str, size, color) {
    var t = this.scene.add.text(x, y, str, {
      fontFamily: RR.CFG.FONT, fontSize: size + 'px', color: color, fontStyle: 'bold',
      stroke: '#0d0a24', strokeThickness: 8
    }).setOrigin(0.5);
    parent.add(t);
    return t;
  },

  /* ================= loading ================= */
  showLoading: function (W, H) {
    this.hide();
    var c = this.scene.add.container(0, 0).setDepth(400);
    this.dim(c, W, H, 1);
    this.title2(c, W / 2, H * 0.32, 'RUCKUS', 72, '#ff2e88');
    this.title2(c, W / 2, H * 0.32 + 78, 'RAMPAGE', 72, '#29f3ff');
    var g = this.scene.add.graphics(); c.add(g);
    var tip = this.scene.add.text(W / 2, H * 0.78, 'Wobbly blobs fly farther!', {
      fontFamily: RR.CFG.FONT, fontSize: '20px', color: '#b8e62e', fontStyle: 'italic'
    }).setOrigin(0.5);
    c.add(tip);
    var pct = this.scene.add.text(W / 2, H * 0.62, '0%', {
      fontFamily: RR.CFG.FONT, fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    c.add(pct);
    var self = this;
    this.loadingEls = {
      c: c, g: g, pct: pct, tip: tip,
      draw: function (p, label) {
        g.clear();
        var bw = Math.min(460, W * 0.7), bx = W / 2 - bw / 2, by = H * 0.66;
        g.fillStyle(0x0d0a24, 1); g.fillRoundedRect(bx - 6, by - 6, bw + 12, 32, 14);
        g.fillStyle(0x29f3ff, 1); g.fillRoundedRect(bx, by, bw * p, 20, 10);
        pct.setText(Math.round(p * 100) + '%');
        if (label) tip.setText(label);
      }
    };
    this.current = c;
  },
  /* TAP TO START gate (also unlocks audio) */
  showTapToStart: function (W, H, cb) {
    var els = this.loadingEls; if (!els) return;
    els.draw(1, 'Ready!');
    var btn = this.button(els.c, W / 2, H * 0.52, 320, 74, 'TAP TO START!', function () {
      RR.Audio.init(); RR.Audio.resume();
      cb();
    }, { color: 0xb8e62e, fs: 30 });
    this.scene.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  },

  /* ================= title ================= */
  showTitle: function (W, H, save, cb) {
    this.hide();
    var c = this.scene.add.container(0, 0).setDepth(300);
    this.dim(c, W, H, 0.55);
    var compact = H < 520;
    var lz = compact ? 54 : 76;
    var ly = compact ? H * 0.12 : H * 0.2;
    var logo1 = this.title2(c, W / 2, ly, 'RUCKUS', lz, '#ff2e88');
    var logo2 = this.title2(c, W / 2, ly + (compact ? 58 : 82), 'RAMPAGE', lz, '#29f3ff');
    this.scene.tweens.add({ targets: [logo1, logo2], angle: 2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.title2(c, W / 2, ly + (compact ? 106 : 140), 'Last blob bouncing wins!', compact ? 18 : 24, '#ffd23f');

    var starTxt = '';
    for (var i = 0; i < 3; i++) starTxt += i < Math.min(3, save.stars) ? '★' : '☆';
    if (compact) {
      /* two-column buttons + stats top-left (short landscape phones) */
      var by1 = H * 0.62, by2 = by1 + 74;
      this.button(c, W / 2 - 150, by1, 270, 62, 'FIGHT!', cb.fight, { color: 0xb8e62e, fs: 32 });
      this.button(c, W / 2 - 150, by2, 270, 54, 'HOW TO PLAY', cb.howto, { color: 0x29f3ff, fs: 22 });
      this.button(c, W / 2 + 150, by1, 270, 62, 'COSTUMES', cb.costumes, { color: 0xb388ff, fs: 24 });
      this.button(c, W / 2 + 150, by2, 270, 54, 'ARENA', cb.arena, { color: 0xff9f1c, fs: 24 });
      this.title2(c, W / 2, H - 22, 'Wins: ' + save.wins + '    Stars: ' + starTxt + '    Best KOs: ' + save.bestKOs, 16, '#ffffff');
    } else {
      var bw = Math.min(300, W * 0.4);
      this.button(c, W / 2, H * 0.52, bw, 72, 'FIGHT!', cb.fight, { color: 0xb8e62e, fs: 34 });
      this.button(c, W / 2, H * 0.52 + 92, bw, 58, 'HOW TO PLAY', cb.howto, { color: 0x29f3ff, fs: 24 });
      this.button(c, W / 2 - bw / 2 - 12, H * 0.52 + 172, bw / 2, 52, 'COSTUMES', cb.costumes, { color: 0xb388ff, fs: 20 });
      this.button(c, W / 2 + bw / 2 + 12, H * 0.52 + 172, bw / 2, 52, 'ARENA', cb.arena, { color: 0xff9f1c, fs: 20 });
      this.title2(c, W / 2, H - 44, 'Wins: ' + save.wins + '    Stars: ' + starTxt + '    Best KOs: ' + save.bestKOs, 20, '#ffffff');
    }
    var muteLbl = save.muted ? 'SOUND: OFF' : 'SOUND: ON';
    var mb = this.button(c, W - 90, 40, 150, 44, muteLbl, function () {
      RR.Audio.init();
      RR.Audio.setMuted(!RR.Audio.muted);
      mb.getAt(1).setText(RR.Audio.muted ? 'SOUND: OFF' : 'SOUND: ON');
    }, { color: 0x3a3f66, fs: 17 });
    this.current = c;
  },

  /* ================= how to play (3 illustrated steps) ================= */
  showHowTo: function (W, H, cb) {
    this.hide();
    var c = this.scene.add.container(0, 0).setDepth(300);
    this.dim(c, W, H, 0.85);
    this.title2(c, W / 2, H < 520 ? 34 : 56, 'HOW TO PLAY', H < 520 ? 34 : 44, '#ffd23f');

    var steps = [
      { t: '1. MOVE', d: 'Push the stick (or A / D).', sub: 'Chase the glowing weapons!' },
      { t: '2. GRAB & WHACK', d: 'Walk over a weapon, press HIT.', sub: 'Wobbly blobs fly farther!' },
      { t: '3. KNOCK ’EM OFF', d: 'Launch every bot out of the arena.', sub: 'Last blob bouncing wins!' }
    ];
    var cw = Math.min(300, (W - 80) / 3 - 16);
    var ch = Math.min(300, H * 0.62);
    var cy = H < 520 ? H * 0.46 : H * 0.44;
    var tfs = Math.min(24, Math.max(15, cw / 9));
    for (var i = 0; i < 3; i++) {
      var cx = W / 2 + (i - 1) * (cw + 24);
      var card = this.scene.add.container(cx, cy);
      var g = this.scene.add.graphics();
      g.fillStyle(0x1e1650, 1); g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 18);
      g.lineStyle(4, 0x29f3ff, 1); g.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 18);
      card.add(g);
      this._howtoArt(card, i, cw, ch);
      var tt = this.scene.add.text(0, -ch / 2 + 22, steps[i].t, { fontFamily: RR.CFG.FONT, fontSize: tfs + 'px', color: '#ffd23f', fontStyle: 'bold', align: 'center', wordWrap: { width: cw - 16 } }).setOrigin(0.5, 0);
      var dd = this.scene.add.text(0, ch / 2 - 72, steps[i].d, { fontFamily: RR.CFG.FONT, fontSize: '17px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: cw - 20 } }).setOrigin(0.5, 0);
      var ss = this.scene.add.text(0, ch / 2 - 44, steps[i].sub, { fontFamily: RR.CFG.FONT, fontSize: '15px', color: '#b8e62e', align: 'center', wordWrap: { width: cw - 20 } }).setOrigin(0.5, 0);
      card.add([tt, dd, ss]);
      c.add(card);
      this.scene.tweens.add({ targets: card, y: cy - 8, duration: 900 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (H >= 520)
      this.title2(c, W / 2, H * 0.44 + 178, 'Touch: left stick + HIT / JUMP      Desktop: WASD + J', 19, '#8a8f9d');
    var byy = H - (H < 520 ? 40 : 70), bh = H < 520 ? 48 : 60;
    this.button(c, W / 2 - 130, byy, 240, bh, 'BACK', cb.back, { color: 0x3a3f66, fs: 22 });
    this.button(c, W / 2 + 130, byy, 240, bh, 'GOT IT! FIGHT!', cb.fight, { color: 0xb8e62e, fs: 22 });
    this.current = c;
  },

  _howtoArt: function (card, i, cw, ch) {
    ch = ch || 300;
    var g = this.scene.add.graphics();
    card.add(g);
    var cy = -ch / 2 + 82; /* art zone center */
    var blob = function (x, y, col, r) {
      g.fillStyle(col, 1); g.fillEllipse(x, y, r * 2, r * 2);
      g.fillStyle(0xffffff, 1); g.fillCircle(x - 8, y - 6, 7); g.fillCircle(x + 8, y - 6, 7);
      g.fillStyle(0x14102e, 1); g.fillCircle(x - 8, y - 6, 3); g.fillCircle(x + 8, y - 6, 3);
    };
    if (i === 0) {
      /* joystick + moving blob */
      g.lineStyle(4, 0xffffff, 0.7); g.strokeCircle(-cw / 2 + 52, cy, 30);
      g.fillStyle(0x29f3ff, 0.9); g.fillCircle(-cw / 2 + 66, cy, 13);
      g.lineStyle(5, 0xffd23f, 1);
      g.lineBetween(-cw / 2 + 92, cy, cw / 2 - 66, cy);
      g.fillTriangle(cw / 2 - 66, cy - 8, cw / 2 - 66, cy + 8, cw / 2 - 54, cy);
      blob(cw / 2 - 38, cy, 0x2dd4bf, 22);
    } else if (i === 1) {
      /* blob with stick whacking */
      blob(-36, cy + 8, 0x2dd4bf, 22);
      g.fillStyle(0x8a5a2b, 1); g.fillRoundedRect(-12, cy - 30, 8, 40, 4);
      g.fillStyle(0xffd23f, 1); g.fillCircle(-8, cy - 34, 10);
      g.lineStyle(3, 0x8a5a2b, 1); g.strokeCircle(-8, cy - 34, 10);
      blob(46, cy - 4, 0xff4d4d, 20);
      g.lineStyle(4, 0xffd23f, 1);
      for (var s = 0; s < 8; s++) {
        var a = s / 8 * Math.PI * 2;
        g.lineBetween(46 + Math.cos(a) * 27, cy - 4 + Math.sin(a) * 27, 46 + Math.cos(a) * 36, cy - 4 + Math.sin(a) * 36);
      }
      var wt = this.scene.add.text(46, cy - 48, 'WOBBLY 180%!', { fontFamily: RR.CFG.FONT, fontSize: '14px', color: '#ff5d5d', fontStyle: 'bold' }).setOrigin(0.5);
      card.add(wt);
    } else {
      /* blob flying off edge */
      g.fillStyle(0x332a6e, 1); g.fillRoundedRect(-cw / 2 + 8, cy + 26, cw - 84, 20, 8);
      g.lineStyle(3, 0xff2e88, 1); g.strokeRoundedRect(-cw / 2 + 8, cy + 26, cw - 84, 20, 8);
      blob(cw / 2 - 28, cy - 30, 0xff4d4d, 20);
      g.lineStyle(5, 0xffffff, 0.6);
      g.lineBetween(-18, cy - 8, cw / 2 - 40, cy - 24);
      var wt2 = this.scene.add.text(cw / 2 - 28, cy - 62, 'BYEEE!', { fontFamily: RR.CFG.FONT, fontSize: '16px', color: '#29f3ff', fontStyle: 'bold' }).setOrigin(0.5);
      card.add(wt2);
      g.fillStyle(0xffd23f, 1);
      g.fillTriangle(26, cy - 56, 40, cy - 28, 54, cy - 56);
    }
  },

  /* ================= practice intro ================= */
  showPracticeIntro: function (W, H, cb) {
    this.hide();
    var c = this.scene.add.container(0, 0).setDepth(300);
    this.dim(c, W, H, 0.8);
    var ty = H < 520 ? H * 0.22 : H * 0.3;
    this.title2(c, W / 2, ty, 'PRACTICE ROUND', H < 520 ? 40 : 52, '#29f3ff');
    this.title2(c, W / 2, ty + 52, 'Learn the ruckus in 60 seconds!', 22, '#ffffff');
    var lines = ['Meet DUMMY. He does not fight back.', 'Follow the glowing hints:', 'MOVE  →  GRAB  →  WHACK HIM OFF!'];
    for (var i = 0; i < lines.length; i++)
      this.title2(c, W / 2, ty + 96 + i * 32, lines[i], 20, i === 0 ? '#ffd23f' : '#cfc4ff');
    this.button(c, W / 2, H - 64, 300, H < 520 ? 58 : 70, "LET'S GO!", cb, { color: 0xb8e62e, fs: 30 });
    this.current = c;
  },

  /* ================= ruckus draft ================= */
  showDraft: function (W, H, options, roundNum, cb) {
    this.hide();
    var c = this.scene.add.container(0, 0).setDepth(300);
    this.dim(c, W, H, 0.85);
    this.title2(c, W / 2, 60, 'RUCKUS DRAFT!', 52, '#ff2e88');
    this.title2(c, W / 2, 108, 'Round ' + roundNum + ' is next. Pick 1 upgrade:', 23, '#ffffff');
    var cw = Math.min(280, (W - 60) / 3 - 12);
    var ch = Math.min(300, H * 0.44);
    for (var i = 0; i < options.length; i++) {
      (function (opt, idx) {
        var cx = W / 2 + (idx - 1) * (cw + 26);
        var card = this.scene.add.container(cx, H * 0.52);
        var g = this.scene.add.graphics();
        var draw = function (over) {
          g.clear();
          g.fillStyle(over ? 0x2a2360 : 0x1e1650, 1);
          g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 20);
          g.lineStyle(5, 0xffd23f, 1);
          g.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 20);
        };
        draw(false);
        var icon = this.scene.add.text(0, -ch / 2 + 52, ['⭐', '💥', '🌀'][idx] || '⭐', { fontSize: '52px' }).setOrigin(0.5);
        var nm = this.scene.add.text(0, -ch / 2 + 116, opt.name, { fontFamily: RR.CFG.FONT, fontSize: '20px', color: '#ffd23f', fontStyle: 'bold', align: 'center', wordWrap: { width: cw - 20 } }).setOrigin(0.5, 0);
        var ln = this.scene.add.text(0, -ch / 2 + 170, opt.line, { fontFamily: RR.CFG.FONT, fontSize: '20px', color: '#ffffff', align: 'center', wordWrap: { width: cw - 24 } }).setOrigin(0.5, 0);
        card.add([g, icon, nm, ln]);
        card.setSize(cw, ch);
        card.setInteractive({ useHandCursor: true });
        card.on('pointerover', function () { draw(true); });
        card.on('pointerout', function () { draw(false); });
        card.on('pointerup', function () { RR.Audio.draftPick(); cb(opt); });
        c.add(card);
        this.scene.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 1 });
        card.setScale(0.6);
        this.scene.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 380, delay: idx * 120, ease: 'Back.easeOut' });
      }).call(this, options[i], i);
    }
    this.current = c;
  },

  /* ================= results ================= */
  showResults: function (W, H, data, cb) {
    /* data: {won:null|bool, title, subtitle, stats:[[k,v]], stars, unlocks:[str], } */
    this.hide();
    var c = this.scene.add.container(0, 0).setDepth(300);
    this.dim(c, W, H, 0.85);
    var col = data.won === true ? '#b8e62e' : (data.won === false ? '#ff5d5d' : '#ffd23f');
    var t = this.title2(c, W / 2, 84, data.title, 60, col);
    this.scene.tweens.add({ targets: t, scaleX: 1.08, scaleY: 1.08, duration: 600, yoyo: true, repeat: -1 });
    this.title2(c, W / 2, 140, data.subtitle, 23, '#ffffff');

    /* stars */
    var sy = 190, starStr = '';
    for (var i = 0; i < 3; i++) starStr += i < data.stars ? '★' : '☆';
    var st = this.title2(c, W / 2, sy, starStr, 56, '#ffd23f');
    this.scene.tweens.add({ targets: st, angle: 4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    /* stats */
    var y0 = 250;
    for (var s = 0; s < data.stats.length; s++) {
      this.title2(c, W / 2, y0 + s * 36, data.stats[s][0] + ':  ' + data.stats[s][1], 22, '#cfc4ff');
    }
    /* unlocks */
    if (data.unlocks && data.unlocks.length) {
      var uy = y0 + data.stats.length * 36 + 18;
      this.title2(c, W / 2, uy, 'UNLOCKED!', 28, '#ffd23f');
      for (var u = 0; u < data.unlocks.length; u++)
        this.title2(c, W / 2, uy + 36 + u * 30, data.unlocks[u], 21, '#b8e62e');
    }
    var by = H - 76;
    var rbw = Math.min(280, W * 0.42), rgap = rbw + 20;
    this.button(c, W / 2 - rgap / 2, by, rbw, 64, data.rematchLabel || 'REMATCH!', cb.rematch, { color: 0xb8e62e, fs: 28 });
    this.button(c, W / 2 + rgap / 2, by, rbw, 64, data.titleLabel || 'TITLE', cb.title, { color: 0x3a3f66, fs: 28 });
    this.current = c;
  },

  /* ================= pause ================= */
  showPause: function (W, H, cb) {
    this.hide();
    var c = this.scene.add.container(0, 0).setDepth(350);
    this.dim(c, W, H, 0.7);
    var compact = H < 520;
    var y0 = compact ? H * 0.28 : H * 0.44, gap = compact ? 66 : 80, bh = compact ? 54 : 62;
    this.title2(c, W / 2, compact ? H * 0.12 : H * 0.26, 'PAUSED', compact ? 40 : 54, '#ffffff');
    this.button(c, W / 2, y0, 320, bh, 'RESUME', cb.resume, { color: 0xb8e62e, fs: 26 });
    this.button(c, W / 2, y0 + gap, 320, bh, 'RESTART MATCH', cb.restart, { color: 0x29f3ff, fs: 26 });
    var muteLbl = RR.Audio.muted ? 'SOUND: OFF' : 'SOUND: ON';
    var mb = this.button(c, W / 2, y0 + gap * 2, 320, bh, muteLbl, function () {
      RR.Audio.setMuted(!RR.Audio.muted);
      mb.getAt(1).setText(RR.Audio.muted ? 'SOUND: OFF' : 'SOUND: ON');
    }, { color: 0x3a3f66, fs: 26 });
    this.button(c, W / 2, y0 + gap * 3, 320, bh, 'QUIT TO TITLE', cb.quit, { color: 0xff5d5d, fs: 26 });
    this.current = c;
  },

  /* ================= unlock galleries ================= */
  showGallery: function (W, H, kind, save, cb) {
    /* kind: 'costumes' | 'arenas' */
    this.hide();
    var c = this.scene.add.container(0, 0).setDepth(300);
    this.dim(c, W, H, 0.9);
    var items = kind === 'costumes' ? RR.COSTUMES : RR.ARENAS;
    var owned = kind === 'costumes' ? save.costumes : save.arenas;
    var sel = kind === 'costumes' ? save.costume : save.arena;
    this.title2(c, W / 2, 54, kind === 'costumes' ? 'COSTUMES' : 'ARENAS', 46, '#ffd23f');
    this.title2(c, W / 2, 100, 'Win matches to unlock more!', 21, '#ffffff');
    var cw = Math.min(250, (W - 90) / items.length - 14);
    for (var i = 0; i < items.length; i++) {
      (function (it, idx) {
        var cx = W / 2 + (idx - (items.length - 1) / 2) * (cw + 18);
        var card = this.scene.add.container(cx, H * 0.46);
        var g = this.scene.add.graphics();
        var has = owned.indexOf(it.id) >= 0;
        var isSel = sel === it.id;
        g.fillStyle(isSel ? 0x2a2360 : 0x1e1650, 1);
        g.fillRoundedRect(-cw / 2, -120, cw, 250, 18);
        g.lineStyle(4, isSel ? 0xb8e62e : (has ? 0x29f3ff : 0x555a75), 1);
        g.strokeRoundedRect(-cw / 2, -120, cw, 250, 18);
        card.add(g);
        /* mini blob preview with costume */
        if (kind === 'costumes') {
          var pg = this.scene.add.graphics();
          pg.fillStyle(0x2dd4bf, 1); pg.fillEllipse(0, -30, 84, 84);
          pg.fillStyle(0xffffff, 1); pg.fillCircle(-14, -38, 11); pg.fillCircle(14, -38, 11);
          pg.fillStyle(0x14102e, 1); pg.fillCircle(-14, -38, 4.5); pg.fillCircle(14, -38, 4.5);
          card.add(pg);
          var cg = this.scene.add.graphics();
          var fake = { g: null };
          /* draw headgear via a temp fighter-less call: replicate simply */
          if (it.id === 'bandana') { cg.fillStyle(0xd92626, 1); cg.fillEllipse(0, -66, 72, 20); }
          else if (it.id === 'turban') { cg.fillStyle(0xffd23f, 1); cg.fillEllipse(0, -70, 66, 32); cg.fillStyle(0xff2e88, 1); cg.fillCircle(0, -88, 6); }
          else if (it.id === 'pirate') { cg.fillStyle(0x1a1a22, 1); cg.fillTriangle(-38, -58, 38, -58, 0, -96); }
          else if (it.id === 'crown') { cg.fillStyle(0xffd23f, 1); cg.fillTriangle(-30, -60, -15, -92, 0, -60); cg.fillTriangle(-15, -60, 0, -96, 15, -60); cg.fillTriangle(0, -60, 15, -92, 30, -60); }
          card.add(cg);
        } else {
          var ag = this.scene.add.graphics();
          var cols = { neon: [0xff2e88, 0x29f3ff], roof: [0xff9f1c, 0xffd23f], beach: [0x29f3ff, 0xb8e62e] }[it.id];
          ag.fillStyle(cols[0], 1); ag.fillRoundedRect(-52, -70, 104, 60, 10);
          ag.fillStyle(cols[1], 1); ag.fillRoundedRect(-52, -34, 104, 24, 8);
          card.add(ag);
        }
        var nm = this.scene.add.text(0, 10, it.name, { fontFamily: RR.CFG.FONT, fontSize: '19px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: cw - 12 } }).setOrigin(0.5, 0);
        var st2 = this.scene.add.text(0, 66, has ? (isSel ? 'SELECTED' : 'TAP TO WEAR') : 'WIN ' + it.need + ' MATCH' + (it.need === 1 ? '' : 'ES'), { fontFamily: RR.CFG.FONT, fontSize: '16px', color: has ? '#b8e62e' : '#8a8f9d', fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 0);
        card.add([nm, st2]);
        if (has) {
          card.setSize(cw, 250); card.setInteractive({ useHandCursor: true });
          card.on('pointerup', function () {
            if (kind === 'costumes') save.costume = it.id; else save.arena = it.id;
            RR.Save.save(); RR.Audio.click(); cb.done();
          });
        }
        c.add(card);
      }).call(this, items[i], i);
    }
    this.button(c, W / 2, H - 64, 220, 56, 'BACK', cb.done, { color: 0x3a3f66, fs: 22 });
    this.current = c;
  },

  /* ================= center banner (countdown / round announcements) ================= */
  _banners: null,
  banner: function (W, H, text, sub, color, dur) {
    /* one banner at a time: kill the previous so they never stack */
    if (this._banners) {
      for (var bi = 0; bi < this._banners.length; bi++) {
        try { this.scene.tweens.killTweensOf(this._banners[bi]); this._banners[bi].destroy(); } catch (e) {}
      }
    }
    this._banners = [];
    var self = this;
    var c = this.scene.add.container(W / 2, H * 0.38).setDepth(250);
    this._banners.push(c);
    var t = this.scene.add.text(0, 0, text, {
      fontFamily: RR.CFG.FONT, fontSize: '64px', color: color || '#ffd23f', fontStyle: 'bold',
      stroke: '#0d0a24', strokeThickness: 10
    }).setOrigin(0.5);
    c.add(t);
    if (sub) {
      var s = this.scene.add.text(0, 52, sub, {
        fontFamily: RR.CFG.FONT, fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
        stroke: '#0d0a24', strokeThickness: 6
      }).setOrigin(0.5);
      c.add(s);
    }
    c.setScale(0.4);
    this.scene.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 350, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: c, alpha: 0, delay: (dur || 1.6) * 1000, duration: 300, onComplete: function () {
      c.destroy();
      var ix = self._banners.indexOf(c);
      if (ix >= 0) self._banners.splice(ix, 1);
    } });
    return c;
  },

  /* ================= rotate hint (portrait) ================= */
  rotateHint: function (W, H) {
    var c = this.scene.add.container(0, 0).setDepth(390);
    var g = this.scene.add.graphics();
    g.fillStyle(0x0d0a24, 0.82); g.fillRect(0, 0, W, H);
    c.add(g);
    var t = this.scene.add.text(W / 2, H / 2 - 20, 'ROTATE YOUR PHONE!', {
      fontFamily: RR.CFG.FONT, fontSize: '34px', color: '#ffd23f', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5);
    var s = this.scene.add.text(W / 2, H / 2 + 30, 'Ruckus Rampage is a landscape brawler.\n(You can still play like this — no worries!)', {
      fontFamily: RR.CFG.FONT, fontSize: '19px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5);
    c.add([t, s]);
    return c;
  }
};
