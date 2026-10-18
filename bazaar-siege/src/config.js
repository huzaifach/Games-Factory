/* BAZAAR SIEGE — config.js
 * Global constants, layout map (from PERF.md) and save contract.
 * English only. This file has no Phaser dependency. */
(function (global) {
  var BS = (global.BS = global.BS || {});

  BS.CONFIG = {
    WIDTH: 720,
    HEIGHT: 1280,
    SAVE_KEY: 'bazaarSiegeSaveV1',

    // HUD bar: y 0-110. Hint pill: y 116-156. Battlefield: y 160-970.
    HUD_H: 110,
    HINT_Y: 136,
    FIELD_TOP: 160,
    FIELD_BOTTOM: 970,

    // Lanes: enemies enter at x=760, leak at x=40 (bazaar gate, left).
    LANES: [420, 600, 780],
    SPAWN_X: 760,
    GATE_X: 40,

    // 9 rooftop slots (hand-placed).
    SLOTS: [
      { x: 150, y: 300 }, { x: 360, y: 300 }, { x: 570, y: 300 },
      { x: 150, y: 510 }, { x: 360, y: 510 }, { x: 570, y: 510 },
      { x: 150, y: 690 }, { x: 360, y: 690 }, { x: 570, y: 690 }
    ],

    // 3 stalls; each buffs the 3 slots in the row directly above it (slots 6,7,8).
    STALLS: [
      { x: 150, y: 890 },
      { x: 360, y: 890 },
      { x: 570, y: 890 }
    ],

    // Wedding parade path.
    PARADE_Y: 230,

    // Bottom dock: y 980-1280.
    DOCK_TOP: 980,
    CARD_W: 112,
    CARD_H: 150,

    // Gameplay.
    START_COINS: 150,
    START_LIVES: 20,
    TOTAL_WAVES: 15,
    SELL_REFUND: 0.7,
    HIT_PAUSE_MS: 70
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BS.CONFIG;
  }
})(typeof window !== 'undefined' ? window : globalThis);
