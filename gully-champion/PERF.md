# GULLY CHAMPION — PERFORMANCE BUDGETS (set before building, 2026-10-18)

Target: **60fps on low-end Android** (2022-era), portrait, real phone browsers.

## Entity budgets
| System | Budget | Notes |
|---|---|---|
| Ball | 1 | + 5 trail ghosts (pooled) |
| Bowler / batter | 1 each | vector containers, ~8 parts each |
| Fielders | <= 9 | vector containers, pooled; idle hidden offscreen |
| Crowd silhouettes | <= 60 | 3 shared textures, phase-offset sway |
| Active particles | <= 200 | single pooled emitter systems per type |
| Parallax bg layers | 3 per gali | static textures generated once per gali |
| Draw calls | <= ~60 | flat scene graph, no nested containers beyond 2 deep |

## Asset budgets
- Image assets: **0** — everything procedural (Phaser Graphics -> textures).
- Audio files: **0** — WebAudio synthesized only.
- Final file: **ONE** self-contained HTML, Phaser 3.60.0 inlined, **< 2MB**,
  **zero external requests**.

## Runtime rules
- All particles pooled — no per-frame allocation in the hot loop.
- Crowd sway via cheap sine offsets, not per-sprite tweens (<= 60 objects).
- Physics: custom minimal 2.5D ball integration (no arcade physics needed).
- Textures generated once per scene/gali, then reused.
- AudioContext created on first user gesture; every audio call guarded.
- Portrait logical 720x1280, Scale.FIT; backgrounds overscan 800x1400 so no
  black bars on any aspect ratio.
- Buttons >= 96px touch targets, inside safe area at 360x640 and 390x844.
