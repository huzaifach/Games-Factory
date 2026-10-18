/* GULLY CHAMPION — Match scene: the core batting game.
   data: {mode:'over'|'cup'|'time', botId, target, cupRound, galiId} */
var MatchScene = new Phaser.Scene('Match');

MatchScene.create = function (data) {
  var scene = this;
  scene.M = data || {};
  scene.OY = (GCConfig.H - GCConfig.DH) / 2;
  // Center the 720x1280 design space on taller canvases (full-bleed, no bars).
  scene.cameras.main.setScroll(0, -scene.OY);
  scene.mode = scene.M.mode || 'over';
  scene.bot = GCUtil.getBot(scene.M.botId || 'tariq');
  scene.target = scene.M.target || 0;
  scene.cupRound = scene.M.cupRound || 0;
  scene.galiId = scene.M.galiId || 'rooftop';
  var A = window.gcAudio;

  // Score state.
  scene.runs = 0; scene.wkts = 0; scene.balls = 0;
  scene.dots = []; scene.sixes = 0; scene.fours = 0;
  scene.phase = 'intro';
  scene.holding = false; scene.holdPtr = null; scene.trail = [];
  scene.ai = new GClogic.BowlerAI(scene.bot.mix);
  scene.freeHit = false; scene.paused = false;
  // Time attack state.
  scene.timeLeft = GCConfig.timeAttack.duration;
  scene.combo = 1; scene.comboBest = 1; scene.taScore = 0;

  // World.
  scene.gali = GCArt.makeGali(scene, scene.galiId);
  try { A.startCrowd(); A.startGroove(scene.galiId); } catch (e) {}
  scene.drawPitch();

  // Characters.
  scene.stumps = GCArt.makeStumps(scene).setPosition(360, 1090).setDepth(5);
  scene.batter = GCArt.makeBatter(scene);
  scene.batter.root.setPosition(360, 985).setDepth(6);
  try { scene.batter.setSkin(GCSave.data.bat || 0); } catch (e) {}
  scene.bowler = GCArt.makeBowler(scene, scene.bot.color);
  scene.bowler.root.setPosition(360, 190).setDepth(5);
  scene.fielders = [];
  var fpos = [[150, 640], [570, 640], [230, 470], [490, 470], [360, 560], [110, 850], [610, 850]];
  var tints = [0x8a4b5e, 0x4b5e8a, 0x5e8a4b, 0x8a7a4b, 0x6b4b8a, 0x4b8a7a, 0x8a4b6b];
  fpos.forEach(function (p, i) {
    var f = GCArt.makeFielder(scene, tints[i % tints.length]);
    f.root.setPosition(p[0], p[1]).setDepth(4);
    f.home = { x: p[0], y: p[1] };
    scene.fielders.push(f);
  });

  // Ball + trail ghosts + shadow.
  scene.ball = GCArt.makeBall(scene).setDepth(20).setVisible(false);
  scene.ballShadow = scene.add.image(0, 0, 'gc-shadow').setDisplaySize(40, 14).setAlpha(0.35).setDepth(3).setVisible(false);
  scene.ghosts = [];
  for (var gi = 0; gi < 4; gi++) {
    var gh = scene.add.image(0, 0, 'gc-ball').setDisplaySize(22 - gi * 3, 22 - gi * 3).setAlpha(0.28 - gi * 0.06).setDepth(19).setVisible(false);
    scene.ghosts.push(gh);
  }

  // Particles.
  scene.dust = scene.add.particles(0, 0, 'gc-p-dust', {
    speed: { min: 60, max: 220 }, lifespan: { min: 300, max: 700 },
    scale: { start: 1.6, end: 0 }, alpha: { start: 0.7, end: 0 }, emitting: false
  }).setDepth(30);
  scene.confetti = scene.add.particles(0, 0, 'gc-p-confetti', {
    speed: { min: 200, max: 520 }, angle: { min: 250, max: 290 }, gravityY: 900,
    lifespan: { min: 900, max: 1600 }, scale: { min: 0.7, max: 1.4 },
    rotate: { min: 0, max: 360 }, tint: [0xffd75a, 0x7ddf64, 0x5ad1ff, 0xff8a5a, 0xff5a8a, 0xfff6e8],
    alpha: { start: 1, end: 0.4 }, emitting: false
  }).setDepth(31);
  scene.sparks = scene.add.particles(0, 0, 'gc-p-spark', {
    speed: { min: 120, max: 380 }, lifespan: { min: 200, max: 500 },
    scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 },
    blendMode: 'ADD', emitting: false
  }).setDepth(31);

  scene.buildHUD();
  scene.bindInput();

  // Intro.
  scene.cameras.main.fadeIn(300, 11, 7, 22);
  GCUI.toast(scene, GCUtil.pick(scene.bot.banter.start), { y: 560, fontSize: 32, hold: 1400 });
  var it1 = scene.add.text(360, 640, scene.modeTitle(), { fontFamily: 'Arial, sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#ffd75a', stroke: '#241a38', strokeThickness: 8 }).setOrigin(0.5).setDepth(60);
  var it2 = scene.add.text(360, 700, scene.mode === 'time' ? '60 seconds. Go big!' : 'Chase ' + scene.target + ' runs', { fontFamily: 'Arial, sans-serif', fontSize: '34px', color: '#fff6e8', stroke: '#241a38', strokeThickness: 6 }).setOrigin(0.5).setDepth(60);
  scene.introTexts = [it1, it2];
  // Release-timing cue ring at the crease (shrinks as the ball arrives).
  scene.cueRing = scene.add.circle(360, 960, 60).setStrokeStyle(5, 0xffd75a, 0.9).setVisible(false).setDepth(15);
  try { A.countdownBeep(false); } catch (e) {}
  scene.time.delayedCall(1500, function () { scene.phase = 'between'; scene.startBall(); });
};

