/* GULLY CHAMPION — game entry. */
(function () {
  'use strict';
  window.gcAudio = new GCAudio();

  // FULL-BLEED: grow the logical height to match the device aspect BEFORE the
  // game is created, so Phaser.Scale.FIT fills the screen exactly on tall
  // phones (no black bars). Design coordinates stay in 720x1280 space; each
  // scene centers that space with cameras.main.setScroll(0, -(H-DH)/2).
  // Never shrink below the design height (odd wide screens keep tiny side bars).
  var aspect = window.innerWidth / Math.max(1, window.innerHeight);
  var LH = Math.round(GCConfig.W / aspect);
  if (LH < GCConfig.DH) LH = GCConfig.DH;
  if (LH > 2400) LH = 2400; // sanity cap for absurd aspects
  GCConfig.H = LH;

  var config = {
    type: Phaser.AUTO,
    parent: 'gc-root',
    width: GCConfig.W,
    height: GCConfig.H,
    backgroundColor: '#0b0716',
    scale: { mode: Phaser.Scale.FIT }, // no autoCenter: #gc-root flexbox already centers (double centering shifts input coords)
    render: { antialias: true, roundPixels: false },
    fps: { target: 60, forceSetTimeOut: false },
    disableContextMenu: true,
    scene: [BootScene, MenuScene, MatchScene, ResultScene]
  };
  window.gcGame = new Phaser.Game(config);

  // Unlock audio on the very first gesture (autoplay policy).
  function unlock() { try { window.gcAudio.init(); } catch (e) {} }
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('touchend', unlock, { passive: true });
  window.addEventListener('keydown', function (e) { if (e.code === 'Space') unlock(); });
})();
