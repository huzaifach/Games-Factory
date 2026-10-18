/* RUCKUS RAMPAGE — match: state machine (title/countdown/fight/draft/roundEnd/results),
   HUD, KO handling, practice hints, sudden death, scoring. */
var RR = (typeof RR !== 'undefined') ? RR : {};

RR.Match = {
  scene: null, W: 0, H: 0, state: 'boot',
  fighters: [], world: null,
  round: 1, roundWins: {}, usedUpgrades: [],
  timeLeft: 0, matchTime: 0, timeScale: 1, slowmoT: 0,
  playerKOs: 0, playerDeaths: 0, megaKOs: 0,
  isPractice: false, practice: null,
  countdownT: 0, countdownShown: -1, roundEndT: 0, suddenT: -1,
  hud: null, hintG: null, hintTxt: null, hintArrow: null,
  player: null, pausedFrom: null,

  init: function (scene) {
    this.scene = scene;
    this.W = scene.scale.width; this.H = scene.scale.height;
    RR.FX.init(scene);
    RR.Weapons.scene = scene;
  },

  /* world object handed to fighters / weapons each frame */
  makeWorld: function () {
    var self = this;
    if (!this.world) {
      this.world = {
        fighters: this.fighters, arena: null, fx: RR.FX, audio: RR.Audio,
        weapons: RR.Weapons, playerCtl: { mx: 0, jump: false, hit: false },
        time: 0,
        feed: function (l) { RR.FX.feed(l); },
        shake: function (a) { self.shake(a); },
        onKO: function (f) { self.onKO(f); },
        onBigHit: function (a, v, w) { self.onBigHit(a, v, w); },
        nearestFoe: function (f, r) { return self.nearestFoe(f, r); }
      };
    }
    this.world.fighters = this.fighters;
    this.world.arena = RR.Arena.descriptor();
    this.world.time = this.matchTime;
    return this.world;
  },

  shake: function (amt) {
    try { this.scene.cameras.main.shake(140, amt); } catch (e) {}
  },

  /* ================= title ================= */
  showTitle: function () {
    this.state = 'title';
    this._clearFight();
    RR.Arena.build(this.scene, RR.Save.data.arena, this.W, this.H);
    RR.Audio.startMusic(RR.Save.data.arena);
    var self = this;
    RR.UI.showTitle(this.W, this.H, RR.Save.data, {
      fight: function () {
        if (RR.Save.data.seenHowTo) self.showPracticeIntro();
        else RR.UI.showHowTo(self.W, self.H, {
          back: function () { self.showTitle(); },
          fight: function () { RR.Save.data.seenHowTo = true; RR.Save.save(); self.showPracticeIntro(); }
        });
      },
      howto: function () {
        RR.UI.showHowTo(self.W, self.H, {
          back: function () { self.showTitle(); },
          fight: function () { RR.Save.data.seenHowTo = true; RR.Save.save(); self.showPracticeIntro(); }
        });
      },
      costumes: function () {
        RR.UI.showGallery(self.W, self.H, 'costumes', RR.Save.data, { done: function () { self.showTitle(); } });
      },
      arena: function () {
        RR.UI.showGallery(self.W, self.H, 'arenas', RR.Save.data, { done: function () { self.showTitle(); } });
      }
    });
  },

  showPracticeIntro: function () {
    var self = this;
    RR.UI.showPracticeIntro(this.W, this.H, function () { self.startPractice(); });
  },

  /* ================= setup ================= */
  _clearFight: function () {
    var i;
    for (i = 0; i < this.fighters.length; i++) {
      var f = this.fighters[i];
      if (f.view) f.view.destroy();
    }
    this.fighters = [];
    this._clearHud();
    RR.UI.hide();
    RR.FX.reset();
    RR.FX.clearFeed();
    RR.Weapons.reset();
    RR.Input.setVisible(false);
  },

  _spawnPoints: function (n) {
    var pts = [], hw = RR.Arena.halfW;
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0.5 : i / (n - 1);
      pts.push({ x: RR.Arena.cx - hw * 0.8 + t * hw * 1.6, y: RR.Arena.floorY - 220 - (i % 2) * 60 });
    }
    return pts;
  },

  _makeFighters: function (defs) {
    var pts = this._spawnPoints(defs.length), self = this;
    this.fighters = defs.map(function (d, i) {
      var f = RR.makeFighter(self.scene, {
        id: d.id, name: d.name, color: d.color, style: d.style,
        speed: d.speed, power: d.power, isPlayer: !!d.isPlayer,
        x: pts[i].x, y: pts[i].y, face: pts[i].x < RR.Arena.cx ? 1 : -1,
        costume: d.isPlayer ? RR.Save.data.costume : 'none'
      });
      f.up = d.up || {};
      return f;
    });
    this.player = this.fighters[0];
  },

  startPractice: function () {
    this._clearFight();
    this.isPractice = true; this.state = 'countdown';
    RR.Arena.build(this.scene, RR.Save.data.arena, this.W, this.H);
    RR.Weapons.init(this.scene, RR.Arena);
    this._makeFighters([
      { id: 'you', name: 'YOU', color: RR.PLAYER_COLOR, isPlayer: true, speed: 1, power: 1 },
      RR.BOTS[5] /* DUMMY */
    ]);
    this.fighters[1].x = RR.Arena.cx + 160;
    /* guaranteed stick near the player for the GRAB hint */
    RR.Weapons.list.push({ id: 'stick', x: this.player.x + 190, y: RR.Arena.floorY - 24, vy: 0, held: null, uses: 3, bob: 0, dropT: 0 });
    this.timeLeft = RR.CFG.PRACTICE_TIME;
    this.practice = { step: 0, startX: this.player.x, kos: 0 };
    this._buildHud('KNOCK DUMMY OFF 2 TIMES!', true);
    this._buildHints();
    this._countdown(1.2, 'PRACTICE');
    RR.Audio.startMusic(RR.Save.data.arena);
    RR.Audio.setCrowd(0.3);
  },

  startMatch: function () {
    this._clearFight();
    this.isPractice = false;
    this.round = 1; this.roundWins = {}; this.usedUpgrades = [];
    this.playerKOs = 0; this.playerDeaths = 0; this.megaKOs = 0;
    RR.Arena.build(this.scene, RR.Save.data.arena, this.W, this.H);
    RR.Weapons.init(this.scene, RR.Arena);
    this._makeFighters([
      { id: 'you', name: 'YOU', color: RR.PLAYER_COLOR, isPlayer: true, speed: 1, power: 1 }
    ].concat(RR.BOTS.slice(0, 5)));
    this.startRound(1);
    RR.Audio.startMusic(RR.Save.data.arena);
  },

  startRound: function (n) {
    this.round = n; this.state = 'countdown';
    this.timeLeft = n === 3 ? RR.CFG.SUDDEN_TIME : RR.CFG.ROUND_TIME;
    this.suddenT = n === 3 ? 5 : -1;
    /* reset bodies, keep upgrades */
    var pts = this._spawnPoints(this.fighters.length);
    for (var i = 0; i < this.fighters.length; i++) {
      var f = this.fighters[i];
      f.x = pts[i].x; f.y = pts[i].y; f.vx = 0; f.vy = 0;
      f.wobble = 0; f.lives = RR.CFG.LIVES; f.alive = true;
      f.weapon = null; f.tumbling = false; f.spin = 0; f.invuln = 0; f.ropeSave = true;
      f.face = pts[i].x < RR.Arena.cx ? 1 : -1;
    }
    RR.Arena.build(this.scene, RR.Save.data.arena, this.W, this.H);
    RR.Weapons.reset(); RR.Weapons.init(this.scene, RR.Arena);
    RR.FX.clearFeed();
    this._buildHud('', false);
    this._countdown(3, 'ROUND ' + n + (n === 3 ? ' — SUDDEN DEATH' : ''));
  },

  _countdown: function (secs, label) {
    this.countdownT = secs; this.countdownShown = -1; this.countdownLabel = label;
  },

  /* ================= HUD ================= */
  _clearHud: function () {
    if (this.hud) { this.hud.destroy(); this.hud = null; }
    if (this.hintG) { this.hintG.destroy(); this.hintG = null; }
    if (this.hintTxt) { this.hintTxt.destroy(); this.hintTxt = null; }
  },
  _buildHud: function (objective, isPractice) {
    this._clearHud();
    var sc = this.scene, W = this.W, H = this.H, self = this;
    var c = sc.add.container(0, 0).setDepth(150);
    var obj = sc.add.text(W / 2, 26, objective, {
      fontFamily: RR.CFG.FONT, fontSize: '23px', color: '#ffd23f', fontStyle: 'bold',
      stroke: '#0d0a24', strokeThickness: 5, backgroundColor: 'rgba(13,10,36,0.55)'
    }).setOrigin(0.5, 0);
    var sub = sc.add.text(W / 2, 58, '', {
      fontFamily: RR.CFG.FONT, fontSize: '21px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#0d0a24', strokeThickness: 4
    }).setOrigin(0.5, 0);
    var mkBtn = function (x, label, cb, fs) {
      var t = sc.add.text(x, 26, label, {
        fontFamily: RR.CFG.FONT, fontSize: (fs || 22) + 'px', color: '#ffffff', fontStyle: 'bold',
        stroke: '#0d0a24', strokeThickness: 4, backgroundColor: 'rgba(13,10,36,0.55)'
      }).setOrigin(0.5, 0).setPadding(10, 8, 10, 8);
      t.setInteractive({ useHandCursor: true });
      t.on('pointerup', cb);
      c.add(t); return t;
    };
    mkBtn(W - 44, 'II', function () { self.pause(); });
    mkBtn(W - 128, RR.Audio.muted ? 'MUTE' : 'SOUND', function () {
      RR.Audio.setMuted(!RR.Audio.muted);
      this.setText(RR.Audio.muted ? 'MUTE' : 'SOUND');
    }, 18);
    c.add([obj, sub]);
    this.hud = c; this.hudObj = obj; this.hudSub = sub;
    this.hudIsPractice = isPractice;
    RR.Input.setVisible(true);
  },
  _hudUpdate: function () {
    if (!this.hud) return;
    var foesLeft = this.fighters.filter(function (f) { return !f.isPlayer && f.lives > 0; }).length;
    if (this.hudIsPractice) {
      this.hudObj.setText('KNOCK DUMMY OFF 2 TIMES!  (' + Math.min(2, this.practice.kos) + '/2)');
      this.hudSub.setText(RR.U.fmtTime(this.timeLeft));
    } else {
      this.hudObj.setText('KNOCK OUT ' + foesLeft + ' BOT' + (foesLeft === 1 ? '' : 'S') + ' — LAST BLOB BOUNCING WINS!');
      this.hudSub.setText('ROUND ' + this.round + '/3     ' + RR.U.fmtTime(this.timeLeft) +
        (this.round === 3 && RR.Arena.shrink ? '     ARENA SHRINKING!' : ''));
    }
  },

  _buildHints: function () {
    this.hintG = this.scene.add.graphics().setDepth(180);
    this.hintTxt = this.scene.add.text(this.W / 2, 110, '', {
      fontFamily: RR.CFG.FONT, fontSize: '27px', color: '#b8e62e', fontStyle: 'bold',
      stroke: '#0d0a24', strokeThickness: 6, align: 'center'
    }).setOrigin(0.5).setDepth(180);
  },
  _hintsUpdate: function (dt) {
    var p = this.practice, pl = this.player, g = this.hintG;
    g.clear();
    var pulse = 1 + Math.sin(this.matchTime * 8) * 0.18;
    var arrow = function (x, y, col) {
      g.fillStyle(col || 0xb8e62e, 0.95);
      var s = 26 * pulse;
      g.fillTriangle(x - s * 0.7, y, x + s * 0.7, y, x, y + s * 1.3);
    };
    if (p.step === 0) {
      this.hintTxt.setText('MOVE!  Push the stick (or A / D)');
      arrow(pl.x, pl.y - 110);
      if (Math.abs(pl.x - p.startX) > 150) { p.step = 1; RR.Audio.pickup(); }
    } else if (p.step === 1) {
      this.hintTxt.setText('GRAB!  Walk over the glowing DHOL-STICK');
      var w = null;
      for (var i = 0; i < RR.Weapons.list.length; i++) if (!RR.Weapons.list[i].held) w = RR.Weapons.list[i];
      if (w) arrow(w.x, w.y - 70);
      if (pl.weapon) { p.step = 2; RR.Audio.pickup(); }
    } else {
      this.hintTxt.setText('WHACK!  Press HIT near DUMMY — knock him OFF!');
      var d = this.fighters[1];
      if (d.alive) arrow(d.x, d.y - 110, 0xff2e88);
    }
  },

  /* ================= pause ================= */
  pause: function () {
    if (this.state !== 'fight' && this.state !== 'countdown') return;
    this.pausedFrom = this.state; this.state = 'paused';
    RR.Input.setVisible(false);
    var self = this;
    RR.UI.showPause(this.W, this.H, {
      resume: function () { RR.UI.hide(); RR.Input.setVisible(true); self.state = self.pausedFrom; },
      restart: function () { RR.UI.hide(); if (self.isPractice) self.startPractice(); else self.startMatch(); },
      quit: function () { self.showTitle(); }
    });
  },

  /* ================= per-frame ================= */
  update: function (time, delta) {
    var dtReal = Math.min(delta / 1000, 0.05);
    /* hit-pause: freeze everything briefly */
    if (RR.FX.hitpauseT > 0) { RR.FX.hitpauseT -= dtReal; return; }
    /* slow-mo easing */
    if (this.slowmoT > 0) { this.slowmoT -= dtReal; this.timeScale = 0.25; }
    else this.timeScale = Math.min(1, this.timeScale + dtReal * 3);
    var dt = dtReal * this.timeScale;
    this.matchTime += dt;

    var world = this.makeWorld();

    if (this.state === 'title') {
      RR.Arena.update(dt, { fighters: [] });
      RR.FX.update(dt);
      return;
    }
    if (this.state === 'paused' || this.state === 'draft' || this.state === 'results') {
      return; /* frozen behind UI */
    }
    if (this.state === 'countdown') {
      RR.Arena.update(dt, world); RR.Weapons.draw(this.matchTime); RR.FX.update(dt);
      this._drawFighters(world, dt);
      var prev = Math.ceil(this.countdownT);
      this.countdownT -= dtReal;
      var cur = Math.ceil(this.countdownT);
      if (cur !== prev && cur >= 0) {
        if (cur === 0) {
          RR.UI.banner(this.W, this.H, this.countdownLabel || 'GO!', '', '#b8e62e', 1.0);
          RR.Audio.countBeep(true);
        } else {
          RR.UI.banner(this.W, this.H, String(cur), this.countdownLabel || '', '#ffffff', 0.8);
          RR.Audio.countBeep(false);
        }
      }
      if (this.countdownT <= 0) { this.state = 'fight'; }
      return;
    }
    if (this.state === 'roundEnd') {
      RR.Arena.update(dt, world); RR.Weapons.update(dt, world); RR.Weapons.draw(this.matchTime);
      this._drawFighters(world, dt); RR.FX.update(dt);
      this.roundEndT -= dtReal;
      if (this.roundEndT <= 0) {
        if (this.isPractice) this._practiceResults();
        else if (this.round < 3) this._draft();
        else this._matchResults();
      }
      return;
    }
    if (this.state !== 'fight') return;

    /* ---- FIGHT ---- */
    this.timeLeft -= dt;
    world.playerCtl = RR.Input.poll();

    RR.Arena.update(dt, world);
    /* keep weapon pads inside the shrinking arena */
    if (RR.Arena.shrink) {
      for (var pi = 0; pi < RR.Weapons.pads.length; pi++) {
        var pad = RR.Weapons.pads[pi];
        pad.x = RR.U.clamp(pad.x, RR.Arena.cx - RR.Arena.halfW + 50, RR.Arena.cx + RR.Arena.halfW - 50);
      }
    }
    RR.Weapons.spawnTick(dt, world);
    RR.Weapons.update(dt, world);
    for (var i = 0; i < this.fighters.length; i++) {
      var f = this.fighters[i];
      if (f.alive) {
        f.update(dt, world);
        RR.Weapons.pickupCheck(f, world);
      } else if (f.lives > 0) {
        f.respawnT -= dt;
        if (f.respawnT <= 0) {
          var sp = this._spawnPoints(1)[0];
          f.respawn(RR.Arena.cx + RR.U.rand(-120, 120), RR.Arena.floorY - 320);
          world.fx.poof(f.x, f.y);
          world.fx.word('BACK!', f.x, f.y - 70, '#29f3ff');
        }
      }
      /* tumble motion trails */
      if (f.alive && f.tumbling && Math.random() < 0.5)
        world.fx.trail(f.x, f.y, f.color);
    }
    RR.Weapons.draw(this.matchTime);
    RR.FX.update(dt);
    this._hudUpdate();
    if (this.isPractice) this._hintsUpdate(dt);

    /* sudden death shrink trigger */
    if (this.suddenT > 0) {
      this.suddenT -= dt;
      if (this.suddenT <= 0) {
        RR.Arena.startShrink();
        RR.UI.banner(this.W, this.H, 'THE ARENA IS SHRINKING!', 'No hiding. No mercy.', '#ff5d5d', 2.2);
        RR.Audio.megaHorn();
        world.fx.feed('The arena is SHRINKING!');
      }
    }

    RR.Audio.setCrowd(RR.U.clamp(0.25 + this._excitement() * 0.5, 0, 1));

    /* ---- round end checks ---- */
    var winner = RR.Rules.roundWinner(this.fighters);
    if (winner) { this._endRound(winner); return; }
    if (this.timeLeft <= 0) {
      var tw = RR.Rules.timeWinner(this.fighters);
      this._endRound(tw);
      return;
    }
    if (this.isPractice && (this.practice.kos >= 2)) { this._endRound(this.player); }
  },

  _excitement: function () {
    var e = 0;
    for (var i = 0; i < this.fighters.length; i++) e += this.fighters[i].wobble / 999;
    return e / Math.max(1, this.fighters.length);
  },

  _drawFighters: function (world, dt) {
    for (var i = 0; i < this.fighters.length; i++) {
      var f = this.fighters[i];
      if (f.alive) { f.view.setPosition(f.x, f.y); f._draw(this.matchTime); }
      else f.view.setVisible(false);
    }
  },

  nearestFoe: function (f, range) {
    var best = null, bd = (range || 99999) * (range || 99999);
    for (var i = 0; i < this.fighters.length; i++) {
      var o = this.fighters[i];
      if (o === f || !o.alive) continue;
      var d = RR.U.dist2(f.x, f.y, o.x, o.y);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  },

  /* ================= KO ================= */
  onKO: function (f) {
    var world = this.world;
    var wob = f.wobble;
    var killer = f.lastHitBy && f.lastHitBy !== f ? f.lastHitBy : null;
    var mega = wob >= RR.CFG.MEGA_WOBBLE;
    f.knockOut();

    /* feed line */
    var line;
    if (killer) {
      var wname = 'FISTS';
      if (killer._lastWeaponUsed) wname = killer._lastWeaponUsed;
      line = RR.FeedLine(mega ? 'mega' : 'melee', killer.name, f.name, null).replace('{w}', wname);
      if (killer.isPlayer) {
        this.playerKOs++;
        if (mega) this.megaKOs++;
      }
      killer.kos++;
    } else {
      line = RR.FeedLine('hazard', f.name, f.name);
    }
    world.fx.feed(line);
    if (this.isPractice && f.id === 'dummy') this.practice.kos++;

    /* juice */
    var kx = RR.U.clamp(f.x, 40, this.W - 40), ky = RR.U.clamp(f.y, 80, this.H - 80);
    world.fx.starBurst(kx, ky, mega);
    if (mega) {
      this.slowmoT = 0.85;
      world.fx.word('MEGA KO!', kx, ky - 60, '#ffd23f');
      world.audio.megaHorn(); world.audio.cheer();
      RR.Arena.crowdJump();
      this.shake(0.02);
      world.fx.confetti(this.W);
    } else {
      world.fx.word(RR.U.choice(['KOd!', 'BYEEE!', 'SMASHED!']), kx, ky - 50, '#ffffff');
      world.audio.koWhistle(); world.audio.ooh(false);
      this.shake(0.008);
    }
    if (f.isPlayer) { this.playerDeaths++; }
  },

  onBigHit: function (attacker, victim, weaponId) {
    var world = this.world;
    attacker._lastWeaponUsed = weaponId && RR.WEAPONS[weaponId] ? RR.WEAPONS[weaponId].name : 'FISTS';
    world.fx.starBurst(victim.x, victim.y - 10, victim.wobble > 150);
    world.fx.word(RR.U.choice(['POW!', 'THWACK!', 'BONK!', 'SMASH!']), victim.x, victim.y - 70, '#ffd23f');
    if (victim.wobble > 150) { world.audio.ooh(true); RR.Arena.crowdJump(); }
  },

  /* ================= round / match end ================= */
  _endRound: function (winner) {
    this.state = 'roundEnd'; this.roundEndT = 2.6;
    this.roundWins[winner.id] = (this.roundWins[winner.id] || 0) + 1;
    var w = this.world;
    if (this.isPractice) {
      RR.UI.banner(this.W, this.H, 'PRACTICE DONE!', 'Nice whacking!', '#b8e62e', 2.2);
    } else {
      RR.UI.banner(this.W, this.H,
        winner.isPlayer ? 'YOU WIN ROUND ' + this.round + '!' : winner.name + ' TAKES ROUND ' + this.round,
        '', winner.isPlayer ? '#b8e62e' : '#ff9f1c', 2.2);
    }
    w.fx.confetti(this.W);
    w.audio.fanfare(); w.audio.cheer();
    RR.Arena.crowdJump();
    RR.Input.setVisible(false);
  },

  _draft: function () {
    this.state = 'draft';
    var self = this;
    var options = RR.Draft.offer(this.usedUpgrades);
    RR.UI.showDraft(this.W, this.H, options, this.round + 1, function (opt) {
      self.player.up[opt.id] = true;
      self.usedUpgrades.push(opt.id);
      RR.FX.feed('YOU picked ' + opt.name + '!');
      /* bots draft too (fair + funny) */
      for (var i = 0; i < self.fighters.length; i++) {
        var b = self.fighters[i];
        if (b.isPlayer || b.id === 'dummy') continue;
        var bu = RR.U.choice(RR.UPGRADES.filter(function (u) { return !b.up[u.id]; }));
        if (bu) { b.up[bu.id] = true; RR.FX.feed(b.name + ' got ' + bu.name + '!'); }
      }
      RR.UI.hide();
      self.startRound(self.round + 1);
    });
  },

  _practiceResults: function () {
    this.state = 'results';
    var self = this;
    RR.Audio.stopMusic();
    RR.UI.showResults(this.W, this.H, {
      won: null, title: 'READY?', subtitle: 'You learned the ruckus. Now the REAL fight!',
      stats: [['DUMMY KOs', this.practice.kos + '/2'], ['Your KOs', this.playerKOs], ['Times KO’d', this.playerDeaths]],
      stars: this.practice.kos >= 2 ? 2 : 1, unlocks: [],
      rematchLabel: 'PRACTICE AGAIN', titleLabel: 'START MATCH!'
    }, {
      rematch: function () { self.startPractice(); },
      title: function () { self.startMatch(); }
    });
    /* relabel buttons for practice flow */
    RR.Audio.fanfare();
  },

  _matchResults: function () {
    this.state = 'results';
    var self = this;
    var pw = this.roundWins.you || 0;
    var bestBot = 0;
    for (var i = 0; i < this.fighters.length; i++) {
      var f = this.fighters[i];
      if (!f.isPlayer) bestBot = Math.max(bestBot, this.roundWins[f.id] || 0);
    }
    var won = pw >= 2, tie = !won && pw === bestBot && pw > 0;
    var save = RR.Save.data;
    save.matches++;
    if (won) save.wins++;
    var stars = RR.Progress.starsFor(won, this.playerKOs);
    save.stars += stars;
    save.totalKOs += this.playerKOs;
    save.bestKOs = Math.max(save.bestKOs, this.playerKOs);
    var unlocks = RR.Progress.checkUnlocks(save);
    var unlockNames = unlocks.costumes.map(function (c) { return 'Costume: ' + c.name; })
      .concat(unlocks.arenas.map(function (a) { return 'Arena: ' + a.name; }));
    RR.Save.save();
    RR.Audio.stopMusic();
    if (won) { RR.Audio.fanfare(); RR.Audio.cheer(); RR.FX.confetti(this.W); }
    else if (tie) RR.Audio.fanfare();
    else RR.Audio.sadTrom();
    RR.UI.showResults(this.W, this.H, {
      won: won, tie: tie,
      title: won ? 'YOU WIN!' : (tie ? 'DRAW!' : 'YOU LOSE!'),
      subtitle: won ? 'Champion of the akhara!' : (tie ? 'Nobody blinked. Rematch?' : 'The bots are laughing. Rematch?'),
      stats: [
        ['Rounds won', pw + '/3'],
        ['Your KOs', this.playerKOs],
        ['MEGA KOs', this.megaKOs],
        ['Times KO’d', this.playerDeaths]
      ],
      stars: stars, unlocks: unlockNames
    }, {
      rematch: function () { self.startMatch(); },
      title: function () { self.showTitle(); }
    });
  },

  onResize: function () {
    this.W = this.scene.scale.width; this.H = this.scene.scale.height;
    RR.Input.resize(this.W, this.H);
    if (this.state === 'title') {
      this.showTitle();
    } else if (this.state === 'fight' || this.state === 'countdown') {
      /* rebuild arena around the ongoing fight */
      var theme = RR.Save.data.arena;
      RR.Arena.build(this.scene, theme, this.W, this.H);
      if (RR.Arena.shrink && this.round === 3 && this.suddenT <= 0) RR.Arena.shrink = true;
      for (var i = 0; i < this.fighters.length; i++) {
        var f = this.fighters[i];
        f.x = RR.U.clamp(f.x, RR.Arena.cx - RR.Arena.halfW, RR.Arena.cx + RR.Arena.halfW);
      }
      this._buildHud('', this.hudIsPractice);
      if (this.isPractice) this._buildHints();
    }
  }
};