MatchScene.modeTitle = function () {
  if (this.mode === 'cup') return ['QUARTER FINAL', 'SEMI FINAL', 'FINAL'][this.cupRound] || 'MOHALLA CUP';
  if (this.mode === 'time') return 'TIME ATTACK';
  return 'SUPER OVER';
};

MatchScene.drawPitch = function () {
  var scene = this;
  var g = scene.add.graphics().setDepth(1);
  // Pitch strip: rounded, sandy, subtle inner shading.
  g.fillStyle(0xd9b98a, 0.30);
  g.fillRoundedRect(296, 170, 128, 960, 60);
  g.fillStyle(0xc9a06f, 0.35);
  g.fillRoundedRect(330, 380, 60, 600, 28);
  // Creases.
  g.lineStyle(5, 0xfff6e8, 0.85);
  g.lineBetween(300, 960, 420, 960);   // batting crease
  g.lineBetween(300, 400, 420, 400);   // bowling crease
  // Boundary rope hint (arc).
  g.lineStyle(6, 0xffca7a, 0.5);
  g.strokeCircle(360, 960, 500);
};

MatchScene.buildHUD = function () {
  var scene = this;
  // Top bar.
  var bar = scene.add.graphics().setDepth(50);
  bar.fillStyle(0x0b0716, 0.62);
  bar.fillRoundedRect(16, 16, 688, 118, 24);
  scene.add.text(40, 44, scene.modeTitle(), { fontFamily: 'Arial, sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#ffca7a' }).setDepth(51);
  scene.scoreText = scene.add.text(40, 74, '0/0', { fontFamily: 'Arial, sans-serif', fontSize: '52px', fontStyle: 'bold', color: '#fff6e8' }).setDepth(51);
  scene.subText = scene.add.text(360, 100, '', { fontFamily: 'Arial, sans-serif', fontSize: '26px', color: '#ffd9a0' }).setOrigin(0.5, 0).setDepth(51);
  // Pause button.
  scene.pauseBtn = GCUI.button(scene, 648, 75, 96, 'II', { fontSize: 34, height: 84, depth: 55, onClick: function () { scene.togglePause(); } });
  // Ball dots strip.
  scene.dotsRow = scene.add.container(360, 168).setDepth(51);
  // Power meter (bottom-anchored on tall phones).
  var pY = 1130 + (scene.OY || 0);
  scene.powerBg = scene.add.graphics().setDepth(51);
  scene.powerBg.fillStyle(0x0b0716, 0.62);
  scene.powerBg.fillRoundedRect(160, pY, 400, 30, 15);
  scene.powerFill = scene.add.graphics().setDepth(52);
  scene.powerBg.setVisible(false); scene.powerFill.setVisible(false);
  scene.hintText = scene.add.text(360, 1190 + (scene.OY || 0), 'HOLD anywhere to charge — RELEASE to hit', { fontFamily: 'Arial, sans-serif', fontSize: '26px', color: '#ffd9a0', backgroundColor: '#0b0716', padding: { x: 14, y: 8 } }).setOrigin(0.5).setDepth(51);
  scene.hintText.setAlpha(0.92);
  scene.updateHUD();
};

MatchScene.updateHUD = function () {
  var scene = this;
  var sc = scene.mode === 'time' ? scene.taScore : scene.runs;
  scene.scoreText.setText(sc + (scene.mode === 'time' ? '' : '/' + scene.wkts));
  var sub;
  if (scene.mode === 'time') {
    sub = '0:' + String(Math.max(0, Math.ceil(scene.timeLeft))).padStart(2, '0') + '   COMBO x' + scene.combo;
  } else {
    var need = scene.target - scene.runs;
    var left = GCConfig.superOver.balls - scene.balls;
    sub = GCUtil.fmtOvers(scene.balls) + ' ov   ' + (need > 0 ? 'Need ' + need + ' off ' + left : 'Target ' + scene.target);
  }
  scene.subText.setText(sub);
  // Dots.
  scene.dotsRow.removeAll(true);
  var ds = scene.dots.slice(-8);
  ds.forEach(function (d, i) {
    var col = '#9a8fae';
    if (d === '4') col = '#7ddf64';
    else if (d === '6') col = '#ffd75a';
    else if (d === 'W') col = '#ff6b6b';
    else if (d === 'wd' || d === 'nb') col = '#5ad1ff';
    else if (d === '1' || d === '2' || d === '3') col = '#fff6e8';
    var t = scene.add.text(i * 44 - (ds.length - 1) * 22, 0, d.toUpperCase(), {
      fontFamily: 'Arial, sans-serif', fontSize: '26px', fontStyle: 'bold', color: col,
      backgroundColor: '#0b0716', padding: { x: 8, y: 4 }
    }).setOrigin(0.5);
    scene.dotsRow.add(t);
  });
};

