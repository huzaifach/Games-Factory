'use strict';
/* WOBBLE WORLD — 03-creatures.js : the wobble friends.
   4 personalities, each visually + behaviorally distinct. No copies. */

const PERSONALITIES = {
  bouncy: {
    key: 'bouncy', name: 'Boing', color: '#ff8fb3',
    nodes: 14, r: 46, bounce: 0.85, pressure: 0.7, damping: 0.985,
    hopPower: 620, hopInterval: [1.4, 2.8], energy: 0.7, stick: 0,
    shape: 'round', shapeMul: null,
    blurb: 'Loves to bounce. The higher the better!'
  },
  sticky: {
    key: 'sticky', name: 'Gloopy', color: '#7fe3b2',
    nodes: 12, r: 44, bounce: 0.3, pressure: 0.62, damping: 0.975,
    hopPower: 420, hopInterval: [2.2, 4.0], energy: 0.35, stick: 1,
    shape: 'teardrop',
    shapeMul: [1.12, 1.05, 0.98, 0.92, 0.88, 0.86, 0.88, 0.92, 0.98, 1.05, 1.1, 1.14],
    blurb: 'Super sticky. Loves to cling and leave goo prints.'
  },
  sleepy: {
    key: 'sleepy', name: 'Dozie', color: '#c3b2f2',
    nodes: 12, r: 52, bounce: 0.4, pressure: 0.62, damping: 0.97,
    hopPower: 300, hopInterval: [3.5, 6.5], energy: 0.2, stick: 0,
    shape: 'chubby',
    shapeMul: [1.18, 1.12, 1.02, 0.94, 0.9, 0.9, 0.94, 1.02, 1.12, 1.18, 1.2, 1.2],
    blurb: 'Very sleepy. Wake it up gently... or with a big fling!'
  },
  hyper: {
    key: 'hyper', name: 'Zippy', color: '#ffb14e',
    nodes: 10, r: 40, bounce: 0.7, pressure: 0.75, damping: 0.99,
    hopPower: 760, hopInterval: [0.7, 1.6], energy: 1.0, stick: 0,
    shape: 'star',
    shapeMul: [1.15, 0.95, 1.12, 0.95, 1.15, 0.95, 1.12, 0.95, 1.15, 0.95],
    blurb: 'ZOOM! Cannot sit still. Do not even try.'
  }
};

/* Goo paint colors: tap a goo jar, then tap a friend.
   Each goo shifts traits a little — paint is gameplay, not just color. */
const GOO_COLORS = [
  { hex: '#ff5d6c', name: 'Berry', bounceUp: 0.15, stickyUp: 0, energyUp: 0.1 },
  { hex: '#ffd94e', name: 'Honey', bounceUp: 0.05, stickyUp: 0, energyUp: 0.2 },
  { hex: '#4ec9ff', name: 'Frost', bounceUp: -0.05, stickyUp: 0.35, energyUp: -0.05 }
];

class Creature extends SoftBlob {
  constructor(pKey, x, y, opts) {
    const p = PERSONALITIES[pKey] || PERSONALITIES.bouncy;
    opts = opts || {};
    super(x, y, opts.r || p.r, opts.nodes || p.nodes, {
      color: opts.color || p.color,
      bounce: opts.bounce !== undefined ? opts.bounce : p.bounce,
      pressure: p.pressure, damping: p.damping,
      shapeMul: opts.shapeMul || p.shapeMul
    });
    this.pKey = pKey;
    this.personality = p;
    this.displayName = opts.name || p.name;
    this.customName = !!opts.name;
    this.baseBounce = this.bounce;
    this.energy = opts.energy !== undefined ? opts.energy : p.energy;
    this.stickiness = opts.stickiness !== undefined ? opts.stickiness : (p.stick ? 0.7 : 0.1);
    this.maxRadius = this.restR;
    // AI
    this.aiTimer = Util.rand(0.5, 2);
    this.hopDir = Util.chance(0.5) ? 1 : -1;
    this.sleeping = false;
    this.sleepTimer = 0;
    this.zzzTimer = 0;
    this.stickTimer = 0;      // sticky cling after landing
    this.stuckX = 0; this.stuckY = 0;
    // juice / tracking
    this.spawnT = 0;          // 0..1 spawn scale-in
    this.maxStretchSeen = 1;
    this.stretchSfxT = 0;
    this.splatCooldown = 0;
    this.petTimer = 0;        // slow gentle drags = pets -> hearts
    this.faceBlink = Util.rand(1, 3);
    this.faceT = 0;
    this.wakeFlash = 0;
    this.paintColors = [];    // hexes this creature has been painted with
    this.labelT = 0;          // show name label countdown
    this.ridingBubble = null;
    this.userData.isCreature = true;
    this.userData.creature = this;
  }

