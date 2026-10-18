# SKYLINE STACK — VERTICAL SLICE (Batch 2, 2026-10-18)
One-tap precision tower stacker where the tower comes alive. Portrait, one-thumb, fully playable.

## What is playable in this slice
- **Endless stacking core:** a crane carriage slides on its rail while the floor hangs from a cable
  with true pendulum physics (driven by carriage acceleration + wind). Tap anywhere / Space / click
  to drop. A live dashed drop-guide + landing brackets always show where the floor will land.
- **Three drop outcomes:**
  - **PERFECT** (dead-center): the floor *grows back wider*, light-bloom flash, chime that rises
    in pitch with your combo, floating "PERFECT ×n".
  - **SAVED!** (near-miss): magnet-snap pulls the floor into place during a slow-mo beat —
    streak particles converge, big "SAVED!" text.
  - **Shear / miss:** overhang shears off as tumbling debris; a total miss tumbles the block and
    ends the run with a crash.
- **Combo/flow:** consecutive perfects build a ×N COMBO badge (saved keeps it alive, shear resets it).
- **Living tower:** every 5 floors a tenant family moves in — windows flick on warm, one of 6
  animated window-stories plays (cat, reader, party with confetti + giggle, plants, stargazer,
  chef), and a toast names the family ("Floor 20 · The Patels moved in — housewarming party!").
- **Rooftop milestones** (permanent, on the earning floor): garden at 25, sky pool at 50,
  antenna with blinking beacon at 100.
- **Wind nights from floor 15:** gusts telegraphed 1.6s ahead ("Gust incoming…", pulsing meter,
  rising howl) — the tower bends on spring physics, the cable gets pushed, falling blocks drift.
  The wind meter (strength + direction arrow) keeps it fair.
- **3 tower themes:** Neon Karachi (default), Desert Oasis (reach 30 floors), Monsoon Mumbai
  (reach 60 floors) — each with its own dusk sky, skyline/parallax, window palette, weather
  (rain + lightning / heat shimmer), and music mood. Theme select with lock states.
- **Readable progression:** stars at 25/50/100/150/200 floors, best height per theme + overall
  in localStorage, one-tap **share card** (1080×1350 PNG of your actual tower).
- **Understandability:** How-to-Play screen with 3 *animated* illustrated steps; first-run
  guided tutorial (first 5 drops: pulsing ring shows exactly when to tap, "NOW!" when lined up);
  the goal "Build as tall as you can!" always on screen.
- **Game feel:** trauma-based screen shake, pooled particles (bloom sparks, dust, confetti,
  magnet streaks), slow-mo, eased camera, floating texts, ambient life (drifting clouds,
  flapping birds, flickering windows, twinkling stars), fully synthesized WebAudio music loop
  (pad + pluck + bass) and 10 SFX. Mute toggle.
- **Robustness:** staged loader with live % (Start waits until ready), honest "Try again" on boot
  error, auto-pause when tab hides, full-bleed portrait (no black bars), touch + desktop,
  60fps budget with automatic degradation.

## Controls
- Touch: tap anywhere to drop. Desktop: Space or click. P/Esc pause, M mute, R via pause menu.

## Tech
- Vanilla JS + Canvas 2D, **zero external libraries, zero external requests**, single 90KB HTML file.
- `src/`: logic.js (pure, tested), audio.js (WebAudio synth), game.js, styles.css, index.html.
- `dist/skyline-stack.html`: the shippable artifact (built by `node build.js`, audited).

## What is NOT in this slice (full-vision backlog)
Districts beyond the 3 themes, tenant story arcs across sessions, crane garage/skins,
daily seeded tower, storm seasons beyond monsoon, photo mode filters, scrollable tower directory.
