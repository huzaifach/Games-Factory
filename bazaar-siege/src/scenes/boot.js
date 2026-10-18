/* BAZAAR SIEGE — scenes/boot.js
 * Honest loading: staged progress tied to REAL steps
 * (Phaser ready -> textures -> audio probe -> save load -> done).
 * The big ENTER button enables ONLY when ready. 20s watchdog ->
 * "The night is slow to fall — Try Again" (scene restart).
 * A window error hook shows a retry overlay. No dead ends. */
(function (global) {
  var BS = (global.BS = global.BS || {});

  function loadSave() {
    var save = { bestNight: 0, stars: 0, tutorialDone: false, muted: false };
    try {
      var raw = null;
      if (global.localStorage) { raw = global.localStorage.getItem(BS.CONFIG.SAVE_KEY); }
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.bestNight === 'number') { save.bestNight = parsed.bestNight; }
          if (typeof parsed.stars === 'number') { save.stars = parsed.stars; }
          if (parsed.tutorialDone) { save.tutorialDone = true; }
          if (parsed.muted) { save.muted = true; }
        }
      }
    } catch (e) { /* corrupted save -> defaults */ }
    return save;
  }

  BS.loadSave = loadSave;
  BS.writeSave = function (save) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(BS.CONFIG.SAVE_KEY, JSON.stringify(save));
      }
    } catch (e) { /* storage unavailable -> play on without saving */ }
  };

  BS.Scenes = BS.Scenes || {};

  BS.Scenes.Boot = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function () {
      Phaser.Scene.call(this, { key: 'Boot' });
    },

    create: function () {
      var scene = this;
      var W = BS.CONFIG.WIDTH, H = BS.CONFIG.HEIGHT;

      this.cameras.main.setBackgroundColor('#0b1030');

      // Boot-screen button drawn with RAW GRAPHICS (the 'ui-button' texture is
      // generated later in the staged load, so BS.ui.button cannot be used here).
      function bootButton(x, y, w, h, label, cb) {
        var c = scene.add.container(x, y);
        var bg = scene.add.graphics();
        function draw(up) {
          bg.clear();
          bg.fillStyle(0x6b2d4a, 1);
          bg.fillRoundedRect(-w / 2, -h / 2, w, h, 20);
          bg.fillStyle(up ? 0x8a3a5f : 0x552238, 1);
          bg.fillRoundedRect(-w / 2, -h / 2, w, h - 8, 20);
          bg.lineStyle(3, 0xffca7a, 1);
          bg.strokeRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 14, 18);
        }
        draw(true);
        var t = scene.add.text(0, -2, label, {
          fontFamily: 'Georgia, serif', fontSize: '34px', color: '#fff6e8', fontStyle: 'bold'
        }).setOrigin(0.5);
        c.add([bg, t]);
        c.setSize(w, h);
        // Frame-space rect (see ui.js note): (0, 0, w, h), not centered.
        c.setInteractive({
          hitArea: new Phaser.Geom.Rectangle(0, 0, w, h),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true
        });
        c.on('pointerdown', function () { draw(false); });
        c.on('pointerup', function () { draw(true); cb(); });
        c.on('pointerout', function () { draw(true); });
        return c;
      }

      // Retry overlay (hidden unless something goes wrong).
      var overlay = null;
      function showRetry(message) {
        if (overlay) { return; }
        overlay = scene.add.container(W / 2, H / 2).setDepth(5000);
        var dim = scene.add.rectangle(0, 0, W, H, 0x0b1030, 0.9);
        var msg = scene.add.text(0, -80, message, {
          fontFamily: 'Georgia, serif', fontSize: '30px', color: '#fff6e8',
          align: 'center', wordWrap: { width: 560 }
        }).setOrigin(0.5);
        var again = bootButton(0, 60, 320, 100, 'Try Again', function () {
          scene.scene.restart();
        });
        overlay.add([dim, msg, again]);
      }

      // Window error hook -> retry overlay (no dead ends).
      var onErr = function () { showRetry('Something stumbled in the dark.\nTap to light the lanterns again.'); };
      if (global.addEventListener) {
        global.addEventListener('error', onErr);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, function () {
          global.removeEventListener('error', onErr);
        });
      }

      // Title + progress UI.
      // Title with layered-text glow (deterministic; no shadowBlur reliance).
      var titleC = this.add.container(W / 2, 480);
      var titleStyle = {
        fontFamily: 'Georgia, serif', fontSize: '72px', color: '#ffca7a', fontStyle: 'bold'
      };
      [[-3, 0], [3, 0], [0, -3], [0, 3]].forEach(function (o) {
        titleC.add(scene.add.text(o[0], o[1], 'BAZAAR SIEGE', titleStyle).setOrigin(0.5).setAlpha(0.55).setColor('#ff9a1f'));
      });
      titleC.add(scene.add.text(0, 0, 'BAZAAR SIEGE', titleStyle).setOrigin(0.5));
      var title = titleC;
      var sub = this.add.text(W / 2, 540, 'Hold the night bazaar till dawn', {
        fontFamily: 'Georgia, serif', fontSize: '28px', color: '#fff6e8'
      }).setOrigin(0.5);

      var barW = 480;
      var barBg = this.add.graphics();
      barBg.fillStyle(0x1c1430, 1); barBg.fillRoundedRect(W / 2 - barW / 2, 640, barW, 26, 13);
      var bar = this.add.graphics();
      var pctText = this.add.text(W / 2, 690, '0%', {
        fontFamily: 'Georgia, serif', fontSize: '24px', color: '#fff6e8'
      }).setOrigin(0.5);
      var stepText = this.add.text(W / 2, 730, 'Waking the bazaar...', {
        fontFamily: 'Georgia, serif', fontSize: '22px', color: '#cbb8e8'
      }).setOrigin(0.5);

      function setProgress(pct, label) {
        bar.clear();
        bar.fillStyle(0xffb347, 1);
        bar.fillRoundedRect(W / 2 - barW / 2, 640, barW * Math.min(1, Math.max(0, pct)), 26, 13);
        pctText.setText(Math.round(pct * 100) + '%');
        if (label) { stepText.setText(label); }
      }

      // Big ENTER button — enabled ONLY when ready.
      var enterBtn = bootButton(W / 2, 900, 480, 110, 'ENTER THE BAZAAR', function () {
        if (!ready) { return; }
        if (BS.audio) { BS.audio.unlock(); BS.audio.startAmbience(); }
        scene.scene.start('Menu');
      });
      enterBtn.setAlpha(0.35);

      var ready = false;
      var finished = false;

      // 20s watchdog -> retry.
      var watchdog = this.time.delayedCall(20000, function () {
        if (!finished) {
          showRetry('The night is slow to fall.\nCheck your connection and try again.');
        }
      });

      // Real staged steps.
      var steps = [
        { pct: 0.15, label: 'Phaser is ready...', fn: function () { return true; } },
        {
          pct: 0.55, label: 'Painting lanterns and imps...', fn: function () {
            BS.makeTextures(scene);
            return scene.textures.exists('turret-rickshaw') && scene.textures.exists('enemy-runner');
          }
        },
        {
          pct: 0.75, label: 'Tuning the dhol...', fn: function () {
            return !!(BS.audio && typeof BS.audio.unlock === 'function');
          }
        },
        {
          pct: 0.9, label: 'Reading your last night...', fn: function () {
            BS.save = loadSave();
            if (BS.audio && BS.save.muted) { BS.audio.muted = true; }
            return true;
          }
        },
        { pct: 1.0, label: 'The bazaar glows.', fn: function () { return true; } }
      ];

      var i = 0;
      function runStep() {
        if (i >= steps.length) {
          finished = true;
          watchdog.remove(false);
          ready = true;
          BS.bootReady = true; // for automated smoke tests
          enterBtn.setAlpha(1);
          scene.tweens.add({ targets: enterBtn, scaleX: 1.04, scaleY: 1.04, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          stepText.setText('Tap to enter.');
          return;
        }
        var step = steps[i];
        setProgress(step.pct, step.label);
        var ok = false;
        try { ok = step.fn(); } catch (e) { ok = false; }
        if (!ok) {
          showRetry('The night is slow to fall.\nTap to try again.');
          return;
        }
        i++;
        // Let the frame paint so progress is honest, then continue.
        scene.time.delayedCall(120, runStep);
      }
      setProgress(0.02, 'Waking the bazaar...');
      this.time.delayedCall(150, runStep);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