  get isSleepy() { return this.pKey === 'sleepy'; }

  paint(goo, game) {
    const before = this.color;
    this.color = Util.mixHex(this.color, goo.hex, 0.55);
    this.bounce = Util.clamp(this.bounce + goo.bounceUp, 0.15, 0.95);
    this.stickiness = Util.clamp(this.stickiness + goo.stickyUp, 0, 1);
    this.energy = Util.clamp(this.energy + goo.energyUp, 0.1, 1.2);
    if (this.paintColors.indexOf(goo.hex) < 0) this.paintColors.push(goo.hex);
    const c = this.centroid(Creature._c);
    game.world.particles.spawn('poof', c.x, c.y, { life: 0.5, size: 26, color: goo.hex, grav: -60 });
    game.world.particles.ring(c.x, c.y, '#ffffff', this.restR);
    game.audio.squelch();
    game.bus.emit('paint', { creature: this, color: goo.hex, before });
    this.squash(0, -1, 0.25); // happy squish
  }

  wake(game) {
    if (!this.sleeping) return;
    this.sleeping = false;
    this.sleepTimer = 0;
    this.wakeFlash = 0.8;
    this.aiTimer = Util.rand(0.4, 1);
    const c = this.centroid(Creature._c);
    game.world.particles.spawn('text', c.x, c.y - 40, { life: 0.9, size: 30, color: '#ffffff', text: '!' });
    game.audio.wakeUp();
    game.bus.emit('wake', { creature: this });
    this.squash(0, -1, 0.3);
  }

  poke(x, y, game) {
    // second-finger poke: gentle impulse + boing
    const c = this.centroid(Creature._c);
    const dx = c.x - x, dy = c.y - y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const power = 320;
    this.applyImpulse(dx / d * power * 0.016, dy / d * power * 0.016 - 4);
    if (this.sleeping) this.wake(game);
    game.audio.boing(0.35);
    game.world.particles.ring(c.x, c.y, '#ffffff', this.restR * 0.9);
    this.squash(dx / d, dy / d, 0.3);
  }

