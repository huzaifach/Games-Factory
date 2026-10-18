/* RUCKUS RAMPAGE — core: namespace, constants, utils, save, data tables. */
var RR = (typeof RR !== 'undefined') ? RR : {};

/* ---------------- tuning ---------------- */
RR.CFG = {
  GRAV: 2600,          // px/s^2
  MOVE: 430,           // run speed px/s
  AIR_CTRL: 0.55,      // air control factor
  JUMP: 980,           // jump velocity
  MAX_FALL: 1600,
  GROUND_FRICTION: 7,  // decel rate
  WOBBLE_MAX: 999,
  LIVES: 3,
  ROUND_TIME: 120,     // 2-minute rounds
  PRACTICE_TIME: 60,
  SUDDEN_TIME: 90,
  RESPAWN_TIME: 2.0,
  INVULN_TIME: 2.0,
  ATTACK_CD: 0.45,
  TUMBLE_SPEED: 780,   // launch speed that triggers ragdoll tumble
  MEGA_WOBBLE: 250,    // wobble at KO that triggers slow-mo MEGA KO
  FONT: '"Trebuchet MS","Comic Sans MS","Chalkboard SE","Segoe UI",sans-serif'
};

/* ---------------- utils (no per-frame allocation in hot paths) ---------------- */
RR.U = {
  clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
  lerp: function (a, b, t) { return a + (b - a) * t; },
  rand: function (a, b) { return a + Math.random() * (b - a); },
  randi: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
  choice: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  sign: function (v) { return v < 0 ? -1 : 1; },
  dist2: function (ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; },
  shuffle: function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  },
  fmtTime: function (s) {
    s = Math.max(0, Math.ceil(s));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  },
  easeOutBack: function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
};

/* ---------------- save (localStorage, guarded) ---------------- */
RR.Save = {
  KEY: 'ruckus-rampage-save-v1',
  data: null,
  defaults: function () {
    return {
      wins: 0, matches: 0, totalKOs: 0, stars: 0,
      costumes: ['none'], costume: 'none',
      arenas: ['neon'], arena: 'neon',
      seenHowTo: false, muted: false,
      bestKOs: 0
    };
  },
  load: function () {
    try {
      var raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(this.KEY) : null;
      this.data = raw ? JSON.parse(raw) : this.defaults();
    } catch (e) { this.data = this.defaults(); }
    // merge defaults for forward-compat
    var d = this.defaults();
    for (var k in d) if (!(k in this.data)) this.data[k] = d[k];
    return this.data;
  },
  save: function () {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(this.KEY, JSON.stringify(this.data)); }
    catch (e) { /* storage unavailable: play on, just don't persist */ }
  }
};

/* ---------------- fighters ---------------- */
RR.BOTS = [
  { id: 'rushr',  name: 'RUSHR',  color: 0xff4d4d, style: 'rusher',   speed: 1.15, power: 1.0,
    blurb: 'Charges at everyone. No thoughts, just elbows.' },
  { id: 'chillo', name: 'CHILLO', color: 0xff9f1c, style: 'camper',   speed: 0.9,  power: 1.15,
    blurb: 'Holds the middle. Hits back twice as hard.' },
  { id: 'ziggy',  name: 'ZIGGY',  color: 0xb388ff, style: 'trickster', speed: 1.1,  power: 0.9,
    blurb: 'Dashes, feints, throws things. Rude.' },
  { id: 'thumpa', name: 'THUMPA', color: 0x9c8b7a, style: 'heavy',    speed: 0.7,  power: 1.5,
    blurb: 'Slow. Enormous. Do not stand near the edge.' },
  { id: 'squeak', name: 'SQUEAK', color: 0xb8e62e, style: 'coward',    speed: 1.05, power: 0.8,
    blurb: 'Runs away, throws chappals from far. Coward? Genius.' },
  { id: 'dummy',  name: 'DUMMY',  color: 0x8a8f9d, style: 'dummy',     speed: 0.0,  power: 0.0,
    blurb: 'A practice dummy. Exists to be bonked.' }
];
RR.PLAYER_COLOR = 0x2dd4bf;

