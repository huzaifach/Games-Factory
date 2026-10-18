'use strict';
/* WOBBLE WORLD — 02-physics.js : custom 2D soft-body engine.
   Verlet integration + position-based dynamics (distance constraints +
   area-pressure constraint). Stable on phones: fixed timestep, dt clamp,
   zero hot-loop allocation. No library. */

class PNode {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.px = x; this.py = y;
    this.pinned = false;
  }
  vel(dt) { return { x: (this.x - this.px) / dt, y: (this.y - this.py) / dt }; }
}

class Spring {
  constructor(a, b, rest, stiffness) {
    this.a = a; this.b = b;
    this.rest = rest;
    this.k = (stiffness === undefined) ? 1 : stiffness;
  }
  solve() {
    const a = this.a, b = this.b;
    let dx = b.x - a.x, dy = b.y - a.y;
    let d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1e-6) return;
    const diff = (d - this.rest) / d * 0.5 * this.k;
    const wa = a.pinned ? 0 : 1, wb = b.pinned ? 0 : 1;
    const sum = wa + wb;
    if (sum === 0) return;
    const fa = wa / sum, fb = wb / sum;
    a.x += dx * diff * fa;
    a.y += dy * diff * fa;
    b.x -= dx * diff * fb;
    b.y -= dy * diff * fb;
  }
}

/* SoftBlob — a ring of nodes + center node, held together by ring springs,
   spoke springs and an area-pressure constraint. This is the jelly. */
class SoftBlob {
  constructor(x, y, r, n, opts) {
    opts = opts || {};
    this.n = Math.max(6, n | 0);
    this.restR = r;
    this.color = opts.color || '#ff8fb3';
    this.bounce = (opts.bounce === undefined) ? 0.55 : opts.bounce;
    this.pressure = (opts.pressure === undefined) ? 0.55 : opts.pressure;
    this.damping = (opts.damping === undefined) ? 0.985 : opts.damping;
    this.restArea = Math.PI * r * r;
    this.nodes = [];
    this.springs = [];
    for (let i = 0; i < this.n; i++) {
      const a = (i / this.n) * TAU;
      this.nodes.push(new PNode(x + Math.cos(a) * r, y + Math.sin(a) * r));
    }
    this.center = new PNode(x, y);
    const ringRest = 2 * Math.PI * r / this.n;
    for (let i = 0; i < this.n; i++) {
      const a = this.nodes[i], b = this.nodes[(i + 1) % this.n];
      this.springs.push(new Spring(a, b, ringRest, opts.ringK || 0.5));
      this.springs.push(new Spring(this.center, a, r, opts.spokeK || 0.28));
    }
    // shape memory for teardrop/star variants: per-node rest radius multiplier
    this.shapeMul = opts.shapeMul || null;
    if (this.shapeMul) {
      for (let i = 0; i < this.n; i++) {
        const s = this.springs[this.n + i]; // spoke spring i
        s.rest = r * this.shapeMul[i % this.shapeMul.length];
      }
    }
    this.grabNode = -1;
    this.grabX = 0; this.grabY = 0;
    this.dead = false;
    this.userData = {};
  }

  centroid(out) {
    out = out || {};
    let x = 0, y = 0;
    for (let i = 0; i < this.n; i++) { x += this.nodes[i].x; y += this.nodes[i].y; }
    out.x = x / this.n; out.y = y / this.n;
    return out;
  }

  velocity(dt, out) {
    out = out || {};
    out.x = (this.center.x - this.center.px) / dt;
    out.y = (this.center.y - this.center.py) / dt;
    return out;
  }

  radius() {
    const c = this.centroid(SoftBlob._c);
    let r = 0;
    for (let i = 0; i < this.n; i++) {
      r += Util.dist(c.x, c.y, this.nodes[i].x, this.nodes[i].y);
    }
    return r / this.n;
  }

