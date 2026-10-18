# WOBBLE WORLD — Build Ledger

**Research rank 7 · Batch 2, item 3 · Folder:** `~/workspace/game-factory/wobble-world/`
**Stack:** 100% hand-written vanilla JS + Canvas 2D + WebAudio. Zero frameworks,
zero image assets, zero external requests. (Custom 2D spring physics needs no
library — written from scratch per the factory's global-libs rule; nothing to
download, nothing to note in `global-libs/README.md`.)
**Target:** single self-contained HTML under 1.5 MB, 60 fps on a mid-range phone,
touch-first + desktop mouse.

---

## 1. The Full Vision (where this can go)

Wobble World is a **soft-body jelly physics toy sandbox** — a wholesome,
kid-safe, endlessly giggly toy box where everything you touch is alive.
Grab a jelly creature, stretch it like taffy, fling it across a pastel
diorama, and watch it splat, wobble and reform with springy joy.

### Vision pillars
1. **Tactile joy is the product.** Every touch must feel expensive: glossy
   translucent jelly, refraction-style highlights, squash-and-stretch on
   EVERY interaction, deformation under the finger, fling with
   stretch-and-splat, wobble that settles with real spring physics.
   Flat boxes and programmer-art are banned. Cut a feature before shipping
   it feeling cheap.
2. **Understandable, no nonsense.** A first-time player (even a child) must
   get it in 30 seconds: grab → stretch → fling. One-line-explainable
   interactions only. Mandatory: a How-to-Play screen with 3 illustrated
   steps, a guided first diorama with pulsing hints in order, a discovery
   journal showing found/total giggle moments, and a HUD that always answers
   "what do I do now?".
3. **Wholesome chaos.** No gore, no losing, no timers pressuring anyone.
   All giggle, all kid-safe. No gambling, no backend multiplayer, no
   levels/XP jargon — progression is stars, diorama unlocks and a
   collection journal.
