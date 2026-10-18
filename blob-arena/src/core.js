/* ============================================================
   BLOB ARENA — core.js
   Utilities, seeded RNG, and ALL tuning config in one place.
   No DOM access here: safe to run in a headless node harness.
   ============================================================ */
'use strict';

var TAU = Math.PI * 2;

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function damp(a, b, lambda, dt) { return lerp(a, b, 1 - Math.exp(-lambda * dt)); }
/* frame-rate independent exponential approach */
function easeOutBack(t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

/* Deterministic PRNG so sim runs are reproducible in tests. */
function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) { return arr[(rng() * arr.length) | 0]; }

/* ------------------------------- CONFIG ------------------------------- */
var CFG = {
  world: 2600,              // arena is world x world units
  roundTime: 180,           // 3-minute rounds
  stormAt: 150,             // storm starts with 30s left (roundTime - 30)
  stormMinR: 330,           // final safe radius

  pelletCount: 240,
  pelletMass: 1.4,
  pelletRespawn: [3.5, 7],  // seconds, random range

  spawnMass: 26,
  maxMass: 5200,
  eatRatio: 1.12,           // eater.r must exceed prey.r * eatRatio
  absorbTime: 0.22,         // ripple-merge animation seconds

  comboWindow: 2.4,         // seconds between pellet eats to keep combo
  comboMilestone: 8,        // combo count that triggers fanfare

  dashTime: 0.5,            // dash duration seconds
  dashMult: 3.1,            // dash speed multiplier
  dashCooldown: 0,          // one dash per life (no recharge within a life)

  botRespawn: 2.6,          // seconds before an eliminated bot respawns
  botThink: 0.16,           // AI re-think interval seconds (staggered)

  /* radius from mass: r = massToR(mass) */
  massK: 6.0,
  /* speed from radius */
  speedBase: 165,
  speedRefR: 30,
  speedPow: 0.38,
  speedMin: 62,
  speedMax: 175,

  milestones: [            // [radius, label]
    [46,  'GROWING!'],
    [72,  'BIG BLOB!'],
    [105, 'TITAN!'],
    [150, 'COLOSSUS!'],
    [205, 'LEVIATHAN!']
  ],

  /* performance budgets (see BUILD-LEDGER.md) */
  budget: {
    blobs: 12, pellets: 240, particles: 350,
    plankton: 70, ripples: 24, drawOps: 700, simMs: 2
  }
};

function massToR(mass) { return CFG.massK * Math.sqrt(Math.max(mass, 0.001)); }
function speedForR(r) {
  return clamp(CFG.speedBase * Math.pow(CFG.speedRefR / r, CFG.speedPow),
               CFG.speedMin, CFG.speedMax);
}

/* --------------------------- BOT PERSONALITIES --------------------------- */
/* weights: pellet, hunt (chase smaller), flee, roam, corner, stalk, bait,
   ambush, chaos. 0..1.5 scale. */
