/* GULLY CHAMPION — Result scene: banner, stats, share card, next steps. */
var ResultScene = new Phaser.Scene('Result');

// data: {mode:'over'|'cup'|'time', won, runs, balls, sixes, fours, target, botId, cupRound, cupWon, comboBest}
ResultScene.create = function (data) {
  var scene = this;
  var OY = (GCConfig.H - GCConfig.DH) / 2;
  // Center the 720x1280 design space on taller canvases (full-bleed, no bars).
  scene.cameras.main.setScroll(0, -OY);
  scene.gali = GCArt.makeGali(scene, GCSave.data.gali || 'rooftop');
  var A = window.gcAudio;

  var bot = GCUtil.getBot(data.botId);
  var headline, sub;
  if (data.mode === 'cup' && data.cupWon) { headline = 'CUP WON!'; sub = 'The mohalla bows to you.'; }
  else if (data.mode === 'time') { headline = 'TIME UP!'; sub = data.runs + ' runs in 60 seconds.'; }
  else if (data.won) { headline = 'VICTORY!'; sub = 'Target ' + data.target + ' chased down!'; }
  else { headline = 'DEFEAT'; sub = bot.name + ' takes this one.'; }

  var col = data.won || data.mode === 'time' ? '#ffd75a' : '#ff8a8a';
  var h = scene.add.text(360, 240, headline, {
    fontFamily: 'Arial, sans-serif', fontSize: '110px', fontStyle: 'bold', color: col,
    stroke: '#241a38', strokeThickness: 14
  }).setOrigin(0.5).setScale(0.4);
  scene.tweens.add({ targets: h, scaleX: 1, scaleY: 1, duration: 450, ease: 'Back.easeOut' });
  scene.add.text(360, 335, sub, { fontFamily: 'Arial, sans-serif', fontSize: '32px', fontStyle: 'italic', color: '#ffd9a0', align: 'center' }).setOrigin(0.5);

  if (data.won || data.cupWon) {
    try { A.cupWinFanfare(); A.swellCrowd(1, 2500); GCArt.crowdCelebrate(scene.gali, true); } catch (e) {}
  }

  // Score panel.
  var p = GCUI.panel(scene, 360, 600, 560, 340, {});
  var rows = [
    ['Score', data.runs + (data.balls !== undefined ? '  (' + GCUtil.fmtOvers(data.balls) + ' ov)' : '')],
    ['Sixes', data.sixes], ['Fours', data.fours]
  ];
  if (data.mode !== 'time') rows.push(['Target', data.target]);
  if (data.mode === 'time') rows.push(['Best combo', 'x' + (data.comboBest || 1)]);
  rows.forEach(function (r, i) {
    var y = 500 + i * 72;
    p.add(scene.add.text(-220, y - 600, r[0], { fontFamily: 'Arial, sans-serif', fontSize: '32px', color: '#ffd9a0' }).setOrigin(0, 0.5));
    p.add(scene.add.text(220, y - 600, String(r[1]), { fontFamily: 'Arial, sans-serif', fontSize: '36px', fontStyle: 'bold', color: '#fff6e8' }).setOrigin(1, 0.5));
  });

  // Record + unlocks.
  var rec = GCSave.recordMatch({
    runs: data.runs, balls: data.balls || 0, sixes: data.sixes || 0, fours: data.fours || 0,
    won: !!data.won, mode: data.mode,
    cupRoundWon: data.mode === 'cup' && data.won,
    cupWon: !!(data.mode === 'cup' && data.cupWon)
  });
  var uy = 830;
  if (rec.newBest) {
    scene.add.text(360, uy, 'NEW BEST!', { fontFamily: 'Arial, sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#7ddf64', stroke: '#241a38', strokeThickness: 8 }).setOrigin(0.5);
    uy += 56;
  }
  rec.newUnlocks.forEach(function (u) {
    var parts = u.split(':');
    var label = parts[0] === 'gali'
      ? 'New gali: ' + GCArt.GALLIS.filter(function (g) { return g.id === parts[1]; })[0].name
      : 'New bat: ' + GCArt.BATS[parseInt(parts[1], 10)].name;
    GCUI.toast(scene, 'UNLOCKED — ' + label, { y: uy, fontSize: 30, color: '#ffd75a', hold: 2200 });
    uy += 60;
  });

  // Buttons: bottom-anchored on tall phones; all inside the 1280 design space.
  var by = 985 + OY;
  GCUI.button(scene, 360, by, 440, 'SHARE CARD', { fontSize: 38, onClick: function () { scene.shareCard(data); } });
  if (data.mode === 'cup' && data.won && !data.cupWon) {
    var nextOpp = window.gcCup ? window.gcCup.opponents[window.gcCup.round + 1] : null;
    var nl = nextOpp ? 'NEXT: ' + GCUtil.getBot(nextOpp).name.toUpperCase() : 'NEXT MATCH';
    GCUI.button(scene, 360, by + 120, 440, nl, { fontSize: 34, onClick: function () {
      window.gcCup.round++;
      scene.scene.start('Match', { mode: 'cup', botId: window.gcCup.opponents[window.gcCup.round], cupRound: window.gcCup.round, galiId: GCSave.data.gali });
    } });
  } else {
    GCUI.button(scene, 360, by + 120, 440, 'PLAY AGAIN', { fontSize: 38, onClick: function () { scene.replay(data); } });
  }
  GCUI.button(scene, 360, by + 240, 440, 'MENU', { fontSize: 34, bg: 0x3a2a55, onClick: function () {
    try { if (window.gcAudio) window.gcAudio.stopGroove(); } catch (e) {}
    scene.scene.start('Menu');
  } });

  scene.cameras.main.fadeIn(250, 11, 7, 22);
};

