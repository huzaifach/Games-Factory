/* RUCKUS RAMPAGE — logic: pure game logic, NO Phaser dependency (unit-testable in node).
   Fighter plain shape:
   {x,y,vx,vy,r,face,wobble,lives,alive,tumbling,tumbleT,grounded,invuln,respawnT,
    weapon:null|{id,uses},up:{},style,speed,power,isPlayer,aiT,think}                */
var RR = (typeof RR !== 'undefined') ? RR : {};

/* ================= physics ================= */
RR.Physics = {
  /* knockback velocity for a hit. Higher wobble = flies farther. */
  hitVelocity: function (baseLaunch, wobble, power, dx, dy) {
    var scale = (1 + wobble / 200) * (power || 1);
    var m = Math.hypot(dx, dy) || 1;
    return { vx: (dx / m) * baseLaunch * scale, vy: (dy / m) * baseLaunch * scale };
  },
  addWobble: function (cur, gain) {
    return Math.min(RR.CFG.WOBBLE_MAX, cur + gain);
  },
  wobbleDecay: function (cur, dt) {
    /* wobble cools down slowly when safe on the ground */
    return Math.max(0, cur - 14 * dt);
  },

  /* arena descriptor (plain data):
     {cx, floorY, halfW, blast:{l,r,t,b}, ropes:{x0,x1,topY}, conveyor:{x0,x1,y,dir,on},
      tiles:[{x0,x1,state}], bumpers:[{x,y,r}]}                                        */
  supportAt: function (arena, x) {
    if (Math.abs(x - arena.cx) > arena.halfW) return false;
    if (arena.tiles) {
      for (var i = 0; i < arena.tiles.length; i++) {
        var t = arena.tiles[i];
        if (x >= t.x0 && x <= t.x1 && t.state === 'gone') return false;
      }
    }
    return true;
  },

  /* one fixed step for a fighter body. Mutates f. Returns events array. */
  step: function (f, arena, dt, cfg) {
    var ev = [];
    if (!f.alive) return ev;
    cfg = cfg || RR.CFG;

    /* timers */
    if (f.invuln > 0) f.invuln -= dt;
    if (f.tumbling) {
      f.tumbleT -= dt;
      if (f.tumbleT <= 0) { f.tumbling = false; f.spin = 0; }
    }

    /* gravity (feather fall = floaty) */
    var grav = cfg.GRAV * (f.up.feather ? 0.45 : 1);
    f.vy += grav * dt;
    if (f.vy > cfg.MAX_FALL) f.vy = cfg.MAX_FALL;

    /* integrate */
    f.x += f.vx * dt;
    f.y += f.vy * dt;

    /* ground: platform top */
    var floorY = arena.floorY, r = f.r;
    f.grounded = false;
    if (f.vy >= 0 && f.y + r >= floorY && f.y + r <= floorY + 46 && this.supportAt(arena, f.x)) {
      f.y = floorY - r; f.vy = 0; f.grounded = true;
      /* ground friction (butter feet = slippery) */
      var fr = cfg.GROUND_FRICTION * (f.up.butter ? 0.25 : 1);
      f.vx -= f.vx * Math.min(1, fr * dt);
      if (Math.abs(f.vx) < 8) f.vx = 0;
      /* conveyor ride */
      if (arena.conveyor && arena.conveyor.on && f.x > arena.conveyor.x0 && f.x < arena.conveyor.x1)
        f.x += arena.conveyor.dir * 170 * dt;
    }
    /* conveyor platform top (raised) */
    if (arena.conveyor && arena.conveyor.on && f.vy >= 0) {
      var cy = arena.conveyor.y;
      if (f.y + r >= cy && f.y + r <= cy + 30 && f.x > arena.conveyor.x0 && f.x < arena.conveyor.x1 && f.y < floorY - 20) {
        f.y = cy - r; f.vy = 0; f.grounded = true;
        f.x += arena.conveyor.dir * 170 * dt;
      }
    }

    /* bumper dhols: bounce away hard */
    if (arena.bumpers) {
      for (var i = 0; i < arena.bumpers.length; i++) {
        var b = arena.bumpers[i];
        var dx = f.x - b.x, dy = f.y - b.y, d = Math.hypot(dx, dy);
        if (d < b.r + r && d > 0.01 && f.bumpCd <= 0) {
          var sp = 1080 * (f.up.belly ? 0.8 : 1);
          f.vx = (dx / d) * sp; f.vy = (dy / d) * sp - 160;
          f.bumpCd = 0.45;
          if (Math.hypot(f.vx, f.vy) > cfg.TUMBLE_SPEED) { f.tumbling = true; f.tumbleT = 0.7; }
          ev.push({ type: 'bumper', f: f });
        }
      }
    }
    if (f.bumpCd > 0) f.bumpCd -= dt;

    /* ropes at platform ends: weak bounce when calm, burst-through when wobbly */
    if (arena.ropes && f.y > arena.ropes.topY && f.y < floorY + 30) {
      var ends = [arena.cx - arena.halfW, arena.cx + arena.halfW];
      for (var ri = 0; ri < 2; ri++) {
        var ex = ends[ri], side = ri === 0 ? -1 : 1;
        if (Math.abs(f.x - ex) < 26 + r) {
          var movingOut = (side === -1 && f.vx < 0) || (side === 1 && f.vx > 0);
          if (movingOut) {
            var speed = Math.abs(f.vx);
            if (f.up.rubber && f.ropeSave !== false) {
              /* RUBBER BODY: bounce off the ropes instead of bursting through */
              f.vx = -f.vx * 0.7; f.vy -= 120; f.x = ex - side * (26 + r + 2);
              f.ropeSave = false; /* one save per... reset on respawn */
              ev.push({ type: 'rope-bounce', f: f, saved: true });
            } else if (speed < 420 && f.wobble <= 130) {
              f.vx = -f.vx * 0.55; f.vy -= 60; f.x = ex - side * (26 + r + 2);
              ev.push({ type: 'rope-bounce', f: f, saved: false });
            } else {
              ev.push({ type: 'rope-burst', f: f });
              /* no velocity change: they fly through to the blast zone */
            }
          }
        }
      }
    }

    /* wobble decay while grounded and calm */
    if (f.grounded && Math.abs(f.vx) < 120 && Math.abs(f.vy) < 1) f.wobble = this.wobbleDecay(f.wobble, dt);

    /* KO: beyond blast lines */
    var bl = arena.blast;
    if (f.x < bl.l || f.x > bl.r || f.y < bl.t || f.y > bl.b) ev.push({ type: 'ko', f: f });
    return ev;
  },

  applyMove: function (f, mx, dt, cfg) {
    cfg = cfg || RR.CFG;
    if (!f.alive || f.tumbling) return;
    var spd = cfg.MOVE * f.speed * (f.up.spring ? 1.25 : 1);
    var target = mx * spd;
    if (f.grounded) {
      f.vx = RR.U.lerp(f.vx, target, Math.min(1, 12 * dt));
    } else {
      f.vx = RR.U.lerp(f.vx, target, Math.min(1, 12 * cfg.AIR_CTRL * dt));
    }
    if (mx !== 0) f.face = mx > 0 ? 1 : -1;
  },

  tryJump: function (f, cfg) {
    cfg = cfg || RR.CFG;
    if (!f.alive || f.tumbling) return false;
    var jumps = f.up.dbljump ? 2 : 1;
    if (f.grounded) { f.jumpsLeft = jumps; }
    if ((f.jumpsLeft || 0) > 0) {
      f.jumpsLeft--;
      f.vy = -cfg.JUMP * (f.up.spring ? 1.18 : 1);
      f.grounded = false;
      return true;
    }
    return false;
  }
};

