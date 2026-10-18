/* ============================================================================
 * GULLY CHAMPION - Art Factory (art.js)
 * ----------------------------------------------------------------------------
 * 100% code-drawn art for GULLY CHAMPION (Phaser 3.60.0, portrait 720x1280).
 * Plain script, no modules. Exposes `window.GCArt`.
 *
 * Art direction: golden-hour warmth, rounded organic shapes only, light does
 * the HD work (layered gradients, additive glow, bokeh, soft long shadows),
 * everything alive with ambient motion, no popping (state changes animate).
 *
 * Zero image assets. Zero external URLs. All textures are generated from
 * Phaser Graphics at runtime.
 * ========================================================================== */

// ---------------------------------------------------------------------------
// Small private helpers (not part of the public API)
// ---------------------------------------------------------------------------

function _hex(h) {
  return parseInt(h.slice(1), 16);
}

// Mix two 0xRRGGBB colors by t (0..1).
function _mix(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

// Vertical gradient painted as thin strips (Graphics has no gradient fills).
function _vgrad(g, x, y, w, h, stops) {
  const cols = stops.map(_hex);
  const n = 56;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const seg = t * (cols.length - 1);
    const si = Math.min(cols.length - 2, Math.floor(seg));
    const st = seg - si;
    g.fillStyle(_mix(cols[si], cols[si + 1], st), 1);
    g.fillRect(x, y + (h * i) / n, w, h / n + 1);
  }
}

// Generate a texture once; skip if the key already exists in this scene.
function _tex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

// Sampled quadratic bezier points (avoids relying on Graphics curve methods).
function _qbez(p0, p1, p2, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push({
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
    });
  }
  return pts;
}

// Stroke a polyline through points.
function _strokePts(g, pts, close) {
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  if (close) g.closePath();
  g.strokePath();
}

