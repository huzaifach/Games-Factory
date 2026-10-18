/* DUSKLINE src/scenes_menu.js — title, hero select, relic vault, achievements, skins. */
(function () {
'use strict';
var D = window.DUSK = window.DUSK || {};

D.MenuScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function () { Phaser.Scene.call(this, { key: 'Menu' }); },

  create: function () {
    D.audio.unlock();
    if (!D.audio.started) D.audio.startMusic();
    D.audio.setIntensity(0);
    var W = this.scale.width, H = this.scale.height;
    var self = this;
    this.cameras.main.setBackgroundColor('#070a1e');

    this.buildSky();
    this.selectedHero = this.selectedHero || 'seher';
    if (!D.save.heroes[this.selectedHero]) this.selectedHero = 'seher';

    // header
    var header = this.add.container(0, 0).setDepth(10);
    var title = this.add.text(24, 26, 'DUSKLINE', {
      fontFamily: 'Arial, sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#ffc93c'
    });
    var sub = this.add.text(26, 70, 'NEON DESERT SURVIVAL', { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#8a8fc9' });
    var best = this.add.text(W - 24, 82, 'BEST  ' + D.ui.fmtTime(D.save.best.time) + '   |   ' + D.save.best.kills + ' KILLS', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#8a8fc9'
    }).setOrigin(1, 0);
    var snd = this.add.text(W - 24, 56, D.save.muted ? 'SOUND: OFF' : 'SOUND: ON', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#4ce0ff'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    snd.on('pointerup', function () {
      D.save.muted = !D.save.muted; D.persist(); D.audio.setMuted(D.save.muted);
      snd.setText(D.save.muted ? 'SOUND: OFF' : 'SOUND: ON'); D.audio.uiClick();
    });
    header.add([title, sub, best, snd]);

    // scrollable hero list
    var listTop = 108, listH = H - 108 - 190;
    this.heroList = this.add.container(0, listTop);
    var maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff); maskShape.fillRect(0, listTop, W, listH);
    var mask = maskShape.createGeometryMask();
    this.heroList.setMask(mask);
    this.buildHeroCards(W);

    // scroll drag
    var scrollY = 0, maxScroll = 0, dragging = false, sy = 0, startScroll = 0;
    var bg = this.add.zone(0, listTop, W, listH).setOrigin(0, 0).setInteractive().setDepth(5);
    bg.on('pointerdown', function (p) { dragging = true; sy = p.y; startScroll = scrollY; });
    this.input.on('pointerup', function () { dragging = false; });
    this.input.on('pointermove', function (p) {
      if (!dragging || !p.isDown) return;
      scrollY = Phaser.Math.Clamp(startScroll + (sy - p.y), 0, maxScroll);
      self.heroList.y = listTop - scrollY;
    });
    this._layoutHeroList = function () {
      maxScroll = Math.max(0, self._heroListH - listH);
      scrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll);
      self.heroList.y = listTop - scrollY;
    };

    // bottom bar
    var barY = H - 170;
    this.add.graphics().fillStyle(0x0a0d22, 0.92).fillRect(0, barY - 14, W, 184);
    this.add.graphics().fillStyle(0x4ce0ff, 0.5).fillRect(0, barY - 14, W, 2);

    var bw = (W - 60) / 3;
    D.ui.button(this, 20 + bw / 2, barY + 34, bw, 'RELICS', { fs: 20 }, function () { self.showRelics(W, H); });
    D.ui.button(this, 20 + bw * 1.5 + 10, barY + 34, bw, 'TROPHIES', { fs: 20 }, function () { self.showAchievements(W, H); });
    D.ui.button(this, 20 + bw * 2.5 + 20, barY + 34, bw, 'SKINS', { fs: 20 }, function () { self.showSkins(W, H); });
    D.ui.button(this, W / 2, barY + 112, Math.min(360, W - 60), 'BEGIN THE CROSSING', { fs: 24, tint: 0x2a8a5c }, function () {
      self.scene.start('Game', { hero: self.selectedHero });
    });

    // queued unlock popups
    this.time.delayedCall(600, function () { self.popUnlocks(); });
    this.scale.on('resize', function () { self.scene.restart(); });
  },

  buildSky: function () {
    var W = this.scale.width, H = this.scale.height;
    this.add.image(W / 2, H * 0.28, 'sky').setDisplaySize(W, H * 0.62).setDepth(-10);
    var moon = this.add.image(W * 0.78, H * 0.16, 'moon').setScale(0.8).setDepth(-9).setAlpha(0.95);
    this.tweens.add({ targets: moon, y: H * 0.16 + 14, duration: 6000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    for (var i = 0; i < 3; i++) {
      var r = this.add.tileSprite(W / 2, H - 130 - i * 66, W, 190, 'ridge' + i).setDepth(-8 + i).setAlpha(0.9);
      r.tilePositionX = i * 200;
    }
    this.add.tileSprite(W / 2, H / 2, W, H, 'sand').setDepth(-5).setAlpha(0.85).setTileScale(2, 2);
    // ambient drifting motes
    for (var m = 0; m < 26; m++) {
      var p = this.add.image(Math.random() * W, Math.random() * H, 'px')
        .setTint([0x4ce0ff, 0xffc93c, 0xff5ca8][m % 3]).setAlpha(0.25).setScale(0.25 + Math.random() * 0.4).setDepth(-4);
      this.tweens.add({
        targets: p, x: p.x + (Math.random() - 0.5) * 120, y: p.y - 40 - Math.random() * 80,
        duration: 5000 + Math.random() * 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }
    this.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W * 1.4, H * 1.4).setDepth(20).setAlpha(0.7);
  },

  heroCard: function (W, h, y) {
    var self = this;
    var unlocked = !!D.save.heroes[h.id];
    var selected = this.selectedHero === h.id;
    var cw = W - 32, chh = 168;
    var c = this.add.container(W / 2, y);
    var bg = this.add.image(0, 0, 'card').setDisplaySize(cw, chh);
    bg.setTint(selected ? 0xffffff : 0x8a8fb0);
    var edge = this.add.graphics();
    if (selected) { edge.lineStyle(4, D.COLORS[h.color], 1); edge.strokeRoundedRect(-cw / 2 + 4, -chh / 2 + 4, cw - 8, chh - 8, 18); }
    var spr = this.add.image(-cw / 2 + 74, 0, 'hero_' + h.id).setScale(1.15);
    if (!unlocked) spr.setTint(0x222233).setAlpha(0.7);
    var tint = D.SKIN_TINTS[D.save.skinSel[h.id] || 'default'];
    if (unlocked && tint) spr.setTint(tint[0]);
    var name = this.add.text(-cw / 2 + 148, -chh / 2 + 26, h.name, {
      fontFamily: 'Arial, sans-serif', fontSize: '30px', fontStyle: 'bold', color: unlocked ? '#ffffff' : '#6a6f95'
    });
    var ttl = this.add.text(-cw / 2 + 148, -chh / 2 + 62, h.title, {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'italic', color: D.COLOR_CSS[h.color]
    });
    var desc = this.add.text(-cw / 2 + 148, -chh / 2 + 86, unlocked ? h.desc : 'Locked — ' + h.unlockText, {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#b9bde6', wordWrap: { width: cw - 170 }
    });
    var sig = this.add.text(-cw / 2 + 148, chh / 2 - 30, unlocked ? ('Signature: ' + D.auraById(h.signature).name) : '', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#8a8fc9'
    });
    c.add([bg, edge, spr, name, ttl, desc, sig]);
    if (selected) {
      var badge = this.add.text(cw / 2 - 16, -chh / 2 + 22, 'READY', {
        fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#0a0d22',
        backgroundColor: '#5cff9d', padding: { x: 10, y: 5 }
      }).setOrigin(1, 0.5);
      c.add(badge);
    }
    if (unlocked) {
      c.setSize(cw, chh); c.setInteractive({ useHandCursor: true });
      c.on('pointerup', function () {
        if (self.selectedHero !== h.id) {
          self.selectedHero = h.id; D.audio.uiClick();
          self.refreshHeroCards();
        }
      });
      this.tweens.add({ targets: spr, y: -8, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      var lock = this.add.text(cw / 2 - 52, -chh / 2 + 24, 'LOCKED', {
        fontFamily: 'Arial, sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#ff9a6a',
        backgroundColor: 'rgba(10,12,34,0.7)', padding: { x: 8, y: 4 }
      }).setOrigin(0.5);
      c.add(lock);
    }
    return c;
  },

  buildHeroCards: function (W) {
    var self = this;
    this.heroList.removeAll(true);
    var y = 96;
    D.HEROES.forEach(function (h) {
      var card = self.heroCard(W, h, y);
      self.heroList.add(card);
      y += 188;
    });
    this._heroListH = y;
    if (this._layoutHeroList) this._layoutHeroList();
  },

  refreshHeroCards: function () {
    var W = this.scale.width;
    var curY = this.heroList.y;
    this.buildHeroCards(W);
    this.heroList.y = curY;
  },

  dimBehind: function (W, H) {
    var z = this.add.zone(W / 2, H / 2, W, H).setInteractive().setDepth(100);
    var d = this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.78).setDepth(100);
    return [z, d];
  },

  showRelics: function (W, H) {
    var self = this;
    var objs = this.dimBehind(W, H);
    var panel = D.ui.card(this, W / 2, H / 2, Math.min(560, W - 24), Math.min(640, H - 120), {});
    panel.setDepth(101);
    var items = [panel].concat(objs);
    var title = this.add.text(0, -272, 'RELIC VAULT', { fontFamily: 'Arial, sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#ffc93c' }).setOrigin(0.5);
    var sub = this.add.text(0, -238, 'Keep up to 3 relics. They travel with you into every run.', { fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#b9bde6' }).setOrigin(0.5);
    panel.add([title, sub]); items.push(title, sub);
    var kept = D.save.relics.slice();
    var grid = this.add.container(0, -180);
    panel.add(grid);
    var cols = 3, cw = 150, chh = 100;
    var rowPitch = 108;
    var redraw = null;
    var icons = { sun: '☀', moon: '☾', wind: '≋', idol: '◈', thornmail: '✦', frost: '❄', horn: '📯', stone: '⬢', vial: '🧪', drum: '◎', tear: '💧', veil2: '◍' };
    redraw = function () {
      grid.removeAll(true);
      D.RELICS.forEach(function (r, i) {
        var col = i % cols, row = Math.floor(i / cols);
        var x = (col - 1) * (cw + 8), y = row * rowPitch;
        var isKept = kept.indexOf(r.id) >= 0;
        var cell = self.add.container(x, y);
        var bgc = self.add.graphics();
        bgc.fillStyle(isKept ? 0x2a4a2e : 0x1a1f45, 0.95); bgc.fillRoundedRect(-cw / 2, -chh / 2, cw, chh, 12);
        bgc.lineStyle(2, isKept ? 0x5cff9d : 0x4a4f7a, 1); bgc.strokeRoundedRect(-cw / 2, -chh / 2, cw, chh, 12);
        var ic = self.add.text(0, -chh / 2 + 22, icons[r.icon] || '◆', { fontSize: '26px' }).setOrigin(0.5);
        var nm = self.add.text(0, -chh / 2 + 44, r.name, { fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold', color: isKept ? '#5cff9d' : '#ffffff' }).setOrigin(0.5);
        var ds = self.add.text(0, -chh / 2 + 60, r.desc, { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#b9bde6', wordWrap: { width: cw - 14 }, align: 'center' }).setOrigin(0.5, 0);
        cell.add([bgc, ic, nm, ds]);
        cell.setSize(cw, chh); cell.setInteractive({ useHandCursor: true });
        cell.on('pointerup', function () {
          var at = kept.indexOf(r.id);
          if (at >= 0) { kept.splice(at, 1); D.audio.uiClick(); }
          else if (kept.length < 3) { kept.push(r.id); D.audio.rankup(); }
          else { D.ui.toast(self, 'Vault full — remove one first', '#ff9a6a'); return; }
          redraw();
        });
        grid.add(cell);
      });
    };
    redraw();
    grid.y = -160;
    var close = D.ui.button(this, 0, 272, 240, 'DONE', { fs: 20 }, function () {
      D.save.relics = kept; D.persist(); D.audio.uiClick();
      items.forEach(function (o) { o.destroy(); }); grid.destroy(true);
    });
    panel.add(close); items.push(close);
  },

  showAchievements: function (W, H) {
    var self = this;
    var objs = this.dimBehind(W, H);
    var panel = D.ui.card(this, W / 2, H / 2, Math.min(560, W - 24), Math.min(640, H - 120), {});
    panel.setDepth(101);
    var items = [panel].concat(objs);
    var title = this.add.text(0, -272, 'TROPHIES', { fontFamily: 'Arial, sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#ffc93c' }).setOrigin(0.5);
    panel.add(title); items.push(title);
    var list = this.add.container(0, -240);
    panel.add(list);
    var y = 0;
    D.ACHIEVEMENTS.forEach(function (a) {
      var got = !!D.save.ach[a.id];
      var row = self.add.container(0, y);
      var bg = self.add.graphics();
      bg.fillStyle(got ? 0x2a3a1e : 0x141a38, 0.9); bg.fillRoundedRect(-250, -26, 500, 52, 10);
      var star = self.add.text(-232, 0, got ? '★' : '☆', { fontSize: '26px', color: got ? '#ffc93c' : '#4a4f7a' }).setOrigin(0.5);
      var nm = self.add.text(-200, -10, a.name, { fontFamily: 'Arial, sans-serif', fontSize: '17px', fontStyle: 'bold', color: got ? '#ffffff' : '#8a8fc9' }).setOrigin(0, 0.5);
      var ds = self.add.text(-200, 12, a.desc + (a.reward ? '  → unlocks ' + a.reward.split(':')[1].toUpperCase() : ''), { fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#8a8fc9' }).setOrigin(0, 0.5);
      row.add([bg, star, nm, ds]);
      list.add(row); items.push(row);
      y += 60;
    });
    list.y = -230 + 0;
    // simple: shift list up so first rows visible; panel is fixed — allow drag scroll
    var sy0 = 0, dragging = false, py = 0;
    panel.setSize(560, 640); panel.setInteractive();
    panel.on('pointerdown', function (p) { dragging = true; py = p.y; sy0 = list.y; });
    this.input.on('pointerup', function () { dragging = false; });
    this.input.on('pointermove', function (p) {
      if (!dragging || !p.isDown) return;
      list.y = Phaser.Math.Clamp(sy0 + (p.y - py), -230 - (y - 480), -230);
    });
    var close = D.ui.button(this, 0, 272, 240, 'CLOSE', { fs: 20 }, function () {
      items.forEach(function (o) { o.destroy(); });
    });
    panel.add(close); items.push(close);
  },

  showSkins: function (W, H) {
    var self = this;
    var hero = D.HEROES.find(function (x) { return x.id === self.selectedHero; });
    var objs = this.dimBehind(W, H);
    var panel = D.ui.card(this, W / 2, H / 2, Math.min(520, W - 24), 480, {});
    panel.setDepth(101);
    var items = [panel].concat(objs);
    var title = this.add.text(0, -196, hero.name + ' — SKINS', { fontFamily: 'Arial, sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#ffc93c' }).setOrigin(0.5);
    panel.add(title); items.push(title);
    var owned = D.SKINS.filter(function (s) { return D.save.skins[s.id]; });
    var perRow = 3, x0 = 0;
    owned.forEach(function (s, i) {
      var col = i % perRow, row = Math.floor(i / perRow);
      var x = (col - (perRow - 1) / 2) * 140, y = -90 + row * 150;
      var cell = self.add.container(x, y);
      var tint = D.SKIN_TINTS[s.id];
      var spr = self.add.image(0, -20, 'hero_' + hero.id).setScale(1.1).setTint(tint[0]);
      var nm = self.add.text(0, 44, s.name, { fontFamily: 'Arial, sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      var sel = (D.save.skinSel[hero.id] || 'default') === s.id;
      var bg = self.add.graphics();
      bg.lineStyle(sel ? 4 : 2, sel ? 0x5cff9d : 0x4a4f7a, 1); bg.strokeRoundedRect(-62, -70, 124, 140, 12);
      cell.add([bg, spr, nm]);
      cell.setSize(124, 140); cell.setInteractive({ useHandCursor: true });
      cell.on('pointerup', function () {
        D.save.skinSel[hero.id] = s.id; D.persist(); D.audio.uiClick();
        items.forEach(function (o) { o.destroy(); });
        self.refreshHeroCards();
      });
      panel.add(cell); items.push(cell);
    });
    var note = this.add.text(0, 150, 'More skins unlock via Trophies.', { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#8a8fc9' }).setOrigin(0.5);
    var close = D.ui.button(this, 0, 196, 240, 'CLOSE', { fs: 20 }, function () { items.forEach(function (o) { o.destroy(); }); });
    panel.add([note, close]); items.push(note, close);
  },

  popUnlocks: function () {
    var self = this;
    var q = D.save.newUnlocks || [];
    if (!q.length) return;
    var u = q.shift(); D.persist();
    var W = this.scale.width, H = this.scale.height;
    var objs = this.dimBehind(W, H);
    var panel = D.ui.card(this, W / 2, H / 2, Math.min(460, W - 40), 380, { edge: 0xffc93c });
    panel.setDepth(200);
    var items = [panel].concat(objs);
    var t1 = this.add.text(0, -140, 'UNLOCKED!', { fontFamily: 'Arial, sans-serif', fontSize: '36px', fontStyle: 'bold', color: '#ffc93c' }).setOrigin(0.5);
    panel.add(t1); items.push(t1);
    if (u.kind === 'hero') {
      var h = D.HEROES.find(function (x) { return x.id === u.id; });
      var spr = this.add.image(0, -40, 'hero_' + h.id).setScale(2);
      var nm = this.add.text(0, 60, h.name + ' — ' + h.title, { fontFamily: 'Arial, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      panel.add([spr, nm]); items.push(spr, nm);
      this.tweens.add({ targets: spr, angle: 360, duration: 1200, ease: 'Cubic.easeOut' });
    } else {
      var nm2 = this.add.text(0, -20, u.id.toUpperCase() + ' SKIN', { fontFamily: 'Arial, sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      var ds = this.add.text(0, 30, 'Find it under SKINS on the hero screen.', { fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#b9bde6' }).setOrigin(0.5);
      panel.add([nm2, ds]); items.push(nm2, ds);
    }
    var ok = D.ui.button(this, 0, 130, 240, 'CLAIM', { fs: 22, tint: 0x2a8a5c }, function () {
      items.forEach(function (o) { o.destroy(); });
      self.refreshHeroCards();
      self.popUnlocks();
    });
    panel.add(ok); items.push(ok);
    D.audio.fuse();
  }
});

})();
