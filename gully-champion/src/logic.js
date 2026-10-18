/* GULLY CHAMPION — pure game logic (no Phaser). UMD: works in browser + node tests. */
var GClogic = (function () {
  'use strict';

  var TIMING = { perfect: 45, good: 100, edge: 175 };

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  // errMs: release time minus ideal time (negative = early). winScale: delivery window factor.
  function gradeTiming(errMs, winScale) {
    var a = Math.abs(errMs) / (winScale || 1);
    if (a <= TIMING.perfect) return { grade: 'perfect', score: 1 };
    if (a <= TIMING.good) return { grade: 'good', score: 0.75 };
    if (a <= TIMING.edge) return { grade: 'edge', score: 0.4 };
    return { grade: 'miss', score: 0 };
  }

  // o: {power 0..1, flickDx px, errMs, delivery {travel, loftMod, window}}
  function computeShot(o) {
    var g = gradeTiming(o.errMs, (o.delivery && o.delivery.window) || 1);
    var quality = g.score * (0.55 + 0.45 * clamp(o.power, 0, 1));
    var loft = 16 + clamp(o.power, 0, 1) * 34 + ((o.delivery && o.delivery.loftMod) || 0);
    if (g.grade === 'perfect') loft += 8;
    if (g.grade === 'edge') loft = 20 + clamp(o.power, 0, 1) * 20;
    loft = clamp(loft, 5, 75);
    var dir = clamp((o.flickDx / 260) * 58, -58, 58);
    return { grade: g.grade, quality: clamp(quality, 0, 1), loftDeg: loft, dirDeg: dir, errMs: o.errMs };
  }

  // Adaptive bowler: tracks the batter's timing errors and mixes against them.
  function BowlerAI(mix, opts) {
    this.mix = mix || { yorker: 1 };
    this.adapt = !(opts && opts.adapt === false);
    this.errors = [];
  }
  BowlerAI.prototype.update = function (errMs) {
    if (typeof errMs !== 'number') return;
    this.errors.push(errMs);
    if (this.errors.length > 8) this.errors.shift();
  };
  BowlerAI.prototype.avgError = function () {
    if (!this.errors.length) return 0;
    var s = 0, i;
    for (i = 0; i < this.errors.length; i++) s += this.errors[i];
    return s / this.errors.length;
  };
  BowlerAI.prototype.weights = function () {
    var w = {}, k;
    for (k in this.mix) w[k] = this.mix[k];
    if (this.adapt && this.errors.length >= 3) {
      var avg = this.avgError();
      if (avg < -55) { // batter consistently early -> feed slower balls / doosra
        if (w.slower) w.slower *= 1.9;
        if (w.doosra) w.doosra *= 1.7;
      } else if (avg > 55) { // batter consistently late -> pace them up
        if (w.yorker) w.yorker *= 1.9;
        if (w.bouncer) w.bouncer *= 1.5;
      }
    }
    return w;
  };
  BowlerAI.prototype.pick = function (r) {
    var w = this.weights(), k, total = 0;
    for (k in w) total += w[k];
    var x = (r === undefined ? Math.random() : r) * total;
    for (k in w) { x -= w[k]; if (x <= 0) return k; }
    return Object.keys(w)[0];
  };

  // Simulated AI first innings -> chase target for a super over.
  function simTarget(r, strength) {
    var s = clamp(strength || 0.5, 0, 1);
    return 9 + Math.floor(r() * 9) + Math.round(s * 6);
  }

  // Resolve a contacted ball into an outcome. Pure & deterministic given rolls.
  // o: {quality 0..1, loftDeg, dirDeg, grade, stumpP, fieldClose 0..1 (1 = fielder right there),
  //     r1, r2, r3 in [0,1)}
  function resolveOutcome(o) {
    var out = { runs: 0, how: 'dot', wicket: false, dive: false, aerial: o.loftDeg > 38 };
    if (o.grade === 'miss') {
      if (o.r1 < (o.stumpP || 0.3)) { out.how = 'bowled'; out.wicket = true; }
      return out;
    }
    var dist = 15 + o.quality * 80; // "meters": six needs quality >= ~0.66
    var fc = clamp(o.fieldClose || 0, 0, 1);

    // Skied balls are catchable even if they would travel far.
    if (out.aerial && fc > 0.55) {
      var catchP = 0.25 + fc * 0.5;
      if (o.r2 < catchP) {
        out.how = 'caught'; out.wicket = true; out.dive = fc < 0.85;
        return out;
      }
    }
    if (dist >= 68) { out.runs = 6; out.how = 'six'; return out; }
    if (dist >= 58) {
      if (out.aerial && fc > 0.7 && o.r2 < 0.35) { out.how = 'caught'; out.wicket = true; out.dive = true; return out; }
      out.runs = 4; out.how = 'four'; return out;
    }
    if (o.grade === 'edge') {
      if (o.r1 < 0.35) { out.how = 'caught-behind'; out.wicket = true; return out; }
      out.runs = o.r2 < 0.5 ? 1 : 2; out.how = 'runs'; return out;
    }
    out.runs = dist > 45 ? 3 : (dist > 30 ? 2 : 1);
    out.how = 'runs';
    if (out.runs <= 2 && o.r3 < 0.10) {
      out.how = 'runout'; out.wicket = true;
      out.runs = Math.max(0, out.runs - 1);
    }
    return out;
  }

  return {
    TIMING: TIMING,
    gradeTiming: gradeTiming,
    computeShot: computeShot,
    BowlerAI: BowlerAI,
    simTarget: simTarget,
    resolveOutcome: resolveOutcome
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = GClogic;