// Filled star polygon.
function _star(g, cx, cy, rO, rI, points, color, alpha) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rO : rI;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(new Phaser.Geom.Point(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  g.fillStyle(color, alpha === undefined ? 1 : alpha);
  g.fillPoints(pts, true);
}

// Random helper with seed-free Math.random (fine for decoration).
function _rr(a, b) { return a + Math.random() * (b - a); }
function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ---------------------------------------------------------------------------
// Shared texture generation
// ---------------------------------------------------------------------------

function _texBall(g) {
  // White tape-ball, ~26px, with red seam arc.
  const c = 13, r = 12;
  g.fillStyle(0xe8e2d4, 1); g.fillCircle(c, c, r);          // edge shade
  g.fillStyle(0xf7f4ec, 1); g.fillCircle(c, c, r - 1.5);    // base
  g.fillStyle(0xffffff, 0.9); g.fillCircle(c - 4, c - 5, 5);// light blob
  g.fillStyle(0xffffff, 0.5); g.fillCircle(c + 2, c + 3, 7);// bounce light
  g.lineStyle(2, 0xc23a2e, 1);                              // red seam arc
  g.beginPath(); g.arc(c, c, 8.5, 0.5, 2.7, false); g.strokePath();
  g.lineStyle(1.5, 0x8f2a22, 0.8);
  g.beginPath(); g.arc(c, c, 8.5, 0.62, 2.58, false); g.strokePath();
  g.lineStyle(1, 0xcfc8b8, 0.9); g.strokeCircle(c, c, r - 0.5);
}

function _texBallGlow(g) {
  // Soft warm halo for the ball, ~64px.
  for (let i = 8; i >= 1; i--) {
    g.fillStyle(0xfff3d6, 0.05 + 0.02 * (8 - i));
    g.fillCircle(32, 32, i * 4);
  }
}

function _softCircle(g, size, color, peak) {
  const c = size / 2;
  for (let i = 10; i >= 1; i--) {
    g.fillStyle(color, (peak * i) / 10);
    g.fillCircle(c, c, (c * i) / 10);
  }
}

function _texCrowd(g, variant) {
  // Dark silhouette person, 52x84. Variant changes arm pose.
  const c = 0x2b1535;
  g.fillStyle(c, 1);
  g.fillCircle(26, 16, 11);                       // head
  g.fillRoundedRect(14, 28, 24, 50, 12);          // torso blob
  if (variant === 0) {
    g.fillRoundedRect(8, 34, 8, 30, 4);           // arms down
    g.fillRoundedRect(36, 34, 8, 30, 4);
  } else if (variant === 1) {
    g.save(); g.translateCanvas(40, 34); g.rotateCanvas(-2.2);
    g.fillRoundedRect(-4, -34, 8, 34, 4); g.restore();  // one arm raised
    g.fillRoundedRect(8, 34, 8, 30, 4);
  } else {
    g.save(); g.translateCanvas(12, 36); g.rotateCanvas(0.7);
    g.fillRoundedRect(-4, 0, 8, 30, 4); g.restore();
    g.save(); g.translateCanvas(40, 36); g.rotateCanvas(-0.7);
    g.fillRoundedRect(-4, 0, 8, 30, 4); g.restore();
  }
  // Faint warm rim on the head so silhouettes read against bright skies.
  g.lineStyle(2, 0xffca7a, 0.25);
  g.beginPath(); g.arc(26, 16, 10, Math.PI * 1.15, Math.PI * 1.85, false); g.strokePath();
}

// Truck-art bat skins, 36x120, vertical. Handle at top, blade below.
function _texBat(g, idx) {
  const W = 36, H = 120;
  const skins = [
    { blade: 0xc99a5e, bladeD: 0x9a6f3c, grip: 0x1c1c22, accent: 0x000000 }, // 0 Street Classic
    { blade: 0x0f7b7c, bladeD: 0x0a5455, grip: 0x7a1f2b, accent: 0xd63a4e }, // 1 Rose Medallion
    { blade: 0x5b2a86, bladeD: 0x3d1c5c, grip: 0x1e2a5e, accent: 0x2fbfae }, // 2 Peacock Pride
    { blade: 0x1e2a5e, bladeD: 0x121a3d, grip: 0x3a3f4a, accent: 0xe8ecf4 }, // 3 Chrome Raja
    { blade: 0xf2b134, bladeD: 0xc78a1e, grip: 0x8f1f2e, accent: 0xd63a2e }, // 4 Horn Please
    { blade: 0xf7d774, bladeD: 0xd99a2b, grip: 0x5e3a10, accent: 0xfff3c4 }  // 5 Golden Gali
  ];
  const s = skins[idx];

  // Blade: rounded, warm wood-ish base (or skin base color) with fake gradient.
  g.fillStyle(s.bladeD, 1); g.fillRoundedRect(2, 38, 32, 80, 12);
  g.fillStyle(s.blade, 1);  g.fillRoundedRect(3, 38, 30, 78, 11);
  g.fillStyle(0xffffff, 0.10); g.fillRoundedRect(6, 44, 8, 66, 4);   // left light
  g.fillStyle(0x000000, 0.12); g.fillRoundedRect(24, 44, 7, 66, 3);  // right shade

  // Handle + grip.
  g.fillStyle(0x8a5a34, 1); g.fillRoundedRect(12, 2, 12, 42, 6);
  g.fillStyle(s.grip, 1);   g.fillRoundedRect(11, 0, 14, 40, 7);
  g.lineStyle(1.5, 0x000000, 0.35);
  for (let y = 6; y < 38; y += 6) { g.lineBetween(12, y, 24, y); }
  g.fillStyle(s.grip, 1); g.fillRoundedRect(8, 0, 20, 8, 4);          // top cap

  // Motifs per skin.
  if (idx === 0) {
    // Plain wood: subtle grain arcs + black edge pinstripe.
    g.lineStyle(1.5, 0x7c5227, 0.5);
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.arc(18, 78 + i * 10, 12, 0.4, 2.7, false); g.strokePath();
    }
    g.lineStyle(2, 0x1c1c22, 0.8); g.strokeRoundedRect(4, 40, 28, 74, 10);
  } else if (idx === 1) {
    // Red rose medallion on teal.
    g.fillStyle(0xf7e8c8, 0.9); g.fillCircle(18, 74, 13);
    g.fillStyle(0xd63a4e, 1); g.fillCircle(18, 74, 9);
    g.fillStyle(0xf26d7d, 1); g.fillCircle(18, 74, 5.5);
    g.fillStyle(0x8f1f2b, 1); g.fillCircle(18, 74, 2.5);
    g.fillStyle(0x2e8b57, 1);
    g.fillEllipse(8, 84, 8, 5); g.fillEllipse(28, 64, 8, 5);
    g.lineStyle(2, 0xf7e8c8, 0.9); g.strokeCircle(18, 74, 13);
    _star(g, 18, 104, 5, 2.2, 5, 0xf7e8c8, 0.9);
  } else if (idx === 2) {
    // Peacock feather eye on purple.
    g.fillStyle(0x2fbfae, 1); g.fillEllipse(18, 70, 22, 34);
    g.fillStyle(0x1e6fd9, 1); g.fillEllipse(18, 70, 13, 22);
    g.fillStyle(0x0a2a6b, 1); g.fillEllipse(18, 70, 7, 12);
    g.lineStyle(2, 0xffca7a, 0.9); g.strokeCircle(18, 58, 15);
    _star(g, 18, 100, 6, 2.6, 5, 0x2fbfae, 0.95);
    _star(g, 18, 46, 4, 1.8, 5, 0xffca7a, 0.9);
  } else if (idx === 3) {
    // Chrome diagonal stripes on navy.
    for (let i = -2; i < 6; i++) {
      g.fillStyle(i % 2 ? 0xe8ecf4 : 0x9aa4c0, 0.85);
      g.save(); g.translateCanvas(18, 78); g.rotateCanvas(0.6);
      g.fillRoundedRect(-4 + i * 9, -44, 5, 88, 2); g.restore();
    }
    g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(6, 44, 6, 66, 3); // chrome shine
    g.lineStyle(2, 0xe8ecf4, 0.9); g.strokeRoundedRect(4, 40, 28, 74, 10);
  } else if (idx === 4) {
    // Yellow/red floral + banner stripes.
    const cols = [0xd63a2e, 0x2e8b57, 0xf7e8c8];
    for (let i = 0; i < 3; i++) {
      const fy = 56 + i * 18;
      g.fillStyle(cols[i % 3], 1); g.fillCircle(18, fy, 6);
      g.fillStyle(0xfff3c4, 1); g.fillCircle(18, fy, 2.5);
      g.fillStyle(0x2e8b57, 1);
      g.fillEllipse(9, fy + 7, 7, 4); g.fillEllipse(27, fy - 7, 7, 4);
    }
    for (let i = 0; i < 4; i++) {
      g.fillStyle(i % 2 ? 0xd63a2e : 0x2e8b57, 1);
      g.fillRoundedRect(6 + i * 7, 104, 5, 10, 2);
    }
  } else {
    // Gold gradient + star medallions.
    for (let i = 0; i < 6; i++) {
      g.fillStyle(_mix(0xf7d774, 0xfff6d8, i / 5), 0.55);
      g.fillRoundedRect(4, 42 + i * 12, 28, 12, 6);
    }
    _star(g, 18, 66, 10, 4.2, 5, 0x8a5a10, 1);
    _star(g, 18, 66, 7, 3, 5, 0xfff3c4, 1);
    _star(g, 18, 94, 6, 2.6, 5, 0xfff3c4, 0.95);
    g.lineStyle(2, 0x8a5a10, 0.9); g.strokeRoundedRect(4, 40, 28, 74, 10);
  }

  // Glossy highlight stripe over everything + soft toe.
  g.fillStyle(0xffffff, 0.22); g.fillRoundedRect(7, 46, 5, 62, 2.5);
  g.fillStyle(0x000000, 0.18); g.fillRoundedRect(4, 110, 28, 8, 4);
}