MatchScene.bindInput = function () {
  var scene = this;
  // Full-screen swing input via the global pointerdown (no hit-area math, so
  // it covers the whole canvas at any aspect height); the pause button area
  // is excluded manually inside onDown.
  scene.input.on('pointerdown', function (p) { scene.onDown(p); });
  scene.input.on('pointermove', function (p) { scene.onMove(p); });
  scene.input.on('pointerup', function (p) { scene.onUp(p); });
  scene.input.keyboard.on('keydown-SPACE', function () { scene.onDown({ x: 360, y: 800, id: 'kb' }); });
  scene.input.keyboard.on('keyup-SPACE', function () { scene.onUp({ x: 360, y: 800, id: 'kb' }); });
  scene.input.keyboard.on('keydown-P', function () { scene.togglePause(); });
};

MatchScene.onDown = function (p) {
  var scene = this;
  if (scene.paused || scene.holding) return;
  if (scene.phase !== 'runup' && scene.phase !== 'bowling') return;
  // Keep the pause button tappable.
  if (p.y < 150 && p.x > 580) return;
  scene.holding = true; scene.holdPtr = p.id === undefined ? 't' : p.id;
  scene.holdStart = scene.time.now; scene.trail = [{ t: scene.time.now, x: p.x || 360 }];
  scene.powerBg.setVisible(true); scene.powerFill.setVisible(true);
  // Anticipation crouch (squash).
  scene.tweens.killTweensOf(scene.batter.root);
  scene.tweens.add({ targets: scene.batter.root, scaleY: 0.9, scaleX: 1.08, duration: 140 });
  scene.tweens.add({ targets: scene.batter.bat, angle: -24, duration: 140 });
};

MatchScene.onMove = function (p) {
  var scene = this;
  if (!scene.holding) return;
  var id = p.id === undefined ? 't' : p.id;
  if (id !== scene.holdPtr) return;
  scene.trail.push({ t: scene.time.now, x: p.x || 360 });
  if (scene.trail.length > 14) scene.trail.shift();
};

MatchScene.onUp = function (p) {
  var scene = this;
  if (!scene.holding) return;
  var id = p.id === undefined ? 't' : p.id;
  if (id !== scene.holdPtr && p.id !== 'kb') return;
  scene.doSwing(p.x || 360);
};

MatchScene.powerFor = function (holdMs) {
  var t = (holdMs - GCConfig.power.minHoldMs) / (GCConfig.power.fullHoldMs - GCConfig.power.minHoldMs);
  t = GCUtil.clamp(t, 0, 1);
  return GCConfig.power.minPower + (1 - GCConfig.power.minPower) * t;
};

/* ---------------- Ball-by-ball sequence ---------------- */

MatchScene.startBall = function () {
  var scene = this;
  if (scene.phase !== 'between' || scene.paused) return;
  scene.phase = 'runup';
  var A = window.gcAudio;

  // Pick delivery.
  var key = scene.ai.pick();
  var D = GCConfig.deliveries[key];
  scene.curKey = key; scene.curDelivery = D;
  var r = Math.random();
  scene.isWide = r < scene.bot.wideP;
  scene.isNoBall = !scene.isWide && r < scene.bot.wideP + scene.bot.nbP;
  scene.wideDir = Math.random() < 0.5 ? -1 : 1;
  scene.jinkDir = Math.random() < 0.5 ? -1 : 1;

  // Speed factor (time attack gets quicker).
  var speedF = 1;
  if (scene.mode === 'time') {
    var elapsed = GCConfig.timeAttack.duration - scene.timeLeft;
    speedF = 1 - 0.22 * (elapsed / GCConfig.timeAttack.duration);
  }
  scene.travel = D.travel * scene.bot.pace * speedF;

  if (scene.freeHit) GCUI.toast(scene, 'FREE HIT', { y: 480, fontSize: 44, color: '#7ddf64', hold: 900 });

  // Telegraph (clarity scales with bot.read; Badshah sometimes hides it).
  var clear = Math.random() < scene.bot.read;
  scene.time.delayedCall(150, function () {
    if (clear) GCUI.telegraph(scene, D.label, D.cue, D.col, 750);
    else GCUI.telegraph(scene, '???', 'Read it late!', 0x9a8fae, 600);
  });

  // Bowler run-up with squash bounce + arm windup.
  var bw = scene.bowler;
  bw.root.setPosition(360, 190);
  scene.tweens.add({ targets: bw.root, y: 330, duration: 950, ease: 'Quad.easeIn' });
  scene.tweens.add({ targets: bw.root, scaleY: 0.94, duration: 120, yoyo: true, repeat: 6 });
  scene.tweens.add({ targets: bw.armBowl, angle: -170, duration: 620, ease: 'Quad.easeIn' });
  scene.tweens.add({ targets: bw.armBowl, angle: 50, duration: 200, delay: 700, ease: 'Quad.easeOut' });

  // Release.
  scene.time.delayedCall(950, function () { scene.releaseBall(); });
  // Clear intro card on first ball.
  if (scene.introTexts) {
    var it = scene.introTexts; scene.introTexts = null;
    it.forEach(function (t) { if (t && t.destroy) t.destroy(); });
  }
};

