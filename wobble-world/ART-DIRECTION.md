# WOBBLE WORLD — Art Direction (LOCKED 2026-10-18)

> Everything the player touches must feel alive, tactile and expensive.
> Flat boxes and programmer-art are BANNED. When in doubt: more gloss,
> more squash, more wobble — never more clutter.

## 1. The Jelly Look (the whole brand)

Every soft creature / jelly toy is rendered the same signature way:

1. **Body** — closed smooth curve through physics nodes (quadratic via
   midpoints, never polygon). Fill: vertical linear gradient —
   `lighten(color, +35%)` at top → `color` at 45% → `darken(color, -18%)`
   at bottom. Global alpha 0.92 (translucent, not opaque).
2. **Inner glow** — same path scaled 0.72 about the centroid, filled with
   white at 0.18 alpha, offset (−8%, −12%) — fakes subsurface scattering.
3. **Refraction highlight** — a rotated ellipse near the top-left, white
   0.55 alpha, blurred by drawing it small and soft (no shadowBlur; a
   radial-gradient sprite). Plus one tiny sharp specular dot, white 0.9.
4. **Rim** — stroke the body path with `darken(color, -30%)` at 0.5 alpha,
   lineWidth = radius × 0.06. Makes jelly read against pastel backgrounds.
5. **Drips** — Sticky personality (and goo pools) get 2–3 small circles
   hanging off the bottom edge, same gradient, slight independent wobble.

## 2. Squash & Stretch (non-negotiable)

- On **grab**: creature stretches toward the pointer (nodes on the grab
  side get pulled); a faint elastic tether line connects finger to body.
- On **drag**: body elongates along the drag vector; volume preserved
  visually (widen perpendicular). Max stretch ~2.6× rest radius (gameplay
  cap; giggle moment at 2.2×).
- On **release (fling)**: motion-blur stretch along velocity for ~120 ms,
  then springy overshoot settle.
- On **landing**: squash along impact normal proportional to impact speed
  (up to 45%), with a 2–3 Hz decaying wobble for ~0.8 s.
- **No popping, ever.** All spawns scale 0→1 with back-ease overshoot;
  despawns shrink with a giggle sound. UI panels slide+fade with
  easeOutCubic; toasts bounce in.

## 3. Diorama Worlds (pastel toy-boxes)

- Each diorama = soft vertical gradient backdrop (two pastel stops) +
  3–5 large soft background shapes (hills, arches, clouds) drawn with
  radial gradients, slightly desaturated so toys pop.
- **Soft shadows**: every creature/toy gets an ellipse shadow on the
  ground plane — radial gradient black 0.16→0, width scales with body
  width, alpha fades as the body rises. Cheap, no shadowBlur.
- **Ambient life**: 12–20 drifting motes (tiny white/pastel circles, slow
  sine drift) + occasional rising bubbles in water dioramas. Never
  interactive, always alive.
- **Vignette**: very subtle radial darkening at corners (0.08) for
  "expensive" framing. Never obscures buttons.

### Per-diorama palettes
| Diorama | Sky | Accents |
|---|---|---|
| Jelly Kitchen | warm cream → peach | strawberry red, mint, honey |
| Bounce Canyon | apricot → rose | terracotta, teal trampolines |
| Magnet Cave | lavender dusk → deep plum | glowing cyan orbs, amber crystals |
| Bubble Bath | aqua → baby blue | white foam, rainbow bubbles |
| Spring Garden | mint → leaf green | flower pink/yellow, bark brown |
| Pillow Fort | dusk blue → cozy indigo | star yellow, blanket coral |

## 4. Toys

- **Trampolines**: teal jelly membrane (sags under weight via the same
  node system), wooden-look rim arcs, coil springs drawn as zigzags that
  compress on bounce. Boing ring particle on every bounce.
- **Domino jelly blocks**: rounded-rect soft quads, alternating
  strawberry/mint, wobble when nudged, topple with squash.