// Character part textures (shared by batter / bowler / fielder).
function _charTex(scene) {
  _tex(scene, 'gc-head', 46, 46, (g) => {
    g.fillStyle(0x8a5a3b, 1); g.fillCircle(23, 23, 22);          // warm brown skin
    g.fillStyle(0xa06a45, 1); g.fillCircle(23, 23, 22);          // (kept flat: tint-safe)
    g.fillStyle(0x8a5a3b, 1); g.fillCircle(23, 24, 20);
    g.fillStyle(0xffffff, 0.18); g.fillCircle(16, 15, 7);        // cheek light
    g.fillStyle(0x241610, 1);                                   // friendly dot eyes
    g.fillCircle(16, 22, 3.2); g.fillCircle(30, 22, 3.2);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(17, 21, 1.1); g.fillCircle(31, 21, 1.1);
    g.lineStyle(2, 0x5e3a22, 0.9);                              // small smile
    g.beginPath(); g.arc(23, 28, 7, 0.5, 2.6, false); g.strokePath();
  });
  _tex(scene, 'gc-torso', 60, 96, (g) => {
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 0, 60, 96, 28); // white: tinted by kit
    g.fillStyle(0x000000, 0.10); g.fillEllipse(30, 84, 52, 26);   // soft bottom shade
    g.fillStyle(0xffffff, 0.35); g.fillEllipse(30, 18, 44, 20);   // chest light
  });
  _tex(scene, 'gc-limb', 18, 64, (g) => {
    g.fillStyle(0x8a5a3b, 1); g.fillRoundedRect(0, 0, 18, 64, 9); // warm brown capsule
    g.fillStyle(0xffffff, 0.14); g.fillRoundedRect(3, 4, 5, 56, 2.5);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const GCArt = {

  // Generate every shared texture once (call in Boot).
  makeAll(scene) {
    _tex(scene, 'gc-ball', 26, 26, _texBall);
    _tex(scene, 'gc-ball-glow', 64, 64, _texBallGlow);
    _tex(scene, 'gc-p-dust', 36, 36, (g) => _softCircle(g, 36, 0xd9b98a, 0.55));
    _tex(scene, 'gc-p-confetti', 12, 16, (g) => {
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 0, 12, 16, 3);
    });
    _tex(scene, 'gc-p-spark', 16, 16, (g) => {
      _softCircle(g, 16, 0xfff6d8, 0.8);
      g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 2.6);
    });
    _tex(scene, 'gc-p-bokeh', 96, 96, (g) => _softCircle(g, 96, 0xfff1cf, 0.30));
    _tex(scene, 'gc-shadow', 96, 32, (g) => {
      for (let i = 10; i >= 1; i--) {
        g.fillStyle(0x1a0f24, 0.05 * i);
        g.fillEllipse(48, 16, 9.6 * i, 3.2 * i);
      }
    });
    _tex(scene, 'gc-crowd-0', 52, 84, (g) => _texCrowd(g, 0));
    _tex(scene, 'gc-crowd-1', 52, 84, (g) => _texCrowd(g, 1));
    _tex(scene, 'gc-crowd-2', 52, 84, (g) => _texCrowd(g, 2));
    for (let i = 0; i < 6; i++) {
      _tex(scene, 'gc-bat-' + i, 36, 120, (g) => _texBat(g, i));
    }
  },

  // -- Characters ----------------------------------------------------------
  // Rounded capsule figure (~170px). Limbs pivot at joints via top origins.
  // The match scene animates the NAMED parts below.

  makeBatter(scene) {
    _charTex(scene);
    const f = _figure(scene, 0x0f8a80, 0x274b63); // teal/gold hero kit
    const bat = scene.add.image(42, -28, 'gc-bat-0').setOrigin(0.5, 0.12);
    bat.setScale(1.05);
    f.root.add(bat);
    const out = {
      root: f.root, head: f.head, torso: f.torso,
      armF: f.armF, armB: f.armB, legF: f.legF, legB: f.legB,
      bat: bat, shadow: f.shadow,
      setSkin(i) {
        const idx = Phaser.Math.Clamp(Math.round(i) || 0, 0, 5);
        bat.setTexture('gc-bat-' + idx);
        // Tiny celebratory pop so the swap never pops visually.
        scene.tweens.killTweensOf(bat);
        bat.setScale(1.05);
        scene.tweens.add({
          targets: bat, scaleX: 1.22, scaleY: 1.22, duration: 110,
          yoyo: true, ease: 'Back.easeOut',
          onComplete: () => bat.setScale(1.05)
        });
      }
    };
    return out;
  },

  makeBowler(scene, tint) {
    _charTex(scene);
    const kit = tint === undefined ? 0xc23a4e : tint;
    const f = _figure(scene, kit, 0x23232f);
    // Bowling arm starts raised; the match scene drives the delivery swing.
    f.armB.setRotation(-2.4);
    return {
      root: f.root, head: f.head, torso: f.torso,
      armBowl: f.armB, armF: f.armF, legF: f.legF, legB: f.legB,
      shadow: f.shadow
    };
  },

  makeFielder(scene, tint) {
    _charTex(scene);
    const kit = tint === undefined ? 0x2e8b57 : tint;
    const f = _figure(scene, kit, 0x23232f);
    return {
      root: f.root, head: f.head, torso: f.torso,
      armF: f.armF, armB: f.armB, legF: f.legF, legB: f.legB,
      shadow: f.shadow
    };
  },

  // -- Ball ----------------------------------------------------------------
  // Container whose main visual is the gc-ball image, with an additive glow
  // child behind it. Behaves like a single sprite for position/scale/alpha.

  makeBall(scene) {
    const root = scene.add.container(0, 0);
    const glow = scene.add.image(0, 0, 'gc-ball-glow')
      .setDisplaySize(58, 58)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.65);
    const ball = scene.add.image(0, 0, 'gc-ball').setDisplaySize(26, 26);
    root.add([glow, ball]);
    root.setSize(26, 26);
    root.ball = ball;   // convenience handles for the match scene
    root.glow = glow;
    return root;
  },

  // -- Stumps ---------------------------------------------------------------
  // 3 rounded stumps + 2 bails, warm wood, ~54x70.

  makeStumps(scene) {
    const root = scene.add.container(0, 0);
    const g = scene.add.graphics();
    const wood = 0xa5713a, woodD = 0x7c5227, woodL = 0xd09a5c;
    for (const sx of [-15, 0, 15]) {
      g.fillStyle(woodD, 1); g.fillRoundedRect(sx - 5.5, 2, 11, 64, 5);
      g.fillStyle(wood, 1);  g.fillRoundedRect(sx - 5, 2, 10, 64, 5);
      g.fillStyle(woodL, 0.85); g.fillRoundedRect(sx - 5, 2, 3.5, 64, 2);
    }
    for (const bx of [-7.5, 7.5]) {
      g.fillStyle(woodD, 1); g.fillRoundedRect(bx - 7, -6, 14, 8, 4);
      g.fillStyle(woodL, 1); g.fillRoundedRect(bx - 6.5, -6, 13, 4.5, 2);
    }
    root.add(g);
    root.setSize(54, 72);
    return root;
  },

  // -- Gallis ----------------------------------------------------------------
  // Overscan 800x1400 root (full-bleed on any phone aspect). Three parallax
  // layers + an animated crowd. Ambient motion runs through updateGali.

  makeGali(scene, galiId) {
    const id = ['rooftop', 'beach', 'mountain', 'night'].indexOf(galiId) >= 0 ? galiId : 'rooftop';
    const root = scene.add.container(0, 0);
    const far = scene.add.container(0, 0);
    const mid = scene.add.container(0, 0);
    const near = scene.add.container(0, 0);
    root.add([far, mid, near]);

    const g = {
      root: root,
      layers: [far, mid, near],
      crowd: null,
      palette: GCArt.PALETTES[id],
      _scene: scene,
      _crowd: [], _bokeh: [], _flags: [], _palms: [],
      _gulls: [], _lights: [], _phones: [],
      _foam: null, _celTween: null
    };

    _GALI_BUILDERS[id](scene, g, far, mid, near);
    _buildCrowd(scene, g, near, _CROWD_CFG[id]);

    // FULL-BLEED on tall phones: the camera shows past the 800x1400 art.
    // Solid strips sampled from the sky-top stop and the ground base color
    // sit behind everything, so the extension is seamless.
    const OY = Math.max(0, (GCConfig.H - 1280) / 2);
    const skyTop = scene.add.graphics();
    skyTop.fillStyle(_hex(g.palette.sky[0]), 1);
    skyTop.fillRect(-40, -OY - 80, 880, OY + 84);
    far.addAt(skyTop, 0);
    const groundCols = {
      rooftop: 0x4a2c5a, beach: 0xf2d49b, // sand (matches PALETTES.beach.sand)
      mountain: 0x6fa06a, night: 0x1c1f3d
    };
    const gf = scene.add.graphics();
    gf.fillStyle(groundCols[id], 1);
    gf.fillRect(-40, 1380, 880, OY + 100);
    near.addAt(gf, 0);
    return g;
  },

  // Cheap per-frame ambient animation: sine offsets only, no tween creation.
  updateGali(g, time, dt) {
    if (!g) return;
    const t = time * 0.001;

    const crowd = g._crowd;
    for (let i = 0; i < crowd.length; i++) {
      const it = crowd[i], p = it.phase;
      it.img.y = it.baseY + Math.sin(t * 2.1 + p) * 5;
      it.img.x = it.baseX + Math.cos(t * 1.4 + p) * 3;
      it.img.rotation = Math.sin(t * 1.8 + p) * 0.045;
    }

    const bokeh = g._bokeh;
    for (let i = 0; i < bokeh.length; i++) {
      const b = bokeh[i];
      b.img.alpha = b.baseAlpha * (0.7 + 0.3 * Math.sin(t * 2.6 + b.phase));
      b.img.y = b.baseY + Math.sin(t * 0.9 + b.phase) * 22;
    }

    const flags = g._flags;
    for (let i = 0; i < flags.length; i++) {
      const f = flags[i];
      f.obj.rotation = f.baseRot + Math.sin(t * 2.4 + f.phase) * 0.05;
    }

    const palms = g._palms;
    for (let i = 0; i < palms.length; i++) {
      const p = palms[i];
      p.obj.rotation = p.baseRot + Math.sin(t * 1.6 + p.phase) * 0.07;
    }

    const gulls = g._gulls;
    for (let i = 0; i < gulls.length; i++) {
      const u = gulls[i];
      u.img.x = u.baseX + Math.sin(t * u.speed + u.phase) * u.range;
      u.img.y = u.baseY + Math.sin(t * u.speed * 1.7 + u.phase) * 12;
      u.img.scaleX = u.baseScale * (Math.cos(t * u.speed + u.phase) > 0 ? 1 : -1);
    }

    const lights = g._lights;
    for (let i = 0; i < lights.length; i++) {
      const l = lights[i];
      l.img.alpha = l.baseAlpha * (0.6 + 0.4 * Math.abs(Math.sin(t * 3.1 + l.phase * 7.0)));
    }

    const phones = g._phones;
    for (let i = 0; i < phones.length; i++) {
      const p = phones[i];
      p.img.alpha = p.baseAlpha * (0.55 + 0.45 * Math.abs(Math.sin(t * 1.9 + p.phase * 5.0)));
    }

    if (g._foam) g._foam.alpha = 0.45 + 0.25 * Math.sin(t * 2.4);
  },

  // Jump-burst on the crowd container (single tween, never per-item).
  // big=true sustains the celebration for ~6s (cup win).
  crowdCelebrate(g, big) {
    if (!g || !g._scene || !g.crowd) return;
    if (g._celTween) { g._celTween.stop(); g._celTween = null; }
    g.crowd.y = 0;
    g.crowd.scaleY = 1;
    const targets = g._phoneLayer ? [g.crowd, g._phoneLayer] : g.crowd;
    if (g._phoneLayer) { g._phoneLayer.y = 0; g._phoneLayer.scaleY = 1; }
    const hops = big ? 11 : 3;
    g._celTween = g._scene.tweens.add({
      targets: targets,
      y: -26,
      scaleY: 0.93,
      duration: big ? 250 : 190,
      yoyo: true,
      repeat: hops,
      ease: 'Quad.easeOut',
      onComplete: () => {
        g.crowd.y = 0;
        g.crowd.scaleY = 1;
        if (g._phoneLayer) { g._phoneLayer.y = 0; g._phoneLayer.scaleY = 1; }
        g._celTween = null;
      }
    });
  },

  // -- Metadata --------------------------------------------------------------

  PALETTES: {
    rooftop:  { sky: ['#2b1a4d', '#b3477f', '#ff9a5a', '#ffd29d'], sun: '#ffe6b8', parapet: '#4a2c5a', crowd: 0x2b1535 },
    beach:    { sky: ['#0f4c81', '#3fa7c4', '#ffe3a3'], sun: '#fff3d0', sea: '#2a9db0', sand: '#f2d49b', crowd: 0x1e3a4a },
    mountain: { sky: ['#1c2f5e', '#4a7f9e', '#cfe8d8'], sun: '#fdf6dc', ridgeFar: '#8fb8ad', ridgeNear: '#4a7a6c', pine: '#2c5248', crowd: 0x2a3f55 },
    night:    { sky: ['#060a24', '#141b4d', '#2b2a6b'], moon: '#f4ead0', fairy: '#ffca7a', crowd: 0x100d20 }
  },

  GALLIS: [
    { id: 'rooftop',  name: 'Rooftop at Sunset', desc: 'Golden hour above the mohalla.', unlock: { type: 'default' } },
    { id: 'beach',    name: 'Beach',             desc: 'Sea breeze and big hits.',       unlock: { type: 'cupWins', value: 1 } },
    { id: 'mountain', name: 'Mountain Road',     desc: 'Thin air, huge sixes.',          unlock: { type: 'cupWins', value: 3 } },
    { id: 'night',    name: 'Night Street',      desc: 'Fairy lights. Legend hours.',   unlock: { type: 'cups', value: 1 } }
  ],

  BATS: [
    { name: 'Street Classic', desc: 'Gali standard issue.', unlock: { type: 'default' } },
    { name: 'Rose Medallion', desc: 'Truck-art roses.',     unlock: { type: 'runs', value: 50 } },
    { name: 'Peacock Pride',  desc: 'Mor pankh power.',     unlock: { type: 'sixes', value: 10 } },
    { name: 'Chrome Raja',    desc: 'Mirror shine.',        unlock: { type: 'cupWins', value: 1 } },
    { name: 'Horn Please',    desc: 'Backside poetry.',     unlock: { type: 'runs', value: 150 } },
    { name: 'Golden Gali',    desc: 'For cup winners only.', unlock: { type: 'cups', value: 1 } }
  ]
};