MatchScene.releaseBall = function () {
  var scene = this;
  if (scene.phase !== 'runup') return;
  scene.phase = 'bowling';
  try { window.gcAudio.throwWhoosh(); } catch (e) {}
  // Reset bowler arm, start bounce-back.
  scene.tweens.add({ targets: scene.bowler.armBowl, angle: 0, duration: 400 });
  scene.ball.setVisible(true).setPosition(360, 400).setScale(1);
  scene.ballShadow.setVisible(true);
  scene.releaseT = scene.time.now;
  scene.idealT = scene.releaseT + scene.travel;
  scene.swung = false;
  scene.ghostT = 0;
  scene.ghosts.forEach(function (g) { g.setVisible(false); });
};

MatchScene.flickDx = function (xNow) {
  var scene = this, now = scene.time.now, base = null;
  for (var i = scene.trail.length - 1; i >= 0; i--) {
    if (now - scene.trail[i].t >= 150) { base = scene.trail[i].x; break; }
  }
  if (base === null && scene.trail.length) base = scene.trail[0].x;
  if (base === null) return 0;
  return GCUtil.clamp(xNow - base, -GCConfig.flick.maxDx, GCConfig.flick.maxDx);
};

MatchScene.doSwing = function (x) {
  var scene = this, now = scene.time.now;
  scene.holding = false;
  scene.powerBg.setVisible(false); scene.powerFill.setVisible(false);
  scene.tweens.add({ targets: scene.batter.root, scaleY: 1, scaleX: 1, duration: 120 });
  if (scene.phase === 'runup') { // whiffed too early — can re-hold
    scene.swingAnim();
    GCUI.toast(scene, 'Too early!', { y: 800, fontSize: 30, hold: 600 });
    return;
  }
  if (scene.phase !== 'bowling' || scene.swung) return;
  scene.swung = true;
  var power = scene.powerFor(now - scene.holdStart);
  var flickDx = scene.flickDx(x);
  var errMs = now - scene.idealT;
  scene.ai.update(errMs);
  var D = scene.curDelivery;
  var shot = GClogic.computeShot({ power: power, flickDx: flickDx, errMs: errMs, delivery: D });
  scene.lastPower = power;
  scene.swingAnim();
  // Timing feedback.
  var fb, col;
  if (shot.grade === 'perfect') { fb = 'PERFECT!'; col = '#ffd75a'; }
  else if (shot.grade === 'good') { fb = errMs < 0 ? 'Early' : 'Late'; col = '#7ddf64'; }
  else if (shot.grade === 'edge') { fb = errMs < 0 ? 'Very early' : 'Very late'; col = '#ffca7a'; }
  else { fb = 'Miss!'; col = '#ff8a8a'; }
  GCUI.popup(scene, 360, 780, fb, { fontSize: shot.grade === 'perfect' ? 72 : 44, color: col, hold: 550 });
  if (shot.grade === 'miss') scene.ballMissed(shot, D);
  else scene.ballContact(shot, D, power);
};

MatchScene.swingAnim = function () {
  var scene = this, b = scene.batter;
  scene.tweens.killTweensOf(b.bat);
  // Explosive swing: stretch then sweep.
  scene.tweens.add({ targets: b.root, scaleX: 0.92, scaleY: 1.1, duration: 90, yoyo: true });
  scene.tweens.add({ targets: b.bat, angle: 95, duration: 130, ease: 'Quad.easeIn', yoyo: true, onComplete: function () { b.bat.setAngle(-24); } });
  scene.tweens.add({ targets: b.armF, angle: 70, duration: 130, yoyo: true, onComplete: function () { b.armF.setAngle(0); } });
};