  // ---- per-frame ----
  updateAI(dt, game) {
    this.faceT += dt;
    this.faceBlink -= dt;
    if (this.faceBlink < -0.12) this.faceBlink = Util.rand(1.6, 4);
    if (this.spawnT < 1) this.spawnT = Math.min(1, this.spawnT + dt * 2.2);
    if (this.splatCooldown > 0) this.splatCooldown -= dt;
    if (this.wakeFlash > 0) this.wakeFlash -= dt;
    if (this.labelT > 0) this.labelT -= dt;

    const c = this.centroid(Creature._c);

    // safety net: nothing in this toy box may ever exceed 2400 px/s
    const sv = this.velocity(dt, Creature._v);
    const ssp = Math.sqrt(sv.x * sv.x + sv.y * sv.y);
    if (ssp > 2400) {
      const f = 2400 / ssp;
      for (let i = 0; i < this.n; i++) {
        const nd = this.nodes[i];
        nd.px = nd.x - (nd.x - nd.px) * f;
        nd.py = nd.y - (nd.y - nd.py) * f;
      }
      this.center.px = this.center.x - (this.center.x - this.center.px) * f;
      this.center.py = this.center.y - (this.center.y - this.center.py) * f;
    }

    // riding a bubble: follow it, skip gravity AI
    if (this.ridingBubble) {
      const b = this.ridingBubble;
      if (b.dead) { this.ridingBubble = null; }
      else {
        const tx = b.x, ty = b.y + 6;
        for (let i = 0; i < this.n; i++) {
          const nd = this.nodes[i];
          nd.px = nd.x; nd.py = nd.y;
        }
        this.center.px = this.center.x; this.center.py = this.center.y;
        const k = 1 - Math.pow(0.0001, dt);
        for (let i = 0; i < this.n; i++) {
          const nd = this.nodes[i];
          const ox = nd.x - this.center.x, oy = nd.y - this.center.y;
          this.center.x += (tx - this.center.x) * k;
          this.center.y += (ty - this.center.y) * k;
          nd.x = this.center.x + ox; nd.y = this.center.y + oy;
        }
        return;
      }
    }

    // sticky cling: freeze briefly after landing
    if (this.stickTimer > 0) {
      this.stickTimer -= dt;
      for (let i = 0; i < this.n; i++) {
        const nd = this.nodes[i];
        nd.px = nd.x; nd.py = nd.y;
      }
      this.center.px = this.center.x; this.center.py = this.center.y;
      return;
    }

    if (this.grabbed) return; // player is driving

    // sleepy behavior
    if (this.isSleepy) {
      const v = this.velocity(dt, Creature._v);
      const speed = Math.sqrt(v.x * v.x + v.y * v.y);
      if (!this.sleeping && speed < 60) {
        this.sleepTimer += dt;
        if (this.sleepTimer > 2.5) {
          this.sleeping = true;
          game.bus.emit('sleep', { creature: this });
        }
      } else if (speed >= 60) {
        this.sleepTimer = 0;
      }
      if (this.sleeping) {
        this.zzzTimer -= dt;
        if (this.zzzTimer <= 0) {
          this.zzzTimer = Util.rand(0.7, 1.2);
          game.world.particles.spawn('text', c.x + 20, c.y - this.restR - 6,
            { life: 1.6, size: 22, color: '#ffffff', text: 'Z', vy: -40 });
        }
        return; // no hopping while asleep
      }
    }

    // wander hops — only when grounded (no mid-air energy pumping);
    // in the air, just a tiny wiggle
    this.aiTimer -= dt * (0.6 + this.energy);
    if (this.aiTimer <= 0) {
      const p = this.personality;
      this.aiTimer = Util.rand(p.hopInterval[0], p.hopInterval[1]);
      if (!this._isGrounded(game)) {
        this.applyImpulse(this.hopDir * 30 * 0.016, 0);
        return;
      }
      if (Util.chance(0.25)) this.hopDir *= -1;
      // stay roughly in the middle band of the stage
      if (c.x < 180) this.hopDir = 1;
      if (c.x > STAGE_W - 180) this.hopDir = -1;
      const power = p.hopPower * (0.7 + this.energy * 0.5);
      this.applyImpulse(this.hopDir * power * 0.016 * Util.rand(0.6, 1),
        -power * 0.016 * Util.rand(0.7, 1.1));
      // anticipation squash before hop
      this.squash(0, 1, 0.18);
    }
  }

  _isGrounded(game) {
    const c = this.centroid(Creature._c);
    const cp = Creature._cp;
    const px = c.x, py = c.y + this.restR * 0.9;
    const statics = game.world.statics;
    for (let i = 0; i < statics.length; i++) {
      const s = statics[i];
      World.closestPointOnSeg(px, py, s.x1, s.y1, s.x2, s.y2, cp);
      if (Util.dist(px, py, cp.x, cp.y) < 30) return true;
    }
    return false;
  }

