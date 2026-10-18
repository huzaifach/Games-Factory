'use strict';
/* SKYLINE STACK — pure game logic (no DOM, no canvas).
 * Shared between the browser build and the node test suite.
 * Works as a classic script (sets window.SkylineLogic) and as a node module.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SkylineLogic = api;
})(typeof self !== 'undefined' ? self : this, function () {

  // ---- tuning constants (single source of truth) ----
  var PERFECT_TOL = 7;    // logical px: |dx| <= this  -> PERFECT
  var MAGNET_TOL  = 26;   // logical px: |dx| <= this  -> SAVED! magnet snap
  var MAX_W = 240;        // widest a floor can grow back to
  var MIN_W = 26;         // below this overlap the block misses entirely
  var GROW  = 10;         // width regained on a perfect drop
  var BASE_W = 210;       // starting floor width
  var WIND_START_FLOOR = 15;

  var STAR_STEPS = [25, 50, 100, 150, 200]; // floors -> stars (1..5)

  var THEMES = [
    { id: 'neon',    name: 'Neon Karachi',  unlockAt: 0,
      tagline: 'A city of lights that never sleeps' },
    { id: 'desert',  name: 'Desert Oasis',  unlockAt: 30,
      tagline: 'Golden dunes under a hazy sun' },
    { id: 'monsoon', name: 'Monsoon Mumbai', unlockAt: 60,
      tagline: 'Rain-washed towers in monsoon season' }
  ];

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /**
   * Resolve a dropped block against the current top floor.
   * blockX/blockW: dropped block center + width. prevX/prevW: top floor center + width.
   * Returns { type, dx, newW, newX, debris } where debris is null or
   * { x, w } describing the sheared-off overhang (center + width).
   */
  function resolveDrop(blockX, blockW, prevX, prevW) {
    var dx = blockX - prevX;
    var adx = Math.abs(dx);

    if (adx <= PERFECT_TOL) {
      return { type: 'perfect', dx: dx, newW: Math.min(prevW + GROW, MAX_W), newX: prevX, debris: null };
    }
    if (adx <= MAGNET_TOL) {
      return { type: 'saved', dx: dx, newW: prevW, newX: prevX, debris: null };
    }
    var overlap = prevW - adx;
    if (overlap < MIN_W) {
      return { type: 'missed', dx: dx, newW: 0, newX: blockX, debris: null };
    }
    // intersection of the two spans = the floor that remains
    var bl = blockX - blockW / 2, br = blockX + blockW / 2;
    var pl = prevX - prevW / 2, pr = prevX + prevW / 2;
    var l = Math.max(bl, pl), r = Math.min(br, pr);
    // the overhang that shears off (single contiguous piece, since blockW <= prevW+slack)
    var debris = null;
    if (dx > 0) debris = { x: (pr + br) / 2, w: br - pr };   // overhang on the right
    else debris = { x: (pl + bl) / 2, w: pl - bl };          // overhang on the left
    if (debris.w < 0.5) debris = null;
    return { type: 'shear', dx: dx, newW: r - l, newX: (l + r) / 2, debris: debris };
  }

  /** Crane swing speed (rad/s of carriage phase) as a function of tower height. */
  function craneSpeed(height) {
    return Math.min(3.2, 1.5 + height * 0.011);
  }

  /** Carriage swing amplitude (logical px) as a function of tower height. */
  function carriageAmp(height) {
    return Math.min(170, 95 + height * 1.1);
  }

  /** Wind strength 0..1 available from a given height (0 below WIND_START_FLOOR). */
  function windStrengthAt(height) {
    if (height < WIND_START_FLOOR) return 0;
    return clamp(0.35 + (height - WIND_START_FLOOR) * 0.012, 0, 1);
  }

  /** Stars earned for a height. */
  function starFor(height) {
    var s = 0;
    for (var i = 0; i < STAR_STEPS.length; i++) if (height >= STAR_STEPS[i]) s = i + 1;
    return s;
  }

  /** Next star threshold above height, or null when maxed. */
  function nextStarAt(height) {
    for (var i = 0; i < STAR_STEPS.length; i++) if (STAR_STEPS[i] > height) return STAR_STEPS[i];
    return null;
  }

  /** Themes unlocked given the player's best height. */
  function unlockedThemes(best) {
    return THEMES.filter(function (t) { return best >= t.unlockAt; }).map(function (t) { return t.id; });
  }

  function themeById(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
    return THEMES[0];
  }

  /** Score for a run: height dominates; combo adds flavor. */
  function scoreFor(height, bestCombo) {
    return height * 100 + bestCombo * 25;
  }

  return {
    PERFECT_TOL: PERFECT_TOL,
    MAGNET_TOL: MAGNET_TOL,
    MAX_W: MAX_W,
    MIN_W: MIN_W,
    GROW: GROW,
    BASE_W: BASE_W,
    WIND_START_FLOOR: WIND_START_FLOOR,
    STAR_STEPS: STAR_STEPS,
    THEMES: THEMES,
    clamp: clamp,
    resolveDrop: resolveDrop,
    craneSpeed: craneSpeed,
    carriageAmp: carriageAmp,
    windStrengthAt: windStrengthAt,
    starFor: starFor,
    nextStarAt: nextStarAt,
    unlockedThemes: unlockedThemes,
    themeById: themeById,
    scoreFor: scoreFor
  };
});
