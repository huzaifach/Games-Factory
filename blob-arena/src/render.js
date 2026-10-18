/* ============================================================
   BLOB ARENA — render.js
   Canvas renderer: hand-built deep-sea background (offscreen),
   jelly-gloss blobs with spring wobble, pellets, particles,
   ripples, storm wall, camera with shake + adaptive zoom.
   ============================================================ */
'use strict';

function makeRenderer(canvas) {
  var ctx = canvas.getContext('2d');
  var dpr = 1, cssW = 0, cssH = 0;
  var bg = document.createElement('canvas');
  var cam = { x: 1300, y: 1300, zoom: 1, sx: 0, sy: 0 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssW = window.innerWidth; cssH = window.innerHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    buildBackground();
  }

  /* Deep-sea backdrop, painted once per resize (procedural texture). */
  function buildBackground() {
    bg.width = Math.max(2, Math.round(cssW * dpr / 2));
    bg.height = Math.max(2, Math.round(cssH * dpr / 2));
    var c = bg.getContext('2d');
    var w = bg.width, h = bg.height;

    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0d3a52');
    g.addColorStop(0.35, '#0a2c44');
    g.addColorStop(0.7, '#061c2e');
    g.addColorStop(1, '#030f1c');
    c.fillStyle = g; c.fillRect(0, 0, w, h);

    /* teal glow from the arena heart */
    var rg = c.createRadialGradient(w / 2, h * 0.42, 10, w / 2, h * 0.42, h * 0.75);
    rg.addColorStop(0, 'rgba(38,150,170,0.34)');
    rg.addColorStop(0.5, 'rgba(24,100,130,0.12)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = rg; c.fillRect(0, 0, w, h);

    /* god-light rays from the surface */
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 7; i++) {
      var rx = w * (0.08 + i * 0.14) + (i % 2) * w * 0.05;
      var grad = c.createLinearGradient(rx, 0, rx + w * 0.06, h);
      grad.addColorStop(0, 'rgba(140,230,255,0.10)');
      grad.addColorStop(1, 'rgba(140,230,255,0)');
      c.fillStyle = grad;
      c.beginPath();
      c.moveTo(rx, 0); c.lineTo(rx + w * 0.045, 0);
      c.lineTo(rx + w * 0.11, h); c.lineTo(rx + w * 0.02, h);
      c.closePath(); c.fill();
    }
    c.restore();

    /* faint current swirls (texture only) */
    c.strokeStyle = 'rgba(120,220,255,0.05)';
    c.lineWidth = Math.max(1, w / 400);
    for (var s = 0; s < 9; s++) {
      var sx = (s * 0.13 + 0.05) * w, sy = (s * 0.29 + 0.1) * h, sr = w * 0.05;
      c.beginPath(); c.arc(sx, sy, sr, s, s + 4.2); c.stroke();
    }

    /* vignette */
    var v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.36,
                                   w / 2, h / 2, Math.max(w, h) * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,8,18,0.55)');
    c.fillStyle = v; c.fillRect(0, 0, w, h);
  }

  /* ------------------------------ jelly blob ------------------------------ */
  var SEG = 16;
  function drawBlob(b, time) {
    var absorbScale = b.absorbT > 0 ? Math.max(b.absorbT / CFG.absorbTime, 0.01) : 1;
    var r = Math.max(b.drawR * (1 + b.pop) * absorbScale, 0.5);
    if (r < 1.5) return;

    ctx.save();
    ctx.translate(b.x, b.y);

    /* dash stretch / squash along movement */
    if (b.squash > 0.01) {
      ctx.rotate(b.squashA);
      ctx.scale(1 + b.squash * 0.55, 1 - b.squash * 0.32);
      ctx.rotate(-b.squashA);
    }

    /* wobbling perimeter */
    ctx.beginPath();
    for (var i = 0; i <= SEG; i++) {
      var ang = (i % SEG) / SEG * TAU;
      var wob = 1 + b.wobAmp * 0.055 * Math.sin(3 * ang + b.wob)
                  + b.wobAmp * 0.03 * Math.sin(5 * ang - b.wob * 1.35);
      var px = Math.cos(ang) * r * wob, py = Math.sin(ang) * r * wob;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();

    /* jelly body: pale top-left → saturated → deep rim */
    var g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.15);
    g.addColorStop(0, lighten(b.color, 0.55));
    g.addColorStop(0.45, b.color);
    g.addColorStop(1, b.dark);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.045);
    ctx.strokeStyle = b.dark;
    ctx.globalAlpha = 0.85; ctx.stroke(); ctx.globalAlpha = 1;

    /* specular gloss streak */
    ctx.save();
    ctx.rotate(-0.6);
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, -r * 0.42, r * 0.30, r * 0.15, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.ellipse(r * 0.28, r * 0.40, r * 0.20, r * 0.10, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    /* glowing nucleus */
    var nr = r * (0.30 + 0.03 * Math.sin(time * 3.1 + b.wob));
    if (nr > 1.2) {
      var ng = ctx.createRadialGradient(0, 0, 0, 0, 0, nr * 1.6);
      ng.addColorStop(0, '#ffffff');
      ng.addColorStop(0.45, lighten(b.color, 0.35));
      ng.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = ng;
      ctx.beginPath(); ctx.arc(0, 0, nr * 1.6, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = lighten(b.color, 0.5);
      ctx.beginPath(); ctx.arc(0, 0, nr, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(-nr * 0.25, -nr * 0.3, nr * 0.32, 0, TAU); ctx.fill();
    }
    ctx.restore();

    /* name label */
    if (r > 22 || b.isPlayer) {
      ctx.font = '600 ' + Math.max(13, r * 0.34) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var label = b.isPlayer ? 'YOU' : b.name;
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(2,10,20,0.75)';
      ctx.strokeText(label, b.x, b.y - r - 14);
      ctx.fillStyle = b.isPlayer ? '#ffffff' : b.color;
      ctx.fillText(label, b.x, b.y - r - 14);
    }

    /* crown of the defending champion */
    if (b.crown && r > 14) drawCrown(b.x, b.y - r - 34, Math.max(16, r * 0.42), time);
  }

  function drawCrown(x, y, s, time) {
    var bob = Math.sin(time * 2.4) * s * 0.06;
    ctx.save();
    ctx.translate(x, y + bob);
    var w = s, h = s * 0.72;
    var g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#ffe98a'); g.addColorStop(0.5, '#ffcf3d'); g.addColorStop(1, '#d99a16');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-w / 2, h / 2);
    ctx.lineTo(-w / 2, -h * 0.1); ctx.lineTo(-w * 0.25, -h / 2);
    ctx.lineTo(0, -h * 0.08); ctx.lineTo(w * 0.25, -h / 2);
    ctx.lineTo(w / 2, -h * 0.1); ctx.lineTo(w / 2, h / 2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath(); ctx.arc(-w * 0.25, -h / 2, s * 0.09, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.25, -h / 2, s * 0.09, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c81e4e';
    ctx.beginPath(); ctx.arc(0, h * 0.08, s * 0.11, 0, TAU); ctx.fill();
    ctx.restore();
  }
  /* exposed for the results screen */
  renderer_drawCrown = drawCrown;

  function lighten(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (255 - r) * amt);
    g = Math.round(g + (255 - g) * amt);
    b = Math.round(b + (255 - b) * amt);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* --------------------------------- frame --------------------------------- */
  function render(sim, ui, time, shake) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* background blit (1 draw op) */
    ctx.drawImage(bg, 0, 0, cssW, cssH);

    /* camera */
    var p = sim.player;
    var focusX = p ? p.x : 1300, focusY = p ? p.y : 1300;
    var pr = p ? p.drawR : 30;
    var t = clamp((pr - 30) / 230, 0, 1);
    var viewH = 1080 + t * 1180;
    var zoom = cssH / viewH;
    cam.x = damp(cam.x, focusX, 5, 1 / 60);
    cam.y = damp(cam.y, focusY, 5, 1 / 60);
    cam.zoom = damp(cam.zoom, zoom, 4, 1 / 60);

    var shx = (shake.x || 0), shy = (shake.y || 0);
    ctx.translate(cssW / 2 + shx, cssH / 2 + shy);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    var vx0 = cam.x - cssW / 2 / cam.zoom - 60, vx1 = cam.x + cssW / 2 / cam.zoom + 60;
    var vy0 = cam.y - cssH / 2 / cam.zoom - 60, vy1 = cam.y + cssH / 2 / cam.zoom + 60;
    function vis(x, y, r) { return x + r > vx0 && x - r < vx1 && y + r > vy0 && y - r < vy1; }

    /* arena bounds (culled when off-screen; shadowBlur is pricey) */
    if (vx1 > -80 && vx0 < CFG.world + 80 && vy1 > -80 && vy0 < CFG.world + 80) {
      ctx.save();
      ctx.strokeStyle = 'rgba(120,220,255,0.28)';
      ctx.lineWidth = 10;
      ctx.shadowColor = 'rgba(80,200,255,0.5)'; ctx.shadowBlur = 26;
      ctx.strokeRect(0, 0, CFG.world, CFG.world);
      ctx.restore();
    }

    /* storm wall */
    if (sim.storm.active) drawStorm(sim, time, vis);

    /* pellets (culled) */
    for (var i = 0; i < sim.pellets.length; i++) {
      var pl = sim.pellets[i];
      if (!pl.active || !vis(pl.x, pl.y, 12)) continue;
      var pulse = 1 + 0.18 * Math.sin(time * 4 + pl.tw);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = pl.color;
      ctx.beginPath(); ctx.arc(pl.x, pl.y, pl.r * 2.1 * pulse, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = pl.color;
      ctx.beginPath(); ctx.arc(pl.x, pl.y, pl.r * pulse, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(pl.x - 1, pl.y - 1, pl.r * 0.42 * pulse, 0, TAU); ctx.fill();
    }

    /* ripples */
    for (i = 0; i < sim.ripples.length; i++) {
      var rp = sim.ripples[i];
      if (!rp.active || !vis(rp.x, rp.y, rp.r + 20)) continue;
      var a = rp.life / rp.maxLife;
      ctx.globalAlpha = a * 0.8;
      ctx.strokeStyle = rp.color;
      ctx.lineWidth = rp.width * a + 1;
      ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* particles (culled) */
    for (i = 0; i < sim.parts.length; i++) {
      var pt = sim.parts[i];
      if (!pt.active || !vis(pt.x, pt.y, 12)) continue;
      var pa = pt.kind === 'plankton' ? 0.5 + 0.3 * Math.sin(time * 2 + pt.x * 0.01)
                                      : clamp(pt.life / pt.maxLife, 0, 1);
      ctx.globalAlpha = pa * 0.85;
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* blobs, sorted small-first so big ones layer on top */
    var order = [];
    for (i = 0; i < sim.blobs.length; i++) {
      var b = sim.blobs[i];
      if ((b.alive || b.absorbT > 0) && vis(b.x, b.y, b.drawR + 60)) order.push(b);
    }
    order.sort(function (x, y) { return x.drawR - y.drawR; });
    for (i = 0; i < order.length; i++) drawBlob(order[i], time);

    /* danger vignette when the player is outside the safe zone */
    if (sim.storm.active && p && p.alive) {
      var dx = p.x - sim.storm.cx, dy = p.y - sim.storm.cy;
      if (dx * dx + dy * dy > sim.storm.radius * sim.storm.radius) {
        var danger = 0.35 + 0.2 * Math.sin(time * 6);
        var g2 = ctx.createRadialGradient(cam.x, cam.y, viewH * 0.28, cam.x, cam.y, viewH * 0.62);
        g2.addColorStop(0, 'rgba(255,40,70,0)');
        g2.addColorStop(1, 'rgba(255,40,70,' + danger.toFixed(3) + ')');
        ctx.fillStyle = g2;
        ctx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
      }
    }

    /* back to screen space for UI */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: cssW, h: cssH, zoom: cam.zoom };
  }

  function drawStorm(sim, time, vis) {
    var s = sim.storm;
    if (!vis(s.cx, s.cy, s.radius + 120)) return;
    /* darkened outside, punched safe circle (evenodd) */
    ctx.save();
    ctx.beginPath();
    ctx.rect(s.cx - s.radius - 2000, s.cy - s.radius - 2000, (s.radius + 2000) * 2, (s.radius + 2000) * 2);
    ctx.arc(s.cx, s.cy, s.radius, 0, TAU, true);
    ctx.fillStyle = 'rgba(24,8,44,0.42)';
    ctx.fill('evenodd');
    ctx.restore();
    /* swirling wall */
    ctx.save();
    ctx.strokeStyle = 'rgba(178,130,255,0.85)';
    ctx.lineWidth = 14;
    ctx.setLineDash([46, 30]);
    ctx.lineDashOffset = -time * 130;
    ctx.shadowColor = 'rgba(150,90,255,0.8)'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(s.cx, s.cy, s.radius, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,120,170,0.5)';
    ctx.lineWidth = 5;
    ctx.lineDashOffset = time * 90;
    ctx.setLineDash([18, 26]);
    ctx.beginPath(); ctx.arc(s.cx, s.cy, s.radius - 16, 0, TAU); ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);
    /* drifting spores inside the wall */
    ctx.fillStyle = 'rgba(190,150,255,0.5)';
    for (var i = 0; i < 26; i++) {
      var a = time * 0.5 + i * 2.4;
      var rr = s.radius + 26 * Math.sin(time * 1.7 + i * 1.3);
      var x = s.cx + Math.cos(a) * rr, y = s.cy + Math.sin(a) * rr;
      if (!vis(x, y, 8)) continue;
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill();
    }
  }

  window.addEventListener('resize', resize);
  resize();

  return {
    render: render,
    ctx: ctx,
    size: function () { return { w: cssW, h: cssH, dpr: dpr }; },
    cam: cam
  };
}

/* set by makeRenderer for the results screen crown; assigned at runtime */
var renderer_drawCrown = null;
