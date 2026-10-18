'use strict';
/* WOBBLE WORLD — 04-toys.js : chain-reaction toys for the dioramas.
   Every toy: update(dt, world, game) + draw(ctx, game).
   Toys talk to the game through game.bus events (see BUILD-LEDGER). */

/* ---------------- Trampoline ---------------- */
class Trampoline {
  constructor(x, y, w, power, color) {
    this.x = x; this.y = y; this.w = w;
    this.power = power || 1050;
    this.color = color || '#4ec9b8';
    this.sag = 0; this.sagV = 0;   // membrane spring
    this.cool = {};                // per-creature cooldown
  }
  update(dt, world, game) {
    // membrane spring physics
    const acc = -this.sag * 90 - this.sagV * 8;
    this.sagV += acc * dt;
    this.sag += this.sagV * dt;
    for (const k in this.cool) { this.cool[k] -= dt; if (this.cool[k] <= 0) delete this.cool[k]; }

    for (const b of world.blobs) {
      if (b.dead || b.ridingBubble) continue;
      const c = b.centroid(Trampoline._c);
      const hw = this.w / 2;
      if (Math.abs(c.x - this.x) > hw + b.restR * 0.4) continue;
      const bottom = c.y + b.restR * 0.8;
      if (bottom < this.y - 14 || bottom > this.y + 46) continue;
      const v = b.velocity(dt, Trampoline._v);
      const id = b.userData.cid || (b.userData.cid = Trampoline._cid++);
      if (v.y > 140 && !this.cool[id]) {
        // BOING!
        this.cool[id] = 0.35;
        this.sagV = 9;
        const boost = this.power * (0.75 + b.bounce * 0.5);
        for (let i = 0; i < b.n; i++) {
          const nd = b.nodes[i];
          nd.py = nd.y + boost * dt;
        }
        b.center.py = b.center.y + boost * dt;
        b.squash(0, 1, 0.35);
        game.audio.boing(Util.clamp(v.y / 1200, 0.2, 1));
        game.world.particles.ring(this.x, this.y, '#ffffff', this.w * 0.4);
        game.bus.emit('bounce', { creature: b, toy: this });
      } else if (v.y <= 140) {
        // gentle rest on the membrane
        const targetY = this.y - b.restR * 0.8;
        if (c.y > targetY) {
          const push = (c.y - targetY) * 0.4;
          for (let i = 0; i < b.n; i++) { b.nodes[i].y -= push; }
          b.center.y -= push;
          this.sag = Util.clamp(this.sag + b.restR * 0.002, 0, 1);
        }
      }
    }
  }
  draw(ctx, game) {
    const hw = this.w / 2;
    // legs
    ctx.strokeStyle = '#b08968';
    ctx.lineWidth = 10; ctx.lineCap = 'round';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(this.x + sx * hw * 0.8, this.y + 8);
      ctx.lineTo(this.x + sx * hw * 0.95, this.y + 64);
      ctx.stroke();
    }
    // rim
    ctx.strokeStyle = '#8a5a44';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, hw, 16, 0, 0, TAU);
    ctx.stroke();
    // membrane (sags with spring)
    const sagPx = this.sag * 26;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + sagPx * 0.4, hw - 8, 14 + sagPx * 0.3, 0, 0, TAU);
    const g = ctx.createLinearGradient(0, this.y - 14, 0, this.y + 30);
    g.addColorStop(0, Util.shade(this.color, 30));
    g.addColorStop(1, Util.shade(this.color, -12));
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.95;
    ctx.fill();
    ctx.globalAlpha = 1;
    // coil springs (zigzag, compress with sag)
    ctx.strokeStyle = '#9aa5b1';
    ctx.lineWidth = 4;
    for (const sx of [-1, 1]) {
      const bx = this.x + sx * hw * 0.92;
      const top = this.y - 2 - sagPx * 0.5, bot = this.y + 44;
      ctx.beginPath();
      const segs = 5;
      for (let i = 0; i <= segs; i++) {
        const yy = top + (bot - top) * (i / segs);
        const xx = bx + (i % 2 === 0 ? -7 : 7);
        if (i === 0) ctx.moveTo(bx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
  }
}
Trampoline._c = {};
Trampoline._v = {};
Trampoline._cid = 1;

/* ---------------- DominoTower ---------------- */
class DominoTower {
  constructor(game, x, baseY, count, bw, bh) {
    this.blocks = [];
    this.total = count;
    const colors = ['#ff8fb3', '#7fe3b2'];
    for (let i = 0; i < count; i++) {
      const bx = x + (i % 2 === 0 ? -4 : 4);
      const by = baseY - bh / 2 - i * (bh + 6);
      const blk = new JellyBlock(bx, by, bw, bh, colors[i % 2]);
      blk.userData.index = i;
      this.blocks.push(blk);
      game.world.blocks.push(blk);
    }
  }
  update(dt, world, game) {
    for (const blk of this.blocks) {
      if (!blk.downNotified && blk.isDown()) {
        blk.downNotified = true;
        game.bus.emit('domino-down', { index: blk.userData.index, total: this.total });
        const c = blk.centroid(DominoTower._c);
        game.world.particles.ring(c.x, c.y, '#ffffff', 40);
        game.audio.boing(0.3);
      }
    }
  }
  draw(ctx, game) {
    for (const blk of this.blocks) {
      const n = blk.nodes;
      ctx.beginPath();
      ctx.moveTo(n[0].x, n[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(n[i].x, n[i].y);
      ctx.closePath();
      const c = blk.centroid(DominoTower._c);
      const g = ctx.createLinearGradient(0, c.y - blk.h / 2, 0, c.y + blk.h / 2);
      g.addColorStop(0, Util.shade(blk.color, 32));
      g.addColorStop(1, Util.shade(blk.color, -10));
      ctx.globalAlpha = 0.94;
      ctx.fillStyle = g;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = Util.rgba(Util.shade(blk.color, -30), 0.5);
      ctx.lineWidth = 4;
      ctx.stroke();
      // gloss dot
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(n[0].x + 12, n[0].y + 14, 5, 0, TAU);
      ctx.fill();
    }
  }
}
DominoTower._c = {};

/* ---------------- GooBall (magnet food) ---------------- */
class GooBall extends SoftBlob {
  constructor(x, y) {
    super(x, y, 17, 10, { color: '#dfe8f5', bounce: 0.62, pressure: 0.7, damping: 0.985 });
    this.snapped = null;
    this.userData.isGooBall = true;
  }
  update(dt, world) {
    if (this.snapped) {
      // glued to the magnet: kill all velocity, stay put
      for (let i = 0; i < this.n; i++) {
        const nd = this.nodes[i];
        nd.px = nd.x; nd.py = nd.y;
      }
      this.center.px = this.center.x; this.center.py = this.center.y;
      return 0;
    }
    return super.update(dt, world);
  }
  draw(ctx, game) {
    const c = this.centroid(GooBall._c);
    const pts = [];
    for (let i = 0; i < this.n; i++) pts.push({ x: this.nodes[i].x - c.x, y: this.nodes[i].y - c.y });
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.beginPath();
    ctx.moveTo((pts[0].x + pts[this.n - 1].x) / 2, (pts[0].y + pts[this.n - 1].y) / 2);
    for (let i = 0; i < this.n; i++) {
      const p = pts[i], q = pts[(i + 1) % this.n];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -18, 0, 18);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#dfe8f5');
    g.addColorStop(1, '#9fb2cc');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(-6, -7, 4, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
GooBall._c = {};

/* ---------------- MagnetOrb ---------------- */
class MagnetOrb {
  constructor(x, y, r) {
    this.x = x; this.y = y; this.r = r || 34;
    this.pull = 2600; // px/s^2 at the orb surface
    this.sparkT = 0;
  }
  update(dt, world, game) {
    this.sparkT -= dt;
    if (this.sparkT <= 0) {
      this.sparkT = Util.rand(0.2, 0.6);
      const a = Util.rand(0, TAU);
      world.particles.spawn('sparkle', this.x + Math.cos(a) * this.r, this.y + Math.sin(a) * this.r,
        { life: 0.5, size: 7, color: '#aef3ff' });
    }
    for (const b of world.blobs) {
      if (!(b instanceof GooBall) || b.snapped) continue;
      const c = b.centroid(MagnetOrb._c);
      const dx = this.x - c.x, dy = this.y - c.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 520 && d > 1) {
        // proper acceleration toward the orb (overcomes gravity up close)
        const A = this.pull * (1 - d / 520);
        b.applyImpulse(dx / d * A * dt * dt, dy / d * A * dt * dt);
        // damp swirling so captures settle instead of orbiting forever
        for (let i = 0; i < b.n; i++) {
          const nd = b.nodes[i];
          nd.px += (nd.x - nd.px) * 0.06;
          nd.py += (nd.y - nd.py) * 0.06;
        }
      }
      if (d < this.r + 20) {
        b.snapped = this;
        // stick to orb surface
        const a = Math.atan2(c.y - this.y, c.x - this.x);
        const tx = this.x + Math.cos(a) * (this.r + 14);
        const ty = this.y + Math.sin(a) * (this.r + 14);
        for (let i = 0; i < b.n; i++) {
          const nd = b.nodes[i];
          const ox = nd.x - c.x, oy = nd.y - c.y;
          nd.x = tx + ox * 0.9; nd.y = ty + oy * 0.9;
          nd.px = nd.x; nd.py = nd.y;
        }
        b.center.x = tx; b.center.y = ty;
        b.center.px = tx; b.center.py = ty;
        game.audio.snap();
        for (let i = 0; i < 6; i++) {
          world.particles.spawn('sparkle', tx, ty, { life: 0.6, size: Util.rand(5, 9), color: '#aef3ff', vx: Util.rand(-120, 120), vy: Util.rand(-120, 120) });
        }
        game.bus.emit('snap', { ball: b, orb: this });
      }
    }
  }
  draw(ctx, game) {
    const t = game.time;
    // glow
    const g = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, this.r * 2.6);
    g.addColorStop(0, 'rgba(120,230,255,0.5)');
    g.addColorStop(1, 'rgba(120,230,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 2.6, 0, TAU); ctx.fill();
    // orbit rings
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 12]);
    ctx.lineDashOffset = -t * 40;
    ctx.beginPath(); ctx.ellipse(this.x, this.y, this.r + 22, this.r + 10, 0.4, 0, TAU); ctx.stroke();
    ctx.lineDashOffset = t * 30;
    ctx.beginPath(); ctx.ellipse(this.x, this.y, this.r + 36, this.r + 20, -0.3, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    // orb body
    const bg = ctx.createRadialGradient(this.x - 10, this.y - 12, 4, this.x, this.y, this.r);
    bg.addColorStop(0, '#e8fbff');
    bg.addColorStop(0.55, '#6fdcf5');
    bg.addColorStop(1, '#2fa8cc');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, TAU); ctx.fill();
    // poles
    ctx.fillStyle = '#ff7b8a';
    ctx.beginPath(); ctx.arc(this.x, this.y - this.r * 0.45, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', this.x, this.y - this.r * 0.45);
    ctx.fillStyle = '#6f8cff';
    ctx.beginPath(); ctx.arc(this.x, this.y + this.r * 0.45, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('S', this.x, this.y + this.r * 0.45);
    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.ellipse(this.x - 11, this.y - 14, 9, 5, -0.5, 0, TAU); ctx.fill();
  }
}
MagnetOrb._c = {};

/* ---------------- Seesaw ---------------- */
class Seesaw {
  constructor(game, x, y, len) {
    this.x = x; this.y = y; this.len = len;
    this.angle = 0; this.angVel = 0;
    this.launchCool = 0;
    // live static segment so blobs really ride the plank
    this.seg = game.world.addStatic(x - len / 2, y, x + len / 2, y,
      { bounce: 0.35, friction: 0.06, tag: 'seesaw' });
  }
  update(dt, world, game) {
    this.launchCool -= dt;
    // weight distribution -> target angle
    let torque = 0;
    for (const b of world.blobs) {
      if (b.dead || b.ridingBubble || !(b instanceof Creature)) continue;
      const c = b.centroid(Seesaw._c);
      const dx = c.x - this.x;
      if (Math.abs(dx) < this.len / 2 && Math.abs(c.y - this.y) < 120) {
        torque += Math.sign(dx) * b.restR;
      }
    }
    const target = Util.clamp(torque * 0.004, -0.3, 0.3);
    const acc = (target - this.angle) * 26 - this.angVel * 5.5;
    const prevVel = this.angVel;
    this.angVel += acc * dt;
    this.angle += this.angVel * dt;
    // update the live segment
    const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    this.seg.x1 = this.x - ca * this.len / 2; this.seg.y1 = this.y - sa * this.len / 2;
    this.seg.x2 = this.x + ca * this.len / 2; this.seg.y2 = this.y + sa * this.len / 2;
    // launch: plank whips up fast under a rider
    if (Math.abs(this.angVel) > 2.6 && this.launchCool <= 0 && Math.abs(prevVel) < Math.abs(this.angVel)) {
      for (const b of world.blobs) {
        if (b.dead || b.ridingBubble || !(b instanceof Creature)) continue;
        const c = b.centroid(Seesaw._c);
        const risingSide = this.angVel > 0 ? 1 : -1; // which end moves up
        const dx = c.x - this.x;
        if (Math.sign(dx) === risingSide && Math.abs(dx) > this.len * 0.18 && Math.abs(dx) < this.len / 2 + 40 && Math.abs(c.y - this.y) < 130) {
          this.launchCool = 1.2;
          b.applyImpulse(risingSide * 160 * 0.016, -980 * 0.016);
          b.squash(0, 1, 0.3);
          game.audio.boing(0.9);
          world.particles.ring(c.x, c.y, '#ffffff', 50);
          game.bus.emit('launch', { creature: b, toy: 'seesaw' });
          break;
        }
      }
    }
  }
  draw(ctx, game) {
    // fulcrum: jelly dome
    const fg = ctx.createLinearGradient(0, this.y, 0, this.y + 70);
    fg.addColorStop(0, '#ffb3c6'); fg.addColorStop(1, '#e87f9c');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(this.x, this.y + 8, 44, Math.PI, 0);
    ctx.closePath(); ctx.fill();
    // plank: candy stripes, rotated
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const hw = this.len / 2;
    for (let i = -4; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#ffd166' : '#ff8fa3';
      ctx.fillRect(i * hw / 4, -13, hw / 4, 26);
    }
    ctx.strokeStyle = '#a34d68';
    ctx.lineWidth = 5;
    Util.rr(ctx, -hw, -13, this.len, 26, 13);
    ctx.stroke();
    // end bumpers
    for (const sx of [-1, 1]) {
      ctx.fillStyle = '#ff5d6c';
      ctx.beginPath(); ctx.arc(sx * (hw - 8), 0, 12, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(sx * (hw - 8) - 3, -4, 4, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}
Seesaw._c = {};

/* ---------------- GooPool ---------------- */
class GooPool {
  constructor(x, y, w, color, name) {
    this.x = x; this.y = y; this.w = w;
    this.color = color; this.name = name || 'goo';
    this.rippleT = 0;
    this.wasIn = new Set();
  }
  update(dt, world, game) {
    this.rippleT -= dt;
    if (this.rippleT <= 0) {
      this.rippleT = Util.rand(0.5, 1.1);
      world.particles.spawn('ring', this.x + Util.rand(-this.w / 2, this.w / 2), this.y - 6,
        { life: 0.8, size: Util.rand(14, 26), color: 'rgba(255,255,255,0.7)' });
    }
    for (const b of world.blobs) {
      if (b.dead || b.ridingBubble || !(b instanceof Creature)) continue;
      const c = b.centroid(GooPool._c);
      const inside = Math.abs(c.x - this.x) < this.w / 2 && c.y > this.y - 34 && c.y < this.y + 26;
      const id = b.userData.cid || (b.userData.cid = GooPool._cid++);
      const key = this.name + ':' + id;
      const v = b.velocity(dt, GooPool._v);
      const speed = Math.sqrt(v.x * v.x + v.y * v.y);
      if (inside) {
        // viscous drag + buoyancy
        for (let i = 0; i < b.n; i++) {
          const nd = b.nodes[i];
          nd.px += (nd.x - nd.px) * 0.12;
          nd.py += (nd.y - nd.py) * 0.12 - 26 * dt * dt * 60;
        }
        if (!this.wasIn.has(key)) {
          this.wasIn.add(key);
          game.audio.splash();
          for (let i = 0; i < 8; i++) {
            world.particles.spawn('drip', c.x + Util.rand(-24, 24), this.y - 10,
              { life: 0.7, size: Util.rand(4, 8), color: this.color, vx: Util.rand(-90, 90), vy: Util.rand(-190, -40), grav: 700 });
          }
          world.particles.ring(c.x, this.y - 8, '#ffffff', 46);
          game.bus.emit('splash', { creature: b, speed, pool: this.name });
        }
      } else {
        this.wasIn.delete(key);
      }
    }
  }
  draw(ctx, game) {
    const t = game.time;
    const hw = this.w / 2;
    // basin shadow
    ctx.fillStyle = 'rgba(74,59,92,0.12)';
    Util.ell(ctx, this.x, this.y + 26, hw + 10, 18);
    ctx.fill();
    // goo body: layered ellipses
    ctx.fillStyle = Util.shade(this.color, -22);
    Util.ell(ctx, this.x, this.y + 4, hw, 30);
    ctx.fill();
    const g = ctx.createLinearGradient(0, this.y - 26, 0, this.y + 12);
    g.addColorStop(0, Util.shade(this.color, 26));
    g.addColorStop(1, this.color);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - 6, hw, 26, 0, 0, TAU);
    ctx.fill();
    // animated surface wave
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = -hw + 8; i <= hw - 8; i += 12) {
      const yy = this.y - 12 + Math.sin(t * 3 + i * 0.05) * 4;
      if (i === -hw + 8) ctx.moveTo(this.x + i, yy); else ctx.lineTo(this.x + i, yy);
    }
    ctx.stroke();
    // glossy highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x - hw * 0.35, this.y - 16, hw * 0.3, 7, -0.15, 0, TAU);
    ctx.fill();
    // drips at edges
    ctx.fillStyle = this.color;
    for (let i = 0; i < 3; i++) {
      const dx = -hw + 20 + i * (hw * 2 - 40) / 2;
      const dripLen = 6 + Math.sin(t * 2 + i * 2.1) * 4;
      ctx.beginPath();
      ctx.arc(this.x + dx, this.y + 24 + dripLen, 6, 0, TAU);
      ctx.fill();
    }
  }
}
GooPool._c = {};
GooPool._v = {};
GooPool._cid = 1000;

/* ---------------- BubblePipe + Bubble ---------------- */
class Bubble {
  constructor(x, y, r) {
    this.x = x; this.y = y; this.r = r;
    this.vy = -Util.rand(50, 90);
    this.phase = Util.rand(0, TAU);
    this.dead = false;
    this.carrying = null;
    this.startY = y;
    this.born = 0;
  }
  pop(game, silent) {
    if (this.dead) return;
    this.dead = true;
    if (this.carrying) {
      const cr = this.carrying;
      cr.ridingBubble = null;
      cr.applyImpulse(Util.rand(-60, 60) * 0.016, -260 * 0.016);
      this.carrying = null;
      const rode = this.startY - this.y;
      if (rode >= 240) game.bus.emit('ride', { creature: cr, height: rode });
    }
    if (!silent) {
      game.audio.pop();
      game.world.particles.ring(this.x, this.y, '#ffffff', this.r);
      for (let i = 0; i < 5; i++) {
        game.world.particles.spawn('sparkle', this.x + Util.rand(-14, 14), this.y + Util.rand(-14, 14),
          { life: 0.5, size: 6, color: '#cfeeff' });
      }
      game.bus.emit('pop', { x: this.x, y: this.y });
    }
  }
  update(dt, world, game) {
    this.born += dt;
    this.phase += dt * 3;
    this.x += Math.sin(this.phase) * 26 * dt;
    this.y += this.vy * dt;
    // catch a creature
    if (!this.carrying) {
      for (const b of world.blobs) {
        if (b.dead || b.grabbed || b.ridingBubble || !(b instanceof Creature)) continue;
        const c = b.centroid(Bubble._c);
        if (Util.dist(c.x, c.y, this.x, this.y) < this.r + b.restR * 0.5 && b.restR < this.r * 1.5) {
          this.carrying = b;
          b.ridingBubble = this;
          this.startY = this.y;
          game.audio.squelch();
          break;
        }
      }
    }
    if (this.y < 130 || this.born > 14) this.pop(game);
  }
  draw(ctx, game) {
    const wob = Math.sin(this.phase * 1.3) * 0.05;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1 + wob, 1 - wob);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, this.r, 0, TAU); ctx.stroke();
    // rainbow arc
    ctx.lineWidth = 4;
    const cols = ['#ff9eb0', '#ffd166', '#8fe388', '#7cc7ff'];
    for (let i = 0; i < cols.length; i++) {
      ctx.strokeStyle = cols[i] + '';
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(0, 0, this.r - 4, Math.PI * (1.05 + i * 0.09), Math.PI * (1.45 + i * 0.09));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(-this.r * 0.35, -this.r * 0.4, this.r * 0.18, this.r * 0.1, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
Bubble._c = {};

class BubblePipe {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.timer = 0.5;
    this.bubbles = [];
    this.maxBubbles = 6;
  }
  update(dt, world, game) {
    this.timer -= dt;
    let alive = 0;
    for (const b of this.bubbles) if (!b.dead) alive++;
    if (this.timer <= 0 && alive < this.maxBubbles) {
      this.timer = Util.rand(1.6, 3.0);
      this.bubbles.push(new Bubble(this.x + Util.rand(-8, 8), this.y - 30, Util.rand(34, 52)));
    }
    for (const b of this.bubbles) if (!b.dead) b.update(dt, world, game);
    this.bubbles = this.bubbles.filter(b => !b.dead || b.born < 15);
  }
  // tap a bubble to pop it
  tap(x, y, game) {
    for (const b of this.bubbles) {
      if (!b.dead && Util.dist(x, y, b.x, b.y) < b.r + 14) {
        b.pop(game);
        return true;
      }
    }
    return false;
  }
  draw(ctx, game) {
    // pipe
    const g = ctx.createLinearGradient(this.x - 18, 0, this.x + 18, 0);
    g.addColorStop(0, '#c9a0dc'); g.addColorStop(0.5, '#e6c8f2'); g.addColorStop(1, '#c9a0dc');
    ctx.fillStyle = g;
    Util.rr(ctx, this.x - 18, this.y - 44, 36, 60, 12);
    ctx.fill();
    ctx.fillStyle = '#a87fc2';
    Util.ell(ctx, this.x, this.y - 44, 24, 12);
    ctx.fill();
    for (const b of this.bubbles) if (!b.dead) b.draw(ctx, game);
  }
}

/* ---------------- SpringFlower (launch pad) ---------------- */
class SpringFlower {
  constructor(x, y, power) {
    this.x = x; this.y = y;
    this.power = power || 1250;
    this.dip = 0; this.dipV = 0;
    this.cool = {};
    this.petalHue = Util.pick(['#ff9ebb', '#ffd166', '#c3b2f2']);
  }
  update(dt, world, game) {
    const acc = -this.dip * 120 - this.dipV * 9;
    this.dipV += acc * dt;
    this.dip += this.dipV * dt;
    for (const k in this.cool) { this.cool[k] -= dt; if (this.cool[k] <= 0) delete this.cool[k]; }
    for (const b of world.blobs) {
      if (b.dead || b.ridingBubble || !(b instanceof Creature)) continue;
      const c = b.centroid(SpringFlower._c);
      if (Math.abs(c.x - this.x) > 70) continue;
      const bottom = c.y + b.restR * 0.8;
      if (bottom < this.y - 30 || bottom > this.y + 30) continue;
      const v = b.velocity(dt, SpringFlower._v);
      const id = b.userData.cid || (b.userData.cid = SpringFlower._cid++);
      if (v.y > 120 && !this.cool[id]) {
        this.cool[id] = 0.8;
        this.dipV = -7; // anticipation dip, then launch
        const launch = () => {
          const boost = this.power * (0.8 + b.bounce * 0.4);
          for (let i = 0; i < b.n; i++) b.nodes[i].py = b.nodes[i].y + boost * dt;
          b.center.py = b.center.y + boost * dt;
          b.squash(0, -1, 0.4);
          game.audio.boing(1);
          game.world.particles.ring(this.x, this.y - 20, '#ffffff', 60);
          for (let i = 0; i < 8; i++) {
            game.world.particles.spawn('star', this.x + Util.rand(-20, 20), this.y - 30,
              { life: 0.6, size: Util.rand(5, 9), color: this.petalHue, vx: Util.rand(-120, 120), vy: Util.rand(-200, -60), grav: 400, rot: Util.rand(0, 6), vr: 5 });
          }
          game.bus.emit('launch', { creature: b, toy: 'flower' });
        };
        // tiny anticipation delay via dip timer
        this._pending = { t: 0.12, fn: launch };
      }
    }
    if (this._pending) {
      this._pending.t -= dt;
      if (this._pending.t <= 0) { const f = this._pending.fn; this._pending = null; f(); }
    }
  }
  draw(ctx, game) {
    const dipPx = this.dip * 8;
    // stem
    ctx.strokeStyle = '#5da85f';
    ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + 90);
    ctx.quadraticCurveTo(this.x + 14, this.y + 40, this.x, this.y + dipPx);
    ctx.stroke();
    // leaves
    ctx.fillStyle = '#7cc47f';
    for (const sx of [-1, 1]) {
      ctx.save();
      ctx.translate(this.x + sx * 22, this.y + 52);
      ctx.rotate(sx * 0.6);
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 10, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // petals
    const py = this.y + dipPx;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + game.time * 0.1;
      ctx.fillStyle = this.petalHue;
      ctx.beginPath();
      ctx.ellipse(this.x + Math.cos(a) * 30, py + Math.sin(a) * 30, 20, 13, a, 0, TAU);
      ctx.fill();
    }
    // bud (the trampoline)
    const bg = ctx.createRadialGradient(this.x - 8, py - 10, 4, this.x, py, 26);
    bg.addColorStop(0, '#fff3b0'); bg.addColorStop(1, '#ffb14e');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(this.x, py, 24 + this.dip * 2, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(this.x - 8, py - 9, 6, 0, TAU); ctx.fill();
  }
}
SpringFlower._c = {};
SpringFlower._v = {};
SpringFlower._cid = 2000;

/* ---------------- Pillow ---------------- */
class Pillow {
  constructor(game, x, y, w, h, rot, color, index) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.rot = rot || 0;
    this.color = color || '#ffe3ef';
    this.index = index || 0;
    this.squashT = 0;
    this.cool = 0;
    this.breathe = Util.rand(0, TAU);
    // top surface as a static segment (rotated)
    const ca = Math.cos(rot), sa = Math.sin(rot);
    const hw = w / 2;
    game.world.addStatic(
      x - ca * hw, y - sa * hw - h * 0.35,
      x + ca * hw, y + sa * hw - h * 0.35,
      { bounce: 0.22, friction: 0.12, tag: 'pillow' });
  }
  update(dt, world, game) {
    this.breathe += dt;
    if (this.squashT > 0) this.squashT = Math.max(0, this.squashT - dt * 3);
    this.cool -= dt;
    if (this.cool > 0) return;
    for (const b of world.blobs) {
      if (b.dead || b.ridingBubble || !(b instanceof Creature)) continue;
      const c = b.centroid(Pillow._c);
      const v = b.velocity(dt, Pillow._v);
      const local = {
        x: (c.x - this.x) * Math.cos(-this.rot) - (c.y - this.y) * Math.sin(-this.rot),
        y: (c.x - this.x) * Math.sin(-this.rot) + (c.y - this.y) * Math.cos(-this.rot)
      };
      if (Math.abs(local.x) < this.w / 2 && local.y > -this.h && local.y < 20 && v.y > 160) {
        this.cool = 0.6;
        this.squashT = 1;
        game.audio.splat(false);
        world.particles.spawn('poof', c.x, this.y - this.h / 2, { life: 0.5, size: 24, color: '#ffffff' });
        game.bus.emit('pillow', { creature: b, pillowIndex: this.index });
        break;
      }
    }
  }
  draw(ctx, game) {
    const br = 1 + Math.sin(this.breathe * 2.4) * 0.012; // cozy breathing
    const sq = 1 - this.squashT * 0.22;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.scale(br, br * sq);
    // shadow
    ctx.fillStyle = 'rgba(74,59,92,0.14)';
    Util.ell(ctx, 0, this.h / 2 + 12, this.w / 2, 12);
    ctx.fill();
    // body
    const g = ctx.createLinearGradient(0, -this.h / 2, 0, this.h / 2);
    g.addColorStop(0, Util.shade(this.color, 18));
    g.addColorStop(1, Util.shade(this.color, -8));
    ctx.fillStyle = g;
    Util.rr(ctx, -this.w / 2, -this.h / 2, this.w, this.h, 34);
    ctx.fill();
    ctx.strokeStyle = Util.rgba(Util.shade(this.color, -24), 0.6);
    ctx.lineWidth = 4;
    Util.rr(ctx, -this.w / 2, -this.h / 2, this.w, this.h, 34);
    ctx.stroke();
    // seam
    ctx.strokeStyle = Util.rgba(Util.shade(this.color, -18), 0.8);
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    Util.rr(ctx, -this.w / 2 + 14, -this.h / 2 + 14, this.w - 28, this.h - 28, 24);
    ctx.stroke();
    ctx.setLineDash([]);
    // button dimples
    ctx.fillStyle = Util.rgba(Util.shade(this.color, -20), 0.7);
    for (const bx of [-this.w / 5, this.w / 5]) {
      ctx.beginPath(); ctx.arc(bx, 0, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(bx - 2, -2, 2.5, 0, TAU); ctx.fill();
      ctx.fillStyle = Util.rgba(Util.shade(this.color, -20), 0.7);
    }
    ctx.restore();
  }
}
Pillow._c = {};
Pillow._v = {};

/* ---------------- GooJar (paint station) ---------------- */
class GooJar {
  constructor(x, y, goo) {
    this.x = x; this.y = y;
    this.goo = goo; // {hex, name, ...}
    this.bob = Util.rand(0, TAU);
  }
  update(dt, world, game) { this.bob += dt * 2; }
  tap(game) {
    if (game.selectedGoo === this.goo) {
      game.selectedGoo = null;
    } else {
      game.selectedGoo = this.goo;
      game.audio.uiClick();
      game.toast('Tap a friend to paint it ' + this.goo.name + '!');
    }
    game.bus.emit('jar-select', { goo: this.goo });
    return true;
  }
  draw(ctx, game) {
    const selected = game.selectedGoo === this.goo;
    const bobY = Math.sin(this.bob) * 4;
    const y = this.y + bobY;
    if (selected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.setLineDash([12, 10]);
      ctx.lineDashOffset = -game.time * 50;
      ctx.beginPath(); ctx.arc(this.x, y - 10, 52, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }
    // shadow
    ctx.fillStyle = 'rgba(74,59,92,0.12)';
    Util.ell(ctx, this.x, this.y + 52, 40, 10);
    ctx.fill();
    // jar glass
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    Util.rr(ctx, this.x - 34, y - 44, 68, 88, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 4;
    Util.rr(ctx, this.x - 34, y - 44, 68, 88, 16);
    ctx.stroke();
    // goo fill with meniscus
    ctx.fillStyle = this.goo.hex;
    ctx.beginPath();
    ctx.moveTo(this.x - 28, y + 38);
    ctx.lineTo(this.x - 28, y - 8);
    ctx.quadraticCurveTo(this.x, y - 18 + Math.sin(game.time * 3) * 3, this.x + 28, y - 8);
    ctx.lineTo(this.x + 28, y + 38);
    ctx.quadraticCurveTo(this.x, y + 46, this.x - 28, y + 38);
    ctx.closePath();
    ctx.fill();
    // glass shine
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(this.x - 26, y - 36, 10, 66);
    // lid
    ctx.fillStyle = '#b08968';
    Util.rr(ctx, this.x - 38, y - 60, 76, 20, 8);
    ctx.fill();
    // label
    ctx.fillStyle = '#ffffff';
    Util.rr(ctx, this.x - 26, y + 2, 52, 24, 10);
    ctx.fill();
    ctx.fillStyle = '#4a3b5c';
    ctx.font = 'bold 13px "Baloo 2", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.goo.name, this.x, y + 14);
  }
}
