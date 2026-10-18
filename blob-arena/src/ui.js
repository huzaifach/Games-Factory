/* ============================================================
   BLOB ARENA — ui.js
   Every screen is drawn on canvas (no DOM layout to break on
   phones): loading, title, countdown, HUD, death card, results.
   Buttons are hit-tested in screen space. All transitions tween —
   nothing pops.
   ============================================================ */
'use strict';

function makeUI() {
  var ui = {
    screen: 'loading',   // loading | title | countdown | play | results
    fade: 0,             // screen fade-in 0..1
    loadPct: 0, loadMsg: 'Warming up the arena…', loadError: null,
    banners: [],         // {text, sub, t, life}
    comboShown: 0,
    countdownT: 0, countdownN: 3,
    deadInfo: null,      // {by, byColor} while player awaits respawn
    results: null,       // filled by main at round end
    buttons: [],         // rebuilt per screen: {id,x,y,w,h,label,kind}
    pressId: null, pressT: 0,
    time: 0
  };

  /* ------------------------------ primitives ------------------------------ */
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function pill(c, x, y, w, h, fill, alpha) {
    c.save();
    c.globalAlpha = alpha == null ? 1 : alpha;
    rr(c, x, y, w, h, h / 2);
    c.fillStyle = fill; c.fill();
    c.restore();
  }
  function text(c, str, x, y, size, color, align, weight, stroke) {
    c.font = (weight || 600) + ' ' + size + 'px system-ui, -apple-system, sans-serif';
    c.textAlign = align || 'center';
    c.textBaseline = 'middle';
    if (stroke) { c.lineWidth = Math.max(2, size / 7); c.strokeStyle = stroke; c.strokeText(str, x, y); }
    c.fillStyle = color;
    c.fillText(str, x, y);
  }

  function addButton(id, x, y, w, h, label, kind) {
    ui.buttons.push({ id: id, x: x, y: y, w: w, h: h, label: label, kind: kind || 'primary' });
  }
  function drawButton(c, b) {
    var pressed = ui.pressId === b.id ? Math.max(0, 1 - (ui.time - ui.pressT) * 6) : 0;
    var s = 1 - pressed * 0.08;
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    c.save();
    c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy);
    var grad = c.createLinearGradient(0, b.y, 0, b.y + b.h);
    if (b.kind === 'primary') {
      grad.addColorStop(0, '#37e08b'); grad.addColorStop(1, '#0f9d58');
    } else if (b.kind === 'danger') {
      grad.addColorStop(0, '#ff6b7e'); grad.addColorStop(1, '#c81e4e');
    } else {
      grad.addColorStop(0, '#2b5a78'); grad.addColorStop(1, '#16324a');
    }
    rr(c, b.x, b.y, b.w, b.h, 18);
    c.fillStyle = grad; c.fill();
    c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.stroke();
    /* gloss */
    rr(c, b.x + 4, b.y + 3, b.w - 8, b.h * 0.42, 12);
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.fill();
    text(c, b.label, cx, cy + 1, Math.min(24, b.h * 0.34), '#ffffff', 'center', 800, 'rgba(0,40,20,0.4)');
    c.restore();
  }

  ui.tap = function (x, y) {
    for (var i = ui.buttons.length - 1; i >= 0; i--) {
      var b = ui.buttons[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        ui.pressId = b.id; ui.pressT = ui.time;
        return b.id;
      }
    }
    return null;
  };

  ui.setScreen = function (name) {
    ui.screen = name;
    ui.fade = 0;
    ui.buttons = [];
    ui.pressId = null;
    if (name === 'countdown') { ui.countdownT = 0; ui.countdownN = 3; }
    if (name !== 'play') ui.deadInfo = null;
  };

  ui.banner = function (mainText, sub) {
    ui.banners.push({ text: mainText, sub: sub || '', t: 0, life: 2.2 });
    if (ui.banners.length > 2) ui.banners.shift();
  };

  ui.update = function (dt) {
    ui.time += dt;
    ui.fade = Math.min(1, ui.fade + dt * 2.2);
    if (ui.deadInfo && ui._deadSince == null) ui._deadSince = ui.time;
    if (!ui.deadInfo) ui._deadSince = null;
    for (var i = ui.banners.length - 1; i >= 0; i--) {
      ui.banners[i].t += dt;
      if (ui.banners[i].t > ui.banners[i].life) ui.banners.splice(i, 1);
    }
  };

  function fmtTime(s) {
    s = Math.max(0, Math.ceil(s));
    return ((s / 60) | 0) + ':' + ('0' + (s % 60)).slice(-2);
  }

  /* -------------------------------- screens -------------------------------- */
  ui.draw = function (c, sim, meta, geom) {
    var W = geom.w, H = geom.h;
    c.save();
    c.globalAlpha = clamp(ui.fade, 0, 1);

    if (ui.screen === 'loading') drawLoading(c, W, H);
    else if (ui.screen === 'title') drawTitle(c, W, H, meta);
    else if (ui.screen === 'countdown') { drawHUD(c, sim, meta, geom); drawCountdown(c, W, H); }
    else if (ui.screen === 'play') { drawHUD(c, sim, meta, geom); if (ui.deadInfo) drawDead(c, W, H); }
    else if (ui.screen === 'results') { drawHUD(c, sim, meta, geom); drawResults(c, W, H, meta); }

    drawBanners(c, W, H);
    c.restore();
  };

  /* ------------------------------- loading ------------------------------- */
  function drawLoading(c, W, H) {
    ui.buttons = [];
    var cy = H * 0.42;
    logoText(c, 'BLOB ARENA', W / 2, cy, Math.min(64, W * 0.11));
    text(c, 'a 3-minute deep-sea battle royale', W / 2, cy + 52, 16, '#9fd8e8', 'center', 500);
    var bw = Math.min(320, W * 0.7), bx = W / 2 - bw / 2, by = H * 0.62;
    pill(c, bx, by, bw, 14, 'rgba(10,30,48,0.9)');
    var f = clamp(ui.loadPct / 100, 0, 1);
    if (f > 0.01) {
      var g = c.createLinearGradient(bx, 0, bx + bw, 0);
      g.addColorStop(0, '#37e08b'); g.addColorStop(1, '#4fe3ff');
      pill(c, bx + 2, by + 2, (bw - 4) * f, 10, g);
    }
    text(c, Math.round(ui.loadPct) + '%', W / 2, by + 34, 15, '#cfe9ff', 'center', 700);
    if (ui.loadError) {
      text(c, ui.loadError, W / 2, by + 62, 14, '#ff8fa3', 'center', 600);
      ui.buttons = [];
      addButton('retry', W / 2 - 110, by + 84, 220, 54, 'TRY AGAIN', 'danger');
      for (var i = 0; i < ui.buttons.length; i++) drawButton(c, ui.buttons[i]);
    } else {
      text(c, ui.loadMsg, W / 2, by + 62, 14, '#7fa8bd', 'center', 500);
    }
  }

  function logoText(c, str, x, y, size) {
    c.font = '900 ' + size + 'px system-ui, -apple-system, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    var g = c.createLinearGradient(0, y - size / 2, 0, y + size / 2);
    g.addColorStop(0, '#d8fff1'); g.addColorStop(0.5, '#4fe3a8'); g.addColorStop(1, '#0f9d58');
    c.lineWidth = Math.max(3, size / 12);
    c.strokeStyle = 'rgba(3,20,14,0.85)';
    c.strokeText(str, x, y);
    c.fillStyle = g; c.fillText(str, x, y);
    /* glossy highlight */
    c.save();
    c.globalAlpha = 0.35; c.fillStyle = '#ffffff';
    c.font = '900 ' + size + 'px system-ui, -apple-system, sans-serif';
    c.fillText(str, x, y - size * 0.06);
    c.restore();
  }

  /* -------------------------------- title -------------------------------- */
  function drawTitle(c, W, H, meta) {
    ui.buttons = [];
    /* dim the arena behind */
    c.fillStyle = 'rgba(2,10,20,0.55)';
    c.fillRect(0, 0, W, H);

    var cy = H * 0.30;
    logoText(c, 'BLOB ARENA', W / 2, cy, Math.min(72, W * 0.125));
    text(c, 'Eat. Dodge. Devour. Survive the storm.', W / 2, cy + 56, 17, '#bfe9f5', 'center', 500);

    /* crown / legend status */
    var y0 = H * 0.44;
    if (meta.legend) {
      pill(c, W / 2 - 150, y0 - 22, 300, 44, 'rgba(60,40,8,0.85)');
      text(c, 'ARENA LEGEND', W / 2, y0, 20, '#ffd94d', 'center', 900, 'rgba(0,0,0,0.5)');
    } else if (meta.crowns > 0) {
      var label = 'CROWNS: ' + meta.crowns + ' / 3';
      pill(c, W / 2 - 130, y0 - 22, 260, 44, 'rgba(60,40,8,0.85)');
      text(c, label, W / 2, y0, 19, '#ffd94d', 'center', 800, 'rgba(0,0,0,0.5)');
    } else {
      text(c, 'Win rounds to earn crowns — 3 crowns makes you an Arena Legend',
           W / 2, y0, 14, '#8fb6c9', 'center', 500);
    }

    /* how to play */
    var hy = H * 0.55;
    text(c, 'HOW TO PLAY', W / 2, hy, 15, '#7fd8c9', 'center', 800);
    var lines = [
      'Drag anywhere to swim — eat the glowing pellets',
      'Bigger blobs eat smaller ones. You are lunch until you aren\'t.',
      'One DASH per life: escape, or lunge for the kill',
      'Final 30 seconds: the storm closes in. No hiding.'
    ];
    for (var i = 0; i < lines.length; i++)
      text(c, '•  ' + lines[i], W / 2, hy + 28 + i * 24, 14, '#cfe9ff', 'center', 500);

    if (meta.best && meta.best.wins > 0)
      text(c, 'Career: ' + meta.best.wins + ' wins  •  biggest blob ' + Math.round(meta.best.biggest),
           W / 2, hy + 28 + lines.length * 24 + 8, 13, '#7fa8bd', 'center', 600);

    addButton('start', W / 2 - 130, H * 0.80, 260, 62, 'DIVE IN', 'primary');
    addButton('mute', W - 64, 24, 44, 44, meta.muted ? '✕' : '♪', 'ghost');
    for (i = 0; i < ui.buttons.length; i++) drawButton(c, ui.buttons[i]);
  }

  /* ------------------------------- countdown ------------------------------- */
  function drawCountdown(c, W, H) {
    var n = ui.countdownN;
    var label = n > 0 ? String(n) : 'GO!';
    var frac = 1 - (ui.countdownT % 1);
    var s = easeOutBack(clamp(1 - frac, 0, 1)) * Math.min(120, W * 0.22);
    c.save();
    c.globalAlpha = clamp(frac * 1.4, 0, 1);
    text(c, label, W / 2, H * 0.42, Math.max(40, s), n > 0 ? '#ffffff' : '#5eff8a',
         'center', 900, 'rgba(2,20,30,0.8)');
    c.restore();
  }

  /* ---------------------------------- HUD ---------------------------------- */
  function drawHUD(c, sim, meta, geom) {
    var W = geom.w, H = geom.h;
    ui.buttons = [];

    /* timer pill, top center — pulses red in the storm */
    var storm = sim.timeLeft <= 30.5;
    var tw = 108, tx = W / 2 - tw / 2, ty = 14;
    var pulse = storm ? 0.75 + 0.25 * Math.sin(ui.time * 7) : 1;
    pill(c, tx, ty, tw, 40, storm ? 'rgba(120,16,36,0.88)' : 'rgba(8,26,42,0.82)');
    c.save(); c.globalAlpha = pulse;
    text(c, fmtTime(sim.timeLeft), W / 2, ty + 21, 22, storm ? '#ffdfe6' : '#eaf7ff', 'center', 800);
    c.restore();
    if (storm) text(c, 'STORM', W / 2, ty + 52, 11, '#ff8fa3', 'center', 800);

    /* leaderboard, top right */
    var lb = sim.leaderboard();
    var rows = 5, rh = 26, lw = 168;
    var lx = W - lw - 10, ly = 14;
    pill(c, lx, ly, lw, 30 + rows * rh + 8, 'rgba(8,26,42,0.72)');
    text(c, 'LEADERS', lx + lw / 2, ly + 16, 12, '#7fd8c9', 'center', 800);
    var meRank = -1;
    for (var i = 0; i < lb.length; i++) if (lb[i].isPlayer) meRank = i + 1;
    for (i = 0; i < Math.min(rows, lb.length); i++) {
      var b = lb[i], ry = ly + 34 + i * rh;
      var nm = (b.isPlayer ? 'YOU' : b.name) + (b.crown ? ' ♛' : '');
      text(c, (i + 1) + '.', lx + 14, ry, 12, '#9fd8e8', 'left', 700);
      text(c, nm, lx + 30, ry, 12, b.isPlayer ? '#ffffff' : b.color, 'left', b.isPlayer ? 800 : 600);
      var bw2 = (b.mass / Math.max(lb[0].mass, 1)) * 52;
      pill(c, lx + lw - 60, ry - 6, 52, 10, 'rgba(255,255,255,0.12)');
      if (bw2 > 2) pill(c, lx + lw - 60, ry - 6, bw2, 10, b.color);
    }
    if (meRank > rows)
      text(c, 'You: #' + meRank, lx + lw / 2, ly + 34 + rows * rh - 2, 12, '#ffffff', 'center', 700);

    /* kill feed, top left */
    var fy = 66;
    for (i = 0; i < sim.feed.length; i++) {
      var f = sim.feed[i];
      var age = sim.time - f.t;
      var a = age > 4.5 ? clamp(1 - (age - 4.5), 0, 1) : 1;
      c.save(); c.globalAlpha = a * 0.95;
      pill(c, 10, fy - 11, Math.min(W * 0.62, 20 + f.text.length * 7.2), 22, 'rgba(6,20,34,0.72)');
      c.font = '600 12.5px system-ui, sans-serif';
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillStyle = f.color;
      c.fillText(f.text, 20, fy);
      c.restore();
      fy += 27;
    }

    /* combo meter */
    var p = sim.player;
    if (p && p.alive && p.combo >= 3) {
      var cs = 1 + 0.25 * Math.sin(ui.time * 10);
      c.save();
      c.translate(76, H * 0.40); c.scale(cs, cs);
      text(c, 'x' + p.combo, 0, 0, 34, '#ffe066', 'center', 900, 'rgba(60,30,0,0.7)');
      text(c, 'COMBO', 0, 26, 13, '#ffb84d', 'center', 800);
      c.restore();
    }

    /* dash button (touch) + hint (desktop) */
    if (p && p.alive && ui.screen === 'play') {
      var dx = W - 96, dy = H - 108, dr = 44;
      var ready = !p.dashUsed;
      c.save();
      c.globalAlpha = ready ? 1 : 0.35;
      var dg = c.createRadialGradient(dx - 10, dy - 12, 6, dx, dy, dr);
      if (ready) { dg.addColorStop(0, '#8ef7ff'); dg.addColorStop(1, '#1d7fa8'); }
      else { dg.addColorStop(0, '#5a6b7a'); dg.addColorStop(1, '#2c3a46'); }
      c.fillStyle = dg;
      c.beginPath(); c.arc(dx, dy, dr, 0, TAU); c.fill();
      c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.stroke();
      text(c, 'DASH', dx, dy - 6, 16, '#ffffff', 'center', 900, 'rgba(0,30,40,0.5)');
      text(c, ready ? '1 left' : 'used', dx, dy + 14, 11, '#eaf7ff', 'center', 700);
      c.restore();
      ui.dashBtn = { x: dx - dr, y: dy - dr, w: dr * 2, h: dr * 2 };
    } else ui.dashBtn = null;

    /* mute */
    addButton('mute', 10, 12, 40, 40, meta.muted ? '✕' : '♪', 'ghost');
    for (i = 0; i < ui.buttons.length; i++) drawButton(c, ui.buttons[i]);
  }

  /* ------------------------------- dead card ------------------------------- */
  function drawDead(c, W, H) {
    c.fillStyle = 'rgba(2,8,16,0.45)';
    c.fillRect(0, 0, W, H);
    ui.buttons = [];
    var bw = Math.min(340, W * 0.86), bh = 210;
    var bx = W / 2 - bw / 2, by = H * 0.36 - bh / 2;
    var pop = easeOutBack(clamp((ui.time - (ui._deadSince || 0)) * 3.2, 0, 1));
    c.save();
    c.translate(W / 2, H * 0.36); c.scale(Math.max(pop, 0.01), Math.max(pop, 0.01));
    c.translate(-W / 2, -(H * 0.36));
    pill(c, bx, by, bw, bh, 'rgba(10,28,46,0.96)');
    c.lineWidth = 2; c.strokeStyle = 'rgba(255,120,140,0.4)';
    rr(c, bx, by, bw, bh, 20); c.stroke();
    text(c, 'GOBBLED UP!', W / 2, by + 44, 28, '#ff8fa3', 'center', 900);
    text(c, 'by ' + ui.deadInfo.by, W / 2, by + 76, 16, ui.deadInfo.byColor, 'center', 700);
    text(c, 'The arena shows no mercy.', W / 2, by + 102, 13, '#8fb6c9', 'center', 500);
    addButton('respawn', W / 2 - 110, by + 124, 220, 54, 'SWIM AGAIN', 'primary');
    for (var i = 0; i < ui.buttons.length; i++) drawButton(c, ui.buttons[i]);
    c.restore();
  }

  /* -------------------------------- results -------------------------------- */
  function drawResults(c, W, H, meta) {
    var R = ui.results;
    if (!R) return;
    c.fillStyle = 'rgba(2,10,20,0.62)';
    c.fillRect(0, 0, W, H);
    ui.buttons = [];

    var bw = Math.min(380, W * 0.92);
    var rows = Math.min(6, R.standings.length);
    var bh = 300 + rows * 30;
    var bx = W / 2 - bw / 2, by = Math.max(60, H * 0.5 - bh / 2);
    var pop = easeOutBack(clamp(ui.fade * 1.4, 0, 1));
    c.save();
    c.translate(W / 2, by); c.scale(Math.max(pop, 0.01), Math.max(pop, 0.01));
    c.translate(-W / 2, -by);

    pill(c, bx, by, bw, bh, 'rgba(10,28,46,0.97)');
    c.lineWidth = 2; c.strokeStyle = 'rgba(120,220,255,0.3)';
    rr(c, bx, by, bw, bh, 22); c.stroke();

    var y = by + 40;
    if (R.playerWon) {
      text(c, 'VICTORY!', W / 2, y, 34, '#ffd94d', 'center', 900, 'rgba(60,30,0,0.6)');
      y += 8;
      if (renderer_drawCrown) renderer_drawCrown(W / 2, y + 26, 30, ui.time);
      y += 62;
      text(c, 'You rule the arena' + (R.crownEarned ? ' — crown earned!' : ''),
           W / 2, y, 15, '#ffe9a8', 'center', 700);
    } else {
      text(c, 'ROUND OVER', W / 2, y, 30, '#cfe9ff', 'center', 900, 'rgba(2,20,30,0.7)');
      y += 34;
      text(c, R.winner + ' takes the crown', W / 2, y, 16, R.winnerColor, 'center', 700);
    }
    y += 40;

    /* standings */
    text(c, 'FINAL STANDINGS', W / 2, y, 13, '#7fd8c9', 'center', 800);
    y += 22;
    for (var i = 0; i < rows; i++) {
      var s = R.standings[i];
      var ry = y + i * 30;
      if (s.isPlayer) pill(c, bx + 18, ry - 13, bw - 36, 26, 'rgba(90,220,150,0.14)');
      text(c, '#' + (i + 1), bx + 40, ry, 13, '#9fd8e8', 'center', 700);
      text(c, (s.isPlayer ? 'YOU' : s.name), bx + 62, ry, 14,
           s.isPlayer ? '#ffffff' : s.color, 'left', 700);
      text(c, 'size ' + Math.round(s.r), bx + bw - 44, ry, 13, '#8fb6c9', 'right', 600);
    }
    y += rows * 30 + 14;

    /* player stats */
    var st = R.stats;
    text(c, 'Pellets ' + st.eaten + '   •   Eliminations ' + st.kills +
            '   •   Biggest ' + Math.round(st.biggest),
         W / 2, y, 13, '#9fd8e8', 'center', 600);
    y += 26;

    /* crown progress */
    if (!meta.legend) {
      var slots = '';
      for (var k = 0; k < 3; k++) slots += k < meta.crowns ? '♛ ' : '· ';
      text(c, 'Crowns: ' + slots + '  (' + meta.crowns + '/3 to Arena Legend)',
           W / 2, y, 13, '#ffd94d', 'center', 700);
    } else {
      text(c, '♛ ARENA LEGEND ♛', W / 2, y, 15, '#ffd94d', 'center', 900);
    }
    y += 34;

    addButton('again', W / 2 - 120, y, 240, 58, 'PLAY AGAIN', 'primary');
    addButton('title2', W / 2 - 90, y + 68, 180, 44, 'TITLE', 'ghost');
    for (i = 0; i < ui.buttons.length; i++) drawButton(c, ui.buttons[i]);
    c.restore();
  }

  /* -------------------------------- banners -------------------------------- */
  function drawBanners(c, W, H) {
    for (var i = 0; i < ui.banners.length; i++) {
      var b = ui.banners[i];
      var t = b.t;
      var sIn = easeOutBack(clamp(t / 0.35, 0, 1));
      var aOut = t > b.life - 0.5 ? clamp((b.life - t) / 0.5, 0, 1) : 1;
      c.save();
      c.globalAlpha = aOut;
      c.translate(W / 2, H * 0.30 - i * 64);
      c.scale(Math.max(sIn, 0.01), Math.max(sIn, 0.01));
      text(c, b.text, 0, 0, 40, '#ffe066', 'center', 900, 'rgba(60,30,0,0.75)');
      if (b.sub) text(c, b.sub, 0, 32, 16, '#eaf7ff', 'center', 600, 'rgba(2,20,30,0.7)');
      c.restore();
    }
  }

  return ui;
}