- **Magnet orbs**: glowing cyan spheres with animated dashed orbit rings
  and drifting spark particles; goo balls are small chrome-ish blobs.
- **Seesaw**: rounded plank (candy stripes), fulcrum as a jelly dome;
  plank tilts with spring easing, never snaps.
- **Goo pools**: layered ellipses (dark base → color → glossy top
  highlight), animated ripple rings, drip particles at edges.
- **Bubble pipes & bubbles**: bubbles = thin white stroke circle +
  rainbow arc highlight + tiny sparkle; wobble as they rise.
- **Spring flowers**: stem (quadratic curve), petals (ellipses), center
  is a trampoline bud that squashes before launch.
- **Pillows**: rounded rects with button dimples and seam strokes, slight
  idle "breathing" scale (1 ± 0.01, 0.4 Hz) — cozy.
- **Goo jars**: glass jar (white strokes + shine), colored goo fill with
  meniscus curve, wooden spoon. Selected jar gets a pulsing glow ring.

## 5. Creatures (4 personalities, visually distinct)

| Personality | Shape | Color | Face | Signature |
|---|---|---|---|---|
| Bouncy "Boing" | perfect round, 14 nodes | bubblegum pink | big round eyes, open smile | extra squash on bounce, motion arcs |
| Sticky "Gloopy" | teardrop (tall), 12 nodes | mint green | sleepy happy eyes, small smile | drips under body, leaves fading goo footprints |
| Sleepy "Dozie" | wide chubby, 12 nodes | lavender | closed curved eyes, tiny mouth | "Z" particles while dozing, slow blink |
| Hyper "Zippy" | star-ish blob, 10 nodes | tangerine | > < excited eyes, big grin | speed lines, vibrates slightly at rest |

Eyes look toward velocity (pupil offset). Mouth morphs: smile → "o"
when stretched beyond 1.6× → wavy when dizzy (spin).

## 6. Particles

- **Boing rings**: expanding stroked circles, teal/white, 0.35 s life.
- **Splat stars**: 6-point soft stars on hard landings.
- **Goo drips**: gravity drops from pools/jars, tiny splash on land.
- **Sparkles**: 4-point twinkles on giggle moments, magnet snaps, mixer.
- **Zzz**: floating "Z" letters (drawn text, soft white) from sleepy heads.
- **Hearts**: tiny hearts when a creature is petted (slow drag without fling).
  (Text glyphs Z/♥ are font-drawn, not image assets.)

## 7. UI

- Rounded everything (radius ≥ 18 px), pastel panels with 0.95 alpha,
  soft drop shadow via offset translucent rounded rect (no shadowBlur).
- Buttons: jelly style — gradient fill, gloss highlight, squash 0.92 on
  press, spring back on release. Labels in a rounded sans (system font
  stack), dark plum text (#4a3b5c).
- Title logo: the words "WOBBLE WORLD" with each letter on its own
  spring, idly bouncing; two mascot blobs flank it.
- HUD: top bar with diorama name + giggle counter (★ n/18); bottom hint
  bar (rounded, "Try this: …"); circular icon buttons (journal, mixer,
  worlds, sound) — always in device space, ≥ 56 px touch targets.
- Toasts: bottom-center, bounce in, auto-dismiss 2.2 s.
- Tutorial hints: pulsing dashed rings + bouncing arrow + hand-drawn
  style text bubble. Pulse = 1.2 Hz sine scale.

## 8. Motion Principles

- Ease everything: easeOutBack for pop-ins, easeOutCubic for slides,
  spring (stiffness 180, damping 14) for anything attached to physics.
- Anticipation: trampolines squash 80 ms before launching; flowers dip
  before firing; dominoes lean before toppling.
- Follow-through: every impulse ends in 2–3 decaying wobble cycles.
- 60 fps: particle pool 220, zero hot-loop allocation, gradients cached
  per color (not per frame), decor pre-rendered to offscreen canvas per
  diorama per resize.
