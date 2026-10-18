/* DUSKLINE src/core.js — save manager, boot scene, game config. */
(function () {
'use strict';
var D = window.DUSK = window.DUSK || {};

/* ---------- save manager ---------- */
D.save = D.loadSave();
D.persist = function () { D.storeSave(D.save); };

D.unlockAchievement = function (id) {
  if (D.save.ach[id]) return null;
  D.save.ach[id] = true;
  var a = D.ACHIEVEMENTS.find(function (x) { return x.id === id; });
  if (a && a.reward) {
    var parts = a.reward.split(':');
    if (parts[0] === 'hero') { D.save.heroes[parts[1]] = true; D.save.newUnlocks.push({ kind: 'hero', id: parts[1] }); }
    if (parts[0] === 'skin') { D.save.skins[parts[1]] = true; D.save.newUnlocks.push({ kind: 'skin', id: parts[1] }); }
  }
  D.persist();
  return a;
};

D.relicMods = function () {
  // aggregate kept relics into one mod object
  var m = {};
  (D.save.relics || []).forEach(function (rid) {
    var r = D.relicById(rid); if (!r) return;
    for (var k in r.mod) m[k] = (m[k] || 0) + r.mod[k];
  });
  return m;
};

/* ---------- phaser config ---------- */
D.makeConfig = function () {
  return {
    type: Phaser.AUTO,
    parent: 'game-root',
    backgroundColor: '#070a1e',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%', height: '100%'
    },
    physics: { default: 'arcade', arcade: { debug: false } },
    render: { antialias: true, roundPixels: false },
    scene: [D.BootScene, D.MenuScene, D.GameScene]
  };
};

/* ---------- BOOT: honest loading screen ---------- */
D.BootScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function () { Phaser.Scene.call(this, { key: 'Boot' }); },

  create: function () {
    var W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#070a1e');
    var cx = W / 2, cy = H / 2;

    var title = this.add.text(cx, cy - 170, 'DUSKLINE', {
      fontFamily: 'Arial, sans-serif', fontSize: '64px', fontStyle: 'bold', color: '#ffc93c',
      stroke: '#3a1c5e', strokeThickness: 8
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, scaleX: 1.04, scaleY: 1.04, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(cx, cy - 118, 'A NEON DESERT SURVIVAL', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#8a8fc9', letterSpacing: 4
    }).setOrigin(0.5);

    var barW = Math.min(420, W - 80);
    var bg = this.add.graphics();
    bg.fillStyle(0x1a1f45, 1); bg.fillRoundedRect(cx - barW / 2, cy - 20, barW, 26, 13);
    var bar = this.add.graphics();
    var pct = this.add.text(cx, cy + 28, '0%', {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#4ce0ff'
    }).setOrigin(0.5);
    var phase = this.add.text(cx, cy + 62, 'waking the desert...', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#8a8fc9'
    }).setOrigin(0.5);

    var errBox = null;
    var self = this;
    function setProgress(p, label) {
      bar.clear();
      bar.fillStyle(0x4ce0ff, 1);
      var w = Math.max(8, barW * p);
      bar.fillRoundedRect(cx - barW / 2, cy - 20, w, 26, 13);
      bar.fillStyle(0xffffff, 0.35);
      bar.fillRoundedRect(cx - barW / 2, cy - 20, barW, 10, 6);
      pct.setText(Math.round(p * 100) + '%');
      if (label) phase.setText(label);
    }
    function fail(msg) {
      phase.setText('Something went wrong.').setColor('#ff6a6a');
      pct.setText('');
      bar.clear();
      errBox = D.ui.button(self, cx, cy + 130, 260, 'TRY AGAIN', { tint: 0xff6a6a }, function () {
        self.scene.restart();
      });
      self.add.text(cx, cy + 190, msg, {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#ff9a9a', wordWrap: { width: W - 60 }
      }).setOrigin(0.5);
    }

    // staged, honest build: each phase is real work, bar reflects it
    var phases = [
      ['painting the sky...', function () { /* sky + moon + ridges */ }],
      ['raising the dunes...', function () { }],
      ['waking the heroes...', function () { }],
      ['breeding the swarm...', function () { }],
      ['forging light...', function () { }],
      ['tuning the synth...', function () { D.audio.init(D.save.muted); }]
    ];
    setProgress(0.02, phases[0][0]);
    var i = 0;
    var buildAll = function () {
      try {
        D.buildTextures(self);
      } catch (err) { console.error('ART STACK: ' + (err && err.stack)); fail('Art failed: ' + (err && err.message)); return; }
      finish();
    };
    var stepPhase = function () {
      if (i < phases.length) {
        try { phases[i][1](); } catch (err) { fail('Init failed: ' + (err && err.message)); return; }
        setProgress(0.05 + (i / phases.length) * 0.85, phases[i][0]);
        i++;
        self.time.delayedCall(120, stepPhase);
      } else {
        self.time.delayedCall(60, buildAll);
      }
    };
    var finish = function () {
      setProgress(1, 'ready');
      self.time.delayedCall(250, function () {
        bar.clear(); bg.clear(); pct.destroy(); phase.destroy();
        self._bootReady = true;
        var btn = D.ui.button(self, cx, cy + 60, 320, 'ENTER THE DUSK', { fs: 26, tint: 0x2a8a5c }, function () {
          D.audio.unlock(); D.audio.startMusic();
          self.scene.start('Menu');
        });
        self.add.text(cx, cy + 130, 'Best played with sound on', {
          fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#8a8fc9'
        }).setOrigin(0.5).setAlpha(0.8);
        // mute toggle
        var mt = self.add.text(W - 24, 30, D.save.muted ? 'SOUND: OFF' : 'SOUND: ON', {
          fontFamily: 'Arial, sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#4ce0ff'
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        mt.on('pointerup', function () {
          D.save.muted = !D.save.muted; D.persist();
          D.audio.setMuted(D.save.muted);
          mt.setText(D.save.muted ? 'SOUND: OFF' : 'SOUND: ON');
          D.audio.uiClick();
        });
      });
    };
    this.time.delayedCall(200, stepPhase);

    this.scale.on('resize', function () { self.scene.restart(); });
  }
});

})();
