/* BAZAAR SIEGE — ui.js
 * Shared UI helpers: panel(), button() (>=88px, press squash),
 * banner() (ribbon slide in/out), hintPill() updater.
 * All use generated textures; everything animates, nothing pops. */
(function (global) {
  var BS = (global.BS = global.BS || {});

  var CREAM = '#fff6e8';
  var GOLD = '#ffca7a';

  /* Rounded panel container of w x h, centered at (x, y). */
  function panel(scene, x, y, w, h) {
    var c = scene.add.container(x, y);
    var bg = scene.add.image(0, 0, 'ui-panel').setDisplaySize(w, h);
    c.add(bg);
    c.setSize(w, h);
    return c;
  }

  /* Button with label + callback. Min 88px tall, press squash + click sound. */
  function button(scene, x, y, label, cb, opts) {
    opts = opts || {};
    var w = Math.max(opts.w || 220, 120);
    var h = Math.max(opts.h || 96, 88);
    var c = scene.add.container(x, y);
    var bg = scene.add.image(0, 0, 'ui-button').setDisplaySize(w, h);
    var t = scene.add.text(0, -2, label, {
      fontFamily: 'Georgia, serif', fontSize: Math.round(opts.fontSize || 30) + 'px',
      color: CREAM, fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5);
    if (opts.small) { t.setFontSize(24); }
    c.add([bg, t]);
    c.setSize(w, h);
    // NOTE: container hit areas live in "frame" space: the input system adds
    // displayOrigin (w/2, h/2) to the center-relative local point, so the
    // rect must be (0, 0, w, h) — NOT centered — or only a quadrant responds.
    c.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, w, h),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true
    });
    var audio = BS.audio;
    c.on('pointerdown', function () {
      scene.tweens.add({ targets: c, scaleX: 0.94, scaleY: 0.94, duration: 70, ease: 'Quad.easeOut' });
    });
    c.on('pointerup', function () {
      scene.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 140, ease: 'Back.easeOut' });
      if (audio) { audio.uiClick(); }
      if (cb) { cb(); }
    });
    c.on('pointerout', function () {
      scene.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 120 });
    });
    return c;
  }

  /* Full-width ribbon banner: slides in with Back ease, holds, slides out.
   * Returns the container (destroyed automatically after holdMs + out). */
  function banner(scene, text, sub, holdMs) {
    holdMs = holdMs || 2200;
    var y = 340;
    var c = scene.add.container(360, -120);
    c.setDepth(900);
    var ribbon = scene.add.image(0, 0, 'ui-ribbon');
    // Layered-text glow (deterministic; no shadowBlur reliance).
    var glowC = scene.add.container(0, -14);
    var tStyle = {
      fontFamily: 'Georgia, serif', fontSize: '44px', color: GOLD,
      fontStyle: 'bold', align: 'center'
    };
    [[-2, 0], [2, 0], [0, -2], [0, 2]].forEach(function (o) {
      glowC.add(scene.add.text(o[0], o[1], text, tStyle).setOrigin(0.5).setAlpha(0.6).setColor('#ff9a1f'));
    });
    glowC.add(scene.add.text(0, 0, text, tStyle).setOrigin(0.5));
    c.add(ribbon);
    c.add(glowC);
    if (sub) {
      var s = scene.add.text(0, 26, sub, {
        fontFamily: 'Georgia, serif', fontSize: '24px', color: CREAM, align: 'center'
      }).setOrigin(0.5);
      c.add(s);
    }
    var audio = BS.audio;
    if (audio) { audio.banner(); }
    scene.tweens.add({
      targets: c, y: y, duration: 450, ease: 'Back.easeOut',
      onComplete: function () {
        scene.time.delayedCall(holdMs, function () {
          scene.tweens.add({
            targets: c, y: -140, duration: 400, ease: 'Quad.easeIn',
            onComplete: function () { c.destroy(); }
          });
        });
      }
    });
    return c;
  }

  /* Hint pill: cream text on a dark pill with a pulsing gold dot.
   * Returns { container, set(text) }. */
  function hintPill(scene, x, y, width) {
    var c = scene.add.container(x, y);
    c.setDepth(800);
    var bg = scene.add.graphics();
    function drawBg() {
      bg.clear();
      bg.fillStyle(0x1c1430, 0.92);
      bg.fillRoundedRect(-width / 2, -20, width, 40, 20);
      bg.lineStyle(2, 0xffca7a, 0.7);
      bg.strokeRoundedRect(-width / 2, -20, width, 40, 20);
    }
    drawBg();
    var dot = scene.add.image(-width / 2 + 24, 0, 'ui-dot');
    var t = scene.add.text(-width / 2 + 44, 0, '', {
      fontFamily: 'Georgia, serif', fontSize: '21px', color: CREAM,
      wordWrap: { width: width - 70 }
    }).setOrigin(0, 0.5);
    c.add([bg, dot, t]);
    scene.tweens.add({ targets: dot, scaleX: 1.35, scaleY: 1.35, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return {
      container: c,
      set: function (text) { t.setText(text); }
    };
  }

  /* Mute toggle button (small, top corner). Shows state via label. */
  function muteButton(scene, x, y) {
    var c = scene.add.container(x, y);
    c.setDepth(950);
    var bg = scene.add.image(0, 0, 'ui-button').setDisplaySize(88, 88);
    var audio = BS.audio;
    var label = scene.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif', fontSize: '34px', color: CREAM
    }).setOrigin(0.5);
    function refresh() { label.setText(audio && audio.muted ? 'MUTE' : 'SOUND'); }
    refresh();
    c.add([bg, label]);
    c.setSize(88, 88);
    c.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 88, 88),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true
    });
    c.on('pointerup', function () {
      if (audio) { audio.unlock(); audio.toggleMute(); }
      refresh();
      if (audio) { audio.uiClick(); }
    });
    c.refresh = refresh;
    return c;
  }

  BS.ui = {
    panel: panel,
    button: button,
    banner: banner,
    hintPill: hintPill,
    muteButton: muteButton,
    CREAM: CREAM,
    GOLD: GOLD
  };
})(typeof window !== 'undefined' ? window : globalThis);