MatchScene.ballContact = function (shot, D, power) {
  var scene = this, A = window.gcAudio;
  scene.phase = 'contact';
  scene.cueRing.setVisible(false);
  try { A.batCrack(power); } catch (e) {}
  // Hit flash + dust + sparks at contact.
  var flash = scene.add.circle(360, 950, 10, 0xffffff, 0.9).setDepth(32);
  scene.tweens.add({ targets: flash, scaleX: 7, scaleY: 7, alpha: 0, duration: 220, onComplete: function () { flash.destroy(); } });
  scene.dust.explode(10, 360, 950);
  scene.sparks.explode(8, 360, 950);
  scene.cameras.main.shake(90, 0.004);

  // Landing spot + outcome.
  var dirR = shot.dirDeg * Math.PI / 180;
  var distM = 15 + shot.quality * 80;
  var distPx = distM * 7.3;
  var lx = GCUtil.clamp(360 + Math.sin(dirR) * distPx, 50, 670);
  var ly = GCUtil.clamp(960 - Math.cos(dirR) * distPx * 0.82, 60, 1000);
  var fc = scene.fieldCloseness(lx, ly);
  var outcome = GClogic.resolveOutcome({
    quality: shot.quality, loftDeg: shot.loftDeg, dirDeg: shot.dirDeg, grade: shot.grade,
    stumpP: D.stumpP, fieldClose: fc, r1: Math.random(), r2: Math.random(), r3: Math.random()
  });
  var perfectSix = shot.grade === 'perfect' && outcome.how === 'six';
  // Hit-pause: hang the ball at contact, then launch.
  scene.time.delayedCall(perfectSix ? 220 : 90, function () {
    scene.launchBall(shot, outcome, lx, ly, perfectSix);
  });
};

MatchScene.ballMissed = function (shot, D) {
  var scene = this, A = window.gcAudio;
  scene.phase = 'fielding';
  scene.cueRing.setVisible(false);
  // Ball continues past the bat to the keeper/stumps.
  var p = GCUtil.clamp((scene.time.now - scene.releaseT) / scene.travel, 0, 1);
  var bx = 360 + (D.curve || 0) * Math.sin(Math.PI * p);
  scene.tweens.add({
    targets: { x: bx, y: 960 }, x: 360, y: 1120, duration: 380, ease: 'Quad.easeIn',
    onUpdate: function (tw) {
      var v = tw.targets[0];
      scene.ball.setPosition(v.x, v.y);
      scene.ballShadow.setPosition(v.x, Math.min(v.y, 1120));
    },
    onComplete: function () {
      scene.ball.setVisible(false); scene.ballShadow.setVisible(false);
      var r = Math.random();
      if (!scene.freeHit && r < D.stumpP) {
        // BOWLED — stumps scatter.
        try { A.wicketSting(); A.crowdGasp(); } catch (e) {}
        GCUI.popup(scene, 360, 700, 'BOWLED!', { fontSize: 84, color: '#ff6b6b' });
        try { A.umpireSay('Out!'); } catch (e) {}
        scene.tweens.add({ targets: scene.stumps, y: 1040, angle: 24, duration: 350, ease: 'Quad.easeOut', yoyo: true, onComplete: function () { scene.stumps.setAngle(0).setY(1090); } });
        scene.dust.explode(12, 360, 1060);
        scene.cameras.main.shake(160, 0.008);
        scene.time.delayedCall(900, function () { scene.applyOutcome({ runs: 0, how: 'bowled', wicket: true }); });
      } else {
        try { A.catchPop(); } catch (e) {}
        scene.time.delayedCall(650, function () { scene.applyOutcome({ runs: 0, how: 'dot', wicket: false }); });
      }
    }
  });
};

MatchScene.fieldCloseness = function (lx, ly) {
  var best = 1e9, scene = this;
  scene.fielders.forEach(function (f) {
    var d = Math.hypot(f.root.x - lx, f.root.y - ly);
    if (d < best) best = d;
  });
  return GCUtil.clamp(1 - best / 260, 0, 1);
};

MatchScene.nearestFielder = function (lx, ly) {
  var best = null, bd = 1e9, scene = this;
  scene.fielders.forEach(function (f) {
    var d = Math.hypot(f.root.x - lx, f.root.y - ly);
    if (d < bd) { bd = d; best = f; }
  });
  return { f: best, d: bd };
};

/* ---------------- Ball flight, fielding, scoring ---------------- */