// ---------------------------------------------------------------------------
// Character assembly shared by batter / bowler / fielder.
// Local space: feet ~+70, head top ~-106. Limbs pivot at joints.
// ---------------------------------------------------------------------------

function _figure(scene, kit, trouser) {
  const root = scene.add.container(0, 0);
  const shadow = scene.add.image(0, 78, 'gc-shadow')
    .setDisplaySize(84, 24).setAlpha(0.4);
  const legB = scene.add.image(-9, 16, 'gc-limb')
    .setOrigin(0.5, 0.08).setTint(trouser);
  const legF = scene.add.image(9, 16, 'gc-limb')
    .setOrigin(0.5, 0.08).setTint(trouser);
  const torso = scene.add.image(0, -26, 'gc-torso')
    .setDisplaySize(54, 84).setTint(kit);
  const armB = scene.add.image(-30, -56, 'gc-limb').setOrigin(0.5, 0.08);
  const armF = scene.add.image(30, -56, 'gc-limb').setOrigin(0.5, 0.08);
  const head = scene.add.image(0, -86, 'gc-head').setDisplaySize(40, 40);
  root.add([shadow, legB, legF, torso, armB, armF, head]);
  return { root, head, torso, armF, armB, legF, legB, shadow };
}

// ---------------------------------------------------------------------------
// Gali builders (overscan 800x1400, origin top-left)
// ---------------------------------------------------------------------------

