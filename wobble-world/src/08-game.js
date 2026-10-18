'use strict';
/* WOBBLE WORLD — 08-game.js : Game orchestrator.
   State machine, pointer input, camera, event bus, giggle detection,
   save/load, main loop, test hooks. */

class Bus {
  constructor() { this.map = {}; }
  on(evt, fn) {
    if (!this.map[evt]) this.map[evt] = [];
    this.map[evt].push(fn);
  }
  emit(evt, data) {
    const arr = this.map[evt];
    if (!arr) return;
    for (let i = 0; i < arr.length; i++) {
      try { arr[i](data); } catch (e) { if (typeof console !== 'undefined') console.error('bus', evt, e); }
    }
  }
}

/* small canvas glyphs for HUD circular buttons */
function iconJournal(ctx, cx, cy, s) {
  ctx.fillStyle = '#fff';
  Util.rr(ctx, cx - s * 0.32, cy - s * 0.42, s * 0.64, s * 0.84, 6);
  ctx.fill();
  ctx.strokeStyle = '#a893d8'; ctx.lineWidth = 4;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(cx - s * 0.18, cy + i * s * 0.22); ctx.lineTo(cx + s * 0.18, cy + i * s * 0.22); ctx.stroke();
  }
}
function iconMixer(ctx, cx, cy, s) {
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.2, cy - s * 0.45); ctx.lineTo(cx - s * 0.2, cy - s * 0.05);
  ctx.lineTo(cx - s * 0.42, cy + s * 0.42); ctx.lineTo(cx + s * 0.42, cy + s * 0.42);
  ctx.lineTo(cx + s * 0.2, cy - s * 0.05); ctx.lineTo(cx + s * 0.2, cy - s * 0.45);
  ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - s * 0.1, cy + s * 0.18, s * 0.08, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + s * 0.12, cy + s * 0.28, s * 0.06, 0, TAU); ctx.fill();
}
function iconWorlds(ctx, cx, cy, s) {
  ctx.fillStyle = '#fff';
  for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) {
    ctx.beginPath(); ctx.arc(cx + c * s * 0.3, cy + r * s * 0.3, s * 0.1, 0, TAU); ctx.fill();
  }
}
function iconSound(ctx, cx, cy, s, muted) {
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy - s * 0.12); ctx.lineTo(cx - s * 0.1, cy - s * 0.12);
  ctx.lineTo(cx + s * 0.15, cy - s * 0.38); ctx.lineTo(cx + s * 0.15, cy + s * 0.38);
  ctx.lineTo(cx - s * 0.1, cy + s * 0.12); ctx.lineTo(cx - s * 0.35, cy + s * 0.12);
  ctx.closePath(); ctx.fill();
  if (muted) {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + s * 0.25, cy - s * 0.25); ctx.lineTo(cx + s * 0.5, cy + s * 0.25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + s * 0.5, cy - s * 0.25); ctx.lineTo(cx + s * 0.25, cy + s * 0.25); ctx.stroke();
  } else {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx + s * 0.1, cy, s * 0.28, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + s * 0.1, cy, s * 0.48, -0.9, 0.9); ctx.stroke();
  }
}

