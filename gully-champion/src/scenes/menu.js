/* GULLY CHAMPION — Menu scene: mode select, galli/bats/stats, cup bracket. */
var MenuScene = new Phaser.Scene('Menu');

function menuGetBot(id) {
  for (var i = 0; i < GCConfig.bots.length; i++) if (GCConfig.bots[i].id === id) return GCConfig.bots[i];
  return GCConfig.bots[0];
}
function menuUnlockDesc(u) {
  if (!u || u.type === 'default') return 'Unlocked';
  if (u.type === 'cupWins') return 'Win ' + u.value + ' cup match' + (u.value > 1 ? 'es' : '');
  if (u.type === 'cups') return 'Win the Mohalla Cup';
  if (u.type === 'runs') return 'Score ' + u.value + ' career runs';
  if (u.type === 'sixes') return 'Hit ' + u.value + ' career sixes';
  return '';
}

MenuScene.create = function () {
  var scene = this;
  var OY = (GCConfig.H - GCConfig.DH) / 2;
  // Center the 720x1280 design space on taller canvases (full-bleed, no bars).
  scene.cameras.main.setScroll(0, -OY);
  scene.gali = GCArt.makeGali(scene, GCSave.data.gali || 'rooftop');
  if (window.gcAudio) { try { window.gcAudio.setMuted(!!GCSave.data.muted); window.gcAudio.startCrowd(); } catch (e) {} }

  // Title block.
  var t1 = scene.add.text(360, 150, 'GULLY', { fontFamily: 'Arial, sans-serif', fontSize: '124px', fontStyle: 'bold', color: '#ffd75a', stroke: '#3a1c4d', strokeThickness: 14 }).setOrigin(0.5);
  var t2 = scene.add.text(360, 268, 'CHAMPION', { fontFamily: 'Arial, sans-serif', fontSize: '92px', fontStyle: 'bold', color: '#fff6e8', stroke: '#3a1c4d', strokeThickness: 12 }).setOrigin(0.5);
  t1.setShadow(0, 6, '#3a1c4d', 18, true, true);
  t2.setShadow(0, 6, '#3a1c4d', 18, true, true);
  scene.add.text(360, 372, 'Tape-ball street cricket', { fontFamily: 'Arial, sans-serif', fontSize: '34px', fontStyle: 'italic', color: '#ffd9a0' }).setOrigin(0.5);
  scene.bestChip = scene.add.text(360, 438, '', { fontFamily: 'Arial, sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#241a38', backgroundColor: '#ffca7a', padding: { x: 18, y: 8 } }).setOrigin(0.5);
  scene.refreshBest = function () {
    scene.bestChip.setText('CAREER BEST  ' + GCSave.data.best + '      TIME ATTACK  ' + GCSave.data.taBest);
  };
  scene.refreshBest();

  // Mode buttons.
  var modes = [
    { label: 'SUPER OVER', sub: '6 balls. Chase the target.', y: 590 },
    { label: 'MOHALLA CUP', sub: 'Street tournament. 8 teams.', y: 726 },
    { label: 'TIME ATTACK', sub: '60 seconds. Endless bowling.', y: 862 }
  ];
  modes.forEach(function (m) {
    var b = GCUI.button(scene, 360, m.y, 470, m.label, { fontSize: 42, onClick: function () { scene.onMode(m.label); } });
    scene.add.text(360, m.y + 40, m.sub, { fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#ffd9a0' }).setOrigin(0.5).setDepth(101);
  });

  // Bottom row (anchored to the bottom edge on tall phones).
  var rowY = 1020 + OY;
  scene.galiBtn = GCUI.button(scene, 110, rowY, 168, 'GALI', { fontSize: 30, height: 92, onClick: function () { scene.openGalis(); } });
  GCUI.button(scene, 300, rowY, 168, 'BATS', { fontSize: 30, height: 92, onClick: function () { scene.openBats(); } });
  GCUI.button(scene, 490, rowY, 168, 'STATS', { fontSize: 30, height: 92, onClick: function () { scene.openStats(); } });
  scene.soundBtn = GCUI.button(scene, 650, rowY, 100, GCSave.data.muted ? 'OFF' : 'ON', { fontSize: 28, height: 92, onClick: function () {
    var m = window.gcAudio ? window.gcAudio.toggleMuted() : !GCSave.data.muted;
    GCSave.setMuted(m);
    scene.soundBtn.list[2].setText(m ? 'OFF' : 'ON');
  } });
  scene.add.text(650, rowY - 62, 'SOUND', { fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#ffd9a0' }).setOrigin(0.5);

  scene.add.text(360, 1210 + OY, 'One thumb. One over. Mohalla legend.', { fontFamily: 'Arial, sans-serif', fontSize: '24px', fontStyle: 'italic', color: '#ffd9a0' }).setOrigin(0.5);

  scene.activeOverlay = null;
  scene.cameras.main.fadeIn(250, 11, 7, 22);
};

MenuScene.update = function (time, delta) {
  if (this.gali) GCArt.updateGali(this.gali, time, delta);
};

MenuScene.closeOverlays = function () {
  if (this.activeOverlay) { this.activeOverlay.destroy(); this.activeOverlay = null; }
};

MenuScene.shell = function (title, h) {
  var scene = this;
  scene.closeOverlays();
  h = h || 900;
  var dim = GCUI.dim(scene);
  dim.setDepth(94);
  var c = scene.add.container(360, 640).setDepth(95);
  var p = GCUI.panel(scene, 0, 0, 620, h, { depth: 96 });
  var titleT = scene.add.text(0, -h / 2 + 60, title, { fontFamily: 'Arial, sans-serif', fontSize: '44px', fontStyle: 'bold', color: '#ffd75a' }).setOrigin(0.5);
  var close = GCUI.button(scene, 250, -h / 2 + 60, 90, 'X', { fontSize: 34, height: 70, onClick: function () { scene.closeOverlays(); } });
  c.add([p, titleT, close]);
  var wrap = scene.add.container(0, 0).setDepth(94);
  wrap.add([dim, c]);
  scene.activeOverlay = wrap;
  GCUI.showOverlay(wrap, scene);
  return c;
};

// ---------- Gali select ----------
MenuScene.openGalis = function () {
  var scene = this;
  var c = scene.shell('CHOOSE YOUR GALI', 940);
  var unlocked = GCSave.unlockedGallies();
  GCArt.GALLIS.forEach(function (g, i) {
    var y = -300 + i * 165;
    var isU = unlocked.indexOf(g.id) >= 0;
    var card = GCUI.panel(scene, 0, y, 540, 140, { depth: 97, fill: GCSave.data.gali === g.id ? 0x4a2c5a : 0x241a38 });
    var nm = scene.add.text(-240, -38, g.name, { fontFamily: 'Arial, sans-serif', fontSize: '34px', fontStyle: 'bold', color: isU ? '#fff6e8' : '#8a7a9e' }).setOrigin(0, 0.5);
    var ds = scene.add.text(-240, 8, isU ? g.desc : 'Locked — ' + menuUnlockDesc(g.unlock), { fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#ffd9a0', wordWrap: { width: 480 } }).setOrigin(0, 0.5);
    card.add([nm, ds]);
    if (isU) {
      card.setSize(540, 140).setInteractive({ useHandCursor: true });
      card.on('pointerup', function () {
        GCSave.setGali(g.id);
        try { if (window.gcAudio) window.gcAudio.startGroove(g.id); } catch (e) {}
        scene.scene.restart();
      });
    }
    c.add(card);
  });
};

// ---------- Bat collection ----------
MenuScene.openBats = function () {
  var scene = this;
  var c = scene.shell('BAT COLLECTION', 940);
  var unlocked = GCSave.unlockedBats();
  GCArt.BATS.forEach(function (b, i) {
    var col = i % 2, row = Math.floor(i / 2);
    var x = -145 + col * 290, y = -260 + row * 200;
    var isU = unlocked.indexOf(i) >= 0;
    var card = GCUI.panel(scene, x, y, 270, 175, { depth: 97, fill: GCSave.data.bat === i ? 0x4a2c5a : 0x241a38 });
    var nm = scene.add.text(0, -58, b.name, { fontFamily: 'Arial, sans-serif', fontSize: '26px', fontStyle: 'bold', color: isU ? '#fff6e8' : '#8a7a9e', align: 'center', wordWrap: { width: 240 } }).setOrigin(0.5);
    var ds = scene.add.text(0, 22, isU ? b.desc : 'Locked\n' + menuUnlockDesc(b.unlock), { fontFamily: 'Arial, sans-serif', fontSize: '21px', color: '#ffd9a0', align: 'center', wordWrap: { width: 240 } }).setOrigin(0.5);
    card.add([nm, ds]);
    if (GCSave.data.bat === i) {
      var eq = scene.add.text(0, 66, 'EQUIPPED', { fontFamily: 'Arial, sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#7ddf64' }).setOrigin(0.5);
      card.add(eq);
    }
    if (isU && GCSave.data.bat !== i) {
      card.setSize(270, 175).setInteractive({ useHandCursor: true });
      card.on('pointerup', function () { GCSave.setBat(i); scene.openBats(); });
    }
    c.add(card);
  });
};

// ---------- Stats ----------
MenuScene.openStats = function () {
  var scene = this;
  var c = scene.shell('CAREER STATS', 940);
  var d = GCSave.data;
  var rows = [
    ['Matches', d.matches], ['Wins', d.wins], ['Runs', d.runs], ['Balls', d.balls],
    ['Sixes', d.sixes], ['Fours', d.fours], ['Best (chase)', d.best],
    ['Time Attack best', d.taBest], ['Cup matches won', d.cupWins], ['Cups won', d.cups]
  ];
  rows.forEach(function (r, i) {
    var y = -300 + i * 72;
    var k = scene.add.text(-240, y, r[0], { fontFamily: 'Arial, sans-serif', fontSize: '30px', color: '#ffd9a0' }).setOrigin(0, 0.5);
    var v = scene.add.text(240, y, String(r[1]), { fontFamily: 'Arial, sans-serif', fontSize: '32px', fontStyle: 'bold', color: '#fff6e8' }).setOrigin(1, 0.5);
    c.add([k, v]);
  });
};

// ---------- Cup bracket ----------
var BOT_STRENGTH = { chintu: 0, yorker: 3, bilal: 4, sultan: 5, daniyal: 6, shahid: 7, tariq: 8, badshah: 10 };
function simWinner(a, b) {
  var p = 0.5 + 0.09 * ((BOT_STRENGTH[a] || 0) - (BOT_STRENGTH[b] || 0));
  p = Math.max(0.12, Math.min(0.88, p));
  return Math.random() < p ? a : b;
}
MenuScene.buildCup = function () {
  // Fixed draw, Badshah seeded opposite half. Player always opens vs Chintu.
  var qf2 = simWinner('yorker', 'bilal');
  var qf3 = simWinner('shahid', 'daniyal');
  var qf4 = simWinner('sultan', 'badshah');
  var sf2 = simWinner(qf3, qf4);
  window.gcCup = {
    round: 0,
    rounds: ['Quarter Final', 'Semi Final', 'Final'],
    opponents: ['chintu', qf2, sf2],
    bracket: [['YOU', 'chintu'], ['yorker', 'bilal'], ['shahid', 'daniyal'], ['sultan', 'badshah']],
    winners: { qf: ['YOU?', qf2, qf3, qf4], sf: [] }
  };
};
MenuScene.openCup = function () {
  var scene = this;
  scene.buildCup();
  var cup = window.gcCup;
  var c = scene.shell('MOHALLA CUP', 1000);
  var nameOf = function (id) { return id === 'YOU?' ? 'YOU' : (id === 'YOU' ? 'YOU' : menuGetBot(id).name.toUpperCase()); };
  var cols = ['QUARTER', 'SEMI', 'FINAL'];
  cols.forEach(function (col, ci) {
    var x = -190 + ci * 190;
    var h = scene.add.text(x, -400, col, { fontFamily: 'Arial, sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#ffca7a' }).setOrigin(0.5);
    c.add(h);
  });
  // QF column.
  cup.bracket.forEach(function (m, i) {
    var y = -320 + i * 130;
    [0, 1].forEach(function (k) {
      var id = m[k];
      var isYou = id === 'YOU';
      var t = scene.add.text(-190, y + k * 44, (isYou ? 'YOU' : menuGetBot(id).name), {
        fontFamily: 'Arial, sans-serif', fontSize: '24px', fontStyle: isYou ? 'bold' : 'normal',
        color: isYou ? '#ffd75a' : '#fff6e8', backgroundColor: isYou ? '#4a2c5a' : '#241a38',
        padding: { x: 10, y: 6 }
      }).setOrigin(0.5);
      c.add(t);
    });
  });
  // SF / F: player's path + simulated others.
  var sfY = [-255, -65];
  var sfTeams = [['YOU?', cup.winners.qf[1]], [cup.winners.qf[2], cup.winners.qf[3]]];
  sfTeams.forEach(function (m, i) {
    m.forEach(function (id, k) {
      var t = scene.add.text(0, sfY[i] + k * 44, nameOf(id), { fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#cfc0e0', backgroundColor: '#241a38', padding: { x: 10, y: 6 } }).setOrigin(0.5);
      c.add(t);
    });
  });
  var fT = scene.add.text(190, -160, 'FINAL', { fontFamily: 'Arial, sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#ffca7a' }).setOrigin(0.5);
  var f1 = scene.add.text(190, -110, 'YOU?', { fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#cfc0e0', backgroundColor: '#241a38', padding: { x: 10, y: 6 } }).setOrigin(0.5);
  var f2 = scene.add.text(190, -66, nameOf(cup.opponents[2]), { fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#cfc0e0', backgroundColor: '#241a38', padding: { x: 10, y: 6 } }).setOrigin(0.5);
  c.add([fT, f1, f2]);
  var note = scene.add.text(0, 330, 'Win 3 matches to lift the cup.\nFinal: ' + menuGetBot(cup.opponents[2]).name + ' awaits...', {
    fontFamily: 'Arial, sans-serif', fontSize: '26px', color: '#ffd9a0', align: 'center'
  }).setOrigin(0.5);
  c.add(note);
  var play = GCUI.button(scene, 0, 430, 420, 'START CUP', { fontSize: 40, depth: 97, onClick: function () {
    scene.startCupMatch();
  } });
  c.add(play);
};
MenuScene.startCupMatch = function () {
  var cup = window.gcCup;
  var botId = cup.opponents[cup.round];
  this.scene.start('Match', { mode: 'cup', botId: botId, cupRound: cup.round, galiId: GCSave.data.gali });
};

// ---------- Mode entry ----------
MenuScene.onMode = function (label) {
  var scene = this;
  if (window.gcAudio) { try { window.gcAudio.stopCrowd(); } catch (e) {} }
  if (label === 'SUPER OVER') {
    // Tez Tariq sets the target.
    var target = GClogic.simTarget(Math.random, 0.75);
    scene.scene.start('Match', { mode: 'over', botId: 'tariq', target: target, galiId: GCSave.data.gali });
  } else if (label === 'MOHALLA CUP') {
    scene.openCup();
  } else if (label === 'TIME ATTACK') {
    scene.scene.start('Match', { mode: 'time', botId: 'tariq', galiId: GCSave.data.gali });
  }
};