MatchScene.launchBall = function (shot, outcome, lx, ly, perfectSix) {
  var scene = this, A = window.gcAudio;
  scene.phase = 'fielding';
  var dur = perfectSix ? 1500 : 800;
  var zPeak = 50 + shot.loftDeg * 3.2;

  if (perfectSix) {
    GCUI.popup(scene, 360, 470, 'GULLY SIX!', { fontSize: 108, color: '#ffd75a', hold: 1100 });
    scene.confetti.explode(60, 80, 1150);
    scene.confetti.explode(60, 640, 1150);
    scene.cameras.main.shake(320, 0.012);
    try { A.sixStinger(); A.umpireSay('Six!'); A.swellCrowd(1, 2000); GCArt.crowdCelebrate(scene.gali, true); } catch (e) {}
  } else if (outcome.how === 'six') {
    scene.confetti.explode(45, 360, 420);
    scene.cameras.main.shake(200, 0.008);
    try { A.sixStinger(); A.umpireSay('Six!'); A.swellCrowd(0.9, 1500); GCArt.crowdCelebrate(scene.gali, true); } catch (e) {}
  } else if (outcome.how === 'four') {
    scene.confetti.explode(18, 360, 520);
    try { A.fourChime(); A.umpireSay('Four runs!'); A.swellCrowd(0.6, 1200); GCArt.crowdCelebrate(scene.gali, false); } catch (e) {}
  }

  var pr = { t: 0 };
  scene.tweens.add({
    targets: pr, t: 1, duration: dur, ease: 'Linear',
    onStart: function () { scene.ghosts.forEach(function (g) { g.setVisible(true); }); },
    onUpdate: function () {
      var t = pr.t;
      var x = 360 + (lx - 360) * t;
      var gy = 950 + (ly - 950) * t;
      var z = Math.sin(Math.PI * t) * zPeak;
      scene.ball.setPosition(x, gy - z).setScale(1 + z / 600);
      scene.ballShadow.setPosition(x, Math.min(gy, 1120)).setAlpha(Math.max(0.08, 0.35 - z / 900));
      for (var i = scene.ghosts.length - 1; i > 0; i--) scene.ghosts[i].setPosition(scene.ghosts[i - 1].x, scene.ghosts[i - 1].y);
      scene.ghosts[0].setPosition(x, gy - z);
    },
    onComplete: function () { scene.afterLanding(shot, outcome, lx, ly); }
  });

  // Fielder chase.
  if (outcome.wicket || outcome.runs > 0) {
    var chasers = scene.fielders.slice().sort(function (a, b) {
      return Math.hypot(a.root.x - lx, a.root.y - ly) - Math.hypot(b.root.x - lx, b.root.y - ly);
    }).slice(0, 2);
    chasers.forEach(function (f, i) {
      scene.tweens.add({ targets: f.root, x: lx + (i * 50 - 25), y: ly + 24, duration: Math.min(900, dur + 100), ease: 'Quad.easeInOut' });
      scene.tweens.add({ targets: f.root, scaleY: 0.94, duration: 140, yoyo: true, repeat: 4 });
    });
  }
};

MatchScene.afterLanding = function (shot, outcome, lx, ly) {
  var scene = this, A = window.gcAudio;
  var near = scene.nearestFielder(lx, ly).f;

  function finish(ms) {
    scene.time.delayedCall(ms || 500, function () { scene.applyOutcome(outcome); });
  }

  if (outcome.how === 'six' || outcome.how === 'four') {
    // Ball sails over the rope and fades.
    var ropeX = GCUtil.clamp(lx + (lx - 360) * 0.35, 30, 690);
    scene.tweens.add({
      targets: scene.ball, x: ropeX, y: ly - 160, alpha: 0, duration: 450, ease: 'Quad.easeOut',
      onComplete: function () { scene.ball.setVisible(false).setAlpha(1); scene.ballShadow.setVisible(false); }
    });
    scene.ghosts.forEach(function (g) { g.setVisible(false); });
    finish(650);
  } else if (outcome.wicket) {
    // Diving catch.
    scene.tweens.add({ targets: near.root, x: lx, y: ly + 10, duration: 220, ease: 'Quad.easeOut' });
    scene.tweens.add({
      targets: near.root, scaleX: 1.45, scaleY: 0.68, duration: 200, delay: 180,
      onStart: function () { scene.dust.explode(10, lx, ly); try { A.diveThud(); } catch (e) {} },
      yoyo: true, onComplete: function () { near.root.setScale(1); }
    });
    scene.tweens.add({ targets: scene.ball, x: lx, y: ly - 40, duration: 260, delay: 200 });
    scene.time.delayedCall(480, function () {
      try { A.catchPop(); A.wicketSting(); A.umpireSay('Out!'); } catch (e) {}
      GCUI.popup(scene, 360, 640, outcome.how === 'caught-behind' ? 'CAUGHT BEHIND!' : 'CAUGHT!', { fontSize: 72, color: '#ff6b6b' });
      scene.ball.setVisible(false); scene.ballShadow.setVisible(false);
      scene.ghosts.forEach(function (g) { g.setVisible(false); });
    });
    finish(1400);
  } else {
    // Grounded: fielder collects, throws back. Run-out drama if scripted.
    scene.tweens.add({ targets: scene.ball, x: near.root.x, y: near.root.y - 30, duration: 280 });
    scene.time.delayedCall(420, function () {
      try { A.throwWhoosh(); } catch (e) {}
      scene.tweens.add({
        targets: scene.ball, x: 360, y: 1070, duration: 380, ease: 'Quad.easeIn',
        onComplete: function () {
          scene.ball.setVisible(false); scene.ballShadow.setVisible(false);
          scene.ghosts.forEach(function (g) { g.setVisible(false); });
          if (outcome.how === 'runout') {
            try { A.wicketSting(); A.umpireSay('Out!'); } catch (e) {}
            GCUI.popup(scene, 360, 700, 'RUN OUT!', { fontSize: 84, color: '#ff6b6b' });
            scene.cameras.main.shake(180, 0.008);
            scene.tweens.add({ targets: scene.stumps, angle: 14, duration: 200, yoyo: true, onComplete: function () { scene.stumps.setAngle(0); } });
          } else { try { A.catchPop(); } catch (e) {} }
        }
      });
    });
    if (outcome.runs > 0) GCUI.popup(scene, lx, ly - 60, '+' + outcome.runs, { fontSize: 56, color: '#fff6e8', hold: 600 });
    finish(1300);
  }
};

