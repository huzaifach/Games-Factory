/* GULLY CHAMPION — tuning config. Plain script, global GCConfig. */
var GCConfig = {
  W: 720,
  H: 1280,    // aspect-matched at boot in main.js (always >= DH, so FIT never letterboxes)
  DH: 1280,   // DESIGN height: every gameplay/UI coordinate is authored for 720x1280.
              // On taller phones H > DH; scenes center the design space with
              // cameras.main.setScroll(0, -(H-DH)/2) and full-bleed the backgrounds.

  timing: { perfect: 45, good: 100, edge: 175 },   // ms from ideal release
  power: { minHoldMs: 100, fullHoldMs: 850, minPower: 0.25 },
  flick: { maxDx: 260, maxAngle: 58 },             // px -> degrees

  pitch: {
    releaseX: 360, releaseY: 400,   // bowler release point
    hitX: 360, hitY: 960,           // batting crease / hitting line
    stumpY: 1090,
    ropeDist: 68                    // "meters" to the boundary rope
  },

  // 6 delivery types. travel = ms from release to hitting line (x pace mult).
  deliveries: {
    yorker:   { label: 'YORKER',     travel: 1050, window: 0.8, loftMod: -14, curve: 0,    col: 0xff5a5a, stumpP: 0.55, cue: 'Low arm — watch the toes!' },
    bouncer:  { label: 'BOUNCER',    travel: 1150, window: 1.0, loftMod: 18,  curve: 0,    col: 0xffa63d, stumpP: 0.10, cue: 'High arm — it climbs!' },
    slower:   { label: 'SLOWER BALL',travel: 1500, window: 1.0, loftMod: 8,   curve: 0,    col: 0xb98cff, stumpP: 0.25, cue: 'Palm shows — wait for it...', deceive: 1 },
    inswing:  { label: 'INSWINGER',  travel: 1200, window: 1.0, loftMod: 0,   curve: -150, col: 0x5ad1ff, stumpP: 0.45, cue: 'Seam tilts in — guard the pads!' },
    outswing: { label: 'OUTSWINGER', travel: 1200, window: 1.0, loftMod: 0,   curve: 150,  col: 0x5affc8, stumpP: 0.30, cue: 'Seam tilts away — stay back!' },
    doosra:   { label: 'DOOSRA',     travel: 1300, window: 0.9, loftMod: 4,   curve: 0,    col: 0xffd75a, stumpP: 0.35, cue: 'Mystery grip — read it late!', jink: 1 }
  },

  // 8 bot personalities. pace multiplies travel time (<1 = faster).
  bots: [
    { id: 'chintu', name: 'Chintu', title: 'Gali Part-Timer', pace: 1.18, read: 0.95, wideP: 0.08, nbP: 0.06, color: 0x7ddf64,
      mix: { yorker: 1, bouncer: 1, slower: 3, inswing: 1, outswing: 1, doosra: 1 },
      banter: { start: ['Easy game, champ!', 'I will go slow on you.'], wicket: ['Got you!', 'Chintu strikes!'], six: ['Ouch... lucky shot!', 'My bad, my bad.'], win: ['Told you!', 'Come back anytime!'] } },
    { id: 'yorker', name: 'Chacha Yorker', title: 'Toe Crusher', pace: 1.0, read: 0.8, wideP: 0.04, nbP: 0.03, color: 0xff8a5a,
      mix: { yorker: 5, bouncer: 1, slower: 2, inswing: 2, outswing: 1, doosra: 1 },
      banter: { start: ['No mercy, champ. Yorker time.', 'Guard those toes!'], wicket: ['Timber! Chacha always delivers.', 'Told you — toes!'], six: ['Even Chacha misses one...', 'Hmm. Again!'], win: ['Experience wins.', 'Respect your elders!'] } },
    { id: 'shahid', name: 'Speedy Shahid', title: 'Raw Pace', pace: 0.82, read: 0.7, wideP: 0.05, nbP: 0.04, color: 0x5ad1ff,
      mix: { yorker: 2, bouncer: 3, slower: 1, inswing: 2, outswing: 2, doosra: 1 },
      banter: { start: ['Too fast for you!', 'Blink and miss it.'], wicket: ['Pace is pace!', 'Back to the gali!'], six: ['Okay... that was quick hands.', 'Lucky!'], win: ['Speed kills.', 'Shahid express!'] } },
    { id: 'daniyal', name: 'Doosra Daniyal', title: 'Mystery Spinner', pace: 1.05, read: 0.55, wideP: 0.04, nbP: 0.03, color: 0xb98cff,
      mix: { yorker: 1, bouncer: 1, slower: 2, inswing: 1, outswing: 1, doosra: 5 },
      banter: { start: ['Read me if you can.', 'Which way? Guess.'], wicket: ['Mystery solved — you are out!', 'The doosra never lies.'], six: ['You read that one...', 'Impossible!'], win: ['Spin to win.', 'Too clever!'] } },
    { id: 'bilal', name: 'Bouncer Bilal', title: 'Head Hunter', pace: 0.95, read: 0.75, wideP: 0.05, nbP: 0.04, color: 0xffa63d,
      mix: { yorker: 1, bouncer: 5, slower: 2, inswing: 1, outswing: 2, doosra: 1 },
      banter: { start: ['Duck, champ!', 'Short stuff all day.'], wicket: ['Helmet check!', 'Too hot to handle.'], six: ['Hooked... nicely done.', 'Okay, you can hook.'], win: ['Bounced out!', 'Short and sweet.'] } },
    { id: 'sultan', name: 'Swing Sultan', title: 'Late Swing King', pace: 1.0, read: 0.65, wideP: 0.06, nbP: 0.03, color: 0x5affc8,
      mix: { yorker: 1, bouncer: 1, slower: 1, inswing: 4, outswing: 4, doosra: 1 },
      banter: { start: ['It swings late, champ.', 'Watch the shine.'], wicket: ['Swung a mile!', 'Late swing, early shower.'], six: ['Against the swing... wow.', 'That was not the plan.'], win: ['The Sultan reigns.', 'Swing is king!'] } },
    { id: 'tariq', name: 'Tez Tariq', title: 'Wide-Yorker Ace', pace: 0.88, read: 0.6, wideP: 0.07, nbP: 0.05, color: 0xff5a8a,
      mix: { yorker: 4, bouncer: 2, slower: 2, inswing: 1, outswing: 3, doosra: 1 },
      banter: { start: ['Wide yorkers. Good luck reaching.', 'Precision pace!'], wicket: ['Nailed it!', 'Blockhole!'], six: ['Off my best ball?!', 'Unbelievable.'], win: ['Too sharp!', 'Tariq too tez!'] } },
    { id: 'badshah', name: 'Gali Ka Badshah', title: 'Street Legend', pace: 0.8, read: 0.45, wideP: 0.02, nbP: 0.02, color: 0xffd75a,
      mix: { yorker: 3, bouncer: 3, slower: 3, inswing: 3, outswing: 3, doosra: 3 },
      banter: { start: ['So. You reached the final.', 'The crown stays here.'], wicket: ['The Badshah provides.', 'Kneel, champ.'], six: ['...Impressive. Once.', 'You dare?!'], win: ['Still the Badshah.', 'The street remembers!'] } }
  ],

  superOver: { balls: 6 },
  timeAttack: { duration: 60, baseGap: 2400, minGap: 1350 },

  ui: {
    gold: 0xffca7a, cream: '#fff6e8', panel: 0x241a38, panelAlpha: 0.88,
    green: '#7ddf64', red: '#ff6b6b'
  }
};
if (typeof module !== 'undefined' && module.exports) module.exports = GCConfig;
