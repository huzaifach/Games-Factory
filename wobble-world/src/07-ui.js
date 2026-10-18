'use strict';
/* WOBBLE WORLD — 07-ui.js : screens, HUD, journal, tutorial hints, toasts,
   DOM overlay (name input + snapshot card). All game UI text is in English. */

class UIButton {
  constructor(x, y, w, h, label, onTap, opts) {
    opts = opts || {};
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.label = label;
    this.onTap = onTap;
    this.fontSize = opts.fontSize || 30;
    this.fill = opts.fill || ['#ff9ebb', '#ff6f9f'];
    this.textColor = opts.textColor || '#ffffff';
    this.circle = !!opts.circle;
    this.icon = opts.icon || null; // fn(ctx, cx, cy, s)
    this.pressT = 0;
    this.visible = true;
  }
  hit(x, y) {
    if (!this.visible) return false;
    if (this.circle) return Util.dist(x, y, this.x, this.y) < this.w / 2 + 8;
    return x > this.x - this.w / 2 && x < this.x + this.w / 2 &&
           y > this.y - this.h / 2 && y < this.y + this.h / 2;
  }
  press() { this.pressT = 1; }
  update(dt) { if (this.pressT > 0) this.pressT = Math.max(0, this.pressT - dt * 5); }
  draw(ctx, game) {
    if (!this.visible) return;
    const sq = 1 - this.pressT * 0.1;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(sq, sq);
    if (this.circle) {
      const r = this.w / 2;
      const g = ctx.createLinearGradient(0, -r, 0, r);
      g.addColorStop(0, this.fill[0]); g.addColorStop(1, this.fill[1]);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.4, r * 0.22, -0.4, 0, TAU); ctx.fill();
      if (this.icon) this.icon(ctx, 0, 0, r * 0.9);
      else {
        ctx.fillStyle = this.textColor;
        ctx.font = 'bold ' + this.fontSize + 'px "Baloo 2", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.label, 0, 2);
      }
    } else {
      const g = ctx.createLinearGradient(0, -this.h / 2, 0, this.h / 2);
      g.addColorStop(0, this.fill[0]); g.addColorStop(1, this.fill[1]);
      // soft drop shadow
      ctx.fillStyle = 'rgba(74,59,92,0.18)';
      Util.rr(ctx, -this.w / 2 + 3, -this.h / 2 + 7, this.w, this.h, this.h / 2.6);
      ctx.fill();
      ctx.fillStyle = g;
      Util.rr(ctx, -this.w / 2, -this.h / 2, this.w, this.h, this.h / 2.6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      Util.rr(ctx, -this.w / 2 + 8, -this.h / 2 + 6, this.w - 16, this.h * 0.36, this.h / 4);
      ctx.fill();
      if (this.icon) this.icon(ctx, -this.w / 2 + 44, 0, 30);
      ctx.fillStyle = this.textColor;
      ctx.font = 'bold ' + this.fontSize + 'px "Baloo 2", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.label, this.icon ? 18 : 0, 2);
    }
    ctx.restore();
  }
}

