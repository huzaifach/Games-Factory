# GULLY CHAMPION — ART DIRECTION (LOCKED 2026-10-18)

All graphics are 100% code-drawn. Zero image assets. The HD look comes from
light, not polycount: layered gradients, glow, bokeh, soft shadows.

## Visual pillars
1. **Golden-hour warmth everywhere** — even night scenes glow warm.
2. **Rounded organic shapes only** — capsules, circles, blobs. Flat boxes and
   programmer-art grids are BANNED.
3. **Light does the heavy lifting** — gradients, additive glow, bokeh,
   long soft shadows.
4. **Everything is alive** — every scene has ambient motion (crowd sway,
   dust motes, light flicker, flag flutter). Nothing static.
5. **No popping** — every state change animates (tweens, never instant
   show/hide).

## Galli palettes
- **rooftop (Rooftop at Sunset, default):** sky `#2b1a4d -> #b3477f -> #ff9a5a -> #ffd29d`;
  low sun disc with halo; parapet wall `#4a2c5a`; water tanks + antenna
  silhouettes; crowd = dark plum silhouettes; dust motes warm.
- **beach (Beach):** sky `#0f4c81 -> #3fa7c4 -> #ffe3a3`; teal sea band with
  foam shimmer; sand `#f2d49b`; palm silhouettes; gulls as animated arcs.
- **mountain (Mountain Road):** sky `#1c2f5e -> #4a7f9e -> #cfe8d8`;
  layered pine ridges (blue-green, atmospheric fade); winding road ribbon;
  prayer-flag strings fluttering.
- **night (Night Street, fairy lights):** sky `#060a24 -> #141b4d -> #2b2a6b`;
  warm fairy-light strings (`#ffca7a` bokeh, additive, flickering);
  crowd silhouettes dotted with tiny phone-screen glows; shop awnings.

## Rendering rules
- **Backgrounds:** 3 parallax layers per gali, drawn overscan at 800x1400 for
  the 720x1280 logical canvas (full-bleed on any phone aspect — no black bars).
- **Characters:** capsule torso, circle head, capsule limbs, assembled in
  containers with NAMED parts (head, torso, armF, armB, legF, legB, bat) so
  squash-and-stretch and swing animations are possible. Soft ellipse shadows
  under every character. Team tints via color, never new geometry.
- **Ball:** white tape-ball with red seam arc, outer glow, motion-blur trail
  (3-5 fading ghosts). In flight it scales with height (z).
- **Stumps:** three rounded bails + stumps, warm wood gradient.
- **Particles (all pooled):** dust (soft tan circles), confetti (rotating rects
  in truck-art jewel tones), sparks (additive), bokeh (large soft circles).
- **Crowd:** layered dark silhouettes (2-3 variants), perpetual sine-wave sway
  with phase offsets; jump burst on 4s/6s; Mexican-wave sweep on wickets.

## UI language
- Rounded panels (radius 24), warm dark `#241a38` at ~88% alpha, gold
  accents `#ffca7a`, cream text `#fff6e8`.
- Title: big rounded golden letterforms with soft glow (drawn text, styled).
- Buttons: min touch target 96px, press = scale 0.94 + glow pulse + click sound.
- Screen transitions: fade + slight scale (never hard cuts).
- Scorecard: over-by-over strip, ball dots (4 = green, 6 = gold burst, W = red).

## Animation language
- Easing: `Back.easeOut` for pops, `Quad.easeInOut` for moves,
  elastic-ish overshoot for the SIX moment.
- **Hit-pause:** 90ms freeze on perfect contact.
- **GULLY SIX slow-mo:** time-scale 0.25 for ~700ms, confetti cannons,
  screen shake, crowd roar.
- Bowler run-up: accelerating ease-in with squash on plant foot.
- Batting swing: anticipation crouch (squash) -> explosive swing (stretch).
- Fielders: eased runs (accel/decel, no sliding), dive = stretch + dust burst.
