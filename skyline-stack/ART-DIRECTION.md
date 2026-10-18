# SKYLINE STACK — ART DIRECTION (LOCKED 2026-10-18 ~03:10 PKT)
100% code-drawn. Zero image assets. No flat boxes, no programmer-art grids — every surface gets
gradient, trim glow, and ambient life. Portrait-first, full-bleed.

## Global principles
- **Dusk, always golden:** every theme is a dusk variant — warm horizon glow, deep zenith.
  The sky is a cached vertical gradient + sun/moon glow + 60 twinkling stars (upper third).
- **No shadowBlur in the hot path.** Glow = layered alpha rects/arcs pre-computed where possible.
  Bloom moments may use short-lived radial gradients (pooled, capped).
- **Neon trim language:** every placed floor gets a 3px luminous top edge + 1px side falloff in the
  theme's trim color. The trim is the game's signature — it must read at a glance.
- **Windows tell the story:** 2 rows of windows per floor; unlit = deep indigo glass with a faint
  sky reflection stripe; lit = warm gradient (amber core → soft halo). Lit windows flicker
  subtly (±6% alpha, slow). Tenant stories are black silhouettes *inside* lit windows.
- **Typography:** system stack `"Avenir Next","Segoe UI",system-ui,sans-serif`. Display numbers
  (height) are extra-bold with a soft dark outline (strokeText) for readability over sky.
  All-caps micro-labels use letter-spacing.
- **Motion language:** everything eases (cubic out for UI, elastic-ish overshoot only for SAVED!
  snap). Nothing pops: tenants fade/slide in, decorations grow with a 0.4s scale ease, toasts
  slide+fade.

## Theme 1 — NEON KARACHI (default)
- Sky: `#160f38` (zenith) → `#4a1e6e` → `#c94f7c` → `#ff8a4d` (horizon). Low sun: big soft radial
  `#ffb347` at 18% above horizon, half-dipped.
- Skyline (3 parallax layers, far→near): `#2a1f5c`, `#372a72`, `#463489`; windows `#ffd97a`
  (30% lit, warm). Occasional rooftop red beacon blinking.
- Floor body: vertical gradient `#4a3670` → `#33255a`; trim: teal `#39f5d6` with magenta `#ff4fd8`
  under-glow (2 layers: 3px teal core, 6px magenta at 25% alpha beneath).
- Clouds: mauve `#6e4a8e` blobs, alpha 0.5, slow drift.
- Birds: dark swift silhouettes, occasional V flocks.
- Music mood: chill synthwave-ish pad (minor 9ths), soft pluck.

## Theme 2 — DESERT OASIS (unlock: reach 30 floors)
- Sky: `#2b1a4e` → `#8e3a68` → `#e8765a` → `#ffc46b`. Sun higher, hazier.
- Skyline replaced by **dune layers** (smooth sine ridges): `#5c2f5e`, `#7a3f63`, `#96604f`;
  a distant mosque-like dome + minaret silhouette on the far layer (simple arcs — respectful,
  abstract), palm clusters on near layer.
- Floor body: sandstone `#8a5a4a` → `#5e3a44`; trim: molten copper `#ff9e5c` core + `#ffd98a`
  halo. Windows lit: `#ffe6b0`; some windows turquoise `#7df5e8` (oasis glass).
- Extra life: heat-shimmer particles rising near horizon; occasional shooting star.
- Music mood: same progression, warmer pad voicing + soft hand-drum-ish tick (synthesized).

## Theme 3 — MONSOON MUMBAI (unlock: reach 60 floors)
- Sky: `#0b1734` → `#1d3a63` → `#3f6a8e` → `#7fa3b8`. Moon: pale disc `#e8f2ff` with halo,
  upper-left; clouds darker and faster.
- Skyline: `#1c2f52`, `#27436e`, `#33567f`; windows `#cfe8ff` (cool) mixed with warm `#ffe9b0`;
  rain streaks (120 thin lines, wind-slanted) across the whole scene, splash ticks at ground.
- Floor body: rain-slick slate `#3d4c66` → `#2a3550`; trim: electric cyan `#5ce1ff` core.
  Wet sheen: diagonal white alpha stripe on floor body.
- Extra life: distant lightning flicker every 9–16s (sky flash 120ms + soft thunder rumble synth).
- Music mood: sparser, airier pad + rain-noise bed under the music.

## The crane
- Rail: dark steel beam spanning the top with rivet dots + yellow/black hazard end-caps.
- Carriage: rounded steel block with 4 wheels on the rail, a hanging hook block, side lamp
  (warm glow dot). Carriage tilts ±3° with its velocity (juice, not physics).
