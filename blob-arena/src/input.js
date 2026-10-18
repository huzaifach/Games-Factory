/* ============================================================
   BLOB ARENA — input.js
   Primary: one-thumb floating joystick (touch).
   Bonus:   cursor-follow on desktop, Space to dash.
   UI buttons and the dash button are hit-tested before the joystick.
   ============================================================ */
'use strict';

function makeInput(canvas, ui) {
  var input = {
    dx: 0, dy: 0,
    dashQ: false,
    mode: 'touch',            // last-used control mode
    joy: { on: false, id: -1, ax: 0, ay: 0, cx: 0, cy: 0 },
    mouse: { x: 0, y: 0, seen: false },
    focus: { x: 0, y: 0 },    // blob position in screen px (set by main)
    onButton: null,           // fn(id) — wired by main
    enabled: false            // only steer while a round is live
  };

  var JOY_R = 70, DEAD = 10;

  function pt(t) {
    var r = canvas.getBoundingClientRect();
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  }
  function inRect(x, y, rc) {
    return rc && x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h;
  }

  function pressAt(x, y, isTouch) {
    /* UI buttons first */
    var id = ui.tap(x, y);
    if (id) { if (input.onButton) input.onButton(id); return 'ui'; }
    /* dash button */
    if (ui.dashBtn && inRect(x, y, ui.dashBtn)) {
      input.dashQ = true;
      return 'dash';
    }
    return null;
  }

  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    input.mode = 'touch';
    if (!input.enabled) { /* still allow UI taps */ 
      for (var i = 0; i < e.changedTouches.length; i++) {
        var p0 = pt(e.changedTouches[i]);
        pressAt(p0.x, p0.y, true);
      }
      return;
    }
    for (var j = 0; j < e.changedTouches.length; j++) {
      var t = e.changedTouches[j], p = pt(t);
      var hit = pressAt(p.x, p.y, true);
      if (hit) continue;
      if (!input.joy.on) {
        input.joy.on = true; input.joy.id = t.identifier;
        input.joy.ax = p.x; input.joy.ay = p.y;
        input.joy.cx = p.x; input.joy.cy = p.y;
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (input.joy.on && t.identifier === input.joy.id) {
        var p = pt(t);
        input.joy.cx = p.x; input.joy.cy = p.y;
      }
    }
  }, { passive: false });

  function touchEnd(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (input.joy.on && t.identifier === input.joy.id) {
        input.joy.on = false; input.joy.id = -1;
      }
    }
  }
  canvas.addEventListener('touchend', touchEnd);
  canvas.addEventListener('touchcancel', touchEnd);

  canvas.addEventListener('mousedown', function (e) {
    var r = canvas.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    var hit = pressAt(x, y, false);
    if (!hit && input.enabled && !input.joy.on) {
      input.mode = 'touch';  /* mouse-drag also drives the joystick */
      input.joy.on = true; input.joy.id = -99;
      input.joy.ax = x; input.joy.ay = y;
      input.joy.cx = x; input.joy.cy = y;
    }
  });
  window.addEventListener('mousemove', function (e) {
    var r = canvas.getBoundingClientRect();
    input.mouse.x = e.clientX - r.left;
    input.mouse.y = e.clientY - r.top;
    input.mouse.seen = true;
    if (input.joy.on && input.joy.id === -99) {
      input.joy.cx = input.mouse.x; input.joy.cy = input.mouse.y;
    } else if (e.movementX !== undefined && input.enabled && !input.joy.on) {
      input.mode = 'mouse';
    }
  });
  window.addEventListener('mouseup', function () {
    if (input.joy.on && input.joy.id === -99) { input.joy.on = false; input.joy.id = -1; }
  });

  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (input.enabled) input.dashQ = true;
    }
  });

  input.consumeDash = function () {
    var d = input.dashQ;
    input.dashQ = false;
    return d;
  };

  input.update = function () {
    input.dx = 0; input.dy = 0;
    if (!input.enabled) return;
    if (input.joy.on) {
      var vx = input.joy.cx - input.joy.ax, vy = input.joy.cy - input.joy.ay;
      var d = Math.hypot(vx, vy);
      if (d > DEAD) {
        var m = Math.min(d, JOY_R) / JOY_R;
        input.dx = (vx / d) * m;
        input.dy = (vy / d) * m;
      }
    } else if (input.mode === 'mouse' && input.mouse.seen) {
      var mx = input.mouse.x - input.focus.x, my = input.mouse.y - input.focus.y;
      var md = Math.hypot(mx, my);
      if (md > 16) {
        var mm = clamp((md - 16) / 110, 0, 1);
        input.dx = (mx / md) * mm;
        input.dy = (my / md) * mm;
      }
    }
  };

  input.drawJoy = function (c) {
    if (!input.joy.on || input.joy.id === -99) return;
    var j = input.joy;
    c.save();
    c.globalAlpha = 0.30;
    c.strokeStyle = '#bfe9f5'; c.lineWidth = 3;
    c.beginPath(); c.arc(j.ax, j.ay, JOY_R, 0, TAU); c.stroke();
    c.globalAlpha = 0.5;
    c.fillStyle = '#bfe9f5';
    var vx = j.cx - j.ax, vy = j.cy - j.ay;
    var d = Math.hypot(vx, vy), cl = Math.min(d, JOY_R);
    var kx = j.ax + (d > 0 ? vx / d * cl : 0), ky = j.ay + (d > 0 ? vy / d * cl : 0);
    c.beginPath(); c.arc(kx, ky, 26, 0, TAU); c.fill();
    c.restore();
  };

  return input;
}
