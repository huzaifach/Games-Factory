/* DUSKLINE src/scenes_game.js — the run. Chunk 1: world, player, input, HUD, pools. */
(function () {
'use strict';
var D = window.DUSK = window.DUSK || {};
var T = D.TUNE;

D.GameScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function () { Phaser.Scene.call(this, { key: 'Game' }); },

  init: function (data) {
    this.heroId = (data && data.hero) || 'seher';
    this.hero = D.HEROES.find(function (h) { return h.id === this.heroId; }, this) || D.HEROES[0];
  },

  /* ================= CREATE ================= */
  create: function () {
    var self = this;
    D.audio.unlock();
    D.audio.setIntensity(1);
    this.W = this.scale.width; this.H = this.scale.height;
    this.worldSize = 3200;
    this.physics.world.setBounds(0, 0, this.worldSize, this.worldSize);

    this.mods = D.relicMods();
    this.run = {
      t: 0, kills: 0, shards: 0, rank: 0, shardBank: 0,
      auras: [],       // {id, rank, evo:boolean, color}
      passives: {},    // id -> rank
      fusedColors: {},
      noDmgT: 0, oasisHealed: 0, boss1dead: false, boss2dead: false,
      over: false, won: false, paused: false, drafting: false,
      echoT: 20, magnetBurst: 0
    };
    this.stats = this.computeStats();

    this.buildWorld();
    this.buildPlayer();
    this.buildInput();
    this.buildPools();
    this.buildHUD();
    this.dmgNums = new D.ui.DamageNumbers(this);

    // signature aura to start
    this.addAura(this.hero.signature, true);

    // wave director state
    this.spawnT = 0; this.eliteT = 150;
    this.eventIdx = 0; this.eventT = 60; this.event = null;
    this.bossSpawned = { tyrant: false, nightmaw: false };
    this.boss = null;
    this._teles = [];
    this.achChecked = {};

    // ambient life: fireflies
    this.fireflies = [];
    for (var i = 0; i < 24; i++) {
      var f = this.add.image(Math.random() * this.worldSize, Math.random() * this.worldSize, 'px')
        .setTint([0x4ce0ff, 0xffc93c, 0xff5ca8, 0x5cff9d][i % 4]).setAlpha(0.5).setScale(0.3).setDepth(4);
      f._ph = Math.random() * 6.28; f._sp = 0.4 + Math.random() * 0.8;
      this.fireflies.push(f);
    }

    // banner: run start
    D.ui.banner(this, 'SURVIVE UNTIL DAWN', '10:00 — the Duskline must hold', '#ffc93c');
    this.cameras.main.fadeIn(600, 5, 8, 25);

    this.scale.on('resize', function () { self.handleResize(); });
  },

  computeStats: function () {
    var m = this.mods, P = (this.run && this.run.passives) || {};
    function pr(id) { return P[id] || 0; }
    var s = {
      dmgMul: (1 + 0.10 * pr('core')) * (1 + (m.dmg || 0)),
      cdrMul: (1 - 0.06 * pr('glass')) * (1 - (m.cdr || 0)),
      speed: this.hero.speed * (1 + 0.07 * pr('boots')) * (1 + (m.speed || 0)),
      maxhp: Math.round(this.hero.hp + 18 * pr('heart') + (m.maxhp || 0)),
      magnetR: (this.hero.magnet + 70) * (1 + 0.35 * pr('magnet')),
      crit: 0.05 + 0.08 * pr('coin'),
      armor: 2 * pr('skin'),
      shardMul: (1 + 0.12 * pr('map')) * (1 + (m.shards || 0)),
      regen: (m.regen || 0),
      thorns: (m.thorns || 0),
      chill: (m.chill || 0),
      dodge: Math.min(0.4, m.dodge || 0),
      lifesteal: (m.lifesteal || 0),
      echo: (m.echo || 0),
      eventPow: 1 + (m.event || 0)
    };
    s.cdrMul = Math.max(0.45, s.cdrMul);
    return s;
  },

  /* ================= WORLD ================= */
  buildWorld: function () {
    var WS = this.worldSize, W = this.W, H = this.H;
    // sand ground covering the world (the desert floor)
    this.sand = this.add.tileSprite(WS / 2, WS / 2, WS, WS, 'sand').setDepth(-6).setTileScale(3, 3).setAlpha(0.95);
    // large-scale neon color variation on the ground (world-locked, additive)
    this.blotches = [];
    var blotchTints = [0x8a5cff, 0x4ce0ff, 0xff5ca8, 0xffc93c, 0x5cff9d];
    for (var b = 0; b < 12; b++) {
      var bl = this.add.image(Math.random() * WS, Math.random() * WS, 'blotch')
        .setTint(blotchTints[b % blotchTints.length])
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.10).setScale(5 + Math.random() * 6).setDepth(-5);
      this.blotches.push(bl);
    }
    // dune ridgelines: distant glowing dunes, screen-fixed bands with parallax drift
    this.ridges = [];
    for (var r = 0; r < 3; r++) {
      var rg = this.add.tileSprite(W / 2, H - 150 - r * 70, W + 400, 190, 'ridge' + r)
        .setScrollFactor(0).setDepth(-4 + r).setAlpha(0.9);
      rg._par = 0.12 + r * 0.12;
      this.ridges.push(rg);
    }
    // moon + stars float ABOVE the dark ground: stylized neon night (additive)
    this.moon = this.add.image(W * 0.8, H * 0.15, 'moon').setScale(0.9)
      .setScrollFactor(0).setDepth(-3).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
    this.stars = [];
    for (var i = 0; i < 70; i++) {
      var st = this.add.image(Math.random() * W, Math.random() * H * 0.7, 'px')
        .setTint(0xffffff).setAlpha(0.2 + Math.random() * 0.4).setScale(0.12 + Math.random() * 0.2)
        .setScrollFactor(0).setDepth(-3).setBlendMode(Phaser.BlendModes.ADD);
      st._tw = Math.random() * 6.28;
      this.stars.push(st);
    }
    // vignette (screen space)
    this.vignette = this.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W * 1.5, H * 1.5)
      .setScrollFactor(0).setDepth(940).setAlpha(0.55);
    // sandstorm overlay (hidden)
    this.stormFx = this.add.container(0, 0).setDepth(930).setScrollFactor(0).setVisible(false);
    var fog = this.add.rectangle(W / 2, H / 2, W, H, 0xc98a4c, 0.16);
    this.stormFx.add(fog);
    this.stormDust = [];
    for (var d = 0; d < 40; d++) {
      var dp = this.add.image(Math.random() * W, Math.random() * H, 'px')
        .setTint(0xe8b06a).setAlpha(0.35).setScale(0.4 + Math.random() * 0.8);
      dp._sp = 300 + Math.random() * 500;
      this.stormDust.push(dp); this.stormFx.add(dp);
    }
    this.cameras.main.setBounds(0, 0, WS, WS);
  },

  /* ================= PLAYER ================= */
  buildPlayer: function () {
    var WS = this.worldSize;
    var x = WS / 2, y = WS / 2;
    this.player = this.physics.add.sprite(x, y, 'hero_' + this.heroId);
    var tint = D.SKIN_TINTS[D.save.skinSel[this.heroId] || 'default'];
    if (tint) this.player.setTint(tint[0]);
    this.player.setDepth(10);
    this.player.body.setCircle(22, 26, 26);
    this.player.body.setCollideWorldBounds(true);
    this.px = x; this.py = y; this.pvx = 0; this.pvy = 0;
    this.hp = this.stats.maxhp;
    this.iframes = 0; this.hurtPulse = 0;
    this.moveAng = 0; this.moving = false;
    // soft blob shadow
    this.pShadow = this.add.ellipse(x, y + 30, 52, 16, 0x000000, 0.35).setDepth(9);
    // motion trail
    this.trail = [];
    for (var i = 0; i < 10; i++) {
      var tp = this.add.image(x, y, 'px').setTint(D.COLORS[this.hero.color]).setAlpha(0).setScale(0.5).setDepth(8);
      this.trail.push(tp);
    }
    this.trailIdx = 0; this.trailT = 0;
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    // heal tick accumulator
    this.regenT = 0;
  },

  /* ================= INPUT ================= */
  buildInput: function () {
    var self = this;
    this.keys = this.input.keyboard ? this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,ESC,P') : {};
    // virtual joystick (dynamic origin)
    this.joy = { active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0, base: null, knob: null };
    this.mouseAim = { x: 0, y: 0, t: -99 };
    this.input.on('pointerdown', function (p) {
      D.audio.unlock();
      if (self.run.over || self.run.paused || self.run.drafting) return;
      // ignore HUD touches (top 130px)
      if (p.y < 130 && p.x > self.W - 160) return;
      if (!self.joy.active) {
        self.joy.active = true; self.joy.id = p.id;
        self.joy.ox = p.x; self.joy.oy = p.y; self.joy.dx = 0; self.joy.dy = 0;
        if (!self.joy.base) {
          self.joy.base = self.add.image(0, 0, 'joy_base').setScrollFactor(0).setDepth(951).setAlpha(0.9);
          self.joy.knob = self.add.image(0, 0, 'joy_knob').setScrollFactor(0).setDepth(952).setAlpha(0.95);
        }
        self.joy.base.setPosition(p.x, p.y).setVisible(true).setScale(0.5).setAlpha(0);
        self.joy.knob.setPosition(p.x, p.y).setVisible(true).setScale(0.5).setAlpha(0);
        self.tweens.add({ targets: [self.joy.base, self.joy.knob], scaleX: 1, scaleY: 1, alpha: 0.9, duration: 140, ease: 'Back.easeOut' });
      }
    });
    this.input.on('pointermove', function (p) {
      // desktop mouse aim tracking
      if (p.pointerType === 'mouse' || p.id === 0 && !self.joy.active) {
        var wx = self.cameras.main.scrollX + p.x, wy = self.cameras.main.scrollY + p.y;
        self.mouseAim.x = wx; self.mouseAim.y = wy; self.mouseAim.t = self.run.t;
      }
      if (self.joy.active && p.id === self.joy.id) {
        var dx = p.x - self.joy.ox, dy = p.y - self.joy.oy;
        var len = Math.hypot(dx, dy), max = 70;
        if (len > max) { dx = dx / len * max; dy = dy / len * max; }
        self.joy.dx = dx / max; self.joy.dy = dy / max;
        self.joy.knob.setPosition(self.joy.ox + dx, self.joy.oy + dy);
      }
    });
    var endJoy = function (p) {
      if (self.joy.active && p.id === self.joy.id) {
        self.joy.active = false; self.joy.dx = 0; self.joy.dy = 0;
        if (self.joy.base) {
          self.tweens.add({
            targets: [self.joy.base, self.joy.knob], alpha: 0, scaleX: 0.5, scaleY: 0.5, duration: 120,
            onComplete: function () { self.joy.base.setVisible(false); self.joy.knob.setVisible(false); }
          });
        }
      }
    };
    this.input.on('pointerup', endJoy);
    this.input.on('pointercancel', endJoy);
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', function () { self.togglePause(); });
      this.input.keyboard.on('keydown-P', function () { self.togglePause(); });
    }
  },

  readMoveInput: function () {
    var mx = 0, my = 0;
    if (this.joy.active) { mx = this.joy.dx; my = this.joy.dy; }
    var k = this.keys;
    if (k.A && k.A.isDown) mx -= 1;
    if (k.D && k.D.isDown) mx += 1;
    if (k.W && k.W.isDown || k.UP && k.UP.isDown) my -= 1;
    if (k.S && k.S.isDown || k.DOWN && k.DOWN.isDown) my += 1;
    if (k.LEFT && k.LEFT.isDown) mx -= 1;
    if (k.RIGHT && k.RIGHT.isDown) mx += 1;
    var l = Math.hypot(mx, my);
    if (l > 1) { mx /= l; my /= l; }
    return { x: mx, y: my };
  },

  /* ================= POOLS ================= */
  buildPools: function () {
    var self = this;
    // enemies — custom pool (sprite + data)
    this.enemyPool = [];
    this.activeEnemies = [];
    for (var i = 0; i < 140; i++) {
      var s = this.physics.add.sprite(-100, -100, 'enemy_chaser').setVisible(false).setActive(false).setDepth(6);
      s.setData('used', false);
      this.enemyPool.push(s);
    }
    // player projectiles
    this.shotPool = [];
    for (var j = 0; j < 192; j++) {
      var sh = this.physics.add.sprite(-100, -100, 'proj_gold').setVisible(false).setActive(false).setDepth(7);
      sh.setData('used', false);
      this.shotPool.push(sh);
    }
    // enemy projectiles
    this.espitPool = [];
    for (var k = 0; k < 96; k++) {
      var es = this.physics.add.sprite(-100, -100, 'espit').setVisible(false).setActive(false).setDepth(7);
      es.setData('used', false);
      this.espitPool.push(es);
    }
    // pickups (shards/hearts/stars)
    this.pickupPool = [];
    for (var m = 0; m < 220; m++) {
      var pk = this.physics.add.sprite(-100, -100, 'pick_shard').setVisible(false).setActive(false).setDepth(5);
      pk.setData('used', false);
      this.pickupPool.push(pk);
    }
    this.activePickups = [];

    // particle emitters (pooled, additive)
    this.parts = [];
    var pconf = [
      { key: 'hit', tint: 0xffffff }, { key: 'spark', tint: 0xffc93c },
      { key: 'ink', tint: 0x8a5cff }, { key: 'heal', tint: 0x5cff9d },
      { key: 'dust', tint: 0xc98a4c }, { key: 'shard', tint: 0x7df9ff }
    ];
    var self2 = this;
    pconf.forEach(function (pc) {
      var em = self2.add.particles(0, 0, 'px', {
        speed: { min: 60, max: 320 },
        lifespan: { min: 250, max: 700 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: pc.tint,
        blendMode: 'ADD',
        emitting: false
      }).setDepth(8);
      self2.parts.push(em);
    });
    // lightning / beam graphics layer
    this.fxGfx = this.add.graphics().setDepth(9);
    this.fxLines = []; // {pts, t, life, color, width}

    // collisions
    this.physics.add.overlap(this.player, this.pickupGroup(), function (pl, pk) { self.collectPickup(pk); });
  },

  pickupGroup: function () {
    // arcade overlap needs a group; build a lightweight dynamic group once
    if (!this._pkGroup) {
      this._pkGroup = this.physics.add.group();
      var self = this;
      this.pickupPool.forEach(function (p) { self._pkGroup.add(p); });
    }
    return this._pkGroup;
  },

  burst: function (x, y, kind, n) {
    var idx = { hit: 0, spark: 1, ink: 2, heal: 3, dust: 4, shard: 5 }[kind] || 0;
    this.parts[idx].explode(n || 10, x, y);
  },

  /* ================= HUD ================= */
  buildHUD: function () {
    var W = this.W, self = this;
    var hud = this.add.container(0, 0).setScrollFactor(0).setDepth(945);
    // top bar bg
    var topbg = this.add.graphics();
    topbg.fillStyle(0x0a0d22, 0.78); topbg.fillRect(0, 0, W, 118);
    topbg.fillStyle(0x4ce0ff, 0.4); topbg.fillRect(0, 118, W, 2);
    hud.add(topbg);
    // timer
    this.hudTime = this.add.text(W / 2, 20, '00:00', {
      fontFamily: 'Arial, sans-serif', fontSize: '34px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5, 0);
    this.hudGoal = this.add.text(W / 2, 58, '/ 10:00  —  SURVIVE', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#8a8fc9'
    }).setOrigin(0.5, 0);
    // hp bar
    var hpX = 16, hpY = 22, hpW = Math.min(220, W * 0.34), hpH = 18;
    var hpbg = this.add.graphics();
    hpbg.fillStyle(0x1a1f45, 1); hpbg.fillRoundedRect(hpX, hpY, hpW, hpH, 9);
    this.hudHpBar = this.add.graphics();
    this.hudHpText = this.add.text(hpX + hpW / 2, hpY + hpH / 2, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);
    // rank stars + shard progress
    this.hudRank = this.add.text(hpX, hpY + 28, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#ffc93c'
    });
    var shX = 16, shY = 74, shW = Math.min(220, W * 0.34);
    var shbg = this.add.graphics();
    shbg.fillStyle(0x1a1f45, 1); shbg.fillRoundedRect(shX, shY, shW, 10, 5);
    this.hudShardBar = this.add.graphics();
    this.hudKills = this.add.text(W - 16, 22, '0 KILLS', {
      fontFamily: 'Arial, sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#ff8a6a'
    }).setOrigin(1, 0);
    this.hudEvent = this.add.text(W - 16, 48, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#4ce0ff'
    }).setOrigin(1, 0);
    hud.add([this.hudTime, this.hudGoal, hpbg, this.hudHpBar, this.hudHpText, this.hudRank, shbg, this.hudShardBar, this.hudKills, this.hudEvent]);
    this._hpGeom = { x: hpX, y: hpY, w: hpW, h: hpH };
    this._shGeom = { x: shX, y: shY, w: shW };
    // pause button
    var pb = this.add.text(W - 16, 84, 'II', {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: 'rgba(40,46,90,0.9)', padding: { x: 14, y: 8 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    pb.on('pointerup', function () { self.togglePause(); });
    hud.add(pb);
    // aura icons row (bottom-left, small)
    this.hudAuras = this.add.container(16, this.H - 30).setScrollFactor(0).setDepth(945);
    // boss hp bar (hidden)
    this.bossBar = this.add.container(W / 2, 132).setScrollFactor(0).setDepth(946).setVisible(false);
    var bbg = this.add.graphics();
    bbg.fillStyle(0x1a0d1e, 0.9); bbg.fillRoundedRect(-W * 0.4, 0, W * 0.8, 16, 8);
    this.bossBarFill = this.add.graphics();
    this.bossBarName = this.add.text(0, -24, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ff6a6a'
    }).setOrigin(0.5);
    this.bossBar.add([bbg, this.bossBarFill, this.bossBarName]);
    this.refreshAuraIcons();
  },

  refreshAuraIcons: function () {
    var self = this;
    this.hudAuras.removeAll(true);
    var x = 0;
    this.run.auras.forEach(function (a) {
      var def = a.evo ? D.EVOLUTIONS.find(function (e) { return e.id === a.id; }) : D.auraById(a.id);
      var col = D.COLORS[a.color] || 0xffffff;
      var bg = self.add.graphics();
      bg.fillStyle(0x0a0d22, 0.8); bg.fillCircle(0, 0, 20);
      bg.lineStyle(a.evo ? 4 : 2, col, 1); bg.strokeCircle(0, 0, 20);
      var label = self.add.text(0, 0, a.evo ? '✦' : ('R' + a.rank), {
        fontFamily: 'Arial, sans-serif', fontSize: a.evo ? '20px' : '13px', fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5);
      var c = self.add.container(x, 0, [bg, label]);
      // pips for rank
      if (!a.evo) {
        for (var i = 0; i < a.rank; i++) {
          var pip = self.add.circle(-12 + i * 6, 15, 2.5, col);
          c.add(pip);
        }
      }
      self.hudAuras.add(c);
      x += 48;
    });
  },

  updateHUD: function () {
    this.hudTime.setText(D.ui.fmtTime(this.run.t));
    var g = this._hpGeom, frac = Phaser.Math.Clamp(this.hp / this.stats.maxhp, 0, 1);
    this.hudHpBar.clear();
    this.hudHpBar.fillStyle(frac > 0.35 ? 0x5cff9d : 0xff5c5c, 1);
    this.hudHpBar.fillRoundedRect(g.x, g.y, g.w * frac, g.h, 9);
    this.hudHpText.setText(Math.ceil(this.hp) + ' / ' + this.stats.maxhp);
    var need = T.rankShards[Math.min(this.run.rank, T.rankShards.length - 1)];
    var sfrac = Phaser.Math.Clamp(this.run.shardBank / need, 0, 1);
    var sg = this._shGeom;
    this.hudShardBar.clear();
    this.hudShardBar.fillStyle(0x7df9ff, 1);
    this.hudShardBar.fillRoundedRect(sg.x, sg.y, sg.w * sfrac, 10, 5);
    var stars = '';
    for (var i = 0; i < Math.min(this.run.rank, 12); i++) stars += '★';
    this.hudRank.setText('RANK ' + this.run.rank + ' ' + stars);
    this.hudKills.setText(this.run.kills + ' KILLS');
    if (this.boss && this.boss.active) {
      this.bossBar.setVisible(true);
      this.bossBarName.setText(this.boss.bName);
      var bf = Phaser.Math.Clamp(this.boss.hp / this.boss.maxhp, 0, 1);
      this.bossBarFill.clear();
      this.bossBarFill.fillStyle(0xff4c4c, 1);
      this.bossBarFill.fillRoundedRect(-this.W * 0.4, 0, this.W * 0.8 * bf, 16, 8);
    } else {
      this.bossBar.setVisible(false);
    }
  },

  handleResize: function () {
    // rebuild is heavy; instead reposition key HUD anchors
    this.W = this.scale.width; this.H = this.scale.height;
    this.moon.setPosition(this.W * 0.8, this.H * 0.15);
    this.vignette.setPosition(this.W / 2, this.H / 2).setDisplaySize(this.W * 1.5, this.H * 1.5);
    this.hudAuras.setPosition(16, this.H - 30);
    this.scene.restart({ hero: this.heroId });
  },

  /* ================= AURAS ================= */
  auraCount: function () { return this.run.auras.length; },

  addAura: function (id, silent) {
    var def = D.auraById(id);
    if (!def) return false;
    var self = this;
    // already owned -> rank up
    var owned = this.run.auras.find(function (a) { return a.id === id && !a.evo; });
    if (owned) {
      if (owned.rank < def.ranks) { owned.rank++; this.refreshAuraIcons(); }
      return true;
    }
    // fusion check: same color family already owned (non-evo)?
    var sameColor = this.run.auras.find(function (a) { return a.color === def.color && !a.evo && a.id !== id; });
    if (sameColor) {
      this.fuseAuras(sameColor, def);
      return true;
    }
    if (this.run.auras.length >= T.auraSlots) return false;
    var aura = { id: id, rank: 1, evo: false, color: def.color, t: Math.random(), blades: [], ring: null };
    this.run.auras.push(aura);
    this.setupAuraVisual(aura);
    this.refreshAuraIcons();
    if (this.run.auras.length >= 6) this.grantAch('fullbuild');
    return true;
  },

  fuseAuras: function (a1, def2) {
    var evo = D.evoByColor(def2.color);
    // remove both component auras
    [a1.id, def2.id].forEach(function (aid) {
      var i = this.run.auras.findIndex(function (a) { return a.id === aid && !a.evo; });
      if (i >= 0) { this.teardownAuraVisual(this.run.auras[i]); this.run.auras.splice(i, 1); }
    }, this);
    var aura = { id: evo.id, rank: 1, evo: true, color: evo.color, t: 0, blades: [], ring: null, evoDef: evo };
    this.run.auras.push(aura);
    this.setupAuraVisual(aura);
    this.refreshAuraIcons();
    this.run.fusedColors[evo.color] = true;
    D.audio.fuse();
    this.grantAch('fuse');
    // fanfare
    D.ui.banner(this, evo.name, 'FUSION COMPLETE — ' + evo.hint, D.COLOR_CSS[evo.color]);
    this.cameras.main.shake(220, 0.004);
    this.hitPause(90);
    var p = this.player;
    for (var i = 0; i < 3; i++) this.burst(p.x + (Math.random() - 0.5) * 120, p.y + (Math.random() - 0.5) * 120, 'spark', 14);
    this.fxFlash(D.COLORS[evo.color]);
  },

  setupAuraVisual: function (aura) {
    var p = this.player;
    if (aura.evo) {
      // evolved: big orbiting blades visual per color
      aura.blades = [];
      var n = 5;
      for (var i = 0; i < n; i++) {
        var b = this.add.image(p.x, p.y, 'blade_' + aura.color).setDepth(9).setScale(1.5);
        b._ang = i / n * Math.PI * 2;
        aura.blades.push(b);
      }
      return;
    }
    var def = D.auraById(aura.id);
    if (def.kind === 'orbit') {
      aura.blades = [];
      var n2 = this.auraStat(aura, 'count');
      for (var j = 0; j < n2; j++) {
        var b2 = this.add.image(p.x, p.y, 'blade_' + aura.color).setDepth(9);
        b2._ang = j / n2 * Math.PI * 2;
        aura.blades.push(b2);
      }
    } else if (def.kind === 'ring') {
      aura.ring = this.add.image(p.x, p.y, 'novaring').setDepth(4).setTint(D.COLORS[aura.color]).setAlpha(0.5);
      aura.ring.setScale(this.auraStat(aura, 'radius') / 64);
    }
  },

  teardownAuraVisual: function (aura) {
    (aura.blades || []).forEach(function (b) { b.destroy(); });
    aura.blades = [];
    if (aura.ring) { aura.ring.destroy(); aura.ring = null; }
  },

  auraStat: function (aura, key) {
    // effective stat for aura/evo at its rank
    var base, per;
    if (aura.evo) {
      var table = {
        evoGold:   { dmg: 46, count: 5, radius: 150, cd: 2.6, jumps: 4 },
        evoViolet: { dmg: 70, radius: 260, cd: 3.2, count: 1 },
        evoCyan:   { dmg: 34, jumps: 7, cd: 1.1, radius: 210, slow: 0.5 },
        evoEmber:  { dmg: 55, count: 6, aoe: 110, cd: 1.6 },
        evoJade:   { dmg: 30, count: 4, aoe: 95, cd: 1.4, knock: 520 },
        evoRose:   { dmg: 60, count: 2, length: 520, width: 70, cd: 1.7 }
      };
      return table[aura.id][key];
    }
    var def = D.auraById(aura.id);
    base = def[key]; per = (def.perRank && def.perRank[key]) || 0;
    return base + per * (aura.rank - 1);
  },

  addPassive: function (id) {
    var def = D.passiveById(id);
    var cur = this.run.passives[id] || 0;
    if (cur >= def.max) return false;
    if (!cur && Object.keys(this.run.passives).length >= T.passiveSlots) return false;
    this.run.passives[id] = cur + 1;
    var oldMax = this.stats.maxhp;
    this.stats = this.computeStats();
    if (this.stats.maxhp > oldMax) this.hp += (this.stats.maxhp - oldMax);
    return true;
  },

  /* fire one aura (called when its cooldown elapses) */
  fireAura: function (aura) {
    var p = this.player, px = p.x, py = p.y;
    if (aura.evo) { this.fireEvo(aura); return; }
    var def = D.auraById(aura.id);
    var dmg = this.auraStat(aura, 'dmg') * this.stats.dmgMul;
    var tgt = this.nearestEnemy(px, py, 760);
    switch (def.kind) {
      case 'proj': {
        if (!tgt) break;
        var n = this.auraStat(aura, 'count');
        for (var i = 0; i < n; i++) {
          var a = Math.atan2(tgt.y - py, tgt.x - px) + (i - (n - 1) / 2) * 0.14;
          this.spawnShot(px, py, a, this.auraStat(aura, 'speed'), dmg, {
            key: 'proj_' + aura.color, pierce: this.auraStat(aura, 'pierce'), color: aura.color, kind: 'proj', size: 1.1
          });
        }
        D.audio.shoot('proj'); break;
      }
      case 'homing': {
        var n2 = this.auraStat(aura, 'count');
        for (var i2 = 0; i2 < n2; i2++) {
          var a2 = Math.random() * Math.PI * 2;
          this.spawnShot(px, py, a2, this.auraStat(aura, 'speed') * 0.6, dmg, {
            key: 'proj_' + aura.color, pierce: 0, color: aura.color, kind: 'homing',
            homing: true, aoe: this.auraStat(aura, 'aoe'), size: 1.2,
            burn: this.auraStat(aura, 'burn') || 0
          });
        }
        D.audio.shoot('homing'); break;
      }
      case 'nova': {
        var radius = this.auraStat(aura, 'radius');
        var ring = this.add.image(px, py, 'novaring').setDepth(8).setTint(D.COLORS[aura.color]);
        ring.setScale(0.2);
        this.tweens.add({ targets: ring, scaleX: radius / 64, scaleY: radius / 64, alpha: 0, duration: 420, ease: 'Cubic.easeOut', onComplete: function () { ring.destroy(); } });
        this.damageArea(px, py, radius, dmg, { knock: 260, stun: this.auraStat(aura, 'stun'), color: aura.color, src: 'nova' });
        this.burst(px, py, 'spark', 16);
        D.audio.shoot('nova');
        this.cameras.main.shake(90, 0.0018);
        break;
      }
      case 'bolt': {
        var jumps = this.auraStat(aura, 'jumps'), range = this.auraStat(aura, 'range');
        var cur = tgt, fromX = px, fromY = py, hitSet = {}, pts = [[px, py]];
        var jdmg = dmg;
        for (var jn = 0; jn < jumps && cur; jn++) {
          pts.push([cur.x, cur.y]);
          this.damageEnemy(cur, jdmg, { color: aura.color, src: 'bolt', knock: 120, kx: cur.x - fromX, ky: cur.y - fromY });
          hitSet[cur._eid] = true;
          fromX = cur.x; fromY = cur.y;
          cur = this.nearestEnemy(fromX, fromY, range, hitSet);
          jdmg *= 0.85;
        }
        if (pts.length > 1) this.fxLines.push({ pts: pts, t: 0, life: 0.22, color: D.COLORS[aura.color], width: 5 });
        this.burst(px, py, 'spark', 6);
        D.audio.shoot('bolt'); break;
      }
      case 'ring': break; // handled as persistent aura in update
      case 'meteor': {
        var n3 = this.auraStat(aura, 'count');
        for (var i3 = 0; i3 < n3; i3++) {
          var te = this.randomEnemy(900);
          if (!te) break;
          this.meteorStrike(te.x, te.y, dmg, this.auraStat(aura, 'aoe'), aura.color);
        }
        D.audio.shoot('meteor'); break;
      }
      case 'beam': {
        var aim = this.aimDir();
        var len = this.auraStat(aura, 'length'), wdt = this.auraStat(aura, 'width');
        var ex = px + Math.cos(aim) * len, ey = py + Math.sin(aim) * len;
        this.fxLines.push({ pts: [[px, py], [ex, ey]], t: 0, life: 0.28, color: D.COLORS[aura.color], width: wdt * 0.5, beam: true });
        this.damageBeam(px, py, aim, len, wdt, dmg, { color: aura.color, src: 'beam' });
        D.audio.shoot('beam'); break;
      }
      case 'gust': {
        var aim2 = this.aimDir();
        var arc = this.auraStat(aura, 'arc'), kn = this.auraStat(aura, 'knock');
        var gust = this.add.image(px, py, 'gust').setDepth(8).setTint(D.COLORS[aura.color]);
        gust.setRotation(aim2 - Math.PI / 2 - 0.35);
        gust.setScale(1.4); gust.setAlpha(0.9);
        this.tweens.add({ targets: gust, alpha: 0, scaleX: 2.2, scaleY: 2.2, duration: 380, onComplete: function () { gust.destroy(); } });
        this.damageCone(px, py, aim2, arc, 380, dmg, { knock: kn, color: aura.color, src: 'gust' });
        D.audio.shoot('gust');
        this.cameras.main.shake(80, 0.0015);
        break;
      }
      case 'thorns': {
        var n4 = this.auraStat(aura, 'count');
        var near = this.nearestEnemies(px, py, 520, n4);
        near.forEach(function (e) {
          var th = this.add.image(e.x, e.y + 10, 'thorn').setDepth(8).setScale(0.2).setAlpha(0.95);
          this.tweens.add({ targets: th, scaleX: 1.3, scaleY: 1.3, duration: 160, ease: 'Back.easeOut' });
          this.tweens.add({ targets: th, alpha: 0, scaleY: 0.4, duration: 260, delay: 220, onComplete: function () { th.destroy(); } });
          this.time.delayedCall(140, function () {
            this.damageArea(e.x, e.y, this.auraStat(aura, 'aoe'), dmg, { color: aura.color, src: 'thorns', knock: 200 });
            this.burst(e.x, e.y, 'hit', 8);
          }, null, this);
        }, this);
        D.audio.shoot('thorns'); break;
      }
      case 'spray': {
        var aim3 = this.aimDir();
        var n5 = this.auraStat(aura, 'count'), spread = this.auraStat(aura, 'spread');
        for (var i5 = 0; i5 < n5; i5++) {
          var a5 = aim3 + (i5 - (n5 - 1) / 2) * (spread / Math.max(1, n5 - 1)) + (Math.random() - 0.5) * 0.06;
          this.spawnShot(px, py, a5, this.auraStat(aura, 'speed'), dmg, {
            key: 'proj_' + aura.color, pierce: this.auraStat(aura, 'pierce'), color: aura.color, kind: 'spray', size: 0.85
          });
        }
        D.audio.shoot('spray'); break;
      }
      case 'orbit': break; // continuous, handled in update
    }
  },

  fireEvo: function (aura) {
    var p = this.player, px = p.x, py = p.y;
    var dmg = this.auraStat(aura, 'dmg') * this.stats.dmgMul;
    switch (aura.id) {
      case 'evoGold': { // crown blades handled in update; here: sun lance rain
        var n = 4;
        for (var i = 0; i < n; i++) {
          var te = this.randomEnemy(800); if (!te) break;
          this.meteorStrike(te.x, te.y, dmg * 0.8, 90, 'gold', true);
        }
        D.audio.shoot('evo'); break;
      }
      case 'evoViolet': { // collapsing star: drag + crush
        var radius = this.auraStat(aura, 'radius');
        var ring = this.add.image(px, py, 'novaring').setDepth(8).setTint(D.COLORS.violet).setScale(0.3);
        this.tweens.add({ targets: ring, scaleX: radius / 64 * 1.4, scaleY: radius / 64 * 1.4, alpha: 0, duration: 700, ease: 'Cubic.easeOut', onComplete: function () { ring.destroy(); } });
        // drag enemies toward player then damage
        this.forEachEnemy(px, py, radius * 1.4, function (e) {
          var a = Math.atan2(py - e.y, px - e.x);
          e.knx += Math.cos(a) * 620; e.kny += Math.sin(a) * 620;
        });
        this.time.delayedCall(350, function () {
          this.damageArea(px, py, radius, dmg, { color: 'violet', src: 'evo', knock: 300 });
          this.burst(px, py, 'ink', 26);
          this.cameras.main.shake(160, 0.003);
        }, null, this);
        D.audio.shoot('evo'); break;
      }
      case 'evoCyan': { // storm: instant multi-chain
        var cur = this.nearestEnemy(px, py, 700), jumps = this.auraStat(aura, 'jumps'), hitSet = {};
        var fromX = px, fromY = py, pts = [[px, py]], jd = dmg;
        for (var j = 0; j < jumps && cur; j++) {
          pts.push([cur.x, cur.y]);
          this.damageEnemy(cur, jd, { color: 'cyan', src: 'evo', knock: 100, kx: cur.x - fromX, ky: cur.y - fromY });
          hitSet[cur._eid] = true; fromX = cur.x; fromY = cur.y;
          cur = this.nearestEnemy(fromX, fromY, 300, hitSet); jd *= 0.9;
        }
        if (pts.length > 1) this.fxLines.push({ pts: pts, t: 0, life: 0.3, color: D.COLORS.cyan, width: 7 });
        D.audio.shoot('bolt'); break;
      }
      case 'evoEmber': { // meteor storm
        var n2 = this.auraStat(aura, 'count');
        for (var i2 = 0; i2 < n2; i2++) {
          var te2 = this.randomEnemy(900); if (!te2) break;
          this.meteorStrike(te2.x + (Math.random() - 0.5) * 120, te2.y + (Math.random() - 0.5) * 120, dmg, this.auraStat(aura, 'aoe'), 'ember');
        }
        D.audio.shoot('meteor'); break;
      }
      case 'evoJade': { // thorn tornadoes at random nearby enemies
        var n3 = this.auraStat(aura, 'count');
        var near = this.nearestEnemies(px, py, 620, n3);
        near.forEach(function (e) {
          var tor = this.add.image(e.x, e.y, 'gust').setDepth(8).setTint(D.COLORS.jade).setScale(0.6).setAlpha(0.9);
          this.tweens.add({ targets: tor, angle: 360, scaleX: 1.6, scaleY: 1.6, alpha: 0, duration: 900, onComplete: function () { tor.destroy(); } });
          this.damageArea(e.x, e.y, this.auraStat(aura, 'aoe'), dmg, { color: 'jade', src: 'evo', knock: this.auraStat(aura, 'knock') });
        }, this);
        D.audio.shoot('gust'); break;
      }
      case 'evoRose': { // twin sweeping beams + spiral spray
        var base = this.aimDir() + Math.sin(this.run.t * 2.2) * 0.5;
        for (var b = -1; b <= 1; b += 2) {
          var aim = base + b * 0.22, len = this.auraStat(aura, 'length'), wdt = this.auraStat(aura, 'width');
          var ex = px + Math.cos(aim) * len, ey = py + Math.sin(aim) * len;
          this.fxLines.push({ pts: [[px, py], [ex, ey]], t: 0, life: 0.35, color: D.COLORS.rose, width: wdt * 0.5, beam: true });
          this.damageBeam(px, py, aim, len, wdt, dmg * 0.7, { color: 'rose', src: 'evo' });
        }
        for (var s = 0; s < 10; s++) {
          var sa = s / 10 * Math.PI * 2 + this.run.t;
          this.spawnShot(px, py, sa, 420, dmg * 0.4, { key: 'proj_rose', pierce: 2, color: 'rose', kind: 'spray', size: 0.8 });
        }
        D.audio.shoot('beam'); break;
      }
    }
  },

  meteorStrike: function (x, y, dmg, aoe, color, lance) {
    var tele = this.add.image(x, y, 'telegraph').setDepth(4).setTint(D.COLORS[color]).setAlpha(0.8);
    tele.setScale((aoe * 2) / 128);
    this.tweens.add({ targets: tele, alpha: 0.25, duration: 380, yoyo: true, repeat: 1 });
    this.time.delayedCall(480, function () {
      tele.destroy();
      var m = this.add.image(x, y - 260, lance ? 'blade_' + color : 'meteor').setDepth(9);
      if (lance) { m.setRotation(Math.PI / 2).setScale(1.6); }
      this.tweens.add({
        targets: m, y: y, duration: 170, ease: 'Cubic.easeIn',
        onComplete: function () {
          m.destroy();
          this.damageArea(x, y, aoe, dmg, { color: color, src: 'meteor', knock: 320 });
          this.burst(x, y, 'spark', 18); this.burst(x, y, 'dust', 10);
          D.audio.explode();
          this.cameras.main.shake(110, 0.0022);
          this.fxFlash(D.COLORS[color], 0.12);
        }, callbackScope: this
      });
    }, null, this);
  },

  fxFlash: function (color, alpha) {
    if (this._flash) this._flash.destroy();
    this._flash = this.add.rectangle(0, 0, this.W, this.H, color, alpha || 0.18).setOrigin(0).setScrollFactor(0).setDepth(935);
    this.tweens.add({ targets: this._flash, alpha: 0, duration: 320, onComplete: function () { if (this._flash) { this._flash.destroy(); this._flash = null; } }, callbackScope: this });
  },

  aimDir: function () {
    // desktop mouse aim if recently moved, else nearest enemy, else movement dir
    var p = this.player;
    if (this.run.t - this.mouseAim.t < 2.5) {
      return Math.atan2(this.mouseAim.y - p.y, this.mouseAim.x - p.x);
    }
    var t = this.nearestEnemy(p.x, p.y, 900);
    if (t) return Math.atan2(t.y - p.y, t.x - p.x);
    return this.moveAng;
  },

  /* ================= ENEMIES ================= */
  _eidCounter: 1,

  spawnEnemy: function (typeId, x, y, elite) {
    var def = D.enemyById(typeId);
    if (!def) return null;
    if (this.activeEnemies.length >= 120) return null;
    var s = null;
    for (var i = 0; i < this.enemyPool.length; i++) {
      if (!this.enemyPool[i].getData('used')) { s = this.enemyPool[i]; break; }
    }
    if (!s) return null;
    var hpMul = 1 + this.run.t / 600 * 1.6 + Math.pow(this.run.t / 60, 1.35) * 0.12;
    var dmgMul = 1 + this.run.t / 600 * 0.7;
    if (elite) { hpMul *= 6; dmgMul *= 1.4; }
    s.setData('used', true);
    s.setTexture('enemy_' + def.id + (elite ? '_elite' : ''));
    s.setPosition(x, y).setVisible(true).setActive(true).setDepth(6);
    s.setScale(1).setAlpha(1);
    var sc = elite ? 1.3 : 1;
    s.body.setCircle(def.r * 0.8 * sc, s.width / 2 - def.r * 0.8 * sc, s.height / 2 - def.r * 0.8 * sc);
    s.body.setCollideWorldBounds(true);
    s._eid = this._eidCounter++;
    s.etype = def.id; s.edef = def;
    s.maxhp = s.hp = def.hp * hpMul;
    s.dmg = def.dmg * dmgMul;
    s.speed = def.speed * (0.92 + Math.random() * 0.16);
    s.r = def.r * sc;
    s.elite = !!elite;
    s.knx = 0; s.kny = 0;
    s.flashT = 0; s.wob = Math.random() * 6.28;
    s.behavior = def.behavior;
    s.stateT = Math.random() * 2; s.state = 0; // behavior state machine
    s.touchT = 0; // per-enemy player contact cooldown
    s.hitSet = {}; // per-orbit-hit cooldowns handled via hitT
    s.hitT = 0;
    s.stun = 0; s.slow = 0; s.slowT = 0; s.burn = 0; s.burnT = 0;
    s.burrowed = false;
    this.burst(x, y, 'ink', elite ? 16 : 7);
    this.activeEnemies.push(s);
    return s;
  },

  killEnemy: function (s, quiet) {
    var idx = this.activeEnemies.indexOf(s);
    if (idx < 0) return;
    this.activeEnemies.splice(idx, 1);
    s.setData('used', false);
    s.setVisible(false).setActive(false).setPosition(-100, -100);
    if (s.body) s.body.stop();
    if (quiet) return;
    this.run.kills++;
    if (this.run.kills === 1) this.grantAch('firstblood');
    if (this.run.kills === 100) this.grantAch('kill100');
    if (this.run.kills === 500) this.grantAch('kill500');
    if (s.isBoss) this.onBossDead(s);
    // lifesteal relic
    if (this.stats.lifesteal > 0 && this.run.kills % this.stats.lifesteal === 0) this.healPlayer(1);
    // splitter spawns bits
    if (s.behavior === 'split' && !s.elite) {
      for (var i = 0; i < 2; i++) {
        var b = this.spawnEnemy('splitling', s.x + (Math.random() - 0.5) * 40, s.y + (Math.random() - 0.5) * 40, false);
        if (b) { b.knx = (Math.random() - 0.5) * 500; b.kny = (Math.random() - 0.5) * 500; }
      }
    }
    // drops
    var n = s.edef.shards * (s.elite ? 4 : 1);
    if (s.isBoss) n = 40;
    for (var d = 0; d < n; d++) this.dropPickup(s.x + (Math.random() - 0.5) * 30, s.y + (Math.random() - 0.5) * 30, 'shard');
    if (s.elite && Math.random() < 0.5) this.dropPickup(s.x, s.y, 'heart');
    if (s.isBoss) {
      for (var h = 0; h < 3; h++) this.dropPickup(s.x + (Math.random() - 0.5) * 90, s.y + (Math.random() - 0.5) * 90, 'heart');
      this.dropPickup(s.x, s.y, 'star');
    } else if (Math.random() < 0.012) {
      this.dropPickup(s.x, s.y, 'heart');
    }
    if (!quiet) {
      this.burst(s.x, s.y, 'ink', s.elite ? 22 : 10);
      this.burst(s.x, s.y, 'spark', 6);
      D.audio.hit(s.elite || s.isBoss);
    }
  },

  damageEnemy: function (s, dmg, opts) {
    if (!s || !s.active || s.getData('used') === false) return;
    if (s.burrowed) return;
    opts = opts || {};
    // shielded: frontal block vs projectiles
    if (s.behavior === 'shield' && (opts.src === 'proj' || opts.src === 'spray' || opts.src === 'homing')) {
      var toAtk = Math.atan2((opts.ay || this.player.y) - s.y, (opts.ax || this.player.x) - s.x);
      var facing = Math.atan2(this.player.y - s.y, this.player.x - s.x);
      var diff = Math.abs(Phaser.Math.Angle.Wrap(toAtk - facing));
      if (diff > Math.PI / 2.4) { dmg *= 0.25; this.burst(s.x, s.y, 'hit', 3); }
    }
    var crit = Math.random() < this.stats.crit;
    if (crit) dmg *= 2;
    dmg = Math.max(1, dmg);
    s.hp -= dmg;
    s.flashT = 0.09;
    this.dmgNums.spawn(s.x, s.y - s.r, dmg, crit ? '#ffc93c' : (opts.color ? D.COLOR_CSS[opts.color] : '#ffffff'), crit);
    if (opts.knock) {
      var ka = Math.atan2(opts.ky || 0, opts.kx || 1);
      var resist = s.behavior === 'brute' || s.isBoss ? 0.25 : 1;
      s.knx += Math.cos(ka) * opts.knock * resist;
      s.kny += Math.sin(ka) * opts.knock * resist;
    }
    if (opts.stun) s.stun = Math.max(s.stun, opts.stun);
    if (this.stats.chill > 0) { s.slow = Math.max(s.slow, this.stats.chill); s.slowT = 1.2; }
    if (opts.burn) { s.burn = Math.max(s.burn, opts.burn); s.burnT = 3; }
    if (opts.slow) { s.slow = Math.max(s.slow, opts.slow); s.slowT = 1.5; }
    this.burst(s.x, s.y, 'hit', crit ? 8 : 4);
    if (s.hp <= 0) {
      this.killEnemy(s);
      // juicy big-kill pause
      if (s.elite || s.isBoss) this.hitPause(s.isBoss ? 160 : 60);
    } else {
      D.audio.hit(false);
    }
  },

  damageArea: function (x, y, radius, dmg, opts) {
    opts = opts || {};
    var r2 = radius * radius;
    var list = this.activeEnemies.slice();
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var dx = e.x - x, dy = e.y - y;
      if (dx * dx + dy * dy <= r2) {
        this.damageEnemy(e, dmg * (0.9 + Math.random() * 0.2), {
          color: opts.color, src: opts.src, knock: opts.knock,
          kx: dx, ky: dy, stun: opts.stun
        });
      }
    }
  },

  damageCone: function (x, y, ang, arc, range, dmg, opts) {
    opts = opts || {};
    var list = this.activeEnemies.slice();
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy);
      if (d > range) continue;
      var da = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - ang));
      if (da < arc / 2) {
        this.damageEnemy(e, dmg, { color: opts.color, src: opts.src, knock: opts.knock, kx: dx, ky: dy });
      }
    }
  },

  damageBeam: function (x, y, ang, len, width, dmg, opts) {
    opts = opts || {};
    var dx = Math.cos(ang), dy = Math.sin(ang);
    var list = this.activeEnemies.slice();
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var rx = e.x - x, ry = e.y - y;
      var along = rx * dx + ry * dy;
      if (along < 0 || along > len) continue;
      var perp = Math.abs(rx * dy - ry * dx);
      if (perp < width / 2 + e.r) {
        this.damageEnemy(e, dmg, { color: opts.color, src: opts.src, knock: 150, kx: dx, ky: dy });
      }
    }
  },

  forEachEnemy: function (x, y, radius, cb) {
    var r2 = radius * radius, list = this.activeEnemies.slice();
    for (var i = 0; i < list.length; i++) {
      var e = list[i], dx = e.x - x, dy = e.y - y;
      if (dx * dx + dy * dy <= r2) cb(e);
    }
  },

  nearestEnemy: function (x, y, maxD, exclude) {
    var best = null, bd = maxD * maxD;
    var list = this.activeEnemies;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.burrowed) continue;
      if (exclude && exclude[e._eid]) continue;
      var dx = e.x - x, dy = e.y - y, d2 = dx * dx + dy * dy;
      if (d2 < bd) { bd = d2; best = e; }
    }
    return best;
  },

  nearestEnemies: function (x, y, maxD, n) {
    var scored = [], md2 = maxD * maxD, list = this.activeEnemies;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.burrowed) continue;
      var dx = e.x - x, dy = e.y - y, d2 = dx * dx + dy * dy;
      if (d2 < md2) scored.push([d2, e]);
    }
    scored.sort(function (a, b) { return a[0] - b[0]; });
    return scored.slice(0, n).map(function (s) { return s[1]; });
  },

  randomEnemy: function (maxD) {
    var p = this.player, cands = [], md2 = maxD * maxD;
    for (var i = 0; i < this.activeEnemies.length; i++) {
      var e = this.activeEnemies[i];
      if (e.burrowed) continue;
      var dx = e.x - p.x, dy = e.y - p.y;
      if (dx * dx + dy * dy < md2) cands.push(e);
    }
    return cands.length ? cands[(Math.random() * cands.length) | 0] : null;
  },

  /* ---------- per-enemy AI ---------- */
  updateEnemy: function (e, dt) {
    var p = this.player;
    var dx = p.x - e.x, dy = p.y - e.y;
    var dist = Math.hypot(dx, dy) || 1;
    var nx = dx / dist, ny = dy / dist;
    var sp = e.speed;
    if (e.slowT > 0) { sp *= (1 - e.slow); e.slowT -= dt; }
    if (e.stun > 0) { e.stun -= dt; sp = 0; }
    if (e.burnT > 0) { e.burnT -= dt; e.burnTick = (e.burnTick || 0) + dt; if (e.burnTick > 0.5) { e.burnTick = 0; e.hp -= e.burn; this.burst(e.x, e.y, 'spark', 3); if (e.hp <= 0) { this.killEnemy(e); return; } } }

    var mvx = 0, mvy = 0;
    e.stateT -= dt;
    switch (e.behavior) {
      case 'chase': case 'brute':
        mvx = nx * sp; mvy = ny * sp; break;
      case 'swarm':
        mvx = nx * sp; mvy = ny * sp;
        // slight weave
        var wv = Math.sin(this.run.t * 5 + e.wob) * 40;
        mvx += -ny * wv; mvy += nx * wv; break;
      case 'dash':
        if (e.state === 0) { // approach
          mvx = nx * sp; mvy = ny * sp;
          if (dist < 260 && e.stateT <= 0) { e.state = 1; e.stateT = 0.55; e.flashT = 0.55; D.audio.shoot('bolt'); }
        } else { // telegraph then dash
          mvx = nx * sp * 0.2; mvy = ny * sp * 0.2;
          if (e.stateT <= 0) {
            e.state = 0; e.stateT = 1.6 + Math.random();
            e.knx += nx * 900; e.kny += ny * 900;
            this.burst(e.x, e.y, 'dust', 8);
          }
        }
        break;
      case 'split':
        mvx = nx * sp; mvy = ny * sp; break;
      case 'spit':
        if (dist > 340) { mvx = nx * sp; mvy = ny * sp; }
        else if (dist < 220) { mvx = -nx * sp; mvy = -ny * sp; }
        if (e.stateT <= 0 && dist < 620) {
          e.stateT = 2.2 + Math.random();
          this.enemyShoot(e.x, e.y, Math.atan2(dy, dx), 260, e.dmg * 0.7);
        }
        break;
      case 'shield':
        mvx = nx * sp; mvy = ny * sp;
        e.rotation = Math.atan2(dy, dx) - Math.PI / 2; // face player (crab texture faces up)
        break;
      case 'burrow':
        if (e.state === 0) { // above ground, walking
          mvx = nx * sp; mvy = ny * sp;
          if (dist < 420 && e.stateT <= 0) {
            e.state = 1; e.stateT = 1.4; e.burrowed = true;
            this.tweens.add({ targets: e, alpha: 0.25, scaleX: 0.7, scaleY: 0.7, duration: 300 });
            this.burst(e.x, e.y, 'dust', 12);
          }
        } else { // burrowed: fast move toward player
          mvx = nx * sp * 2.4; mvy = ny * sp * 2.4;
          if (Math.random() < dt * 8) this.burst(e.x, e.y, 'dust', 2);
          if (e.stateT <= 0 || dist < 50) {
            e.state = 0; e.stateT = 2.5 + Math.random(); e.burrowed = false;
            this.tweens.add({ targets: e, alpha: 1, scaleX: 1, scaleY: 1, duration: 260, ease: 'Back.easeOut' });
            this.burst(e.x, e.y, 'dust', 14);
            D.audio.hit(true);
            if (dist < 90) this.hurtPlayer(Math.round(e.dmg * 1.2));
          }
        }
        break;
      case 'orbit': // willo: circle at range, snipe
        var want = 300;
        var radial = dist > want + 40 ? 1 : (dist < want - 40 ? -1 : 0);
        var tang = e._dir || (e._dir = Math.random() < 0.5 ? 1 : -1);
        mvx = nx * sp * radial + (-ny) * sp * 0.9 * tang;
        mvy = ny * sp * radial + (nx) * sp * 0.9 * tang;
        if (e.stateT <= 0 && dist < 560) {
          e.stateT = 2.6 + Math.random();
          this.enemyShoot(e.x, e.y, Math.atan2(dy, dx), 300, e.dmg * 0.8);
        }
        break;
      case 'leap':
        if (e.state === 0) {
          mvx = nx * sp * 0.4; mvy = ny * sp * 0.4;
          if (e.stateT <= 0 && dist < 480) {
            e.state = 1; e.stateT = 0.5;
            e._jx = nx; e._jy = ny;
            this.tweens.add({ targets: e, scaleY: 0.6, duration: 180 });
          }
        } else {
          var jp = 1 - e.stateT / 0.5;
          mvx = e._jx * sp * 3.2 * Math.sin(jp * Math.PI);
          mvy = e._jy * sp * 3.2 * Math.sin(jp * Math.PI);
          e.scaleY = 1 + Math.sin(jp * Math.PI) * 0.5;
          if (e.stateT <= 0) { e.state = 0; e.stateT = 1.2 + Math.random() * 0.8; e.scaleY = 1; this.burst(e.x, e.y, 'dust', 6); }
        }
        break;
    }

    // knockback decay + integrate
    e.knx *= Math.pow(0.02, dt); e.kny *= Math.pow(0.02, dt);
    if (Math.abs(e.knx) < 4) e.knx = 0;
    if (Math.abs(e.kny) < 4) e.kny = 0;
    e.x += (mvx + e.knx) * dt; e.y += (mvy + e.kny) * dt;
    e.x = Phaser.Math.Clamp(e.x, 20, this.worldSize - 20);
    e.y = Phaser.Math.Clamp(e.y, 20, this.worldSize - 20);

    // wobble squash-stretch
    e.wob += dt * (4 + sp / 60);
    var w = 1 + Math.sin(e.wob) * 0.09;
    if (e.behavior !== 'leap' || e.state === 0) e.setScale(w, 2 - w > 0 ? (1 / w) : 1);
    if (e.behavior !== 'shield') e.rotation += Math.sin(e.wob * 0.7) * 0.02;

    // hit flash
    if (e.flashT > 0 && e.behavior !== 'dash') {
      e.flashT -= dt;
      e.setTintFill(0xffffff);
      if (e.flashT <= 0) e.clearTint();
    } else if (e.behavior === 'dash' && e.state === 1) {
      e.setTint(0xff2222); // telegraph red
    } else if (e.flashT <= 0) {
      e.clearTint();
    }

    // separation (spatial hash does broadphase in main update; here cheap local push skipped)
    // touch damage
    e.touchT -= dt;
    if (dist < e.r + 24 && e.touchT <= 0 && !e.burrowed) {
      e.touchT = 0.7;
      this.hurtPlayer(Math.round(e.dmg));
      // thornmail
      if (this.stats.thorns > 0) this.damageEnemy(e, this.stats.thorns, { color: 'jade', src: 'thorns' });
      var pa = Math.atan2(e.y - p.y, e.x - p.x);
      e.knx += Math.cos(pa) * 260; e.kny += Math.sin(pa) * 260;
    }
    if (e.body) { e.body.updateFromGameObject(); }
  },

  /* spatial separation pass */
  separateEnemies: function () {
    var cell = 96, grid = {}, list = this.activeEnemies;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var k = Math.floor(e.x / cell) + Math.floor(e.y / cell) * 4096;
      (grid[k] = grid[k] || []).push(e);
    }
    for (var i2 = 0; i2 < list.length; i2++) {
      var a = list[i2];
      var cx = Math.floor(a.x / cell), cy = Math.floor(a.y / cell);
      for (var gx = cx - 1; gx <= cx + 1; gx++) for (var gy = cy - 1; gy <= cy + 1; gy++) {
        var arr = grid[gx + gy * 4096]; if (!arr) continue;
        for (var j = 0; j < arr.length; j++) {
          var b = arr[j];
          if (b._eid <= a._eid) continue;
          var dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
          var d2 = dx * dx + dy * dy;
          if (d2 < rr * rr && d2 > 0.01) {
            var d = Math.sqrt(d2), push = (rr - d) * 0.35;
            var pxn = dx / d, pyn = dy / d;
            a.x -= pxn * push; a.y -= pyn * push;
            b.x += pxn * push; b.y += pyn * push;
          }
        }
      }
    }
  },

  enemyShoot: function (x, y, ang, speed, dmg) {
    var s = null;
    for (var i = 0; i < this.espitPool.length; i++) {
      if (!this.espitPool[i].getData('used')) { s = this.espitPool[i]; break; }
    }
    if (!s) return;
    s.setData('used', true);
    s.setPosition(x, y).setVisible(true).setActive(true);
    s._vx = Math.cos(ang) * speed; s._vy = Math.sin(ang) * speed;
    s._dmg = dmg; s._life = 3.2;
    s.body.setCircle(8, 4, 4);
    D.audio.shoot('homing');
  },

  updateEspits: function (dt) {
    var p = this.player;
    for (var i = 0; i < this.espitPool.length; i++) {
      var s = this.espitPool[i];
      if (!s.getData('used')) continue;
      s._life -= dt;
      s.x += s._vx * dt; s.y += s._vy * dt;
      s.rotation += dt * 6;
      var dx = s.x - p.x, dy = s.y - p.y;
      var dead = s._life <= 0 || s.x < 0 || s.y < 0 || s.x > this.worldSize || s.y > this.worldSize;
      if (!dead && dx * dx + dy * dy < 26 * 26) {
        this.hurtPlayer(Math.round(s._dmg));
        dead = true;
        this.burst(s.x, s.y, 'hit', 6);
      }
      if (dead) {
        s.setData('used', false); s.setVisible(false).setActive(false).setPosition(-100, -100);
      }
    }
  },

  /* ================= PLAYER PROJECTILES ================= */
  spawnShot: function (x, y, ang, speed, dmg, opts) {
    var s = null;
    for (var i = 0; i < this.shotPool.length; i++) {
      if (!this.shotPool[i].getData('used')) { s = this.shotPool[i]; break; }
    }
    if (!s) return;
    s.setData('used', true);
    s.setTexture(opts.key || 'proj_gold').setPosition(x, y).setVisible(true).setActive(true).setDepth(7);
    s.setScale(opts.size || 1).setRotation(ang);
    if (opts.blend !== false) s.setBlendMode(Phaser.BlendModes.ADD);
    s._vx = Math.cos(ang) * speed; s._vy = Math.sin(ang) * speed;
    s._dmg = dmg; s._pierce = opts.pierce || 0; s._life = 2.2;
    s._color = opts.color; s._src = opts.kind; s._homing = !!opts.homing;
    s._aoe = opts.aoe || 0; s._burn = opts.burn || 0;
    s._hitSet = {};
    s._turn = opts.homing ? 6 : 0;
    s.body.setCircle(10, 6, 6);
    if (s.body) s.body.updateFromGameObject();
  },

  updateShots: function (dt) {
    for (var i = 0; i < this.shotPool.length; i++) {
      var s = this.shotPool[i];
      if (!s.getData('used')) continue;
      s._life -= dt;
      if (s._homing) {
        var t = this.nearestEnemy(s.x, s.y, 700, s._hitSet);
        if (t) {
          var want = Math.atan2(t.y - s.y, t.x - s.x);
          var cur = Math.atan2(s._vy, s._vx);
          var na = Phaser.Math.Angle.RotateTo(cur, want, s._turn * dt);
          var sp = Math.hypot(s._vx, s._vy);
          s._vx = Math.cos(na) * sp; s._vy = Math.sin(na) * sp;
          s.setRotation(na);
        }
      }
      s.x += s._vx * dt; s.y += s._vy * dt;
      var dead = s._life <= 0 || s.x < -50 || s.y < -50 || s.x > this.worldSize + 50 || s.y > this.worldSize + 50;
      if (!dead) {
        // collide with enemies (broadphase via activeEnemies, fine at this scale)
        var list = this.activeEnemies;
        for (var j = 0; j < list.length; j++) {
          var e = list[j];
          if (e.burrowed || s._hitSet[e._eid]) continue;
          var dx = e.x - s.x, dy = e.y - s.y, rr = e.r + 12;
          if (dx * dx + dy * dy < rr * rr) {
            s._hitSet[e._eid] = true;
            this.damageEnemy(e, s._dmg, {
              color: s._color, src: s._src, ax: s.x - s._vx * 0.05, ay: s.y - s._vy * 0.05,
              knock: 160, kx: s._vx, ky: s._vy, burn: s._burn
            });
            if (s._aoe > 0) {
              this.damageArea(s.x, s.y, s._aoe, s._dmg * 0.8, { color: s._color, src: 'homing', knock: 240 });
              this.burst(s.x, s.y, 'spark', 12);
              dead = true; break;
            }
            if (s._pierce > 0) { s._pierce--; }
            else { dead = true; break; }
          }
        }
      }
      if (dead) {
        s.setData('used', false); s.setVisible(false).setActive(false).setPosition(-100, -100);
        s.setBlendMode(Phaser.BlendModes.NORMAL);
      }
    }
  },

  /* ================= PICKUPS ================= */
  dropPickup: function (x, y, kind) {
    var s = null;
    for (var i = 0; i < this.pickupPool.length; i++) {
      if (!this.pickupPool[i].getData('used')) { s = this.pickupPool[i]; break; }
    }
    if (!s) return;
    s.setData('used', true);
    s.setTexture(kind === 'shard' ? 'pick_shard' : kind === 'heart' ? 'pick_heart' : 'pick_star')
      .setPosition(Phaser.Math.Clamp(x, 20, this.worldSize - 20), Phaser.Math.Clamp(y, 20, this.worldSize - 20))
      .setVisible(true).setActive(true).setScale(0.01).setAlpha(1);
    s._kind = kind;
    s._vx = (Math.random() - 0.5) * 160; s._vy = (Math.random() - 0.5) * 160;
    s._ph = Math.random() * 6.28;
    s.body.setCircle(12, 8, 8);
    this.tweens.add({ targets: s, scaleX: kind === 'star' ? 1.3 : 1, scaleY: kind === 'star' ? 1.3 : 1, duration: 220, ease: 'Back.easeOut' });
    this.activePickups.push(s);
  },

  updatePickups: function (dt) {
    var p = this.player, mr = this.stats.magnetR * (this.run.magnetBurst > 0 ? 3 : 1);
    var mr2 = mr * mr;
    for (var i = this.activePickups.length - 1; i >= 0; i--) {
      var s = this.activePickups[i];
      if (!s.getData('used')) { this.activePickups.splice(i, 1); continue; }
      s._vx *= Math.pow(0.05, dt); s._vy *= Math.pow(0.05, dt);
      var dx = p.x - s.x, dy = p.y - s.y, d2 = dx * dx + dy * dy;
      if (d2 < mr2) {
        var d = Math.sqrt(d2) || 1, pull = 900 * (1 - d / mr) + 300;
        s._vx += dx / d * pull * dt * 3; s._vy += dy / d * pull * dt * 3;
      }
      s.x += s._vx * dt; s.y += s._vy * dt;
      s._ph += dt * 5;
      s.y += Math.sin(s._ph) * 12 * dt;
      s.rotation += dt * 2;
      if (s.body) s.body.updateFromGameObject();
      // sparkle trail for magnetized
      if (d2 < mr2 && Math.random() < dt * 10) this.burst(s.x, s.y, 'shard', 1);
    }
  },

  collectPickup: function (s) {
    if (!s.getData('used')) return;
    s.setData('used', false); s.setVisible(false).setActive(false);
    var idx = this.activePickups.indexOf(s);
    if (idx >= 0) this.activePickups.splice(idx, 1);
    var p = this.player;
    if (s._kind === 'shard') {
      var v = Math.round(1 * this.stats.shardMul);
      this.run.shards += v; this.run.shardBank += v;
      this.burst(p.x, p.y - 20, 'shard', 3);
      D.audio.pickup(this.run.shards);
      this.checkRankUp();
    } else if (s._kind === 'heart') {
      this.healPlayer(22);
      D.ui.floatText(this, p.x, p.y - 40, '+22', '#5cff9d', 24);
    } else if (s._kind === 'star') {
      this.run.magnetBurst = 6;
      D.ui.floatText(this, p.x, p.y - 40, 'SHARD SURGE!', '#ffc93c', 26);
      D.audio.rankup();
      this.fxFlash(0xffc93c, 0.15);
    }
  },

  checkRankUp: function () {
    var need = T.rankShards[Math.min(this.run.rank, T.rankShards.length - 1)];
    if (this.run.shardBank >= need && !this.run.drafting && !this.run.over) {
      this.run.shardBank -= need;
      this.run.rank++;
      this.openDraft();
    }
  },

  healPlayer: function (n) {
    if (this.run.over) return;
    var before = this.hp;
    this.hp = Math.min(this.stats.maxhp, this.hp + n);
    var gained = this.hp - before;
    if (gained > 0) {
      this.burst(this.player.x, this.player.y, 'heal', 8);
      if (this.event && this.event.id === 'oasis') {
        this.run.oasisHealed += gained;
        if (this.run.oasisHealed >= 150) this.grantAch('oasis');
      }
    }
  },

  /* ================= PLAYER DAMAGE / DEATH ================= */
  hurtPlayer: function (dmg) {
    if (this.run.over || this.iframes > 0) return;
    if (Math.random() < this.stats.dodge) {
      D.ui.floatText(this, this.player.x, this.player.y - 40, 'DODGED', '#4ce0ff', 20);
      D.audio.dodge();
      return;
    }
    dmg = Math.max(1, Math.round(dmg - this.stats.armor));
    this.hp -= dmg;
    this.iframes = 0.6;
    this.run.noDmgT = 0;
    this.hurtPulse = 1;
    D.audio.hurt();
    this.cameras.main.shake(140, 0.0032);
    this.hitPause(45);
    this.burst(this.player.x, this.player.y, 'hit', 10);
    D.ui.floatText(this, this.player.x, this.player.y - 44, '-' + dmg, '#ff6a6a', 24);
    // squash
    this.tweens.add({ targets: this.player, scaleX: 1.25, scaleY: 0.75, duration: 90, yoyo: true });
    if (this.hp <= 0) { this.hp = 0; this.gameOver(false); }
  },

  hitPause: function (ms) {
    if (this._hitPausing) return;
    this._hitPausing = true;
    var self = this;
    this.time.timeScale = 0.06;
    this.physics.world.timeScale = 0.06;
    // real-time restore: Phaser's clock is scaled, so setTimeout keeps the pause honest
    setTimeout(function () {
      if (!self.scene || !self.scene.isActive()) return;
      self.time.timeScale = 1;
      self.physics.world.timeScale = 1;
      self._hitPausing = false;
    }, ms);
  },

  /* ================= WAVE DIRECTOR ================= */
  spawnPos: function () {
    var p = this.player, a = Math.random() * Math.PI * 2, r = 720 + Math.random() * 220;
    return {
      x: Phaser.Math.Clamp(p.x + Math.cos(a) * r, 40, this.worldSize - 40),
      y: Phaser.Math.Clamp(p.y + Math.sin(a) * r, 40, this.worldSize - 40)
    };
  },

  directorTable: function (t) {
    // minute -> weighted type list
    var m = t / 60;
    if (m < 1) return [['chaser', 10], ['swarmling', 6]];
    if (m < 2) return [['chaser', 8], ['swarmling', 8], ['dasher', 3]];
    if (m < 3) return [['chaser', 6], ['swarmling', 8], ['dasher', 4], ['splitter', 3], ['spitter', 2]];
    if (m < 4) return [['chaser', 5], ['dasher', 4], ['splitter', 4], ['spitter', 3], ['burrower', 3], ['swarmling', 6]];
    if (m < 5.5) return [['dasher', 5], ['splitter', 4], ['spitter', 4], ['shielded', 3], ['burrower', 3], ['wisp', 3], ['chaser', 4]];
    if (m < 7) return [['shielded', 4], ['wisp', 4], ['leaper', 4], ['brute', 2], ['dasher', 4], ['splitter', 3], ['burrower', 3]];
    if (m < 8.5) return [['brute', 3], ['leaper', 5], ['wisp', 4], ['shielded', 4], ['spitter', 4], ['dasher', 4]];
    return [['brute', 4], ['leaper', 5], ['wisp', 5], ['shielded', 5], ['dasher', 5], ['splitter', 4], ['swarmling', 8]];
  },

  pickType: function (table) {
    var total = 0, i;
    for (i = 0; i < table.length; i++) total += table[i][1];
    var r = Math.random() * total;
    for (i = 0; i < table.length; i++) { r -= table[i][1]; if (r <= 0) return table[i][0]; }
    return table[0][0];
  },

  updateDirector: function (dt) {
    var t = this.run.t;
    // spawn interval shrinks over time: 1.6s -> 0.35s
    var interval = Math.max(0.35, 1.6 - t / 600 * 1.25);
    var batch = 1 + Math.floor(t / 75); // 1 -> 8 per tick
    if (this.event && this.event.id === 'nightraid') batch += 2;
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = interval;
      var table = this.directorTable(t);
      for (var i = 0; i < batch; i++) {
        var pos = this.spawnPos();
        this.spawnEnemy(this.pickType(table), pos.x, pos.y, false);
      }
      // pack spawns for flavor
      if (Math.random() < 0.25 + t / 600 * 0.3) {
        var pp = this.spawnPos(), pt = this.pickType(table);
        for (var j = 0; j < 4; j++) this.spawnEnemy(pt, pp.x + (Math.random() - 0.5) * 90, pp.y + (Math.random() - 0.5) * 90, false);
      }
    }
    // elites trickle after 3:00
    if (t > 180) {
      this.eliteT -= dt;
      if (this.eliteT <= 0) {
        this.eliteT = Math.max(14, 30 - t / 60);
        var pos2 = this.spawnPos();
        var table2 = this.directorTable(t);
        this.spawnEnemy(this.pickType(table2), pos2.x, pos2.y, true);
      }
    }
    // bosses
    if (t >= 240 && !this.bossSpawned.tyrant) { this.bossSpawned.tyrant = true; this.spawnBoss('tyrant'); this.grantAch('reach4'); }
    if (t >= 480 && !this.bossSpawned.nightmaw) { this.bossSpawned.nightmaw = true; this.spawnBoss('nightmaw'); this.grantAch('reach8'); }
    // victory
    if (t >= T.runLength && !this.run.over) this.gameOver(true);
  },

  /* ================= DUNE EVENTS ================= */
  updateEvents: function (dt) {
    if (this.run.over) return;
    this.eventT -= dt;
    if (this.event) {
      this.event.left -= dt;
      if (this.event.id === 'oasis' && this.event.zone) {
        var p = this.player, z = this.event.zone;
        var dx = p.x - z.x, dy = p.y - z.y;
        if (dx * dx + dy * dy < 150 * 150) {
          this.healTick = (this.healTick || 0) + dt;
          if (this.healTick > 0.5) { this.healTick = 0; this.healPlayer(Math.round(6 * this.stats.eventPow)); }
          if (Math.random() < dt * 6) this.burst(p.x, p.y - 20, 'heal', 2);
        }
        z._pulse += dt * 3;
        z.setScale(1 + Math.sin(z._pulse) * 0.06);
      }
      if (this.event.left <= 0) this.endEvent();
    } else if (this.eventT <= 0) {
      this.startEvent(D.EVENTS[this.eventIdx % D.EVENTS.length].id);
      this.eventIdx++;
      this.eventT = 60;
    }
    if (this.hudEvent) {
      if (this.event) {
        this.hudEvent.setText(this.event.name + '  ' + Math.ceil(this.event.left) + 's');
        this.hudEvent.setColor(this.event.id === 'nightraid' ? '#ff6a6a' : this.event.id === 'oasis' ? '#5cff9d' : '#e8b06a');
      } else {
        this.hudEvent.setText('next event ' + Math.ceil(this.eventT) + 's');
        this.hudEvent.setColor('#4ce0ff');
      }
    }
  },

  startEvent: function (id) {
    var def = D.EVENTS.find(function (e) { return e.id === id; });
    this.event = { id: id, name: def.name, left: def.dur * (id === 'oasis' ? this.stats.eventPow : 1) };
    var p = this.player;
    if (id === 'sandstorm') {
      D.ui.banner(this, 'SANDSTORM', 'Visibility drops. Hold your ground.', '#e8b06a');
      this.stormFx.setVisible(true);
      this.stormFx.setAlpha(0);
      this.tweens.add({ targets: this.stormFx, alpha: 1, duration: 1200 });
      this.vignette.setAlpha(0.85);
    } else if (id === 'oasis') {
      D.ui.banner(this, 'OASIS', 'Stand in the green light to heal.', '#5cff9d');
      var a = Math.random() * Math.PI * 2;
      var zx = Phaser.Math.Clamp(p.x + Math.cos(a) * 260, 200, this.worldSize - 200);
      var zy = Phaser.Math.Clamp(p.y + Math.sin(a) * 260, 200, this.worldSize - 200);
      var zone = this.add.image(zx, zy, 'oasis').setDepth(3);
      zone._pulse = 0;
      zone.x = zx; zone.y = zy;
      this.event.zone = zone;
      this.burst(zx, zy, 'heal', 30);
      D.audio.heal();
    } else if (id === 'nightraid') {
      D.ui.banner(this, 'NIGHT RAID', 'Elites hunt in a pack!', '#ff6a6a');
      var table = this.directorTable(this.run.t);
      for (var i = 0; i < 7; i++) {
        var pos = this.spawnPos();
        this.spawnEnemy(this.pickType(table), pos.x, pos.y, true);
      }
      D.audio.bossRoar();
    }
  },

  endEvent: function () {
    if (!this.event) return;
    var id = this.event.id;
    if (id === 'sandstorm') {
      var self = this;
      this.tweens.add({ targets: this.stormFx, alpha: 0, duration: 1200, onComplete: function () { self.stormFx.setVisible(false); } });
      this.vignette.setAlpha(0.55);
    }
    if (id === 'oasis' && this.event.zone) { this.event.zone.destroy(); }
    D.ui.toast(this, id === 'nightraid' ? 'Raid survived!' : 'The dunes settle...', '#8a8fc9');
    this.event = null;
  },

  /* ================= BOSSES ================= */
  spawnBoss: function (bossId) {
    var def = D.BOSSES.find(function (b) { return b.id === bossId; });
    var pos = this.spawnPos();
    // reuse enemy pool with boss texture
    var s = this.spawnEnemy('brute', pos.x, pos.y, false); // placeholder to grab pool slot
    if (!s) return;
    // convert to boss
    s.setTexture('boss_' + def.id);
    s.clearTint();
    s.isBoss = true; s.bName = def.name; s.bossId = bossId;
    var hpMul = 1 + (D.save.wins * 0.15);
    s.maxhp = s.hp = def.hp * hpMul;
    s.dmg = def.dmg; s.speed = def.speed; s.r = def.r;
    s.behavior = 'boss'; s.state = 0; s.stateT = 2;
    s.body.setCircle(def.r * 0.75, s.width / 2 - def.r * 0.75, s.height / 2 - def.r * 0.75);
    this.boss = s;
    D.ui.banner(this, def.name, def.desc, '#ff4c4c');
    D.audio.bossRoar();
    D.audio.setIntensity(2);
    this.cameras.main.shake(300, 0.005);
    this.hitPause(120);
  },

  updateBoss: function (e, dt) {
    var p = this.player;
    var dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy) || 1;
    var nx = dx / dist, ny = dy / dist;
    e.stateT -= dt;
    var mvx = nx * e.speed, mvy = ny * e.speed;
    if (e.bossId === 'tyrant') {
      if (e.state === 0) { // stalk
        if (e.stateT <= 0) {
          e.state = 1; e.stateT = 0.9;
          e._chargeA = Math.atan2(dy, dx);
          var tele = this.add.image(e.x, e.y, 'telegraph').setDepth(4).setTint(0xff4c4c).setAlpha(0.7);
          tele.setScale(6); tele.setRotation(e._chargeA);
          tele._life = 0.9; tele._isTele = true;
          this._teles = this._teles || []; this._teles.push(tele);
        }
      } else if (e.state === 1) { // telegraph
        mvx = 0; mvy = 0;
        e.setTintFill(0xff2222);
        if (e.stateT <= 0) {
          e.state = 2; e.stateT = 0.75; e.clearTint();
          D.audio.bossRoar();
          this.cameras.main.shake(120, 0.002);
        }
      } else if (e.state === 2) { // charge!
        mvx = Math.cos(e._chargeA) * e.speed * 7;
        mvy = Math.sin(e._chargeA) * e.speed * 7;
        if (Math.random() < dt * 20) this.burst(e.x, e.y, 'dust', 2);
        if (e.stateT <= 0) {
          e.state = 3; e.stateT = 1.2;
          // radial burst
          for (var i = 0; i < 12; i++) {
            var a = i / 12 * Math.PI * 2;
            this.enemyShoot(e.x, e.y, a, 240, e.dmg * 0.6);
          }
          // summon hounds
          for (var j = 0; j < 4; j++) {
            var h = this.spawnEnemy('chaser', e.x + (Math.random() - 0.5) * 160, e.y + (Math.random() - 0.5) * 160, false);
            if (h) { h.knx = (Math.random() - 0.5) * 400; h.kny = (Math.random() - 0.5) * 400; }
          }
        }
      } else { // recover
        mvx = nx * e.speed * 0.5; mvy = ny * e.speed * 0.5;
        if (e.stateT <= 0) { e.state = 0; e.stateT = 2.2 + Math.random(); }
      }
    } else { // nightmaw
      if (e.state === 0) { // spiral barrage
        e._spiral = (e._spiral || 0) + dt * 4.2;
        e._shotT = (e._shotT || 0) - dt;
        if (e._shotT <= 0) {
          e._shotT = 0.14;
          for (var k = 0; k < 2; k++) {
            this.enemyShoot(e.x, e.y, e._spiral + k * Math.PI, 200, e.dmg * 0.5);
          }
        }
        mvx = nx * e.speed * 0.4; mvy = ny * e.speed * 0.4;
        if (e.stateT <= 0) {
          e.state = 1; e.stateT = 1.1;
          e._beamA = Math.atan2(dy, dx);
          var tele2 = this.add.image(e.x, e.y, 'telegraph').setDepth(4).setTint(0x8a3cff).setAlpha(0.7);
          tele2.setDisplaySize(700, 120); tele2.setRotation(e._beamA);
          tele2._life = 1.1; tele2._isTele = true;
          this._teles = this._teles || []; this._teles.push(tele2);
        }
      } else if (e.state === 1) { // beam telegraph
        mvx = 0; mvy = 0;
        if (e.stateT <= 0) {
          e.state = 2; e.stateT = 1.4;
          e._beamA = Math.atan2(p.y - e.y, p.x - e.x); // lock at fire time
          D.audio.shoot('beam');
          this.cameras.main.shake(200, 0.003);
        }
      } else if (e.state === 2) { // BEAM
        mvx = 0; mvy = 0;
        var blen = 700, bw = 90;
        this.fxLines.push({ pts: [[e.x, e.y], [e.x + Math.cos(e._beamA) * blen, e.y + Math.sin(e._beamA) * blen]], t: 0, life: 0.12, color: 0x8a3cff, width: bw * 0.5, beam: true });
        // damage player if in beam
        var rx = p.x - e.x, ry = p.y - e.y;
        var along = rx * Math.cos(e._beamA) + ry * Math.sin(e._beamA);
        var perp = Math.abs(rx * Math.sin(e._beamA) - ry * Math.cos(e._beamA));
        if (along > 0 && along < blen && perp < bw / 2) this.hurtPlayer(e.dmg);
        if (e.stateT <= 0) {
          e.state = 3; e.stateT = 1.6;
          for (var j2 = 0; j2 < 3; j2++) this.spawnEnemy('dasher', e.x + (Math.random() - 0.5) * 200, e.y + (Math.random() - 0.5) * 200, false);
        }
      } else {
        if (e.stateT <= 0) { e.state = 0; e.stateT = 3.2; }
      }
    }
    // integrate (no wobble scale for boss; use pulse)
    e.knx *= Math.pow(0.02, dt); e.kny *= Math.pow(0.02, dt);
    e.x += (mvx + e.knx) * dt; e.y += (mvy + e.kny) * dt;
    e.x = Phaser.Math.Clamp(e.x, 60, this.worldSize - 60);
    e.y = Phaser.Math.Clamp(e.y, 60, this.worldSize - 60);
    e.wob += dt * 3;
    var pu = 1 + Math.sin(e.wob) * 0.04;
    e.setScale(pu);
    e.rotation = Math.sin(e.wob * 0.5) * 0.06;
    if (e.flashT > 0) { e.flashT -= dt; e.setTintFill(0xffffff); if (e.flashT <= 0 && !(e.bossId === 'tyrant' && e.state === 1)) e.clearTint(); }
    // touch damage
    e.touchT -= dt;
    if (dist < e.r + 26 && e.touchT <= 0) { e.touchT = 0.8; this.hurtPlayer(Math.round(e.dmg * 1.2)); }
    if (e.body) e.body.updateFromGameObject();
    // telegraph cleanup
    if (this._teles) {
      for (var ti = this._teles.length - 1; ti >= 0; ti--) {
        var tl = this._teles[ti];
        tl._life -= dt;
        tl.setAlpha(0.3 + Math.abs(Math.sin(this.run.t * 10)) * 0.5);
        if (tl._life <= 0) { tl.destroy(); this._teles.splice(ti, 1); }
      }
    }
  },

  onBossDead: function (boss) {
    if (boss.bossId === 'tyrant' && !this.run.boss1dead) { this.run.boss1dead = true; this.grantAch('boss1'); }
    if (boss.bossId === 'nightmaw' && !this.run.boss2dead) { this.run.boss2dead = true; this.grantAch('boss2'); }
    this.boss = null;
    // clean up any leftover telegraphs
    if (this._teles) {
      this._teles.forEach(function (tl) { tl.destroy(); });
      this._teles = [];
    }
    D.audio.bossDie();
    D.audio.setIntensity(1);
    this.cameras.main.shake(400, 0.006);
    this.hitPause(160);
    this.fxFlash(0xffffff, 0.25);
    D.ui.banner(this, boss.bName + ' DESTROYED', 'The desert breathes again', '#5cff9d');
    for (var i = 0; i < 5; i++) {
      this.burst(boss.x + (Math.random() - 0.5) * 160, boss.y + (Math.random() - 0.5) * 160, i % 2 ? 'spark' : 'ink', 18);
    }
  },

  /* ================= RANK-UP DRAFT ================= */
  draftOptions: function () {
    var opts = [], self = this;
    var ownedAuras = this.run.auras.filter(function (a) { return !a.evo; });
    var ownedIds = ownedAuras.map(function (a) { return a.id; });
    // new auras
    D.AURAS.forEach(function (def) {
      if (ownedIds.indexOf(def.id) < 0 && self.run.auras.length < T.auraSlots) {
        var sameColor = ownedAuras.some(function (a) { return a.color === def.color; });
        opts.push({ kind: 'aura', id: def.id, w: sameColor ? 30 : 14, fuse: sameColor });
      }
    });
    // rank up auras
    ownedAuras.forEach(function (a) {
      var def = D.auraById(a.id);
      if (a.rank < def.ranks) opts.push({ kind: 'auraUp', id: a.id, w: 10 });
    });
    // new passives
    var pCount = Object.keys(this.run.passives).length;
    D.PASSIVES.forEach(function (p) {
      var cur = self.run.passives[p.id] || 0;
      if (cur === 0 && pCount < T.passiveSlots) opts.push({ kind: 'passive', id: p.id, w: 9 });
      else if (cur > 0 && cur < p.max) opts.push({ kind: 'passiveUp', id: p.id, w: 8 });
    });
    // fallbacks
    opts.push({ kind: 'heal', w: 4 });
    opts.push({ kind: 'shards', w: 4 });
    // weighted pick 3 distinct
    var picks = [];
    var pool = opts.slice();
    while (picks.length < 3 && pool.length) {
      var total = 0, i;
      for (i = 0; i < pool.length; i++) total += pool[i].w;
      var r = Math.random() * total, sel = 0;
      for (i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) { sel = i; break; } }
      picks.push(pool[sel]);
      pool.splice(sel, 1);
    }
    return picks;
  },

  draftCardData: function (opt) {
    var css = D.COLOR_CSS;
    if (opt.kind === 'aura') {
      var def = D.auraById(opt.id);
      return {
        title: def.name, color: css[def.color],
        lines: [def.desc, opt.fuse ? 'FUSES with your ' + D.COLOR_NAMES[def.color] + ' aura!' : 'A new ' + D.COLOR_NAMES[def.color] + ' aura.'],
        tag: opt.fuse ? 'FUSION!' : 'NEW AURA'
      };
    }
    if (opt.kind === 'auraUp') {
      var a = this.run.auras.find(function (x) { return x.id === opt.id && !x.evo; });
      var d2 = D.auraById(opt.id);
      return { title: d2.name + ' +' + (a.rank + 1), color: css[d2.color], lines: ['Stronger ' + d2.name + '.', 'Rank ' + a.rank + ' → ' + (a.rank + 1)], tag: 'POWER UP' };
    }
    if (opt.kind === 'passive') {
      var p = D.passiveById(opt.id);
      return { title: p.name, color: '#8a8fc9', lines: [p.desc, p.per + ' each rank.'], tag: 'NEW GIFT' };
    }
    if (opt.kind === 'passiveUp') {
      var p2 = D.passiveById(opt.id), cur = this.run.passives[opt.id];
      return { title: p2.name + ' +' + (cur + 1), color: '#8a8fc9', lines: [p2.desc, 'Rank ' + cur + ' → ' + (cur + 1)], tag: 'POWER UP' };
    }
    if (opt.kind === 'heal') return { title: 'Desert Feast', color: '#5cff9d', lines: ['Restore 50 health now.'], tag: 'RECOVER' };
    return { title: 'Shard Cache', color: '#7df9ff', lines: ['+60 shards toward your next rank.'], tag: 'TREASURE' };
  },

  openDraft: function () {
    var self = this;
    this.run.drafting = true;
    this.physics.world.pause();
    D.audio.rankup();
    var W = this.W, H = this.H;
    var dim = this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.72).setScrollFactor(0).setDepth(960);
    var head = this.add.text(W / 2, H * 0.13, 'RANK UP!  —  CHOOSE', {
      fontFamily: 'Arial, sans-serif', fontSize: '32px', fontStyle: 'bold', color: '#ffc93c'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(961);
    this.tweens.add({ targets: head, scaleX: 1.06, scaleY: 1.06, duration: 700, yoyo: true, repeat: -1 });
    var picks = this.draftOptions();
    var group = [dim, head];
    var cw = Math.min(200, (W - 60) / 3), chh = Math.min(330, H * 0.44);
    picks.forEach(function (opt, i) {
      var d = self.draftCardData(opt);
      var x = W / 2 + (i - 1) * (cw + 16), y = H * 0.46;
      var card = D.ui.card(self, x, y, cw, chh, { edge: 0xffffff, delay: i * 110 });
      card.setDepth(962); card.setScrollFactor(0);
      var tag = self.add.text(0, -chh / 2 + 26, d.tag, { fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold', color: d.color }).setOrigin(0.5);
      var ttl = self.add.text(0, -chh / 2 + 58, d.title, { fontFamily: 'Arial, sans-serif', fontSize: '19px', fontStyle: 'bold', color: '#ffffff', wordWrap: { width: cw - 24 }, align: 'center' }).setOrigin(0.5, 0);
      card.add([tag, ttl]);
      var ly = -chh / 2 + 130;
      d.lines.forEach(function (ln) {
        var t = self.add.text(0, ly, ln, { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#b9bde6', wordWrap: { width: cw - 24 }, align: 'center' }).setOrigin(0.5, 0);
        card.add(t); group.push(t); ly += t.height + 14;
      });
      card.setSize(cw, chh); card.setInteractive({ useHandCursor: true });
      card.on('pointerup', function () {
        self.applyDraft(opt);
        group.forEach(function (o) { o.destroy(); });
        card.destroy();
      });
      group.push(card);
    });
    this._draftGroup = group;
  },

  applyDraft: function (opt) {
    if (opt.kind === 'aura') this.addAura(opt.id);
    else if (opt.kind === 'auraUp') {
      var a = this.run.auras.find(function (x) { return x.id === opt.id && !x.evo; });
      if (a) {
        a.rank++;
        // orbit blades may grow
        var def = D.auraById(a.id);
        if (def.kind === 'orbit') {
          var want = this.auraStat(a, 'count');
          while (a.blades.length < want) {
            var b = this.add.image(this.player.x, this.player.y, 'blade_' + a.color).setDepth(9);
            b._ang = Math.random() * Math.PI * 2;
            a.blades.push(b);
          }
        }
        if (def.kind === 'ring' && a.ring) a.ring.setScale(this.auraStat(a, 'radius') / 64);
        this.refreshAuraIcons();
      }
    }
    else if (opt.kind === 'passive') this.addPassive(opt.id);
    else if (opt.kind === 'passiveUp') this.addPassive(opt.id);
    else if (opt.kind === 'heal') { this.healPlayer(50); D.ui.floatText(this, this.player.x, this.player.y - 50, '+50', '#5cff9d', 26); }
    else if (opt.kind === 'shards') { this.run.shardBank += 60; this.run.shards += 60; }
    D.audio.uiClick();
    this.run.drafting = false;
    if (this._draftGroup) { this._draftGroup.forEach(function (o) { if (o && o.destroy) o.destroy(); }); this._draftGroup = null; }
    if (!this.run.paused) this.physics.world.resume();
    this.checkRankUp(); // chain if overflow
  },

  /* ================= ACHIEVEMENTS ================= */
  grantAch: function (id) {
    if (this.achChecked[id]) return;
    this.achChecked[id] = true;
    var a = D.unlockAchievement(id);
    if (a) {
      var self = this;
      this.time.delayedCall(1200, function () {
        D.ui.toast(self, 'TROPHY: ' + a.name, '#ffc93c');
        D.audio.fuse();
      });
    }
  },

  /* ================= PAUSE ================= */
  togglePause: function () {
    if (this.run.over || this.run.drafting) return;
    if (this.run.paused) this.resumeGame();
    else {
      this.run.paused = true;
      this.physics.world.pause();
      D.audio.uiClick();
      var W = this.W, H = this.H, self = this;
      var dim = this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.8).setScrollFactor(0).setDepth(970);
      var panel = D.ui.card(this, W / 2, H / 2, Math.min(420, W - 60), 460, {});
      panel.setDepth(971); panel.setScrollFactor(0);
      var t = this.add.text(0, -180, 'PAUSED', { fontFamily: 'Arial, sans-serif', fontSize: '36px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      var st = this.add.text(0, -130, D.ui.fmtTime(this.run.t) + '  •  ' + this.run.kills + ' kills  •  rank ' + this.run.rank, { fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#8a8fc9' }).setOrigin(0.5);
      panel.add([t, st]);
      var objs = [dim, panel, t, st];
      var mk = function (y, label, cb) {
        var b = D.ui.button(self, 0, y, 300, label, { fs: 20 });
        b.setDepth(972); b.setScrollFactor(0);
        var old = b._bg;
        panel.add(b); objs.push(b);
        var origCb = cb;
        b.removeAllListeners('pointerup');
        b.on('pointerup', function () {
          D.audio.uiClick();
          self.tweens.add({ targets: b, scaleX: 1, scaleY: 1, duration: 120, ease: 'Back.easeOut' });
          origCb();
        });
        return b;
      };
      mk(-40, 'RESUME', function () { objs.forEach(function (o) { o.destroy(); }); self.resumeGame(); });
      mk(40, D.save.muted ? 'SOUND: OFF' : 'SOUND: ON', function () {
        D.save.muted = !D.save.muted; D.persist(); D.audio.setMuted(D.save.muted);
        objs.forEach(function (o) { o.destroy(); }); self.run.paused = false; self.togglePause();
      });
      mk(120, 'QUIT RUN', function () { self.cameras.main.fadeOut(300, 5, 8, 25); self.time.delayedCall(320, function () { self.scene.start('Menu'); }); });
      this._pauseObjs = objs;
    }
  },

  resumeGame: function () {
    this.run.paused = false;
    if (this._pauseObjs) { this._pauseObjs.forEach(function (o) { o.destroy(); }); this._pauseObjs = null; }
    if (!this.run.drafting) this.physics.world.resume();
  },

  /* ================= GAME OVER / VICTORY ================= */
  gameOver: function (won) {
    if (this.run.over) return;
    this.run.over = true; this.run.won = won;
    // make sure no hit-pause is stretching the end-of-run timing
    this.time.timeScale = 1; this.physics.world.timeScale = 1; this._hitPausing = false;
    var self = this;
    this.physics.world.pause();
    D.audio.stopMusic();
    D.audio.stinger(won);
    D.audio.setIntensity(won ? 3 : 0);
    if (won) { D.audio.startMusic(); this.grantAch('win'); }
    // records
    D.save.runs++;
    if (won) D.save.wins++;
    D.save.best.time = Math.max(D.save.best.time, Math.floor(this.run.t));
    D.save.best.kills = Math.max(D.save.best.kills, this.run.kills);
    D.save.best.rank = Math.max(D.save.best.rank, this.run.rank);
    // clear field with fireworks on win
    if (won) {
      var list = this.activeEnemies.slice();
      list.forEach(function (e, i) {
        self.time.delayedCall(i * 30, function () {
          self.burst(e.x, e.y, 'spark', 14);
          self.killEnemy(e, true);
        });
      });
    }
    this.time.delayedCall(won ? 1600 : 900, function () { self.showEndScreen(won); });
  },

  showEndScreen: function (won) {
    var W = this.W, H = this.H, self = this;
    var dim = this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.85).setScrollFactor(0).setDepth(970);
    var panel = D.ui.card(this, W / 2, H / 2, Math.min(480, W - 40), Math.min(600, H - 80), { edge: won ? 0xffc93c : 0xff5c5c });
    panel.setDepth(971); panel.setScrollFactor(0);
    var objs = [dim, panel];
    var t1 = this.add.text(0, -250, won ? 'DAWN BREAKS' : 'THE DUSK TAKES YOU', {
      fontFamily: 'Arial, sans-serif', fontSize: '30px', fontStyle: 'bold', color: won ? '#ffc93c' : '#ff6a6a'
    }).setOrigin(0.5);
    var t2 = this.add.text(0, -208, won ? 'You survived the crossing!' : 'The desert keeps your light.', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#b9bde6'
    }).setOrigin(0.5);
    panel.add([t1, t2]); objs.push(t1, t2);
    var rows = [
      ['TIME', D.ui.fmtTime(this.run.t)], ['KILLS', '' + this.run.kills],
      ['RANK', '' + this.run.rank], ['SHARDS', '' + this.run.shards],
      ['FUSIONS', '' + Object.keys(this.run.fusedColors).length + ' / 6']
    ];
    var y = -150;
    rows.forEach(function (r) {
      var a = self.add.text(-160, y, r[0], { fontFamily: 'Arial, sans-serif', fontSize: '17px', color: '#8a8fc9' }).setOrigin(0, 0.5);
      var b = self.add.text(160, y, r[1], { fontFamily: 'Arial, sans-serif', fontSize: '19px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(1, 0.5);
      panel.add([a, b]); objs.push(a, b); y += 40;
    });
    // auras used
    var an = this.add.text(0, y + 6, 'Auras: ' + this.run.auras.map(function (a) {
      return a.evo ? a.evoDef.name : D.auraById(a.id).name;
    }).join(', '), {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#8a8fc9', wordWrap: { width: 400 }, align: 'center'
    }).setOrigin(0.5, 0);
    panel.add(an); objs.push(an);
    var btn = D.ui.button(this, 0, 236, 320, 'CHOOSE RELICS', { fs: 22, tint: 0x2a8a5c });
    btn.setDepth(972); btn.setScrollFactor(0);
    panel.add(btn); objs.push(btn);
    btn.removeAllListeners('pointerup');
    btn.on('pointerup', function () {
      D.audio.uiClick();
      self.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 120, ease: 'Back.easeOut' });
      objs.forEach(function (o) { o.destroy(); });
      self.showRelicDraft();
    });
  },

  /* relic keep/swap between runs */
  showRelicDraft: function () {
    var W = this.W, H = this.H, self = this;
    var dim = this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.9).setScrollFactor(0).setDepth(970);
    var objs = [dim];
    var title = this.add.text(W / 2, 60, 'RELICS OF THE DUSK', {
      fontFamily: 'Arial, sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#ffc93c'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(971);
    var sub = this.add.text(W / 2, 100, 'Keep up to 3. Tap an offering, then tap a kept relic to swap.', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#b9bde6'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(971);
    objs.push(title, sub);
    var kept = D.save.relics.slice();
    while (kept.length < 3) kept.push(null);
    // 3 offerings: random unkept relics
    var pool = D.RELICS.filter(function (r) { return D.save.relics.indexOf(r.id) < 0; });
    for (var i = pool.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
    var offers = pool.slice(0, 3);
    var selected = -1;
    var keptRow, offerRow;
    var redraw = null;
    var icons = { sun: '☀', moon: '☾', wind: '≋', idol: '◈', thornmail: '✦', frost: '❄', horn: '📯', stone: '⬢', vial: '🧪', drum: '◎', tear: '💧', veil2: '◍' };
    function cell(x, y, r, isOffer, idx) {
      var c = self.add.container(x, y).setScrollFactor(0).setDepth(972);
      var cw = (W - 80) / 3, chh = 150;
      var bg = self.add.graphics();
      var hl = isOffer && selected === idx;
      bg.fillStyle(r ? (hl ? 0x3a4a1e : 0x1a1f45) : 0x10142a, 0.95);
      bg.fillRoundedRect(-cw / 2, -chh / 2, cw, chh, 12);
      bg.lineStyle(hl ? 4 : 2, hl ? 0xffc93c : 0x4a4f7a, 1);
      bg.strokeRoundedRect(-cw / 2, -chh / 2, cw, chh, 12);
      c.add(bg);
      if (r) {
        var ic = self.add.text(0, -chh / 2 + 30, icons[r.icon] || '◆', { fontSize: '32px' }).setOrigin(0.5);
        var nm = self.add.text(0, -chh / 2 + 58, r.name, { fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
        var ds = self.add.text(0, -chh / 2 + 80, r.desc, { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#b9bde6', wordWrap: { width: cw - 14 }, align: 'center' }).setOrigin(0.5, 0);
        c.add([ic, nm, ds]);
      } else {
        var em = self.add.text(0, 0, 'EMPTY', { fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#4a4f7a' }).setOrigin(0.5);
        c.add(em);
      }
      c.setSize(cw, chh); c.setInteractive({ useHandCursor: true });
      c.on('pointerup', function () {
        D.audio.uiClick();
        if (isOffer) { selected = (selected === idx ? -1 : idx); }
        else if (selected >= 0) {
          kept[idx] = offers[selected].id;
          offers.splice(selected, 1); selected = -1;
          D.audio.rankup();
        }
        redraw();
      });
      return c;
    }
    redraw = function () {
      if (keptRow) keptRow.destroy(true);
      if (offerRow) offerRow.destroy(true);
      keptRow = self.add.container(0, 0).setScrollFactor(0).setDepth(972);
      offerRow = self.add.container(0, 0).setScrollFactor(0).setDepth(972);
      var cw = (W - 80) / 3;
      var kl = self.add.text(W / 2, 170, 'KEPT RELICS', { fontFamily: 'Arial, sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#5cff9d' }).setOrigin(0.5).setScrollFactor(0).setDepth(972);
      keptRow.add(kl); objs.push(kl);
      kept.forEach(function (rid, i) {
        var r = rid ? D.relicById(rid) : null;
        keptRow.add(cell(W / 2 + (i - 1) * (cw + 12), 268, r, false, i));
      });
      var ol = self.add.text(W / 2, 380, 'OFFERINGS', { fontFamily: 'Arial, sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#ffc93c' }).setOrigin(0.5).setScrollFactor(0).setDepth(972);
      offerRow.add(ol); objs.push(ol);
      offers.forEach(function (r, i) {
        offerRow.add(cell(W / 2 + (i - (offers.length - 1) / 2) * (cw + 12), 478, r, true, i));
      });
    };
    redraw();
    var done = D.ui.button(this, W / 2, H - 90, 320, 'RETURN TO CAMP', { fs: 22, tint: 0x2a8a5c });
    done.setDepth(973); done.setScrollFactor(0);
    objs.push(done);
    done.removeAllListeners('pointerup');
    done.on('pointerup', function () {
      D.audio.uiClick();
      self.tweens.add({ targets: done, scaleX: 1, scaleY: 1, duration: 120, ease: 'Back.easeOut' });
      D.save.relics = kept.filter(function (k) { return !!k; }).slice(0, 3);
      D.persist();
      objs.forEach(function (o) { o.destroy(); });
      if (keptRow) keptRow.destroy(true);
      if (offerRow) offerRow.destroy(true);
      self.scene.start('Menu');
    });
  },

  /* ================= MAIN UPDATE ================= */
  update: function (time, delta) {
    var dt = Math.min(delta / 1000, 0.05);
    if (this.run.over || this.run.paused || this.run.drafting) return;
    this.run.t += dt;
    var p = this.player;

    /* --- movement: eased accel/decel --- */
    var inp = this.readMoveInput();
    var accel = 1500, maxSp = this.stats.speed;
    this.pvx += inp.x * accel * dt;
    this.pvy += inp.y * accel * dt;
    // friction when no input
    if (inp.x === 0 && inp.y === 0) {
      var fr = Math.pow(0.0001, dt);
      this.pvx *= fr; this.pvy *= fr;
    }
    var sp = Math.hypot(this.pvx, this.pvy);
    if (sp > maxSp) { this.pvx = this.pvx / sp * maxSp; this.pvy = this.pvy / sp * maxSp; sp = maxSp; }
    p.x += this.pvx * dt; p.y += this.pvy * dt;
    p.x = Phaser.Math.Clamp(p.x, 30, this.worldSize - 30);
    p.y = Phaser.Math.Clamp(p.y, 30, this.worldSize - 30);
    if (p.body) p.body.updateFromGameObject();
    this.moving = sp > 30;
    if (this.moving) this.moveAng = Math.atan2(this.pvy, this.pvx);
    // squash & stretch + lean
    var stretch = 1 + Math.min(0.18, sp / maxSp * 0.18);
    p.setScale(2 - stretch > 0 ? 1 / Math.sqrt(stretch) : 1, stretch);
    p.rotation = Phaser.Math.Angle.RotateTo(p.rotation, this.moving ? this.moveAng + Math.PI / 2 : 0, 8 * dt);
    // bob
    p.y += Math.sin(this.run.t * (this.moving ? 10 : 4)) * (this.moving ? 2.2 : 1);
    this.pShadow.setPosition(p.x, p.y + 32);
    // trail
    this.trailT -= dt;
    if (this.moving && this.trailT <= 0) {
      this.trailT = 0.05;
      var tp = this.trail[this.trailIdx]; this.trailIdx = (this.trailIdx + 1) % this.trail.length;
      tp.setPosition(p.x, p.y).setAlpha(0.5).setScale(0.55);
      this.tweens.add({ targets: tp, alpha: 0, scaleX: 0.1, scaleY: 0.1, duration: 420 });
    }
    if (this.iframes > 0) {
      this.iframes -= dt;
      p.setAlpha(0.5 + Math.abs(Math.sin(this.run.t * 30)) * 0.5);
      if (this.iframes <= 0) p.setAlpha(1);
    }
    // regen
    if (this.stats.regen > 0) {
      this.regenT += dt;
      if (this.regenT >= 3) { this.regenT = 0; this.healPlayer(this.stats.regen); }
    }
    // untouchable achievement
    this.run.noDmgT += dt;
    if (this.run.noDmgT >= 60) this.grantAch('untouch');
    // magnet burst timer
    if (this.run.magnetBurst > 0) this.run.magnetBurst -= dt;
    // echo drum
    if (this.stats.echo > 0) {
      this.run.echoT -= dt;
      if (this.run.echoT <= 0) {
        this.run.echoT = this.stats.echo;
        D.ui.floatText(this, p.x, p.y - 60, 'ECHO!', '#ffc93c', 26);
        this.run.auras.forEach(function (a) { a.t = 99; });
      }
    }

    /* --- auras: cooldowns + continuous --- */
    var self = this;
    this.run.auras.forEach(function (aura) {
      var def = aura.evo ? null : D.auraById(aura.id);
      var cd = (aura.evo ? self.auraStat(aura, 'cd') : def.cd * self.stats.cdrMul) || 0.001;
      aura.t += dt;
      // continuous orbit blades
      if ((!aura.evo && def.kind === 'orbit') || aura.evo) {
        var n = aura.evo ? aura.blades.length : self.auraStat(aura, 'count');
        var radius = aura.evo ? self.auraStat(aura, 'radius') : self.auraStat(aura, 'radius');
        var rot = (aura.evo ? 1.8 : def.rot || 2.6) * dt;
        aura._orbA = (aura._orbA || 0) + rot * (self.moving ? 1.35 : 1);
        for (var i = 0; i < aura.blades.length; i++) {
          var b = aura.blades[i];
          var ang = aura._orbA + i / aura.blades.length * Math.PI * 2;
          b.setPosition(p.x + Math.cos(ang) * radius, p.y + Math.sin(ang) * radius);
          b.setRotation(ang + Math.PI / 2);
          var bs = (aura.evo ? 1.5 : 1) * (1 + Math.sin(self.run.t * 6 + i) * 0.08);
          b.setScale(bs);
          // damage on contact with per-enemy cooldown
          var list = self.activeEnemies;
          for (var j = 0; j < list.length; j++) {
            var e = list[j];
            if (e.burrowed) continue;
            var dx = e.x - b.x, dy = e.y - b.y, rr = e.r + 22;
            if (dx * dx + dy * dy < rr * rr && (e._bladeT || 0) <= 0) {
              e._bladeT = 0.35;
              var dmg = (aura.evo ? self.auraStat(aura, 'dmg') : self.auraStat(aura, 'dmg') * self.stats.dmgMul);
              self.damageEnemy(e, dmg, { color: aura.color, src: 'orbit', knock: 220, kx: dx, ky: dy });
            }
          }
        }
      }
      // persistent frost ring
      if (!aura.evo && def.kind === 'ring' && aura.ring) {
        aura.ring.setPosition(p.x, p.y);
        aura.ring.rotation += dt * 0.8;
        aura._ringTick = (aura._ringTick || 0) + dt;
        if (aura._ringTick >= 0.5) {
          aura._ringTick = 0;
          var rd = self.auraStat(aura, 'radius');
          self.damageArea(p.x, p.y, rd, self.auraStat(aura, 'dmg') * self.stats.dmgMul, {
            color: aura.color, src: 'ring', slow: self.auraStat(aura, 'slow')
          });
        }
      }
      // evoCyan tempest: persistent slow ring too
      if (aura.evo && aura.id === 'evoCyan') {
        aura._ringTick = (aura._ringTick || 0) + dt;
        if (aura._ringTick >= 0.6) {
          aura._ringTick = 0;
          self.damageArea(p.x, p.y, self.auraStat(aura, 'radius'), self.auraStat(aura, 'dmg') * 0.35 * self.stats.dmgMul, {
            color: 'cyan', src: 'evo', slow: self.auraStat(aura, 'slow')
          });
        }
      }
      // timed fire
      if (aura.t >= cd && cd > 0.01) {
        aura.t = 0;
        var kind = aura.evo ? 'evo' : def.kind;
        if (kind !== 'orbit' && kind !== 'ring') self.fireAura(aura);
      }
      // blade per-enemy cooldown decay
      // (handled globally below)
    });

    /* --- enemies --- */
    var list = this.activeEnemies.slice();
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e._bladeT > 0) e._bladeT -= dt;
      if (e.isBoss) this.updateBoss(e, dt);
      else {
        // sleep far enemies' AI (still drawn)
        var edx = e.x - p.x, edy = e.y - p.y;
        if (edx * edx + edy * edy < 950 * 950) this.updateEnemy(e, dt);
        else { e.wob += dt * 2; e.setScale(1 + Math.sin(e.wob) * 0.06); }
      }
      if (e.body) e.body.updateFromGameObject();
    }
    this.separateEnemies();
    this.updateShots(dt);
    this.updateEspits(dt);
    this.updatePickups(dt);

    /* --- fx lines --- */
    this.fxGfx.clear();
    for (var li = this.fxLines.length - 1; li >= 0; li--) {
      var L = this.fxLines[li];
      L.t += dt;
      var f = 1 - L.t / L.life;
      if (f <= 0) { this.fxLines.splice(li, 1); continue; }
      var pts = L.pts;
      for (var s2 = 0; s2 < pts.length - 1; s2++) {
        var x1 = pts[s2][0], y1 = pts[s2][1], x2 = pts[s2 + 1][0], y2 = pts[s2 + 1][1];
        // jitter for lightning
        var mx = (x1 + x2) / 2 + (Math.random() - 0.5) * 26 * (L.beam ? 0.2 : 1);
        var my = (y1 + y2) / 2 + (Math.random() - 0.5) * 26 * (L.beam ? 0.2 : 1);
        this.fxGfx.lineStyle(L.width * f + 2, 0xffffff, 0.85 * f);
        this.fxGfx.beginPath(); this.fxGfx.moveTo(x1, y1); this.fxGfx.lineTo(mx, my); this.fxGfx.lineTo(x2, y2); this.fxGfx.strokePath();
        this.fxGfx.lineStyle((L.width * 2.2) * f, L.color, 0.5 * f);
        this.fxGfx.beginPath(); this.fxGfx.moveTo(x1, y1); this.fxGfx.lineTo(mx, my); this.fxGfx.lineTo(x2, y2); this.fxGfx.strokePath();
      }
    }

    /* --- director / events --- */
    this.updateDirector(dt);
    this.updateEvents(dt);

    /* --- ambient --- */
    // parallax ridges follow camera
    var cam = this.cameras.main;
    for (var r = 0; r < this.ridges.length; r++) {
      this.ridges[r].tilePositionX = cam.scrollX * this.ridges[r]._par;
    }
    // stars twinkle
    for (var st = 0; st < this.stars.length; st++) {
      var star = this.stars[st];
      star._tw += dt * 2;
      star.setAlpha(0.25 + Math.abs(Math.sin(star._tw)) * 0.45);
    }
    // fireflies drift
    for (var fi = 0; fi < this.fireflies.length; fi++) {
      var ff = this.fireflies[fi];
      ff._ph += dt * ff._sp;
      ff.x += Math.cos(ff._ph) * 22 * dt; ff.y += Math.sin(ff._ph * 1.3) * 18 * dt;
      ff.setAlpha(0.3 + Math.abs(Math.sin(ff._ph * 2)) * 0.4);
    }
    // moon drift
    this.moon.x = this.W * 0.8 - cam.scrollX * 0.02;
    // storm dust
    if (this.event && this.event.id === 'sandstorm') {
      for (var di = 0; di < this.stormDust.length; di++) {
        var dd = this.stormDust[di];
        dd.x -= dd._sp * dt;
        dd.y += dd._sp * 0.25 * dt;
        if (dd.x < -40) { dd.x = this.W + 40; dd.y = Math.random() * this.H; }
      }
    }
    // hurt vignette pulse
    if (this.hurtPulse > 0) {
      this.hurtPulse = Math.max(0, this.hurtPulse - dt * 2.2);
      var base = (this.event && this.event.id === 'sandstorm') ? 0.85 : 0.55;
      this.vignette.setAlpha(base + this.hurtPulse * T.hurtVignette);
    }

    this.updateHUD();
  }
});

})();