- Cable: 2px dark line with a lighter 1px highlight; natural pendulum sway — the sway IS the
  readability of timing.
- The carried floor: a full mini floor (body + trim + windows dark) hanging from a spreader bar.
- Drop guide: dashed vertical line (theme trim color, 40% alpha) from block to tower top +
  landing brackets on the target floor; during tutorial the guide is brighter with a pulsing ring.

## The tower
- Base: a wider foundation podium (2 stacked slabs + entrance glow + tiny door) on the ground —
  the tower grows from the podium, never from dirt.
- Floors: 26px tall; width varies with play. New floors slide down from the block with a 120ms
  ease (no pop); perfect-grown floors visibly widen over 250ms.
- Rooftop decorations (earned, permanent, on the earning floor):
  - **Garden (25):** 3 planters + 5–7 leaves swaying on sine; tiny flowers (dots).
  - **Pool (50):** inset blue rect `#3fc1ff`→`#1a7fd4` with 2 animated shimmer arcs + ladder.
  - **Antenna (100):** dark mast 46px + cross-arms + red beacon pulsing (2s period) + guy wires.
- Tenant windows: lit windows get one of 6 silhouette stories (see below); stories animate
  ~6s on move-in, then settle to a static lit window with a subtle occupant hint.

## Tenant stories (silhouettes inside lit windows, black #141021)
1. **Cat** — cat silhouette (body arc + tail curve + ear triangles) walks across the window, pauses,
   tail sways; toast: "moved in — the cat claims the sunny window."
2. **Reader** — rocking chair (arc rockers) + seated reader + lamp glow; gentle rock loop.
3. **Party** — 3 windows cycle hue (HSL rotate) + confetti burst + giggle SFX.
4. **Plants** — 3 hanging planters swaying; leaves bob.
5. **Stargazer** — telescope (tube on tripod) angled up + twinkling star in window.
6. **Chef** — pot + 3 steam curls rising, looping.
- Family names pool: the Ahmeds, the Patels, the Khans, the Sharmas, the Alis, the D'Souzas,
  the Rahmans, the Iyers, the Balochs, the Siddiquis. Toast format:
  `Floor {n} · {family} moved in — {story kicker}!`

## Particles & juice
- **Bloom (perfect):** 1 expanding ring (trim color) + 12–18 sparks (additive-ish alpha) + radial
  flash 140ms + floating text.
- **SAVED!:** 10 magnet streaks converging on the floor + 0.25× slow-mo 0.5s + big condensed
  "SAVED!" text with elastic scale-in.
- **Shear:** 8–12 dust puffs at the cut + debris chunk (tumbles with rotation, fades).
- **Landing dust:** 4–6 soft puffs, always (grounds every drop).
- **Ambient:** clouds (6 blobs), birds (flocks of 5, every ~20s), window flicker, star twinkle,
  rain (monsoon), heat shimmer (desert), sun glow pulse.
- **Screen shake:** trauma system — perfect 0.25, shear 0.35, miss 0.7, decay 1.6/s, offset
  ≤ 10px, rotational 0.4°.

## UI / DOM
- Loader: deep-navy screen, centered logo mark (stacked rounded bars forming a tower glyph),
  title "SKYLINE STACK", staged status line, progress bar (trim gradient), % readout.
- Menu: theme gradient sky as backdrop (live canvas behind, slowly drifting), title, best-height
  chip, big START BUILDING button (thumb-sized, 64px tall), theme cards row (art swatch +
  name + lock state/requirement), How to Play button, mute toggle.
- HUD (in-game, DOM top bar): left = height `27` + `FLOORS` + `BEST 41`; center = goal
  "Build as tall as you can!"; right = pause + mute round buttons. Below: wind meter
  (hidden until floor 12; "Wind starts at floor 15" teaser). Combo badge floats in canvas.
- Toasts: bottom-center pill, slide-up + fade, 2.6s.
- Banner: center-screen for stars/milestones (scale-in, 1.6s).
- Game over: panel with height (huge), NEW BEST fanfare state, stars earned, buttons:
  Build Again / Change Theme / Share Card / Menu.
- Pause: dim + panel (Resume / Restart / Menu / How to Play).
- How-to-Play: 3 cards, each with a live animated mini-demo canvas + one-line caption.
- Error: full-screen honest panel — "Something went wrong." + Try Again button (reloads).

## What "HD" means here (acceptance)
Zoom the canvas 2×: edges stay smooth (vector-drawn), gradients band-free (multi-stop),
no pixelated sprites (there are none), text crisp (DOM or stroked canvas text).