const _CROWD_CFG = {
  rooftop:  { rows: [1004, 1092], tint: 0x2b1535, phones: false },
  beach:    { rows: [1090, 1180], tint: 0x1e3a4a, phones: false },
  mountain: { rows: [1060, 1150], tint: 0x2a3f55, phones: false },
  night:    { rows: [1070, 1160], tint: 0x100d20, phones: true }
};

function _buildCrowd(scene, g, near, cfg) {
  const crowd = scene.add.container(0, 0);
  near.add(crowd);
  g.crowd = crowd;
  const perRow = 24;
  for (let r = 0; r < cfg.rows.length; r++) {
    for (let i = 0; i < perRow; i++) {
      const bx = 20 + (760 * i) / (perRow - 1) + _rr(-8, 8);
      const by = cfg.rows[r] + _rr(-6, 6);
      const img = scene.add.image(bx, by, 'gc-crowd-' + (i % 3))
        .setOrigin(0.5, 1)
        .setTint(cfg.tint)
        .setScale(_rr(0.95, 1.3));
      const phase = Math.random() * Math.PI * 2;
      img.setData('phase', phase);
      img.setData('baseX', bx);
      img.setData('baseY', by);
      crowd.add(img);
      g._crowd.push({ img, phase, baseX: bx, baseY: by });
    }
  }
  // Night street: a few spectators hold up glowing phone screens.
  // Kept in a sibling layer so `crowd` stays exactly 48 silhouettes.
  if (cfg.phones) {
    const phones = scene.add.container(0, 0);
    near.add(phones);
    g._phoneLayer = phones;
    for (let i = 0; i < 8; i++) {
      const it = g._crowd[Math.floor(Math.random() * g._crowd.length)];
      const ph = scene.add.image(it.baseX + 12, it.baseY - 66, 'gc-p-confetti')
        .setDisplaySize(8, 12).setTint(0xd8ecff).setAlpha(0.9);
      const phase = Math.random() * Math.PI * 2;
      phones.add(ph);
      g._phones.push({ img: ph, phase, baseAlpha: 0.9 });
    }
  }
}

