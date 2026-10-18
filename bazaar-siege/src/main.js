/* BAZAAR SIEGE — main.js
 * Phaser game config + scene list. Scale.FIT, autoCenter, 720x1280,
 * parent 'bs-root'. No physics engine (custom lane integration). */
(function (global) {
  var BS = (global.BS = global.BS || {});
  var C = BS.CONFIG;

  var config = {
    type: Phaser.AUTO,
    parent: 'bs-root',
    width: C.WIDTH,
    height: C.HEIGHT,
    backgroundColor: '#0b1030',
    scale: {
      mode: Phaser.Scale.FIT
      // No Phaser autoCenter: the #bs-root flexbox centers the canvas exactly.
      // (autoCenter + flex double-centered the canvas and offset all input.)
    },
    physics: undefined,
    scene: [BS.Scenes.Boot, BS.Scenes.Menu, BS.Scenes.HowTo, BS.Scenes.Game],
    disableContextMenu: true
  };

  // Boot only when the DOM is ready.
  function boot() {
    try {
      var game = new Phaser.Game(config);
      BS.game = game; // exposed for automated smoke tests
    } catch (e) {
      var root = document.getElementById('bs-root');
      if (root) {
        root.innerHTML = '<div style="color:#fff6e8;font-family:Georgia,serif;text-align:center;padding:120px 40px;font-size:26px;">' +
          'The night is slow to fall.<br>Please reload to try again.</div>';
      }
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