/* ---------- giggle journal icons (tiny canvas glyphs) ---------- */
function drawGiggleIcon(ctx, icon, x, y, s, found) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = found ? 1 : 0.35;
  const main = found ? '#ff6f9f' : '#8d84a0';
  const soft = found ? '#ffd6e8' : '#cfc8dc';
  ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.strokeStyle = main;
  ctx.fillStyle = main;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const u = s / 2;
  switch (icon) {
    case 'tower':
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 ? '#7fe3b2' : '#ff8fb3';
        if (!found) ctx.fillStyle = '#b9b2c9';
        Util.rr(ctx, -u * 0.7, u * 0.7 - (i + 1) * u * 0.5, u * 1.4, u * 0.44, 4);
        ctx.fill();
      }
      break;
    case 'droplet':
      ctx.fillStyle = found ? '#4ec9ff' : '#b9b2c9';
      ctx.beginPath();
      ctx.moveTo(0, -u);
      ctx.bezierCurveTo(u * 0.8, -u * 0.1, u * 0.6, u * 0.7, 0, u * 0.7);
      ctx.bezierCurveTo(-u * 0.6, u * 0.7, -u * 0.8, -u * 0.1, 0, -u);
      ctx.fill();
      break;
    case 'stretch':
      ctx.beginPath(); ctx.moveTo(-u, 0); ctx.lineTo(u, 0); ctx.stroke();
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sx * u, 0); ctx.lineTo(sx * u * 0.6, -u * 0.35); ctx.lineTo(sx * u * 0.6, u * 0.35);
        ctx.closePath(); ctx.fill();
      }
      break;
    case 'bounce':
      ctx.beginPath(); ctx.arc(0, u * 0.3, u * 0.55, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -u * 0.45, u * 0.3, 0, TAU);
      ctx.fillStyle = soft; ctx.fill(); ctx.stroke();
      break;
    case 'sky':
      ctx.beginPath(); ctx.moveTo(0, u); ctx.lineTo(0, -u * 0.7); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -u); ctx.lineTo(-u * 0.45, -u * 0.4); ctx.lineTo(u * 0.45, -u * 0.4);
      ctx.closePath(); ctx.fill();
      break;
    case 'chain':
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.arc(i * u * 0.7, 0, u * 0.4, 0, TAU);
        ctx.fillStyle = soft; ctx.fill(); ctx.stroke();
      }
      break;
    case 'magnet':
      ctx.lineWidth = u * 0.5;
      ctx.beginPath(); ctx.arc(0, -u * 0.1, u * 0.55, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = found ? '#ff7b8a' : '#b9b2c9';
      ctx.fillRect(-u * 0.8, -u * 0.1, u * 0.5, u * 0.4);
      ctx.fillStyle = found ? '#6f8cff' : '#b9b2c9';
      ctx.fillRect(u * 0.3, -u * 0.1, u * 0.5, u * 0.4);
      break;
    case 'pop':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * u * 0.3, Math.sin(a) * u * 0.3);
        ctx.lineTo(Math.cos(a) * u, Math.sin(a) * u);
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, u * 0.22, 0, TAU); ctx.fill();
      break;
    case 'sticky':
      ctx.fillStyle = found ? '#7fe3b2' : '#b9b2c9';
      ctx.beginPath(); ctx.arc(0, -u * 0.2, u * 0.6, 0, TAU); ctx.fill();
      ctx.fillRect(-u * 0.14, u * 0.2, u * 0.28, u * 0.7);
      ctx.beginPath(); ctx.arc(0, u * 0.9, u * 0.14, 0, TAU); ctx.fill();
      break;
    case 'ride':
      ctx.beginPath(); ctx.arc(0, -u * 0.25, u * 0.7, 0, TAU); ctx.stroke();
      ctx.fillStyle = soft;
      ctx.beginPath(); ctx.arc(0, u * 0.45, u * 0.32, 0, TAU); ctx.fill();
      break;
    case 'splash':
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-u, i * u * 0.5);
        ctx.quadraticCurveTo(-u * 0.5, i * u * 0.5 - u * 0.4, 0, i * u * 0.5);
        ctx.quadraticCurveTo(u * 0.5, i * u * 0.5 + u * 0.4, u, i * u * 0.5);
        ctx.stroke();
      }
      break;
    case 'paint':
      ctx.fillStyle = '#ff8fb3';
      ctx.beginPath(); ctx.arc(-u * 0.25, 0, u * 0.45, 0, TAU); ctx.fill();
      ctx.fillStyle = '#4ec9ff';
      ctx.beginPath(); ctx.arc(u * 0.3, -u * 0.1, u * 0.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd94e';
      ctx.beginPath(); ctx.arc(u * 0.05, u * 0.4, u * 0.32, 0, TAU); ctx.fill();
      break;
    case 'seesaw':
      ctx.save(); ctx.rotate(-0.35);
      ctx.fillStyle = found ? '#ffd166' : '#b9b2c9';
      ctx.fillRect(-u, -u * 0.16, u * 2, u * 0.32);
      ctx.restore();
      ctx.fillStyle = main;
      ctx.beginPath();
      ctx.moveTo(-u * 0.4, u); ctx.lineTo(u * 0.4, u); ctx.lineTo(0, u * 0.25);
      ctx.closePath(); ctx.fill();
      break;
    case 'flower':
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU - Math.PI / 2;
        ctx.fillStyle = found ? '#ff9ebb' : '#b9b2c9';
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * u * 0.5, Math.sin(a) * u * 0.5, u * 0.34, u * 0.24, a, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(0, 0, u * 0.28, 0, TAU); ctx.fill();
      break;
    case 'wake':
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(0, 0, u * 0.45, 0, TAU); ctx.fill();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * u * 0.6, Math.sin(a) * u * 0.6);
        ctx.lineTo(Math.cos(a) * u * 0.9, Math.sin(a) * u * 0.9);
        ctx.stroke();
      }
      break;
    case 'pillow':
      ctx.fillStyle = soft;
      Util.rr(ctx, -u, -u * 0.6, u * 2, u * 1.2, u * 0.4);
      ctx.fill();
      ctx.stroke();
      break;
    case 'nap':
      ctx.fillStyle = main;
      ctx.font = 'bold ' + Math.round(u * 1.6) + 'px "Baloo 2", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Z', u * 0.3, -u * 0.3);
      ctx.font = 'bold ' + Math.round(u * 1.1) + 'px "Baloo 2", sans-serif';
      ctx.fillText('Z', -u * 0.35, u * 0.35);
      break;
    case 'splat':
      ctx.fillStyle = found ? '#ffb14e' : '#b9b2c9';
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU - Math.PI / 2;
        const rr = (i % 2 === 0) ? u : u * 0.55;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
      break;
    default:
      ctx.beginPath(); ctx.arc(0, 0, u * 0.5, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* ---------- screens ---------- */
function drawTitle(ctx, game) {
  const t = game.time;
  // backdrop
  const g = ctx.createLinearGradient(0, 0, 0, STAGE_H);
  g.addColorStop(0, '#ffe3ef'); g.addColorStop(1, '#ffd0e3');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  // drifting deco blobs
  for (let i = 0; i < 6; i++) {
    const bx = 120 + i * 118 + Math.sin(t * 0.7 + i * 2) * 24;
    const by = 240 + ((i * 173) % 700) + Math.cos(t * 0.5 + i) * 18;
    const br = 44 + (i % 3) * 14;
    const col = ['#ff8fb3', '#7fe3b2', '#ffd94e', '#4ec9ff', '#c3b2f2', '#ffb14e'][i];
    ctx.globalAlpha = 0.5;
    const bg = ctx.createLinearGradient(0, by - br, 0, by + br);
    bg.addColorStop(0, Util.shade(col, 32)); bg.addColorStop(1, Util.shade(col, -8));
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // mascot blobs flanking the logo
  drawMascot(ctx, 130, 470, 74, '#ff8fb3', t, 'bouncy');
  drawMascot(ctx, 670, 470, 74, '#7fe3b2', t + 2, 'sticky');
  // logo: each letter bounces on its own spring
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const word1 = 'WOBBLE', word2 = 'WORLD';
  const cols = ['#ff6f9f', '#ff9e57', '#ffd166', '#7fe3b2', '#4ec9ff', '#c39bff'];
  let x = STAGE_W / 2 - (word1.length - 1) * 44;
  ctx.font = 'bold 96px "Baloo 2", sans-serif';
  for (let i = 0; i < word1.length; i++) {
    const bounce = Math.abs(Math.sin(t * 2.2 + i * 0.55)) * -26;
    ctx.fillStyle = cols[i % cols.length];
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10;
    ctx.strokeText(word1[i], x, 400 + bounce);
    ctx.fillText(word1[i], x, 400 + bounce);
    x += 88;
  }
  x = STAGE_W / 2 - (word2.length - 1) * 44;
  for (let i = 0; i < word2.length; i++) {
    const bounce = Math.abs(Math.sin(t * 2.2 + i * 0.55 + 2)) * -26;
    ctx.fillStyle = cols[(i + 3) % cols.length];
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10;
    ctx.strokeText(word2[i], x, 500 + bounce);
    ctx.fillText(word2[i], x, 500 + bounce);
    x += 88;
  }
  ctx.fillStyle = '#7a6a8f';
  ctx.font = '24px "Baloo 2", sans-serif';
  ctx.fillText('A jelly toy box full of giggles', STAGE_W / 2, 590);
  // buttons
  for (const b of game.buttons) b.draw(ctx, game);
  // progress note
  ctx.fillStyle = '#a08fb8';
  ctx.font = '20px "Baloo 2", sans-serif';
  const n = game.save.found.length;
  if (n > 0) ctx.fillText('Giggle moments found: ' + n + ' / ' + GIGGLE_TOTAL, STAGE_W / 2, 1090);
}

function drawMascot(ctx, x, y, r, color, t, kind) {
  const hop = Math.abs(Math.sin(t * 2.4)) * -22;
  const sq = 1 + Math.sin(t * 4.8) * 0.05;
  ctx.save();
  ctx.translate(x, y + hop);
  ctx.scale(1 / sq, sq);
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, Util.shade(color, 36)); g.addColorStop(1, Util.shade(color, -12));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.ellipse(-r * 0.34, -r * 0.4, r * 0.3, r * 0.17, -0.5, 0, TAU); ctx.fill();
  // eyes
  ctx.fillStyle = '#ffffff';
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(sx * r * 0.32, -r * 0.1, r * 0.18, r * 0.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a3b5c';
    ctx.beginPath(); ctx.arc(sx * r * 0.32, -r * 0.08, r * 0.08, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff';
  }
  // smile
  ctx.strokeStyle = '#4a3b5c'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, r * 0.22, r * 0.3, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
  ctx.restore();
}

function drawHowto(ctx, game) {
  const g = ctx.createLinearGradient(0, 0, 0, STAGE_H);
  g.addColorStop(0, '#e3f2ff'); g.addColorStop(1, '#cfe8ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4a3b5c';
  ctx.font = 'bold 44px "Baloo 2", sans-serif';
  ctx.fillText('How to Play', STAGE_W / 2, 130);
  const steps = [
    { n: '1', title: 'GRAB', desc: 'Touch a jelly friend to grab it.', col: '#ff8fb3' },
    { n: '2', title: 'STRETCH', desc: 'Drag far, far away...', col: '#ffd166' },
    { n: '3', title: 'FLING!', desc: 'Let go and giggle!', col: '#7fe3b2' }
  ];
  for (let i = 0; i < 3; i++) {
    const y = 300 + i * 250;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    Util.rr(ctx, 90, y - 100, 620, 210, 26);
    ctx.fill();
    // illustration
    const ix = 200;
    drawHowtoArt(ctx, i, ix, y + 10, game.time);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4a3b5c';
    ctx.font = 'bold 34px "Baloo 2", sans-serif';
    ctx.fillText(steps[i].title, 330, y - 34);
    ctx.font = '23px "Baloo 2", sans-serif';
    ctx.fillStyle = '#6a5a80';
    ctx.fillText(steps[i].desc, 330, y + 14);
    // number badge
    ctx.fillStyle = steps[i].col;
    ctx.beginPath(); ctx.arc(130, y - 60, 30, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(steps[i].n, 130, y - 58);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7a6a8f';
  ctx.font = '22px "Baloo 2", sans-serif';
  ctx.fillText('Find all 18 hidden giggle moments!', STAGE_W / 2, 1020);
  for (const b of game.buttons) b.draw(ctx, game);
}

function drawHowtoArt(ctx, step, x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  if (step === 0) {
    // finger touching blob
    jellyBlobArt(ctx, 0, 10, 46, '#ff8fb3', 0.15);
    ctx.fillStyle = '#ffd9b3';
    ctx.beginPath(); ctx.arc(52, -34, 20, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#e8a06c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(52, -34, 20, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#4a3b5c'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 10, 62, -0.5, 0.9); ctx.stroke();
  } else if (step === 1) {
    // stretched blob with arrows
    ctx.save(); ctx.scale(1.7, 0.75);
    jellyBlobArt(ctx, 0, 0, 40, '#ffd166', 0);
    ctx.restore();
    ctx.strokeStyle = '#4a3b5c'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const sx of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sx * 70, 0); ctx.lineTo(sx * 104, 0); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx * 104, 0); ctx.lineTo(sx * 88, -10); ctx.lineTo(sx * 88, 10);
      ctx.closePath(); ctx.fillStyle = '#4a3b5c'; ctx.fill();
    }
  } else {
    // fling arc
    ctx.strokeStyle = '#4a3b5c'; ctx.lineWidth = 4; ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.arc(-20, 60, 70, -Math.PI / 2 - 0.4, 0.5); ctx.stroke();
    ctx.setLineDash([]);
    const ft = (t * 1.4) % 1;
    const a = -Math.PI / 2 - 0.4 + ft * 1.9;
    const bx = -20 + Math.cos(a) * 70, by = 60 + Math.sin(a) * 70;
    jellyBlobArt(ctx, bx, by, 34, '#7fe3b2', Math.sin(t * 6) * 0.06);
    for (let i = 0; i < 3; i++) {
      const sx = -60 + i * 26, sy = -52 - (i % 2) * 14;
      ctx.fillStyle = '#ffd166';
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 2 + i);
      ctx.fillRect(-7, -2, 14, 4); ctx.fillRect(-2, -7, 4, 14);
      ctx.restore();
    }
  }
  ctx.restore();
}

function jellyBlobArt(ctx, x, y, r, color, wob) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 + wob, 1 - wob);
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, Util.shade(color, 36)); g.addColorStop(1, Util.shade(color, -12));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.ellipse(-r * 0.32, -r * 0.4, r * 0.28, r * 0.15, -0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#4a3b5c';
  ctx.beginPath(); ctx.arc(-r * 0.28, -r * 0.05, r * 0.11, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.28, -r * 0.05, r * 0.11, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#4a3b5c'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, r * 0.28, r * 0.24, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
  ctx.restore();
}

function drawWorlds(ctx, game) {
  const g = ctx.createLinearGradient(0, 0, 0, STAGE_H);
  g.addColorStop(0, '#f3e8ff'); g.addColorStop(1, '#e0d0f5');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4a3b5c';
  ctx.font = 'bold 44px "Baloo 2", sans-serif';
  ctx.fillText('Pick a World', STAGE_W / 2, 120);
  const glyphs = ['tower', 'bounce', 'magnet', 'ride', 'flower', 'pillow'];
  for (let i = 0; i < DIORAMAS.length; i++) {
    const d = DIORAMAS[i];
    const col = i % 2, row = Math.floor(i / 2);
    const cw = 340, ch = 250;
    const x = 40 + col * (cw + 40), y = 190 + row * (ch + 24);
    const selected = i === game.dioramaIndex;
    ctx.fillStyle = selected ? '#fff3d6' : 'rgba(255,255,255,0.9)';
    Util.rr(ctx, x, y, cw, ch, 26);
    ctx.fill();
    ctx.strokeStyle = selected ? '#ffb14e' : '#e0d4ee';
    ctx.lineWidth = selected ? 6 : 3;
    Util.rr(ctx, x, y, cw, ch, 26);
    ctx.stroke();
    drawGiggleIcon(ctx, glyphs[i], x + 70, y + 80, 64, true);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4a3b5c';
    ctx.font = 'bold 30px "Baloo 2", sans-serif';
    ctx.fillText(d.name, x + 120, y + 56);
    ctx.font = '20px "Baloo 2", sans-serif';
    ctx.fillStyle = '#7a6a8f';
    ctx.fillText(d.tagline, x + 120, y + 96);
    // giggle progress for this world
    let found = 0;
    for (const gg of d.giggles) if (game.save.found.indexOf(gg.id) >= 0) found++;
    ctx.font = 'bold 24px "Baloo 2", sans-serif';
    ctx.fillStyle = '#d14e7f';
    ctx.textAlign = 'center';
    ctx.fillText('★ ' + found + ' / 3 giggles', x + cw / 2, y + ch - 40);
    if (selected) {
      ctx.fillStyle = '#4a3b5c';
      ctx.font = '20px "Baloo 2", sans-serif';
      ctx.fillText('— playing now —', x + cw / 2, y + ch - 72);
    }
    // invisible tap handled via card rects in game input
  }
  for (const b of game.buttons) b.draw(ctx, game);
}

function drawJournal(ctx, game) {
  ctx.fillStyle = 'rgba(40,28,58,0.55)';
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  const P = { x: 60, y: 150, w: 680, h: 900 };
  ctx.fillStyle = 'rgba(255,247,251,0.98)';
  Util.rr(ctx, P.x, P.y, P.w, P.h, 30);
  ctx.fill();
  ctx.strokeStyle = '#ffd6e8'; ctx.lineWidth = 5;
  Util.rr(ctx, P.x, P.y, P.w, P.h, 30);
  ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4a3b5c';
  ctx.font = 'bold 38px "Baloo 2", sans-serif';
  const n = game.save.found.length;
  ctx.fillText('Giggle Journal  ★ ' + n + ' / ' + GIGGLE_TOTAL, P.x + P.w / 2, P.y + 52);
  ctx.fillStyle = '#7a6a8f';
  ctx.font = '20px "Baloo 2", sans-serif';
  ctx.fillText('Can you find them all?', P.x + P.w / 2, P.y + 92);
  // two columns x three worlds
  for (let di = 0; di < DIORAMAS.length; di++) {
    const d = DIORAMAS[di];
    const col = Math.floor(di / 3), row = di % 3;
    const x0 = P.x + 36 + col * 322;
    let y = P.y + 140 + row * 246;
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px "Baloo 2", sans-serif';
    ctx.fillStyle = '#4a3b5c';
    ctx.fillText(d.name, x0, y);
    y += 46;
    for (const gg of d.giggles) {
      const found = game.save.found.indexOf(gg.id) >= 0;
      drawGiggleIcon(ctx, gg.icon, x0 + 26, y, 38, found);
      ctx.textAlign = 'left';
      ctx.font = '20px "Baloo 2", sans-serif';
      ctx.fillStyle = found ? '#4a3b5c' : '#a89dc0';
      ctx.fillText(found ? gg.name : '???', x0 + 56, y);
      y += 54;
    }
  }
  // close handled by game button
  for (const b of game.buttons) b.draw(ctx, game);
}

/* ---------- HUD ---------- */
function drawHUD(ctx, game) {
  const d = DIORAMAS[game.dioramaIndex];
  // top-left: round buttons (drawn via game.buttons, device space)
  for (const b of game.buttons) b.draw(ctx, game);
  // below buttons: world pill with name + giggle count
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const n = game.save.found.length;
  ctx.font = 'bold 22px "Baloo 2", sans-serif';
  const label = d.name + '   ★ ' + n + '/' + GIGGLE_TOTAL;
  const w = Math.min(ctx.measureText(label).width + 40, game.cw - 24);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  Util.rr(ctx, 12, 92, w, 44, 22);
  ctx.fill();
  ctx.fillStyle = '#4a3b5c';
  ctx.fillText(label, 32, 115);
  // bottom hint bar
  const hint = game.currentHint();
  ctx.font = '22px "Baloo 2", sans-serif';
  const hw = Math.min(ctx.measureText(hint).width + 60, game.cw - 32);
  const hx = (game.cw - hw) / 2, hy = game.ch - 92;
  ctx.fillStyle = 'rgba(74,59,92,0.78)';
  Util.rr(ctx, hx, hy, hw, 60, 30);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 20px "Baloo 2", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Try this:', hx + 22, hy + 31);
  ctx.fillStyle = '#ffffff';
  ctx.font = '21px "Baloo 2", sans-serif';
  // trim hint to fit
  let ht = hint;
  while (ctx.measureText(ht).width > hw - 150 && ht.length > 4) ht = ht.slice(0, -2);
  if (ht !== hint) ht = ht.slice(0, -1) + '…';
  ctx.fillText(ht, hx + 118, hy + 31);
}

function drawTutorial(ctx, game) {
  const tut = game.tutorial;
  if (!tut || tut.done || tut.step > 2) return;
  const t = game.time;
  const pulse = 1 + Math.sin(t * 7) * 0.12;
  // pulsing ring on the target (stage space)
  if (tut.target) {
    const c = tut.target.centroid(TutorialUtil._c);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.setLineDash([16, 12]);
    ctx.lineDashOffset = -t * 60;
    ctx.beginPath();
    ctx.arc(c.x, c.y, (tut.target.restR + 26) * pulse, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    if (tut.step === 1) {
      // drag arrow
      const ax = c.x + 120, ay = c.y - 60;
      const slide = Math.sin(t * 4) * 26;
      ctx.strokeStyle = '#ff6f9f'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax - 60 + slide, ay); ctx.lineTo(ax + 60 + slide, ay);
      ctx.stroke();
      ctx.fillStyle = '#ff6f9f';
      ctx.beginPath();
      ctx.moveTo(ax + 84 + slide, ay); ctx.lineTo(ax + 52 + slide, ay - 18); ctx.lineTo(ax + 52 + slide, ay + 18);
      ctx.closePath(); ctx.fill();
    }
  }
}

// tutorial text bubble: device space, below the HUD pill — never cropped
function drawTutorialBubble(ctx, game) {
  const tut = game.tutorial;
  if (!tut || tut.done || tut.step > 2) return;
  const t = game.time;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const msgs = [
    'Touch a jelly friend to grab it!',
    'Now DRAG to stretch it far!',
    'Let go — FLING!'
  ];
  const msg = msgs[tut.step];
  ctx.font = 'bold 26px "Baloo 2", sans-serif';
  const w = Math.min(ctx.measureText(msg).width + 60, game.cw - 24);
  const bx = game.cw / 2, by = 190;
  const bob = Math.sin(t * 3) * 6;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  Util.rr(ctx, bx - w / 2, by - 36 + bob, w, 68, 22);
  ctx.fill();
  ctx.strokeStyle = '#ff6f9f'; ctx.lineWidth = 4;
  Util.rr(ctx, bx - w / 2, by - 36 + bob, w, 68, 22);
  ctx.stroke();
  ctx.fillStyle = '#4a3b5c';
  ctx.fillText(msg, bx, by + bob);
}
const TutorialUtil = { _c: {} };

function drawToasts(ctx, game) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let y = game.ch - 180;
  for (let i = game.toasts.length - 1; i >= 0; i--) {
    const toast = game.toasts[i];
    const inT = Util.easeOutBack(Math.min(1, toast.t * 4));
    const alpha = toast.life < 0.5 ? toast.life * 2 : 1;
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 26px "Baloo 2", sans-serif';
    const w = ctx.measureText(toast.text).width + 56;
    ctx.save();
    ctx.translate(game.cw / 2, y);
    ctx.scale(inT, inT);
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    Util.rr(ctx, -w / 2, -30, w, 60, 30);
    ctx.fill();
    ctx.strokeStyle = '#ffd6e8'; ctx.lineWidth = 3;
    Util.rr(ctx, -w / 2, -30, w, 60, 30);
    ctx.stroke();
    ctx.fillStyle = '#d14e7f';
    ctx.fillText(toast.text, 0, 2);
    ctx.restore();
    ctx.globalAlpha = 1;
    y -= 74;
  }
}

