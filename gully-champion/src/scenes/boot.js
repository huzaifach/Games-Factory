/* GULLY CHAMPION — Boot scene: builds textures, gates Start on ready. */
var BootScene = new Phaser.Scene('Boot');

BootScene.create = function () {
  var scene = this;
  var W = 720, H = GCConfig.H, DH = GCConfig.DH;
  var OY = (H - DH) / 2;
  // Center the 720x1280 design space on taller canvases (full-bleed, no bars).
  scene.cameras.main.setScroll(0, -OY);

  // Warm backdrop while we build (full-bleed).
  var bg = scene.add.graphics();
  bg.fillGradientStyle(0x2b1a4d, 0x2b1a4d, 0xff9a5a, 0xffd29d, 1);
  bg.fillRect(0, -OY - 4, W, H + 8);

  var title = scene.add.text(W / 2, 480, 'GULLY\nCHAMPION', {
    fontFamily: 'Arial, sans-serif', fontSize: '96px', fontStyle: 'bold',
    color: '#ffd75a', align: 'center', stroke: '#3a1c4d', strokeThickness: 12, lineSpacing: 8
  }).setOrigin(0.5);

  var barBg = scene.add.graphics();
  barBg.fillStyle(0x241a38, 0.85);
  barBg.fillRoundedRect(W / 2 - 220, 760, 440, 26, 13);
  var bar = scene.add.graphics();

  var status = scene.add.text(W / 2, 820, 'Warming up the gali...', {
    fontFamily: 'Arial, sans-serif', fontSize: '30px', color: '#fff6e8'
  }).setOrigin(0.5);

  var startBtn = null;
  var ready = false;

  function setProgress(p, label) {
    bar.clear();
    bar.fillStyle(0xffca7a, 1);
    bar.fillRoundedRect(W / 2 - 220, 760, 440 * p, 26, 13);
    if (label) status.setText(label);
  }

  // Build in small steps across frames so the bar paints honestly.
  var steps = [
    ['Painting the sky...', function () { window.GCArt.makeAll(scene); }],
    ['Waking the crowd...', function () { /* textures done; crowd is runtime */ }],
    ['Tuning the dhol...', function () {
      try { if (window.gcAudio) { window.gcAudio.init(); } } catch (e) {}
    }]
  ];
  var i = 0;
  function next() {
    if (i < steps.length) {
      setProgress((i + 1) / (steps.length + 1), steps[i][0]);
      try { steps[i][1](); } catch (e) { /* keep booting; menu guards */ }
      i++;
      scene.time.delayedCall(120, next);
    } else {
      setProgress(1, 'Ready!');
      ready = true;
      showStart();
    }
  }

  function showStart() {
    barBg.setVisible(false); bar.setVisible(false); status.setVisible(false);
    startBtn = GCUI.button(scene, W / 2, 800, 420, 'TAP TO START', {
      fontSize: 46, onClick: function () {
        if (!ready) return;
        scene.cameras.main.fadeOut(220, 11, 7, 22);
        scene.time.delayedCall(230, function () { scene.scene.start('Menu'); });
      }
    });
    scene.tweens.add({ targets: startBtn, scaleX: 1.04, scaleY: 1.04, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // Desktop: Space also starts.
    scene.input.keyboard.once('keydown-SPACE', function () {
      if (ready && startBtn) startBtn.emit('pointerup');
    });
  }

  // Any first gesture unlocks audio.
  scene.input.once('pointerdown', function () {
    try { if (window.gcAudio) window.gcAudio.init(); } catch (e) {}
  });

  scene.cameras.main.fadeIn(250, 11, 7, 22);
  next();
};
