# BAZAAR SIEGE — PERFORMANCE BUDGETS (set before building, 2026-10-18)

Target: **60fps on low-end Android** (2022-era), portrait, real phone browsers.

## Entity budgets
| System | Budget | Notes |
|---|---|---|
| Active enemies | <= 70 | includes split imp-lings, swarm rings, boss escorts |
| Active projectiles | <= 160 | pooled per type (rockets, blades, chai blobs, lantern bombs) |
| Active particles | <= 250 | pooled: petals, sparks, smoke, rain, dust, splash rings |
| Damage numbers | <= 24 | pooled text objects, reused |
| Turrets | <= 9 | 9 rooftop slots max; vector containers, ~6 parts each |
| Fairy-light bulbs | <= 80 | single texture, per-bulb alpha sine (cheap, no tweens) |
| Lanterns (ambient) | <= 24 | sway via sine offsets |
| Rain streaks | <= 120 | pooled, monsoon only |
| Draw calls | <= ~70 | flat scene graph; containers max 2 deep; textures generated once |
| Active tweens | <= 60 | damage numbers/particles use pooled manual updates where hot |

## Asset budgets
- Image assets: **0** — everything procedural (Phaser Graphics → textures, generated once at boot).
- Audio files: **0** — WebAudio synthesized only; nodes created per-hit from a shared pool where hot (dhol loop = scheduled oscillators, not per-frame allocs).
- Final file: **ONE** self-contained HTML, Phaser 3.60.0 inlined, **< 2MB**, **zero external requests**.

## Runtime rules
- All projectiles, particles, damage numbers pooled — no allocation in the hot loop.
- Enemy movement: custom lane integration (x decreases at speed × modifiers), NOT the physics engine.
- Targeting: turrets scan enemies at fire-rate intervals (staggered), not per frame.
- Textures generated once per boot; never re-generated per wave.
- AudioContext created on first user gesture; every audio call guarded with try/catch + ready checks.
- Portrait logical 720×1280, Scale.FIT; backgrounds overscan 800×1400 (no black bars on any aspect).
- HUD + dock inside safe area; all buttons ≥ 88px touch targets.
- Speed 2x implemented via update multiplier (no duplicate logic paths).
- Pause = full scene pause (tweens + timers), music ducks.

## Layout map (720×1280 logical)
- HUD bar: y 0–110 (coins, lives, wave, speed/pause).
- Hint line pill: y 116–156.
- Battlefield: y 160–970. Lanes at y = 420, 600, 780. Enemies enter x = 760, exit (leak) at x = 40 (bazaar gate, left).
- 9 rooftop slots (hand-placed, x/y): (150,300) (360,300) (570,300) / (150,510) (360,510) (570,510) / (150,690) (360,690) (570,690). Slots sit between/above lanes; slot art = small stall rooftop with striped mini-awning.
- 3 stalls (upgradable): (150,890) (360,890) (570,890) — each buffs adjacent slots: stall 0 → slots (150,690),(360,690); stall 1 → slots (150,690),(360,690),(570,690)... (adjacency defined exactly in data.js; rule: a stall buffs the 3 slots in the row directly above it).
- Wedding parade path: y = 230, marches right-to-left across the top.
- Bottom dock: y 980–1280 — 6 turret cards (row of 6, each ~110px wide), then a row with: Scout (wave preview) button, Stall hint, and the big NEXT WAVE / START button (full-width, ≥96px tall).
