/* GULLY CHAMPION — save system (localStorage). Plain script, global GCSave. */
var GCSave = (function () {
  'use strict';
  var KEY = 'gc_save_v1';
  var DEF = {
    runs: 0, balls: 0, sixes: 0, fours: 0,
    matches: 0, wins: 0, cups: 0, cupWins: 0,
    best: 0, muted: false, gali: 'rooftop', bat: 0,
    taBest: 0
  };
  var d = null;

  function load() {
    try { d = JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { d = {}; }
    d = Object.assign({}, DEF, d);
    return d;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  }

  // Unlock ladders (mirror GCArt.GALLIS / GCArt.BATS metadata).
  function unlockedGallies() {
    var g = ['rooftop'];
    if (d.cupWins >= 1) g.push('beach');
    if (d.cupWins >= 3) g.push('mountain');
    if (d.cups >= 1) g.push('night');
    return g;
  }
  function unlockedBats() {
    var b = [0];
    if (d.runs >= 50) b.push(1);
    if (d.sixes >= 10) b.push(2);
    if (d.cupWins >= 1) b.push(3);
    if (d.runs >= 150) b.push(4);
    if (d.cups >= 1) b.push(5);
    return b;
  }

  // Record a finished match. summary: {runs, balls, sixes, fours, won, mode}
  // Returns {newBest, newUnlocks:[strings]} for celebration UI.
  function recordMatch(summary) {
    var beforeG = unlockedGallies().join(',');
    var beforeB = unlockedBats().join(',');
    d.matches++;
    d.balls += summary.balls || 0;
    d.runs += summary.runs || 0;
    d.sixes += summary.sixes || 0;
    d.fours += summary.fours || 0;
    if (summary.won) d.wins++;
    if (summary.mode === 'cup' && summary.cupRoundWon) d.cupWins++;
    if (summary.mode === 'cup' && summary.cupWon) d.cups++;
    var newBest = false;
    if ((summary.runs || 0) > d.best && summary.mode !== 'time') { d.best = summary.runs; newBest = true; }
    if (summary.mode === 'time' && (summary.runs || 0) > d.taBest) { d.taBest = summary.runs; newBest = true; }
    save();
    var unlocks = [];
    var gAfter = unlockedGallies(), bAfter = unlockedBats();
    gAfter.forEach(function (g) { if (beforeG.indexOf(g) < 0) unlocks.push('gali:' + g); });
    bAfter.forEach(function (b) { if ((',' + beforeB + ',').indexOf(',' + b + ',') < 0) unlocks.push('bat:' + b); });
    return { newBest: newBest, newUnlocks: unlocks };
  }

  function setMuted(m) { d.muted = !!m; save(); }
  function setGali(id) { d.gali = id; save(); }
  function setBat(i) { d.bat = i; save(); }

  load();
  return {
    get data() { return d; },
    load: load, save: save,
    unlockedGallies: unlockedGallies, unlockedBats: unlockedBats,
    recordMatch: recordMatch, setMuted: setMuted, setGali: setGali, setBat: setBat
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = GCSave;
