/* DUSKLINE src/ui.js — UI helpers: animated buttons, cards, damage numbers, banners. */
(function () {
'use strict';
var D = window.DUSK = window.DUSK || {};

D.ui = {};

/* Big touch-friendly neon button. Never pops — springs in. */
D.ui.button = function (scene, x, y, w, label, opts, cb) {
  opts = opts || {};
  var h = opts.h || 64;
  var c = scene.add.container(x, y);
  var bg = scene.add.image(0, 0, 'btn').setDisplaySize(w, h);
  if (opts.tint) bg.setTint(opts.tint);
  var t = scene.add.text(0, 0, label, {
    fontFamily: 'Arial, sans-serif', fontSize: (opts.fs || 24) + 'px', fontStyle: 'bold',
    color: opts.color || '#ffffff'
  }).setOrigin(0.5);
  c.add([bg, t]);
  c.setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  var pressed = false;
  c.on('pointerdown', function () { pressed = true; scene.tweens.add({ targets: c, scaleX: 0.94, scaleY: 0.94, duration: 70 }); });
  c.on('pointerup', function () {
    scene.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 120, ease: 'Back.easeOut' });
    if (pressed) { D.audio.uiClick(); D.audio.unlock(); cb && cb(); }
    pressed = false;
  });
  c.on('pointerout', function () { pressed = false; scene.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 120 }); });
  c.on('pointerover', function () { D.audio.uiHover(); });
  if (!opts.noAnim) {
    c.setScale(0.6); c.setAlpha(0);
    scene.tweens.add({ targets: c, scaleX: 1, scaleY: 1, alpha: 1, duration: 280, ease: 'Back.easeOut', delay: opts.delay || 0 });
  }
  c._bg = bg; c._label = t;
  c.setLabel = function (s) { t.setText(s); };
  return c;
};

/* Card container with spring-in */
D.ui.card = function (scene, x, y, w, h, opts) {
  opts = opts || {};
  var c = scene.add.container(x, y);
  var bg = scene.add.image(0, 0, 'card').setDisplaySize(w, h);
  if (opts.edge) bg.setTint(opts.edge);
  c.add(bg); c._bg = bg;
  c.setScale(0.7); c.setAlpha(0);
  scene.tweens.add({ targets: c, scaleX: 1, scaleY: 1, alpha: 1, duration: 320, ease: 'Back.easeOut', delay: opts.delay || 0 });
  return c;
};

/* Pooled floating damage numbers */
D.ui.DamageNumbers = function (scene) {
  this.scene = scene; this.pool = []; this.idx = 0;
  for (var i = 0; i < 28; i++) {
    var t = scene.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setVisible(false).setDepth(900);
    this.pool.push(t);
  }
};
D.ui.DamageNumbers.prototype.spawn = function (x, y, amount, color, big) {
  var t = this.pool[this.idx]; this.idx = (this.idx + 1) % this.pool.length;
  var s = this.scene;
  s.tweens.killTweensOf(t);
  t.setText(Math.round(amount) + '').setPosition(x + (Math.random() - 0.5) * 20, y - 10)
    .setColor(color || '#ffffff').setFontSize(big ? 30 : 20).setAlpha(1).setScale(big ? 1.25 : 0.9).setVisible(true);
  s.tweens.add({
    targets: t, y: y - 64, alpha: 0, scaleX: big ? 1.5 : 1.1, scaleY: big ? 1.5 : 1.1,
    duration: big ? 800 : 600, ease: 'Cubic.easeOut',
    onComplete: function () { t.setVisible(false); }
  });
};

/* Full-width event banner that sweeps across */
D.ui.banner = function (scene, title, sub, colorCss) {
  var W = scene.scale.width, H = scene.scale.height;
  var c = scene.add.container(W + 400, H * 0.30).setDepth(950);
  var bg = scene.add.image(0, 0, 'banner').setDisplaySize(W + 120, 110);
  var t1 = scene.add.text(0, -20, title, {
    fontFamily: 'Arial, sans-serif', fontSize: '40px', fontStyle: 'bold', color: colorCss || '#ffc93c'
  }).setOrigin(0.5);
  var t2 = scene.add.text(0, 22, sub || '', {
    fontFamily: 'Arial, sans-serif', fontSize: '19px', color: '#cfd2ff'
  }).setOrigin(0.5);
  c.add([bg, t1, t2]);
  scene.tweens.add({
    targets: c, x: W / 2, duration: 450, ease: 'Cubic.easeOut',
    onComplete: function () {
      scene.time.delayedCall(1700, function () {
        scene.tweens.add({ targets: c, x: -400, duration: 450, ease: 'Cubic.easeIn', onComplete: function () { c.destroy(); } });
      });
    }
  });
  D.audio.eventHorn();
};

/* Center toast message */
D.ui.toast = function (scene, text, color) {
  var W = scene.scale.width;
  var t = scene.add.text(W / 2, 120, text, {
    fontFamily: 'Arial, sans-serif', fontSize: '26px', fontStyle: 'bold', color: color || '#ffffff',
    stroke: '#000022', strokeThickness: 5, backgroundColor: 'rgba(10,12,34,0.75)', padding: { x: 18, y: 10 }
  }).setOrigin(0.5).setDepth(960).setAlpha(0).setScale(0.8);
  scene.tweens.add({ targets: t, alpha: 1, scaleX: 1, scaleY: 1, duration: 250, ease: 'Back.easeOut' });
  scene.time.delayedCall(2100, function () {
    scene.tweens.add({ targets: t, alpha: 0, y: 90, duration: 300, onComplete: function () { t.destroy(); } });
  });
};

/* Small floating label at world position */
D.ui.floatText = function (scene, x, y, text, color, size) {
  var t = scene.add.text(x, y, text, {
    fontFamily: 'Arial, sans-serif', fontSize: (size || 22) + 'px', fontStyle: 'bold', color: color || '#ffe14c',
    stroke: '#000000', strokeThickness: 4
  }).setOrigin(0.5).setDepth(900);
  scene.tweens.add({
    targets: t, y: y - 70, alpha: 0, duration: 1100, ease: 'Cubic.easeOut',
    onComplete: function () { t.destroy(); }
  });
};

D.ui.fmtTime = function (sec) {
  sec = Math.max(0, Math.floor(sec));
  var m = Math.floor(sec / 60), s = sec % 60;
  return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
};

})();
