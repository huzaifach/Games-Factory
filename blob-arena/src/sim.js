/* ============================================================
   BLOB ARENA — sim.js
   The entire game simulation: blobs, bot AI, pellets, particles,
   ripples, storm, combos, kill feed, round flow.
   PURE LOGIC — no DOM, no canvas, no Audio. Safe for node harness.
   Events are pushed as plain objects into the `emit` array.
   ============================================================ */
'use strict';

function makeSim(seed, emit) {
  var rng = mulberry32(seed);
  var W = CFG.world;

  var sim = {
    time: 0,
    timeLeft: CFG.roundTime,
    state: 'play',           // 'play' | 'end'
    blobs: [],
    pellets: [],
    parts: [],
    ripples: [],
    feed: [],
    quipCooldown: 6,
    storm: { active: false, t: 0, radius: W * 0.75, cx: W / 2, cy: W / 2, warned: false },
    winner: null,
    player: null,
    nextId: 1
  };

  /* ------------------------- particle / ripple pools ------------------------- */
  function initPools() {
    var i;
    for (i = 0; i < CFG.budget.particles; i++)
      sim.parts.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, color: '#fff', kind: '' });
    for (i = 0; i < CFG.budget.ripples; i++)
      sim.ripples.push({ active: false, x: 0, y: 0, r: 0, vr: 0, maxR: 0, life: 0, maxLife: 1, color: '#fff', width: 3 });
    /* ambient plankton: world-space drifters */
    for (i = 0; i < CFG.budget.plankton; i++) {
      var p = sim.parts[i];
      p.active = true; p.kind = 'plankton';
      p.x = rng() * W; p.y = rng() * W;
      p.vx = (rng() - 0.5) * 14; p.vy = (rng() - 0.5) * 10 - 4;
      p.life = p.maxLife = 1e9;
      p.size = 1 + rng() * 2.4;
      p.color = rng() < 0.5 ? '#7fe7ff' : '#b8ffe9';
    }
    sim.planktonCount = CFG.budget.plankton;
  }

  function spawnPart(kind, x, y, vx, vy, life, size, color) {
    for (var i = sim.planktonCount; i < sim.parts.length; i++) {
      var p = sim.parts[i];
      if (!p.active) {
        p.active = true; p.kind = kind;
        p.x = x; p.y = y; p.vx = vx; p.vy = vy;
        p.life = p.maxLife = life; p.size = size; p.color = color;
        return;
      }
    }
  }

  function burst(x, y, n, color, speed, life, size) {
    for (var i = 0; i < n; i++) {
      var a = rng() * TAU, s = speed * (0.35 + rng() * 0.85);
      spawnPart('spark', x, y, Math.cos(a) * s, Math.sin(a) * s,
                life * (0.6 + rng() * 0.7), size * (0.6 + rng() * 0.8), color);
    }
  }

  function spawnRipple(x, y, maxR, color, width, life) {
    for (var i = 0; i < sim.ripples.length; i++) {
      var r = sim.ripples[i];
      if (!r.active) {
        r.active = true; r.x = x; r.y = y; r.r = 6;
        r.vr = maxR / life; r.maxR = maxR;
        r.life = r.maxLife = life; r.color = color; r.width = width || 3;
        return;
      }
    }
  }

  /* ------------------------------- pellets ------------------------------- */
  var PELLET_COLORS = ['#8ef7ff', '#a7ffcf', '#ffe89a', '#ffb3e2', '#c4b5fd', '#9af0ff'];
  function scatterPellet(p, anywhere) {
    if (!anywhere && rng() < 0.72) {
      /* cluster-biased placement (hand-designed layout) */
      var totalW = 0, i, c;
      for (i = 0; i < PELLET_CLUSTERS.length; i++) totalW += PELLET_CLUSTERS[i][3];
      var roll = rng() * totalW;
      c = PELLET_CLUSTERS[0];
      for (i = 0; i < PELLET_CLUSTERS.length; i++) {
        roll -= PELLET_CLUSTERS[i][3];
        if (roll <= 0) { c = PELLET_CLUSTERS[i]; break; }
      }
      var a = rng() * TAU, d = Math.sqrt(rng()) * c[2];
      p.x = clamp(c[0] + Math.cos(a) * d, 30, W - 30);
      p.y = clamp(c[1] + Math.sin(a) * d, 30, W - 30);
    } else {
      p.x = 60 + rng() * (W - 120);
      p.y = 60 + rng() * (W - 120);
    }
    p.active = true;
    p.respawnT = 0;
    p.color = pick(rng, PELLET_COLORS);
    p.tw = rng() * TAU;
  }

  function initPellets() {
    for (var i = 0; i < CFG.pelletCount; i++) {
      var p = { x: 0, y: 0, r: 3.4, mass: CFG.pelletMass, active: false, respawnT: 0, color: '#fff', tw: 0 };
      scatterPellet(p, false);
      /* keep spawn area clear-ish: re-scatter if inside a blob spawn — blobs spawn after */
      sim.pellets.push(p);
    }
  }

  /* -------------------------------- blobs -------------------------------- */
  function spawnPos(minDist) {
    for (var tries = 0; tries < 40; tries++) {
      var x = 200 + rng() * (W - 400), y = 200 + rng() * (W - 400);
      var ok = true;
      for (var i = 0; i < sim.blobs.length; i++) {
        var b = sim.blobs[i];
        var dx = b.x - x, dy = b.y - y;
        if (dx * dx + dy * dy < minDist * minDist) { ok = false; break; }
      }
      if (ok) return { x: x, y: y };
    }
    return { x: 200 + rng() * (W - 400), y: 200 + rng() * (W - 400) };
  }

  function makeBlob(opts) {
    var pos = spawnPos(420);
    var b = {
      id: sim.nextId++, name: opts.name, title: opts.title || '',
      color: opts.color, dark: opts.dark || opts.color,
      isPlayer: !!opts.isPlayer,
      x: pos.x, y: pos.y, vx: 0, vy: 0,
      mass: CFG.spawnMass, r: massToR(CFG.spawnMass), drawR: massToR(CFG.spawnMass),
      wob: rng() * TAU, wobAmp: 0,
      pop: 0, popV: 0,                       // scale-pop spring
      squash: 0, squashA: 0,                 // dash stretch: amount + angle
      dashT: 0, dashUsed: false,
      alive: true, respawnT: 0,
      absorbT: 0, absorbedBy: null, ax: 0, ay: 0,
      combo: 0, comboT: 0, msIdx: 0,
      kills: 0, eaten: 0, biggest: 0,
      crown: !!opts.crown,
      ai: null
    };
    b.biggest = b.r;
    if (!b.isPlayer) {
      var P = opts.personality;
      b.ai = {
        p: P, dx: 0, dy: -1, thinkT: rng() * CFG.botThink,
        tx: W / 2, ty: W / 2,
        baitPhase: 'lurk', baitT: 1 + rng() * 2,
        chaosT: rng() * 2, quipT: 12 + rng() * 22,
        wanderA: rng() * TAU
      };
    }
    return b;
  }

  function initBlobs(playerCrown) {
    sim.player = makeBlob({ name: 'You', color: '#5eff8a', dark: '#1d7a38', isPlayer: true, crown: playerCrown });
    sim.blobs.push(sim.player);
    for (var i = 0; i < PERSONALITIES.length; i++) {
      var P = PERSONALITIES[i];
      sim.blobs.push(makeBlob({ name: P.name, title: P.title, color: P.color, dark: P.dark, personality: P }));
    }
  }

  /* --------------------------------- feed --------------------------------- */
  function addFeed(text, color) {
    sim.feed.push({ text: text, color: color || '#cfe9ff', t: sim.time });
    if (sim.feed.length > 6) sim.feed.shift();
    emit.push({ t: 'feed' });
  }

  /* ------------------------------ bot thinking ------------------------------ */
  function botThink(b) {
    var P = b.ai.p, w = P.w, W2 = W;
    var mx = 0, my = 0;
    var i, o, dx, dy, d2, d;

    /* storm: survival overrides everything */
    if (sim.storm.active) {
      dx = sim.storm.cx - b.x; dy = sim.storm.cy - b.y;
      d = Math.hypot(dx, dy) || 1;
      if (d > sim.storm.radius * 0.82) {
        b.ai.dx = dx / d; b.ai.dy = dy / d;
        return;
      }
    }

    /* threats: bigger blobs nearby */
    var fleeR = 560 * P.caution;
    var fx = 0, fy = 0, threatNear = 0;
    for (i = 0; i < sim.blobs.length; i++) {
      o = sim.blobs[i];
      if (o === b || !o.alive || o.absorbT > 0) continue;
      if (o.r < b.r * CFG.eatRatio) continue;
      dx = b.x - o.x; dy = b.y - o.y; d2 = dx * dx + dy * dy;
      if (d2 < fleeR * fleeR) {
        d = Math.sqrt(d2) || 1;
        var f = (1 - d / fleeR) * (o.r / b.r);
        fx += (dx / d) * f; fy += (dy / d) * f;
        threatNear = Math.max(threatNear, 1 - d / fleeR);
      }
    }
    mx += fx * w.flee * 2.2; my += fy * w.flee * 2.2;

    /* prey: smaller edible blobs */
    var best = null, bestD2 = 820 * 820;
    for (i = 0; i < sim.blobs.length; i++) {
      o = sim.blobs[i];
      if (o === b || !o.alive || o.absorbT > 0) continue;
      if (b.r < o.r * CFG.eatRatio) continue;
      dx = o.x - b.x; dy = o.y - b.y; d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; best = o; }
    }

    /* personality: stalk the leader */
    if (w.stalk > 0) {
      var lead = leaderboard()[0];
      if (lead && lead !== b && lead.alive) {
        dx = lead.x - b.x; dy = lead.y - b.y; d = Math.hypot(dx, dy) || 1;
        if (lead.r > b.r * CFG.eatRatio) {
          /* shadow at a safe distance — creepy stalking */
          var want = lead.r + 240;
          var push = (want - d) / want;
          mx += (dx / d) * push * w.stalk * 1.6;
          my += (dy / d) * push * w.stalk * 1.6;
        } else {
          best = lead; bestD2 = d * d;
        }
      }
    }

    /* personality: camper corner */
    if (w.corner > 0) {
      var corners = [[230, 230], [W2 - 230, 230], [230, W2 - 230], [W2 - 230, W2 - 230]];
      var nc = corners[0], nd = 1e18;
      for (i = 0; i < 4; i++) {
        dx = corners[i][0] - b.x; dy = corners[i][1] - b.y; d2 = dx * dx + dy * dy;
        if (d2 < nd) { nd = d2; nc = corners[i]; }
      }
      if (threatNear < 0.25) {
        mx += (nc[0] - b.x) * 0.004 * w.corner;
        my += (nc[1] - b.y) * 0.004 * w.corner;
      }
    }

    /* personality: ambusher waits at cluster edges */
    if (w.ambush > 0) {
      b.ai.baitT -= CFG.botThink;
      if (b.ai.baitPhase !== 'lunge') {
        var cl = PELLET_CLUSTERS[(b.id * 3) % PELLET_CLUSTERS.length];
        var lx = cl[0] + Math.cos(b.ai.wanderA) * (cl[2] + 90);
        var ly = cl[1] + Math.sin(b.ai.wanderA) * (cl[2] + 90);
        mx += (lx - b.x) * 0.003 * w.ambush;
        my += (ly - b.y) * 0.003 * w.ambush;
      }
      if (best && bestD2 < 340 * 340) { b.ai.baitPhase = 'lunge'; b.ai.baitT = 0.8; }
      else if (b.ai.baitT <= 0) { b.ai.baitPhase = 'wait'; b.ai.baitT = 1 + rng() * 2; }
    }

    /* personality: trickster bait-and-juke cycle */
    if (w.bait > 0 && best) {
      b.ai.baitT -= CFG.botThink;
      if (b.ai.baitT <= 0) {
        if (b.ai.baitPhase === 'lurk') { b.ai.baitPhase = 'feint'; b.ai.baitT = 0.55; }
        else if (b.ai.baitPhase === 'feint') { b.ai.baitPhase = 'lunge'; b.ai.baitT = 0.8; }
        else { b.ai.baitPhase = 'lurk'; b.ai.baitT = 1 + rng() * 1.6; }
      }
      d = Math.sqrt(bestD2) || 1;
      dx = (best.x - b.x) / d; dy = (best.y - b.y) / d;
      if (b.ai.baitPhase === 'feint') { mx -= dx * w.bait * 1.4; my -= dy * w.bait * 1.4; }
      else if (b.ai.baitPhase === 'lunge') {
        mx += dx * w.bait * 1.8; my += dy * w.bait * 1.8;
        if (!b.dashUsed && rng() < P.dash * 0.5) b.ai.dashWant = true;
      }
    } else if (best && w.hunt > 0) {
      /* straightforward hunt */
      d = Math.sqrt(bestD2) || 1;
      var lungeMul = (b.ai.baitPhase === 'lunge') ? 1.8 : 1.0;
      mx += ((best.x - b.x) / d) * w.hunt * P.aggression * lungeMul;
      my += ((best.y - b.y) / d) * w.hunt * P.aggression * lungeMul;
      if (!b.dashUsed && d < 260 && rng() < P.dash * 0.25) b.ai.dashWant = true;
    }

    /* pellets */
    var pr = w.pellet > 1.1 ? 1150 : 720;
    var bp = null, bpD2 = pr * pr;
    for (i = 0; i < sim.pellets.length; i++) {
      var pl = sim.pellets[i];
      if (!pl.active) continue;
      dx = pl.x - b.x; dy = pl.y - b.y; d2 = dx * dx + dy * dy;
      if (d2 < bpD2) { bpD2 = d2; bp = pl; }
    }
    if (bp && threatNear < 0.55) {
      d = Math.sqrt(bpD2) || 1;
      mx += ((bp.x - b.x) / d) * w.pellet;
      my += ((bp.y - b.y) / d) * w.pellet;
    }

    /* center bias (guardian) */
    if (P.centerBias) {
      mx += (W2 / 2 - b.x) * 0.0012 * P.centerBias;
      my += (W2 / 2 - b.y) * 0.0012 * P.centerBias;
    }

    /* chaos (jester): random darts */
    if (w.chaos > 0) {
      b.ai.chaosT -= CFG.botThink;
      if (b.ai.chaosT <= 0) {
        b.ai.chaosT = 0.9 + rng() * 1.8;
        b.ai.wanderA = rng() * TAU;
      }
      mx += Math.cos(b.ai.wanderA) * w.chaos * 0.8;
      my += Math.sin(b.ai.wanderA) * w.chaos * 0.8;
    }

    /* gentle wander so nobody ever stands still */
    b.ai.wanderA += CFG.botThink * 0.35;
    mx += Math.cos(b.ai.wanderA) * 0.12 * (0.3 + w.roam);
    my += Math.sin(b.ai.wanderA) * 0.12 * (0.3 + w.roam);

    /* walls: steer back inside */
    var m = 260;
    if (b.x < m) mx += (m - b.x) * 0.01;
    if (b.x > W2 - m) mx -= (b.x - (W2 - m)) * 0.01;
    if (b.y < m) my += (m - b.y) * 0.01;
    if (b.y > W2 - m) my -= (b.y - (W2 - m)) * 0.01;

    var ml = Math.hypot(mx, my);
    if (ml > 0.02) { b.ai.dx = mx / ml; b.ai.dy = my / ml; }
  }

  /* ------------------------------ eating -------------------------------- */
  function eatPellet(b, p) {
    p.active = false;
    p.respawnT = CFG.pelletRespawn[0] + rng() * (CFG.pelletRespawn[1] - CFG.pelletRespawn[0]);
    b.mass = Math.min(b.mass + p.mass, CFG.maxMass);
    b.eaten++;
    /* combo */
    if (b.comboT > 0) b.combo++; else b.combo = 1;
    b.comboT = CFG.comboWindow;
    /* delicious: scale-pop spring kick + sparkle + ripple */
    b.popV += 2.6;
    burst(p.x, p.y, 5, p.color, 130, 0.5, 3);
    spawnRipple(b.x, b.y, b.r * 0.7, b.color, 2, 0.35);
    if (b.isPlayer) {
      emit.push({ t: 'pellet', x: p.x, y: p.y, combo: b.combo });
      if (b.combo > 0 && b.combo % CFG.comboMilestone === 0)
        emit.push({ t: 'combo', n: b.combo });
    }
  }

  function absorb(eater, prey) {
    prey.alive = false;
    prey.absorbT = CFG.absorbTime;
    prey.absorbedBy = eater;
    prey.ax = prey.x; prey.ay = prey.y;
    eater.mass = Math.min(eater.mass + prey.mass * 0.92, CFG.maxMass);
    eater.kills++;
    eater.popV += 5.5;
    eater.combo = 0; eater.comboT = 0;
    var mx = (eater.x + prey.x) / 2, my = (eater.y + prey.y) / 2;
    /* ripple-merge: ring bursts from the meal and merges into the eater */
    spawnRipple(prey.x, prey.y, eater.r * 1.15, eater.color, 4, 0.45);
    spawnRipple(mx, my, eater.r * 0.8, '#ffffff', 2, 0.3);
    burst(prey.x, prey.y, 14, prey.color, 220, 0.6, 4);
    var big = prey.mass > 60;
    var verb = pick(rng, KILL_VERBS);
    addFeed(eater.name + ' ' + verb + ' ' + prey.name + '!', eater.color);
    emit.push({ t: 'eat', eater: eater.name, prey: prey.name, big: big,
                x: mx, y: my, playerInvolved: eater.isPlayer || prey.isPlayer,
                meal: prey.mass });
    if (prey.isPlayer) {
      emit.push({ t: 'playerDeath', by: eater.name, byColor: eater.color });
    } else {
      prey.respawnT = CFG.botRespawn;
    }
  }

  function stormKill(b) {
    b.alive = false;
    b.absorbT = 0;
    burst(b.x, b.y, 18, '#b48cff', 180, 0.8, 4);
    addFeed(b.name + ' ' + pick(rng, STORM_DEATHS) + '.', '#b48cff');
    emit.push({ t: 'stormDeath', name: b.name, playerInvolved: b.isPlayer, x: b.x, y: b.y });
    if (b.isPlayer) emit.push({ t: 'playerDeath', by: 'the storm', byColor: '#b48cff' });
    else b.respawnT = CFG.botRespawn;
  }

  /* ------------------------------ leaderboard ------------------------------ */
  function leaderboard() {
    var alive = [];
    for (var i = 0; i < sim.blobs.length; i++)
      if (sim.blobs[i].alive) alive.push(sim.blobs[i]);
    alive.sort(function (a, b) { return b.mass - a.mass; });
    return alive;
  }
  sim.leaderboard = leaderboard;

  function respawnBlob(b) {
    var pos = spawnPos(420);
    b.x = pos.x; b.y = pos.y; b.vx = 0; b.vy = 0;
    b.mass = CFG.spawnMass; b.r = b.drawR = massToR(b.mass);
    b.alive = true; b.respawnT = 0;
    b.dashT = 0; b.dashUsed = false;
    b.combo = 0; b.comboT = 0; b.msIdx = 0;
    b.wobAmp = 0; b.pop = 0; b.popV = 0; b.squash = 0;
    if (b.ai) { b.ai.thinkT = rng() * CFG.botThink; b.ai.baitPhase = 'lurk'; b.ai.dashWant = false; }
    spawnRipple(b.x, b.y, b.r * 2, b.color, 3, 0.5);
  }
  sim.respawnPlayer = function () {
    if (sim.state === 'play' && sim.player && !sim.player.alive) respawnBlob(sim.player);
  };

  /* -------------------------------- update -------------------------------- */
  sim.update = function (dt, input) {
    if (sim.state !== 'play') return;
    var ambient = !!sim.ambient;   /* living backdrop mode: world runs, timer does not */
    sim.time += dt;
    if (!ambient) sim.timeLeft -= dt;

    /* storm lifecycle (skipped in ambient mode) */
    if (!ambient && !sim.storm.active && sim.timeLeft <= (CFG.roundTime - CFG.stormAt)) {
      sim.storm.active = true;
      addFeed('THE STORM IS CLOSING IN!', '#ff7a9e');
      emit.push({ t: 'storm' });
    }
    if (sim.storm.active) {
      sim.storm.t = clamp(1 - sim.timeLeft / (CFG.roundTime - CFG.stormAt), 0, 1);
      var e = sim.storm.t < 0.5 ? 2 * sim.storm.t * sim.storm.t
                                : 1 - Math.pow(-2 * sim.storm.t + 2, 2) / 2;
      sim.storm.radius = lerp(W * 0.75, CFG.stormMinR, e);
      if (!sim.storm.warned && sim.timeLeft <= 12) {
        sim.storm.warned = true;
        addFeed('Final 10 seconds — fight!', '#ffd166');
        emit.push({ t: 'finalcount' });
      }
    }

    /* round end */
    if (!ambient && sim.timeLeft <= 0) {
      sim.timeLeft = 0;
      sim.state = 'end';
      var lb = leaderboard();
      sim.winner = lb.length ? lb[0] : null;
      emit.push({ t: 'end', winner: sim.winner ? sim.winner.name : '—',
                  winnerColor: sim.winner ? sim.winner.color : '#fff',
                  playerWon: !!(sim.winner && sim.winner.isPlayer) });
      return;
    }

    var i, b, dx, dy, d;

    /* --- player input → desired direction --- */
    var p = sim.player;
    var pdx = 0, pdy = 0, wantDash = false;
    if (p.alive && input) {
      pdx = input.dx || 0; pdy = input.dy || 0;
      wantDash = !!input.dash;
      var il = Math.hypot(pdx, pdy);
      if (il > 1) { pdx /= il; pdy /= il; }
    }

    /* --- bots think (staggered) --- */
    for (i = 0; i < sim.blobs.length; i++) {
      b = sim.blobs[i];
      if (b.isPlayer || !b.alive) continue;
      b.ai.thinkT -= dt;
      if (b.ai.thinkT <= 0) { b.ai.thinkT = CFG.botThink * (0.8 + rng() * 0.5); botThink(b); }
      /* ambient personality quips */
      b.ai.quipT -= dt;
      if (b.ai.quipT <= 0) {
        b.ai.quipT = 20 + rng() * 22;
        sim.quipCooldown -= 0; /* per-bot timer is enough */
        if (sim.quipCooldown <= 0 && rng() < 0.5) {
          sim.quipCooldown = 11;
          addFeed(pick(rng, b.ai.p.quips), b.color);
        }
      }
    }
    sim.quipCooldown -= dt;

    /* --- integrate blobs --- */
    for (i = 0; i < sim.blobs.length; i++) {
      b = sim.blobs[i];
      if (!b.alive) {
        /* respawn timers (player respawns on tap via UI) */
        if (!b.isPlayer) {
          b.respawnT -= dt;
          if (b.respawnT <= 0) respawnBlob(b);
        }
        continue;
      }
      if (b.absorbT > 0) {  /* being ripple-merged: handled below */ }

      /* dash trigger */
      var dashNow = false;
      if (b.isPlayer) dashNow = wantDash && !b.dashUsed && b.dashT <= 0;
      else { dashNow = b.ai.dashWant && !b.dashUsed && b.dashT <= 0; b.ai.dashWant = false; }
      if (dashNow) {
        b.dashT = CFG.dashTime; b.dashUsed = true;
        var dd = b.isPlayer ? { x: pdx, y: pdy } : { x: b.ai.dx, y: b.ai.dy };
        var dl = Math.hypot(dd.x, dd.y);
        if (dl < 0.05) { dd.x = Math.cos(b.wob); dd.y = Math.sin(b.wob); dl = 1; }
        b.squash = 1; b.squashA = Math.atan2(dd.y, dd.x);
        emit.push({ t: 'dash', x: b.x, y: b.y, player: b.isPlayer });
        for (var k = 0; k < 10; k++)
          spawnPart('trail', b.x, b.y, -dd.x * 120 + (rng() - .5) * 60, -dd.y * 120 + (rng() - .5) * 60,
                    0.45, 4, b.color);
      }

      /* desired velocity */
      var desX, desY;
      if (b.isPlayer) { desX = pdx; desY = pdy; }
      else { desX = b.ai.dx; desY = b.ai.dy; }
      var spd = speedForR(b.r) * (b.isPlayer ? 1 : b.ai.p.speedMul);
      if (b.dashT > 0) { spd *= CFG.dashMult; b.dashT -= dt; }
      var lambda = 6.5 * Math.pow(CFG.speedRefR / b.r, 0.3);  /* heavier = lazier */
      if (b.dashT > 0) lambda = 14;
      b.vx = damp(b.vx, desX * spd, lambda, dt);
      b.vy = damp(b.vy, desY * spd, lambda, dt);
      b.x = clamp(b.x + b.vx * dt, b.r * 0.6, W - b.r * 0.6);
      b.y = clamp(b.y + b.vy * dt, b.r * 0.6, W - b.r * 0.6);

      /* mass → radius (smoothed for juicy growth) */
      b.r = massToR(b.mass);
      b.drawR = damp(b.drawR, b.r, 7, dt);
      if (b.r > b.biggest) b.biggest = b.r;

      /* wobble + squash + pop springs */
      var vmag = Math.hypot(b.vx, b.vy);
      b.wob += dt * (2.2 + vmag / 46);
      b.wobAmp = damp(b.wobAmp, clamp(vmag / 130, 0.12, 1), 5, dt);
      b.squash = damp(b.squash, 0, 4.5, dt);
      b.popV += (-140 * b.pop - 11 * b.popV) * dt;
      b.pop += b.popV * dt;
      b.pop = clamp(b.pop, -0.35, 0.6);

      /* growth milestones (player fanfare) */
      if (b.isPlayer) {
        while (b.msIdx < CFG.milestones.length && b.drawR >= CFG.milestones[b.msIdx][0]) {
          emit.push({ t: 'milestone', text: CFG.milestones[b.msIdx][1], r: b.drawR });
          b.msIdx++;
        }
        if (b.comboT > 0) { b.comboT -= dt; if (b.comboT <= 0) b.combo = 0; }
      }

      /* storm damage */
      if (sim.storm.active) {
        dx = b.x - sim.storm.cx; dy = b.y - sim.storm.cy;
        if (dx * dx + dy * dy > sim.storm.radius * sim.storm.radius) {
          b.mass *= (1 - 0.085 * dt);
          b.r = massToR(b.mass);
          if (rng() < dt * 6)
            spawnPart('spore', b.x + (rng() - .5) * b.r * 2, b.y + (rng() - .5) * b.r * 2,
                      0, -30, 0.8, 3, '#b48cff');
          if (b.mass <= 7) { stormKill(b); continue; }
        }
      }

      /* pellet eating */
      for (var j = 0; j < sim.pellets.length; j++) {
        var pl = sim.pellets[j];
        if (!pl.active) continue;
        dx = pl.x - b.x; dy = pl.y - b.y;
        var rr = b.r + 3;
        if (dx * dx + dy * dy < rr * rr) eatPellet(b, pl);
      }
    }

    /* --- blob vs blob absorption (66 pairs) --- */
    for (i = 0; i < sim.blobs.length; i++) {
      var a = sim.blobs[i];
      if (!a.alive || a.absorbT > 0) continue;
      for (var m = i + 1; m < sim.blobs.length; m++) {
        var c = sim.blobs[m];
        if (!c.alive || c.absorbT > 0) continue;
        var eater = null, prey = null;
        if (a.r > c.r * CFG.eatRatio) { eater = a; prey = c; }
        else if (c.r > a.r * CFG.eatRatio) { eater = c; prey = a; }
        if (!eater) continue;
        dx = eater.x - prey.x; dy = eater.y - prey.y;
        var er = eater.r * 0.92;
        if (dx * dx + dy * dy < er * er) absorb(eater, prey);
      }
    }

    /* --- absorb animations finish --- */
    for (i = 0; i < sim.blobs.length; i++) {
      b = sim.blobs[i];
      if (!b.alive && b.absorbT > 0) {
        b.absorbT -= dt;
        var e2 = b.absorbedBy;
        if (e2 && e2.alive) {
          var t2 = 1 - Math.max(b.absorbT, 0) / CFG.absorbTime;
          b.x = lerp(b.ax, e2.x, easeOutCubic(t2));
          b.y = lerp(b.ay, e2.y, easeOutCubic(t2));
        }
      }
    }

    /* --- pellet respawns --- */
    for (i = 0; i < sim.pellets.length; i++) {
      var q = sim.pellets[i];
      if (!q.active) {
        q.respawnT -= dt;
        if (q.respawnT <= 0) scatterPellet(q, false);
      }
    }

    /* --- particles & ripples --- */
    for (i = 0; i < sim.parts.length; i++) {
      var pt = sim.parts[i];
      if (!pt.active || pt.kind === 'plankton') {
        if (pt.active) {  /* plankton drift + wrap */
          pt.x += pt.vx * dt; pt.y += pt.vy * dt;
          if (pt.x < -10) pt.x = W + 10; if (pt.x > W + 10) pt.x = -10;
          if (pt.y < -10) pt.y = W + 10; if (pt.y > W + 10) pt.y = -10;
        }
        continue;
      }
      pt.life -= dt;
      if (pt.life <= 0) { pt.active = false; continue; }
      pt.x += pt.vx * dt; pt.y += pt.vy * dt;
      pt.vx *= (1 - 2.4 * dt); pt.vy *= (1 - 2.4 * dt);
    }
    for (i = 0; i < sim.ripples.length; i++) {
      var rp = sim.ripples[i];
      if (!rp.active) continue;
      rp.life -= dt;
      if (rp.life <= 0 || rp.r >= rp.maxR) { rp.active = false; continue; }
      rp.r += rp.vr * dt;
    }

    /* --- feed expiry --- */
    for (i = sim.feed.length - 1; i >= 0; i--)
      if (sim.time - sim.feed[i].t > 5.5) sim.feed.splice(i, 1);
  };

  initPools();
  initPellets();
  initBlobs(false);
  return sim;
}
