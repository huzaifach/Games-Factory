'use strict';
/* WOBBLE WORLD — 05-dioramas.js : 6 hand-designed toy-box worlds.
   Each diorama: backdrop, decor, toys, creatures, 3 hidden giggle moments.
   Giggle defs subscribe to game.bus in listen(game). */

function _mkCreature(game, pKey, x, y) {
  const c = new Creature(pKey, x, y);
  c.userData.cid = game.nextCid++;
  game.world.blobs.push(c);
  game.creatures.push(c);
  return c;
}

const DIORAMAS = [
/* ================= 0 · JELLY KITCHEN ================= */
{
  name: 'Jelly Kitchen', tagline: 'Where the jellies are made!',
  sky: ['#fff6e8', '#ffd9c2'],
  hints: [
    'Fling a friend at the jelly tower!',
    'Tap a goo jar, then tap a friend to paint it.',
    'Stretch a friend REALLY far!'
  ],
  giggles: [
    { id: 'k-topple', name: 'Tower Topple', icon: 'tower',
      hint: 'Fling a friend at the jelly tower!',
      listen(g) { let n = 0; g.bus.on('domino-down', d => { n++; if (n >= d.total) g.foundGiggle('k-topple'); }); } },
    { id: 'k-syrup', name: 'Syrup Splash', icon: 'droplet',
      hint: 'Plop a friend into the syrup pool!',
      listen(g) { g.bus.on('splash', d => { if (d.pool === 'syrup') g.foundGiggle('k-syrup'); }); } },
    { id: 'k-stretch', name: 'Mega Stretch', icon: 'stretch',
      hint: 'Grab a friend and stretch it SUPER far!',
      listen(g) { g.bus.on('stretch-max', d => { if (d.amount > 1.8) g.foundGiggle('k-stretch'); }); } }
  ],
  build(game) {
    const W = game.world;
    // counter shelf
    W.addStatic(60, 880, 740, 880, { bounce: 0.45, friction: 0.05, tag: 'counter' });
    // domino jelly tower on the counter
    game.toys.push(new DominoTower(game, 580, 880, 5, 54, 78));
    // syrup pool on the floor
    game.toys.push(new GooPool(210, 1118, 230, '#d99a4e', 'syrup'));
    // goo jars on the floor
    game.toys.push(new GooJar(120, 1098, GOO_COLORS[0]));
    game.toys.push(new GooJar(250, 1098, GOO_COLORS[1]));
    game.toys.push(new GooJar(380, 1098, GOO_COLORS[2]));
    _mkCreature(game, 'bouncy', 330, 640);
    _mkCreature(game, 'sticky', 480, 560);
  },
  decor(ctx, game, t) {
    // shelf with jars silhouette
    ctx.fillStyle = 'rgba(214,164,120,0.5)';
    ctx.fillRect(60, 300, 680, 22);
    for (let i = 0; i < 6; i++) {
      const x = 110 + i * 112;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      Util.rr(ctx, x, 226, 56, 74, 12); ctx.fill();
      ctx.fillStyle = ['#ff8fb3', '#7fe3b2', '#ffd94e', '#4ec9ff', '#c3b2f2', '#ffb14e'][i] + '';
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x + 6, 262, 44, 32);
      ctx.globalAlpha = 1;
    }
    // window with sun
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    Util.rr(ctx, 560, 120, 150, 120, 18); ctx.fill();
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath(); ctx.arc(635, 180, 30, 0, TAU); ctx.fill();
  }
},