/* ================= AI ================= */
RR.AI = {
  /* world: {fighters, weapons(loose), arena, time}
     returns {move:-1..1, jump:bool, hit:bool} */
  decide: function (bot, world) {
    var out = { move: 0, jump: false, hit: false };
    if (!bot.alive || bot.tumbling || bot.style === 'dummy') return out;
    bot.aiT -= 0.25;
    if (bot.aiT > 0 && bot.think) return bot.think; /* think 4x per second */
    bot.aiT = 0.25;

    var arena = world.arena;
    var foes = world.fighters.filter(function (o) { return o.alive && o !== bot; });
    if (!foes.length) { bot.think = out; return out; }

    /* nearest foe */
    var target = foes[0], best = Infinity;
    for (var i = 0; i < foes.length; i++) {
      var d = RR.U.dist2(bot.x, bot.y, foes[i].x, foes[i].y);
      if (d < best) { best = d; target = foes[i]; }
    }
    var dx = target.x - bot.x, adx = Math.abs(dx);

    /* loose weapon seeking */
    var wantWeapon = !bot.weapon && bot.style !== 'camper';
    var wpn = null, wbest = 420 * 420;
    if (wantWeapon && world.weapons) {
      for (var w = 0; w < world.weapons.length; w++) {
        var wp = world.weapons[w];
        if (wp.held) continue;
        var wd = RR.U.dist2(bot.x, bot.y, wp.x, wp.y);
        if (wd < wbest) { wbest = wd; wpn = wp; }
      }
    }

    var moveTo = null; /* x to walk toward */
    switch (bot.style) {
      case 'rusher':
        moveTo = wpn && adx > 300 ? wpn.x : target.x;
        break;
      case 'camper':
        if (adx < 300) moveTo = target.x;
        else moveTo = arena.cx + Math.sin(world.time * 0.7) * 60; /* holds middle */
        break;
      case 'trickster':
        if (wpn && !bot.weapon) moveTo = wpn.x;
        else if (adx > 260) moveTo = target.x;
        else moveTo = target.x - RR.U.sign(dx) * 120; /* keeps spacing, feints */
        break;
      case 'heavy':
        moveTo = wpn && adx > 420 ? wpn.x : target.x;
        break;
      case 'coward':
        if (bot.weapon && bot.weapon.id === 'chappal' && adx > 260 && adx < 720) {
          moveTo = bot.x; /* stand and throw */
        } else if (wpn) moveTo = wpn.x;
        else moveTo = bot.x - RR.U.sign(dx) * 300; /* run away */
        break;
    }

    if (moveTo !== null && moveTo !== undefined) {
      var mdx = moveTo - bot.x;
      out.move = Math.abs(mdx) < 12 ? 0 : RR.U.sign(mdx) * (bot.style === 'trickster' && Math.random() < 0.06 ? 2.2 : 1);
      /* trickster dash: sudden burst */
      if (bot.style === 'trickster' && Math.random() < 0.05 && adx < 420 && adx > 140) {
        out.move = RR.U.sign(dx) * 2.4; bot.dashT = 0.22;
      }
    }

    /* edge awareness: don't run off like a lemming */
    var edgeL = arena.cx - arena.halfW + 70, edgeR = arena.cx + arena.halfW - 70;
    if ((bot.x < edgeL && out.move < 0) || (bot.x > edgeR && out.move > 0)) {
      out.move = -out.move * 0.8;
      if (Math.random() < 0.5) out.jump = true;
    }
    /* hop up to higher targets / over gaps */
    if (target.y < bot.y - 90 && Math.random() < 0.6) out.jump = true;
    if (bot.style === 'coward' && Math.random() < 0.1) out.jump = true; /* panic hops */

    /* attack when in range */
    var range = bot.weapon ? RR.WEAPONS[bot.weapon.id].range : 80;
    if (bot.weapon && bot.weapon.id === 'chappal' && bot.style !== 'rusher') {
      if (adx > 240 && adx < 760 && Math.abs(target.y - bot.y) < 200) out.hit = true;
    } else if (adx < range * 0.95 && Math.abs(target.y - bot.y) < 130) {
      out.hit = true;
    }
    /* shockwave clap users clap when crowded */
    if (bot.up.clap && foes.length >= 2) {
      var near = foes.filter(function (o) { return RR.U.dist2(bot.x, bot.y, o.x, o.y) < 260 * 260; });
      if (near.length >= 2 && Math.random() < 0.4) out.hit = true;
    }

    bot.think = out;
    return out;
  }
};

