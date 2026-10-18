/* RUCKUS RAMPAGE — main: Phaser boot, loading with real progress, scenes, resize. */
var RR = (typeof RR !== 'undefined') ? RR : {};

RR.BootScene = function () { Phaser.Scene.call(this, { key: 'Boot' }); };
RR.BootScene.prototype = Object.create(Phaser.Scene.prototype);
RR.BootScene.prototype.constructor = RR.BootScene;
RR.BootScene.prototype.create = function () {
  var sc = this, W = sc.scale.width, H = sc.scale.height;
  window.__bootTrace = [];
  var trace = function (m) { window.__bootTrace.push(m); };
  try {
    RR.Save.load(); trace('save-ok');
    RR.UI.init(sc); trace('ui-ok');
    RR.UI.showLoading(W, H); trace('loading-ok');
  } catch (e) { trace('EARLY-FAIL: ' + (e && e.message)); return; }
  var els = RR.UI.loadingEls;
  var steps = [
    ['Warming up the akhara...', function () { RR.FX.init(sc); }],
    ['Teaching bots to brawl...', function () { /* AI tables ready (logic) */ }],
    ['Inflating bumper dhols...', function () { RR.Arena.build(sc, RR.Save.data.arena, W, H); }],
    ['Charging spring gloves...', function () { RR.Weapons.init(sc, RR.Arena); RR.Weapons.scene = sc; }],
    ['Tuning the dhol...', function () { /* input attaches in MainScene (needs the live scene) */ }],
    ['Stretching the ropes...', function () { RR.Arena.wobbleRopes(); }]
  ];
  var i = 0;
  var next = function () {
    if (i < steps.length) {
      try { steps[i][1](); trace('step-ok-' + i); }
      catch (e) { trace('step-FAIL-' + i + ': ' + (e && e.message)); RR.BootError = e; }
      i++;
      try { els.draw(i / steps.length, steps[i - 1][0]); }
      catch (e) { trace('draw-FAIL-' + i + ': ' + (e && e.message)); }
      setTimeout(next, 120);
    } else if (RR.BootError) {
      els.draw(1, 'Something tripped! Tap TRY AGAIN.');
      RR.UI.button(els.c, W / 2, H * 0.52, 300, 70, 'TRY AGAIN', function () {
        window.location.reload();
      }, { color: 0xff5d5d, fs: 28 });
    } else {
      trace('all-done');
      RR.UI.showTapToStart(W, H, function () { sc.scene.start('Main'); });
    }
  };
  setTimeout(next, 60);
};

RR.MainScene = function () { Phaser.Scene.call(this, { key: 'Main' }); };
RR.MainScene.prototype = Object.create(Phaser.Scene.prototype);
RR.MainScene.prototype.constructor = RR.MainScene;
RR.MainScene.prototype.create = function () {
  var sc = this;
  RR.UI.init(sc);
  RR.Input.attach(sc); /* live scene: joystick + buttons + keyboard */
  RR.Match.init(sc);
  RR.Match.showTitle();
  sc.scale.on('resize', function () { RR.Match.onResize(); });
  /* portrait rotate hint */
  var hint = null;
  var checkOrient = function () {
    var w = sc.scale.width, h = sc.scale.height;
    if (h > w * 1.05 && !hint) hint = RR.UI.rotateHint(w, h);
    else if (h <= w * 1.05 && hint) { hint.destroy(); hint = null; }
  };
  checkOrient();
  sc.scale.on('resize', checkOrient);
};
RR.MainScene.prototype.update = function (time, delta) {
  RR.Match.update(time, delta);
};

window.addEventListener('load', function () {
  var res = Math.min(2, window.devicePixelRatio || 1);
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0d0a24',
    resolution: res,
    render: { antialias: true },
    scale: {
      mode: Phaser.Scale.RESIZE,
      parent: 'game',
      width: '100%',
      height: '100%'
    },
    scene: [new RR.BootScene(), new RR.MainScene()]
  });
});