/* ================= 1 · BOUNCE CANYON ================= */
{
  name: 'Bounce Canyon', tagline: 'Boing boing boing!',
  sky: ['#ffe3c2', '#ffb3c2'],
  hints: [
    'Bounce the same friend 3 times in a row!',
    'Fling a friend SUPER high into the sky!',
    'Bounce across ALL three trampolines!'
  ],
  giggles: [
    { id: 'c-triple', name: 'Triple Bounce', icon: 'bounce',
      hint: 'Bounce the same friend 3 times quickly!',
      listen(g) {
        const times = {};
        g.bus.on('bounce', d => {
          const id = d.creature.userData.cid, now = g.time;
          times[id] = (times[id] || []).filter(t => now - t < 5);
          times[id].push(now);
          if (times[id].length >= 3) g.foundGiggle('c-triple');
        });
      } },
    { id: 'c-sky', name: 'Sky High', icon: 'sky',
      hint: 'Fling a friend SUPER high!',
      listen(g) { g.bus.on('high', () => g.foundGiggle('c-sky')); } },
    { id: 'c-chain', name: 'Canyon Runner', icon: 'chain',
      hint: 'Bounce on ALL 3 trampolines, one flight!',
      listen(g) {
        let seen = {}, firstT = 0;
        g.bus.on('bounce', d => {
          const now = g.time;
          if (now - firstT > 6) { seen = {}; firstT = now; }
          seen[d.toy.label] = true;
          if (Object.keys(seen).length >= 3) g.foundGiggle('c-chain');
        });
      } }
  ],
  build(game) {
    const t1 = new Trampoline(170, 1090, 150, 1150); t1.label = 'T1';
    const t2 = new Trampoline(400, 1090, 150, 1150); t2.label = 'T2';
    const t3 = new Trampoline(630, 1090, 150, 1150); t3.label = 'T3';
    game.toys.push(t1, t2, t3);
    _mkCreature(game, 'bouncy', 400, 660);
    _mkCreature(game, 'hyper', 190, 780);
    _mkCreature(game, 'sticky', 610, 780);
  },
  decor(ctx, game, t) {
    // canyon walls
    const g1 = ctx.createLinearGradient(0, 500, 0, 1200);
    g1.addColorStop(0, '#e8a37c'); g1.addColorStop(1, '#c97e5a');
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.moveTo(0, 620); ctx.lineTo(150, 620); ctx.lineTo(90, 1200); ctx.lineTo(0, 1200);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(800, 620); ctx.lineTo(650, 620); ctx.lineTo(710, 1200); ctx.lineTo(800, 1200);
    ctx.closePath(); ctx.fill();
    // strata lines
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 6;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(8, 720 + i * 110); ctx.lineTo(140, 700 + i * 110); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(792, 720 + i * 110); ctx.lineTo(660, 700 + i * 110); ctx.stroke();
    }
    // sun
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath(); ctx.arc(400, 240, 64, 0, TAU); ctx.fill();
  }
},