MatchScene.applyOutcome = function (o) {
  var scene = this, A = window.gcAudio;
  var legal = true;

  if (scene.isWide) {
    legal = false;
    scene.runs += 1; scene.dots.push('wd');
    GCUI.popup(scene, 360, 700, 'WIDE BALL', { fontSize: 60, color: '#5ad1ff' });
    try { A.umpireWhistle(); A.umpireSay('Wide ball!'); } catch (e) {}
  } else if (scene.isNoBall) {
    legal = false;
    scene.runs += 1; scene.dots.push('nb'); scene.freeHit = true;
    GCUI.popup(scene, 360, 700, 'NO BALL', { fontSize: 60, color: '#5ad1ff' });
    try { A.umpireWhistle(); A.umpireSay('No ball!'); } catch (e) {}
  } else {
    if (scene.freeHit) {
      if (o.wicket && o.how !== 'runout') {
        o = { runs: o.runs, how: o.how, wicket: false };
        GCUI.toast(scene, 'Free hit saves you!', { y: 620, fontSize: 34, color: '#7ddf64' });
      }
      scene.freeHit = false;
    }
    scene.balls++;
    scene.runs += o.runs;
    if (o.wicket) scene.wkts++;
    if (o.how === 'six') scene.sixes++;
    if (o.how === 'four') scene.fours++;
    scene.dots.push(o.wicket ? 'W' : String(o.runs));
  }

  // Time attack combo scoring.
  if (scene.mode === 'time') {
    if (!legal) { scene.taScore += 1; }
    else if (o.wicket || o.runs === 0) { scene.combo = 1; scene.taScore += o.runs; }
    else {
      if (o.runs >= 4) scene.combo = Math.min(5, scene.combo + 1);
      scene.comboBest = Math.max(scene.comboBest, scene.combo);
      scene.taScore += o.runs * scene.combo;
      if (o.runs >= 4) GCUI.popup(scene, 360, 600, 'COMBO x' + scene.combo, { fontSize: 54, color: '#5ad1ff', hold: 600 });
    }
  }

  // Bot banter on big moments.
  if ((o.wicket || o.how === 'six') && Math.random() < 0.4) {
    var line = GCUtil.pick(scene.bot.banter[o.wicket ? 'wicket' : 'six']);
    GCUI.toast(scene, scene.bot.name + ': ' + line, { y: 560, fontSize: 28, hold: 1300 });
  }

  scene.updateHUD();

  var done = false;
  if (scene.mode !== 'time') {
    done = scene.balls >= GCConfig.superOver.balls || scene.wkts >= 2 || (scene.target > 0 && scene.runs >= scene.target);
  }
  if (done) {
    scene.phase = 'done';
    scene.time.delayedCall(1500, function () { scene.endInnings(); });
  } else {
    scene.resetForNextBall();
  }
};

MatchScene.currentGap = function () {
  var c = GCConfig.timeAttack;
  var elapsed = c.duration - this.timeLeft;
  return c.baseGap + (c.minGap - c.baseGap) * Math.min(1, elapsed / c.duration);
};

MatchScene.resetForNextBall = function () {
  var scene = this;
  scene.phase = 'between';
  scene.ball.setVisible(false); scene.ballShadow.setVisible(false);
  scene.ghosts.forEach(function (g) { g.setVisible(false); });
  scene.holding = false;
  // Glide everyone home — no popping.
  scene.tweens.add({ targets: scene.bowler.root, x: 360, y: 190, duration: 450, ease: 'Quad.easeInOut' });
  scene.batter.bat.setAngle(-24); scene.batter.armF.setAngle(0);
  scene.batter.root.setScale(1);
  scene.fielders.forEach(function (f, i) {
    scene.tweens.add({ targets: f.root, x: f.home.x, y: f.home.y, duration: 500 + i * 40, ease: 'Quad.easeInOut' });
  });
  var gap = scene.mode === 'time' ? scene.currentGap() : 1150;
  scene.time.delayedCall(gap, function () { scene.startBall(); });
};

MatchScene.endInnings = function () {
  var scene = this, A = window.gcAudio;
  if (scene.phase === 'result') return;
  scene.phase = 'result';
  var won = scene.mode === 'time' ? true : scene.runs >= scene.target;
  var data = {
    mode: scene.mode, won: won,
    runs: scene.mode === 'time' ? scene.taScore : scene.runs,
    balls: scene.balls, sixes: scene.sixes, fours: scene.fours,
    target: scene.target, botId: scene.bot.id, cupRound: scene.cupRound,
    comboBest: scene.comboBest,
    cupWon: scene.mode === 'cup' && won && scene.cupRound === 2
  };
  try { A.stopGroove(); } catch (e) {}
  scene.cameras.main.fadeOut(320, 11, 7, 22);
  scene.time.delayedCall(340, function () { scene.scene.start('Result', data); });
};

