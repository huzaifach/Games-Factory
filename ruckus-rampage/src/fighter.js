/* RUCKUS RAMPAGE — fighter: chunky blob brawler with springy limbs, ragdoll tumble,
   squash-and-stretch, costumes, attacks. Rendering = Phaser Graphics in a Container. */
var RR = (typeof RR !== 'undefined') ? RR : {};

RR.makeFighter = function (scene, def) {
  var CFG = RR.CFG;
  var f = {
    id: def.id, name: def.name, color: def.color, style: def.style || 'rusher',
    speed: def.speed || 1, power: def.power || 1, isPlayer: !!def.isPlayer,
    x: def.x, y: def.y, vx: 0, vy: 0, r: 34,
    face: def.face || 1, wobble: 0, lives: CFG.LIVES, alive: true,
    tumbling: false, tumbleT: 0, spin: 0, spinV: 0,
    grounded: false, invuln: 0, respawnT: 0, bumpCd: 0,
    weapon: null, up: {}, jumpsLeft: 1,
    attackCd: 0, attackT: 0, punchT: 0, punchDir: 1, magnetT: 0, magnetVictim: null,
    aiT: Math.random() * 0.25, think: null, dashT: 0,
    limbPhase: Math.random() * 6, landSquash: 0, hitFlash: 0,
    kos: 0, deaths: 0, lastHitBy: null, ropeSave: true,
    limbs: { la: 0.6, ra: -0.6, ll: 0.4, rl: -0.4 }, /* limb angles */
    costume: def.costume || 'none'
  };

  /* --- rendering: container so tumble-spin rotates everything --- */
  var c = scene.add.container(f.x, f.y).setDepth(50);
  var g = scene.add.graphics();
  var nameTxt = scene.add.text(0, -92, f.name, {
    fontFamily: CFG.FONT, fontSize: '17px', color: '#ffffff', fontStyle: 'bold',
    stroke: '#14102e', strokeThickness: 4
  }).setOrigin(0.5);
  var wobTxt = scene.add.text(0, 46, '', {
    fontFamily: CFG.FONT, fontSize: '15px', color: '#ffd23f', fontStyle: 'bold',
    stroke: '#14102e', strokeThickness: 3
  }).setOrigin(0.5);
  c.add([g, nameTxt, wobTxt]);
  f.view = c; f.g = g; f.nameTxt = nameTxt; f.wobTxt = wobTxt;
  f._wobTick = 0;

  /* ---------------- per-frame ---------------- */
  f.update = function (dt, world) {
    var fx = world.fx;
    if (!f.alive) { f.view.setVisible(false); return; }
    f.view.setVisible(true);

    /* control */
    var ctl = f.isPlayer ? world.playerCtl : RR.AI.decide(f, world);
    var mv = ctl.move;
    if (!isFinite(mv)) mv = 0; /* never let a bad input NaN the physics */
    if (f.dashT > 0) { f.dashT -= dt; mv *= 1.6; }
    RR.Physics.applyMove(f, RR.U.clamp(mv, -1.6, 1.6), dt, CFG);
    if (ctl.jump) { if (RR.Physics.tryJump(f, CFG)) world.audio.jump(); }
    if (ctl.hit) f.tryAttack(world);

    if (f.attackCd > 0) f.attackCd -= dt;
    if (f.attackT > 0) f.attackT -= dt;
    if (f.punchT > 0) f.punchT -= dt;
    if (f.hitFlash > 0) f.hitFlash -= dt;
    if (f.landSquash > 0) f.landSquash -= dt * 3;

    /* magnet pull phase */
    if (f.magnetT > 0 && f.magnetVictim && f.magnetVictim.alive) {
      f.magnetT -= dt;
      var v = f.magnetVictim;
      v.vx = RR.U.lerp(v.vx, (f.x - v.x) * 9, Math.min(1, 10 * dt));
      v.vy = RR.U.lerp(v.vy, (f.y - 30 - v.y) * 9, Math.min(1, 10 * dt));
      if (f.magnetT <= 0) {
        var dx = v.x - f.x, dy = v.y - f.y;
        f.applyHit(v, RR.WEAPONS.magnet, dx, dy || -1, world, true);
        fx.ring(f.x, f.y - 20, 0xff2e88);
      }
    }

    var wasGrounded = f.grounded;
    var evs = RR.Physics.step(f, world.arena, dt, CFG);
    if (!wasGrounded && f.grounded && f.vy === 0) {
      f.landSquash = 1; world.audio.land();
      /* heavy belly body-slam: landing near a foe shoves them */
      if (f.up.belly) {
        for (var i = 0; i < world.fighters.length; i++) {
          var o = world.fighters[i];
          if (o !== f && o.alive && Math.abs(o.x - f.x) < 90 && Math.abs(o.y - f.y) < 80)
            f.applyHit(o, { wobble: 60, launch: 520, name: 'BELLY' }, o.x - f.x, -0.6, world, false);
        }
        fx.dust(f.x, f.y + f.r);
      }
    }
    for (var e = 0; e < evs.length; e++) {
      var ev = evs[e];
      if (ev.type === 'bumper') {
        world.audio.boing(); fx.burst(f.x, f.y, 0x29f3ff, 10, 'BOING!');
        fx.word('BOING!', f.x, f.y - 60, '#29f3ff');
        world.feed(RR.FeedLine('hazard', f.name, f.name));
      } else if (ev.type === 'rope-bounce') {
        world.audio.ropeTwang(); RR.Arena.wobbleRopes();
        if (ev.saved) fx.word('SAVED BY RUBBER!', f.x, f.y - 60, '#b8e62e');
      } else if (ev.type === 'rope-burst') {
        RR.Arena.snapRopes();
      } else if (ev.type === 'ko') {
        world.onKO(f);
      }
    }

    /* tumble spin */
    if (f.tumbling) f.spin += f.spinV * dt;
    else f.spin = RR.U.lerp(f.spin, 0, Math.min(1, 10 * dt));

    f.limbPhase += dt * (4 + Math.min(10, Math.abs(f.vx) / 60));
    f._updateLimbs(dt);
    f.view.setPosition(f.x, f.y);
    f.view.setRotation(f.spin);
    f._draw(world.time);

    /* wobble text at 10Hz */
    f._wobTick -= dt;
    if (f._wobTick <= 0) {
      f._wobTick = 0.1;
      f.wobTxt.setText(f.wobble > 5 ? Math.round(f.wobble) + '%' : '');
      f.wobTxt.setColor(f.wobble > 250 ? '#ff5d5d' : (f.wobble > 120 ? '#ffd23f' : '#b8e62e'));
    }
  };

  f._updateLimbs = function (dt) {
    var L = f.limbs, ph = f.limbPhase, t = { la: 0.7, ra: -0.7, ll: 0.5, rl: -0.5 };
    if (f.tumbling) {
      t.la = Math.sin(ph * 6) * 2.4; t.ra = Math.cos(ph * 5.2) * 2.4;
      t.ll = Math.sin(ph * 5.6 + 2) * 2.2; t.rl = Math.cos(ph * 6.3 + 1) * 2.2;
    } else if (!f.grounded) {
      t.la = -2.4; t.ra = -2.4; t.ll = 0.9; t.rl = 0.5; /* arms up! */
    } else if (Math.abs(f.vx) > 40) {
      var s = Math.sin(ph * 2.2);
      t.la = s * 1.1; t.ra = -s * 1.1; t.ll = -s * 0.9; t.rl = s * 0.9;
    } else {
      t.la = 0.7 + Math.sin(ph * 0.8) * 0.12; t.ra = -0.7 - Math.sin(ph * 0.8) * 0.12;
      t.ll = 0.45; t.rl = -0.45;
    }
    if (f.attackT > 0.22) { t.ra = -2.2 * f.face; t.la = 0.4; } /* windup */
    var k = Math.min(1, 16 * dt);
    L.la = RR.U.lerp(L.la, t.la, k); L.ra = RR.U.lerp(L.ra, t.ra, k);
    L.ll = RR.U.lerp(L.ll, t.ll, k); L.rl = RR.U.lerp(L.rl, t.rl, k);
  };

  /* ---------------- attacks ---------------- */
  f.tryAttack = function (world) {
    if (f.attackCd > 0 || !f.alive || f.tumbling) return;
    f.attackCd = CFG.ATTACK_CD; f.attackT = 0.32;
    var w = f.weapon, fx = world.fx;
    if (!w) { /* fists: quick bonk */
      var launched = f.up.belly ? 1.35 : 1;
      f._meleeHit(world, 82, { wobble: 40, launch: 380 * launched, name: 'FISTS' }, f.face, -0.35);
      world.audio.thwack(false);
      return;
    }
    var def = RR.WEAPONS[w.id];
    if (w.id === 'chappal') {
      world.weapons.throwChappal(f, world);
      f.weapon = null; world.audio.slap();
      fx.word('CHAPPAL!', f.x, f.y - 70, '#ffd23f');
      return;
    }
    if (w.id === 'magnet') {
      var v = world.nearestFoe(f, def.range);
      if (v) {
        f.magnetT = 0.38; f.magnetVictim = v;
        world.audio.magnetZap();
        fx.ring(f.x, f.y - 20, 0xff2e88);
        fx.word('COME HERE!', f.x, f.y - 70, '#ff2e88');
      } else { fx.word('NO ONE CLOSE!', f.x, f.y - 70, '#8a8f9d'); }
      f._useWeapon(world);
      return;
    }
    if (w.id === 'glove') {
      f.punchT = 0.28; f.punchDir = f.face;
      world.audio.springPunch();
      var hitAny = f._meleeHit(world, def.range, def, f.face, -0.25);
      if (hitAny) world.onBigHit(f, f._lastVictim, w.id);
      f._useWeapon(world);
      return;
    }
    /* stick / pillow melee */
    var up = f.face, arc = -0.45;
    if (w.id === 'stick') world.audio.thwack(true); else world.audio.poof();
    var hit = f._meleeHit(world, def.range, def, up, arc);
    if (w.id === 'pillow' && hit) fx.feathers(f._lastVictim.x, f._lastVictim.y);
    if (hit) world.onBigHit(f, f._lastVictim, w.id);
    f._useWeapon(world);
  };

  /* melee arc check in facing direction; returns true if anyone hit */
  f._meleeHit = function (world, range, def, dirx, diry, skipFx) {
    var hitAny = false;
    for (var i = 0; i < world.fighters.length; i++) {
      var o = world.fighters[i];
      if (o === f || !o.alive || o.invuln > 0) continue;
      var dx = o.x - f.x, dy = o.y - f.y;
      var d = Math.hypot(dx, dy);
      var inFront = (dirx * dx) >= -20;
      if (d < range + o.r && inFront && Math.abs(dy) < 130) {
        f.applyHit(o, def, dx, dy, world, false, skipFx);
        hitAny = true; f._lastVictim = o;
      }
    }
    /* shockwave clap: radial shove on every attack */
    if (f.up.clap && !skipFx) {
      for (var j = 0; j < world.fighters.length; j++) {
        var p = world.fighters[j];
        if (p === f || !p.alive || p.invuln > 0) continue;
        var px = p.x - f.x, py = p.y - f.y, pd = Math.hypot(px, py);
        if (pd < 210 && pd > 1) {
          f.applyHit(p, { wobble: 45, launch: 430, name: 'CLAP' }, px / pd, py / pd - 0.3, world, false, true);
          hitAny = true;
        }
      }
      world.fx.ring(f.x, f.y, 0xffffff);
      world.audio.thwack(true);
    }
    return hitAny;
  };

  f.applyHit = function (victim, def, dx, dy, world, isSlam, quiet) {
    var m = Math.hypot(dx, dy) || 1;
    var bellyMul = victim.up.belly ? 0.7 : 1;         /* heavy belly: harder to launch */
    var bigHead = f.up.bighead ? 1.15 : 1;
    var vel = RR.Physics.hitVelocity(def.launch * bellyMul * bigHead, victim.wobble, f.power, dx / m, dy / m - 0.25);
    victim.vx = vel.vx; victim.vy = vel.vy - 120;
    victim.wobble = RR.Physics.addWobble(victim.wobble, def.wobble * (victim.up.belly ? 0.8 : 1));
    victim.lastHitBy = f; victim.hitFlash = 0.18; victim.grounded = false;
    var spd = Math.hypot(victim.vx, victim.vy);
    if (spd > CFG.TUMBLE_SPEED && !isSlam) {
      victim.tumbling = true; victim.tumbleT = 0.7;
      victim.spinV = RR.U.sign(victim.vx || 1) * RR.U.rand(7, 12);
    }
    if (!quiet) {
      var mx = (f.x + victim.x) / 2, my = (f.y + victim.y) / 2 - 20;
      world.fx.burst(mx, my, 0xffffff, 10);
      world.fx.burst(mx, my, 0xffd23f, 6);
      world.fx.hitpause(0.07);
      world.shake(0.004 + Math.min(0.012, spd / 90000));
    }
  };

  f._useWeapon = function (world) {
    if (!f.weapon) return;
    if (f.weapon.uses > 0) {
      f.weapon.uses--;
      if (f.weapon.uses <= 0) {
        world.fx.word('BROKE!', f.x, f.y - 70, '#8a8f9d');
        world.fx.poof(f.x, f.y - 20);
        f.weapon = null;
      }
    }
  };

  f.knockOut = function () {
    f.lives--; f.deaths++;
    f.alive = f.lives > 0;
    f.tumbling = false; f.spin = 0; f.wobble = 0;
    f.weapon = null; f.magnetT = 0; f.magnetVictim = null;
    if (f.alive) { f.respawnT = CFG.RESPAWN_TIME; }
  };
  f.respawn = function (x, y) {
    f.x = x; f.y = y; f.vx = 0; f.vy = 0;
    f.invuln = CFG.INVULN_TIME; f.ropeSave = true; f.jumpsLeft = 1;
  };

  /* ---------------- drawing ---------------- */
  f._draw = function (time) {
    var g = f.g; g.clear();
    if (f.invuln > 0 && Math.floor(time * 12) % 2 === 0) return; /* blink */
    var r = f.r * (f.up.bighead ? 1.12 : 1);
    var spd = Math.hypot(f.vx, f.vy);

    /* squash & stretch */
    var sx = 1, sy = 1;
    if (!f.grounded && spd > 200) { var st = Math.min(0.28, spd / 4500); sx = 1 - st; sy = 1 + st; }
    if (f.landSquash > 0) { sx = 1 + 0.3 * f.landSquash; sy = 1 - 0.3 * f.landSquash; }
    if (f.attackT > 0.22) { sx = 0.92; sy = 1.08; } /* windup stretch */

    var dark = Phaser.Display.Color.IntegerToColor(f.color).darken(22).color;
    var light = Phaser.Display.Color.IntegerToColor(f.color).lighten(28).color;

    /* wobble ring */
    if (f.wobble > 5) {
      var wc = f.wobble > 250 ? 0xff5d5d : (f.wobble > 120 ? 0xffd23f : 0xb8e62e);
      g.lineStyle(4 + Math.min(4, f.wobble / 120), wc, 0.85);
      var wr = r + 9 + Math.sin(time * 9) * 2.5;
      g.strokeEllipse(0, 0, wr * 2, wr * 2 * 0.92);
    }

    /* shadow blob on... skip (arena draws blob shadows) */

    /* limbs behind body */
    f._limb(g, -1, f.limbs.la, f.limbs.ll, r, dark, time, true);
    f._limb(g, 1, f.limbs.ra, f.limbs.rl, r, dark, time, true);

    /* body */
    var bodyCol = f.hitFlash > 0 ? 0xffffff : f.color;
    g.fillStyle(bodyCol, 1);
    g.fillEllipse(0, 0, r * 2 * sx, r * 2 * sy);
    /* belly highlight */
    g.fillStyle(light, 0.55);
    g.fillEllipse(-r * 0.25 * sx, r * 0.28 * sy, r * 1.05 * sx, r * 0.75 * sy);

    /* heavy belly upgrade: bigger belly */
    if (f.up.belly) {
      g.fillStyle(bodyCol, 1);
      g.fillEllipse(0, r * 0.32 * sy, r * 1.5 * sx, r * 0.8 * sy);
    }

    /* arms in front */
    f._limb(g, -1, f.limbs.la, f.limbs.ll, r, dark, time, false);
    f._limb(g, 1, f.limbs.ra, f.limbs.rl, r, dark, time, false);

    /* spring-glove punch extension */
    if (f.punchT > 0) {
      var ext = (0.28 - f.punchT) / 0.28;
      var px = f.punchDir * (r + ext * 200), py = -10;
      g.lineStyle(14, dark, 1); g.lineBetween(r * 0.5 * f.punchDir, -6, px, py);
      g.fillStyle(0xff5d5d, 1); g.fillCircle(px, py, 24);
      g.fillStyle(0xffffff, 0.7); g.fillCircle(px - 6, py - 6, 8);
    }

    /* face */
    var ex = f.face * 9, ey = -10 * sy;
    if (f.tumbling) {
      g.lineStyle(4, 0x14102e, 1);
      var eyy = ey;
      g.lineBetween(ex - 20 - 6, eyy - 6, ex - 20 + 6, eyy + 6);
      g.lineBetween(ex - 20 + 6, eyy - 6, ex - 20 - 6, eyy + 6);
      g.lineBetween(ex + 4 - 6, eyy - 6, ex + 4 + 6, eyy + 6);
      g.lineBetween(ex + 4 + 6, eyy - 6, ex + 4 - 6, eyy + 6);
      g.fillStyle(0x14102e, 1); g.fillEllipse(ex - 8, ey + 18, 16, 20); /* O mouth */
    } else {
      var lookY = RR.U.clamp(f.vy / 900, -1, 1) * 4;
      g.fillStyle(0xffffff, 1);
      g.fillCircle(ex - 13, ey, 10.5); g.fillCircle(ex + 13, ey, 10.5);
      g.fillStyle(0x14102e, 1);
      g.fillCircle(ex - 13 + f.face * 3.5, ey + lookY, 4.6);
      g.fillCircle(ex + 13 + f.face * 3.5, ey + lookY, 4.6);
      /* brows by personality */
      g.lineStyle(4, 0x14102e, 0.9);
      if (f.style === 'rusher' || f.style === 'heavy') {
        g.lineBetween(ex - 20, ey - 16, ex - 7, ey - 10);
        g.lineBetween(ex + 20, ey - 16, ex + 7, ey - 10);
      } else if (f.style === 'coward') {
        g.lineBetween(ex - 20, ey - 10, ex - 7, ey - 16);
        g.lineBetween(ex + 20, ey - 10, ex + 7, ey - 16);
      }
      /* mouth */
      if (f.hitFlash > 0) { g.fillStyle(0x14102e, 1); g.fillEllipse(ex, ey + 22, 15, 18); }
      else { g.lineStyle(3.5, 0x14102e, 0.9); g.beginPath(); g.arc(ex, ey + 12, 9, 0.15 * Math.PI, 0.85 * Math.PI); g.strokePath(); }
    }

    /* lives pips */
    for (var li = 0; li < CFG.LIVES; li++) {
      g.fillStyle(li < f.lives ? 0xff5d7a : 0xffffff, li < f.lives ? 1 : 0.22);
      g.fillCircle((li - 1) * 20, -r - 34, 7);
    }

    /* player marker */
    if (f.isPlayer) {
      g.fillStyle(0xffd23f, 1);
      var by = -r - 74 + Math.sin(time * 5) * 3;
      g.fillTriangle(-11, by, 11, by, 0, by + 13);
    }

    /* costume headgear */
    f._costume(g, r, sx, sy, time);

    /* held weapon icon at hand */
    if (f.weapon) {
      var hx = f.face * (r + 16), hy = -6;
      g.fillStyle(0x14102e, 0.35); g.fillCircle(hx, hy, 16);
      RR.Weapons.drawIcon(g, f.weapon.id, hx, hy, 0.8);
      if (f.weapon.uses > 0) {
        for (var ui = 0; ui < f.weapon.uses; ui++) {
          g.fillStyle(0xffd23f, 1); g.fillCircle(hx - 14 + ui * 11, hy - 26, 4);
        }
      }
    }
  };

  f._limb = function (g, side, armA, legA, r, col, time, back) {
    g.lineStyle(11, col, 1);
    if (back) {
      var sx = side * r * 0.55, sy2 = r * 0.35;
      var hx = sx + Math.cos(armA) * 26 * side, hy = sy2 + Math.sin(armA) * 26;
      g.lineBetween(sx, sy2, hx, hy);
      g.fillStyle(col, 1); g.fillCircle(hx, hy, 8);
    } else {
      /* legs */
      var lx = side * r * 0.4, ly = r * 0.8;
      var fx2 = lx + Math.sin(legA) * 24 * side, fy = ly + Math.abs(Math.cos(legA)) * 22 + 6;
      g.lineBetween(lx, ly, fx2, fy);
      g.fillStyle(col, 1); g.fillEllipse(fx2, fy, 20, 12);
    }
  };

  f._costume = function (g, r, sx, sy, time) {
    var top = -r * sy;
    if (f.costume === 'bandana') {
      g.fillStyle(0xd92626, 1);
      g.fillEllipse(0, top + 2, r * 1.7 * sx, 22);
      g.fillTriangle(r * 0.7 * sx, top + 6, r * 1.15 * sx, top - 6, r * 0.85 * sx, top + 22);
    } else if (f.costume === 'turban') {
      g.fillStyle(0xffd23f, 1);
      g.fillEllipse(0, top - 2, r * 1.5 * sx, 34);
      g.fillStyle(0xff9f1c, 1); g.fillEllipse(0, top + 8, r * 1.1 * sx, 18);
      g.fillStyle(0xff2e88, 1); g.fillCircle(0, top - 22, 7);
    } else if (f.costume === 'pirate') {
      g.fillStyle(0x1a1a22, 1);
      g.fillTriangle(-r * 0.9 * sx, top + 10, r * 0.9 * sx, top + 10, 0, top - 30);
      g.fillStyle(0xffffff, 1); g.fillCircle(0, top - 8, 7);
      g.fillStyle(0x1a1a22, 1);
      g.fillCircle(-2.5, top - 9, 2.2); g.fillCircle(2.5, top - 9, 2.2);
    } else if (f.costume === 'crown') {
      g.fillStyle(0xffd23f, 1);
      var cw = r * 1.1 * sx;
      g.fillTriangle(-cw / 2, top + 8, -cw / 4, top - 22, 0, top + 8);
      g.fillTriangle(-cw / 4, top + 8, 0, top - 26, cw / 4, top + 8);
      g.fillTriangle(0, top + 8, cw / 4, top - 22, cw / 2, top + 8);
      g.fillStyle(0xff2e88, 1); g.fillCircle(0, top - 2, 5);
    }
  };

  return f;
};
