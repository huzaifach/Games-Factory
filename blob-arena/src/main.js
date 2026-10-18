/* ============================================================
   BLOB ARENA — main.js
   Boot, staged loading, screen state machine, event routing
   (sim → audio/UI/shake/hit-pause), fixed-timestep loop,
   localStorage persistence (crowns, legend, mute, career best).
   ============================================================ */
'use strict';

(function () {
  /* --------------------------- persistence --------------------------- */
  var SAVE_KEY = 'blobarena.v1';
  var save = { crowns: 0, legend: false, muted: false, wins: 0, biggest: 0 };
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (raw) { var s = JSON.parse(raw); for (var k in save) if (s[k] !== undefined) save[k] = s[k]; }
  } catch (e) { /* storage unavailable — play session-only */ }
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }

  /* ------------------------------ modules ------------------------------ */
  var canvas = document.getElementById('game');
  var renderer = makeRenderer(canvas);
  var ctx = renderer.ctx;
  var ui = makeUI();
  var input = makeInput(canvas, ui);
  var audio = makeAudio();

  var meta = {
    get crowns() { return save.crowns; },
    get legend() { return save.legend; },
    get muted() { return save.muted; },
    best: { wins: save.wins, biggest: save.biggest }
  };

  var sim = null, emit = [];
  var shakeMag = 0, freezeT = 0;
  var shake = { x: 0, y: 0 };
  var lastT = 0, acc = 0;
  var STEP = 1 / 60;

  function newRound() {
    emit = [];
    sim = makeSim((Date.now() ^ (Math.random() * 1e9)) | 0, emit);
    sim.player.crown = save.crowns > 0;
    input.enabled = false;
    ui.setScreen('countdown');
  }

  /* ---------------------------- event routing ---------------------------- */
  function routeEvents() {
    for (var i = 0; i < emit.length; i++) {
      var e = emit[i];
      switch (e.t) {
        case 'pellet':
          audio.pop(e.combo);
          break;
        case 'combo':
          ui.banner('COMBO x' + e.n + '!', 'delicious streak');
          break;
        case 'eat':
          audio.gulp(e.big);
          if (e.big) { shakeMag = Math.max(shakeMag, 0.55); freezeT = Math.max(freezeT, 0.06); }
          if (e.playerInvolved) { shakeMag = Math.max(shakeMag, 1); freezeT = Math.max(freezeT, 0.12); }
          break;
        case 'playerDeath':
          ui.deadInfo = { by: e.by, byColor: e.byColor };
          audio.thud();
          shakeMag = 1.2; freezeT = Math.max(freezeT, 0.15);
          break;
        case 'milestone':
          ui.banner(e.text, 'you are growing strong');
          audio.fanfare();
          break;
        case 'storm':
          ui.banner('THE STORM', 'swim to the center — now!');
          audio.stormStart();
          break;
        case 'finalcount':
          ui.banner('10 SECONDS', 'fight for the crown!');
          break;
        case 'dash':
          audio.dash();
          shakeMag = Math.max(shakeMag, e.player ? 0.35 : 0.12);
          break;
        case 'end':
          onRoundEnd(e);
          break;
      }
    }
    emit.length = 0;
  }

  function onRoundEnd(e) {
    audio.whistle();
    audio.stormStop();
    input.enabled = false;
    var all = sim.blobs.slice().sort(function (a, b) { return b.mass - a.mass; });
    var standings = all.map(function (b) {
      return { name: b.name, color: b.color, r: b.biggest, isPlayer: b.isPlayer };
    });
    var p = sim.player;
    var playerWon = e.playerWon;
    var crownEarned = false;
    if (playerWon) {
      save.wins++;
      if (!save.legend) {
        save.crowns = Math.min(save.crowns + 1, 3);
        crownEarned = true;
        if (save.crowns >= 3) save.legend = true;
      }
      audio.crownJingle();
      ui.banner('VICTORY!', save.legend ? 'you are an ARENA LEGEND' : 'crown earned!');
    }
    save.biggest = Math.max(save.biggest, Math.round(p.biggest));
    persist();
    meta.best = { wins: save.wins, biggest: save.biggest };
    ui.results = {
      playerWon: playerWon,
      winner: e.winner, winnerColor: e.winnerColor,
      crownEarned: crownEarned,
      standings: standings,
      stats: { eaten: p.eaten, kills: p.kills, biggest: p.biggest }
    };
    ui.setScreen('results');
  }

  /* ------------------------------ buttons ------------------------------ */
  input.onButton = function (id) {
    audio.resume();
    if (id === 'start') {
      audio.init();
      audio.setMuted(save.muted);
      audio.click();
      newRound();
    } else if (id === 'retry') {
      audio.click();
      runLoading();
    } else if (id === 'respawn') {
      audio.click();
      if (sim) { sim.respawnPlayer(); ui.deadInfo = null; }
    } else if (id === 'again') {
      audio.click();
      newRound();
    } else if (id === 'title2') {
      audio.click();
      ui.setScreen('title');
    } else if (id === 'mute') {
      save.muted = !save.muted;
      persist();
      audio.setMuted(save.muted);
      audio.click();
    }
  };

  /* --------------------------- staged loading --------------------------- */
  var loadStages = [
    { pct: 22, msg: 'Waking the plankton…', fn: function () { /* renderer built at boot */ } },
    { pct: 52, msg: 'Seeding the arena…', fn: function () {
        emit = [];
        sim = makeSim(1337, emit);   /* warm-up world behind the title */
        sim.ambient = true;          /* world lives, timer frozen */
        sim.player.crown = save.crowns > 0;
      } },
    { pct: 78, msg: 'Tuning the orchestra…', fn: function () { audio.setMuted(save.muted); } },
    { pct: 100, msg: 'Ready!', fn: function () {} }
  ];

  function runLoading() {
    ui.setScreen('loading');
    ui.loadError = null;
    ui.loadPct = 0;
    var si = 0;
    function step() {
      if (si >= loadStages.length) {
        ui.setScreen('title');
        return;
      }
      var st = loadStages[si];
      ui.loadMsg = st.msg;
      /* let the loading screen paint before the heavy step */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          try {
            st.fn();
          } catch (err) {
            ui.loadError = 'Something went wrong while loading.';
            ui.loadPct = st.pct;
            return;  /* honest TRY AGAIN button is drawn by the UI */
          }
          ui.loadPct = st.pct;
          si++;
          setTimeout(step, 120);
        });
      });
    }
    step();
  }

  /* -------------------------------- loop -------------------------------- */
  function frame(now) {
    requestAnimationFrame(frame);
    var dtReal = Math.min((now - lastT) / 1000 || 0.016, 0.1);
    lastT = now;
    var time = now / 1000;

    /* hit-pause: freeze the world, keep rendering */
    if (freezeT > 0) {
      freezeT -= dtReal;
      dtReal = 0;
    }

    /* countdown */
    if (ui.screen === 'countdown' && sim) {
      ui.countdownT += dtReal;
      var n = 3 - Math.floor(ui.countdownT);
      if (n !== ui.countdownN && n >= 0) {
        ui.countdownN = n;
        audio.countBeep(n === 0);
      }
      if (ui.countdownT >= 3.4) {
        ui.setScreen('play');
        input.enabled = true;
      }
    }

    /* fixed-step simulation */
    if (sim && ui.screen === 'play' && dtReal > 0) {
      input.update();
      acc += dtReal;
      var iter = 0;
      while (acc >= STEP && iter < 4) {
        sim.update(STEP, {
          dx: input.dx, dy: input.dy,
          dash: input.consumeDash()
        });
        acc -= STEP;
        iter++;
      }
      if (iter === 4) acc = 0;
      routeEvents();
      /* hide the death card if the player is somehow alive again */
      if (ui.deadInfo && sim.player.alive) ui.deadInfo = null;
    } else if (sim && ui.screen === 'title' && dtReal > 0) {
      /* living arena behind the title screen */
      sim.update(Math.min(dtReal, 0.05), { dx: 0, dy: 0, dash: false });
      input.update();
    } else {
      input.update();
    }

    /* camera shake decay */
    shakeMag = Math.max(0, shakeMag - dtReal * 3.2);
    shake.x = (Math.random() - 0.5) * shakeMag * 16;
    shake.y = (Math.random() - 0.5) * shakeMag * 16;

    ui.update(dtReal);

    /* render world (or a frozen title backdrop) then UI */
    var geom;
    if (sim) geom = renderer.render(sim, ui, time, shake);
    else { geom = renderer.size(); }
    /* mouse-follow focus: player position in screen px */
    if (sim && sim.player) {
      var cam = renderer.cam;
      input.focus.x = (sim.player.x - cam.x) * cam.zoom + geom.w / 2;
      input.focus.y = (sim.player.y - cam.y) * cam.zoom + geom.h / 2;
    }
    ui.draw(ctx, sim, meta, geom);
    input.drawJoy(ctx);
  }

  document.addEventListener('visibilitychange', function () {
    lastT = performance.now();
    acc = 0;
  });

  audio.setMuted(save.muted);
  runLoading();
  requestAnimationFrame(function (t) { lastT = t; requestAnimationFrame(frame); });
})();
