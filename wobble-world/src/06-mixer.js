'use strict';
/* WOBBLE WORLD — 06-mixer.js : Creature Mixer.
   Pick 2 parent creatures + up to 3 goo colors + a name = your own wobble
   friend. Snapshot saves a PNG of your creation.
   Layout is computed once in layout() and shared by draw() + handleTap(). */

class Mixer {
  constructor(game) {
    this.game = game;
    this.parents = [];   // Creature refs (max 2)
    this.goos = [];      // goo defs (max 3)
    this.name = 'Wobbles';
    this.openT = 0;
    this.mixFlash = 0;
  }

  open() {
    this.parents = [];
    this.goos = [];
    this.openT = 0;
    this.game.overlay = 'mixer';
    this.game.audio.uiClick();
  }

  close() {
    this.game.overlay = null;
    this.game.ui.hideOverlay();
    this.game.audio.uiClick();
  }

  panel() { return { x: 70, y: 130, w: 660, h: 940 }; }

  // single source of truth for every Y coordinate below
  layout() {
    const P = this.panel();
    const creatures = this.game.creatures.slice(0, 8);
    const perRow = 4, cw = 140, ch = 150, gap = 14;
    const rows = Math.max(1, Math.ceil(creatures.length / perRow));
    const cards = [];
    for (let i = 0; i < creatures.length; i++) {
      const row = Math.floor(i / perRow), col = i % perRow;
      cards.push({
        creature: creatures[i],
        rect: {
          x: P.x + 44 + col * (cw + gap),
          y: P.y + 196 + row * (ch + gap),
          w: cw, h: ch
        }
      });
    }
    const cardsBottom = P.y + 196 + rows * (ch + gap);
    const gooLabelY = cardsBottom + 30;
    const gooY = gooLabelY + 58;
    const nameLabelY = gooY + 100;
    const nameY = nameLabelY + 28;
    const mixY = nameY + 96;
    const snapY = mixY + 98;
    return { P, cards, gooLabelY, gooY, nameLabelY, nameY, mixY, snapY };
  }

