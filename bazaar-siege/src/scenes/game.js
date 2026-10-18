/* BAZAAR SIEGE — scenes/game.js
 * THE GAME: lane defense with merge-evolve turrets, 15 hand-designed waves,
 * 2 bosses, 3 festival events, stall economy, guided tutorial, endless mode.
 * All wording follows the global-audience layer (universal English, flavor glossed). */
(function (global) {
  var BS = (global.BS = global.BS || {});
  var C = BS.CONFIG;
  BS.Scenes = BS.Scenes || {};

  var CREAM = '#fff6e8';
  var GOLD = '#ffca7a';
  var CARD_IDS = ['rickshaw', 'kite', 'chai', 'lantern', 'dhol', 'prism'];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dist2(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }

  BS.Scenes.Game = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function () {
      Phaser.Scene.call(this, { key: 'Game' });
    },

    /* ================= CREATE ================= */
    create: function () {
      var scene = this;
      this.cameras.main.fadeIn(350);

      var D = BS.DATA;
      var LOGIC = BS.LOGIC;
      this.D = D; this.LOGIC = LOGIC;

      // ---- State ----
      this.coins = D.ECONOMY.startCoins;
      this.lives = D.ECONOMY.startLives;
      this.wave = 0;
      this.phase = 'build'; // 'build' | 'wave' | 'over'
      this.speed = 1;
      this.paused = false;
      this.hitPause = 0;
      this.eventKind = 'none';
      this.endless = false;
      this.gameTime = 0;   // gameplay clock (pause-safe)
      this.waveTime = 0;
      this.enemies = [];
      this.turrets = [null, null, null, null, null, null, null, null, null];
      this.stallLevels = [0, 0, 0];
      this.selectedCard = null;
      this.selectedTurret = null; // slot index
      this.spawnQueue = [];
      this.sellBtn = null;
      this.rangeRing = null;
      this.lastCoinSfx = 0;
      this.bossActive = false;

      this.buildBackground();
      this.buildSlotsAndStalls();
      this.buildHUD();
      this.buildDock();
      this.buildPools();
      this.buildTutorial();

      this.setHint(this.phase === 'build'
        ? 'Hold the bazaar till dawn — Wave 1 of 15. Place turrets, then strike the drum.'
        : '');

      this.input.on('pointerdown', function () {
        if (BS.audio) { BS.audio.unlock(); }
      });
      if (BS.audio) { BS.audio.startAmbience(); }
      // The drum is ready to strike: NEXT WAVE is visible from the start.
      this.nextBtn.setVisible(true);
      this.scoutBtn.setVisible(true);
      this.refreshHUD();
    },

    /* ================= BACKGROUND ================= */
    buildBackground: function () {
      var W = C.WIDTH;
      this.add.image(360, 640, 'bg-sky').setDisplaySize(800, 1400).setDepth(0);
      this.add.image(590, 150, 'bg-moon').setScale(1.1).setDepth(1);
      this.add.image(360, 985, 'bg-minaret').setDisplaySize(760, 285).setAlpha(0.9).setDepth(1);
      // Stars.
      for (var i = 0; i < 40; i++) {
        var st = this.add.circle(Math.random() * 720, Math.random() * 260, 1.6, 0xfff6e8, 0.8).setDepth(1);
        st.setData('phase', Math.random() * 6.28);
        (this._stars = this._stars || []).push(st);
      }
      // Bazaar street: awning row behind the battlefield.
      for (var a = 0; a < 4; a++) {
        this.add.image(100 + a * 200, 200, 'bg-awning').setDisplaySize(200, 58).setDepth(2);
      }
      // Swaying lanterns.
      this._lanterns = [];
      for (var l = 0; l < 10; l++) {
        var ln = this.add.image(50 + l * 70, 250 + (l % 2) * 26, 'bg-lantern').setDepth(3);
        ln.setData('phase', l * 0.9);
        this._lanterns.push(ln);
      }
      // Fairy-light strings.
      this._bulbs = [];
      for (var f = 0; f < 40; f++) {
        var fx = 10 + f * 18;
        var fy = 300 + Math.sin(f / 40 * Math.PI * 2) * 30;
        var bulb = this.add.image(fx, fy, 'bg-fairybulb').setDepth(3);
        bulb.setData('phase', f * 1.1);
        this._bulbs.push(bulb);
      }
      // Lanes: subtly lighter stone paths with diya edges.
      this._laneTop = [];
      for (var li = 0; li < 3; li++) {
        var ly = C.LANES[li];
        for (var t = 0; t < 6; t++) {
          this.add.image(60 + t * 120, ly, 'bg-lane').setDisplaySize(120, 44).setDepth(4).setAlpha(0.85);
        }
        for (var dxi = 0; dxi < 9; dxi++) {
          this.add.image(50 + dxi * 80, ly - 30, 'bg-diya').setDepth(5);
          this.add.image(50 + dxi * 80, ly + 30, 'bg-diya').setDepth(5);
        }
      }
      // Bazaar gate (left edge).
      this.add.image(30, 600, 'bg-gate').setDepth(6);
      // Red vignette for leaks (hidden). Object alpha 0; tweens drive alpha.
      this._vignette = this.add.rectangle(360, 640, 720, 1280, 0xe33e5f).setAlpha(0).setDepth(700);
      // Blackout dim layer (hidden). Object alpha 0; tweens drive alpha.
      this._dim = this.add.rectangle(360, 640, 720, 1280, 0x0a1030).setAlpha(0).setDepth(690);
      // Drifting petals (ambient).
      this._petals = [];
      for (var p = 0; p < 12; p++) {
        var pt = this.add.image(Math.random() * 720, Math.random() * 1280, 'p-petal').setDepth(6);
        pt.setData('vy', 12 + Math.random() * 14);
        pt.setData('phase', Math.random() * 6.28);
        pt.setAlpha(0.7);
        this._petals.push(pt);
      }
    },

    /* ================= SLOTS & STALLS ================= */
    buildSlotsAndStalls: function () {
      var scene = this;
      this.slotImgs = [];
      this.slotRings = [];
      for (var i = 0; i < 9; i++) {
        (function (idx) {
          var pos = C.SLOTS[idx];
          var img = scene.add.image(pos.x, pos.y, 'slot-rooftop').setDepth(8);
          img.setInteractive({ useHandCursor: true });
          var ring = scene.add.image(pos.x, pos.y, 'p-ring').setDepth(7).setVisible(false);
          ring.setTint(0xffca7a);
          scene.slotImgs.push(img);
          scene.slotRings.push(ring);
          img.on('pointerup', function () { scene.onSlotTap(idx); });
        })(i);
      }
      // Stalls with link-lines to the buff row (slots 6,7,8).
      this.stallImgs = [];
      this.linkLines = [];
      this._linkGfx = this.add.graphics().setDepth(7);
      for (var s = 0; s < 3; s++) {
        (function (si) {
          var sd = scene.D.STALLS[si];
          var img = scene.add.image(sd.x, sd.y, 'stall-1').setDepth(9);
          img.setInteractive({ useHandCursor: true });
          img.on('pointerup', function () { scene.openStallPanel(si); });
          scene.stallImgs.push(img);
        })(s);
      }
      this.drawLinkLines();
    },

    drawLinkLines: function () {
      var gfx = this._linkGfx;
      gfx.clear();
      for (var s = 0; s < 3; s++) {
        var lvl = this.stallLevels[s];
        var sd = this.D.STALLS[s];
        var alpha = lvl === 0 ? 0.12 : 0.25 + lvl * 0.22;
        gfx.lineStyle(3 + lvl, 0xffca7a, alpha);
        for (var k = 0; k < 3; k++) {
          var slot = C.SLOTS[6 + k];
          gfx.lineBetween(sd.x, sd.y - 40, slot.x, slot.y + 40);
        }
      }
    },

    /* ================= HUD ================= */
    buildHUD: function () {
      var scene = this;
      // Top bar.
      var bar = this.add.graphics().setDepth(800);
      bar.fillStyle(0x1c1430, 0.92); bar.fillRect(0, 0, 720, 110);
      bar.lineStyle(2, 0xffca7a, 0.6); bar.lineBetween(0, 110, 720, 110);

      this.add.image(44, 55, 'ui-coin').setDepth(801);
      this.coinText = this.add.text(70, 55, '150', {
        fontFamily: 'Georgia, serif', fontSize: '32px', color: CREAM, fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(801);

      this.add.image(220, 55, 'ui-heart').setDepth(801);
      this.livesText = this.add.text(248, 55, '20', {
        fontFamily: 'Georgia, serif', fontSize: '32px', color: CREAM, fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(801);

      this.waveText = this.add.text(400, 55, 'Wave -/15', {
        fontFamily: 'Georgia, serif', fontSize: '28px', color: GOLD, fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(801);

      var speedBtn = BS.ui.button(this, 548, 55, '1x', function () {
        scene.speed = scene.speed === 1 ? 2 : 1;
        speedBtn._label.setText(scene.speed + 'x');
      }, { w: 92, h: 88, fontSize: 30 });
      speedBtn._label = speedBtn.list[1];
      speedBtn.setDepth(801);

      this._pauseBtn = BS.ui.button(this, 656, 55, 'II', function () {
        scene.togglePause();
      }, { w: 92, h: 88, fontSize: 30 });
      this._pauseBtn._label = this._pauseBtn.list[1];
      this._pauseBtn.setDepth(801);

      // Hint pill under the HUD.
      this.hint = BS.ui.hintPill(this, 360, C.HINT_Y, 660);

      // Bottom row: Scout + Next Wave.
      this.scoutBtn = BS.ui.button(this, 120, 1216, 'SCOUT', function () {
        scene.openScout();
      }, { w: 190, h: 96, fontSize: 28 });
      this.nextBtn = BS.ui.button(this, 470, 1216, 'NEXT WAVE', function () {
        scene.onNextWave();
      }, { w: 400, h: 96, fontSize: 32 });
      this.nextBtn.setVisible(false);
    },

    refreshHUD: function () {
      this.coinText.setText(String(this.coins));
      this.livesText.setText(String(this.lives));
      this.waveText.setText(this.endless ? 'Wave ' + this.wave : 'Wave ' + Math.max(1, this.wave) + '/15');
      // Dim cards the player cannot afford.
      for (var i = 0; i < this.cardObjs.length; i++) {
        var card = this.cardObjs[i];
        var cost = this.D.TURRETS[CARD_IDS[i]].cost;
        card.bg.setAlpha(this.coins >= cost ? 1 : 0.5);
      }
    },

    setHint: function (text) {
      if (this.tutorial && this.tutorial.active) { return; } // tutorial owns the hint line
      this.hint.set(text);
    },

    /* ================= DOCK (turret cards) ================= */
    buildDock: function () {
      var scene = this;
      var dockBg = this.add.graphics().setDepth(800);
      dockBg.fillStyle(0x1c1430, 0.94); dockBg.fillRect(0, C.DOCK_TOP, 720, 300);
      dockBg.lineStyle(2, 0xffca7a, 0.6); dockBg.lineBetween(0, C.DOCK_TOP, 720, C.DOCK_TOP);

      this.cardObjs = [];
      var gap = 4, totalW = 6 * C.CARD_W + 5 * gap;
      var startX = (720 - totalW) / 2 + C.CARD_W / 2;
      for (var i = 0; i < 6; i++) {
        (function (ci) {
          var id = CARD_IDS[ci];
          var def = scene.D.TURRETS[id];
          var cx = startX + ci * (C.CARD_W + gap);
          var cy = C.DOCK_TOP + 78;
          var card = scene.add.container(cx, cy).setDepth(801);
          var bg = scene.add.image(0, 0, 'ui-card');
          var img = scene.add.image(0, -38, 'turret-' + id).setScale(0.62);
          var name = scene.add.text(0, -2, def.name, {
            fontFamily: 'Georgia, serif', fontSize: '16px', color: GOLD, fontStyle: 'bold', align: 'center'
          }).setOrigin(0.5, 0);
          var gloss = scene.add.text(0, 20, def.gloss.split('—')[1].trim(), {
            fontFamily: 'Georgia, serif', fontSize: '12.5px', color: CREAM, align: 'center',
            wordWrap: { width: 104 }
          }).setOrigin(0.5, 0);
          var coin = scene.add.image(-22, 58, 'ui-coin').setScale(0.7);
          var cost = scene.add.text(-6, 58, String(def.cost), {
            fontFamily: 'Georgia, serif', fontSize: '20px', color: CREAM, fontStyle: 'bold'
          }).setOrigin(0, 0.5);
          card.add([bg, img, name, gloss, coin, cost]);
          card.setSize(C.CARD_W, C.CARD_H);
          card.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0, 0, C.CARD_W, C.CARD_H),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
          });
          var glow = scene.add.image(cx, cy, 'p-ring').setDepth(800).setVisible(false);
          glow.setTint(0xffca7a); glow.setScale(2.4, 2.9);
          card.on('pointerup', function () { scene.onCardTap(ci); });
          scene.cardObjs.push({ cont: card, bg: bg, img: img, glow: glow, id: id, x: cx, y: cy });
        })(i);
      }
    },

    onCardTap: function (ci) {
      if (this.phase !== 'build' || this.paused) { return; }
      var card = this.cardObjs[ci];
      var def = this.D.TURRETS[card.id];
      if (this.coins < def.cost) {
        this.flashHint('Not enough coins for ' + def.name + ' (' + def.cost + ').');
        this.shakeObj(card.cont);
        return;
      }
      this.selectedCard = card.id;
      this.deselectTurret();
      for (var i = 0; i < this.cardObjs.length; i++) {
        this.cardObjs[i].glow.setVisible(this.cardObjs[i].id === card.id);
      }
      // Pulse empty rooftops.
      for (var s = 0; s < 9; s++) {
        if (!this.turrets[s]) {
          this.slotRings[s].setVisible(true);
          this.tweens.add({ targets: this.slotRings[s], scaleX: 1.25, scaleY: 1.25, alpha: 0.5, duration: 450, yoyo: true, repeat: -1 });
        }
      }
      this.setHint(def.gloss + '. Tap a glowing rooftop to place it.');
      if (this.tutorial) { this.tutorial.onCard(card.id); }
    },

    clearCardSelection: function () {
      this.selectedCard = null;
      for (var i = 0; i < this.cardObjs.length; i++) { this.cardObjs[i].glow.setVisible(false); }
      for (var s = 0; s < 9; s++) {
        this.tweens.killTweensOf(this.slotRings[s]);
        this.slotRings[s].setVisible(false).setScale(1).setAlpha(1);
      }
    },

    onSlotTap: function (idx) {
      if (this.phase !== 'build' || this.paused) { return; }
      if (this.selectedCard && !this.turrets[idx]) {
        this.placeTurret(idx, this.selectedCard);
        return;
      }
      if (this.turrets[idx] && !this.selectedCard) {
        this.selectTurret(idx);
        return;
      }
      if (this.turrets[idx] && this.selectedCard) {
        this.flashHint('That rooftop is taken — pick a glowing one.');
      }
    },

    placeTurret: function (idx, type) {
      var def = this.D.TURRETS[type];
      if (this.coins < def.cost || this.turrets[idx]) { return; }
      this.coins -= def.cost;
      var pos = C.SLOTS[idx];
      var cont = this.add.container(pos.x, pos.y).setDepth(22);
      var img = this.add.image(0, -6, 'turret-' + type).setScale(0.85);
      var evoBadge = this.add.image(24, -34, 'ui-star').setScale(0.45).setVisible(false);
      cont.add([img, evoBadge]);
      cont.setSize(96, 96);
      cont.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, 96, 96),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        draggable: true,
        useHandCursor: true
      });
      var turret = {
        slot: idx, type: type, def: def, evolved: false,
        cont: cont, img: img, evoBadge: evoBadge,
        cd: 0.4, scanT: 0, target: null, beamT: 0, beamTarget: null,
        dragFrom: idx
      };
      this.turrets[idx] = turret;
      this.bindTurretDrag(turret);
      // Placement pop: scale 0 -> 1 with Back.easeOut + dust ring + petal puff.
      cont.setScale(0.01);
      this.tweens.add({ targets: cont, scaleX: 1, scaleY: 1, duration: 380, ease: 'Back.easeOut' });
      this.spawnRing(pos.x, pos.y + 20, 0xd9c9a8, 0.8);
      this.burst(pos.x, pos.y, 'p-petal', 6, 60, 140, 0.7);
      if (BS.audio) { BS.audio.place(); }
      this.clearCardSelection();
      this.refreshHUD();
      this.setHint(def.name + ' placed! Tap NEXT WAVE when ready, or place more.');
      if (this.tutorial) { this.tutorial.onPlaced(idx, type); }
    },

    selectTurret: function (idx) {
      this.deselectTurret();
      this.selectedTurret = idx;
      var t = this.turrets[idx];
      if (!t) { return; }
      var pos = C.SLOTS[idx];
      var stats = this.turretStats(t);
      this.rangeRing = this.add.container(pos.x, pos.y).setDepth(21);
      var c1 = this.add.circle(0, 0, stats.range, 0xffca7a, 0.07);
      var ringStroke = this.add.graphics();
      ringStroke.lineStyle(2, 0xffca7a, 0.7);
      ringStroke.strokeCircle(0, 0, stats.range);
      this.rangeRing.add([c1, ringStroke]);
      // Sell button.
      var refund = Math.floor(t.def.cost * this.D.ECONOMY.sellRefund * (t.evolved ? 2 : 1));
      var sell = BS.ui.button(this, pos.x, pos.y - 110, 'Sell +' + refund, function () {
        this.sellTurret(idx);
      }.bind(this), { w: 170, h: 88, fontSize: 26 });
      sell.setDepth(850);
      this.sellBtn = sell;
    },

    deselectTurret: function () {
      this.selectedTurret = null;
      if (this.rangeRing) { this.rangeRing.destroy(); this.rangeRing = null; }
      if (this.sellBtn) { this.sellBtn.destroy(); this.sellBtn = null; }
    },

    sellTurret: function (idx) {
      var t = this.turrets[idx];
      if (!t) { return; }
      var refund = Math.floor(t.def.cost * this.D.ECONOMY.sellRefund * (t.evolved ? 2 : 1));
      this.coins += refund;
      if (t.beamGfx) { t.beamGfx.destroy(); t.beamGfx = null; }
      t.cont.destroy();
      this.turrets[idx] = null;
      this.deselectTurret();
      if (BS.audio) { BS.audio.sell(); }
      this.burst(C.SLOTS[idx].x, C.SLOTS[idx].y, 'p-spark', 8, 60, 120, 0.5);
      this.refreshHUD();
      this.setHint('Sold for ' + refund + ' coins.');
    },

    turretStats: function (t) {
      // Resolve live stats: evolved form + stall buff + event modifier.
      var def = t.evolved ? this.D.EVOLVED[t.type] : t.def;
      var stallMult = 1.0;
      if (this.D.STALL_BUFF_SLOTS.indexOf(t.slot) >= 0) {
        var best = 0;
        for (var s = 0; s < 3; s++) { best = Math.max(best, this.stallLevels[s]); }
        stallMult = this.LOGIC.stallBuff(best);
      }
      var eventMult = this.LOGIC.eventModifier(this.eventKind, t.type);
      return {
        dmg: def.dmg * stallMult * eventMult,
        rate: def.rate,
        range: def.range,
        splash: def.splash || 0
      };
    },

    /* ================= DRAG & MERGE ================= */
    bindTurretDrag: function (turret) {
      var scene = this;
      var cont = turret.cont;
      scene.input.setDraggable(cont);
      cont.on('dragstart', function () {
        if (scene.phase !== 'build' || scene.paused) { return; }
        cont.setDepth(60);
        scene.deselectTurret();
        scene.clearCardSelection();
      });
      cont.on('drag', function (pointer, dragX, dragY) {
        if (scene.phase !== 'build' || scene.paused) { return; }
        cont.x = dragX; cont.y = dragY;
      });
      cont.on('dragend', function (pointer) {
        if (scene.phase !== 'build' || scene.paused) { return; }
        cont.setDepth(22);
        var from = turret.slot;
        var targetSlot = scene.slotUnderPointer(pointer.x, pointer.y);
        var home = C.SLOTS[from];
        if (targetSlot < 0 || targetSlot === from) {
          scene.snapBack(cont, home);
          return;
        }
        var other = scene.turrets[targetSlot];
        if (!other) {
          // Move to the empty rooftop.
          scene.turrets[targetSlot] = turret;
          scene.turrets[from] = null;
          turret.slot = targetSlot;
          var np = C.SLOTS[targetSlot];
          scene.tweens.add({ targets: cont, x: np.x, y: np.y, duration: 200, ease: 'Quad.easeOut' });
          if (BS.audio) { BS.audio.place(); }
          return;
        }
        var evolved = scene.LOGIC.mergeResult(
          { id: turret.type, evolved: turret.evolved },
          { id: other.type, evolved: other.evolved }
        );
        if (evolved) {
          scene.doMerge(from, targetSlot, evolved);
        } else {
          scene.snapBack(cont, home);
          if (other.evolved || turret.evolved) {
            scene.shakeObj(other.cont);
            scene.flashHint('Already evolved — it fights at full glory!');
          }
        }
      });
    },

    slotUnderPointer: function (x, y) {
      for (var i = 0; i < 9; i++) {
        var p = C.SLOTS[i];
        if (dist2(x, y, p.x, p.y) < 70 * 70) { return i; }
      }
      return -1;
    },

    snapBack: function (cont, home) {
      this.tweens.add({ targets: cont, x: home.x, y: home.y, duration: 220, ease: 'Back.easeOut' });
    },

    shakeObj: function (obj) {
      var x0 = obj.x;
      this.tweens.add({
        targets: obj, x: x0 - 10, duration: 60, yoyo: true, repeat: 3,
        onComplete: function () { obj.x = x0; }
      });
    },

    doMerge: function (fromSlot, toSlot, evolvedDef) {
      var scene = this;
      var a = this.turrets[fromSlot];
      var b = this.turrets[toSlot];
      var pos = C.SLOTS[toSlot];
      // Remove the dragged one; transform the target in place.
      a.cont.destroy();
      this.turrets[fromSlot] = null;
      b.evolved = true;
      b.def = evolvedDef;
      // 70ms hit-pause for drama.
      this.hitPause = C.HIT_PAUSE_MS / 1000;
      if (BS.audio) { BS.audio.mergeSwirl(); }
      // White-gold flash.
      var flash = this.add.rectangle(360, 640, 720, 1280, 0xfff6e8, 0).setDepth(600);
      this.tweens.add({ targets: flash, alpha: 0.55, duration: 90, yoyo: true, onComplete: function () { flash.destroy(); } });
      // Petal swirl converging on the turret.
      for (var i = 0; i < 16; i++) {
        (function (k) {
          var ang = k / 16 * Math.PI * 2;
          var px = pos.x + Math.cos(ang) * 130, py = pos.y + Math.sin(ang) * 130;
          var petal = scene.add.image(px, py, 'p-petal').setDepth(610);
          scene.tweens.add({
            targets: petal, x: pos.x, y: pos.y, scaleX: 0.2, scaleY: 0.2,
            duration: 420, ease: 'Quad.easeIn',
            onComplete: function () { petal.destroy(); }
          });
        })(i);
      }
      // Scale punch 1 -> 1.35 -> 1; swap texture at the peak.
      var cont = b.cont;
      this.tweens.add({
        targets: cont, scaleX: 1.35, scaleY: 1.35, duration: 200, ease: 'Quad.easeOut',
        onComplete: function () {
          b.img.setTexture('turret-' + b.type + '-evo');
          b.evoBadge.setVisible(true);
          scene.tweens.add({ targets: b.evoBadge, scaleX: 0.7, scaleY: 0.7, duration: 220, ease: 'Back.easeOut' });
          scene.tweens.add({ targets: cont, scaleX: 1, scaleY: 1, duration: 260, ease: 'Back.easeOut' });
        }
      });
      this.spawnRing(pos.x, pos.y, 0xffca7a, 1.6);
      this.burst(pos.x, pos.y, 'p-spark', 12, 80, 200, 0.8);
      this.spawnDmgNum(pos.x, pos.y - 70, 'EVOLVED!', true);
      this.refreshHUD();
      if (this.tutorial) { this.tutorial.onMerge(b.type); }
    },

    /* ================= STALLS ================= */
    openStallPanel: function (si) {
      if (this.phase !== 'build' || this.paused) { return; }
      this.closePanels();
      var sd = this.D.STALLS[si];
      var lvl = this.stallLevels[si];
      var p = BS.ui.panel(this, 360, 560, 560, 380).setDepth(900);
      this._openPanel = p;
      var title = this.add.text(0, -140, sd.name, {
        fontFamily: 'Georgia, serif', fontSize: '34px', color: GOLD, fontStyle: 'bold'
      }).setOrigin(0.5);
      var sub = this.add.text(0, -100, 'Buffs the 3 rooftops in the row above it.', {
        fontFamily: 'Georgia, serif', fontSize: '21px', color: CREAM, align: 'center',
        wordWrap: { width: 480 }
      }).setOrigin(0.5);
      p.add([title, sub]);
      // Level pips.
      for (var k = 0; k < 3; k++) {
        var pip = this.add.circle(-60 + k * 60, -40, 20, k < lvl ? 0xffca7a : 0x4a3a5a).setOrigin(0.5);
        p.add(pip);
      }
      var info;
      if (lvl >= this.D.STALL_MAX_LEVEL) {
        info = this.add.text(0, 20, 'Max level: +120% damage to the row above.', {
          fontFamily: 'Georgia, serif', fontSize: '23px', color: CREAM, align: 'center'
        }).setOrigin(0.5);
        p.add(info);
      } else {
        var next = this.D.STALL_LEVELS[lvl + 1];
        info = this.add.text(0, 10, 'Next: +' + Math.round((next.mult - 1) * 100) + '% damage — ' + next.cost + ' coins', {
          fontFamily: 'Georgia, serif', fontSize: '23px', color: CREAM, align: 'center'
        }).setOrigin(0.5);
        p.add(info);
        var up = BS.ui.button(this, 0, 110, 'Upgrade (' + next.cost + ')', function () {
          this.upgradeStall(si);
        }.bind(this), { w: 340, h: 92, fontSize: 28 });
        p.add(up);
      }
      var close = BS.ui.button(this, 0, -140, 'X', function () {
        this.closePanels();
      }.bind(this), { w: 88, h: 88, fontSize: 28 });
      close.x = 236; close.y = -146;
      p.add(close);
      p.setScale(0.9); p.setAlpha(0);
      this.tweens.add({ targets: p, scaleX: 1, scaleY: 1, alpha: 1, duration: 250, ease: 'Back.easeOut' });
    },

    upgradeStall: function (si) {
      var lvl = this.stallLevels[si];
      if (lvl >= this.D.STALL_MAX_LEVEL) { return; }
      var cost = this.D.STALL_LEVELS[lvl + 1].cost;
      if (this.coins < cost) {
        this.flashHint('Not enough coins to upgrade this stall.');
        return;
      }
      this.coins -= cost;
      this.stallLevels[si] = lvl + 1;
      this.stallImgs[si].setTexture('stall-' + (lvl + 1));
      this.drawLinkLines();
      if (BS.audio) { BS.audio.place(); }
      this.burst(this.D.STALLS[si].x, this.D.STALLS[si].y - 40, 'p-spark', 10, 60, 150, 0.7);
      this.refreshHUD();
      this.closePanels();
      this.setHint(this.D.STALLS[si].name + ' is now level ' + (lvl + 1) + ' — the row above hits harder.');
    },

    closePanels: function () {
      if (this._openPanel) { this._openPanel.destroy(); this._openPanel = null; }
      if (this._scoutPanel) { this._scoutPanel.destroy(); this._scoutPanel = null; }
    },

    /* ================= SCOUT (wave preview) ================= */
    openScout: function () {
      if (this.paused) { return; }
      this.closePanels();
      var nextWave = this.wave + 1;
      var waveDef = nextWave <= 15 ? this.D.WAVES[nextWave - 1] : this.genEndlessWave(nextWave);
      // Cache so the previewed wave is exactly the wave that starts.
      this._nextWaveDef = waveDef;
      var p = BS.ui.panel(this, 360, 560, 600, 560).setDepth(900);
      this._scoutPanel = p;
      var title = this.add.text(0, -240, 'SCOUT — Wave ' + nextWave, {
        fontFamily: 'Georgia, serif', fontSize: '34px', color: GOLD, fontStyle: 'bold'
      }).setOrigin(0.5);
      p.add(title);
      var y = -180;
      var isBossWave = !!waveDef.boss;
      for (var gi = 0; gi < waveDef.groups.length; gi++) {
        var gr = waveDef.groups[gi];
        var isBoss = !!this.D.BOSSES[gr.type];
        var tex = isBoss ? 'boss-' + gr.type : 'enemy-' + gr.type;
        var dispName = isBoss ? this.D.BOSSES[gr.type].name : this.D.ENEMIES[gr.type].displayName;
        var icon = this.add.image(-240, y, tex).setScale(isBoss ? 0.5 : 0.7);
        var label = this.add.text(-190, y, dispName + ' x' + gr.count, {
          fontFamily: 'Georgia, serif', fontSize: '24px', color: CREAM
        }).setOrigin(0, 0.5);
        p.add([icon, label]);
        var hint = this.add.text(-190, y + 30, isBoss ? this.D.BOSSES[gr.type].telegraph : this.D.ENEMIES[gr.type].hint, {
          fontFamily: 'Georgia, serif', fontSize: '18px', color: '#cbb8e8', wordWrap: { width: 400 }
        }).setOrigin(0, 0);
        p.add(hint);
        y += 84;
        if (y > 160) { break; } // panel space cap
      }
      if (isBossWave) {
        var seal = this.add.image(240, -240, 'ui-seal').setScale(0.9);
        p.add(seal);
      }
      if (waveDef.event && waveDef.event !== 'none') {
        var ev = this.add.text(0, 200, this.D.EVENTS[waveDef.event].banner, {
          fontFamily: 'Georgia, serif', fontSize: '20px', color: GOLD, align: 'center',
          wordWrap: { width: 520 }
        }).setOrigin(0.5);
        p.add(ev);
      }
      var close = BS.ui.button(this, 0, 0, 'Close', function () {
        this.closePanels();
      }.bind(this), { w: 240, h: 88, fontSize: 28 });
      close.y = 200; close.x = -140;
      if (!(waveDef.event && waveDef.event !== 'none')) { close.y = 200; }
      p.add(close);
      p.setScale(0.9); p.setAlpha(0);
      this.tweens.add({ targets: p, scaleX: 1, scaleY: 1, alpha: 1, duration: 250, ease: 'Back.easeOut' });
    },

    /* ================= WAVE FLOW ================= */
    onNextWave: function () {
      if (this.phase !== 'build' || this.paused) { return; }
      this.closePanels();
      this.clearCardSelection();
      this.deselectTurret();
      this.startWave(this.wave + 1);
      if (this.tutorial) { this.tutorial.onNextWave(); }
    },

    startWave: function (n) {
      this.wave = n;
      this.phase = 'wave';
      this.waveTime = 0;
      this.nextBtn.setVisible(false);
      this.scoutBtn.setVisible(false);
      var waveDef = n <= 15 ? this.D.WAVES[n - 1]
        : (this._nextWaveDef && this._nextWaveDef.wave === n ? this._nextWaveDef : this.genEndlessWave(n));
      this._nextWaveDef = null; // consumed
      this.waveDef = waveDef;
      // Build the spawn queue.
      this.spawnQueue = [];
      for (var gi = 0; gi < waveDef.groups.length; gi++) {
        var gr = waveDef.groups[gi];
        for (var k = 0; k < gr.count; k++) {
          var lane = gr.lane === 'any' ? (k % 3) : gr.lane;
          this.spawnQueue.push({ time: gr.delay + k * gr.interval, type: gr.type, lane: lane });
        }
      }
      this.spawnQueue.sort(function (a, b) { return a.time - b.time; });
      // Festival event.
      this.eventKind = waveDef.event || 'none';
      if (this.eventKind !== 'none') { this.triggerEvent(this.eventKind); }
      // Boss banners.
      if (waveDef.boss === 'convoy') {
        BS.ui.banner(this, 'THE CONVOY approaches', 'Break its shield first!');
        if (BS.audio) { BS.audio.bossDrums(); }
        this.bossActive = true;
      } else if (waveDef.boss === 'swarmlord') {
        BS.ui.banner(this, 'THE SWARM-LORD rises', 'It bursts apart — splash hurts the swarm!');
        if (BS.audio) { BS.audio.bossDrums(); }
        this.bossActive = true;
      } else {
        BS.ui.banner(this, 'WAVE ' + n, n > 15 ? 'The night deepens...' : null, 1500);
      }
      // First-appearance hint for the Kite Imp (wave 5).
      if (n === 5 && !this._kiteHintShown) {
        this._kiteHintShown = true;
        this.flashHint('Kite Imps fly above the lane — only blades, beams and mortars can hit them!');
      }
      this.setHint('Hold the lanes! Wave ' + n + (n <= 15 ? ' of 15' : '') + '.');
      this.refreshHUD();
    },

    genEndlessWave: function (n) {
      // Procedural endless waves: budget grows, events rotate, bosses every 5th.
      var budget = 10 + (n - 15) * 6;
      var pool = ['runner', 'runner', 'brute', 'shielded', 'healer', 'splitter', 'kiteflyer', 'digger', 'thief', 'drummer', 'ember'];
      var groups = [];
      var costOf = { runner: 1, brute: 4, shielded: 3, healer: 3, splitter: 3, kiteflyer: 3, digger: 3, thief: 2, drummer: 3, ember: 3 };
      var counts = {};
      var guard = 0;
      while (budget > 0 && guard++ < 60) {
        var t = pool[Math.floor(Math.random() * pool.length)];
        var c = costOf[t];
        if (c > budget) { continue; }
        budget -= c;
        counts[t] = (counts[t] || 0) + 1;
      }
      Object.keys(counts).forEach(function (t) {
        groups.push({ type: t, count: counts[t], interval: 0.7, delay: 1.0, lane: 'any' });
      });
      var ev = 'none';
      var roll = n % 4;
      if (roll === 0) { ev = 'monsoon'; } else if (roll === 1) { ev = 'blackout'; } else if (roll === 2) { ev = 'wedding'; }
      var boss = null;
      if (n % 5 === 0) { boss = (n % 10 === 0) ? 'convoy' : 'swarmlord'; }
      if (boss) {
        groups.push({ type: boss, count: 1, interval: 1.0, delay: 3.0, lane: 1 });
      }
      return { wave: n, event: ev, boss: boss, groups: groups };
    },

    endWave: function () {
      var n = this.wave;
      this.phase = 'build';
      this.clearEvent();
      this.bossActive = false;
      var reward = this.LOGIC.waveReward(n);
      this.coins += reward;
      if (BS.audio) { BS.audio.coin(); }
      this.spawnDmgNum(360, 500, '+' + reward + ' coins', true);
      // Save best night progress.
      if (BS.save) {
        BS.save.bestNight = Math.max(BS.save.bestNight || 0, n);
        BS.writeSave(BS.save);
      }
      if (n >= 15 && !this.endless) {
        this.victory();
        return;
      }
      this.nextBtn.setVisible(true);
      this.scoutBtn.setVisible(true);
      this.refreshHUD();
      this.setHint('Wave ' + n + ' cleared! +' + reward + ' coins. Place, upgrade, then strike the drum.');
      if (this.tutorial) { this.tutorial.onWaveEnd(n); }
    },

    victory: function () {
      this.phase = 'over';
      var stars = this.LOGIC.starsForLives(this.lives);
      if (BS.save) {
        BS.save.bestNight = Math.max(BS.save.bestNight || 0, 15);
        BS.save.stars = Math.max(BS.save.stars || 0, stars);
        BS.writeSave(BS.save);
      }
      if (BS.audio) { BS.audio.win(); }
      this.celebrate();
      var p = BS.ui.panel(this, 360, 560, 600, 560).setDepth(950);
      var titleC = this.add.container(0, -200);
      var titleStyle = {
        fontFamily: 'Georgia, serif', fontSize: '56px', color: GOLD, fontStyle: 'bold'
      };
      [[-3, 0], [3, 0], [0, -3], [0, 3]].forEach(function (o) {
        titleC.add(this.add.text(o[0], o[1], 'DAWN BREAKS', titleStyle).setOrigin(0.5).setAlpha(0.55).setColor('#ff9a1f'));
      }, this);
      titleC.add(this.add.text(0, 0, 'DAWN BREAKS', titleStyle).setOrigin(0.5));
      p.add(titleC);
      var sub = this.add.text(0, -140, 'the bazaar stands!', {
        fontFamily: 'Georgia, serif', fontSize: '30px', color: CREAM
      }).setOrigin(0.5);
      p.add(sub);
      for (var s = 0; s < 3; s++) {
        var star = this.add.image(-60 + s * 60, -60, 'ui-star').setScale(s < stars ? 1 : 0.8);
        star.setAlpha(s < stars ? 1 : 0.25);
        p.add(star);
        if (s < stars) {
          this.tweens.add({ targets: star, scaleX: 1.25, scaleY: 1.25, duration: 300, delay: 300 + s * 250, yoyo: true, ease: 'Back.easeOut' });
        }
      }
      var info = this.add.text(0, 20, 'Lives kept: ' + this.lives + ' of 20', {
        fontFamily: 'Georgia, serif', fontSize: '26px', color: CREAM
      }).setOrigin(0.5);
      p.add(info);
      var endlessBtn = BS.ui.button(this, 0, 120, 'ENDLESS NIGHT', function () {
        p.destroy();
        this.endless = true;
        this.phase = 'build';
        this.nextBtn.setVisible(true);
        this.scoutBtn.setVisible(true);
        this.setHint('Endless night — how long can the bazaar stand?');
        this.refreshHUD();
      }.bind(this), { w: 420, h: 96, fontSize: 30 });
      var menuBtn = BS.ui.button(this, 0, 220, 'Bazaar Menu', function () {
        this.scene.start('Menu');
      }.bind(this), { w: 420, h: 88, fontSize: 28 });
      p.add([endlessBtn, menuBtn]);
      p.setScale(0.9); p.setAlpha(0);
      this.tweens.add({ targets: p, scaleX: 1, scaleY: 1, alpha: 1, duration: 350, ease: 'Back.easeOut' });
    },

    defeat: function () {
      if (this.phase === 'over') { return; }
      this.phase = 'over';
      if (BS.save) {
        BS.save.bestNight = Math.max(BS.save.bestNight || 0, this.wave);
        BS.writeSave(BS.save);
      }
      if (BS.audio) { BS.audio.lose(); }
      var p = BS.ui.panel(this, 360, 560, 600, 480).setDepth(950);
      var title = this.add.text(0, -150, 'The bazaar falls silent…', {
        fontFamily: 'Georgia, serif', fontSize: '40px', color: '#e33e5f', fontStyle: 'bold',
        align: 'center', wordWrap: { width: 520 }
      }).setOrigin(0.5);
      var sub = this.add.text(0, -80, 'Try again?\nBest Night: Wave ' + (BS.save ? BS.save.bestNight : this.wave), {
        fontFamily: 'Georgia, serif', fontSize: '28px', color: CREAM, align: 'center', lineSpacing: 8
      }).setOrigin(0.5);
      p.add([title, sub]);
      var again = BS.ui.button(this, 0, 60, 'Try Again', function () {
        this.scene.restart();
      }.bind(this), { w: 420, h: 100, fontSize: 32 });
      var menuBtn = BS.ui.button(this, 0, 170, 'Bazaar Menu', function () {
        this.scene.start('Menu');
      }.bind(this), { w: 420, h: 88, fontSize: 28 });
      p.add([again, menuBtn]);
      p.setScale(0.9); p.setAlpha(0);
      this.tweens.add({ targets: p, scaleX: 1, scaleY: 1, alpha: 1, duration: 350, ease: 'Back.easeOut' });
    },

    celebrate: function () {
      var scene = this;
      for (var i = 0; i < 40; i++) {
        (function (k) {
          scene.time.delayedCall(k * 90, function () {
            scene.burst(80 + Math.random() * 560, 200 + Math.random() * 500, 'p-petal', 8, 60, 180, 1.2);
            if (BS.audio) { BS.audio.explosion('small'); }
          });
        })(i);
      }
    },

    /* ================= FESTIVAL EVENTS ================= */
    triggerEvent: function (kind) {
      this.eventKind = kind; // set here so clearEvent() always matches
      var ev = this.D.EVENTS[kind];
      BS.ui.banner(this, ev.name.toUpperCase(), ev.banner, 2600);
      if (BS.audio) { BS.audio.stingerFestival(kind); }
      if (kind === 'blackout') {
        this.tweens.add({ targets: this._dim, alpha: 0.5, duration: 600, ease: 'Quad.easeOut' });
        // Lantern turrets keep warm halos.
        for (var i = 0; i < 9; i++) {
          var t = this.turrets[i];
          if (t && t.type === 'lantern') {
            var halo = this.add.image(0, 0, 'p-spark').setScale(6).setAlpha(0.25).setTint(0xffca7a);
            t.cont.addAt(halo, 0);
            t._halo = halo;
          }
        }
        this._fireflies = [];
        for (var f = 0; f < 14; f++) {
          var fl = this.add.image(Math.random() * 720, 200 + Math.random() * 700, 'p-spark').setDepth(15);
          fl.setTint(0xbfe9ff);
          fl.setData('phase', Math.random() * 6.28);
          this._fireflies.push(fl);
        }
      } else if (kind === 'monsoon') {
        this._rain = [];
        for (var r = 0; r < 110; r++) {
          var drop = this.add.image(Math.random() * 760 - 20, Math.random() * 1280, 'p-rain').setDepth(650);
          drop.setData('vy', 700 + Math.random() * 400);
          this._rain.push(drop);
        }
        // Blue shimmer rings on splash turrets.
        for (var s2 = 0; s2 < 9; s2++) {
          var t2 = this.turrets[s2];
          if (t2 && (t2.type === 'rickshaw' || t2.type === 'chai' || t2.type === 'lantern')) {
            var shimmer = this.add.image(0, 0, 'p-ring').setScale(1.6).setTint(0x9fd8ff).setAlpha(0.7);
            t2.cont.add(shimmer);
            t2._shimmer = shimmer;
            this.tweens.add({ targets: shimmer, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
          }
        }
      } else if (kind === 'wedding') {
        this.startWeddingTower();
      }
    },

    clearEvent: function () {
      var kind = this.eventKind;
      if (kind === 'blackout') {
        this.tweens.add({ targets: this._dim, alpha: 0, duration: 600 });
        if (this._fireflies) {
          for (var i = 0; i < this._fireflies.length; i++) { this._fireflies[i].destroy(); }
          this._fireflies = null;
        }
        for (var t = 0; t < 9; t++) {
          var tur = this.turrets[t];
          if (tur && tur._halo) { tur._halo.destroy(); tur._halo = null; }
        }
      } else if (kind === 'monsoon') {
        if (this._rain) {
          for (var r = 0; r < this._rain.length; r++) { this._rain[r].destroy(); }
          this._rain = null;
        }
        for (var s2 = 0; s2 < 9; s2++) {
          var tur2 = this.turrets[s2];
          if (tur2 && tur2._shimmer) { tur2._shimmer.destroy(); tur2._shimmer = null; }
        }
      } else if (kind === 'wedding') {
        this.stopWeddingTower();
      }
      this.eventKind = 'none';
    },

    startWeddingTower: function () {
      var scene = this;
      var cont = this.add.container(780, C.PARADE_Y).setDepth(18);
      var glow = this.add.image(0, 0, 'p-spark').setScale(9).setAlpha(0.3).setTint(0xffca7a);
      var img = this.add.image(0, 0, 'turret-dhol-evo').setScale(1.7).setTint(0xffe9b8);
      var star = this.add.image(0, -52, 'ui-star').setScale(0.6);
      cont.add([glow, img, star]);
      this._wedding = { cont: cont, x: 780, pulseT: 0, life: 20, garlandT: 0 };
      this.tweens.add({ targets: star, angle: 360, duration: 4000, repeat: -1 });
    },

    stopWeddingTower: function () {
      if (this._wedding) {
        var w = this._wedding;
        this.tweens.add({
          targets: w.cont, alpha: 0, duration: 800,
          onComplete: function () { w.cont.destroy(); }
        });
        this._wedding = null;
      }
    },

    updateWedding: function (dt) {
      var w = this._wedding;
      if (!w) { return; }
      w.life -= dt;
      w.x -= 44 * dt; // marches right-to-left across the top
      w.cont.x = w.x;
      w.cont.y = C.PARADE_Y + Math.sin(this.gameTime * 2) * 6;
      w.pulseT -= dt;
      if (w.pulseT <= 0) {
        w.pulseT = 1.0;
        // Shockwave drumbeat: hurts imps near the parade path.
        this.spawnRing(w.x, C.PARADE_Y, 0xffca7a, 2.2);
        if (BS.audio) { BS.audio.shot('dhol'); }
        var victims = this.enemiesInRadius(w.x, C.PARADE_Y, 230);
        for (var i = 0; i < victims.length; i++) {
          this.damageEnemy(victims[i], 30, false);
        }
      }
      w.garlandT -= dt;
      if (w.garlandT <= 0) {
        w.garlandT = 0.12;
        this.spawnParticle('p-petal', w.x - 30, C.PARADE_Y + 20, -40 - Math.random() * 40, 60, 1.4, 0xff9a1f);
      }
      if (w.life <= 0 || w.x < -80) { this.stopWeddingTower(); }
    },

    /* ================= ENEMIES ================= */
    spawnEnemy: function (type, lane) {
      var isBoss = !!this.D.BOSSES[type];
      var def = isBoss ? this.D.BOSSES[type] : this.D.ENEMIES[type];
      var ly = C.LANES[lane];
      var cont = this.add.container(C.SPAWN_X, ly).setDepth(isBoss ? 24 : 20);
      var scale = isBoss ? 1 : (type === 'implig' || type === 'swarmimp' ? 1 : 0.9);
      var tex = isBoss ? 'boss-' + type : 'enemy-' + type;
      var img = this.add.image(0, 0, tex).setScale(scale);
      cont.add(img);
      var shadow = null;
      if (!isBoss && def.air) {
        shadow = this.add.ellipse(0, 46, 44, 12, 0x0c0a14, 0.4);
        cont.add(shadow);
        img.y = -34; // floats above the lane
      }
      // HP bar.
      var barW = isBoss ? 120 : 44;
      var barBg = this.add.rectangle(0, isBoss ? -95 : -52, barW, 7, 0x0c0a14, 0.8);
      var barFg = this.add.rectangle(-barW / 2, isBoss ? -95 : -52, barW, 7, 0x7dff8a, 0.95).setOrigin(0, 0.5);
      cont.add([barBg, barFg]);
      var e = {
        type: type, def: def, isBoss: isBoss,
        hp: isBoss ? def.hp : this.LOGIC.enemyHpForWave(def.hp, this.wave),
        shield: def.shield || 0,
        maxShield: def.shield || 0,
        x: C.SPAWN_X, y: ly, lane: lane,
        baseSpeed: def.speed || 60, slowUntil: 0, slowAmount: 0,
        cont: cont, img: img, barBg: barBg, barFg: barFg, barW: barW,
        air: !!def.air, dead: false,
        wob: Math.random() * 6.28,
        flashT: 0,
        burrow: 0, burrowT: 3 + Math.random() * 3, // digger only
        healT: 2, // healer only
        burstT: isBoss && type === 'swarmlord' ? 7 : 0, // swarm-lord only
        shieldBroken: false
      };
      e.maxHp = e.hp;
      // Entrance: slide in from the right edge with a little bounce.
      cont.x = C.SPAWN_X + 60;
      this.tweens.add({ targets: cont, x: C.SPAWN_X, duration: 400, ease: 'Quad.easeOut' });
      this.enemies.push(e);
      return e;
    },

    enemiesInRadius: function (x, y, r) {
      var out = [];
      var r2 = r * r;
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        if (e.dead || e.burrow === 2) { continue; }
        if (dist2(x, y, e.x, e.y) < r2) { out.push(e); }
      }
      return out;
    },

    updateEnemies: function (dt) {
      var i, e;
      // Drummer auras: precompute.
      var drummers = [];
      for (i = 0; i < this.enemies.length; i++) {
        if (!this.enemies[i].dead && this.enemies[i].type === 'drummer') { drummers.push(this.enemies[i]); }
      }
      for (i = this.enemies.length - 1; i >= 0; i--) {
        e = this.enemies[i];
        if (e.dead) { continue; }
        // Digger burrow cycle.
        if (e.type === 'digger') {
          e.burrowT -= dt;
          if (e.burrowT <= 0) {
            if (e.burrow === 0) {
              e.burrow = 2; e.burrowT = 2.2; // dive: untargetable
              this.burst(e.x, e.y + 10, 'p-dust', 6, 40, 90, 0.6);
              this.tweens.add({ targets: e.img, y: 18, alpha: 0.35, duration: 250 });
            } else {
              e.burrow = 0; e.burrowT = 4 + Math.random() * 2; // resurface with a pop
              this.burst(e.x, e.y + 10, 'p-dust', 8, 50, 110, 0.7);
              this.tweens.add({ targets: e.img, y: 0, alpha: 1, duration: 200, ease: 'Back.easeOut' });
            }
          }
        }
        // Speed: base x slow x drummer aura.
        var sp = e.baseSpeed;
        if (this.gameTime < e.slowUntil) { sp *= (1 - e.slowAmount); }
        for (var d = 0; d < drummers.length; d++) {
          var dr = drummers[d];
          if (dr !== e && dist2(e.x, e.y, dr.x, dr.y) < 140 * 140) {
            sp *= (dr.def.aura ? dr.def.aura.mult : 1.3);
            break;
          }
        }
        e.x -= sp * dt;
        e.cont.x = e.x;
        // Wobble march (squash-and-stretch idle); air imps bob.
        e.wob += dt * 6;
        if (e.air) {
          e.img.y = -34 + Math.sin(e.wob * 0.7) * 8;
        } else if (!e.isBoss) {
          e.cont.scaleY = 1 + Math.sin(e.wob) * 0.04;
          e.cont.scaleX = 1 - Math.sin(e.wob) * 0.03;
        } else if (e.type === 'swarmlord') {
          e.img.y = Math.sin(e.wob * 0.5) * 8;
        }
        // Healer pulse.
        if (e.type === 'healer') {
          e.healT -= dt;
          if (e.healT <= 0) {
            e.healT = e.def.heal.every;
            var friends = this.enemiesInRadius(e.x, e.y, e.def.heal.radius);
            for (var h = 0; h < friends.length; h++) {
              var fr = friends[h];
              if (fr !== e && !fr.isBoss) {
                fr.hp = Math.min(fr.maxHp, fr.hp + e.def.heal.amount);
                this.updateHpBar(fr);
              }
            }
            this.burst(e.x, e.y - 20, 'p-spark', 6, 30, 80, 0.6, 0x7dff8a);
          }
        }
        // Swarm-Lord burst.
        if (e.isBoss && e.type === 'swarmlord') {
          e.burstT -= dt;
          if (e.burstT <= 0) {
            e.burstT = e.def.burst.every;
            this.burst(e.x, e.y, 'p-petal', 14, 60, 160, 1.0, 0xc86fff);
            this.spawnRing(e.x, e.y, 0xc86fff, 1.8);
            for (var b = 0; b < e.def.burst.count; b++) {
              var imp = this.spawnEnemy('swarmimp', e.lane);
              var ang = b / e.def.burst.count * Math.PI * 2;
              imp.x = e.x + Math.cos(ang) * 70;
              imp.y = e.y + Math.sin(ang) * 40;
              imp.cont.x = imp.x; imp.cont.y = imp.y;
            }
            if (BS.audio) { BS.audio.explosion('small'); }
          }
        }
        // Hit flash decay.
        if (e.flashT > 0) {
          e.flashT -= dt;
          if (e.flashT <= 0) { e.img.clearTint(); }
        }
        // Leak at the gate.
        if (e.x <= C.GATE_X) {
          this.leakEnemy(e);
        }
      }
      // Intensity follows the danger.
      if (BS.audio) {
        var danger = clamp(0.25 + this.enemies.length * 0.012 + (this.lives <= 6 ? 0.3 : 0), 0, 1);
        BS.audio.setIntensity(danger);
      }
    },

    updateHpBar: function (e) {
      var frac = clamp(e.hp / e.maxHp, 0, 1);
      e.barFg.displayWidth = Math.max(0.1, e.barW * frac);
      e.barFg.fillColor = frac > 0.5 ? 0x7dff8a : frac > 0.25 ? 0xffc93c : 0xe33e5f;
    },

    damageEnemy: function (e, dmg, isCrit) {
      if (e.dead) { return; }
      var remaining = dmg;
      // Boss shield pool depletes first.
      if (e.shield > 0) {
        var absorbed = Math.min(e.shield, remaining);
        e.shield -= absorbed;
        remaining -= absorbed;
        if (e.shield <= 0 && !e.shieldBroken) {
          e.shieldBroken = true;
          this.hitPause = C.HIT_PAUSE_MS / 1000;
          this.burst(e.x, e.y - 30, 'p-spark', 18, 80, 260, 1.0, 0x7fd8ff);
          this.spawnRing(e.x, e.y, 0x7fd8ff, 2.4);
          this.spawnDmgNum(e.x, e.y - 90, 'SHIELD BROKEN!', true);
          if (BS.audio) { BS.audio.explosion('big'); }
        }
      }
      e.hp -= remaining;
      // Hit flash + knockback nudge.
      e.img.setTintFill(0xffffff);
      e.flashT = 0.07;
      if (!e.isBoss) { e.x = Math.min(C.SPAWN_X, e.x + 5); }
      this.spawnDmgNum(e.x, e.y - 50, Math.round(remaining), isCrit);
      this.updateHpBar(e);
      if (e.hp <= 0) { this.killEnemy(e); }
    },

    killEnemy: function (e) {
      if (e.dead) { return; }
      e.dead = true;
      var scene = this;
      // Death: squash + marigold petal burst + eye-glow fade. Never a pop-out.
      this.burst(e.x, e.y, 'p-petal', e.isBoss ? 26 : 8, 50, 170, 1.0);
      this.burst(e.x, e.y, 'p-spark', e.isBoss ? 16 : 5, 60, 200, 0.7);
      if (BS.audio) { BS.audio.explosion(e.isBoss ? 'big' : 'small'); }
      this.tweens.add({
        targets: e.cont, scaleX: 1.3, scaleY: 0.25, alpha: 0, duration: 260, ease: 'Quad.easeIn',
        onComplete: function () { e.cont.destroy(); }
      });
      // Remove from the live list.
      var idx = this.enemies.indexOf(e);
      if (idx >= 0) { this.enemies.splice(idx, 1); }
      // Coins.
      var reward = e.def.coins || 0;
      if (reward > 0) {
        this.coins += reward;
        if (this.gameTime - this.lastCoinSfx > 0.12) {
          this.lastCoinSfx = this.gameTime;
          if (BS.audio) { BS.audio.coin(); }
        }
      }
      // Splitter -> 2 imp-lings.
      if (e.def.splits) {
        for (var s = 0; s < e.def.splits.count; s++) {
          var imp = this.spawnEnemy(e.def.splits.type, e.lane);
          imp.x = e.x + (s === 0 ? -24 : 24);
          imp.cont.x = imp.x;
        }
      }
      // Ember death blast hurts other imps.
      if (e.def.deathBlast) {
        var victims = this.enemiesInRadius(e.x, e.y, e.def.deathBlast.radius);
        for (var v = 0; v < victims.length; v++) {
          this.damageEnemy(victims[v], e.def.deathBlast.dmg, true);
        }
        this.spawnRing(e.x, e.y, 0xff7a1f, 1.8);
      }
      if (e.isBoss) {
        this.hitPause = C.HIT_PAUSE_MS / 1000;
        this.cameras.main.shake(220, 0.012);
        this.spawnDmgNum(e.x, e.y - 120, e.def.name + ' DOWN!', true);
        this.bossActive = false;
      }
      this.refreshHUD();
    },

    leakEnemy: function (e) {
      if (e.dead) { return; }
      e.dead = true;
      var idx = this.enemies.indexOf(e);
      if (idx >= 0) { this.enemies.splice(idx, 1); }
      this.tweens.killTweensOf(e.cont);
      e.cont.destroy();
      if (e.type === 'thief') {
        var stolen = Math.min(this.coins, this.D.ECONOMY.thiefSteal);
        this.coins -= stolen;
        this.flashHint('A Thief Imp slipped past and stole ' + stolen + ' coins!');
      } else {
        this.lives -= 1;
        // Red vignette pulse + screen shake (never during tutorial wave 1).
        this.tweens.add({ targets: this._vignette, alpha: 0.4, duration: 120, yoyo: true });
        if (!(this.tutorial && this.tutorial.active && this.wave === 1)) {
          this.cameras.main.shake(160, 0.008);
        }
      }
      if (BS.audio) { BS.audio.leak(); }
      this.refreshHUD();
      if (this.lives <= 0) { this.defeat(); }
    },

    /* ================= TURRETS FIRING ================= */
    updateTurrets: function (dt) {
      for (var i = 0; i < 9; i++) {
        var t = this.turrets[i];
        if (!t) { continue; }
        var stats = this.turretStats(t);
        t.cd -= dt;
        t.scanT -= dt;
        var pos = C.SLOTS[t.slot];
        // Prism beam continuation.
        if (t.beamT > 0) {
          t.beamT -= dt;
          var bt = t.beamTarget;
          if (!bt || bt.dead || dist2(pos.x, pos.y, bt.x, bt.y) > stats.range * stats.range) {
            t.beamT = 0;
            this.clearBeam(t);
          } else {
            this.damageEnemy(bt, stats.dmg * dt, false);
            this.drawBeam(t, pos, bt);
            if (Math.random() < 0.35) {
              this.spawnParticle('p-spark', bt.x, bt.y - 20, (Math.random() - 0.5) * 120, -60, 0.5);
            }
            continue;
          }
        }
        if (t.scanT > 0) { continue; }
        t.scanT = 0.15; // staggered scans, not per frame
        var target = this.acquireTarget(t, stats, pos);
        t.target = target;
        if (target && t.cd <= 0) {
          t.cd = stats.rate;
          this.fireTurret(t, stats, pos, target);
        }
      }
    },

    acquireTarget: function (t, stats, pos) {
      var best = null, bestX = Infinity;
      var r2 = stats.range * stats.range;
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        if (e.dead || e.burrow === 2) { continue; }
        if (!this.LOGIC.canHit(t.type, e.def)) { continue; }
        if (dist2(pos.x, pos.y, e.x, e.y) > r2) { continue; }
        if (e.x < bestX) { bestX = e.x; best = e; } // closest to the gate
      }
      return best;
    },

    fireTurret: function (t, stats, pos, target) {
      // Anticipation: quick punch (mortar tilts back).
      var cont = t.cont;
      if (t.type === 'lantern') {
        this.tweens.add({ targets: cont, angle: -14, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
      } else {
        this.tweens.add({ targets: cont, scaleX: 1.12, scaleY: 1.12, duration: 90, yoyo: true });
      }
      if (BS.audio) { BS.audio.shot(t.type); }
      var sx = pos.x, sy = pos.y - 20;
      if (t.type === 'dhol') {
        // Instant radial shockwave.
        this.spawnRing(sx, sy + 10, 0xffca7a, 2.0);
        var victims = this.enemiesInRadius(sx, sy, stats.range);
        for (var i = 0; i < victims.length; i++) {
          if (victims[i].air) { continue; } // drums pound the ground, not the sky
          this.damageEnemy(victims[i], stats.dmg, false);
        }
      } else if (t.type === 'prism') {
        t.beamT = 0.5;
        t.beamTarget = target;
        if (!t.beamGfx) { t.beamGfx = this.add.graphics().setDepth(31); }
      } else {
        var projType = t.def.proj;
        var p = this.getProj(projType);
        p.active = true;
        p.spr.setVisible(true).setAlpha(1);
        p.x = sx; p.y = sy;
        p.tx = target.x; p.ty = target.y - 10;
        p.t = 0;
        p.dur = projType === 'lantern' ? 0.9 : projType === 'chai' ? 0.7 : 0.45;
        p.dmg = stats.dmg;
        p.splash = stats.splash;
        p.slow = t.def.slow || null;
        p.canHitAir = !!t.def.canHitAir;
        p.target = target;
        p.trailT = 0;
        p.sx = sx; p.sy = sy;
      }
    },

    drawBeam: function (t, pos, target) {
      var gfx = t.beamGfx;
      gfx.clear();
      var wob = Math.sin(this.gameTime * 40) * 4;
      gfx.lineStyle(7, 0xffffff, 0.85);
      gfx.lineBetween(pos.x, pos.y - 24, target.x + wob, target.y - 10);
      gfx.lineStyle(3, 0xc83e8f, 0.9);
      gfx.lineBetween(pos.x, pos.y - 24, target.x + wob, target.y - 10);
    },

    clearBeam: function (t) {
      if (t.beamGfx) { t.beamGfx.clear(); }
    },

    /* ================= PROJECTILES (pooled) ================= */
    buildPools: function () {
      this.projPools = { rocket: [], blade: [], chai: [], lantern: [] };
      this.particlePool = [];
      this.dmgPool = [];
      this._beamGfx = null;
      for (var i = 0; i < 24; i++) {
        var txt = this.add.text(-200, -200, '', {
          fontFamily: 'Georgia, serif', fontSize: '22px', color: '#fff6e8', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(50).setVisible(false);
        txt.setStroke('#1c1430', 4);
        this.dmgPool.push({ txt: txt, active: false, t: 0 });
      }
    },

    getProj: function (type) {
      var pool = this.projPools[type];
      for (var i = 0; i < pool.length; i++) {
        if (!pool[i].active) { return pool[i]; }
      }
      if (pool.length >= 40) {
        // Pool exhausted: reuse the oldest.
        return pool[0];
      }
      var tex = { rocket: 'proj-rocket', blade: 'proj-blade', chai: 'proj-chai', lantern: 'proj-lantern' }[type];
      var spr = this.add.image(-200, -200, tex).setDepth(30).setVisible(false);
      var p = { spr: spr, active: false, x: 0, y: 0, tx: 0, ty: 0, t: 0, dur: 0.5, dmg: 0, splash: 0, slow: null, target: null, trailT: 0, sx: 0, sy: 0 };
      pool.push(p);
      return p;
    },

    updateProjectiles: function (dt) {
      var keys = ['rocket', 'blade', 'chai', 'lantern'];
      for (var k = 0; k < keys.length; k++) {
        var pool = this.projPools[keys[k]];
        for (var i = 0; i < pool.length; i++) {
          var p = pool[i];
          if (!p.active) { continue; }
          p.t += dt / p.dur;
          if (p.t >= 1) {
            this.impactProj(p);
            continue;
          }
          // Track a live target slightly (homing feel).
          if (p.target && !p.target.dead && keys[k] !== 'lantern' && keys[k] !== 'chai') {
            p.tx += (p.target.x - p.tx) * 0.12;
            p.ty += ((p.target.y - 10) - p.ty) * 0.12;
          }
          var tt = p.t;
          p.x = p.sx + (p.tx - p.sx) * tt;
          var arcH = keys[k] === 'lantern' ? 190 : keys[k] === 'chai' ? 110 : 40;
          p.y = p.sy + (p.ty - p.sy) * tt - Math.sin(tt * Math.PI) * arcH;
          p.spr.x = p.x; p.spr.y = p.y;
          if (keys[k] === 'blade') { p.spr.angle += 900 * dt; }
          if (keys[k] === 'rocket' || keys[k] === 'lantern') {
            p.trailT -= dt;
            if (p.trailT <= 0) {
              p.trailT = 0.05;
              this.spawnParticle(keys[k] === 'rocket' ? 'p-smoke' : 'p-spark', p.x, p.y + 8, -20, 30, 0.5, keys[k] === 'rocket' ? 0x8a8aa0 : 0xffca7a);
            }
          }
        }
      }
    },

    impactProj: function (p) {
      p.active = false;
      p.spr.setVisible(false);
      var x = p.tx, y = p.ty;
      if (p.splash > 0) {
        this.spawnRing(x, y, 0xffb347, 1.2);
        this.burst(x, y, 'p-petal', 6, 50, 140, 0.7);
        if (BS.audio) { BS.audio.explosion('small'); }
        var victims = this.enemiesInRadius(x, y, p.splash);
        for (var i = 0; i < victims.length; i++) {
          var e = victims[i];
          // Splash only hurts what the turret could target (e.g. chai cannot hit air).
          if (e.air && !p.canHitAir) { continue; }
          this.damageEnemy(e, p.dmg, false);
          if (p.slow) {
            e.slowUntil = this.gameTime + p.slow.duration;
            e.slowAmount = p.slow.amount;
          }
        }
      } else if (p.target && !p.target.dead) {
        this.damageEnemy(p.target, p.dmg, false);
        this.burst(x, y, 'p-spark', 4, 40, 120, 0.4);
      }
    },

    /* ================= PARTICLES & DAMAGE NUMBERS (pooled) ================= */
    spawnParticle: function (tex, x, y, vx, vy, life, tint) {
      var pt = null;
      for (var i = 0; i < this.particlePool.length; i++) {
        if (!this.particlePool[i].active) { pt = this.particlePool[i]; break; }
      }
      if (!pt) {
        if (this.particlePool.length >= 250) { return; }
        var spr = this.add.image(-200, -200, tex).setDepth(40).setVisible(false);
        pt = { spr: spr, active: false, vx: 0, vy: 0, life: 0, maxLife: 1, grav: 0 };
        this.particlePool.push(pt);
      }
      // Texture swap if needed.
      if (pt.spr.texture.key !== tex) { pt.spr.setTexture(tex); }
      pt.active = true;
      pt.spr.setVisible(true).setAlpha(1).setScale(1);
      pt.spr.x = x; pt.spr.y = y;
      if (tint !== undefined) { pt.spr.setTint(tint); } else { pt.spr.clearTint(); }
      pt.vx = vx; pt.vy = vy; pt.life = life; pt.maxLife = life;
      pt.grav = tex === 'p-petal' ? 160 : 60;
    },

    burst: function (x, y, tex, n, spdMin, spdMax, life, tint) {
      for (var i = 0; i < n; i++) {
        var ang = Math.random() * Math.PI * 2;
        var spd = spdMin + Math.random() * (spdMax - spdMin);
        this.spawnParticle(tex, x, y, Math.cos(ang) * spd, Math.sin(ang) * spd - 60, life * (0.7 + Math.random() * 0.6), tint);
      }
    },

    spawnRing: function (x, y, tint, scale) {
      var ring = this.add.image(x, y, 'p-ring').setDepth(41).setTint(tint).setScale(0.4);
      this.tweens.add({
        targets: ring, scaleX: scale * 2.2, scaleY: scale * 2.2, alpha: 0,
        duration: 420, ease: 'Quad.easeOut',
        onComplete: function () { ring.destroy(); }
      });
    },

    updateParticles: function (dt) {
      for (var i = 0; i < this.particlePool.length; i++) {
        var pt = this.particlePool[i];
        if (!pt.active) { continue; }
        pt.life -= dt;
        if (pt.life <= 0) {
          pt.active = false;
          pt.spr.setVisible(false);
          continue;
        }
        pt.vy += pt.grav * dt;
        pt.spr.x += pt.vx * dt;
        pt.spr.y += pt.vy * dt;
        pt.spr.setAlpha(clamp(pt.life / pt.maxLife, 0, 1));
        if (pt.spr.texture.key === 'p-petal') { pt.spr.angle += 200 * dt; }
      }
    },

    spawnDmgNum: function (x, y, text, big) {
      var d = null;
      for (var i = 0; i < this.dmgPool.length; i++) {
        if (!this.dmgPool[i].active) { d = this.dmgPool[i]; break; }
      }
      if (!d) { return; }
      d.active = true; d.t = 0.8;
      d.txt.setVisible(true).setAlpha(1);
      d.txt.setText(String(text));
      d.txt.setFontSize(big ? 30 : 21);
      d.txt.setColor(big ? '#ffca7a' : '#fff6e8');
      d.txt.x = x + (Math.random() - 0.5) * 20;
      d.txt.y = y;
    },

    updateDmgNums: function (dt) {
      for (var i = 0; i < this.dmgPool.length; i++) {
        var d = this.dmgPool[i];
        if (!d.active) { continue; }
        d.t -= dt;
        if (d.t <= 0) { d.active = false; d.txt.setVisible(false); continue; }
        d.txt.y -= 70 * dt;
        d.txt.setAlpha(clamp(d.t / 0.8, 0, 1));
      }
    },

    /* ================= HINT HELPERS ================= */
    flashHint: function (text) {
      var pill = this.hint;
      if (this.tutorial && this.tutorial.active) {
        pill.container.setAlpha(1);
      }
      // Temporarily override; restore the contextual hint after 2.2s.
      var prev = pill._lastText;
      pill.set(text);
      var scene = this;
      this.time.delayedCall(2200, function () {
        if (scene.tutorial && scene.tutorial.active) { return; }
        scene.refreshContextHint();
      });
      pill._lastText = text;
    },

    refreshContextHint: function () {
      if (this.phase === 'build') {
        var n = Math.max(1, this.wave + 1);
        this.hint.set('Hold the bazaar till dawn — Wave ' + n + (this.endless ? '' : ' of 15') + '. Place turrets, then strike the drum.');
      } else if (this.phase === 'wave') {
        this.hint.set('Hold the lanes! Wave ' + this.wave + '.');
      }
    },

    togglePause: function () {
      if (this.phase === 'over') { return; }
      this.paused = !this.paused;
      if (this.paused) {
        this.tweens.pauseAll();
        if (BS.audio) { BS.audio.setIntensity(0.05); }
        this._pauseBtn._label.setText('>');
        BS.ui.banner(this, 'PAUSED', 'Tap > to return to the night.', 1200);
      } else {
        this.tweens.resumeAll();
        this._pauseBtn._label.setText('II');
      }
      if (BS.audio) { BS.audio.uiClick(); }
    },

    /* ================= TUTORIAL (waves 1-3, first run) ================= */
    buildTutorial: function () {
      if (BS.save && BS.save.tutorialDone) { return; }
      var scene = this;
      var arrow = this.add.image(-100, -100, 'ui-arrow').setDepth(880).setVisible(false);
      var ring = this.add.image(-100, -100, 'p-ring').setDepth(879).setVisible(false).setTint(0xffca7a);
      this.tweens.add({ targets: arrow, y: '+=14', duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: ring, scaleX: 1.5, scaleY: 1.5, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 });
      var tut = {
        active: true,
        stage: 0,
        rickshawA: -1, // slot of the wave-1 rickshaw
        rickshawB: -1, // slot of the wave-3 rickshaw
        showAt: function (x, y) {
          arrow.setVisible(true).setPosition(x, y - 90);
          ring.setVisible(true).setPosition(x, y);
        },
        hide: function () { arrow.setVisible(false); ring.setVisible(false); },
        say: function (text) { scene.hint.set(text); },
        advance: function (n) { tut.stage = n; tut.apply(); },
        onCard: function (id) {
          if (tut.stage === 0 && id === 'rickshaw') { tut.advance(1); }
          else if (tut.stage === 5 && id === 'kite') { tut.advance(6); }
          else if (tut.stage === 10 && id === 'rickshaw') { tut.advance(11); }
        },
        onPlaced: function (idx, type) {
          if (tut.stage === 1 && type === 'rickshaw') { tut.rickshawA = idx; tut.advance(2); }
          else if (tut.stage === 6 && type === 'kite') { tut.advance(7); }
          else if (tut.stage === 11 && type === 'rickshaw') { tut.rickshawB = idx; tut.advance(12); }
        },
        onNextWave: function () {
          if (tut.stage === 2 || tut.stage === 7 || tut.stage === 13) {
            tut.hide();
            tut.say('Hold the lanes! Your defenders fight on their own.');
            tut.stage = tut.stage + 1; // 3, 8, 14
          }
        },
        onWaveEnd: function (n) {
          if (tut.stage === 3 && n === 1) {
            BS.ui.banner(scene, 'Well defended!', null, 1800);
            tut.advance(5);
          } else if (tut.stage === 8 && n === 2) {
            tut.advance(10);
          } else if (tut.stage === 14 && n === 3) {
            tut.finish();
          }
        },
        onMerge: function (type) {
          if (tut.stage === 12 && type === 'rickshaw') {
            BS.ui.banner(scene, 'Merging makes legends!', null, 2000);
            tut.advance(13);
          }
        },
        apply: function () {
          var cardPos = function (id) {
            for (var i = 0; i < scene.cardObjs.length; i++) {
              if (scene.cardObjs[i].id === id) { return scene.cardObjs[i]; }
            }
            return null;
          };
          switch (tut.stage) {
            case 0:
              var c0 = cardPos('rickshaw');
              tut.showAt(c0.x, c0.y);
              tut.say('Tap the Rickshaw Rocket card — lobs splash rockets.');
              break;
            case 1:
              tut.showAt(C.SLOTS[4].x, C.SLOTS[4].y);
              tut.say('Tap the glowing rooftop to place it.');
              break;
            case 2:
              tut.showAt(470, 1216);
              tut.say('Tap NEXT WAVE to ring the drum.');
              break;
            case 5:
              var c5 = cardPos('kite');
              tut.showAt(c5.x, c5.y);
              tut.say('Tap the Kite-Cutter card — fast single-target blades.');
              break;
            case 6:
              tut.showAt(C.SLOTS[3].x, C.SLOTS[3].y);
              tut.say('Tap the glowing rooftop to place it.');
              break;
            case 7:
              tut.showAt(470, 1216);
              tut.say('Tap NEXT WAVE to ring the drum.');
              break;
            case 10:
              var c10 = cardPos('rickshaw');
              tut.showAt(c10.x, c10.y);
              tut.say('Place another Rickshaw Rocket.');
              break;
            case 11:
              tut.showAt(C.SLOTS[5].x, C.SLOTS[5].y);
              tut.say('Tap the glowing rooftop.');
              break;
            case 12: {
              // Point from the new rickshaw to the old one.
              var a = tut.rickshawA >= 0 ? C.SLOTS[tut.rickshawA] : C.SLOTS[4];
              var b = tut.rickshawB >= 0 ? C.SLOTS[tut.rickshawB] : C.SLOTS[5];
              tut.showAt((a.x + b.x) / 2, (a.y + b.y) / 2);
              tut.say('Drag this Rickshaw onto your other Rickshaw!');
              break;
            }
            case 13:
              tut.showAt(470, 1216);
              tut.say('Tap NEXT WAVE to ring the drum.');
              break;
            default:
              break;
          }
        },
        finish: function () {
          tut.active = false;
          tut.hide();
          if (BS.save) { BS.save.tutorialDone = true; BS.writeSave(BS.save); }
          scene.refreshContextHint();
        }
      };
      this.tutorial = tut;
      // Start at stage 0 once the dock exists.
      this.time.delayedCall(600, function () { tut.apply(); });
    },

    /* ================= UPDATE ================= */
    update: function (time, delta) {
      var rawDt = Math.min(delta / 1000, 0.05);
      // Ambient life always runs (cheap sine offsets).
      this.updateAmbient(time);
      if (this.paused || this.phase === 'over') { return; }
      // 70ms hit-pause on big moments.
      if (this.hitPause > 0) {
        this.hitPause -= rawDt;
        return;
      }
      var dt = rawDt * this.speed;
      this.gameTime += dt;

      // Tutorial kindness: if the merge pair is gone (sold), rewind to "place another".
      if (this.tutorial && this.tutorial.active && this.tutorial.stage === 12 && this.phase === 'build') {
        var rickshaws = 0;
        for (var ri = 0; ri < 9; ri++) {
          var rt = this.turrets[ri];
          if (rt && rt.type === 'rickshaw' && !rt.evolved) { rickshaws++; }
        }
        if (rickshaws < 2) { this.tutorial.advance(10); }
      }

      if (this.phase === 'wave') {
        this.waveTime += dt;        // Spawn from the queue.
        while (this.spawnQueue.length > 0 && this.spawnQueue[0].time <= this.waveTime) {
          var job = this.spawnQueue.shift();
          this.spawnEnemy(job.type, job.lane);
        }
        this.updateEnemies(dt);
        this.updateTurrets(dt);
        this.updateProjectiles(dt);
        this.updateWedding(dt);
        // Rain falls during the monsoon.
        if (this._rain) {
          for (var r = 0; r < this._rain.length; r++) {
            var drop = this._rain[r];
            drop.y += drop.getData('vy') * dt;
            drop.x -= 120 * dt;
            if (drop.y > 1300) { drop.y = -20; drop.x = Math.random() * 760 - 20; }
          }
        }
        // Wave ends when everything spawned and everything is dead.
        if (this.spawnQueue.length === 0 && this.enemies.length === 0) {
          this.endWave();
        }
      }
      this.updateParticles(dt);
      this.updateDmgNums(dt);
    },

    updateAmbient: function (time) {
      var i, o;
      if (this._lanterns) {
        for (i = 0; i < this._lanterns.length; i++) {
          o = this._lanterns[i];
          o.x += Math.sin(time * 0.001 + o.getData('phase')) * 0.2;
          o.rotation = Math.sin(time * 0.0012 + o.getData('phase')) * 0.1;
        }
      }
      if (this._bulbs) {
        for (i = 0; i < this._bulbs.length; i++) {
          o = this._bulbs[i];
          o.setAlpha(0.55 + 0.45 * Math.abs(Math.sin(time * 0.002 + o.getData('phase'))));
        }
      }
      if (this._stars) {
        for (i = 0; i < this._stars.length; i++) {
          o = this._stars[i];
          o.setAlpha(0.4 + 0.5 * Math.abs(Math.sin(time * 0.0015 + o.getData('phase'))));
        }
      }
      if (this._petals) {
        for (i = 0; i < this._petals.length; i++) {
          o = this._petals[i];
          var vy = o.getData('vy');
          o.y += vy * 0.016;
          o.x += Math.sin(time * 0.001 + o.getData('phase')) * 0.6;
          o.angle += 0.6;
          if (o.y > 1300) { o.y = -20; o.x = Math.random() * 720; }
        }
      }
      if (this._fireflies) {
        for (i = 0; i < this._fireflies.length; i++) {
          o = this._fireflies[i];
          var ph = o.getData('phase');
          o.x += Math.sin(time * 0.001 + ph) * 0.8;
          o.y += Math.cos(time * 0.0013 + ph) * 0.6;
          o.setAlpha(0.4 + 0.6 * Math.abs(Math.sin(time * 0.003 + ph)));
        }
      }
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
