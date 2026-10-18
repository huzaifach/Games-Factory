/* BAZAAR SIEGE — data.js
 * All game data: turrets, enemies, bosses, waves, events, stalls, economy.
 * No Phaser dependency. Balance defaults come from the slice spec. */
(function (global) {
  var BS = (global.BS = global.BS || {});
  var C = BS.CONFIG || (typeof require !== 'undefined' ? require('./config.js') : null);
  if (!C) { throw new Error('data.js: CONFIG is missing (load config.js first)'); }

  /* ---------------- TURRETS ----------------
   * rate: seconds between shots. dmg: per hit (beam: per second).
   * splash: radius of splash damage (0 = single target).
   * slow: {amount, duration} for Chai. pulseRadius for Dhol.
   * canHitAir: which turrets can target the airborne kite-flyer. */
  var TURRETS = {
    rickshaw: {
      id: 'rickshaw', name: 'Rickshaw Rocket', cost: 60,
      dmg: 14, rate: 0.8, range: 260, splash: 70, canHitAir: false,
      proj: 'rocket', desc: 'Lobs rockets that burst over a crowd.',
      gloss: 'Rickshaw Rocket — lobs splash rockets'
    },
    kite: {
      id: 'kite', name: 'Kite-Cutter', cost: 50,
      dmg: 8, rate: 0.4, range: 230, splash: 0, canHitAir: true,
      proj: 'blade', desc: 'Spinning blades. Fast, reaches the sky.',
      gloss: 'Kite-Cutter — fast single-target blades'
    },
    chai: {
      id: 'chai', name: 'Chai-Splash', cost: 70,
      dmg: 6, rate: 0.7, range: 200, splash: 60, canHitAir: false,
      proj: 'chai', slow: { amount: 0.4, duration: 2.0 },
      desc: 'Steaming chai splashes and slows the horde.',
      gloss: 'Chai-Splash — slowing splash field'
    },
    lantern: {
      id: 'lantern', name: 'Lantern Mortar', cost: 90,
      dmg: 26, rate: 1.6, range: 380, splash: 90, canHitAir: true,
      proj: 'lantern', desc: 'Long-range lantern bombs. Lights the dark.',
      gloss: 'Lantern Mortar — long-range arcing bombs'
    },
    dhol: {
      id: 'dhol', name: 'Dhol-Drum', cost: 80,
      dmg: 10, rate: 0.6, range: 150, splash: 0, canHitAir: false,
      pulse: true, desc: 'Shockwave beats pound everything nearby.',
      gloss: 'Dhol-Drum — radial shockwave pulses'
    },
    prism: {
      id: 'prism', name: 'Peacock Prism', cost: 110,
      dmg: 20, rate: 0.5, range: 280, splash: 0, canHitAir: true,
      beam: true, desc: 'A searing beam of color. Reaches the sky.',
      gloss: 'Peacock Prism — piercing light beam'
    }
  };

  // Evolved forms: ~2.6x DPS, gold trim, star badge. Evolved turrets cannot merge again.
  var EVOLVED_MULT = 2.6;
  var EVOLVED = {};
  Object.keys(TURRETS).forEach(function (id) {
    var t = TURRETS[id];
    EVOLVED[id] = {
      id: id, name: 'Legendary ' + t.name, cost: 0,
      dmg: Math.round(t.dmg * EVOLVED_MULT), rate: t.rate, range: t.range + 20,
      splash: t.splash ? t.splash + 15 : 0, canHitAir: t.canHitAir,
      proj: t.proj, slow: t.slow, pulse: t.pulse, beam: t.beam,
      evolved: true, desc: t.desc + ' Evolved to full glory.', gloss: t.gloss + ' (evolved)'
    };
  });

  /* ---------------- ENEMIES ----------------
   * hp: body hit points. shield: extra shield pool (depleted first).
   * speed: pixels per second (right to left). coins: kill reward.
   * air: airborne (only kite / lantern / prism can hit).
   * Every enemy carries a one-line hint for the Scout panel. */
  var ENEMIES = {
    runner: {
      id: 'runner', name: 'Runner Imp', displayName: 'Runner Imp',
      hp: 30, shield: 0, speed: 95, coins: 6,
      air: false, hint: 'Fast but weak; it sprints for your gate.'
    },
    brute: {
      id: 'brute', name: 'Brute Imp', displayName: 'Brute Imp',
      hp: 220, shield: 0, speed: 42, coins: 14,
      air: false, hint: 'Slow and very tough.'
    },
    shielded: {
      id: 'shielded', name: 'Shield Imp', displayName: 'Shield Imp',
      hp: 90, shield: 60, speed: 55, coins: 12,
      air: false, hint: 'Carries a shield; break the shield first.'
    },
    healer: {
      id: 'healer', name: 'Healer Imp', displayName: 'Healer Imp',
      hp: 110, shield: 0, speed: 50, coins: 16,
      air: false, heal: { amount: 15, every: 2.0, radius: 120 },
      hint: 'Heals nearby imps; stop it early.'
    },
    splitter: {
      id: 'splitter', name: 'Splitter Imp', displayName: 'Splitter Imp',
      hp: 80, shield: 0, speed: 60, coins: 10,
      air: false, splits: { type: 'implig', count: 2 },
      hint: 'Splits into two small imps when beaten.'
    },
    kiteflyer: {
      id: 'kiteflyer', name: 'Kite Imp', displayName: 'Kite Imp',
      hp: 70, shield: 0, speed: 70, coins: 12,
      air: true, hint: 'Flies above the lane; only blades, beams and mortars can hit it.'
    },
    digger: {
      id: 'digger', name: 'Digger Imp', displayName: 'Digger Imp',
      hp: 100, shield: 0, speed: 55, coins: 12,
      air: false, digs: true,
      hint: 'Dives underground; watch the dust trail.'
    },
    thief: {
      id: 'thief', name: 'Thief Imp', displayName: 'Thief Imp',
      hp: 60, shield: 0, speed: 120, coins: 25,
      air: false, steals: 20,
      hint: 'Catch it for bonus coins; if it escapes, it steals coins.'
    },
    drummer: {
      id: 'drummer', name: 'Drummer Imp', displayName: 'Drummer Imp',
      hp: 90, shield: 0, speed: 55, coins: 16,
      air: false, aura: { mult: 1.3, radius: 140 },
      hint: 'Speeds up nearby imps; stop it first.'
    },
    ember: {
      id: 'ember', name: 'Ember Imp', displayName: 'Ember Imp',
      hp: 70, shield: 0, speed: 65, coins: 12,
      air: false, deathBlast: { dmg: 40, radius: 90 },
      hint: 'Explodes when beaten; let it blow up its friends.'
    },
    // Spawned by splitter / swarm-lord; not placed directly in waves.
    implig: {
      id: 'implig', name: 'Imp-Ling', displayName: 'Imp-Ling',
      hp: 25, shield: 0, speed: 100, coins: 2,
      air: false, hint: 'Tiny, quick, and everywhere.'
    },
    swarmimp: {
      id: 'swarmimp', name: 'Swarm Imp', displayName: 'Swarm Imp',
      hp: 40, shield: 0, speed: 90, coins: 2,
      air: false, hint: 'Shed by the Swarm-Lord — splash clears the swarm.'
    }
  };

  /* ---------------- BOSSES ---------------- */
  var BOSSES = {
    convoy: {
      id: 'convoy', name: 'THE CONVOY', shield: 800, hp: 1400, speed: 30,
      coins: 300, hint: 'Break its shield first, then the rig.',
      telegraph: 'Break its shield first!'
    },
    swarmlord: {
      id: 'swarmlord', name: 'THE SWARM-LORD', shield: 0, hp: 2600, speed: 45,
      coins: 400, burst: { every: 7.0, count: 6, type: 'swarmimp' },
      hint: 'It bursts apart — splash hurts the swarm.',
      telegraph: 'It bursts apart — splash hurts the swarm!'
    }
  };

  /* ---------------- EVENTS ---------------- */
  var EVENTS = {
    none: { id: 'none', name: 'Clear Night', desc: 'A calm night over the bazaar.' },
    blackout: {
      id: 'blackout', name: 'Blackout', desc: 'Darkness falls. Lantern turrets fight at full power.',
      detail: 'Darkness falls — lantern turrets fight at full power.',
      banner: 'BLACKOUT — darkness falls; lantern turrets fight at full power'
    },
    monsoon: {
      id: 'monsoon', name: 'Monsoon', desc: 'Rain falls. Splash turrets hit harder.',
      detail: 'Rain falls — splash turrets (rockets, chai, lantern bombs) hit 50% harder.',
      banner: 'MONSOON — rain falls; splash turrets hit harder'
    },
    wedding: {
      id: 'wedding', name: 'Wedding Procession',
      desc: 'A golden drum-tower marches across and fights beside you.',
      detail: 'A golden drum-tower marches the parade path, pounding the horde.',
      banner: 'WEDDING PROCESSION — a golden drum-tower marches across and fights beside you for a while'
    }
  };

  /* ---------------- STALLS ----------------
   * Each stall buffs the 3 slots in the row directly above it (slots 6,7,8).
   * When several stalls buff the same row, the highest level wins. */
  var STALLS = [
    { id: 'spice', name: 'Spice Stall', x: C.STALLS[0].x, y: C.STALLS[0].y },
    { id: 'sweet', name: 'Sweet Stall', x: C.STALLS[1].x, y: C.STALLS[1].y },
    { id: 'fabric', name: 'Fabric Stall', x: C.STALLS[2].x, y: C.STALLS[2].y }
  ];
  var STALL_LEVELS = [
    null,
    { mult: 1.25, cost: 100 },  // level 1: +25% damage
    { mult: 1.60, cost: 220 },  // level 2: +60% damage
    { mult: 2.20, cost: 380 }   // level 3: +120% damage
  ];
  var STALL_MAX_LEVEL = 3;

  /* ---------------- WAVES ----------------
   * 15 hand-designed waves. groups: {type, count, interval, delay, lane}
   * lane: 0/1/2 or 'any'. type may be an enemy id or a boss id. */
  var WAVES = [
    { wave: 1, event: 'none', groups: [
      { type: 'runner', count: 5, interval: 2.0, delay: 1.0, lane: 'any' }
    ] },
    { wave: 2, event: 'none', groups: [
      { type: 'runner', count: 10, interval: 1.0, delay: 1.0, lane: 'any' },
      { type: 'digger', count: 4, interval: 2.2, delay: 5.0, lane: 'any' }
    ] },
    { wave: 3, event: 'none', groups: [
      { type: 'runner', count: 6, interval: 1.0, delay: 1.0, lane: 'any' },
      { type: 'shielded', count: 6, interval: 1.8, delay: 4.0, lane: 'any' }
    ] },
    { wave: 4, event: 'monsoon', groups: [
      { type: 'runner', count: 8, interval: 0.9, delay: 1.0, lane: 'any' },
      { type: 'splitter', count: 6, interval: 2.0, delay: 4.0, lane: 'any' }
    ] },
    { wave: 5, event: 'none', groups: [
      { type: 'kiteflyer', count: 6, interval: 1.6, delay: 1.0, lane: 'any' },
      { type: 'runner', count: 8, interval: 0.9, delay: 5.0, lane: 'any' }
    ] },
    { wave: 6, event: 'none', groups: [
      { type: 'digger', count: 10, interval: 1.2, delay: 1.0, lane: 'any' },
      { type: 'brute', count: 6, interval: 2.4, delay: 4.0, lane: 'any' }
    ] },
    { wave: 7, event: 'blackout', groups: [
      { type: 'shielded', count: 12, interval: 1.4, delay: 1.0, lane: 'any' },
      { type: 'healer', count: 6, interval: 2.6, delay: 6.0, lane: 'any' }
    ] },
    { wave: 8, event: 'none', groups: [
      { type: 'thief', count: 8, interval: 1.4, delay: 1.0, lane: 'any' },
      { type: 'runner', count: 8, interval: 0.8, delay: 4.0, lane: 'any' }
    ] },
    { wave: 9, event: 'none', groups: [
      { type: 'drummer', count: 10, interval: 1.6, delay: 1.0, lane: 'any' },
      { type: 'brute', count: 8, interval: 2.2, delay: 5.0, lane: 'any' }
    ] },
    { wave: 10, event: 'none', boss: 'convoy', groups: [
      { type: 'convoy', count: 1, interval: 1.0, delay: 3.0, lane: 1 },
      { type: 'shielded', count: 6, interval: 3.0, delay: 6.0, lane: 'any' }
    ] },
    { wave: 11, event: 'wedding', groups: [
      { type: 'ember', count: 12, interval: 1.2, delay: 1.0, lane: 'any' },
      { type: 'splitter', count: 8, interval: 2.0, delay: 6.0, lane: 'any' }
    ] },
    { wave: 12, event: 'none', groups: [
      { type: 'runner', count: 14, interval: 0.6, delay: 1.0, lane: 'any' },
      { type: 'kiteflyer', count: 8, interval: 1.4, delay: 5.0, lane: 'any' },
      { type: 'healer', count: 4, interval: 3.0, delay: 8.0, lane: 'any' }
    ] },
    { wave: 13, event: 'blackout', groups: [
      { type: 'brute', count: 10, interval: 1.8, delay: 1.0, lane: 'any' },
      { type: 'drummer', count: 8, interval: 2.0, delay: 5.0, lane: 'any' }
    ] },
    { wave: 14, event: 'monsoon', groups: [
      { type: 'thief', count: 10, interval: 1.0, delay: 1.0, lane: 'any' },
      { type: 'digger', count: 10, interval: 1.2, delay: 5.0, lane: 'any' },
      { type: 'splitter', count: 6, interval: 2.0, delay: 9.0, lane: 'any' }
    ] },
    { wave: 15, event: 'none', boss: 'swarmlord', groups: [
      { type: 'swarmlord', count: 1, interval: 1.0, delay: 3.0, lane: 1 },
      { type: 'ember', count: 8, interval: 2.6, delay: 8.0, lane: 'any' }
    ] }
  ];

  /* ---------------- ECONOMY ---------------- */
  var ECONOMY = {
    startCoins: 150,
    startLives: 20,
    thiefSteal: 20,
    waveBonusBase: 25,
    waveBonusPerWave: 5,
    sellRefund: 0.7,
    hpScalePerWave: 0.10
  };

  BS.DATA = {
    TURRETS: TURRETS,
    EVOLVED: EVOLVED,
    EVOLVED_MULT: EVOLVED_MULT,
    ENEMIES: ENEMIES,
    BOSSES: BOSSES,
    EVENTS: EVENTS,
    STALLS: STALLS,
    STALL_LEVELS: STALL_LEVELS,
    STALL_MAX_LEVEL: STALL_MAX_LEVEL,
    WAVES: WAVES,
    ECONOMY: ECONOMY,
    // Slots in the row directly above the stalls (slots 6,7,8) — the buff zone.
    STALL_BUFF_SLOTS: [6, 7, 8]
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BS.DATA;
  }
})(typeof window !== 'undefined' ? window : globalThis);
