/* BAZAAR SIEGE — art.js
 * makeTextures(scene): generates EVERY texture with Phaser Graphics.
 * Zero image assets. Silhouettes follow ART-DIRECTION.md exactly —
 * distinct shapes per type, never plain recolors. Evolved turrets add
 * gold trim, extra ornament and a star badge. */
(function (global) {
  var BS = (global.BS = global.BS || {});

  var INK = 0x1a1626;      // smog-imp body
  var RIM = 0x6b4fa1;      // purple rim light
  var GOLD = 0xffca7a;
  var CREAM = 0xfff6e8;
  var EMERALD = 0x0fae7e;
  var RUBY = 0xe33e5f;
  var AMBER = 0xffb347;
  var TURQ = 0x35d0c5;
  var MAGENTA = 0xc83e8f;
  var PLUM = 0x1c1430;

  function makeTextures(scene) {
    var g = scene.make.graphics({ x: 0, y: 0, add: false });

    function done(key, w, h) {
      g.generateTexture(key, w, h);
      g.clear();
    }
    function eye(ex, ey, r, color) {
      g.fillStyle(0xffffff, 0.25); g.fillCircle(ex, ey, r + 3);
      g.fillStyle(color, 1); g.fillCircle(ex, ey, r);
      g.fillStyle(0xffffff, 1); g.fillCircle(ex - r * 0.3, ey - r * 0.3, r * 0.35);
    }
    function goldTrim(fn) { fn(); }

    /* ================= TURRETS (96x96, centered ~48,52) ================= */

    // 1. Rickshaw Rocket — green-yellow auto-rickshaw, 3 wheels, twin rocket tubes.
    (function () {
      function draw(evolved) {
        g.fillStyle(0x11131f, 1); // soft shadow
        g.fillEllipse(48, 88, 84, 14);
        g.fillStyle(0x2c6e49, 1); g.fillRoundedRect(18, 52, 60, 30, 8); // body
        g.fillStyle(0xf2c14e, 1); g.fillRoundedRect(18, 52, 60, 10, 5); // yellow hood stripe
        g.fillStyle(0x2c6e49, 1); g.fillEllipse(48, 50, 52, 26); // canopy
        g.fillStyle(evolved ? GOLD : 0xf2c14e, 1);
        g.fillTriangle(24, 50, 72, 50, 48, 28); // canopy peak
        g.fillStyle(0x3a3f4a, 1); // windshield
        g.fillRoundedRect(40, 40, 16, 12, 3);
        g.fillStyle(0x101018, 1); // wheels
        [26, 48, 70].forEach(function (wx) { g.fillCircle(wx, 82, 9); });
        g.fillStyle(0x8a8f9a, 1);
        [26, 48, 70].forEach(function (wx) { g.fillCircle(wx, 82, 3); });
        var tubes = evolved ? 4 : 2; // evolved: double tubes
        for (var i = 0; i < tubes; i++) {
          var tx = 30 + i * 12;
          g.fillStyle(0xb03a2e, 1); g.fillRoundedRect(tx, 18, 9, 26, 4);
          g.fillStyle(evolved ? GOLD : CREAM, 1); g.fillTriangle(tx, 18, tx + 9, 18, tx + 4.5, 8);
        }
        if (evolved) { // peacock-tail fletching
          g.fillStyle(TURQ, 1);
          g.fillTriangle(10, 60, 20, 56, 16, 70);
          g.fillStyle(MAGENTA, 1);
          g.fillTriangle(86, 60, 76, 56, 80, 70);
          g.fillStyle(GOLD, 1); g.fillCircle(48, 12, 5); // star badge base
          g.fillStyle(0x7a4a00, 1);
          g.fillTriangle(48, 6, 50, 12, 54, 12); g.fillTriangle(48, 18, 50, 12, 54, 12);
        }
      }
      draw(false); done('turret-rickshaw', 96, 96);
      draw(true); done('turret-rickshaw-evo', 96, 96);
    })();

    // 2. Kite-Cutter — diamond paper kite, twin spinning blade discs.
    (function () {
      function draw(evolved) {
        g.fillStyle(0x11131f, 1); g.fillEllipse(48, 88, 70, 12);
        g.lineStyle(3, 0x8a6f4d, 1); g.lineBetween(48, 60, 48, 90); // string post
        var s = evolved ? 1.15 : 1;
        g.fillStyle(TURQ, 1);
        g.fillTriangle(48, 10, 48 + 30 * s, 44, 48, 78);
        g.fillStyle(MAGENTA, 1);
        g.fillTriangle(48, 10, 48 - 30 * s, 44, 48, 78);
        g.lineStyle(2, CREAM, 0.9);
        g.lineBetween(48, 10, 48, 78); g.lineBetween(48 - 30 * s, 44, 48 + 30 * s, 44);
        // blade discs
        [30, 66].forEach(function (bx) {
          g.fillStyle(0xdfe6ee, 0.95); g.fillCircle(bx, 44, evolved ? 13 : 10);
          g.lineStyle(2, 0x9aa2ad, 1);
          for (var a = 0; a < 4; a++) {
            var an = a * Math.PI / 4;
            g.lineBetween(bx, 44, bx + Math.cos(an) * 10, 44 + Math.sin(an) * 10);
          }
          g.fillStyle(0x5a6068, 1); g.fillCircle(bx, 44, 3);
        });
        if (evolved) { // golden string reel + larger double kite
          g.fillStyle(GOLD, 1); g.fillCircle(48, 84, 7);
          g.lineStyle(2, 0x7a4a00, 1); g.strokeCircle(48, 84, 7);
          g.fillStyle(GOLD, 1); g.fillCircle(48, 10, 5);
        }
      }
      draw(false); done('turret-kite', 96, 96);
      draw(true); done('turret-kite-evo', 96, 96);
    })();

    // 3. Chai-Splash — brass kettle on a cart, steam plume.
    (function () {
      function draw(evolved) {
        g.fillStyle(0x11131f, 1); g.fillEllipse(48, 88, 76, 12);
        g.fillStyle(0x7a5230, 1); g.fillRoundedRect(16, 66, 64, 16, 5); // cart
        g.fillStyle(0x101018, 1); g.fillCircle(28, 86, 8); g.fillCircle(68, 86, 8);
        g.fillStyle(0xb8860b, 1); // brass kettle body
        g.fillEllipse(44, 52, evolved ? 52 : 44, 34);
        g.fillStyle(0xd4a017, 1); g.fillEllipse(44, 40, 22, 10); // lid
        g.fillStyle(0x8a6508, 1); g.fillCircle(44, 33, 4); // knob
        g.lineStyle(5, 0xb8860b, 1); // spout
        g.lineBetween(64, 48, 78, 34);
        g.lineStyle(4, 0x8a6508, 1); // handle arc
        g.strokeCircle(30, 48, 12, false);
        if (evolved) {
          g.fillStyle(0xd4a017, 1); g.fillEllipse(66, 58, 30, 22); // second kettle
          g.fillStyle(GOLD, 1); g.fillRoundedRect(34, 44, 20, 5, 2); // gold rim
        }
        // steam plume
        g.fillStyle(0xffffff, 0.35);
        g.fillEllipse(44, 24, 14, 10); g.fillEllipse(50, 15, 10, 8);
        if (evolved) { g.fillEllipse(38, 14, 12, 9); }
      }
      draw(false); done('turret-chai', 96, 96);
      draw(true); done('turret-chai-evo', 96, 96);
    })();

    // 4. Lantern Mortar — red paper lantern on wooden stand.
    (function () {
      function draw(evolved) {
        g.fillStyle(0x11131f, 1); g.fillEllipse(48, 90, 76, 12);
        g.lineStyle(6, 0x6b4a2f, 1); // stand legs
        g.lineBetween(32, 62, 24, 90); g.lineBetween(64, 62, 72, 90);
        g.lineStyle(4, 0x6b4a2f, 1); g.lineBetween(24, 78, 72, 78);
        var lanterns = evolved ? [34, 62] : [48];
        lanterns.forEach(function (lx) {
          g.fillStyle(RUBY, 1); g.fillEllipse(lx, 46, 34, 40); // paper lantern
          g.lineStyle(2, 0xa02338, 1);
          [36, 46, 56].forEach(function (ly) { g.lineBetween(lx - 16, ly, lx + 16, ly); });
          g.fillStyle(0x5a2d16, 1); g.fillRoundedRect(lx - 8, 22, 16, 6, 2);
          g.fillStyle(0x5a2d16, 1); g.fillRoundedRect(lx - 8, 64, 16, 6, 2);
          g.fillStyle(0xffe9b8, 0.9); g.fillEllipse(lx, 46, 14, 22); // inner glow
        });
        if (evolved) {
          g.fillStyle(GOLD, 1); // gold tassels
          [34, 62].forEach(function (lx) {
            g.fillTriangle(lx - 4, 70, lx + 4, 70, lx, 82);
          });
        }
      }
      draw(false); done('turret-lantern', 96, 96);
      draw(true); done('turret-lantern-evo', 96, 96);
    })();

    // 5. Dhol-Drum — wooden dhol with rope lacing, sticks.
    (function () {
      function draw(evolved) {
        var w = evolved ? 78 : 66;
        g.fillStyle(0x11131f, 1); g.fillEllipse(48, 84, w + 14, 14);
        g.fillStyle(0x8a5a2b, 1); // barrel body
        g.fillEllipse(48, 56, w, 44);
        g.lineStyle(3, evolved ? GOLD : 0xd9c9a8, 1); // rope lacing zigzag
        for (var i = 0; i < 6; i++) {
          var x0 = 48 - w / 2 + 6 + i * ((w - 12) / 5);
          g.lineBetween(x0, 36, x0 + (w - 12) / 10, 76);
          g.lineBetween(x0 + (w - 12) / 10, 36, x0, 76);
        }
        g.fillStyle(0xf3e2c7, 1); // drum skins
        g.fillEllipse(48 - w / 2, 56, 16, 40);
        g.fillEllipse(48 + w / 2, 56, 16, 40);
        g.fillStyle(0xd9b98a, 1);
        g.fillEllipse(48 - w / 2, 56, 10, 32);
        g.fillEllipse(48 + w / 2, 56, 10, 32);
        // sticks raised
        g.lineStyle(4, 0xd9c9a8, 1);
        g.lineBetween(30, 30, 22, 12); g.lineBetween(66, 30, 74, 12);
        g.fillStyle(0xfff2cf, 1); g.fillCircle(22, 10, 4); g.fillCircle(74, 10, 4);
        if (evolved) {
          g.lineStyle(4, GOLD, 1); // brass rings
          g.strokeEllipse(48 - w / 2, 56, 20, 44);
          g.strokeEllipse(48 + w / 2, 56, 20, 44);
        }
      }
      draw(false); done('turret-dhol', 96, 96);
      draw(true); done('turret-dhol-evo', 96, 96);
    })();

    // 6. Peacock Prism — fanned feathers with eye-spots around a crystal.
    (function () {
      function draw(evolved) {
        g.fillStyle(0x11131f, 1); g.fillEllipse(48, 90, 76, 12);
        var feathers = evolved ? 9 : 7;
        for (var i = 0; i < feathers; i++) {
          var a = Math.PI * (0.15 + 0.7 * (i / (feathers - 1))); // fan arc
          var fx = 48 + Math.cos(a) * 34, fy = 78 - Math.sin(a) * 52;
          g.lineStyle(3, EMERALD, 1); g.lineBetween(48, 78, fx, fy);
          g.fillStyle(i % 2 ? TURQ : EMERALD, 1); g.fillEllipse(fx, fy, 16, 22);
          g.fillStyle(0x1a3a6b, 1); g.fillEllipse(fx, fy, 9, 13); // eye-spot
          g.fillStyle(GOLD, 1); g.fillCircle(fx, fy, 3);
        }
        // crystal prism
        g.fillStyle(0xbfe9ff, 0.95);
        g.fillTriangle(48, 30, 66, 66, 30, 66);
        g.fillStyle(0xffffff, 0.8);
        g.fillTriangle(48, 30, 56, 66, 40, 66);
        g.fillStyle(MAGENTA, 0.55); g.fillTriangle(56, 52, 66, 66, 48, 66);
        g.fillStyle(TURQ, 0.55); g.fillTriangle(40, 52, 30, 66, 48, 66);
        if (evolved) {
          g.lineStyle(2, GOLD, 1); // gold filigree
          g.strokeTriangle(48, 30, 66, 66, 30, 66);
          g.fillStyle(GOLD, 1); g.fillCircle(48, 24, 5);
        }
      }
      draw(false); done('turret-prism', 96, 96);
      draw(true); done('turret-prism-evo', 96, 96);
    })();

    /* ================= ENEMIES (smog imps, dark bodies + glowing eyes) ================= */

    function impBody(w, h, cx, cy, bw, bh, rimColor) {
      g.fillStyle(0x0c0a14, 1); g.fillEllipse(cx, cy + 4, bw + 10, 12); // ground shadow
      g.fillStyle(INK, 1); g.fillEllipse(cx, cy, bw, bh);
      g.lineStyle(2, rimColor || RIM, 0.9);
      g.strokeEllipse(cx, cy, bw, bh);
    }

    // Runner — lean imp, long legs, mid-stride.
    (function () {
      impBody(0, 0, 48, 46, 34, 44);
      g.lineStyle(6, INK, 1);
      g.lineBetween(40, 64, 28, 88); g.lineBetween(56, 64, 68, 88); // legs mid-stride
      g.lineStyle(5, INK, 1);
      g.lineBetween(34, 44, 20, 56); g.lineBetween(62, 44, 76, 34); // arms
      g.fillStyle(INK, 1); g.fillTriangle(40, 14, 48, 26, 56, 14); // horn nubs
      eye(42, 34, 3.5, 0xaaff55); eye(54, 34, 3.5, 0xaaff55);
      done('enemy-runner', 96, 96);
    })();

    // Brute — huge round body, tiny legs, heavy waddle.
    (function () {
      g.fillStyle(0x0c0a14, 1); g.fillEllipse(48, 88, 76, 12);
      impBody(0, 0, 48, 52, 62, 60);
      g.fillStyle(INK, 1);
      g.fillCircle(30, 84, 7); g.fillCircle(66, 84, 7); // tiny feet
      g.fillStyle(INK, 1); g.fillTriangle(28, 28, 36, 40, 22, 42); // spikes
      g.fillTriangle(68, 28, 60, 40, 74, 42);
      eye(38, 44, 5, 0xff4444); eye(58, 44, 5, 0xff4444);
      g.lineStyle(3, RIM, 0.9); g.lineBetween(40, 60, 56, 60); // grim mouth
      done('enemy-brute', 96, 96);
    })();

    // Shielded — imp holding a round brass thali-shield in front.
    (function () {
      impBody(0, 0, 48, 50, 36, 44);
      g.lineStyle(5, INK, 1); g.lineBetween(36, 52, 24, 48); // arm to shield
      g.fillStyle(0xc9a227, 1); g.fillCircle(56, 50, 22); // thali shield
      g.lineStyle(3, 0x8a6d1a, 1); g.strokeCircle(56, 50, 22);
      g.fillStyle(0xe8c84a, 1); g.fillCircle(56, 50, 7); // boss
      g.lineStyle(2, 0x8a6d1a, 1);
      g.lineBetween(40, 50, 72, 50); g.lineBetween(56, 34, 56, 66);
      eye(42, 32, 3.5, 0x44ddff); eye(54, 32, 3.5, 0x44ddff);
      done('enemy-shielded', 96, 96);
    })();

    // Healer — slimmer imp carrying a glowing moth-lantern.
    (function () {
      impBody(0, 0, 48, 50, 28, 46);
      g.lineStyle(4, INK, 1); g.lineBetween(60, 48, 72, 40);
      g.fillStyle(0x9fe8c0, 0.95); g.fillRoundedRect(64, 28, 18, 24, 8); // moth-lantern
      g.fillStyle(0xd6ffe8, 1); g.fillEllipse(73, 40, 10, 14);
      g.fillStyle(0x2fae72, 1); // moth wings on lantern
      g.fillTriangle(64, 32, 56, 26, 62, 40); g.fillTriangle(82, 32, 90, 26, 84, 40);
      g.fillStyle(0x7dffb0, 0.8); // sparkles
      g.fillCircle(60, 22, 2); g.fillCircle(86, 48, 2); g.fillCircle(70, 58, 2);
      eye(43, 34, 3.5, 0x55ff88); eye(53, 34, 3.5, 0x55ff88);
      done('enemy-healer', 96, 96);
    })();

    // Splitter — lumpy two-lobed body with a visible seam.
    (function () {
      g.fillStyle(0x0c0a14, 1); g.fillEllipse(48, 88, 70, 12);
      impBody(0, 0, 34, 54, 34, 46);
      impBody(0, 0, 62, 54, 34, 46);
      g.lineStyle(3, 0xff9a1f, 0.95); // glowing seam
      g.lineBetween(48, 32, 48, 76);
      eye(28, 46, 3.5, 0xff9a1f); eye(40, 46, 3.5, 0xff9a1f);
      eye(56, 46, 3.5, 0xff9a1f); eye(68, 46, 3.5, 0xff9a1f);
      done('enemy-splitter', 96, 96);
    })();

    // Kite-flyer — diamond paper kite body with string tail, floats.
    (function () {
      g.fillStyle(0x0c0a14, 0.4); g.fillEllipse(48, 90, 50, 10); // soft ground shadow
      g.fillStyle(0x2a2140, 1);
      g.fillTriangle(48, 8, 78, 44, 48, 80);
      g.fillTriangle(48, 8, 18, 44, 48, 80);
      g.lineStyle(2, 0x8f7bd8, 1);
      g.lineBetween(48, 8, 48, 80); g.lineBetween(18, 44, 78, 44);
      g.fillStyle(0x1a1626, 1); g.fillCircle(48, 44, 10); // imp face in kite
      eye(44, 42, 3, 0xb28dff); eye(52, 42, 3, 0xb28dff);
      g.lineStyle(2, 0x8f7bd8, 0.9); // string tail with bows
      g.lineBetween(48, 80, 40, 92);
      [0, 1, 2].forEach(function (i) {
        g.fillStyle(MAGENTA, 1);
        g.fillTriangle(44 - i * 2, 88 + i * 6, 52 - i * 2, 88 + i * 6, 48 - i * 2, 94 + i * 6);
      });
      done('enemy-kiteflyer', 96, 96);
    })();

    // Digger — mole-snouted imp.
    (function () {
      impBody(0, 0, 48, 52, 44, 42);
      g.fillStyle(0x3a2f52, 1); // snout
      g.fillEllipse(48, 62, 26, 18);
      g.fillStyle(0xffb347, 1); g.fillCircle(48, 62, 4); // nose
      g.fillStyle(INK, 1); // big clawed paws
      g.fillEllipse(26, 78, 20, 12); g.fillEllipse(70, 78, 20, 12);
      g.fillStyle(0x8a7ba8, 1);
      [20, 26, 32].forEach(function (cx) { g.fillTriangle(cx - 3, 84, cx + 3, 84, cx, 92); });
      [64, 70, 76].forEach(function (cx) { g.fillTriangle(cx - 3, 84, cx + 3, 84, cx, 92); });
      eye(38, 40, 4, 0xffb347); eye(58, 40, 4, 0xffb347);
      done('enemy-digger', 96, 96);
    })();

    // Lantern-thief — crouched imp with a bulging sack.
    (function () {
      g.fillStyle(0x0c0a14, 1); g.fillEllipse(52, 88, 70, 12);
      impBody(0, 0, 40, 58, 34, 38); // crouched body
      g.fillStyle(0x4a3b28, 1); g.fillEllipse(68, 52, 30, 34); // bulging sack
      g.lineStyle(3, 0x2e2417, 1); g.strokeEllipse(68, 52, 30, 34);
      g.fillStyle(0x6b5638, 1); g.fillTriangle(60, 36, 76, 36, 68, 26); // tied top
      g.fillStyle(GOLD, 0.9); // coin sparkles on sack
      g.fillCircle(62, 48, 3); g.fillCircle(74, 56, 2.5); g.fillCircle(66, 62, 2);
      eye(34, 50, 3.5, 0xffffff); eye(46, 50, 3.5, 0xffffff);
      done('enemy-thief', 96, 96);
    })();

    // Drummer-imp — small imp with a tiny dhol.
    (function () {
      impBody(0, 0, 48, 56, 30, 38);
      g.fillStyle(0x8a5a2b, 1); g.fillEllipse(48, 56, 40, 26); // tiny dhol
      g.fillStyle(0xf3e2c7, 1);
      g.fillEllipse(28, 56, 8, 22); g.fillEllipse(68, 56, 8, 22);
      g.lineStyle(3, INK, 1); // arms with sticks
      g.lineBetween(36, 40, 26, 28); g.lineBetween(60, 40, 70, 28);
      g.fillStyle(0xd9c9a8, 1); g.fillCircle(24, 24, 3); g.fillCircle(72, 24, 3);
      eye(42, 40, 3.5, 0xff6fa5); eye(54, 40, 3.5, 0xff6fa5);
      done('enemy-drummer', 96, 96);
    })();

    // Ember-imp — imp with a crackling ember core in its chest.
    (function () {
      impBody(0, 0, 48, 50, 36, 46);
      g.fillStyle(0xff5a1f, 0.95); g.fillCircle(48, 52, 11); // ember core
      g.fillStyle(0xffc93c, 1); g.fillCircle(48, 52, 6);
      g.fillStyle(0xffffff, 1); g.fillCircle(48, 52, 2.5);
      g.lineStyle(2, 0xff5a1f, 0.8); // cracks
      g.lineBetween(48, 36, 44, 30); g.lineBetween(52, 64, 58, 70); g.lineBetween(36, 52, 30, 50);
      eye(40, 32, 3.5, 0xff7a1f); eye(56, 32, 3.5, 0xff7a1f);
      done('enemy-ember', 96, 96);
    })();

    // Imp-ling — small fast round imp (from splitter).
    (function () {
      impBody(0, 0, 24, 26, 26, 28);
      g.lineStyle(4, INK, 1);
      g.lineBetween(16, 38, 10, 48); g.lineBetween(32, 38, 38, 48);
      eye(19, 22, 3, 0xff9a1f); eye(29, 22, 3, 0xff9a1f);
      done('enemy-implig', 48, 52);
    })();

    // Swarm imp — small imp shed by the Swarm-Lord.
    (function () {
      impBody(0, 0, 24, 26, 28, 30);
      g.fillStyle(0x2a2140, 1); // tattered wing nubs
      g.fillTriangle(10, 20, 2, 10, 8, 26); g.fillTriangle(38, 20, 46, 10, 40, 26);
      eye(19, 22, 3, 0xc86fff); eye(29, 22, 3, 0xc86fff);
      done('enemy-swarmimp', 48, 52);
    })();

    /* ================= BOSSES ================= */

    // THE CONVOY — war-rig truck silhouette with hex shield dome.
    (function () {
      var w = 240, h = 150;
      g.fillStyle(0x0c0a14, 0.6); g.fillEllipse(120, 136, 210, 16);
      g.fillStyle(0x232030, 1); // truck body
      g.fillRoundedRect(20, 60, 160, 62, 8);
      g.fillStyle(0x2e2a3e, 1); g.fillRoundedRect(180, 74, 44, 48, 6); // cab
      g.fillStyle(0x9fd8ff, 0.7); g.fillRoundedRect(188, 80, 28, 20, 4); // windshield
      g.fillStyle(0x3a3550, 1); // cargo markings
      [50, 90, 130].forEach(function (cx) { g.fillTriangle(cx, 70, cx + 18, 70, cx + 9, 96); });
      g.fillStyle(0x101018, 1); // wheels
      [55, 105, 155, 200].forEach(function (wx) { g.fillCircle(wx, 126, 14); });
      g.fillStyle(0x8a8f9a, 1);
      [55, 105, 155, 200].forEach(function (wx) { g.fillCircle(wx, 126, 5); });
      g.fillStyle(0xff4444, 1); // war-rig eyes on cab
      g.fillCircle(196, 108, 4); g.fillCircle(208, 108, 4);
      // hex shield dome
      g.lineStyle(3, 0x7fd8ff, 0.85);
      g.strokeEllipse(120, 92, 226, 120);
      g.fillStyle(0x7fd8ff, 0.12); g.fillEllipse(120, 92, 226, 120);
      g.lineStyle(2, 0x7fd8ff, 0.5);
      for (var i = 0; i < 5; i++) {
        var hx = 40 + i * 40;
        g.strokeCircle(hx, 92, 14);
      }
      done('boss-convoy', w, h);
    })();

    // THE SWARM-LORD — large moth-like imp with tattered wings.
    (function () {
      var w = 170, h = 150;
      g.fillStyle(0x0c0a14, 0.5); g.fillEllipse(85, 136, 120, 14);
      g.fillStyle(0x2a2140, 1); // tattered wings
      [[20, 60, 8, 20, 30, 90], [150, 60, 162, 20, 140, 90]].forEach(function (t) {
        g.fillTriangle(t[0], t[1], t[2], t[3], t[4], t[5]);
      });
      g.fillStyle(0x3a2d5a, 1);
      g.fillTriangle(34, 70, 24, 40, 44, 80); g.fillTriangle(136, 70, 146, 40, 126, 80);
      impBody(0, 0, 85, 80, 56, 72, 0x8f5fd8);
      g.fillStyle(INK, 1); // antennae
      g.lineStyle(4, INK, 1);
      g.lineBetween(75, 48, 62, 24); g.lineBetween(95, 48, 108, 24);
      g.fillStyle(0xc86fff, 1); g.fillCircle(62, 22, 5); g.fillCircle(108, 22, 5);
      eye(72, 66, 6, 0xc86fff); eye(98, 66, 6, 0xc86fff);
      g.lineStyle(3, 0x8f5fd8, 0.9); g.lineBetween(76, 96, 94, 96); // fanged mouth
      g.fillStyle(0xffffff, 1);
      [78, 86, 94].forEach(function (fx) { g.fillTriangle(fx - 2, 96, fx + 2, 96, fx, 102); });
      done('boss-swarmlord', w, h);
    })();

    /* ================= PROJECTILES ================= */

    (function () { // rocket with flame
      g.fillStyle(0xb03a2e, 1); g.fillRoundedRect(10, 6, 12, 22, 5);
      g.fillStyle(CREAM, 1); g.fillTriangle(10, 6, 22, 6, 16, 0);
      g.fillStyle(0xff9a1f, 1); g.fillTriangle(12, 28, 20, 28, 16, 38); // flame
      g.fillStyle(0xffc93c, 1); g.fillTriangle(13.5, 28, 18.5, 28, 16, 34);
      g.fillStyle(0x8a8f9a, 1); g.fillTriangle(10, 20, 4, 28, 10, 28);
      g.fillTriangle(22, 20, 28, 28, 22, 28);
      done('proj-rocket', 32, 40);
    })();

    (function () { // spinning blade disc with motion streaks
      g.fillStyle(0xdfe6ee, 0.95); g.fillCircle(16, 16, 14);
      g.lineStyle(2, 0x9aa2ad, 1);
      for (var a = 0; a < 6; a++) {
        var an = a * Math.PI / 3;
        g.lineBetween(16, 16, 16 + Math.cos(an) * 13, 16 + Math.sin(an) * 13);
      }
      g.fillStyle(0x5a6068, 1); g.fillCircle(16, 16, 4);
      g.fillStyle(TURQ, 0.5); g.fillEllipse(16, 16, 36, 8); // motion streak
      done('proj-blade', 36, 32);
    })();

    (function () { // chai blob
      g.fillStyle(0xc97b2d, 1); g.fillEllipse(16, 18, 26, 22);
      g.fillStyle(0xe8a54b, 1); g.fillEllipse(12, 14, 12, 10);
      g.fillStyle(0xffffff, 0.4); g.fillEllipse(20, 22, 16, 10); // splash shine
      done('proj-chai', 32, 32);
    })();

    (function () { // lantern bomb with light trail
      g.fillStyle(0xffe9b8, 0.35); g.fillCircle(16, 16, 15); // halo
      g.fillStyle(RUBY, 1); g.fillEllipse(16, 16, 20, 24);
      g.lineStyle(2, 0xa02338, 1);
      g.lineBetween(7, 16, 25, 16);
      g.fillStyle(0xffe9b8, 1); g.fillEllipse(16, 16, 9, 13);
      g.fillStyle(0x5a2d16, 1); g.fillRoundedRect(11, 2, 10, 4, 2);
      done('proj-lantern', 32, 32);
    })();

    /* ================= PARTICLES ================= */

    (function () { // marigold petal
      g.fillStyle(0xff9a1f, 1); g.fillEllipse(8, 8, 14, 10);
      g.fillStyle(0xffc93c, 1); g.fillEllipse(6, 6, 7, 5);
      done('p-petal', 16, 16);
    })();
    (function () { // spark
      g.fillStyle(0xfff2cf, 1); g.fillCircle(4, 4, 4);
      g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 1.8);
      done('p-spark', 8, 8);
    })();
    (function () { // smoke puff
      g.fillStyle(0x8a8aa0, 0.5); g.fillCircle(12, 12, 11);
      g.fillStyle(0xa0a0b8, 0.4); g.fillCircle(9, 9, 6);
      done('p-smoke', 24, 24);
    })();
    (function () { // rain streak
      g.lineStyle(3, 0x9fd8ff, 0.7); g.lineBetween(6, 0, 2, 18);
      done('p-rain', 8, 20);
    })();
    (function () { // dust mote
      g.fillStyle(0xd9c9a8, 0.55); g.fillCircle(8, 8, 7);
      done('p-dust', 16, 16);
    })();
    (function () { // shockwave ring
      g.lineStyle(6, 0xffffff, 1); g.strokeCircle(32, 32, 28);
      done('p-ring', 64, 64);
    })();
    (function () { // splash drop
      g.fillStyle(0x9fd8ff, 0.8); g.fillCircle(6, 6, 5);
      g.fillStyle(0xffffff, 0.7); g.fillCircle(4.5, 4.5, 2);
      done('p-splash', 12, 12);
    })();

    /* ================= BACKGROUND ================= */

    (function () { // night sky gradient 800x1400
      var sky = scene.make.graphics({ x: 0, y: 0, add: false });
      for (var y = 0; y < 1400; y += 14) {
        var t = y / 1400;
        var r = Math.round(11 + (58 - 11) * t);
        var gg = Math.round(16 + (35 - 16) * t);
        var b = Math.round(48 + (80 - 48) * t);
        sky.fillStyle((r << 16) | (gg << 8) | b, 1);
        sky.fillRect(0, y, 800, 14);
      }
      sky.generateTexture('bg-sky', 800, 1400);
      sky.destroy();
    })();

    (function () { // moon with halo
      g.fillStyle(0xffe9b8, 0.18); g.fillCircle(64, 64, 62);
      g.fillStyle(0xffe9b8, 0.25); g.fillCircle(64, 64, 48);
      g.fillStyle(0xf7e8c4, 1); g.fillCircle(64, 64, 38);
      g.fillStyle(0xe8d5ae, 1);
      g.fillCircle(52, 54, 8); g.fillCircle(74, 70, 6); g.fillCircle(66, 50, 5);
      done('bg-moon', 128, 128);
    })();

    (function () { // distant minaret + city silhouette tile
      g.fillStyle(0x241d45, 1);
      g.fillRect(0, 90, 400, 60);
      g.fillRect(60, 40, 22, 110); // minaret
      g.fillTriangle(60, 40, 82, 40, 71, 18); // dome top
      g.fillRect(52, 70, 38, 8); // balcony
      g.fillRect(180, 70, 60, 80); g.fillRect(270, 60, 50, 90); // blocks
      g.fillTriangle(180, 70, 240, 70, 210, 48); // dome
      g.fillStyle(0xffca7a, 0.5); // few lit windows
      [190, 205, 220].forEach(function (wx) { g.fillRect(wx, 85, 6, 8); });
      g.fillRect(66, 90, 8, 10);
      done('bg-minaret', 400, 150);
    })();

    (function () { // striped awning tile with scalloped edge
      var cols = [EMERALD, CREAM, RUBY, CREAM, TURQ, CREAM, AMBER, CREAM];
      for (var i = 0; i < 8; i++) {
        g.fillStyle(cols[i], 1); g.fillRect(i * 25, 0, 25, 46);
      }
      g.fillStyle(0x000000, 0.18); g.fillRect(0, 36, 200, 10);
      for (var s = 0; s < 8; s++) { // scallops
        g.fillStyle(cols[s], 1); g.fillCircle(s * 25 + 12.5, 46, 12.5);
      }
      done('bg-awning', 200, 58);
    })();

    (function () { // hanging lantern (ambient)
      g.lineStyle(2, 0x5a4a3a, 1); g.lineBetween(16, 0, 16, 8);
      g.fillStyle(0xffe9b8, 0.3); g.fillCircle(16, 24, 15); // halo
      g.fillStyle(AMBER, 1); g.fillEllipse(16, 24, 22, 28);
      g.lineStyle(2, 0xb0722a, 1);
      g.lineBetween(6, 24, 26, 24);
      g.fillStyle(0xfff2cf, 1); g.fillEllipse(16, 24, 10, 16);
      g.fillStyle(0x5a2d16, 1); g.fillRoundedRect(10, 8, 12, 5, 2);
      g.fillStyle(GOLD, 1); g.fillTriangle(13, 38, 19, 38, 16, 46); // tassel
      done('bg-lantern', 32, 48);
    })();

    (function () { // fairy-light bulb
      g.fillStyle(0xffe9b8, 0.35); g.fillCircle(8, 8, 8);
      g.fillStyle(0xffd98a, 1); g.fillCircle(8, 8, 4.5);
      g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 2);
      done('bg-fairybulb', 16, 16);
    })();

    (function () { // lane cobble tile (subtly lighter stone path)
      g.fillStyle(0x2e2a4a, 1); g.fillRect(0, 0, 120, 40);
      g.fillStyle(0x38345a, 1);
      var pts = [[14, 10], [44, 8], [74, 12], [104, 9], [28, 28], [58, 30], [88, 27]];
      pts.forEach(function (p) { g.fillEllipse(p[0], p[1], 22, 12); });
      g.fillStyle(0x2e2a4a, 0.6);
      pts.forEach(function (p) { g.fillEllipse(p[0] + 3, p[1] + 2, 14, 7); });
      done('bg-lane', 120, 40);
    })();

    (function () { // bazaar gate (left edge) — arched doorway with glow
      g.fillStyle(0x3a2d55, 1); g.fillRoundedRect(0, 0, 56, 200, 10);
      g.fillStyle(0xffca7a, 0.9); g.fillEllipse(28, 100, 34, 150); // arch glow
      g.fillStyle(0x1c1430, 1); g.fillEllipse(28, 100, 22, 130);
      g.lineStyle(4, GOLD, 1); g.strokeRoundedRect(4, 8, 48, 184, 20);
      g.fillStyle(GOLD, 1); g.fillCircle(28, 16, 6);
      done('bg-gate', 56, 200);
    })();

    (function () { // diya (tiny oil lamp for lane edges)
      g.fillStyle(0xffe9b8, 0.35); g.fillCircle(10, 8, 9);
      g.fillStyle(0xa85b1f, 1); g.fillEllipse(10, 12, 18, 10);
      g.fillStyle(0xff9a1f, 1); g.fillEllipse(10, 6, 6, 9); // flame
      g.fillStyle(0xffe9b8, 1); g.fillEllipse(10, 7, 2.5, 4);
      done('bg-diya', 20, 20);
    })();

    /* ================= SLOTS & STALLS ================= */

    (function () { // rooftop slot: small stall rooftop with striped mini-awning
      g.fillStyle(0x11131f, 0.5); g.fillEllipse(60, 104, 110, 16);
      g.fillStyle(0x4a3550, 1); g.fillRoundedRect(10, 60, 100, 44, 8); // rooftop base
      g.fillStyle(0x5a4462, 1); g.fillRoundedRect(10, 60, 100, 12, 6);
      var cols = [EMERALD, CREAM, RUBY, CREAM, TURQ, CREAM];
      for (var i = 0; i < 6; i++) {
        g.fillStyle(cols[i], 1); g.fillRect(14 + i * 16, 26, 16, 34);
      }
      for (var s = 0; s < 6; s++) {
        g.fillStyle(cols[s], 1); g.fillCircle(14 + s * 16 + 8, 60, 8);
      }
      g.lineStyle(3, 0x3a2d45, 1); g.lineBetween(14, 26, 14, 60); g.lineBetween(106, 26, 106, 60);
      g.fillStyle(GOLD, 0.0); // (selection ring drawn by game code)
      done('slot-rooftop', 120, 112);
    })();

    function drawStall(level) { // stall levels 1-3: richer each level
      var w = 130, h = 120;
      g.fillStyle(0x11131f, 0.5); g.fillEllipse(65, 110, 120, 16);
      g.fillStyle(0x5a3b28, 1); g.fillRoundedRect(20, 66, 90, 40, 6); // counter
      g.fillStyle(0x7a5230, 1); g.fillRoundedRect(20, 66, 90, 10, 5);
      // goods on counter grow per level
      var goods = level === 1 ? [0xe33e5f] : level === 2 ? [0xe33e5f, 0x0fae7e] : [0xe33e5f, 0x0fae7e, 0xffb347];
      goods.forEach(function (col, i) {
        g.fillStyle(col, 1); g.fillCircle(42 + i * 24, 58 - i * 2, 10);
      });
      // striped awning
      var cols = [TURQ, CREAM, MAGENTA, CREAM];
      for (var i = 0; i < 4; i++) {
        g.fillStyle(cols[i], 1); g.fillRect(8 + i * 29, 18, 29, 34);
      }
      for (var s = 0; s < 4; s++) {
        g.fillStyle(cols[s], 1); g.fillCircle(8 + s * 29 + 14.5, 52, 14.5);
      }
      g.lineStyle(4, 0x3a2d45, 1);
      g.lineBetween(10, 18, 10, 66); g.lineBetween(120, 18, 120, 66);
      if (level >= 2) { // hanging lanterns
        g.fillStyle(AMBER, 1); g.fillEllipse(30, 62, 12, 15); g.fillEllipse(100, 62, 12, 15);
      }
      if (level >= 3) { // gold trim + banner
        g.lineStyle(3, GOLD, 1); g.strokeRoundedRect(20, 66, 90, 40, 6);
        g.fillStyle(GOLD, 1); g.fillRoundedRect(45, 2, 40, 16, 6);
        g.fillStyle(0x7a4a00, 1); g.fillCircle(65, 10, 4);
      }
      done('stall-' + level, w, h);
    }
    drawStall(1); drawStall(2); drawStall(3);

    /* ================= UI BITS ================= */

    (function () { // rounded panel 9-slice-ish (drawn big, scaled)
      g.fillStyle(PLUM, 0.92); g.fillRoundedRect(0, 0, 300, 200, 22);
      g.lineStyle(3, GOLD, 0.9); g.strokeRoundedRect(3, 3, 294, 194, 20);
      done('ui-panel', 300, 200);
    })();
    (function () { // button base
      g.fillStyle(0x6b2d4a, 1); g.fillRoundedRect(0, 0, 200, 88, 20);
      g.fillStyle(0x8a3a5f, 1); g.fillRoundedRect(0, 0, 200, 80, 20);
      g.lineStyle(3, GOLD, 1); g.strokeRoundedRect(3, 3, 194, 74, 18);
      done('ui-button', 200, 88);
    })();
    (function () { // banner ribbon
      g.fillStyle(0x6b2d4a, 0.96); g.fillRect(0, 10, 720, 90);
      g.fillStyle(GOLD, 1); g.fillRect(0, 10, 720, 5); g.fillRect(0, 95, 720, 5);
      g.fillStyle(0x8a3a5f, 1);
      g.fillTriangle(0, 10, -30, 55, 0, 100); g.fillTriangle(720, 10, 750, 55, 720, 100);
      done('ui-ribbon', 720, 110);
    })();
    (function () { // star
      g.fillStyle(GOLD, 1);
      var cx = 32, cy = 32, r1 = 28, r2 = 12;
      g.beginPath();
      for (var i = 0; i < 10; i++) {
        var r = i % 2 === 0 ? r1 : r2;
        var a = -Math.PI / 2 + i * Math.PI / 5;
        var px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
        if (i === 0) { g.moveTo(px, py); } else { g.lineTo(px, py); }
      }
      g.closePath(); g.fillPath();
      g.fillStyle(0xfff2cf, 1); g.fillCircle(26, 24, 6);
      done('ui-star', 64, 64);
    })();
    (function () { // coin
      g.fillStyle(0xc9a227, 1); g.fillCircle(20, 20, 18);
      g.fillStyle(0xe8c84a, 1); g.fillCircle(20, 20, 13);
      g.fillStyle(0x8a6d1a, 1); g.fillRect(17, 10, 6, 20);
      done('ui-coin', 40, 40);
    })();
    (function () { // heart
      g.fillStyle(RUBY, 1);
      g.fillCircle(14, 16, 10); g.fillCircle(30, 16, 10);
      g.fillTriangle(5, 20, 39, 20, 22, 40);
      g.fillStyle(0xff8aa0, 1); g.fillCircle(11, 13, 4);
      done('ui-heart', 44, 44);
    })();
    (function () { // tutorial arrow (gold, chunky)
      g.fillStyle(GOLD, 1);
      g.fillTriangle(10, 0, 54, 32, 10, 64);
      g.fillStyle(0x7a4a00, 1);
      g.fillTriangle(10, 0, 54, 32, 32, 32);
      done('ui-arrow', 56, 64);
    })();
    (function () { // boss seal (warning badge)
      g.fillStyle(0x6b1f2e, 1); g.fillCircle(40, 40, 38);
      g.lineStyle(4, 0xff5a5a, 1); g.strokeCircle(40, 40, 38);
      g.lineStyle(5, 0xff5a5a, 1);
      g.lineBetween(40, 16, 40, 46); g.lineBetween(40, 54, 40, 62);
      g.fillStyle(0xff5a5a, 1); g.fillCircle(40, 30, 5);
      done('ui-seal', 80, 80);
    })();
    (function () { // turret card background
      g.fillStyle(PLUM, 0.92); g.fillRoundedRect(0, 0, 112, 150, 16);
      g.lineStyle(2, 0x5a4a72, 1); g.strokeRoundedRect(2, 2, 108, 146, 14);
      done('ui-card', 112, 150);
    })();
    (function () { // gold dot for hint pill
      g.fillStyle(GOLD, 1); g.fillCircle(8, 8, 7);
      g.fillStyle(0xfff2cf, 1); g.fillCircle(8, 8, 3);
      done('ui-dot', 16, 16);
    })();

    g.destroy();
  }

  BS.makeTextures = makeTextures;
})(typeof window !== 'undefined' ? window : globalThis);