var PERSONALITIES = [
  { id:'bully',   name:'Brutus',  title:'the Bully',     color:'#ff4d5e', dark:'#8e1626',
    w:{pellet:.35,hunt:1.2,flee:.55,roam:.1,corner:0,stalk:.2,bait:0,ambush:0,chaos:.05},
    dash:.35, aggression:1.15, caution:.5,  speedMul:1.0,
    quips:['Brutus smells fear.','Brutus is on the hunt!'] },
  { id:'camper',  name:'Shelly',  title:'the Camper',    color:'#3fd0c9', dark:'#14655f',
    w:{pellet:.6,hunt:.25,flee:.9,roam:.05,corner:1.2,stalk:0,bait:0,ambush:.3,chaos:0},
    dash:.1, aggression:.4, caution:1.2, speedMul:.95,
    quips:['Shelly found a cozy corner.','Shelly is hiding again…'] },
  { id:'hunter',  name:'Viper',   title:'the Hunter',    color:'#9b5cff', dark:'#4a1e9e',
    w:{pellet:.3,hunt:.7,flee:.5,roam:.1,corner:0,stalk:1.3,bait:.2,ambush:0,chaos:.05},
    dash:.5, aggression:1.0, caution:.6, speedMul:1.02,
    quips:['Viper has its eyes on the leader…','Viper is stalking someone.'] },
  { id:'coward',  name:'Scaredy', title:'the Coward',    color:'#ffe066', dark:'#a3861a',
    w:{pellet:.5,hunt:.05,flee:1.5,roam:.3,corner:.4,stalk:0,bait:0,ambush:0,chaos:.25},
    dash:.15, aggression:.15, caution:1.6, speedMul:1.08,
    quips:['Scaredy saw something and panicked!','Scaredy is hiding again…'] },
  { id:'greedy',  name:'Gordo',   title:'the Greedy',    color:'#ff9f2e', dark:'#9e5207',
    w:{pellet:1.4,hunt:.3,flee:.35,roam:.15,corner:0,stalk:0,bait:0,ambush:0,chaos:.05},
    dash:.05, aggression:.5, caution:.35, speedMul:1.0,
    quips:['Gordo found snacks. Again.','Nothing stops Gordo’s lunch.'] },
  { id:'trickster',name:'Jinx',   title:'the Trickster', color:'#ff4fd8', dark:'#931a7c',
    w:{pellet:.45,hunt:.75,flee:.7,roam:.15,corner:0,stalk:.3,bait:1.3,ambush:0,chaos:.2},
    dash:.55, aggression:.9, caution:.8, speedMul:1.04,
    quips:['Jinx is up to something…','Was that a feint? Jinx giggles.'] },
  { id:'guardian',name:'Boulder', title:'the Guardian',  color:'#5e7fa3', dark:'#2c4258',
    w:{pellet:.55,hunt:.45,flee:.4,roam:.5,corner:0,stalk:0,bait:0,ambush:0,chaos:0},
    dash:.1, aggression:.6, caution:.8, speedMul:.92, centerBias:1.0,
    quips:['Boulder holds the center.','Boulder barely moves. Boulder barely cares.'] },
  { id:'sprinter',name:'Zippy',   title:'the Sprinter',  color:'#7dff5e', dark:'#2c8e1a',
    w:{pellet:1.0,hunt:.35,flee:.8,roam:.4,corner:0,stalk:0,bait:.1,ambush:0,chaos:.15},
    dash:.4, aggression:.55, caution:.9, speedMul:1.12,
    quips:['Zippy zoomed past!','Blink and you’ll miss Zippy.'] },
  { id:'ambusher',name:'Lurker',  title:'the Ambusher',  color:'#4a3fa3', dark:'#221c5e',
    w:{pellet:.4,hunt:.6,flee:.6,roam:.05,corner:0,stalk:.2,bait:.3,ambush:1.4,chaos:0},
    dash:.6, aggression:1.0, caution:.7, speedMul:1.0,
    quips:['Lurker is waiting…','Something moved in the dark. Probably Lurker.'] },
  { id:'jester',  name:'Wobbles', title:'the Jester',    color:'#4fe3ff', dark:'#14708a',
    w:{pellet:.55,hunt:.4,flee:.6,roam:.5,corner:0,stalk:.1,bait:.2,ambush:0,chaos:1.2},
    dash:.35, aggression:.6, caution:.6, speedMul:1.05,
    quips:['Wobbles did a flip! Nobody knows why.','Wobbles is vibing.'] },
  { id:'nomad',   name:'Munch',   title:'the Nomad',     color:'#ff7a5e', dark:'#93331d',
    w:{pellet:.85,hunt:.55,flee:.65,roam:.6,corner:0,stalk:.15,bait:0,ambush:.15,chaos:.1},
    dash:.25, aggression:.7, caution:.75, speedMul:1.0,
    quips:['Munch wanders in, munches, wanders out.','Munch found an opportunity!'] }
];

/* Hand-designed pellet clusters: [x, y, radius, densityWeight] in world units.
   Center is richest; corners have cozy camper-friendly stashes. */
var PELLET_CLUSTERS = [
  [1300, 1300, 420, 3.0],   // heart of the arena
  [520,  520,  260, 1.6],   // NW corner stash
  [2080, 520,  260, 1.6],   // NE corner stash
  [520,  2080, 260, 1.6],   // SW corner stash
  [2080, 2080, 260, 1.6],   // SE corner stash
  [1300, 480,  200, 1.2],   // north pocket
  [1300, 2120, 200, 1.2],   // south pocket
  [480,  1300, 200, 1.2],   // west pocket
  [2120, 1300, 200, 1.2]    // east pocket
];

var KILL_VERBS = ['gobbled', 'devoured', 'absorbed', 'slurped up', 'swallowed'];
var STORM_DEATHS = ['dissolved in the storm', 'was claimed by the storm', 'faded into the storm'];