class Game {
  constructor(canvas, opts) {
    opts = opts || {};
    this.testMode = !!opts.test;
    this.canvas = canvas;
    const ctxOpts = { alpha: false };
    try { ctxOpts.preserveDrawingBuffer = true; } catch (e) { /* ignore */ }
    this.ctx = canvas.getContext('2d', ctxOpts);
    this.cw = 800; this.ch = 1200; this.dpr = 1;
    this.scale = 1; this.ox = 0; this.oy = 0;
    this.time = 0;
    this.screen = 'boot';   // boot | title | howto | worlds | play
    this.overlay = null;    // null | journal | mixer
    this.dioramaIndex = 0;
    this.buttons = [];
    this.toasts = [];
    this.tutorial = null;
    this.selectedGoo = null;
    this.grabbed = null;
    this.grabTrail = [];
    this.grabStartT = 0;
    this.petT = 0;
    this.pointers = {};
    this.nextCid = 1;
    this.bus = new Bus();
    this.audio = new JellyAudio();
    this.ui = makeUI(this);
    this.mixer = new Mixer(this);
    this.world = null;
    this.toys = [];
    this.creatures = [];
    this.motes = [];
    this.lastCreationName = null;
    this.bootProgress = 0;
    this.bootError = null;
    this._stretchSfxT = 0;
    this.loadSave();
    this.audio.setMuted(!!this.save.muted);
    if (!this.testMode) {
      this.resize();
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', () => this.resize());
        canvas.addEventListener('pointerdown', (e) => this._onDown(e));
        canvas.addEventListener('pointermove', (e) => this._onMove(e));
        canvas.addEventListener('pointerup', (e) => this._onUp(e));
        canvas.addEventListener('pointercancel', (e) => this._onUp(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      }
    } else {
      this.cw = 800; this.ch = 1200;
      this._fitCamera();
    }
  }

  /* ---------- save ---------- */
  loadSave() {
    this.save = { tutorialDone: false, found: [], muted: false, creations: [], lastDiorama: 0 };
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('wobble-world-save-v1');
        if (raw) {
          const s = JSON.parse(raw);
          for (const k in this.save) if (s[k] !== undefined) this.save[k] = s[k];
        }
      }
    } catch (e) { /* ignore */ }
  }
  persist() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('wobble-world-save-v1', JSON.stringify(this.save));
      }
    } catch (e) { /* ignore */ }
  }

  /* ---------- camera ---------- */
  resize() {
    if (typeof window === 'undefined') return;
    this.cw = window.innerWidth;
    this.ch = window.innerHeight;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.cw * this.dpr);
    this.canvas.height = Math.round(this.ch * this.dpr);
    this._fitCamera();
    if (this.screen === 'play') this.rebuildButtons();
    else this.buildScreenButtons();
  }
  _fitCamera() {
    // COVER scale: no black bars ever; HUD lives in device space so nothing is cut off
    this.scale = Math.max(this.cw / STAGE_W, this.ch / STAGE_H);
    this.ox = (this.cw - STAGE_W * this.scale) / 2;
    this.oy = (this.ch - STAGE_H * this.scale) / 2;
  }
  toStage(dx, dy) {
    return { x: (dx - this.ox) / this.scale, y: (dy - this.oy) / this.scale };
  }

  // FIT transform for UI screens & overlays: everything visible, never
  // cropped (cover-crop would cut buttons on tall phones / wide desktops).
  // The play world itself stays COVER (no bars); HUD is device-space.
  _fitOverlay() {
    const s = Math.min(this.cw / STAGE_W, this.ch / STAGE_H);
    return { s, ox: (this.cw - STAGE_W * s) / 2, oy: (this.ch - STAGE_H * s) / 2 };
  }
  toOverlay(dx, dy) {
    const t = this._fitOverlay();
    return { x: (dx - t.ox) / t.s, y: (dy - t.oy) / t.s };
  }
  _uiFit() { return this.screen !== 'play' || !!this.overlay; }
  toUI(dx, dy) { return this._uiFit() ? this.toOverlay(dx, dy) : this.toStage(dx, dy); }

  /* ---------- diorama loading ---------- */
  loadDiorama(i) {
    this.dioramaIndex = Util.clamp(i, 0, DIORAMAS.length - 1);
    this.world = new World(STAGE_W, STAGE_H);
    this.world.addBounds();
    this.world.onImpact = (blob, stat, vn, nx, ny) => {
      if (blob instanceof Creature) blob.onLanded(vn, nx, ny, this);
    };
    this.toys = [];
    this.creatures = [];
    this.bus = new Bus();
    this.nextCid = 1;
    this.selectedGoo = null;
    this.grabbed = null;
    this.pointers = {};
    DIORAMAS[this.dioramaIndex].build(this);
    for (const gg of DIORAMAS[this.dioramaIndex].giggles) {
      try { gg.listen(this); } catch (e) { if (typeof console !== 'undefined') console.error('giggle listen', gg.id, e); }
    }
    for (const c of this.creatures) {
      c.userData.stretchNotified = false;
      c.userData.highNotified = false;
      c.userData.napNotified = false;
      c.userData.napT = 0;
    }
    this.motes = [];
    for (let m = 0; m < 16; m++) {
      this.motes.push({
        x: Util.rand(40, STAGE_W - 40), y: Util.rand(80, STAGE_H - 80),
        r: Util.rand(2, 5), ph: Util.rand(0, TAU), sp: Util.rand(8, 26)
      });
    }
    if (this.dioramaIndex === 0 && !this.save.tutorialDone) {
      this.tutorial = { step: 0, done: false, target: null };
    } else {
      this.tutorial = null;
    }
    this.save.lastDiorama = this.dioramaIndex;
    this.persist();
    this.screen = 'play';
    this.overlay = null;
    this.rebuildButtons();
  }

  currentHint() {
    const d = DIORAMAS[this.dioramaIndex];
    for (const gg of d.giggles) {
      if (this.save.found.indexOf(gg.id) < 0) return gg.hint;
    }
    return 'All giggles found here! Try another world!';
  }

  foundGiggle(id) {
    if (this.save.found.indexOf(id) >= 0) return;
    this.save.found.push(id);
    this.persist();
    let name = id;
    outer: for (const d of DIORAMAS) for (const gg of d.giggles) {
      if (gg.id === id) { name = gg.name; break outer; }
    }
    this.toast('Giggle found: ' + name + '!');
    this.audio.giggle();
    const c = this.creatures.length ? this.creatures[0].centroid(Game._c) : { x: 400, y: 600 };
    for (let i = 0; i < 14; i++) {
      this.world.particles.spawn('sparkle', c.x + Util.rand(-70, 70), c.y + Util.rand(-70, 70),
        { life: 0.8, size: Util.rand(6, 11), color: Util.pick(['#ffd166', '#ff9ebb', '#ffffff']), vx: Util.rand(-100, 100), vy: Util.rand(-160, -30), grav: 200 });
    }
    const d = DIORAMAS[this.dioramaIndex];
    const done = d.giggles.every(gg => this.save.found.indexOf(gg.id) >= 0);
    if (done) {
      const self = this;
      setTimeout(() => { try { self.toast('All giggles found in ' + d.name + '!'); self.audio.sparkle(); } catch (e) {} }, 1400);
    }
  }

  toast(text) {
    this.toasts.push({ text, t: 0, life: 2.4 });
    if (this.toasts.length > 3) this.toasts.shift();
  }

  snapshot() {
    try {
      const url = this.canvas.toDataURL('image/png');
      const name = this.mixer.name || this.lastCreationName || 'My Wobble Friend';
      this.lastCreationName = name;
      this.ui.showSnapshot(url, name);
      this.audio.sparkle();
    } catch (e) {
      this.toast('Snapshot did not work here.');
    }
  }

  /* ---------- screens & buttons ---------- */
  setScreen(s) {
    this.screen = s;
    this.overlay = null;
    this.ui.hideOverlay();
    this.buildScreenButtons();
  }

  buildScreenButtons() {
    this.buttons = [];
    if (this.screen === 'title') {
      const play = new UIButton(STAGE_W / 2, 780, 380, 110, 'Play', () => {
        this.audio.ensure(); this.audio.uiClick();
        if (!this.save.tutorialDone) this.loadDiorama(0);
        else this.loadDiorama(this.save.lastDiorama || 0);
      }, { fontSize: 44 });
      play.space = 'stage';
      const how = new UIButton(STAGE_W / 2, 910, 380, 88, 'How to Play', () => {
        this.audio.ensure(); this.audio.uiClick(); this.setScreen('howto');
      }, { fontSize: 32, fill: ['#cfc3ec', '#a893d8'] });
      how.space = 'stage';
      const snd = new UIButton(STAGE_W - 70, 70, 84, 84, '', () => this.toggleSound(), { circle: true, fill: ['#cfc3ec', '#a893d8'] });
      snd.space = 'stage';
      snd.icon = (ctx, cx, cy, s) => iconSound(ctx, cx, cy, s, this.save.muted);
      this.sndBtn = snd;
      this.buttons.push(play, how, snd);
    } else if (this.screen === 'howto') {
      const back = new UIButton(150, 1090, 220, 84, 'Back', () => { this.audio.uiClick(); this.setScreen('title'); }, { fontSize: 28, fill: ['#cfc3ec', '#a893d8'] });
      back.space = 'stage';
      const go = new UIButton(560, 1090, 300, 84, "Let's Play!", () => {
        this.audio.ensure(); this.audio.uiClick();
        this.loadDiorama(0);
      }, { fontSize: 30 });
      go.space = 'stage';
      this.buttons.push(back, go);
    } else if (this.screen === 'worlds') {
      const back = new UIButton(STAGE_W / 2, 1100, 260, 84, 'Back', () => { this.audio.uiClick(); this.setScreen('play'); }, { fontSize: 28, fill: ['#cfc3ec', '#a893d8'] });
      back.space = 'stage';
      this.buttons.push(back);
    }
  }

  rebuildButtons() {
    // play-screen HUD buttons live in DEVICE space so they are never cut off
    this.buttons = [];
    if (this.screen !== 'play') { this.buildScreenButtons(); return; }
    const defs = [
      { key: 'worlds', icon: iconWorlds, tip: 'Worlds', fn: () => { this.audio.uiClick(); this.setScreen('worlds'); } },
      { key: 'mixer', icon: iconMixer, tip: 'Mixer', fn: () => { this.mixer.open(); } },
      { key: 'journal', icon: iconJournal, tip: 'Journal', fn: () => { this.audio.uiClick(); this.overlay = 'journal'; this.rebuildButtons(); } },
      { key: 'sound', icon: null, tip: 'Sound', fn: () => this.toggleSound() }
    ];
    for (let i = 0; i < defs.length; i++) {
      const bx = this.cw - 52 - i * 78;
      const b = new UIButton(bx, 50, 64, 64, '', defs[i].fn, { circle: true, fill: ['#cfc3ec', '#a893d8'] });
      b.space = 'device';
      if (defs[i].key === 'sound') b.icon = (ctx, cx, cy, s) => iconSound(ctx, cx, cy, s, this.save.muted);
      else b.icon = defs[i].icon;
      b.tip = defs[i].tip;
      this.buttons.push(b);
    }
    if (this.overlay === 'journal') {
      const close = new UIButton(60 + 680 - 46, 150 + 46, 76, 76, '', () => { this.overlay = null; this.rebuildButtons(); }, { circle: true, fill: ['#ff9ebb', '#ff6f9f'] });
      close.space = 'stage';
      close.icon = (ctx, cx, cy) => {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - 14, cy - 14); ctx.lineTo(cx + 14, cy + 14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 14, cy - 14); ctx.lineTo(cx - 14, cy + 14); ctx.stroke();
      };
      this.buttons.push(close);
    }
  }

  toggleSound() {
    this.audio.ensure();
    this.save.muted = !this.save.muted;
    this.audio.setMuted(this.save.muted);
    this.persist();
    this.audio.uiClick();
    this.rebuildButtons();
    if (this.screen === 'title') this.buildScreenButtons();
  }

  /* ---------- input ---------- */
  _evPos(e) {
    let dx, dy;
    if (e.clientX !== undefined) { dx = e.clientX; dy = e.clientY; }
    else { dx = this.cw / 2; dy = this.ch / 2; }
    return { dx, dy };
  }
  _onDown(e) {
    if (e.preventDefault) e.preventDefault();
    this.audio.ensure();
    if (!this.audio.musicTimer && !this.testMode) this.audio.startMusic();
    const { dx, dy } = this._evPos(e);
    const id = e.pointerId !== undefined ? e.pointerId : 'mouse';
    this.pointers[id] = { dx, dy };
    this.handleDown(dx, dy, id);
  }
  _onMove(e) {
    const { dx, dy } = this._evPos(e);
    const id = e.pointerId !== undefined ? e.pointerId : 'mouse';
    if (this.pointers[id]) {
      this.pointers[id] = { dx, dy };
      this.handleMove(dx, dy, id);
    }
  }
  _onUp(e) {
    const { dx, dy } = this._evPos(e);
    const id = e.pointerId !== undefined ? e.pointerId : 'mouse';
    delete this.pointers[id];
    this.handleUp(dx, dy, id);
  }

  _hitButtons(dx, dy) {
    for (const b of this.buttons) {
      if (this.overlay && b.space === 'device') continue; // HUD hidden behind overlays
      const p = b.space === 'device' ? { x: dx, y: dy } : this.toUI(dx, dy);
      if (b.hit(p.x, p.y)) { b.press(); b.onTap(); return true; }
    }
    return false;
  }

  handleDown(dx, dy, pid) {
    const s = this.toUI(dx, dy);
    // tutorial skip: tap the hint bubble
    if (this.tutorial && !this.tutorial.done && this.screen === 'play' && !this.overlay) {
      ctx_measure: {
        const msg = ['Touch a jelly friend to grab it!', 'Now DRAG to stretch it far!', 'Let go — FLING!'][this.tutorial.step];
        // approx bubble rect (matches drawTutorial)
        if (Math.abs(s.x - STAGE_W / 2) < 300 && Math.abs(s.y - 200) < 60) {
          this._skipTutorial();
          return;
        }
      }
    }
    if (this._hitButtons(dx, dy)) return;
    if (this.screen === 'worlds') { this._handleWorldsTap(s.x, s.y); return; }
    if (this.screen !== 'play') return;
    if (this.overlay === 'mixer') { this.mixer.handleTap(s.x, s.y); return; }
    if (this.overlay === 'journal') return; // close via X button only

    // second finger while grabbing = poke
    if (this.grabbed && Object.keys(this.pointers).length > 1) {
      const c = this._creatureAt(s.x, s.y, 170);
      if (c) c.poke(s.x, s.y, this);
      return;
    }
    if (this.grabbed) return;

    // toys first: bubble pipes (pop), goo jars (select)
    for (const toy of this.toys) {
      if (toy instanceof BubblePipe && toy.tap(s.x, s.y, this)) return;
      if (toy instanceof GooJar && Util.dist(s.x, s.y, toy.x, toy.y) < 70) { toy.tap(this); return; }
    }
    // creatures
    const c = this._creatureAt(s.x, s.y, 0);
    if (c) {
      if (this.selectedGoo) {
        c.paint(this.selectedGoo, this);
        this.selectedGoo = null;
        if (this.tutorial && !this.tutorial.done && this.tutorial.step === 0) { /* painting is fine, keep guiding */ }
        return;
      }
      this._grab(c, s.x, s.y, pid);
      return;
    }
    // empty space: tiny dust poof for feedback
    this.world.particles.spawn('poof', s.x, s.y, { life: 0.4, size: 12, color: '#ffffff' });
  }

  handleMove(dx, dy, pid) {
    if (this.screen !== 'play' || this.overlay) return;
    if (!this.grabbed) return;
    const s = this.toStage(dx, dy);
    const g = this.grabbed;
    g.moveGrab(s.x, s.y);
    const now = this.time;
    this.grabTrail.push({ x: s.x, y: s.y, t: now });
    while (this.grabTrail.length > 2 && now - this.grabTrail[0].t > 0.25) this.grabTrail.shift();
    // stretch sfx (throttled)
    const st = g.stretch();
    if (st > 1.5 && now - this._stretchSfxT > 0.4) {
      this._stretchSfxT = now;
      this.audio.stretchSfx(Util.clamp((st - 1.5) / 1.2, 0, 1));
    }
    // tutorial: stretch step
    if (this.tutorial && !this.tutorial.done && this.tutorial.step === 1 && st > 1.4) {
      this.tutorial.step = 2;
      this.audio.uiClick();
    }
    // petting: slow gentle movement = hearts
    const n = this.grabTrail.length;
    if (n >= 2) {
      const a = this.grabTrail[0], b = this.grabTrail[n - 1];
      const moved = Util.dist(a.x, a.y, b.x, b.y);
      const dt = Math.max(0.01, b.t - a.t);
      const spd = moved / dt;
      if (spd < 90 && now - this.grabStartT > 1.0) {
        this.petT -= 0.016;
        if (this.petT <= 0) {
          this.petT = 0.7;
          const c = g.centroid(Game._c);
          this.world.particles.spawn('heart', c.x + Util.rand(-20, 20), c.y - g.restR,
            { life: 1.1, size: 14, color: '#ff8fb3', vy: -50 });
          this.audio.uiClick();
        }
      } else {
        this.petT = 0.4;
      }
    }
  }

  handleUp(dx, dy, pid) {
    if (this.screen !== 'play') return;
    if (!this.grabbed || this.grabbedPid !== pid) return;
    const g = this.grabbed;
    const now = this.time;
    // fling velocity from recent trail
    let vx = 0, vy = 0;
    const n = this.grabTrail.length;
    if (n >= 2) {
      const a = this.grabTrail[0], b = this.grabTrail[n - 1];
      const dt = Math.max(0.016, b.t - a.t);
      vx = (b.x - a.x) / dt;
      vy = (b.y - a.y) / dt;
      const sp = Math.sqrt(vx * vx + vy * vy);
      const max = 2300;
      if (sp > max) { vx *= max / sp; vy *= max / sp; }
    }
    const dt = 1 / 60;
    for (let i = 0; i < g.n; i++) {
      const nd = g.nodes[i];
      nd.px = nd.x - vx * dt;
      nd.py = nd.y - vy * dt;
    }
    g.center.px = g.center.x - vx * dt;
    g.center.py = g.center.y - vy * dt;
    g.release();
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > 240) {
      g.squash(vx / speed, vy / speed, -0.18); // stretch along motion (negative squash)
      this.audio.boing(Util.clamp(speed / 1600, 0.25, 1));
    }
    if (this.tutorial && !this.tutorial.done && this.tutorial.step === 2 && speed > 200) {
      this._finishTutorial();
    }
    this.grabbed = null;
    this.grabbedPid = null;
    this.grabTrail = [];
  }

  _grab(c, x, y, pid) {
    c.grab(x, y);
    this.grabbed = c;
    this.grabbedPid = pid;
    this.grabTrail = [{ x, y, t: this.time }];
    this.grabStartT = this.time;
    this.petT = 0.5;
    if (c.sleeping) c.wake(this);
    this.audio.squelch();
    const cc = c.centroid(Game._c);
    this.world.particles.ring(cc.x, cc.y, '#ffffff', c.restR * 0.8);
    if (this.tutorial && !this.tutorial.done && this.tutorial.step === 0) {
      this.tutorial.step = 1;
      this.audio.uiClick();
    }
  }

  _creatureAt(x, y, extra) {
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const c = this.creatures[i];
      if (c.dead) continue;
      const cc = c.centroid(Game._c);
      if (Util.dist(x, y, cc.x, cc.y) < c.restR * 1.25 + (extra || 0)) return c;
    }
    return null;
  }

  _handleWorldsTap(x, y) {
    for (let i = 0; i < DIORAMAS.length; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const rx = 40 + col * 380, ry = 190 + row * 274;
      if (x > rx && x < rx + 340 && y > ry && y < ry + 250) {
        this.audio.uiClick();
        this.loadDiorama(i);
        return;
      }
    }
  }

  _skipTutorial() {
    this.tutorial.done = true;
    this.tutorial = null;
    this.save.tutorialDone = true;
    this.persist();
    this.toast('Tutorial skipped — have fun!');
  }
  _finishTutorial() {
    this.tutorial.done = true;
    this.tutorial = null;
    this.save.tutorialDone = true;
    this.persist();
    this.toast('You did it! Now explore!');
    this.audio.giggle();
  }

  /* ---------- update ---------- */
  update(dt) {
    this.time += dt;
    // toasts
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const t = this.toasts[i];
      t.t += dt; t.life -= dt;
      if (t.life <= 0) this.toasts.splice(i, 1);
    }
    for (const b of this.buttons) b.update(dt);
    if (this.screen !== 'play' || !this.world) return;

    // creature AI before physics
    for (const c of this.creatures) c.updateAI(dt, this);
    this.world.update(dt);
    // toys react after physics
    for (const toy of this.toys) {
      try { toy.update(dt, this.world, this); } catch (e) { if (typeof console !== 'undefined') console.error('toy', e); }
    }
    if (this.overlay === 'mixer') this.mixer.update(dt);

    // per-frame giggle checks
    for (const c of this.creatures) {
      if (c.dead) continue;
      const cc = c.centroid(Game._c);
      const st = c.stretch();
      if (st > c.maxStretchSeen) c.maxStretchSeen = st;
      if (st > 1.8 && !c.userData.stretchNotified) {
        c.userData.stretchNotified = true;
        this.bus.emit('stretch-max', { creature: c, amount: st });
      }
      if (cc.y < 260 && !c.userData.highNotified) {
        c.userData.highNotified = true;
        this.bus.emit('high', { creature: c });
      }
      if (c.sleeping) {
        c.userData.napT = (c.userData.napT || 0) + dt;
        if (c.userData.napT > 8 && !c.userData.napNotified) {
          c.userData.napNotified = true;
          this.bus.emit('nap', { creature: c });
        }
      } else {
        c.userData.napT = 0;
      }
    }
    // tutorial: stretch step is checked here (physics has responded by now)
    if (this.tutorial && !this.tutorial.done && this.tutorial.step === 1 &&
        this.grabbed && this.grabbed.stretch() > 1.4) {
      this.tutorial.step = 2;
      this.audio.uiClick();
    }
    // tutorial target tracking
    if (this.tutorial && !this.tutorial.done) {
      if (!this.tutorial.target || this.tutorial.target.dead) {
        let best = null, bd = Infinity;
        for (const c of this.creatures) {
          const cc = c.centroid(Game._c);
          const d = Util.dist2(cc.x, cc.y, STAGE_W / 2, 700);
          if (d < bd) { bd = d; best = c; }
        }
        this.tutorial.target = best;
      }
    }
    // motes drift
    for (const m of this.motes) {
      m.ph += dt * 0.8;
      m.y -= m.sp * dt;
      m.x += Math.sin(m.ph) * 12 * dt;
      if (m.y < 40) { m.y = STAGE_H - 60; m.x = Util.rand(40, STAGE_W - 40); }
    }
  }

  /* ---------- render ---------- */
  _fillUIBackground(ctx, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, this.ch);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, this.cw, this.ch);
  }

  render() {
    const ctx = this.ctx;
    const useFit = this._uiFit(); // menus + overlays: FIT (never crop a button)
    // device-space background
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.screen === 'play' && !useFit) {
      const d = DIORAMAS[this.dioramaIndex];
      this._fillUIBackground(ctx, d.sky[0], d.sky[1]);
    } else if (this.screen === 'play') {
      const d = DIORAMAS[this.dioramaIndex];
      this._fillUIBackground(ctx, d.sky[0], d.sky[1]);
    } else if (this.screen === 'title') {
      this._fillUIBackground(ctx, '#ffe3ef', '#ffd0e3');
    } else if (this.screen === 'howto') {
      this._fillUIBackground(ctx, '#e3f2ff', '#cfe8ff');
    } else if (this.screen === 'worlds') {
      this._fillUIBackground(ctx, '#f3e8ff', '#e0d0f5');
    } else {
      this._fillUIBackground(ctx, '#ffeef5', '#ffd9e8');
    }
    // stage/UI space
    if (useFit) {
      const t = this._fitOverlay();
      ctx.setTransform(this.dpr * t.s, 0, 0, this.dpr * t.s, this.dpr * t.ox, this.dpr * t.oy);
    } else {
      ctx.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, this.dpr * this.ox, this.dpr * this.oy);
    }
    if (this.screen === 'boot') {
      this._drawBoot(ctx);
    } else if (this.screen === 'title') {
      drawTitle(ctx, this);
      this._drawButtons(ctx, 'stage');
    } else if (this.screen === 'howto') {
      drawHowto(ctx, this);
      this._drawButtons(ctx, 'stage');
    } else if (this.screen === 'worlds') {
      drawWorlds(ctx, this);
      this._drawButtons(ctx, 'stage');
    } else if (this.screen === 'play' && this.world) {
      if (!useFit) {
        const d = DIORAMAS[this.dioramaIndex];
        try { d.decor(ctx, this, this.time); } catch (e) { /* decor never breaks the game */ }
        // motes behind toys
        ctx.fillStyle = '#ffffff';
        for (const m of this.motes) {
          ctx.globalAlpha = 0.35 + Math.sin(m.ph) * 0.15;
          ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
        for (const toy of this.toys) {
          try { toy.draw(ctx, this); } catch (e) { if (typeof console !== 'undefined') console.error('toy draw', e); }
        }
        // goo balls under creatures
        for (const b of this.world.blobs) {
          if (b instanceof GooBall) { try { b.draw(ctx, this); } catch (e) {} }
        }
        for (const c of this.creatures) {
          if (!c.dead) { try { c.draw(ctx, this); } catch (e) { if (typeof console !== 'undefined') console.error('creature draw', e); } }
        }
        this.world.particles.draw(ctx);
        drawTutorial(ctx, this);
        this._drawButtons(ctx, 'stage');
      } else {
        // modal overlay over the play screen: draw its own dim panel
        if (this.overlay === 'journal') { drawJournal(ctx, this); this._drawButtons(ctx, 'stage'); }
        else if (this.overlay === 'mixer') { this.mixer.draw(ctx); }
      }
    }
    // device space: HUD + device buttons + toasts
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.screen === 'play' && !this.overlay) drawHUD(ctx, this);
    if (this.screen === 'play' && !this.overlay) drawTutorialBubble(ctx, this);
    if (!this.overlay) this._drawButtons(ctx, 'device');
    drawToasts(ctx, this);
  }

  _drawButtons(ctx, space) {
    for (const b of this.buttons) {
      if ((b.space || 'stage') === space) b.draw(ctx, this);
    }
  }

  _drawBoot(ctx) {
    ctx.fillStyle = '#ffeef5';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (this.bootError) {
      ctx.fillStyle = '#d14e7f';
      ctx.font = 'bold 34px "Baloo 2", sans-serif';
      ctx.fillText('Oh no! Something wobbled wrong.', STAGE_W / 2, 480);
      ctx.fillStyle = '#7a6a8f';
      ctx.font = '24px "Baloo 2", sans-serif';
      ctx.fillText(String(this.bootError).slice(0, 60), STAGE_W / 2, 540);
    } else {
      drawMascot(ctx, STAGE_W / 2, 480, 80, '#ff8fb3', this.time, 'bouncy');
      ctx.fillStyle = '#4a3b5c';
      ctx.font = 'bold 40px "Baloo 2", sans-serif';
      ctx.fillText('Wobble World', STAGE_W / 2, 640);
      // progress bar
      const bw = 440;
      ctx.fillStyle = 'rgba(74,59,92,0.12)';
      Util.rr(ctx, STAGE_W / 2 - bw / 2, 720, bw, 36, 18);
      ctx.fill();
      const p = Util.clamp(this.bootProgress, 0, 1);
      if (p > 0.01) {
        const g = ctx.createLinearGradient(0, 720, 0, 756);
        g.addColorStop(0, '#ff9ebb'); g.addColorStop(1, '#ff6f9f');
        ctx.fillStyle = g;
        Util.rr(ctx, STAGE_W / 2 - bw / 2 + 4, 724, (bw - 8) * p, 28, 14);
        ctx.fill();
      }
      ctx.fillStyle = '#7a6a8f';
      ctx.font = '24px "Baloo 2", sans-serif';
      ctx.fillText('Warming up the jelly... ' + Math.round(p * 100) + '%', STAGE_W / 2, 790);
    }
  }

  /* ---------- main loop ---------- */
  loop(tms) {
    if (this.testMode) return;
    const now = tms / 1000;
    if (!this._lastT) this._lastT = now;
    let dt = now - this._lastT;
    this._lastT = now;
    if (dt > 0.06) dt = 0.06;
    if (dt < 0) dt = 0;
    try {
      this.update(dt);
      this.render();
    } catch (e) {
      if (typeof console !== 'undefined') console.error('frame', e);
    }
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame((t) => this.loop(t));
    }
  }
  start() {
    if (this.testMode) return;
    this._lastT = 0;
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  /* ---------- test hooks ---------- */
  testStep(n, dt) {
    dt = dt || 1 / 60;
    for (let i = 0; i < n; i++) this.update(dt);
  }
  testDown(sx, sy) { this.handleDown(this.ox + sx * this.scale, this.oy + sy * this.scale, 'test'); }
  testMove(sx, sy) { this.handleMove(this.ox + sx * this.scale, this.oy + sy * this.scale, 'test'); }
  testUp(sx, sy) { this.handleUp(this.ox + sx * this.scale, this.oy + sy * this.scale, 'test'); }
}
Game._c = {};
