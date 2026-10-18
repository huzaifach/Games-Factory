/* RUCKUS RAMPAGE — input: virtual joystick + HIT/JUMP buttons (touch), keyboard (desktop). */
var RR = (typeof RR !== 'undefined') ? RR : {};

RR.Input = {
  scene: null,
  joyG: null, btnG: null, hitTxt: null, jumpTxt: null,
  joy: { active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 },
  hitP: { id: -1 }, jumpP: { id: -1 },
  mx: 0, jumpHeld: false,
  jumpPressed: false, hitPressed: false,
  keys: null, prevJump: false, prevHit: false,
  visible: false, W: 0, H: 0,

  attach: function (scene) {
    /* detach from any previous scene first (boot -> main transition) */
    this.detach();
    this.scene = scene;
    this.joyG = scene.add.graphics().setDepth(200).setVisible(false);
    this.btnG = scene.add.graphics().setDepth(200).setVisible(false);
    this.hitTxt = scene.add.text(0, 0, 'HIT', { fontFamily: RR.CFG.FONT, fontSize: '30px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(201).setVisible(false);
    this.jumpTxt = scene.add.text(0, 0, 'JUMP', { fontFamily: RR.CFG.FONT, fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(201).setVisible(false);
    scene.input.addPointer(3); /* joystick + 2 buttons at once */
    var self = this;
    this._hDown = function (p) { self._down(p); };
    this._hMove = function (p) { self._move(p); };
    this._hUp = function (p) { self._up(p); };
    scene.input.on('pointerdown', this._hDown);
    scene.input.on('pointermove', this._hMove);
    scene.input.on('pointerup', this._hUp);
    scene.input.on('pointerupoutside', this._hUp);
    var kb = scene.input.keyboard;
    if (kb) {
      var KC = Phaser.Input.Keyboard.KeyCodes;
      this.keys = kb.addKeys({
        left: KC.LEFT, right: KC.RIGHT, up: KC.UP, down: KC.DOWN,
        a: KC.A, d: KC.D, w: KC.W,
        j: KC.J, k: KC.K, space: KC.SPACE
      });
    }
    this.resize(scene.scale.width, scene.scale.height);
  },

  detach: function () {
    if (this.scene && this.scene.input) {
      try {
        if (this._hDown) this.scene.input.off('pointerdown', this._hDown);
        if (this._hMove) this.scene.input.off('pointermove', this._hMove);
        if (this._hUp) {
          this.scene.input.off('pointerup', this._hUp);
          this.scene.input.off('pointerupoutside', this._hUp);
        }
      } catch (e) {}
    }
    var self = this;
    ['joyG', 'btnG', 'hitTxt', 'jumpTxt'].forEach(function (k) {
      if (self[k]) { try { self[k].destroy(); } catch (e) {} self[k] = null; }
    });
    this.joy.active = false; this.joy.id = -1;
    this.hitP.id = -1; this.jumpP.id = -1;
    this.mx = 0; this.visible = false;
  },

  resize: function (w, h) {
    this.W = w; this.H = h;
    /* buttons anchored bottom-right; joystick is dynamic */
    this.hitBtn = { x: w - 96, y: h - 100, r: 62 };
    this.jumpBtn = { x: w - 218, y: h - 76, r: 44 };
    this._drawButtons();
  },

  setVisible: function (v) {
    this.visible = v;
    this.joyG.setVisible(v && this.joy.active);
    this.btnG.setVisible(v);
    this.hitTxt.setVisible(v); this.jumpTxt.setVisible(v);
    if (!v) { this.joy.active = false; this.joy.id = -1; this.hitP.id = -1; this.jumpP.id = -1; this.mx = 0; }
    this._drawButtons();
  },

  _drawButtons: function () {
    if (!this.btnG) return;
    var g = this.btnG; g.clear();
    if (!this.visible) return;
    var hb = this.hitBtn, jb = this.jumpBtn;
    g.fillStyle(0xff2e88, 0.28); g.fillCircle(hb.x, hb.y, hb.r);
    g.lineStyle(4, 0xff2e88, 0.9); g.strokeCircle(hb.x, hb.y, hb.r);
    g.fillStyle(0x29f3ff, 0.22); g.fillCircle(jb.x, jb.y, jb.r);
    g.lineStyle(4, 0x29f3ff, 0.9); g.strokeCircle(jb.x, jb.y, jb.r);
    this.hitTxt.setPosition(hb.x, hb.y); this.jumpTxt.setPosition(jb.x, jb.y);
  },

  _onButton: function (p, b) {
    var dx = p.x - b.x, dy = p.y - b.y;
    return dx * dx + dy * dy <= (b.r + 14) * (b.r + 14);
  },

  _down: function (p) {
    if (!this.visible) return;
    RR.Audio.init(); RR.Audio.resume();
    if (this._onButton(p, this.hitBtn)) { this.hitP.id = p.id; this.hitPressed = true; return; }
    if (this._onButton(p, this.jumpBtn)) { this.jumpP.id = p.id; this.jumpHeld = true; this.jumpPressed = true; return; }
    if (!this.joy.active && p.x < this.W * 0.55) {
      this.joy.active = true; this.joy.id = p.id;
      this.joy.ox = p.x; this.joy.oy = p.y; this.joy.dx = 0; this.joy.dy = 0;
      this.joyG.setVisible(true);
    }
  },
  _move: function (p) {
    if (this.joy.active && p.id === this.joy.id) {
      this.joy.dx = p.x - this.joy.ox; this.joy.dy = p.y - this.joy.oy;
      var m = Math.hypot(this.joy.dx, this.joy.dy), max = 70;
      if (m > max) { this.joy.dx *= max / m; this.joy.dy *= max / m; }
      this.mx = RR.U.clamp(this.joy.dx / 55, -1, 1);
      this._drawJoy();
    }
  },
  _up: function (p) {
    if (this.joy.active && p.id === this.joy.id) {
      this.joy.active = false; this.joy.id = -1; this.mx = 0;
      this.joyG.clear().setVisible(false);
    }
    if (p.id === this.hitP.id) this.hitP.id = -1;
    if (p.id === this.jumpP.id) { this.jumpP.id = -1; this.jumpHeld = false; }
  },
  _drawJoy: function () {
    var g = this.joyG; g.clear();
    g.fillStyle(0xffffff, 0.14); g.fillCircle(this.joy.ox, this.joy.oy, 64);
    g.lineStyle(3, 0xffffff, 0.5); g.strokeCircle(this.joy.ox, this.joy.oy, 64);
    g.fillStyle(0x29f3ff, 0.55);
    g.fillCircle(this.joy.ox + this.joy.dx, this.joy.oy + this.joy.dy, 30);
  },

  /* called every frame by the match loop */
  poll: function () {
    var jump = false, hit = false, kx = 0;
    if (this.keys) {
      var k = this.keys;
      if (k.left.isDown || k.a.isDown) kx -= 1;
      if (k.right.isDown || k.d.isDown) kx += 1;
      if (k.up.isDown || k.w.isDown || k.k.isDown) jump = true;
      if (k.j.isDown || k.space.isDown) hit = true;
    }
    var mx = kx !== 0 ? kx : this.mx;
    var jumpEdge = (jump && !this.prevJump) || this.jumpPressed;
    var hitEdge = (hit && !this.prevHit) || this.hitPressed;
    this.prevJump = jump || this.jumpHeld; this.prevHit = hit;
    this.jumpPressed = false; this.hitPressed = false;
    this.jumpHeld = jump || this.jumpHeld;
    return { move: mx, jump: jumpEdge, jumpHeld: this.jumpHeld, hit: hitEdge };
  }
};