/* ================= draft ================= */
RR.Draft = {
  offer: function (usedIds) {
    var pool = RR.UPGRADES.filter(function (u) { return usedIds.indexOf(u.id) < 0; });
    RR.U.shuffle(pool);
    return pool.slice(0, 3);
  }
};

/* ================= progress / unlocks ================= */
RR.Progress = {
  starsFor: function (won, kos) {
    var s = 1; /* finishing is worth a star */
    if (won) s++;
    if (kos >= 6) s++;
    return s;
  },
  /* returns {costumes:[newly], arenas:[newly]} and mutates save lists */
  checkUnlocks: function (save) {
    var got = { costumes: [], arenas: [] }, i;
    for (i = 0; i < RR.COSTUMES.length; i++) {
      var c = RR.COSTUMES[i];
      if (save.wins >= c.need && save.costumes.indexOf(c.id) < 0) {
        save.costumes.push(c.id); got.costumes.push(c);
      }
    }
    for (i = 0; i < RR.ARENAS.length; i++) {
      var a = RR.ARENAS[i];
      if (save.wins >= a.need && save.arenas.indexOf(a.id) < 0) {
        save.arenas.push(a.id); got.arenas.push(a);
      }
    }
    return got;
  }
};

/* ================= round / match rules ================= */
RR.Rules = {
  aliveCount: function (fighters) {
    return fighters.filter(function (f) { return f.alive && f.lives > 0; }).length;
  },
  /* round over when <=1 fighter still has lives. Returns winner or null. */
  roundWinner: function (fighters) {
    var contenders = fighters.filter(function (f) { return f.lives > 0; });
    if (contenders.length === 1) return contenders[0];
    return null;
  },
  /* time-up: most lives, tiebreak most KOs */
  timeWinner: function (fighters) {
    var best = null;
    for (var i = 0; i < fighters.length; i++) {
      var f = fighters[i];
      if (!best || f.lives > best.lives || (f.lives === best.lives && f.kos > best.kos)) best = f;
    }
    return best;
  }
};

/* ================= kill-feed line builder ================= */
RR.FeedLine = function (kind, a, b, weaponId) {
  var w = weaponId && RR.WEAPONS[weaponId] ? RR.WEAPONS[weaponId].name : 'fists';
  var line = RR.U.choice(RR.FEED[kind] || RR.FEED.melee);
  return line.split('{a}').join(a).split('{b}').join(b).split('{w}').join(w);
};