  area() {
    let a = 0;
    for (let i = 0; i < this.n; i++) {
      const p = this.nodes[i], q = this.nodes[(i + 1) % this.n];
      a += p.x * q.y - q.x * p.y;
    }
    return Math.abs(a) * 0.5;
  }

  // stretch = max node distance from centroid / rest radius
  stretch() {
    const c = this.centroid(SoftBlob._c);
    let m = 0;
    for (let i = 0; i < this.n; i++) {
      const d = Util.dist(c.x, c.y, this.nodes[i].x, this.nodes[i].y);
      if (d > m) m = d;
    }
    return m / this.restR;
  }

  nearestNode(x, y) {
    let best = 0, bd = Infinity;
    for (let i = 0; i < this.n; i++) {
      const d = Util.dist2(x, y, this.nodes[i].x, this.nodes[i].y);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  grab(x, y) {
    this.grabNode = this.nearestNode(x, y);
    this.grabX = x; this.grabY = y;
  }

  moveGrab(x, y) {
    // clamp how far the finger can pull: stretchy but controllable
    const c = this.centroid(SoftBlob._c);
    const maxD = this.restR * 4.2;
    const dx = x - c.x, dy = y - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > maxD && d > 1e-4) {
      this.grabX = c.x + dx / d * maxD;
      this.grabY = c.y + dy / d * maxD;
    } else {
      this.grabX = x; this.grabY = y;
    }
  }
  release() { this.grabNode = -1; }
  get grabbed() { return this.grabNode >= 0; }

  applyImpulse(ix, iy) {
    for (let i = 0; i < this.n; i++) {
      const nd = this.nodes[i];
      nd.px -= ix; nd.py -= iy;
    }
    this.center.px -= ix; this.center.py -= iy;
  }

  // juice: squash along a normal (nx,ny) by amount 0..1
  // NOTE: displaces x AND px equally -> pure shape change, injects no
  // velocity (otherwise every impact would pump energy into the blob).
  squash(nx, ny, amount) {
    const c = this.centroid(SoftBlob._c);
    const k = Util.clamp(amount, 0, 0.6);
    for (let i = 0; i < this.n; i++) {
      const nd = this.nodes[i];
      const dx = nd.x - c.x, dy = nd.y - c.y;
      const along = dx * nx + dy * ny;
      const pxn = -ny, pyn = nx;
      const perp = dx * pxn + dy * pyn;
      const ox = -nx * along * k + pxn * perp * k * 0.5;
      const oy = -ny * along * k + pyn * perp * k * 0.5;
      nd.x += ox; nd.px += ox;
      nd.y += oy; nd.py += oy;
    }
  }

  integrate(dt, gx, gy) {
    const damp = this.damping;
    const g = this.grabNode;
    for (let i = 0; i < this.n; i++) {
      const nd = this.nodes[i];
      if (nd.pinned) continue;
      if (i === g) {
        // grabbed node: spring toward the pointer.
        // Strong pull -> the body lags behind -> visible stretch (the fun).
        nd.px = nd.x; nd.py = nd.y;
        nd.x += (this.grabX - nd.x) * 0.55;
        nd.y += (this.grabY - nd.y) * 0.55;
        continue;
      }
      const nx = nd.x + (nd.x - nd.px) * damp + gx * dt * dt;
      const ny = nd.y + (nd.y - nd.py) * damp + gy * dt * dt;
      nd.px = nd.x; nd.py = nd.y;
      nd.x = nx; nd.y = ny;
    }
    const c = this.center;
    if (!c.pinned) {
      const nx = c.x + (c.x - c.px) * damp + gx * dt * dt;
      const ny = c.y + (c.y - c.py) * damp + gy * dt * dt;
      c.px = c.x; c.py = c.y;
      c.x = nx; c.y = ny;
    }
  }

  solvePressure() {
    const a = this.area();
    const diff = (this.restArea - a) / this.restArea; // >0 when squashed
    if (Math.abs(diff) < 0.003) return;
    const c = this.centroid(SoftBlob._c);
    const k = this.pressure * diff;
    for (let i = 0; i < this.n; i++) {
      const nd = this.nodes[i];
      if (nd.pinned) continue;
      let dx = nd.x - c.x, dy = nd.y - c.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      nd.x += (dx / d) * k * this.restR * 0.5;
      nd.y += (dy / d) * k * this.restR * 0.5;
    }
  }

  solveSprings() {
    for (let i = 0; i < this.springs.length; i++) this.springs[i].solve();
  }

  // collide against world statics + bounds; returns strongest impact this step
  collide(world, dt) {
    const c = this.centroid(SoftBlob._c);
    const r = this.radius();
    let impact = 0;
    for (let i = 0; i < world.statics.length; i++) {
      const s = world.statics[i];
      const cp = SoftBlob._cp;
      World.closestPointOnSeg(c.x, c.y, s.x1, s.y1, s.x2, s.y2, cp);
      let dx = c.x - cp.x, dy = c.y - cp.y;
      let d = Math.sqrt(dx * dx + dy * dy);
      if (d < r + (s.radius || 0)) {
        if (d < 1e-4) { dx = 0; dy = -1; d = 1; }
        const nx = dx / d, ny = dy / d;
        const push = (r + (s.radius || 0) - d);
        // positional correction on all nodes
        for (let j = 0; j < this.n; j++) {
          const nd = this.nodes[j];
          if (!nd.pinned) { nd.x += nx * push; nd.y += ny * push; }
        }
        if (!this.center.pinned) { this.center.x += nx * push; this.center.y += ny * push; }
        // velocity response — recomputed FRESH per static, because an
        // earlier static in this same step may already have changed it
        // (stale velocity across two statics = energy pump at corners)
        const v = this.velocity(dt, SoftBlob._v);
        const vn = v.x * nx + v.y * ny;
        if (vn < 0) {
          impact = Math.max(impact, -vn);
          const rest = (s.bounce !== undefined ? s.bounce : this.bounce);
          const tx = -ny, ty = nx;
          const vt = v.x * tx + v.y * ty;
          const fric = (s.friction !== undefined ? s.friction : 0.02);
          const nvx = tx * vt * (1 - fric) + nx * (-vn * rest);
          const nvy = ty * vt * (1 - fric) + ny * (-vn * rest);
          // rewrite velocities by adjusting previous positions
          const dvx = nvx - v.x, dvy = nvy - v.y;
          for (let j = 0; j < this.n; j++) {
            const nd = this.nodes[j];
            nd.px -= dvx * dt; nd.py -= dvy * dt;
          }
          this.center.px -= dvx * dt; this.center.py -= dvy * dt;
          // juice: squash along impact normal (shape-only, no energy)
          this.squash(nx, ny, Util.clamp(-vn / 1400, 0, 0.5));
          if (world.onImpact) world.onImpact(this, s, -vn, nx, ny);
        }
      }
    }
    return impact;
  }

  update(dt, world) {
    this.integrate(dt, world.gx, world.gy);
    for (let it = 0; it < world.iterations; it++) {
      this.solveSprings();
      this.solvePressure();
    }
    return this.collide(world, dt);
  }
}
SoftBlob._c = {};
SoftBlob._v = {};
SoftBlob._cp = {};

/* JellyBlock — soft quad used for domino jelly towers. */
class JellyBlock {
  constructor(x, y, w, h, color) {
    this.w = w; this.h = h;
    this.color = color;
    this.restArea = w * h;
    const hw = w / 2, hh = h / 2;
    this.nodes = [
      new PNode(x - hw, y - hh), new PNode(x + hw, y - hh),
      new PNode(x + hw, y + hh), new PNode(x - hw, y + hh)
    ];
    this.center = new PNode(x, y);
    const edge = (a, b, r) => new Spring(a, b, r, 0.85);
    this.springs = [
      edge(this.nodes[0], this.nodes[1], w), edge(this.nodes[1], this.nodes[2], h),
      edge(this.nodes[2], this.nodes[3], w), edge(this.nodes[3], this.nodes[0], h),
      edge(this.nodes[0], this.nodes[2], Math.sqrt(w * w + h * h)),
      edge(this.nodes[1], this.nodes[3], Math.sqrt(w * w + h * h))
    ];
    for (let i = 0; i < 4; i++) this.springs.push(new Spring(this.center, this.nodes[i], Math.sqrt(hw * hw + hh * hh), 0.5));
    this.restUpX = 0; this.restUpY = -1;
    this.downNotified = false;
    this.userData = {};
  }
  centroid(out) {
    out = out || {};
    out.x = (this.nodes[0].x + this.nodes[1].x + this.nodes[2].x + this.nodes[3].x) / 4;
    out.y = (this.nodes[0].y + this.nodes[1].y + this.nodes[2].y + this.nodes[3].y) / 4;
    return out;
  }
  // "down" when the block's up-axis has tipped > 55 degrees
  isDown() {
    const c = this.centroid(JellyBlock._c);
    const tx = (this.nodes[0].x + this.nodes[1].x) / 2 - c.x;
    const ty = (this.nodes[0].y + this.nodes[1].y) / 2 - c.y;
    const d = Math.sqrt(tx * tx + ty * ty) || 1;
    const dot = (tx / d) * this.restUpX + (ty / d) * this.restUpY;
    return dot < Math.cos(55 * Math.PI / 180);
  }
  integrate(dt, gx, gy) {
    const damp = 0.99;
    const all = this.nodes.concat([this.center]);
    for (let i = 0; i < all.length; i++) {
      const nd = all[i];
      if (nd.pinned) continue;
      const nx = nd.x + (nd.x - nd.px) * damp + gx * dt * dt;
      const ny = nd.y + (nd.y - nd.py) * damp + gy * dt * dt;
      nd.px = nd.x; nd.py = nd.y;
      nd.x = nx; nd.y = ny;
    }
  }
  collide(world, dt) {
    // reuse circle approx via half-diagonal
    const c = this.centroid(JellyBlock._c);
    const r = Math.sqrt(this.w * this.w + this.h * this.h) / 2;
    let impact = 0;
    for (let i = 0; i < world.statics.length; i++) {
      const s = world.statics[i];
      const cp = SoftBlob._cp;
      World.closestPointOnSeg(c.x, c.y, s.x1, s.y1, s.x2, s.y2, cp);
      let dx = c.x - cp.x, dy = c.y - cp.y;
      let d = Math.sqrt(dx * dx + dy * dy);
      if (d < r * 0.82) {
        if (d < 1e-4) { dx = 0; dy = -1; d = 1; }
        const nx = dx / d, ny = dy / d;
        const push = r * 0.82 - d;
        const all = this.nodes.concat([this.center]);
        for (let j = 0; j < all.length; j++) {
          if (!all[j].pinned) { all[j].x += nx * push; all[j].y += ny * push; }
        }
        impact = Math.max(impact, push * 60);
      }
    }
    return impact;
  }
  update(dt, world) {
    this.integrate(dt, world.gx, world.gy);
    for (let it = 0; it < world.iterations; it++) {
      for (let i = 0; i < this.springs.length; i++) this.springs[i].solve();
    }
    return this.collide(world, dt);
  }
}
JellyBlock._c = {};

/* Particles — fixed pool, zero allocation in the hot loop. */
class Particles {
  constructor(max) {
    this.max = max || 220;
    this.list = [];
    for (let i = 0; i < this.max; i++) {
      this.list.push({ active: false, type: '', x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 4, color: '#ffffff', rot: 0, vr: 0, grav: 0 });
    }
    this.cursor = 0;
  }
  spawn(type, x, y, opts) {
    opts = opts || {};
    const p = this.list[this.cursor];
    this.cursor = (this.cursor + 1) % this.max;
    p.active = true; p.type = type;
    p.x = x; p.y = y;
    p.vx = opts.vx || 0; p.vy = opts.vy || 0;
    p.life = 0; p.maxLife = opts.life || 0.6;
    p.size = opts.size || 6;
    p.color = opts.color || '#ffffff';
    p.rot = opts.rot || 0; p.vr = opts.vr || 0;
    p.grav = opts.grav || 0;
    p.text = opts.text || '';
    return p;
  }
  ring(x, y, color, size) {
    this.spawn('ring', x, y, { life: 0.4, size: size || 30, color: color || '#ffffff' });
  }
  update(dt) {
    for (let i = 0; i < this.max; i++) {
      const p = this.list[i];
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) { p.active = false; continue; }
      p.vy += p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
  }
  draw(ctx) {
    for (let i = 0; i < this.max; i++) {
      const p = this.list[i];
      if (!p.active) continue;
      const t = p.life / p.maxLife;
      if (p.type === 'ring') {
        ctx.globalAlpha = (1 - t) * 0.8;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4 * (1 - t) + 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.3 + t * 1.4), 0, TAU);
        ctx.stroke();
      } else if (p.type === 'star') {
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        const s = p.size * (1 - t * 0.5);
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * TAU;
          const rr = (k % 2 === 0) ? s : s * 0.45;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
      } else if (p.type === 'sparkle') {
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        const s = p.size * (0.4 + t);
        ctx.beginPath();
        ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y);
        ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s);
        ctx.stroke();
      } else if (p.type === 'drip' || p.type === 'mote' || p.type === 'poof') {
        ctx.globalAlpha = p.type === 'mote' ? 0.5 * (1 - t) : (1 - t) * 0.85;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.type === 'poof' ? (0.5 + t) : (1 - t * 0.4)), 0, TAU);
        ctx.fill();
      } else if (p.type === 'text') {
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = p.color;
        ctx.font = 'bold ' + Math.round(p.size) + 'px "Baloo 2", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.text, p.x, p.y - t * 60);
      } else if (p.type === 'heart') {
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = p.color;
        const s = p.size * (1 - t * 0.3);
        ctx.save(); ctx.translate(p.x, p.y - t * 50); ctx.scale(s / 10, s / 10);
        ctx.beginPath();
        ctx.moveTo(0, 3);
        ctx.bezierCurveTo(-6, -3, -3, -8, 0, -4);
        ctx.bezierCurveTo(3, -8, 6, -3, 0, 3);
        ctx.fill(); ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }
}