MatchScene.togglePause = function () {
  var scene = this;
  if (scene.phase === 'done' || scene.phase === 'result' || scene.phase === 'intro') return;
  scene.paused = !scene.paused;
  if (scene.paused) {
    var dim = GCUI.dim(scene, 0.78).setDepth(200);
    var p = GCUI.panel(scene, 360, 640, 520, 560, { depth: 201 });
    var t = scene.add.text(360, 430, 'PAUSED', { fontFamily: 'Arial, sans-serif', fontSize: '56px', fontStyle: 'bold', color: '#ffd75a' }).setOrigin(0.5).setDepth(202);
    var r = GCUI.button(scene, 360, 600, 380, 'RESUME', { fontSize: 36, depth: 202, onClick: function () { scene.togglePause(); } });
    var q = GCUI.button(scene, 360, 730, 380, 'QUIT TO MENU', { fontSize: 32, depth: 202, bg: 0x3a2a55, onClick: function () {
      try { if (window.gcAudio) { window.gcAudio.stopGroove(); window.gcAudio.stopCrowd(); } } catch (e) {}
      scene.scene.start('Menu');
    } });
    scene.pauseOverlay = scene.add.container(0, 0).setDepth(200);
    scene.pauseOverlay.add([dim, p, t, r, q]);
    GCUI.showOverlay(scene.pauseOverlay, scene);
  } else if (scene.pauseOverlay) {
    var ov = scene.pauseOverlay; scene.pauseOverlay = null;
    scene.tweens.add({ targets: ov, alpha: 0, duration: 150, onComplete: function () { ov.destroy(); } });
    if (scene.phase === 'between') scene.startBall();
  }
};

/* ---------------- Per-frame ---------------- */

MatchScene.update = function (time, delta) {
  var scene = this;
  if (scene.gali) GCArt.updateGali(scene.gali, time, delta);
  if (!scene.batter) return;
  // Idle bob between balls.
  if (scene.phase === 'between' || scene.phase === 'intro') {
    scene.batter.root.y = 985 + Math.sin(time / 480) * 4;
  }
  if (scene.paused) return;

  // Time attack clock.
  if (scene.mode === 'time' && scene.phase !== 'done' && scene.phase !== 'result' && scene.phase !== 'intro') {
    scene.timeLeft -= delta / 1000;
    if (scene.timeLeft <= 0) { scene.timeLeft = 0; scene.updateHUD(); scene.endInnings(); return; }
  }

  // Power meter.
  if (scene.holding) {
    var pw = scene.powerFor(time - scene.holdStart);
    scene.powerFill.clear();
    scene.powerFill.fillStyle(pw > 0.85 ? 0xff5a5a : 0xffd75a, 1);
    scene.powerFill.fillRoundedRect(160, 1130 + (scene.OY || 0), Math.max(8, 400 * pw), 30, 15);
  }

  // Ball flight toward the bat.
  if (scene.phase === 'bowling') {
    var p = (time - scene.releaseT) / scene.travel;
    if (p >= 1.25 && !scene.swung) {
      if (scene.holding) { scene.doSwing(360); } // forced very-late release
      else {
        scene.swung = true;
        scene.ai.update(400);
        scene.ballMissed({ grade: 'miss' }, scene.curDelivery);
      }
      return;
    }
    var pc = Math.min(p, 1.15);
    var D = scene.curDelivery;
    var gx = 360 + (D.curve || 0) * Math.sin(Math.PI * Math.min(pc, 1));
    if (scene.curKey === 'doosra' && pc > 0.7) gx += scene.jinkDir * 36 * ((pc - 0.7) / 0.3);
    if (scene.isWide) gx = 360 + scene.wideDir * (60 + 110 * Math.min(1, pc * 1.2));
    var gy = 400 + (960 - 400) * Math.pow(Math.min(pc, 1), 0.94);
    var peaks = { yorker: 16, bouncer: 150, slower: 70, inswing: 55, outswing: 55, doosra: 60 };
    var z = (peaks[scene.curKey] || 55) * Math.sin(Math.PI * Math.min(pc, 1));
    scene.ball.setPosition(gx, gy - z).setScale(1 + z / 500);
    scene.ballShadow.setPosition(gx, Math.min(gy, 1120)).setAlpha(Math.max(0.08, 0.35 - z / 900));
    // Release-timing cue ring: shrinks onto the crease as the ball arrives.
    if (p > 0.70 && p < 1.12 && !scene.swung) {
      scene.cueRing.setVisible(true);
      scene.cueRing.setRadius(12 + 80 * (1.12 - p) / 0.42);
    } else scene.cueRing.setVisible(false);
    scene.ghostT += delta;
    if (scene.ghostT > 50) {
      scene.ghostT = 0;
      for (var i = scene.ghosts.length - 1; i > 0; i--) scene.ghosts[i].setPosition(scene.ghosts[i - 1].x, scene.ghosts[i - 1].y);
      scene.ghosts[0].setPosition(gx, gy - z);
      scene.ghosts.forEach(function (g) { g.setVisible(true); });
    }
  }

  // HUD refresh ~4Hz (clock + combo).
  scene.hudT = (scene.hudT || 0) + delta;
  if (scene.hudT > 250) { scene.hudT = 0; scene.updateHUD(); }
};