// Warm dust / light motes drifting in the air.
function _addBokeh(scene, g, layer, count, tint, x0, x1, y0, y1, s0, s1, alpha) {
  for (let i = 0; i < count; i++) {
    const bx = _rr(x0, x1), by = _rr(y0, y1);
    const img = scene.add.image(bx, by, 'gc-p-bokeh')
      .setTint(tint)
      .setScale(_rr(s0, s1))
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(alpha);
    layer.add(img);
    g._bokeh.push({ img, phase: Math.random() * Math.PI * 2, baseY: by, baseAlpha: alpha });
  }
}

// Rounded palm tree silhouette; fronds sway via updateGali.
function _palm(scene, g, layer, x, y, s, color) {
  const root = scene.add.container(x, y).setScale(s);
  const tg = scene.add.graphics();
  tg.fillStyle(color, 1);
  // Trunk: overlapping circles along a gentle curve (organic, no boxes).
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    tg.fillCircle(14 * t * t, -150 * t, 13 - 5 * t);
  }
  root.add(tg);
  const fronds = scene.add.container(14, -152);
  const fg = scene.add.graphics();
  fg.fillStyle(color, 1);
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.08 + 0.84 * (i / 5));
    fg.save(); fg.translateCanvas(0, 0); fg.rotateCanvas(a - Math.PI / 2);
    fg.fillEllipse(52, 0, 104, 22);
    fg.restore();
  }
  // Coconuts: friendly round blobs.
  fg.fillStyle(color, 1);
  fg.fillCircle(-10, 10, 9); fg.fillCircle(10, 10, 9); fg.fillCircle(0, 16, 9);
  fronds.add(fg);
  root.add(fronds);
  layer.add(root);
  g._palms.push({ obj: fronds, baseRot: 0, phase: Math.random() * Math.PI * 2 });
}

// Prayer-flag string across two points; flags flutter via updateGali.
function _flagString(scene, g, layer, x0, y0, x1, y1, sag) {
  const mx = (x0 + x1) / 2, my = Math.max(y0, y1) + sag;
  const pts = _qbez({ x: x0, y: y0 }, { x: mx, y: my + sag * 0.4 }, { x: x1, y: y1 }, 24);
  const root = scene.add.container(mx, (y0 + y1) / 2 + sag * 0.5);
  const lg = scene.add.graphics();
  lg.lineStyle(3, 0x3a2c4a, 1);
  _strokePts(lg, pts.map(p => ({ x: p.x - mx, y: p.y - root.y })), false);
  const cols = [0xd63a4e, 0xf2b134, 0x2e8b57, 0x1e6fd9, 0xf7e8c8, 0xb3477f];
  for (let i = 2; i < pts.length - 2; i += 3) {
    const p = pts[i];
    lg.fillStyle(cols[(i / 3 | 0) % cols.length], 1);
    lg.fillRoundedRect(p.x - mx - 7, p.y - root.y, 14, 18, 3);
  }
  root.add(lg);
  layer.add(root);
  g._flags.push({ obj: root, baseRot: 0, phase: Math.random() * Math.PI * 2 });
}

// Fairy-light string: warm glowing dots on a sagging wire (night street).
function _fairyString(scene, g, layer, x0, y0, x1, y1, sag) {
  const pts = _qbez({ x: x0, y: y0 }, { x: (x0 + x1) / 2, y: Math.max(y0, y1) + sag }, { x: x1, y: y1 }, 32);
  const wg = scene.add.graphics();
  wg.lineStyle(2, 0x2a1f3a, 1);
  _strokePts(wg, pts, false);
  layer.add(wg);
  for (let i = 1; i < pts.length - 1; i += 2) {
    const p = pts[i];
    const img = scene.add.image(p.x, p.y + 8, 'gc-p-bokeh')
      .setTint(0xffca7a)
      .setScale(0.22)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.95);
    layer.add(img);
    g._lights.push({ img, phase: Math.random() * Math.PI * 2, baseAlpha: 0.95 });
  }
}

// Stylized pine: stacked soft blobs (rounded, never triangular).
function _pine(gfx, x, y, s, color) {
  gfx.fillStyle(color, 1);
  gfx.fillRoundedRect(x - 3 * s, y - 10 * s, 6 * s, 12 * s, 3 * s); // trunk
  gfx.fillEllipse(x, y - 16 * s, 26 * s, 16 * s);
  gfx.fillEllipse(x, y - 26 * s, 20 * s, 14 * s);
  gfx.fillEllipse(x, y - 35 * s, 13 * s, 12 * s);
}

// Humpy ridge silhouette across the width.
function _ridge(gfx, yBase, amp, color, alpha) {
  gfx.fillStyle(color, alpha);
  const pts = [{ x: -40, y: 1400 }];
  for (let x = -40; x <= 840; x += 40) {
    pts.push({ x, y: yBase + Math.sin(x * 0.021) * amp + Math.sin(x * 0.008 + 2) * amp * 0.7 });
  }
  pts.push({ x: 840, y: 1400 });
  gfx.fillPoints(pts, true);
}