  onLanded(impact, nx, ny, game) {
    // called by Game via world.onImpact for strong impacts
    // sticky cling: its own moment, independent of splat — wide window so it
    // triggers reliably on ordinary landings
    if (this.stickiness > 0.45 && impact > 150 && impact < 1100 && this.stickTimer <= 0) {
      this.stickTimer = 0.9;
      game.bus.emit('stick', { creature: this });
    }
    if (impact > 260 && this.splatCooldown <= 0) {
      this.splatCooldown = 0.4;
      const hard = impact > 700;
      game.audio.splat(hard);
      const c = this.centroid(Creature._c);
      const n = hard ? 5 : 3;
      for (let i = 0; i < n; i++) {
        game.world.particles.spawn('star', c.x + Util.rand(-20, 20), c.y + Util.rand(-10, 10),
          { life: 0.5, size: Util.rand(6, 12), color: '#ffffff', vx: Util.rand(-90, 90), vy: Util.rand(-140, -20), grav: 500, rot: Util.rand(0, 6), vr: Util.rand(-6, 6) });
      }
      game.world.particles.ring(c.x, c.y + this.restR * 0.5, '#ffffff', this.restR);
      game.bus.emit('splat', { creature: this, impact, hard });
      if (hard && this.sleeping) this.wake(game);
    }
  }

