/* BAZAAR SIEGE — logic.js
 * PURE game logic with NO Phaser dependency. Safe to require() from plain node.
 * All balance math lives here so the test suite can verify it. */
(function (global) {
  var BS = (global.BS = global.BS || {});
  var DATA = BS.DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  if (!DATA) { throw new Error('logic.js: DATA is missing (load data.js first)'); }

  var TURRETS = DATA.TURRETS;
  var EVOLVED = DATA.EVOLVED;
  var ENEMIES = DATA.ENEMIES;
  var BOSSES = DATA.BOSSES;
  var EVENTS = DATA.EVENTS;
  var WAVES = DATA.WAVES;
  var ECONOMY = DATA.ECONOMY;
  var STALL_LEVELS = DATA.STALL_LEVELS;

  // Turrets whose damage is "splash" type (buffed by the monsoon).
  var SPLASH_TURRETS = { rickshaw: true, chai: true, lantern: true };

  /* Merge two turrets. Returns the evolved turret definition when two identical
   * UNEVOLVED turrets merge, otherwise null (no merge possible). */
  function mergeResult(turretA, turretB) {
    if (!turretA || !turretB) { return null; }
    if (turretA.id !== turretB.id) { return null; }
    if (turretA.evolved || turretB.evolved) { return null; }
    var evolved = EVOLVED[turretA.id];
    return evolved ? Object.assign({}, evolved) : null;
  }

  /* Damage multiplier granted by a stall level (1-3). Level 0 = no stall = 1.0. */
  function stallBuff(stallLevel) {
    if (!stallLevel || stallLevel < 1) { return 1.0; }
    var row = STALL_LEVELS[stallLevel];
    return row ? row.mult : 1.0;
  }

  /* Damage multiplier from a festival event for a turret type.
   * blackout: everything x0.45, except Lantern x1.0 and Prism x0.5.
   * monsoon: splash turrets (rickshaw/chai/lantern) x1.5.
   * wedding/none: x1.0 (the wedding helps via the dhol-tower ally instead). */
  function eventModifier(eventKind, turretType) {
    if (!eventKind || eventKind === 'none' || eventKind === 'wedding') { return 1.0; }
    if (eventKind === 'blackout') {
      if (turretType === 'lantern') { return 1.0; }
      if (turretType === 'prism') { return 0.5; }
      return 0.45;
    }
    if (eventKind === 'monsoon') {
      return SPLASH_TURRETS[turretType] ? 1.5 : 1.0;
    }
    return 1.0;
  }

  /* Can a turret type hit an enemy? Airborne enemies need an air-capable turret. */
  function canHit(turretType, enemy) {
    if (!turretType || !enemy) { return false; }
    var turret = TURRETS[turretType];
    if (!turret) { return false; }
    if (enemy.air && !turret.canHitAir) { return false; }
    return true;
  }

  /* Coins awarded for clearing a wave. */
  function waveReward(wave) {
    return ECONOMY.waveBonusBase + wave * ECONOMY.waveBonusPerWave;
  }

  /* Victory stars from lives remaining: 3 for >=15, 2 for >=8, else 1. */
  function starsForLives(lives) {
    if (lives >= 15) { return 3; }
    if (lives >= 8) { return 2; }
    return 1;
  }

  /* Enemy hit points for a given wave (the per-wave HP scale). */
  function enemyHpForWave(baseHp, wave) {
    return Math.round(baseHp * (1 + wave * ECONOMY.hpScalePerWave));
  }

  /* Validate the wave table; throws a descriptive Error on bad data. */
  function validateWaves(waves) {
    if (!Array.isArray(waves)) { throw new Error('WAVES must be an array'); }
    if (waves.length !== 15) { throw new Error('WAVES must have exactly 15 waves, got ' + waves.length); }
    var validKinds = {};
    Object.keys(EVENTS).forEach(function (k) { validKinds[k] = true; });
    waves.forEach(function (w, i) {
      var n = i + 1;
      if (w.wave !== n) { throw new Error('Wave index mismatch at position ' + i + ': wave=' + w.wave); }
      if (!validKinds[w.event]) { throw new Error('Wave ' + n + ': unknown event "' + w.event + '"'); }
      if (!Array.isArray(w.groups) || w.groups.length === 0) {
        throw new Error('Wave ' + n + ': must have at least one spawn group');
      }
      w.groups.forEach(function (g, gi) {
        var isBoss = !!BOSSES[g.type];
        var isEnemy = !!ENEMIES[g.type];
        if (!isBoss && !isEnemy) { throw new Error('Wave ' + n + ' group ' + gi + ': unknown type "' + g.type + '"'); }
        if (!(g.count >= 1)) { throw new Error('Wave ' + n + ' group ' + gi + ': count must be >= 1'); }
        if (!(g.interval > 0)) { throw new Error('Wave ' + n + ' group ' + gi + ': interval must be > 0'); }
        if (!(g.delay >= 0)) { throw new Error('Wave ' + n + ' group ' + gi + ': delay must be >= 0'); }
        if (g.lane !== 'any' && g.lane !== 0 && g.lane !== 1 && g.lane !== 2) {
          throw new Error('Wave ' + n + ' group ' + gi + ': lane must be "any" or 0/1/2');
        }
      });
      if (w.boss && !BOSSES[w.boss]) { throw new Error('Wave ' + n + ': unknown boss "' + w.boss + '"'); }
      var bossGroups = w.groups.filter(function (g) { return !!BOSSES[g.type]; });
      if (w.boss && bossGroups.length === 0) {
        throw new Error('Wave ' + n + ': declares boss "' + w.boss + '" but has no spawn group for it');
      }
    });
    // Boss waves required by the slice spec.
    var w10 = waves[9];
    if (w10.groups.filter(function (g) { return g.type === 'convoy'; }).length === 0) {
      throw new Error('Wave 10 must contain the convoy boss');
    }
    var w15 = waves[14];
    if (w15.groups.filter(function (g) { return g.type === 'swarmlord'; }).length === 0) {
      throw new Error('Wave 15 must contain the swarm-lord boss');
    }
    return true;
  }

  BS.LOGIC = {
    mergeResult: mergeResult,
    stallBuff: stallBuff,
    eventModifier: eventModifier,
    canHit: canHit,
    waveReward: waveReward,
    starsForLives: starsForLives,
    enemyHpForWave: enemyHpForWave,
    validateWaves: validateWaves
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BS.LOGIC;
  }
})(typeof window !== 'undefined' ? window : globalThis);