const _GALI_BUILDERS = {

  rooftop(scene, g, far, mid, near) {
    const pal = g.palette;
    const sky = scene.add.graphics();
    _vgrad(sky, 0, 0, 800, 1400, pal.sky);
    far.add(sky);
    // Low sun + halo.
    const halo = scene.add.image(560, 620, 'gc-p-bokeh')
      .setTint(0xffca7a).setScale(5.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.55);
    far.add(halo);
    g._bokeh.push({ img: halo, phase: 0, baseY: 620, baseAlpha: 0.55 });
    const sun = scene.add.graphics();
    sun.fillStyle(_hex(pal.sun), 1); sun.fillCircle(560, 620, 52);
    sun.fillStyle(0xfff6dc, 0.9); sun.fillCircle(560, 620, 40);
    far.add(sun);
    // Soft pink clouds.
    const cl = scene.add.graphics();
    cl.fillStyle(0xffd9c0, 0.28);
    cl.fillEllipse(180, 420, 260, 60); cl.fillEllipse(660, 300, 220, 52);
    cl.fillEllipse(420, 220, 180, 44);
    far.add(cl);

    // Mid: distant rooftop silhouettes with water tanks + antennas.
    const mg = scene.add.graphics();
    mg.fillStyle(0x3a2350, 1);
    const roofs = [[-20, 700, 200, 120], [170, 740, 240, 110], [400, 690, 180, 130], [570, 730, 260, 120]];
    for (const [x, y, w, h] of roofs) mg.fillRoundedRect(x, y, w, h, 14);
    mg.fillStyle(0x4a2c5a, 1);
    for (const [x, y] of [[120, 640], [470, 630], [700, 670]]) {  // water tanks
      mg.fillRoundedRect(x, y, 64, 62, 12);
      mg.fillEllipse(x + 32, y, 64, 26);
      mg.fillStyle(0x5e3a6e, 1); mg.fillRoundedRect(x + 8, y + 10, 48, 8, 4);
      mg.fillStyle(0x4a2c5a, 1);
    }
    mg.lineStyle(4, 0x2b1a3d, 1);                                 // antennas
    for (const [x, y] of [[250, 700], [620, 690]]) {
      mg.lineBetween(x, y, x, y - 90);
      mg.lineBetween(x - 22, y - 70, x + 22, y - 70);
      mg.lineBetween(x - 14, y - 50, x + 14, y - 50);
      mg.fillCircle(x, y - 90, 5);
    }
    mid.add(mg);

    // Near: parapet wall the crowd stands behind.
    const ng = scene.add.graphics();
    ng.fillStyle(0x3a2148, 1); ng.fillRoundedRect(-20, 990, 840, 430, 26);
    ng.fillStyle(_hex(pal.parapet), 1); ng.fillRoundedRect(-20, 1004, 840, 416, 22);
    ng.fillStyle(0x6a4470, 1); ng.fillRoundedRect(-20, 1004, 840, 14, 7); // warm top edge
    near.add(ng);
    _addBokeh(scene, g, near, 10, 0xffd9a0, 40, 760, 700, 1100, 0.3, 0.9, 0.5);
  },

  beach(scene, g, far, mid, near) {
    const pal = g.palette;
    const sky = scene.add.graphics();
    _vgrad(sky, 0, 0, 800, 1400, pal.sky);
    far.add(sky);
    const sun = scene.add.graphics();
    sun.fillStyle(_hex(pal.sun), 1); sun.fillCircle(400, 380, 60);
    sun.fillStyle(0xffffff, 0.85); sun.fillCircle(400, 380, 44);
    far.add(sun);
    const halo = scene.add.image(400, 380, 'gc-p-bokeh')
      .setTint(0xfff3d0).setScale(5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
    far.add(halo);
    g._bokeh.push({ img: halo, phase: 1.2, baseY: 380, baseAlpha: 0.5 });
    const cl = scene.add.graphics();
    cl.fillStyle(0xffffff, 0.35);
    cl.fillEllipse(150, 300, 240, 54); cl.fillEllipse(620, 220, 200, 46);
    far.add(cl);

    // Mid: teal sea band + foam shimmer.
    const sea = scene.add.graphics();
    sea.fillStyle(_hex(pal.sea), 1); sea.fillRoundedRect(-20, 640, 840, 220, 40);
    sea.fillStyle(0x5cc4d4, 0.7);
    for (let i = 0; i < 7; i++) sea.fillEllipse(_rr(40, 760), _rr(680, 800), _rr(60, 150), 18);
    mid.add(sea);
    const foam = scene.add.graphics();
    foam.fillStyle(0xffffff, 0.6); foam.fillRoundedRect(-20, 830, 840, 26, 13);
    mid.add(foam);
    g._foam = foam;
    // Gulls: simple arc-wing silhouettes, animated in updateGali.
    _tex(scene, 'gc-gull', 44, 20, (gg) => {
      gg.lineStyle(3, 0x2a4a5a, 1);
      gg.beginPath(); gg.arc(12, 18, 10, Math.PI * 1.2, Math.PI * 1.9, false); gg.strokePath();
      gg.beginPath(); gg.arc(32, 18, 10, Math.PI * 1.1, Math.PI * 1.8, false); gg.strokePath();
    });
    for (let i = 0; i < 4; i++) {
      const img = scene.add.image(_rr(80, 720), _rr(180, 420), 'gc-gull').setScale(_rr(0.8, 1.3));
      mid.add(img);
      g._gulls.push({
        img, baseX: img.x, baseY: img.y, baseScale: img.scaleX,
        phase: Math.random() * Math.PI * 2, speed: _rr(0.5, 0.9), range: _rr(40, 110)
      });
    }

    // Near: sand with a wet band, palms at the edges.
    const ng = scene.add.graphics();
    ng.fillStyle(_hex(pal.sand), 1); ng.fillRoundedRect(-20, 880, 840, 540, 40);
    ng.fillStyle(0xe0b983, 1); ng.fillRoundedRect(-20, 880, 840, 34, 16); // wet band
    ng.fillStyle(0xffffff, 0.25);
    for (let i = 0; i < 8; i++) ng.fillEllipse(_rr(40, 760), _rr(1000, 1300), _rr(30, 80), 12);
    near.add(ng);
    _palm(scene, g, near, 90, 1120, 1.15, 0x1e4a3e);
    _palm(scene, g, near, 720, 1180, 0.9, 0x1e4a3e);
    _addBokeh(scene, g, near, 8, 0xfff3d0, 40, 760, 900, 1200, 0.25, 0.7, 0.45);
  },

  mountain(scene, g, far, mid, near) {
    const pal = g.palette;
    const sky = scene.add.graphics();
    _vgrad(sky, 0, 0, 800, 1400, pal.sky);
    far.add(sky);
    const sun = scene.add.graphics();
    sun.fillStyle(_hex(pal.sun), 0.95); sun.fillCircle(620, 300, 46);
    far.add(sun);
    const halo = scene.add.image(620, 300, 'gc-p-bokeh')
      .setTint(0xfdf6dc).setScale(4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45);
    far.add(halo);
    g._bokeh.push({ img: halo, phase: 2.1, baseY: 300, baseAlpha: 0.45 });

    // Mid: layered pine ridges with atmospheric fade.
    const mg = scene.add.graphics();
    _ridge(mg, 560, 60, _hex(pal.ridgeFar), 0.85);
    _ridge(mg, 740, 70, _hex(pal.ridgeNear), 1);
    for (let i = 0; i < 14; i++) _pine(mg, _rr(0, 800), _rr(700, 840), _rr(0.8, 1.4), _hex(pal.pine));
    for (let i = 0; i < 8; i++) _pine(mg, _rr(0, 800), _rr(560, 640), _rr(0.6, 1.0), _hex(pal.ridgeFar));
    mid.add(mg);
    // Prayer-flag strings fluttering across the sky.
    _flagString(scene, g, mid, 40, 420, 420, 380, 60);
    _flagString(scene, g, mid, 380, 380, 780, 430, 70);

    // Near: grassy slope + winding road ribbon.
    const ng = scene.add.graphics();
    ng.fillStyle(0x6fa06a, 1); ng.fillRoundedRect(-20, 900, 840, 520, 40);
    ng.fillStyle(0x5d8a58, 1);
    for (let i = 0; i < 10; i++) ng.fillEllipse(_rr(0, 800), _rr(950, 1350), _rr(50, 120), 22);
    near.add(ng);
    const road = scene.add.graphics();
    road.fillStyle(0x9a8f7d, 1);
    const rpts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      rpts.push({ x: 400 + Math.sin(t * 5.2) * 180 * (0.4 + t), y: 900 + t * 500 });
    }
    for (const p of rpts) road.fillCircle(p.x, p.y, 30 - 6 * (p.y / 1400));
    road.fillStyle(0xfff3d0, 0.5);
    for (let i = 2; i < rpts.length - 2; i += 4) road.fillCircle(rpts[i].x, rpts[i].y, 3);
    near.add(road);
    _addBokeh(scene, g, near, 8, 0xfdf6dc, 40, 760, 950, 1250, 0.25, 0.7, 0.4);
  },

  night(scene, g, far, mid, near) {
    const pal = g.palette;
    const sky = scene.add.graphics();
    _vgrad(sky, 0, 0, 800, 1400, pal.sky);
    far.add(sky);
    // Stars + moon.
    const st = scene.add.graphics();
    for (let i = 0; i < 70; i++) {
      st.fillStyle(0xffffff, _rr(0.3, 0.9));
      st.fillCircle(_rr(0, 800), _rr(0, 560), _rr(1, 2.4));
    }
    st.fillStyle(_hex(pal.moon), 1); st.fillCircle(640, 190, 40);
    st.fillStyle(0x141b4d, 0.25); st.fillCircle(626, 180, 34);
    far.add(st);

    // Mid: building silhouettes with warm windows.
    const mg = scene.add.graphics();
    mg.fillStyle(0x10163a, 1);
    const blds = [[-20, 560, 190, 320], [160, 620, 220, 280], [370, 540, 170, 340], [530, 610, 200, 290], [720, 580, 110, 320]];
    for (const [x, y, w, h] of blds) mg.fillRoundedRect(x, y, w, h, 10);
    for (let i = 0; i < 46; i++) {
      mg.fillStyle(_pick([0xffca7a, 0xffd9a0, 0x9adfff]), _rr(0.5, 1));
      mg.fillRoundedRect(_rr(0, 780), _rr(580, 840), 10, 14, 3);
    }
    mid.add(mg);
    // Fairy-light strings with flicker.
    _fairyString(scene, g, mid, 30, 560, 400, 520, 70);
    _fairyString(scene, g, mid, 380, 520, 770, 570, 80);
    _fairyString(scene, g, mid, 120, 700, 680, 660, 60);

    // Near: street + shop awnings with warm pools of light.
    const ng = scene.add.graphics();
    ng.fillStyle(0x1c1f3d, 1); ng.fillRoundedRect(-20, 980, 840, 440, 30);
    near.add(ng);
    const awnCols = [0xd63a4e, 0x2e8b57, 0x1e6fd9];
    for (let i = 0; i < 3; i++) {
      const ax = 60 + i * 240, acol = awnCols[i];
      const ag = scene.add.graphics();
      ag.fillStyle(acol, 1); ag.fillRoundedRect(ax, 940, 180, 46, 12);
      ag.fillStyle(0xfff3d0, 0.9);
      for (let sIdx = 0; sIdx < 5; sIdx++) ag.fillRoundedRect(ax + 8 + sIdx * 36, 940, 18, 46, 6);
      ag.fillStyle(0x000000, 0.25); ag.fillRoundedRect(ax, 972, 180, 14, 7);
      near.add(ag);
      const pool = scene.add.image(ax + 90, 1060, 'gc-p-bokeh')
        .setTint(0xffca7a).setScale(2.2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.4);
      near.add(pool);
      g._lights.push({ img: pool, phase: Math.random() * Math.PI * 2, baseAlpha: 0.4 });
    }
    _addBokeh(scene, g, near, 10, 0xffca7a, 40, 760, 700, 1100, 0.2, 0.6, 0.5);
  }
};

// Expose globally.
window.GCArt = GCArt;