  handleTap(x, y) {
    const g = this.game;
    const L = this.layout(), P = L.P;
    // close button
    if (Util.dist(x, y, P.x + P.w - 46, P.y + 46) < 44) { this.close(); return true; }
    // creature cards
    for (const { creature: cr, rect: r } of L.cards) {
      if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) {
        const idx = this.parents.indexOf(cr);
        if (idx >= 0) this.parents.splice(idx, 1);
        else if (this.parents.length < 2) this.parents.push(cr);
        else { this.parents.shift(); this.parents.push(cr); }
        g.audio.uiClick();
        return true;
      }
    }
    // goo swatches
    for (let i = 0; i < GOO_COLORS.length; i++) {
      const sx = P.x + 150 + i * 180, sy = L.gooY;
      if (Util.dist(x, y, sx, sy) < 56) {
        const goo = GOO_COLORS[i];
        const idx = this.goos.indexOf(goo);
        if (idx >= 0) this.goos.splice(idx, 1);
        else if (this.goos.length < 3) this.goos.push(goo);
        g.audio.uiClick();
        return true;
      }
    }
    // name box
    if (x > P.x + 180 && x < P.x + 480 && y > L.nameY && y < L.nameY + 68) {
      g.ui.showNameInput(this.name, (val) => {
        if (val && val.trim()) this.name = val.trim().slice(0, 18);
      });
      return true;
    }
    // MIX button
    if (x > P.x + 190 && x < P.x + 470 && y > L.mixY && y < L.mixY + 86) {
      this.mix();
      return true;
    }
    // snapshot button
    if (x > P.x + 190 && x < P.x + 470 && y > L.snapY && y < L.snapY + 58) {
      g.snapshot();
      return true;
    }
    return true; // swallow all taps while open
  }

  mix() {
    const g = this.game;
    if (this.parents.length < 2) {
      g.toast('Pick TWO parents first!');
      g.audio.uiClick();
      return;
    }
    const [a, b] = this.parents;
    const ac = a.centroid(Mixer._c), bc = b.centroid(Mixer._c);
    const sx = Util.clamp((ac.x + bc.x) / 2, 140, STAGE_W - 140);
    const sy = Math.min(ac.y, bc.y) - 130;
    let color = Util.mixHex(a.color, b.color, 0.5);
    let bounce = (a.bounce + b.bounce) / 2;
    let energy = (a.energy + b.energy) / 2;
    let stick = (a.stickiness + b.stickiness) / 2;
    for (const goo of this.goos) {
      color = Util.mixHex(color, goo.hex, 0.35);
      bounce = Util.clamp(bounce + goo.bounceUp * 0.5, 0.15, 0.95);
      energy = Util.clamp(energy + goo.energyUp * 0.5, 0.1, 1.2);
      stick = Util.clamp(stick + goo.stickyUp * 0.5, 0, 1);
    }
    const child = new Creature(a.pKey, sx, Math.max(220, sy), {
      color, bounce, energy,
      stickiness: stick,
      r: (a.restR + b.restR) / 2,
      nodes: Math.round((a.n + b.n) / 2),
      name: this.name
    });
    child.userData.cid = g.nextCid++;
    child.labelT = 6;
    g.world.blobs.push(child);
    g.creatures.push(child);
    child.squash(0, -1, 0.4);
    for (let i = 0; i < 26; i++) {
      g.world.particles.spawn('sparkle', sx + Util.rand(-60, 60), sy + Util.rand(-60, 60),
        { life: Util.rand(0.5, 1), size: Util.rand(5, 10), color: Util.pick(['#ffffff', '#ffd166', '#ff9ebb', color]), vx: Util.rand(-140, 140), vy: Util.rand(-200, -40), grav: 300 });
    }
    g.world.particles.ring(sx, sy, '#ffffff', 90);
    g.audio.giggle();
    setTimeout(() => { try { g.audio.sparkle(); } catch (e) {} }, 350);
    g.save.creations.push({ name: this.name, color, at: Date.now() });
    g.persist();
    g.lastCreationName = this.name;
    g.toast('Meet ' + this.name + '!');
    this.mixFlash = 1;
    this.parents = [];
    this.goos = [];
    this.close();
  }

  update(dt) {
    this.openT = Math.min(1, this.openT + dt * 3);
    if (this.mixFlash > 0) this.mixFlash -= dt * 2;
  }

  draw(ctx) {
    const g = this.game;
    const L = this.layout(), P = L.P;
    const t = Util.easeOutBack(this.openT);
    ctx.fillStyle = 'rgba(40,28,58,0.55)';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.save();
    ctx.translate(P.x + P.w / 2, P.y + P.h / 2);
    ctx.scale(t, t);
    ctx.translate(-(P.x + P.w / 2), -(P.y + P.h / 2));
    // panel
    ctx.fillStyle = 'rgba(255,247,251,0.98)';
    Util.rr(ctx, P.x, P.y, P.w, P.h, 30);
    ctx.fill();
    ctx.strokeStyle = '#ffd6e8';
    ctx.lineWidth = 5;
    Util.rr(ctx, P.x, P.y, P.w, P.h, 30);
    ctx.stroke();
    // close X
    ctx.fillStyle = '#ff6f9f';
    ctx.beginPath(); ctx.arc(P.x + P.w - 46, P.y + 46, 30, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(P.x + P.w - 58, P.y + 34); ctx.lineTo(P.x + P.w - 34, P.y + 58);
    ctx.moveTo(P.x + P.w - 34, P.y + 34); ctx.lineTo(P.x + P.w - 58, P.y + 58);
    ctx.stroke();

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4a3b5c';
    ctx.font = 'bold 40px "Baloo 2", sans-serif';
    ctx.fillText('Creature Mixer', P.x + P.w / 2, P.y + 52);
    ctx.font = '20px "Baloo 2", sans-serif';
    ctx.fillStyle = '#7a6a8f';
    ctx.fillText('Mix two friends + goo = a brand-new friend!', P.x + P.w / 2, P.y + 96);

    // step 1: parents
    ctx.textAlign = 'left';
    ctx.font = 'bold 26px "Baloo 2", sans-serif';
    ctx.fillStyle = '#4a3b5c';
    ctx.fillText('1. Pick two parents:', P.x + 44, P.y + 160);
    for (const { creature: cr, rect: r } of L.cards) {
      const sel = this.parents.indexOf(cr) >= 0;
      ctx.fillStyle = sel ? '#ffe3ef' : '#ffffff';
      Util.rr(ctx, r.x, r.y, r.w, r.h, 18);
      ctx.fill();
      ctx.strokeStyle = sel ? '#ff6f9f' : '#e8dff0';
      ctx.lineWidth = sel ? 5 : 3;
      Util.rr(ctx, r.x, r.y, r.w, r.h, 18);
      ctx.stroke();
      const bx = r.x + r.w / 2, by = r.y + 56;
      const bg = ctx.createLinearGradient(0, by - 32, 0, by + 32);
      bg.addColorStop(0, Util.shade(cr.color, 35));
      bg.addColorStop(1, Util.shade(cr.color, -12));
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(bx, by, 32, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.ellipse(bx - 10, by - 12, 9, 5, -0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#4a3b5c';
      ctx.beginPath(); ctx.arc(bx - 9, by - 1, 4.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(bx + 9, by - 1, 4.5, 0, TAU); ctx.fill();
      if (sel) {
        ctx.fillStyle = '#ff6f9f';
        ctx.beginPath(); ctx.arc(r.x + r.w - 20, r.y + 20, 16, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(r.x + r.w - 28, r.y + 20); ctx.lineTo(r.x + r.w - 22, r.y + 27); ctx.lineTo(r.x + r.w - 11, r.y + 12);
        ctx.stroke();
      }
      ctx.fillStyle = '#4a3b5c';
      ctx.font = 'bold 19px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cr.displayName, bx, r.y + r.h - 26);
    }

    // step 2: goo
    ctx.textAlign = 'left';
    ctx.font = 'bold 26px "Baloo 2", sans-serif';
    ctx.fillStyle = '#4a3b5c';
    ctx.fillText('2. Add goo (up to 3):', P.x + 44, L.gooLabelY);
    for (let i = 0; i < GOO_COLORS.length; i++) {
      const goo = GOO_COLORS[i];
      const sx = P.x + 150 + i * 180, sy = L.gooY;
      const sel = this.goos.indexOf(goo) >= 0;
      if (sel) {
        ctx.strokeStyle = '#4a3b5c'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(sx, sy, 50, 0, TAU); ctx.stroke();
      }
      const gg = ctx.createLinearGradient(0, sy - 40, 0, sy + 40);
      gg.addColorStop(0, Util.shade(goo.hex, 30));
      gg.addColorStop(1, Util.shade(goo.hex, -10));
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(sx, sy, 40, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.ellipse(sx - 13, sy - 15, 11, 7, -0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#4a3b5c';
      ctx.font = 'bold 19px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(goo.name, sx, sy + 64);
    }

    // step 3: name
    ctx.textAlign = 'left';
    ctx.font = 'bold 26px "Baloo 2", sans-serif';
    ctx.fillStyle = '#4a3b5c';
    ctx.fillText('3. Name your creation:', P.x + 44, L.nameLabelY);
    ctx.fillStyle = '#ffffff';
    Util.rr(ctx, P.x + 180, L.nameY, 300, 68, 20);
    ctx.fill();
    ctx.strokeStyle = '#ffd6e8'; ctx.lineWidth = 4;
    Util.rr(ctx, P.x + 180, L.nameY, 300, 68, 20);
    ctx.stroke();
    ctx.fillStyle = '#4a3b5c';
    ctx.font = 'bold 27px "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.name || 'Tap to name!', P.x + 330, L.nameY + 35);

    // MIX button
    const ready = this.parents.length === 2;
    ctx.fillStyle = ready ? '#ff6f9f' : '#c9bcd8';
    Util.rr(ctx, P.x + 190, L.mixY, 280, 86, 24);
    ctx.fill();
    if (ready) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      Util.rr(ctx, P.x + 190, L.mixY, 280, 32, 18);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px "Baloo 2", sans-serif';
    ctx.fillText('MIX!', P.x + 330, L.mixY + 45);

    // snapshot button
    ctx.fillStyle = '#a893d8';
    Util.rr(ctx, P.x + 190, L.snapY, 280, 58, 20);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Baloo 2", sans-serif';
    ctx.fillText('Snapshot', P.x + 330, L.snapY + 30);

    ctx.restore();
  }
}
Mixer._c = {};
