# RUCKUS RAMPAGE — PERFORMANCE BUDGETS (set 2026-10-18 ~03:05 PKT, BEFORE code)

Target: 60fps on mid-range Android Chrome; 30fps minimum in the heaviest moment
(6 fighters + slow-mo KO + confetti). No memory leak over 10 minutes of play.

## Entity budgets (hard caps)
| System | Cap | Notes |
|---|---|---|
| Fighters | 6 | player + 5 bots (DUMMY only in practice) |
| Weapons (loose/held) | 8 | spawn pads recycle; thrown chappals pooled |
| Particles (pooled) | 220 | star-bursts, feathers, confetti, poofs, trails |
| Comic word pops | 12 | pooled text objects |
| Kill-feed lines | 5 | DOM-free, Phaser text, fade out |
| Rope segments | 4 sides x 16 | cheap spring sim, drawn as one Graphics path each |
| Crowd silhouettes | 60 | PRE-RENDERED to one RenderTexture, animated by 2-frame bob via offset — no per-frame redraw |
| Collapsing tiles | 10 | |
| Bumper dhols | 3 | |

## Draw-call discipline
- Static arena (floor, posts, background) → pre-rendered to RenderTexture ONCE per theme.
- Fighters: 1 Graphics object each (body+limbs+face redrawn per frame = 6 Graphics).
- Ropes: 1 Graphics object for all 4 ropes. Particles: 1 Graphics (or Phaser particle
  emitter with a single generated texture). Dynamic total ≈ 12–15 Graphics redraws/frame.
- No per-frame texture generation. No per-frame object allocation in the hot loop
  (reuse Vector/Point temps; pool everything).

## Physics budget
- Custom knockback/velocity sim (not arcade physics): 6 bodies, circle-vs-circle +
  circle-vs-platform-edge, O(n²) with n=6 is trivial. Fixed timestep 120Hz accumulator,
  render interpolation not needed at this scale — clamp dt instead.

## Audio budget
- WebAudio synth only; music = scheduled pattern (lookahead scheduler, no per-frame cost);
  SFX = short synthesized buffers created once, reused. Master gain + mute toggle.
  AudioContext created/resumed on first user gesture (mobile autoplay rule).

## Size budget (dist single HTML, zero external requests)
- Phaser 3.60.0 min: ~1.11 MB (inlined from global-libs at build time).
- Game code target: ≤ 300 KB unminified → dist ≤ ~1.45 MB (< 1.5 MB target).
- If over: strip comments at build, then shorten — never cut features silently.

## Loading budget
- Everything code-drawn: loading = generating textures + warming audio, reported with
  REAL milestones (not fake %). Target: playable < 5s on mid-range Android.
- START button enabled only when ready; any init failure → honest TRY AGAIN button,
  never a dead-end error screen.