  // ---- drawing ----
  draw(ctx, game) {
    const c = this.centroid(Creature._c);
    const t = game.time;
    // spawn scale-in with overshoot
    const sIn = this.spawnT < 1 ? Util.easeOutBack(this.spawnT) : 1;
    const wakeJiggle = this.wakeFlash > 0 ? Math.sin(t * 40) * 0.06 * this.wakeFlash : 0;
    const hyperJiggle = this.pKey === 'hyper' && !this.sleeping ? Math.sin(t * 30) * 0.02 : 0;

    // soft shadow on the floor
    const floorY = STAGE_H - 40;
    const hAbove = Util.clamp((floorY - c.y) / 700, 0, 1);
    ctx.globalAlpha = 0.16 * (1 - hAbove * 0.7);
    ctx.fillStyle = '#4a3b5c';
    Util.ell(ctx, c.x, floorY + 14, this.restR * 1.05 * sIn, 14 * sIn);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(sIn * (1 + wakeJiggle + hyperJiggle), sIn * (1 - wakeJiggle));

    // body path through nodes (relative coords)
    const pts = [];
    for (let i = 0; i < this.n; i++) pts.push({ x: this.nodes[i].x - c.x, y: this.nodes[i].y - c.y });
    this._tracePath(ctx, pts);

    const R = this.restR;
    // body gradient
    const g = ctx.createLinearGradient(0, -R, 0, R);
    g.addColorStop(0, Util.shade(this.color, 38));
    g.addColorStop(0.45, this.color);
    g.addColorStop(1, Util.shade(this.color, -16));
    ctx.globalAlpha = 0.93;
    ctx.fillStyle = g;
    ctx.fill();
    ctx.globalAlpha = 1;
    // rim
    ctx.strokeStyle = Util.rgba(Util.shade(this.color, -32), 0.55);
    ctx.lineWidth = Math.max(2, R * 0.055);
    ctx.stroke();
    // inner glow (subsurface fake)
    ctx.save();
    ctx.translate(-R * 0.08, -R * 0.12);
    ctx.scale(0.72, 0.72);
    this._tracePath(ctx, pts);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fill();
    ctx.restore();
    // refraction highlight
    ctx.save();
    ctx.translate(-R * 0.34, -R * 0.42);
    ctx.rotate(-0.5);
    const hg = ctx.createRadialGradient(0, 0, 1, 0, 0, R * 0.42);
    hg.addColorStop(0, 'rgba(255,255,255,0.6)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 0.42, R * 0.24, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    // specular dot
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(-R * 0.42, -R * 0.55, Math.max(2, R * 0.07), 0, TAU);
    ctx.fill();

    // sticky drips
    if (this.stickiness > 0.4) {
      ctx.fillStyle = Util.shade(this.color, 10);
      const drips = 3;
      for (let i = 0; i < drips; i++) {
        const a = Math.PI * (0.25 + i * 0.25) + Math.sin(t * 2 + i) * 0.05;
        const dx = Math.cos(a) * R * 0.75, dy = Math.sin(a) * R * 0.85;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(dx, dy + Math.sin(t * 3 + i * 2) * 3, R * 0.12, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    this._drawFace(ctx, R, t, game);
    ctx.restore();

    // name label (mixer creations)
    if (this.labelT > 0 && this.customName) {
      ctx.globalAlpha = Math.min(1, this.labelT);
      ctx.font = 'bold 24px "Baloo 2", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      const w = ctx.measureText(this.displayName).width + 28;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      Util.rr(ctx, c.x - w / 2, c.y - R - 52, w, 36, 18);
      ctx.fill();
      ctx.fillStyle = '#4a3b5c';
      ctx.fillText(this.displayName, c.x, c.y - R - 22);
      ctx.globalAlpha = 1;
    }
  }

  _tracePath(ctx, pts) {
    const n = pts.length;
    ctx.beginPath();
    ctx.moveTo((pts[0].x + pts[n - 1].x) / 2, (pts[0].y + pts[n - 1].y) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
    }
    ctx.closePath();
  }

  _drawFace(ctx, R, t, game) {
    const v = this.velocity(1 / 60, Creature._v2);
    const sp = Math.sqrt(v.x * v.x + v.y * v.y);
    const lookX = Util.clamp(v.x / 400, -1, 1) * R * 0.12;
    const lookY = Util.clamp(v.y / 400, -1, 1) * R * 0.08;
    const stretch = this.stretch();
    const blink = this.faceBlink < 0 ? 0.12 : 1; // eyelid scale
    const eyeDX = R * 0.34, eyeY = -R * 0.12;

    if (this.sleeping) {
      // closed happy arcs
      ctx.strokeStyle = '#4a3b5c';
      ctx.lineWidth = Math.max(2.5, R * 0.05);
      ctx.lineCap = 'round';
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(sx * eyeDX, eyeY, R * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
    } else if (this.pKey === 'hyper') {
      // excited > < eyes
      ctx.strokeStyle = '#4a3b5c';
      ctx.lineWidth = Math.max(3, R * 0.06);
      ctx.lineCap = 'round';
      for (const sx of [-1, 1]) {
        const ex = sx * eyeDX + lookX, ey = eyeY + lookY;
        const s = R * 0.16;
        ctx.beginPath();
        ctx.moveTo(ex - s * sx, ey - s); ctx.lineTo(ex, ey); ctx.lineTo(ex - s * sx, ey + s);
        ctx.stroke();
      }
    } else {
      // round eyes with pupils
      for (const sx of [-1, 1]) {
        const ex = sx * eyeDX + lookX * 0.6, ey = eyeY + lookY * 0.6;
        const er = R * (this.pKey === 'bouncy' ? 0.2 : 0.16);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ex, ey, er, er * blink, 0, 0, TAU);
        ctx.fill();
        if (blink > 0.5) {
          ctx.fillStyle = '#4a3b5c';
          ctx.beginPath();
          ctx.arc(ex + lookX, ey + lookY, er * 0.45, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex + lookX - er * 0.12, ey + lookY - er * 0.14, er * 0.14, 0, TAU);
          ctx.fill();
        }
      }
    }

    // mouth
    const my = R * 0.32;
    ctx.strokeStyle = '#4a3b5c';
    ctx.lineWidth = Math.max(2.5, R * 0.05);
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (this.sleeping) {
      ctx.arc(0, my - 4, R * 0.1, 0.1 * Math.PI, 0.9 * Math.PI);
    } else if (stretch > 1.6 || this.grabbed) {
      // "o" mouth when stretched
      ctx.fillStyle = '#4a3b5c';
      ctx.beginPath();
      ctx.ellipse(0, my, R * 0.1, R * 0.14, 0, 0, TAU);
      ctx.fill();
    } else if (this.pKey === 'hyper') {
      // big grin
      ctx.arc(0, my - R * 0.08, R * 0.22, 0.2 * Math.PI, 0.8 * Math.PI);
    } else {
      // smile
      ctx.arc(0, my - R * 0.04, R * 0.16, 0.25 * Math.PI, 0.75 * Math.PI);
    }
    ctx.stroke();

    // blush
    ctx.fillStyle = 'rgba(255,120,150,0.35)';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * R * 0.52, R * 0.18, R * 0.1, 0, TAU);
      ctx.fill();
    }
  }
}
Creature._c = {};
Creature._v = {};
Creature._v2 = {};
Creature._cp = {};
