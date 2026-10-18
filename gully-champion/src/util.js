/* GULLY CHAMPION — shared helpers. Plain script, global GCUtil. */
var GCUtil = (function () {
  'use strict';
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function getBot(id) {
    for (var i = 0; i < GCConfig.bots.length; i++) if (GCConfig.bots[i].id === id) return GCConfig.bots[i];
    return GCConfig.bots[0];
  }
  function fmtOvers(balls) {
    return Math.floor(balls / 6) + '.' + (balls % 6);
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  return { clamp: clamp, getBot: getBot, fmtOvers: fmtOvers, pick: pick };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = GCUtil;
