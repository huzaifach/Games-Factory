'use strict';
/* WOBBLE WORLD — 09-boot.js : staged loader with honest progress + retry.
   Exposes WobbleTest hooks for the Node QA harness. */

(function () {
  function tick() { return new Promise(function (r) { setTimeout(r, 25); }); }

  function showFatal(game, err) {
    game.bootError = err && err.message ? err.message : String(err);
    try {
      if (typeof document !== 'undefined') {
        UIOverlay.show(
          '<div class="ov-card"><h2>Oh no! The jelly got stuck.</h2>' +
          '<p>Something went wrong while warming up. Check your connection and try again.</p>' +
          '<div class="ov-row"><button class="ov-btn" id="ov-retry">Try Again</button></div></div>'
        );
        document.getElementById('ov-retry').onclick = function () { location.reload(); };
      }
    } catch (e) { /* ignore */ }
  }

  async function boot() {
    let game = null;
    try {
      const canvas = document.getElementById('game');
      if (!canvas) throw new Error('game canvas missing');
      game = new Game(canvas);
      if (typeof window !== 'undefined') window.__wobbleGame = game;
      game.start(); // rAF loop draws the boot screen with live progress

      game.bootProgress = 0.08; await tick();
      // validate the world data before anyone plays
      if (!DIORAMAS || DIORAMAS.length !== 6) throw new Error('world data missing');
      let giggleCount = 0;
      for (const d of DIORAMAS) {
        if (!d.giggles || d.giggles.length !== 3) throw new Error('world "' + d.name + '" needs 3 giggle moments');
        giggleCount += d.giggles.length;
      }
      if (giggleCount !== GIGGLE_TOTAL) throw new Error('giggle moment count mismatch');
      game.bootProgress = 0.4; await tick();
      // warm the physics with a tiny throwaway world (catches engine regressions early)
      const warm = new World(STAGE_W, STAGE_H);
      warm.addBounds();
      const wb = new SoftBlob(400, 600, 40, 10, { color: '#ff8fb3' });
      warm.blobs.push(wb);
      for (let i = 0; i < 30; i++) warm.step(1 / 60);
      if (!isFinite(wb.center.x) || wb.area() < 1) throw new Error('physics warm-up failed');
      game.bootProgress = 0.7; await tick();
      // audio can only unlock on a real user gesture; nothing to preload
      game.bootProgress = 0.9; await tick();
      game.bootProgress = 1;
      await tick();
      game.setScreen('title');
    } catch (err) {
      if (typeof console !== 'undefined') console.error('boot failed:', err);
      if (game) showFatal(game, err);
    }
  }

  // surface unexpected runtime errors on the boot screen instead of a dead page
  if (typeof window !== 'undefined') {
    window.addEventListener('error', function (e) {
      const game = window.__wobbleGame;
      if (game && game.screen === 'boot') showFatal(game, e.error || e.message);
    });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  // ---- test hooks (browser window + Node vm) ----
  try {
    globalThis.WobbleTest = {
      Game, Bus, World, SoftBlob, JellyBlock, Particles, Creature, Mixer,
      DIORAMAS, PERSONALITIES, GOO_COLORS, GIGGLE_TOTAL, Util,
      Trampoline, DominoTower, MagnetOrb, GooBall, Seesaw, GooPool,
      BubblePipe, Bubble, SpringFlower, Pillow, GooJar, JellyAudio
    };
  } catch (e) { /* ignore */ }
})();