4. **Creator bait.** The Creature Mixer (paint creatures with color-goo, mix
   two creatures' traits, name your creation) plus a snapshot moment are
   built for sharing clips and pictures.

### Full-scope feature list (the dream)
- Custom 2D spring-physics engine: soft-body blobs (Verlet nodes + distance
  constraints + pressure model), jelly platforms, trampoline membranes,
  goo pools with buoyancy/viscosity, magnet fields, seesaw rigid bodies,
  bubble buoyancy.
- **12 dioramas** (toy-box worlds), each hand-designed, each hiding 3+
  giggle moments (36+ total): Jelly Kitchen, Bounce Canyon, Magnet Cave,
  Bubble Bath, Spring Garden, Pillow Fort, plus future: Candy Clouds,
  Squeaky Bath Toys Harbor, Moon Cheese Crater, Noodle Forest, Marshmallow
  Volcano, Clockwork Toy Shop.
- **8 creature personalities** (Bouncy, Sticky, Sleepy, Hyper in the slice;
  future: Shy, Greedy, Copycat, Grumpy-but-lovable), each with a distinct
  hand-tuned shape, face, movement brain and voice-ish giggle.
- **Creature Mixer v2:** trait inheritance trees, family album of all your
  creations, shareable creature codes, seasonal goo colors.
- **Chain-reaction construction kit:** players place their own toys
  (dominoes, trampolines, seesaws, fans) and save contraptions.
- **Giggle Journal v2:** 36+ moments, completion stars per diorama, "giggle
  reel" auto-montage of your best moments.
- **Parent-friendly:** offline, no ads, no chat, no accounts, gentle audio.
- Seasonal diorama skins, haptic feedback on mobile, accessibility options
  (reduced motion, high contrast jelly).

---

## 2. Milestones & Honest % Complete

| Milestone | Scope | % of full vision |
|---|---|---|
| **M1 — Vertical slice (THIS BUILD)** | Custom spring engine (Verlet soft-bodies, PBD constraints, pressure model); 4 creature personalities with distinct shapes/behaviors; 6 hand-designed dioramas; 18 giggle moments with journal; Creature Mixer v1 (paint + mix + name + snapshot PNG); guided tutorial (How-to-Play + pulsing hints); full synth WebAudio (SFX + pad music); touch + mouse; responsive full-screen; loader with honest retry | **~45%** |
| M2 — Diorama pack 2 | 6 more dioramas (Candy Clouds → Clockwork Toy Shop), 18 more giggle moments, 4 new personalities | ~65% |
| M3 — Construction kit | Place-your-own toys, save/share contraptions, family album | ~80% |
| M4 — Polish & seasons | Seasonal skins, haptics, accessibility, giggle reel | 100% |

**This slice is deliberately BIG** (per Huzaifa's explicit order: expanded
vertical slices, never minimal). M1 alone is a complete, shippable-feeling
toy: everything listed in SLICE.md works end-to-end.

---

## 3. M1 Architecture

```
src/
  00-util.js       math, RNG, easing, color helpers
  01-audio.js      JellyAudio — synthesized SFX + generative pad music (WebAudio)
  02-physics.js    PNode, constraints, SoftBlob (Verlet ring + pressure),
                   JellyBlock (domino), Particle pool, World (substeps, colliders)
  03-creatures.js  Creature — 4 personalities, faces, wander AI, sleep/wake,
                   grab/stretch/fling handling, squash tracking
  04-toys.js       Trampoline, DominoTower, MagnetOrb + GooBall, Seesaw,
                   GooPool, BubblePipe + Bubble, SpringFlower, Pillow, GooJar
  05-dioramas.js   6 hand-designed layouts + 18 giggle-moment definitions
  06-mixer.js      Creature Mixer overlay (paint, mix, name, snapshot)
  07-ui.js         Screens (boot/title/howto/worlds/journal), HUD, tutorial
                   hints, toasts, DOM overlay (name input + snapshot card)
  08-game.js       Game — state machine, pointer input, camera, event bus,
                   giggle detection, save/load, main loop
  09-boot.js       staged loader, error surface with retry, test hooks
  style.css        page + canvas + DOM overlay styling
build.sh           concatenates src/ -> dist/index.html (single file)
test/
  harness.js       Node stub harness — physics sim, scripted interactions,
                   giggle triggering, mixer, journal (no browser needed)
```

### Key design decisions (locked)
- **Vanilla Canvas 2D, no Phaser.** A soft-body toy wants a custom
  renderer (glossy jelly gradients, refraction highlights) and a custom
  integrator; Phaser would add ~1.1 MB and fight the custom physics.
  Everything is code-drawn: zero image assets.
- **Fixed-camera toy boxes.** One screen per diorama, no scrolling — keeps
  every toy reachable, every button visible, and the "what do I do now?"
  question trivially answerable.
- **Event bus for giggle moments.** Toys/creatures emit semantic events
  (`bounce`, `splat`, `paint`, `snap`, `launch`…); diorama giggle
  definitions subscribe with counters/windows. Decouples detection from
  physics cleanly and is unit-testable.
- **PBD (position-based dynamics), not force springs.** Stable at large
  time steps on phones: distance constraints solved with iterations,
  pressure as an area constraint, Verlet integration, 2 substeps.
- **All UI text in English; all code/docs in English.** (Factory language rule.)

---

## 4. Performance Budgets (locked BEFORE code)

| Budget | Limit | Why |
|---|---|---|
| Soft creatures alive | ≤ 8 per diorama | Each = 12–14 nodes × constraints; keeps physics < 4 ms |
| Active particles | ≤ 220 pooled | Ring buffer, zero allocation in loop |
| Bubbles alive | ≤ 24 | Buoyancy checks are cheap but draws add up |
| Draw calls (shapes) | ≤ ~120/frame | Batched simple paths; no shadowBlur (use gradients) |
| Physics | 2 substeps × 3 iterations | Stable jelly at 60 Hz on mid phones |
| Frame time target | ≤ 12 ms JS | Leaves headroom for browser compositing |
| File size | < 1.5 MB single HTML | Actual target ~250 KB |
| External requests | 0 | Fully offline-capable |

`shadowBlur` is banned (mobile GPU killer); soft shadows are pre-baked
radial gradients. No per-frame allocations in hot paths (pools only).

---

## 5. Art Direction (locked — see ART-DIRECTION.md)

Glossy translucent jelly with refraction-style highlights; squash-stretch
on every interaction; pastel dioramas with soft blob shadows; particle
"boing" rings on impacts; dripping goo; drifting motes and bubbles for
ambient life. Everything eases — nothing pops.

## 6. Audio Direction (locked)

100% synthesized WebAudio, no samples: boings (pitch-swept sine with
wobble), splats (filtered noise + thump), squelches (band-passed noise),
giggles (ascending sine blips), pops, sparkles, UI ticks, and a gentle
generative pad (I–V–vi–IV, soft music-box plucks). Master mute toggle,
persisted.

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Verlet jelly explodes on low-end phones (large dt) | Fixed timestep accumulator, dt clamp, PBD iterations; harness stress-tests 600 steps |
| Touch drag vs scroll conflict | `touch-action: none` on canvas; pointer events with capture |
| AudioContext autoplay block | Created/resumed on first user gesture; loader waits for gesture before music |
| Cover-crop cuts toys on wide screens | 60 px safe margins in stage coords; HUD in device space, never in world space |
| Kid confusion | Tutorial gating, one-line interactions, HUD hint bar, journal always one tap away |

---

## 8. Definition of Done (M1)

- [ ] Zero console errors across a full playthrough of all 6 dioramas
- [ ] All 18 giggle moments triggerable and journaled (harness-verified)
- [ ] Mixer: paint + mix + name + snapshot PNG all work
- [ ] Tutorial completes; How-to-Play readable; hints pulse in order
- [ ] 60 fps feel on desktop Chrome; physics stable in 600-step stress test
- [ ] Single HTML < 1.5 MB, zero external requests (grep-verified)
- [ ] Full-screen on phone size (360×740) and desktop: no black bars, no cut-off buttons
- [ ] Public link cold-verified (HTTP 200, correct title, byte-identical SHA-256)
- [ ] SLICE.md, QA.md, LINK.md written; Roman Urdu summary delivered