/* ---------------- weapons ---------------- */
/* line = the ONE simple line that explains it. arc = knockback direction style. */
RR.WEAPONS = {
  stick:   { id: 'stick',   name: 'DHOL-STICK',     line: 'A drum-stick. Big swing, big launch!', uses: 3, wobble: 120, launch: 720, range: 135, color: 0xffd23f, kind: 'melee' },
  glove:   { id: 'glove',   name: 'SPRING GLOVE',   line: 'PUNCH! from across the ring.',   uses: 2, wobble: 150, launch: 950, range: 265, color: 0xff5d5d, kind: 'melee-long' },
  pillow:  { id: 'pillow',  name: 'PILLOW',         line: 'Soft now, sorry later.',         uses: 4, wobble: 95,  launch: 330, range: 115, color: 0xffffff, kind: 'melee' },
  chappal: { id: 'chappal', name: 'FLYING CHAPPAL', line: 'A flying sandal. Throw it — it always comes back!', uses: -1, wobble: 85, launch: 560, range: 900, color: 0x8a5a2b, kind: 'thrown' },
  magnet:  { id: 'magnet',  name: 'MAGNET HAND',    line: 'Come here! ...SLAM.',            uses: 2, wobble: 70,  launch: 820, range: 250, color: 0xff2e88, kind: 'magnet' }
};
RR.WEAPON_LIST = ['stick', 'glove', 'pillow', 'chappal', 'magnet'];

/* ---------------- ruckus draft upgrades ---------------- */
RR.UPGRADES = [
  { id: 'dbljump', name: 'DOUBLE JUMP',    line: 'Jump again in mid-air.' },
  { id: 'sticky',  name: 'STICKY HANDS',   line: 'Grab weapons from far away.' },
  { id: 'clap',    name: 'SHOCKWAVE CLAP', line: 'Clap: shove everyone around you.' },
  { id: 'belly',   name: 'HEAVY BELLY',    line: 'Harder to launch. Bigger body-slam.' },
  { id: 'spring',  name: 'SPRING LEGS',    line: 'Jump higher, run faster.' },
  { id: 'butter',  name: 'BUTTER FEET',    line: 'Slide far and fast. Wheee!' },
  { id: 'bighead', name: 'BIG HEAD',       line: 'Bigger head, bigger bonks.' },
  { id: 'feather', name: 'FEATHER FALL',   line: 'Float down slowly. Majestic.' },
  { id: 'rubber',  name: 'RUBBER BODY',    line: 'Bounce off the ropes. Boing!' }
];

/* ---------------- costumes & arenas ---------------- */
RR.COSTUMES = [
  { id: 'none',   name: 'PLAIN BLOB',    need: 0,  line: 'Classic. Clean. Wobbly.' },
  { id: 'bandana',name: 'RED BANDANA',   need: 1,  line: 'Win 1 match. Look dangerous.' },
  { id: 'turban', name: 'GOLDEN TURBAN', need: 3,  line: 'Win 3 matches. Royal wobble.' },
  { id: 'pirate', name: 'PIRATE HAT',    need: 5,  line: 'Win 5 matches. Steal the show.' },
  { id: 'crown',  name: 'CHAMPION CROWN',need: 10, line: 'Win 10 matches. Certified menace.' }
];
RR.ARENAS = [
  { id: 'neon',   name: 'NEON AKHARA',   need: 0, line: 'The home wrestling pit. Magenta and cyan glow.' },
  { id: 'roof',   name: 'ROOFTOP RUMBLE',need: 3, line: 'Win 3 matches. Sunset brawls.' },
  { id: 'beach',  name: 'BEACH BRAWL',   need: 6, line: 'Win 6 matches. Sand in everything.' }
];

/* ---------------- kill-feed comedy lines ---------------- */
RR.FEED = {
  melee: ['{a} BONKED {b}!', '{a} introduced {b} to the {w}!', '{a} sent {b} flying!'],
  mega: ['{a} MEGA-KOd {b}!!', '{a} YEETED {b} into orbit!', '{b} has left the chat (via {a}).'],
  hazard: ['{b} hugged a bumper dhol. BOING!', '{b} found the void. BYEEE!', '{b} slipped off. Classic {b}.'],
  self: ['{b} did it to themselves. Incredible.']
};