/* ================= 2 · MAGNET CAVE ================= */
{
  name: 'Magnet Cave', tagline: 'Something is pulling...',
  sky: ['#d9c8f0', '#6b5b8e'],
  hints: [
    'Drag a silver goo ball near a magnet orb!',
    'Tap bubbles to pop 5 of them!',
    'Let Gloopy land and get STUCK!'
  ],
  giggles: [
    { id: 'm-snap', name: 'Magnetic Snap', icon: 'magnet',
      hint: 'Get a goo ball to SNAP onto a magnet!',
      listen(g) { g.bus.on('snap', () => g.foundGiggle('m-snap')); } },
    { id: 'm-pop', name: 'Pop Party', icon: 'pop',
      hint: 'Pop 5 bubbles!',
      listen(g) { let n = 0; g.bus.on('pop', () => { n++; if (n >= 5) g.foundGiggle('m-pop'); }); } },
    { id: 'm-stick', name: 'Sticky Situation', icon: 'sticky',
      hint: 'Let Gloopy land and stick!',
      listen(g) { g.bus.on('stick', () => g.foundGiggle('m-stick')); } }
  ],
  build(game) {
    game.toys.push(new MagnetOrb(250, 480, 34));
    game.toys.push(new MagnetOrb(560, 400, 34));
    game.toys.push(new BubblePipe(660, 1100));
    const spots = [[140, 1060], [330, 1080], [480, 1060], [620, 1080], [250, 1080]];
    for (const [x, y] of spots) {
      const gb = new GooBall(x, y);
      gb.userData.cid = game.nextCid++;
      game.world.blobs.push(gb);
    }
    _mkCreature(game, 'sticky', 400, 720);
    _mkCreature(game, 'sleepy', 180, 860);
  },
  decor(ctx, game, t) {
    // cave ceiling
    ctx.fillStyle = '#5a4c78';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(800, 0); ctx.lineTo(800, 120);
    for (let x = 800; x >= 0; x -= 80) ctx.lineTo(x - 40, 120 + ((x / 80) % 2) * 60);
    ctx.closePath(); ctx.fill();
    // glowing crystals
    const cols = ['#7ce8ff', '#c39bff', '#ffe08a'];
    for (let i = 0; i < 7; i++) {
      const x = 60 + i * 110, y = 1160;
      const h = 90 + (i * 37) % 90;
      const tw = 0.6 + Math.sin(t * 2 + i) * 0.25;
      ctx.globalAlpha = tw;
      ctx.fillStyle = cols[i % 3];
      ctx.beginPath();
      ctx.moveTo(x - 26, y); ctx.lineTo(x, y - h); ctx.lineTo(x + 26, y);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // fireflies
    ctx.fillStyle = '#fff9c9';
    for (let i = 0; i < 10; i++) {
      const x = (i * 173 + t * 20) % 800, y = 300 + ((i * 97) % 500) + Math.sin(t + i) * 20;
      ctx.globalAlpha = 0.4 + Math.sin(t * 3 + i * 2) * 0.3;
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
},

/* ================= 3 · BUBBLE BATH ================= */
{
  name: 'Bubble Bath', tagline: 'Splish splash!',
  sky: ['#c8f2ff', '#9ed8f5'],
  hints: [
    'Let a friend ride a bubble way up high!',
    'Fling a friend HARD into the bath!',
    'Paint one friend with TWO goo colors!'
  ],
  giggles: [
    { id: 'b-ride', name: 'Bubble Ride', icon: 'ride',
      hint: 'Let a friend ride a bubble up high!',
      listen(g) { g.bus.on('ride', () => g.foundGiggle('b-ride')); } },
    { id: 'b-cannon', name: 'Cannonball!', icon: 'splash',
      hint: 'Fling a friend HARD into the bath!',
      listen(g) { g.bus.on('splash', d => { if (d.pool === 'bath' && d.speed > 900) g.foundGiggle('b-cannon'); }); } },
    { id: 'b-chef', name: 'Goo Chef', icon: 'paint',
      hint: 'Paint ONE friend with TWO goo colors!',
      listen(g) { g.bus.on('paint', d => { if (d.creature.paintColors.length >= 2) g.foundGiggle('b-chef'); }); } }
  ],
  build(game) {
    game.toys.push(new GooPool(400, 1080, 580, '#7cc7ff', 'bath'));
    game.toys.push(new BubblePipe(200, 1060));
    game.toys.push(new BubblePipe(600, 1060));
    game.toys.push(new GooJar(110, 1098, GOO_COLORS[0]));
    game.toys.push(new GooJar(690, 1098, GOO_COLORS[2]));
    _mkCreature(game, 'bouncy', 300, 640);
    _mkCreature(game, 'hyper', 520, 640);
  },
  decor(ctx, game, t) {
    // tiles
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
    for (let y = 120; y < 700; y += 90) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
    }
    for (let x = 0; x < 800; x += 90) {
      ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x, 700); ctx.stroke();
    }
    // rubber duck silhouette
    ctx.fillStyle = '#ffd94e';
    ctx.beginPath(); ctx.ellipse(640, 220, 46, 34, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(672, 190, 22, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff9eb0';
    ctx.beginPath(); ctx.moveTo(690, 190); ctx.lineTo(706, 196); ctx.lineTo(690, 202); ctx.closePath(); ctx.fill();
    // foam blobs on the bath edge
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 12; i++) {
      const x = 130 + i * 50 + Math.sin(t + i) * 4;
      ctx.beginPath(); ctx.arc(x, 1006 + (i % 3) * 8, 12 + (i % 4) * 3, 0, TAU); ctx.fill();
    }
  }
},

/* ================= 4 · SPRING GARDEN ================= */
{
  name: 'Spring Garden', tagline: 'Everything bounces here!',
  sky: ['#d8f5d0', '#a8e0a0'],
  hints: [
    'Drop a friend on one end of the seesaw!',
    'Land a friend on a spring flower!',
    'Wake up Dozie the sleepy one!'
  ],
  giggles: [
    { id: 'g-seesaw', name: 'Seesaw Launch', icon: 'seesaw',
      hint: 'Launch a friend with the seesaw!',
      listen(g) { g.bus.on('launch', d => { if (d.toy === 'seesaw') g.foundGiggle('g-seesaw'); }); } },
    { id: 'g-flower', name: 'Flower Power', icon: 'flower',
      hint: 'Launch a friend with a spring flower!',
      listen(g) { g.bus.on('launch', d => { if (d.toy === 'flower') g.foundGiggle('g-flower'); }); } },
    { id: 'g-wake', name: 'Rise and Shine', icon: 'wake',
      hint: 'Wake up Dozie! (fling it or tap it)',
      listen(g) { g.bus.on('wake', () => g.foundGiggle('g-wake')); } }
  ],
  build(game) {
    game.toys.push(new Seesaw(game, 400, 1080, 380));
    game.toys.push(new SpringFlower(160, 1060, 1300));
    game.toys.push(new SpringFlower(640, 1060, 1300));
    _mkCreature(game, 'sleepy', 400, 640);
    _mkCreature(game, 'bouncy', 230, 760);
    _mkCreature(game, 'sticky', 580, 760);
  },
  decor(ctx, game, t) {
    // hills
    ctx.fillStyle = '#93d393';
    ctx.beginPath(); ctx.ellipse(160, 1220, 320, 160, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(660, 1240, 340, 180, 0, 0, TAU); ctx.fill();
    // flowers
    const cols = ['#ff9ebb', '#ffd166', '#ffffff', '#ffb14e'];
    for (let i = 0; i < 9; i++) {
      const x = 60 + i * 82, y = 1120 - (i % 3) * 26;
      const sway = Math.sin(t * 1.5 + i) * 8;
      ctx.strokeStyle = '#5da85f'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x, y + 40); ctx.quadraticCurveTo(x + sway, y + 10, x + sway * 1.4, y); ctx.stroke();
      ctx.fillStyle = cols[i % 4];
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * TAU;
        ctx.beginPath();
        ctx.ellipse(x + sway * 1.4 + Math.cos(a) * 12, y + Math.sin(a) * 12, 10, 7, a, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath(); ctx.arc(x + sway * 1.4, y, 8, 0, TAU); ctx.fill();
    }
    // butterflies
    for (let i = 0; i < 3; i++) {
      const x = (t * 60 + i * 260) % 850 - 25, y = 300 + Math.sin(t * 2 + i * 2) * 60;
      const flap = Math.sin(t * 14 + i) * 0.5;
      ctx.fillStyle = ['#ff9ebb', '#7cc7ff', '#ffd166'][i];
      ctx.save(); ctx.translate(x, y);
      ctx.beginPath(); ctx.ellipse(-8, 0, 10, 6 + flap * 8, -0.4, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(8, 0, 10, 6 + flap * 8, 0.4, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
},

/* ================= 5 · PILLOW FORT ================= */
{
  name: 'Pillow Fort', tagline: 'Softest place in the world.',
  sky: ['#b8c8f0', '#7d8fd4'],
  hints: [
    'Bounce a friend across 3 different pillows!',
    'Let Dozie nap for a little while...',
    'Land a friend with a BIG splat!'
  ],
  giggles: [
    { id: 'f-pile', name: 'Pillow Pile', icon: 'pillow',
      hint: 'Touch 3 different pillows, one trip!',
      listen(g) {
        let seen = {}, firstT = 0;
        g.bus.on('pillow', d => {
          const now = g.time;
          if (now - firstT > 8) { seen = {}; firstT = now; }
          seen[d.pillowIndex] = true;
          if (Object.keys(seen).length >= 3) g.foundGiggle('f-pile');
        });
      } },
    { id: 'f-nap', name: 'Nap Time', icon: 'nap',
      hint: 'Let Dozie sleep peacefully for a while...',
      listen(g) { g.bus.on('nap', () => g.foundGiggle('f-nap')); } },
    { id: 'f-splat', name: 'Splat Star', icon: 'splat',
      hint: 'Land a friend with a BIG splat!',
      listen(g) { g.bus.on('splat', d => { if (d.hard) g.foundGiggle('f-splat'); }); } }
  ],
  build(game) {
    const cols = ['#ffe3ef', '#e3ecff', '#fff3d6', '#e8dff5'];
    game.toys.push(new Pillow(game, 150, 1100, 190, 100, 0.1, cols[0], 0));
    game.toys.push(new Pillow(game, 400, 1105, 210, 105, -0.06, cols[1], 1));
    game.toys.push(new Pillow(game, 650, 1100, 190, 100, 0.12, cols[2], 2));
    game.toys.push(new Pillow(game, 400, 1000, 190, 95, 0.03, cols[3], 3));
    _mkCreature(game, 'sleepy', 400, 560);
    _mkCreature(game, 'sticky', 230, 700);
    _mkCreature(game, 'hyper', 580, 700);
  },
  decor(ctx, game, t) {
    // blanket fort: draped sheets
    ctx.fillStyle = 'rgba(255,183,178,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.quadraticCurveTo(200, 360 + Math.sin(t) * 6, 400, 420);
    ctx.quadraticCurveTo(600, 480 - Math.sin(t) * 6, 800, 420);
    ctx.lineTo(800, 0); ctx.lineTo(0, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 5; i++) {
      const x = 90 + i * 155;
      ctx.beginPath();
      ctx.moveTo(x, 60); ctx.quadraticCurveTo(x + 20, 220, x - 10, 400);
      ctx.lineTo(x + 24, 400); ctx.quadraticCurveTo(x + 54, 220, x + 34, 60);
      ctx.closePath(); ctx.fill();
    }
    // fairy lights
    for (let i = 0; i < 14; i++) {
      const x = 40 + i * 55, y = 430 + Math.sin(i * 1.2) * 26;
      const tw = 0.5 + Math.sin(t * 3 + i * 1.7) * 0.4;
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
      ctx.globalAlpha = tw * 0.35;
      ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 20; i++) {
      const x = (i * 211) % 800, y = 60 + (i * 67) % 200;
      ctx.globalAlpha = 0.3 + ((i * 13) % 10) / 22;
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
];

const GIGGLE_TOTAL = 18;
