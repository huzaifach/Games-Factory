/* DUSKLINE src/data.js — all game data. No logic. */
(function () {
'use strict';

var D = window.DUSK = window.DUSK || {};

/* ---------- color families (6 fusion colors) ---------- */
D.COLORS = {
  gold:  0xffc93c, violet: 0xb06cff, cyan:   0x4ce0ff,
  ember: 0xff6a4c, jade:   0x5cff9d, rose:   0xff5ca8
};
D.COLOR_NAMES = { gold:'GOLD', violet:'VIOLET', cyan:'CYAN', ember:'EMBER', jade:'JADE', rose:'ROSE' };
D.COLOR_CSS = { gold:'#ffc93c', violet:'#b06cff', cyan:'#4ce0ff', ember:'#ff6a4c', jade:'#5cff9d', rose:'#ff5ca8' };

/* ---------- heroes ---------- */
D.HEROES = [
  {
    id:'seher', name:'SEHER', title:'Blade of Dawn', color:'gold', unlocked:true,
    desc:'Orbiting light-blades shred everything that comes close.',
    hp:100, speed:235, magnet:90,
    signature:'bladeOrbit',
    silhouette:'tri', // triangle blade-dancer
    stats:'Balanced fighter. Blades orbit faster as you move.'
  },
  {
    id:'raat', name:'RAAT', title:'Pulse of Night', color:'violet', unlocked:false,
    unlockBy:'reach4', unlockText:'Reach 4:00 in a run',
    desc:'Arcane novas pulse outward, stunning the swarm.',
    hp:85, speed:225, magnet:100,
    signature:'pulseNova',
    silhouette:'orb',
    stats:'Fragile mage. Novas stun and melt packed enemies.'
  },
  {
    id:'toofan', name:'TOOFAN', title:'Storm Caller', color:'cyan', unlocked:false,
    unlockBy:'kill500', unlockText:'Defeat 500 enemies in one run',
    desc:'Chain lightning leaps between enemies, never missing.',
    hp:90, speed:245, magnet:90,
    signature:'chainBolt',
    silhouette:'dart',
    stats:'Fast striker. Lightning chains across the whole pack.'
  }
];

/* ---------- auras/weapons (12, 2 per color) ----------
   kind: 'orbit' | 'nova' | 'bolt' | 'proj' | 'homing' | 'ring' | 'aoe' | 'meteor' | 'beam' | 'gust' | 'thorns' | 'spray'
   numbers: dmg (per hit at rank 1), cd (seconds), count, extra per rank scale */
D.AURAS = [
  /* GOLD */
  { id:'bladeOrbit', name:'Dawn Blades', color:'gold', kind:'orbit', icon:'blades',
    desc:'Light-blades orbit you, slicing all they touch.',
    dmg:14, cd:0, count:2, radius:95, rot:2.6, ranks:5,
    perRank:{dmg:6, count:1, radius:12} },
  { id:'sunLance', name:'Sun Lance', color:'gold', kind:'proj', icon:'lance',
    desc:'Piercing lances of sunlight fly at the nearest foe.',
    dmg:22, cd:1.15, count:1, pierce:3, speed:520, ranks:5,
    perRank:{dmg:9, count:1, pierce:1} },
  /* VIOLET */
  { id:'pulseNova', name:'Night Pulse', color:'violet', kind:'nova', icon:'nova',
    desc:'A stunning nova erupts around you, again and again.',
    dmg:18, cd:2.6, count:1, radius:170, stun:0.7, ranks:5,
    perRank:{dmg:8, radius:26, stun:0.15} },
  { id:'voidOrb', name:'Void Orb', color:'violet', kind:'homing', icon:'orb',
    desc:'A hungry orb seeks enemies and bursts among them.',
    dmg:16, cd:1.7, count:1, speed:380, aoe:80, ranks:5,
    perRank:{dmg:7, count:1, aoe:14} },
  /* CYAN */
  { id:'chainBolt', name:'Storm Chain', color:'cyan', kind:'bolt', icon:'bolt',
    desc:'Lightning leaps between nearby enemies.',
    dmg:15, cd:1.35, count:3, jumps:3, range:230, ranks:5,
    perRank:{dmg:6, jumps:1, count:1} },
  { id:'frostVeil', name:'Frost Veil', color:'cyan', kind:'ring', icon:'veil',
    desc:'A chilling ring slows and chips all inside it.',
    dmg:6, cd:0.5, count:1, radius:150, slow:0.45, ranks:5,
    perRank:{dmg:3, radius:18, slow:0.05} },
  /* EMBER */
  { id:'emberWisp', name:'Ember Wisps', color:'ember', kind:'homing', icon:'wisp',
    desc:'Burning wisps chase enemies and ignite them.',
    dmg:11, cd:1.0, count:2, speed:430, burn:3, ranks:5,
    perRank:{dmg:5, count:1, burn:1.2} },
  { id:'starfall', name:'Starfall', color:'ember', kind:'meteor', icon:'meteor',
    desc:'Meteors crash down on random enemies.',
    dmg:34, cd:2.2, count:2, aoe:95, ranks:5,
    perRank:{dmg:13, count:1, aoe:12} },
  /* JADE */
  { id:'galeGust', name:'Gale Gust', color:'jade', kind:'gust', icon:'gust',
    desc:'A sweeping wind hurls enemies back.',
    dmg:9, cd:2.0, count:1, arc:1.5, knock:420, ranks:5,
    perRank:{dmg:4, knock:70, arc:0.12} },
  { id:'thornBloom', name:'Thorn Bloom', color:'jade', kind:'thorns', icon:'thorn',
    desc:'Thorns erupt under the closest enemies.',
    dmg:20, cd:1.5, count:3, aoe:70, ranks:5,
    perRank:{dmg:9, count:1, aoe:10} },
  /* ROSE */
  { id:'moonbeam', name:'Moonbeam', color:'rose', kind:'beam', icon:'beam',
    desc:'A sweeping beam of moonlight burns a line through the swarm.',
    dmg:26, cd:1.9, count:1, length:420, width:44, ranks:5,
    perRank:{dmg:11, width:8, length:40} },
  { id:'mirage', name:'Mirage Shards', color:'rose', kind:'spray', icon:'shard',
    desc:'A fan of crystal shards sprays toward your aim.',
    dmg:10, cd:0.85, count:4, spread:0.9, speed:560, pierce:1, ranks:5,
    perRank:{dmg:4, count:1, pierce:1} }
];

/* ---------- evolutions (6, one per color) ---------- */
D.EVOLUTIONS = [
  { color:'gold', id:'evoGold', name:'SOLAR CROWN', auras:['bladeOrbit','sunLance'],
    desc:'A crown of greatswords orbits you while sunfire lances rain down.',
    hint:'Fuses DAWN BLADES + SUN LANCE' },
  { color:'violet', id:'evoViolet', name:'EVENT HORIZON', auras:['pulseNova','voidOrb'],
    desc:'A collapsing star pulses, dragging enemies in and crushing them.',
    hint:'Fuses NIGHT PULSE + VOID ORB' },
  { color:'cyan', id:'evoCyan', name:'TEMPEST THRONE', auras:['chainBolt','frostVeil'],
    desc:'A storm throne: endless chain lightning inside a freezing tempest.',
    hint:'Fuses STORM CHAIN + FROST VEIL' },
  { color:'ember', id:'evoEmber', name:'WORLD PYRE', auras:['emberWisp','starfall'],
    desc:'The sky burns: meteor storms and a swarm of living flame.',
    hint:'Fuses EMBER WISPS + STARFALL' },
  { color:'jade', id:'evoJade', name:'MONSOON HEART', auras:['galeGust','thornBloom'],
    desc:'A hurricane heart: thorn tornadoes that fling and shred.',
    hint:'Fuses GALE GUST + THORN BLOOM' },
  { color:'rose', id:'evoRose', name:'LUNAR REQUIEM', auras:['moonbeam','mirage'],
    desc:'Twin moonbeams sweep while a storm of shards spirals outward.',
    hint:'Fuses MOONBEAM + MIRAGE SHARDS' }
];

/* ---------- passives (8) ---------- */
D.PASSIVES = [
  { id:'boots',  name:'Wind Boots',   icon:'boots',  desc:'Move faster.',            max:5, per:'+7% move speed' },
  { id:'heart',  name:'Dune Heart',   icon:'heart',  desc:'More health, heal a little.', max:5, per:'+18 max health' },
  { id:'magnet', name:'Lodestone',    icon:'magnet', desc:'Pull shards from farther.', max:5, per:'+35% pull range' },
  { id:'glass',  name:'Hourglass',    icon:'hour',   desc:'Auras strike more often.', max:5, per:'-6% cooldowns' },
  { id:'coin',   name:'Lucky Coin',   icon:'coin',   desc:'Bigger, brighter hits.',   max:5, per:'+8% crit chance' },
  { id:'core',   name:'Heavy Core',   icon:'core',   desc:'Hit harder.',              max:5, per:'+10% damage' },
  { id:'skin',   name:'Iron Skin',    icon:'skin',   desc:'Shrug off hits.',          max:5, per:'+2 armor' },
  { id:'map',    name:'Star Map',     icon:'map',    desc:'Find more shards.',        max:5, per:'+12% shards' }
];

/* ---------- enemies (11 types) ---------- */
D.ENEMIES = [
  { id:'chaser', name:'Dust Hound', hp:26, speed:118, dmg:10, r:20, score:1, shards:1,
    color:0xff8a3c, shape:'hound', behavior:'chase',
    desc:'Runs straight at you.' },
  { id:'swarmling', name:'Gnat', hp:10, speed:178, dmg:6, r:12, score:1, shards:1,
    color:0xffe14c, shape:'gnat', behavior:'swarm',
    desc:'Tiny, fast, comes in packs.' },
  { id:'dasher', name:'Razorback', hp:42, speed:96, dmg:14, r:22, score:2, shards:2,
    color:0xff4c6a, shape:'razor', behavior:'dash',
    desc:'Pauses, flashes, then dashes.' },
  { id:'splitter', name:'Matryosh', hp:55, speed:82, dmg:12, r:26, score:2, shards:2,
    color:0xb06cff, shape:'matry', behavior:'split',
    desc:'Breaks into two small ones.' },
  { id:'splitling', name:'Matryosh Bit', hp:16, speed:130, dmg:8, r:14, score:1, shards:1,
    color:0xc99aff, shape:'matry', behavior:'chase',
    desc:'A broken-off piece.' },
  { id:'spitter', name:'Spitflower', hp:38, speed:74, dmg:8, r:22, score:2, shards:2,
    color:0x5cff9d, shape:'flower', behavior:'spit',
    desc:'Keeps its distance and spits.' },
  { id:'shielded', name:'Aegis Crab', hp:90, speed:62, dmg:16, r:28, score:3, shards:3,
    color:0x4ce0ff, shape:'crab', behavior:'shield',
    desc:'Armored from the front.' },
  { id:'burrower', name:'Sand Mole', hp:48, speed:70, dmg:15, r:22, score:2, shards:2,
    color:0xd98a4c, shape:'mole', behavior:'burrow',
    desc:'Dives under the sand, erupts beneath you.' },
  { id:'brute', name:'Dune Titan', hp:220, speed:52, dmg:24, r:38, score:5, shards:5,
    color:0xff5c5c, shape:'titan', behavior:'brute',
    desc:'Slow, huge, barely feels pain.' },
  { id:'wisp', name:'Willo', hp:30, speed:110, dmg:9, r:16, score:2, shards:2,
    color:0x8ad8ff, shape:'wisp', behavior:'orbit',
    desc:'Circles you, sniping from range.' },
  { id:'leaper', name:'Springjaw', hp:36, speed:88, dmg:13, r:20, score:2, shards:2,
    color:0xff9a4c, shape:'jaw', behavior:'leap',
    desc:'Hops at you in heavy arcs.' }
];

/* ---------- relics (12 in the vault, keep 3) ---------- */
D.RELICS = [
  { id:'sunstone', name:'Sunstone', icon:'sun', desc:'+12% damage, always.', mod:{dmg:0.12} },
  { id:'moonwell', name:'Moonwell', icon:'moon', desc:'Regenerate 1 health every 3s.', mod:{regen:1} },
  { id:'windstep', name:'Windstep', icon:'wind', desc:'+10% move speed.', mod:{speed:0.10} },
  { id:'greed', name:'Greed Idol', icon:'idol', desc:'+20% shards from kills.', mod:{shards:0.20} },
  { id:'thornmail', name:'Thornmail', icon:'thornmail', desc:'Attackers take 8 damage back.', mod:{thorns:8} },
  { id:'frostbrand', name:'Frostbrand', icon:'frost', desc:'Your hits slow enemies 20%.', mod:{chill:0.20} },
  { id:'warhorn', name:'War Horn', icon:'horn', desc:'Auras recharge 8% faster.', mod:{cdr:0.08} },
  { id:'stoneheart', name:'Stoneheart', icon:'stone', desc:'+40 max health.', mod:{maxhp:40} },
  { id:'bloodvial', name:'Blood Vial', icon:'vial', desc:'Heal 1 health per 25 kills.', mod:{lifesteal:25} },
  { id:'echodrum', name:'Echo Drum', icon:'drum', desc:'Every 20s, all auras fire at once.', mod:{echo:20} },
  { id:'oasistear', name:'Oasis Tear', icon:'tear', desc:'Dune events help you more, hurt you less.', mod:{event:0.35} },
  { id:'phantom', name:'Phantom Veil', icon:'veil2', desc:'10% chance to dodge a hit.', mod:{dodge:0.10} }
];

/* ---------- achievements (12) ---------- */
D.ACHIEVEMENTS = [
  { id:'firstblood', name:'First Blood', desc:'Defeat your first enemy.', reward:null },
  { id:'kill100', name:'Swarmcutter', desc:'Defeat 100 enemies in one run.', reward:null },
  { id:'kill500', name:'Swarmbreaker', desc:'Defeat 500 enemies in one run.', reward:'hero:toofan' },
  { id:'reach4', name:'Duskwalker', desc:'Survive to 4:00.', reward:'hero:raat' },
  { id:'reach8', name:'Nightlord', desc:'Survive to 8:00.', reward:'skin:ember' },
  { id:'win', name:'Dawnbringer', desc:'Survive the full 10:00.', reward:'skin:dawn' },
  { id:'fuse', name:'Fusionist', desc:'Fuse two auras into an evolved form.', reward:'skin:void' },
  { id:'fullbuild', name:'Arsenal', desc:'Hold 6 auras at once.', reward:null },
  { id:'boss1', name:'Tyrant Slayer', desc:'Defeat the DUNE TYRANT.', reward:'skin:tyrant' },
  { id:'boss2', name:'Maw Slayer', desc:'Defeat the NIGHTMAW.', reward:'skin:maw' },
  { id:'untouch', name:'Untouchable', desc:'Take no damage for 60 seconds.', reward:null },
  { id:'oasis', name:'Oasis Rest', desc:'Heal 150 health inside an oasis.', reward:'skin:oasis' }
];

/* ---------- skins (palette shifts) ---------- */
D.SKINS = [
  { id:'default', name:'Dusk', desc:'Standard colors.' },
  { id:'ember', name:'Ember', desc:'Unlock: Nightlord.' },
  { id:'dawn', name:'Dawn', desc:'Unlock: Dawnbringer.' },
  { id:'void', name:'Void', desc:'Unlock: Fusionist.' },
  { id:'tyrant', name:'Tyrant', desc:'Unlock: Tyrant Slayer.' },
  { id:'maw', name:'Maw', desc:'Unlock: Maw Slayer.' },
  { id:'oasis', name:'Oasis', desc:'Unlock: Oasis Rest.' }
];
D.SKIN_TINTS = {
  default:[0xffffff,0xffffff], ember:[0xffb37a,0xff8a4c], dawn:[0xfff3c9,0xffe14c],
  void:[0xc9a6ff,0x8a5cff], tyrant:[0xff9a9a,0xff4c4c], maw:[0x9ad8ff,0x4c9aff],
  oasis:[0xa6ffc9,0x4cffa6]
};

/* ---------- dune events ---------- */
D.EVENTS = [
  { id:'sandstorm', name:'SANDSTORM', dur:22,
    desc:'The storm blinds you. Enemies slow, but so does your sight.' },
  { id:'oasis', name:'OASIS', dur:25,
    desc:'A healing spring rises. Stand in its light to mend.' },
  { id:'nightraid', name:'NIGHT RAID', dur:30,
    desc:'Elites hunt in a pack. Their shards are rich.' }
];

/* ---------- bosses ---------- */
D.BOSSES = [
  { id:'tyrant', name:'DUNE TYRANT', at:240, hp:2600, speed:66, dmg:30, r:64,
    color:0xff5c3c, shape:'tyrant',
    desc:'Charges in lines, summons hounds, spits radial fire.' },
  { id:'nightmaw', name:'NIGHTMAW', at:480, hp:5200, speed:58, dmg:36, r:76,
    color:0x8a3cff, shape:'maw',
    desc:'Spiral bullet storms, sweeping beam, calls razorbacks.' }
];

/* ---------- tuning ---------- */
D.TUNE = {
  runLength: 600,          // 10:00
  rankShards: [8, 14, 22, 32, 45, 60, 80, 105, 135, 170, 210, 260, 320, 390, 470, 560, 660, 780, 920, 99999],
  auraSlots: 6, passiveSlots: 6,
  basePickupR: 70,
  hurtVignette: 0.55,
  shakeSmall: 0.0018, shakeBig: 0.004
};

D.SAVE_KEY = 'duskline_v1';

D.defaultSave = function () {
  return {
    heroes: { seher:true, raat:false, toofan:false },
    skins: { default:true },
    relics: [],            // up to 3 relic ids kept across runs
    ach: {},               // id -> true
    best: { time:0, kills:0, rank:0 },
    runs: 0, wins: 0,
    skinSel: { seher:'default', raat:'default', toofan:'default' },
    muted: false,
    newUnlocks: []         // queue of unlock messages to show
  };
};

D.loadSave = function () {
  try {
    var raw = localStorage.getItem(D.SAVE_KEY);
    if (!raw) return D.defaultSave();
    var s = JSON.parse(raw);
    var d = D.defaultSave();
    for (var k in d) if (s[k] !== undefined) s[k] = s[k]; // keep loaded
    // merge nested safely
    ['heroes','skins','ach','best','skinSel'].forEach(function (k) {
      if (s[k]) for (var j in s[k]) d[k][j] = s[k][j];
    });
    ['relics','newUnlocks'].forEach(function (k) { if (Array.isArray(s[k])) d[k] = s[k]; });
    ['runs','wins','muted'].forEach(function (k) { if (typeof s[k] === 'number' || typeof s[k] === 'boolean') d[k] = s[k]; });
    return d;
  } catch (e) { return D.defaultSave(); }
};

D.storeSave = function (s) {
  try { localStorage.setItem(D.SAVE_KEY, JSON.stringify(s)); } catch (e) {}
};

D.auraById = function (id) { return D.AURAS.find(function (a) { return a.id === id; }); };
D.evoByColor = function (c) { return D.EVOLUTIONS.find(function (e) { return e.color === c; }); };
D.passiveById = function (id) { return D.PASSIVES.find(function (p) { return p.id === id; }); };
D.relicById = function (id) { return D.RELICS.find(function (r) { return r.id === id; }); };
D.enemyById = function (id) { return D.ENEMIES.find(function (e) { return e.id === id; }); };

})();