/* World — gravity, statics, fixed-step update. */
class World {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.gx = 0; this.gy = 1500; // px/s^2
    this.statics = [];  // {x1,y1,x2,y2,bounce,friction,radius}
    this.blobs = [];
    this.blocks = [];
    this.particles = new Particles(220);
    this.iterations = 3;
    this.onImpact = null;
    this.acc = 0;
    this.stepCount = 0;
  }
  addStatic(x1, y1, x2, y2, opts) {
    opts = opts || {};
    const s = { x1, y1, x2, y2, bounce: opts.bounce, friction: opts.friction, radius: opts.radius || 0, tag: opts.tag || '' };
    this.statics.push(s);
    return s;
  }
  addBounds(margin) {
    const m = margin === undefined ? 200 : margin;
    // floor + tall walls (past the ceiling, so nothing ever flies over) + soft ceiling
    this.addStatic(-m, STAGE_H - 40, STAGE_W + m, STAGE_H - 40, { bounce: 0.5, friction: 0.05, tag: 'floor' });
    this.addStatic(-40, -800, -40, STAGE_H + m, { bounce: 0.4, tag: 'wall' });
    this.addStatic(STAGE_W + 40, -800, STAGE_W + 40, STAGE_H + m, { bounce: 0.4, tag: 'wall' });
    this.addStatic(-m, -m - 400, STAGE_W + m, -m - 400, { bounce: 0.2, tag: 'ceiling' });
  }
  static closestPointOnSeg(px, py, x1, y1, x2, y2, out) {
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
    t = Util.clamp(t, 0, 1);
    out.x = x1 + dx * t; out.y = y1 + dy * t;
    return out;
  }
  step(dt) {
    this.stepCount++;
    for (let i = 0; i < this.blobs.length; i++) {
      const b = this.blobs[i];
      if (!b.dead) b.update(dt, this);
    }
    for (let i = 0; i < this.blocks.length; i++) this.blocks[i].update(dt, this);
    this.collideBlobsBlocks();
    this.particles.update(dt);
  }

  // circle-approx collisions: soft blobs vs jelly blocks, and blocks vs blocks.
  // Lets flung creatures knock over domino towers. Zero allocation.
  collideBlobsBlocks() {
    const c1 = World._t1, c2 = World._t2;
    for (let bi = 0; bi < this.blobs.length; bi++) {
      const b = this.blobs[bi];
      if (b.dead) continue;
      b.centroid(c1);
      const br = b.radius();
      for (let ki = 0; ki < this.blocks.length; ki++) {
        const k = this.blocks[ki];
        k.centroid(c2);
        const kr = Math.sqrt(k.w * k.w + k.h * k.h) * 0.39;
        let dx = c2.x - c1.x, dy = c2.y - c1.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        const minD = br + kr;
        if (d < minD) {
          if (d < 1e-4) { dx = 0; dy = -1; d = 1; }
          const nx = dx / d, ny = dy / d, push = minD - d;
          const bm = br * br, km = k.w * k.h, tm = bm + km;
          const pb = push * (km / tm), pk = push * (bm / tm);
          for (let j = 0; j < b.n; j++) {
            const nd = b.nodes[j];
            if (!nd.pinned) { nd.x -= nx * pb; nd.y -= ny * pb; }
          }
          if (!b.center.pinned) { b.center.x -= nx * pb; b.center.y -= ny * pb; }
          // torque: hits above the block's middle tip it over (dominoes!);
          // low hits just shove. Top nodes get up to 2.2x the push.
          const highHit = Util.clamp((c2.y - c1.y) / (k.h * 0.6), 0, 1);
          for (let j = 0; j < 4; j++) {
            const nd = k.nodes[j];
            if (!nd.pinned) {
              const topness = nd.y < c2.y ? 1 : 0.35;
              const nodePush = pk * (1 + highHit * topness * 1.2);
              nd.x += nx * nodePush;
              nd.y += ny * nodePush;
            }
          }
          if (!k.center.pinned) { k.center.x += nx * pk; k.center.y += ny * pk; }
        }
      }
    }
    // block vs block
    for (let i = 0; i < this.blocks.length; i++) {
      for (let j = i + 1; j < this.blocks.length; j++) {
        const a = this.blocks[i], b = this.blocks[j];
        a.centroid(c1); b.centroid(c2);
        const ra = Math.sqrt(a.w * a.w + a.h * a.h) * 0.39;
        const rb = Math.sqrt(b.w * b.w + b.h * b.h) * 0.39;
        let dx = c2.x - c1.x, dy = c2.y - c1.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        const minD = ra + rb;
        if (d < minD && d > 1e-4) {
          const nx = dx / d, ny = dy / d, push = (minD - d) * 0.5;
          for (let q = 0; q < 4; q++) {
            if (!a.nodes[q].pinned) { a.nodes[q].x -= nx * push; a.nodes[q].y -= ny * push; }
            if (!b.nodes[q].pinned) { b.nodes[q].x += nx * push; b.nodes[q].y += ny * push; }
          }
        }
      }
    }
  }
  update(frameDt) {
    // fixed timestep with clamp (spiral-of-death guard)
    const dt = 1 / 60;
    this.acc = Math.min(this.acc + Math.min(frameDt, 0.1), 0.12);
    while (this.acc >= dt) {
      // 2 substeps for extra stability
      this.step(dt / 2); this.step(dt / 2);
      this.acc -= dt;
    }
  }
}
World._t1 = {};
World._t2 = {};