/* ---------- DOM overlay ---------- */
const UIOverlay = {
  el() {
    if (typeof document === 'undefined') return null;
    return document.getElementById('overlay');
  },
  show(html) {
    const el = this.el();
    if (!el) return;
    el.innerHTML = html;
    el.classList.add('show');
  },
  hide() {
    const el = this.el();
    if (!el) return;
    el.classList.remove('show');
    el.innerHTML = '';
  }
};

function makeUI(game) {
  return {
    showNameInput(current, cb) {
      if (typeof document === 'undefined') { cb(current); return; }
      UIOverlay.show(
        '<div class="ov-card"><h2>Name your creation</h2>' +
        '<p>Give your new wobble friend a wonderful name!</p>' +
        '<input type="text" id="ov-name" maxlength="18" value="' + escapeHtml(current) + '">' +
        '<div class="ov-row">' +
        '<button class="ov-btn secondary" id="ov-cancel">Cancel</button>' +
        '<button class="ov-btn" id="ov-save">Save</button>' +
        '</div></div>'
      );
      const input = document.getElementById('ov-name');
      const done = (val) => { UIOverlay.hide(); cb(val); };
      document.getElementById('ov-save').onclick = () => done(input.value);
      document.getElementById('ov-cancel').onclick = () => done(null);
      input.focus();
      input.select();
      input.onkeydown = (e) => { if (e.key === 'Enter') done(input.value); };
    },
    showSnapshot(dataURL, name) {
      if (typeof document === 'undefined') return;
      UIOverlay.show(
        '<div class="ov-card"><h2>' + escapeHtml(name) + '</h2>' +
        '<p>Your wobble friend, forever!</p>' +
        '<img class="snapshot" src="' + dataURL + '" alt="Wobble World snapshot">' +
        '<a class="dl" href="' + dataURL + '" download="wobble-friend.png">Save this picture</a>' +
        '<div class="ov-row"><button class="ov-btn" id="ov-close">Done</button></div></div>'
      );
      document.getElementById('ov-close').onclick = () => UIOverlay.hide();
    },
    hideOverlay() { UIOverlay.hide(); }
  };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