ResultScene.replay = function (data) {
  var s = { mode: data.mode, botId: data.botId, galiId: GCSave.data.gali };
  if (data.mode === 'over') s.target = GClogic.simTarget(Math.random, 0.75);
  if (data.mode === 'cup' && window.gcCup) { s.cupRound = window.gcCup.round; }
  try { if (window.gcAudio) window.gcAudio.stopGroove(); } catch (e) {}
  this.scene.start('Match', s);
};

// Screenshot-worthy share card -> downloads a PNG (works offline).
ResultScene.shareCard = function (data) {
  try {
    var cv = document.createElement('canvas');
    cv.width = 600; cv.height = 900;
    var x = cv.getContext('2d');
    var gr = x.createLinearGradient(0, 0, 0, 900);
    gr.addColorStop(0, '#2b1a4d'); gr.addColorStop(0.55, '#b3477f'); gr.addColorStop(1, '#ff9a5a');
    x.fillStyle = gr; x.fillRect(0, 0, 600, 900);
    // confetti dots
    var cols = ['#ffd75a', '#7ddf64', '#5ad1ff', '#ff8a5a', '#fff6e8'];
    for (var i = 0; i < 90; i++) {
      x.fillStyle = cols[i % cols.length]; x.globalAlpha = 0.8;
      x.fillRect(Math.random() * 600, Math.random() * 900, 10, 14);
    }
    x.globalAlpha = 1;
    x.textAlign = 'center';
    x.fillStyle = '#ffd75a'; x.font = 'bold 64px Arial';
    x.fillText('GULLY CHAMPION', 300, 120);
    x.fillStyle = '#fff6e8'; x.font = 'italic 30px Arial';
    var modeName = data.mode === 'over' ? 'SUPER OVER' : (data.mode === 'cup' ? 'MOHALLA CUP' : 'TIME ATTACK');
    x.fillText(modeName, 300, 170);
    x.font = 'bold 150px Arial'; x.fillStyle = '#ffffff';
    x.fillText(String(data.runs), 300, 360);
    x.font = 'bold 36px Arial'; x.fillStyle = '#ffd9a0';
    x.fillText('RUNS', 300, 410);
    x.font = '34px Arial'; x.fillStyle = '#fff6e8';
    x.fillText('Sixes ' + data.sixes + '    Fours ' + data.fours, 300, 500);
    if (data.mode !== 'time') x.fillText('Target ' + data.target, 300, 560);
    x.font = 'italic 28px Arial'; x.fillStyle = '#ffd9a0';
    x.fillText('One thumb. One over. Mohalla legend.', 300, 800);
    var a = document.createElement('a');
    a.download = 'gully-champion-' + data.runs + '.png';
    a.href = cv.toDataURL('image/png');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    GCUI.toast(this, 'Card saved — share it!', { y: 480 });
  } catch (e) {
    GCUI.toast(this, 'Could not save the card here.', { y: 480 });
  }
};

ResultScene.update = function (time, delta) {
  if (this.gali) GCArt.updateGali(this.gali, time, delta);
};
