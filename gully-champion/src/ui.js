/* GULLY CHAMPION — UI helpers. Plain script, global GCUI. */
var GCUI = (function () {
  'use strict';

  function click() {
    try { if (window.gcAudio) window.gcAudio.uiClick(); } catch (e) {}
  }

  function roundedBg(scene, w, h, fill, alpha, radius) {
    var g = scene.add.graphics();
    g.fillStyle(fill, alpha === undefined ? 1 : alpha);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, radius === undefined ? 24 : radius);
    return g;
  }

  // Big touch-friendly button. Returns container.
  function button(scene, x, y, w, label, opts) {
    opts = opts || {};
    var h = opts.height || 104;
    var fs = opts.fontSize || 40;
    var fill = opts.fill !== undefined ? opts.fill : 0xffca7a;
    var c = scene.add.container(x, y);
    var bg = roundedBg(scene, w, h, opts.bg === undefined ? 0x241a38 : opts.bg, opts.bgAlpha === undefined ? 0.92 : opts.bgAlpha, 26);
    // gold edge
    var edge = scene.add.graphics();
    edge.lineStyle(3, fill, 0.9);
    edge.strokeRoundedRect(-w / 2, -h / 2, w, h, 26);
    var t = scene.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif', fontSize: fs + 'px', fontStyle: 'bold',
      color: opts.color || '#fff6e8'
    }).setOrigin(0.5);
    c.add([bg, edge, t]);
    c.setSize(w, h);
    // Default hit area is correct for containers: Phaser tests the pointer in
    // top-left-relative space (local point + displayOrigin w/2,h/2) against the
    // default (0,0,w,h) rect, which exactly matches the centered visuals.
    c.setInteractive({ useHandCursor: true });
    if (!opts.disabled) {
      c.on('pointerdown', function () { scene.tweens.add({ targets: c, scaleX: 0.94, scaleY: 0.94, duration: 70 }); });
      c.on('pointerup', function () {
        scene.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 120, ease: 'Back.easeOut' });
        click();
        if (opts.onClick) opts.onClick();
      });
      c.on('pointerout', function () { scene.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 120 }); });
    } else {
      c.setAlpha(0.45);
    }
    if (opts.depth !== undefined) c.setDepth(opts.depth);
    return c;
  }

  function panel(scene, x, y, w, h, opts) {
    opts = opts || {};
    var c = scene.add.container(x, y);
    var bg = roundedBg(scene, w, h, opts.fill === undefined ? 0x241a38 : opts.fill, opts.alpha === undefined ? 0.92 : opts.alpha, 26);
    c.add(bg);
    if (opts.border !== false) {
      var edge = scene.add.graphics();
      edge.lineStyle(3, 0xffca7a, 0.55);
      edge.strokeRoundedRect(-w / 2, -h / 2, w, h, 26);
      c.add(edge);
    }
    c.setDepth(opts.depth === undefined ? 100 : opts.depth);
    return c;
  }

  function toast(scene, text, opts) {
    opts = opts || {};
    var t = scene.add.text(opts.x || 360, opts.y || 420, text, {
      fontFamily: 'Arial, sans-serif', fontSize: (opts.fontSize || 44) + 'px', fontStyle: 'bold',
      color: opts.color || '#fff6e8', align: 'center',
      stroke: '#241a38', strokeThickness: 8, wordWrap: { width: 620 }
    }).setOrigin(0.5).setDepth(500).setAlpha(0).setScale(0.7);
    scene.tweens.add({ targets: t, alpha: 1, scaleX: 1, scaleY: 1, duration: 220, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: t, alpha: 0, y: t.y - 40, delay: opts.hold || 1100, duration: 400, onComplete: function () { t.destroy(); } });
    return t;
  }

  // Damage-number style popup (runs, SIX!, OUT!).
  function popup(scene, x, y, text, opts) {
    opts = opts || {};
    var t = scene.add.text(x, y, text, {
      fontFamily: 'Arial, sans-serif', fontSize: (opts.fontSize || 84) + 'px', fontStyle: 'bold',
      color: opts.color || '#ffd75a', stroke: '#241a38', strokeThickness: 10
    }).setOrigin(0.5).setDepth(600).setScale(0.3);
    scene.tweens.add({ targets: t, scaleX: 1, scaleY: 1, duration: 260, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: t, y: y - 90, alpha: 0, delay: opts.hold || 700, duration: 450, onComplete: function () { t.destroy(); } });
    return t;
  }

  // Delivery telegraph banner.
  function telegraph(scene, label, cue, color, ms) {
    var c = scene.add.container(360, 250).setDepth(400).setAlpha(0).setScale(0.8);
    var bg = roundedBg(scene, 520, 120, 0x241a38, 0.92, 22);
    var edge = scene.add.graphics();
    edge.lineStyle(4, color, 1);
    edge.strokeRoundedRect(-260, -60, 520, 120, 22);
    var t1 = scene.add.text(0, -28, label, { fontFamily: 'Arial, sans-serif', fontSize: '44px', fontStyle: 'bold', color: '#fff6e8' }).setOrigin(0.5);
    var t2 = scene.add.text(0, 22, cue, { fontFamily: 'Arial, sans-serif', fontSize: '28px', color: '#ffd9a0' }).setOrigin(0.5);
    c.add([bg, edge, t1, t2]);
    scene.tweens.add({ targets: c, alpha: 1, scaleX: 1, scaleY: 1, duration: 180, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: c, alpha: 0, scaleX: 0.9, scaleY: 0.9, delay: ms || 850, duration: 200, onComplete: function () { c.destroy(); } });
    return c;
  }

  function dim(scene, alpha) {
    // Full canvas height (covers the extended area on tall phones too).
    var d = scene.add.rectangle(360, 640, 720, GCConfig.H, 0x0b0716, alpha === undefined ? 0.72 : alpha);
    d.setDepth(90);
    return d;
  }

  function showOverlay(c, scene) {
    c.setVisible(true).setAlpha(0).setScale(0.92);
    scene.tweens.add({ targets: c, alpha: 1, scaleX: 1, scaleY: 1, duration: 220, ease: 'Back.easeOut' });
  }
  function hideOverlay(c, scene, done) {
    scene.tweens.add({ targets: c, alpha: 0, scaleX: 0.94, scaleY: 0.94, duration: 160, onComplete: function () { c.setVisible(false); if (done) done(); } });
  }

  return {
    button: button, panel: panel, toast: toast, popup: popup,
    telegraph: telegraph, dim: dim, showOverlay: showOverlay, hideOverlay: hideOverlay
  };
})();
