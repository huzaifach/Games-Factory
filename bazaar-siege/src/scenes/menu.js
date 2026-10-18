/* BAZAAR SIEGE — scenes/menu.js
 * Title with glow, Best Night / stars display, mute toggle.
 * ENTER THE BAZAAR -> How-to-Play (3 illustrated steps with real textures) -> Game. */
(function (global) {
  var BS = (global.BS = global.BS || {});
  BS.Scenes = BS.Scenes || {};

  BS.Scenes.Menu = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function () {
      Phaser.Scene.call(this, { key: 'Menu' });
    },

    create: function () {
      var scene = this;
      var W = BS.CONFIG.WIDTH, H = BS.CONFIG.HEIGHT;

      this.cameras.main.setBackgroundColor('#0b1030');
      this.cameras.main.fadeIn(400);

      // Sky backdrop.
      var sky = this.add.image(W / 2, H / 2, 'bg-sky').setDisplaySize(800, 1400);
      sky.setAlpha(0.9);
      this.add.image(590, 170, 'bg-moon').setScale(1.2);
      var city = this.add.image(W / 2, 1010, 'bg-minaret').setDisplaySize(720, 270);
      city.setAlpha(0.85);

      // Ambient swaying lanterns.
      var lanterns = [];
      for (var i = 0; i < 8; i++) {
        var lx = 60 + i * 86;
        var ln = this.add.image(lx, 300 + (i % 3) * 60, 'bg-lantern');
        ln.setData('baseY', ln.y);
        ln.setData('phase', i * 0.8);
        lanterns.push(ln);
      }

      // Fairy-light strings across the top.
      for (var f = 0; f < 24; f++) {
        var fx = 20 + f * 29;
        var fy = 240 + Math.sin(f / 24 * Math.PI) * 46;
        var bulb = this.add.image(fx, fy, 'bg-fairybulb').setAlpha(0.9);
        bulb.setData('phase', f * 1.3);
        lanterns.push(bulb);
      }

      // Title.
      // Title with layered-text glow (deterministic; no shadowBlur reliance).
      var titleC = this.add.container(W / 2, 560);
      var titleStyle = {
        fontFamily: 'Georgia, serif', fontSize: '104px', color: '#ffca7a',
        fontStyle: 'bold', align: 'center', lineSpacing: 8
      };
      [[-4, 0], [4, 0], [0, -4], [0, 4]].forEach(function (o) {
        titleC.add(this.add.text(o[0], o[1], 'BAZAAR\nSIEGE', titleStyle).setOrigin(0.5).setAlpha(0.5).setColor('#ff9a1f'));
      }, this);
      titleC.add(this.add.text(0, 0, 'BAZAAR\nSIEGE', titleStyle).setOrigin(0.5));
      var title = titleC;
      this.tweens.add({ targets: title, scaleX: 1.03, scaleY: 1.03, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      var tagline = this.add.text(W / 2, 740, 'Smog imps march on the night bazaar.\nHold the lanes till dawn.', {
        fontFamily: 'Georgia, serif', fontSize: '28px', color: '#fff6e8', align: 'center', lineSpacing: 6
      }).setOrigin(0.5);

      // Best Night / stars.
      var save = BS.save || { bestNight: 0, stars: 0 };
      var bestLine = save.bestNight > 0
        ? 'Best Night: Wave ' + save.bestNight
        : 'No nights survived yet — tonight is the night.';
      this.add.text(W / 2, 830, bestLine, {
        fontFamily: 'Georgia, serif', fontSize: '26px', color: '#ffca7a', align: 'center'
      }).setOrigin(0.5);
      for (var s = 0; s < 3; s++) {
        var star = this.add.image(W / 2 - 52 + s * 52, 880, 'ui-star').setScale(0.7);
        star.setAlpha(s < save.stars ? 1 : 0.25);
      }

      // Buttons.
      BS.ui.button(this, W / 2, 1000, 'ENTER THE BAZAAR', function () {
        BS.audio.unlock();
        scene.scene.start('HowTo');
      }, { w: 480, h: 110, fontSize: 36 });
      BS.ui.muteButton(this, W - 70, 70);

      this.add.text(W / 2, 1210, 'A truck-art tower defense under one glowing sky', {
        fontFamily: 'Georgia, serif', fontSize: '22px', color: '#8f86b8'
      }).setOrigin(0.5);

      // Ambient life: sway + twinkle (cheap sine offsets, no tweens).
      this._ambient = lanterns;
    },

    update: function (time) {
      if (!this._ambient) { return; }
      for (var i = 0; i < this._ambient.length; i++) {
        var o = this._ambient[i];
        var ph = o.getData('phase') || 0;
        if (o.texture.key === 'bg-lantern') {
          o.x += Math.sin(time * 0.001 + ph) * 0.25;
          o.rotation = Math.sin(time * 0.0012 + ph) * 0.12;
        } else {
          o.setAlpha(0.55 + 0.45 * Math.abs(Math.sin(time * 0.002 + ph)));
        }
      }
    }
  });

  /* ---------------- HOW TO PLAY ---------------- */
  BS.Scenes.HowTo = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function () {
      Phaser.Scene.call(this, { key: 'HowTo' });
    },

    create: function () {
      var scene = this;
      var W = BS.CONFIG.WIDTH, H = BS.CONFIG.HEIGHT;
      this.cameras.main.setBackgroundColor('#0b1030');
      this.cameras.main.fadeIn(300);
      this.add.image(W / 2, H / 2, 'bg-sky').setDisplaySize(800, 1400).setAlpha(0.85);

      this.add.text(W / 2, 90, 'HOW TO HOLD THE BAZAAR', {
        fontFamily: 'Georgia, serif', fontSize: '44px', color: '#ffca7a', fontStyle: 'bold'
      }).setOrigin(0.5);

      var steps = [
        {
          tex: 'turret-rickshaw', step: '1. PLACE',
          text: 'Tap a turret card, then tap a glowing rooftop.'
        },
        {
          tex: 'turret-rickshaw-evo', step: '2. MERGE',
          text: 'Drag two matching turrets together\nto evolve one stronger turret.'
        },
        {
          tex: 'enemy-runner', step: '3. HOLD TILL DAWN',
          text: 'Stop the imps reaching your gate.\nYou have 20 lives.'
        }
      ];

      for (var i = 0; i < steps.length; i++) {
        var st = steps[i];
        var y = 300 + i * 270;
        var p = BS.ui.panel(this, W / 2, y, 620, 230);
        var img = this.add.image(-240, 0, st.tex).setScale(st.tex.indexOf('turret') === 0 ? 1.1 : 1.4);
        p.add(img);
        var t = this.add.text(-160, -80, st.step, {
          fontFamily: 'Georgia, serif', fontSize: '32px', color: '#ffca7a', fontStyle: 'bold'
        });
        var d = this.add.text(-160, -34, st.text, {
          fontFamily: 'Georgia, serif', fontSize: '24px', color: '#fff6e8', lineSpacing: 6
        });
        p.add([t, d]);
        // Gentle entrance, staggered.
        p.setScale(0.9); p.setAlpha(0);
        this.tweens.add({ targets: p, scaleX: 1, scaleY: 1, alpha: 1, duration: 400, delay: i * 180, ease: 'Back.easeOut' });
        // Mini idle animation on the illustration.
        this.tweens.add({ targets: img, y: '-=8', duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 180 });
      }

      BS.ui.button(this, W / 2, 1150, 'TO THE BAZAAR', function () {
        BS.audio.unlock();
        scene.scene.start('Game');
      }, { w: 440, h: 104, fontSize: 34 });

      BS.ui.button(this, W / 2, 1020, 'Back', function () {
        scene.scene.start('Menu');
      }, { w: 220, h: 88, fontSize: 28 });
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
