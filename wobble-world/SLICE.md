# WOBBLE WORLD — Vertical Slice (M1)

**Status:** Build complete, self-QA green. Ready for factory publish.
**Folder:** `~/workspace/game-factory/wobble-world/`
**Build:** `dist/index.html` — 169,947 bytes (single file, zero external requests)
**Engine:** Vanilla JS + Canvas 2D + hand-written soft-body spring physics + WebAudio (no framework)

---

## 1. What it is

Wobble World is a **soft-body jelly physics toy sandbox** for all ages. There are no enemies, no timers, no losing — just squishy jelly creatures, bouncy toys, and 18 hidden "giggle moments" to discover across 6 hand-designed dioramas (playrooms). Squeeze a creature, stretch it like taffy, fling it across the room, and it wobbles, giggles, and splats with springy jelly physics and fully synthesized sound.

**Design pillars:**
- **Touch first:** grab, stretch, fling — one finger does everything. Mouse works identically on desktop.
- **No fail state:** a kids-and-everyone toy box. The only "progression" is a discovery journal (found/total) and new creature friends to mix.
- **Everything is a toy:** trampolines, dominoes, magnets, bubbles, seesaws, pillows — every object squishes, wobbles, or reacts.
- **Global by design:** all names, hints, and UI are universally understandable English with zero culture-specific references.

---

## 2. The 6 dioramas

| # | Diorama | Palette | Toys | Creatures |
|---|---------|---------|------|-----------|
| 0 | **Jelly Kitchen** (tutorial) | Warm peach/cream | Domino tower (5), syrup pool, 3 goo jars | Bouncy, Sticky |
| 1 | **Bounce Canyon** | Sunset orange | 3 trampolines, 2 goo balls | Bouncy, Hyper |
| 2 | **Magnet Cave** | Deep purple/teal | 2 magnet orbs, 4 goo balls, goo pipe | Sticky, Sleepy |
| 3 | **Bubble Bath** | Aqua/foam | 2 bubble pipes, cannons, 2 paint pools | Bouncy, Hyper |
| 4 | **Spring Garden** | Leaf green | Seesaw, 3 spring flowers, 2 goo balls | Sleepy, Sticky |
| 5 | **Pillow Fort** | Lavender dusk | 3 pillows (1 stacked), blanket fort | Sleepy, Hyper, Bouncy |

**4 creature personalities** (physics + behavior, not just color):
- **Boing** (bouncy, pink #ff8fb3) — super bouncy, hops everywhere
- **Gloopy** (sticky, mint #7fe3b2) — sticks to floors/walls on landing, slow
- **Dozie** (sleepy, lavender #c3b2f2) — naps; wake it gently or startle it
- **Zippy** (hyper, orange #ffb14e) — fast, hops constantly, excitable

**3 goo flavors** (feed to creatures or mix): Berry #ff5d6c, Honey #ffd94e, Frost #4ec9ff. Goo shifts a creature's bounce/stretch/stick traits.

---

## 3. The 18 giggle moments (discovery journal)

**Jelly Kitchen:** `k-topple` Tower Topple (knock all 5 dominoes), `k-syrup` Syrup Slide (slide through syrup), `k-stretch` Mega Stretch (stretch 1.8×)
**Bounce Canyon:** `c-triple` Triple Bounce, `c-sky` Sky High (bounce above y=260), `c-chain` Chain Reaction (bounce across all 3 trampolines)
**Magnet Cave:** `m-snap` Magnet Snap (goo ball snaps to orb), `m-pop` Pop Party (5 goo pops), `m-stick` Stuck Like Glue (Gloopy clings)
**Bubble Bath:** `b-ride` Bubble Ride, `b-cannon` Cannonball! (fast splash), `b-chef` Paint Chef (2 paint colors)
**Spring Garden:** `g-seesaw` Seesaw Slam, `g-flower` Flower Power (all 3 bloom), `g-wake` Wake Up! (wake Dozie gently)
**Pillow Fort:** `f-pile` Pillow Pile (3 creatures on pillows), `f-nap` Nap Time (Dozie sleeps 8s), `f-splat` Mega Splat (hard splat)

Each fires a toast + sound + journal entry. Journal shows found/total per diorama with silhouettes for undiscovered ones.

---

## 4. Key systems

- **Soft-body physics:** Verlet integration + PBD spring constraints (2 substeps × 3 iterations), pressure model for jelly volume, squash-and-stretch on grab/fling/impact. Per-creature tunable: bounce, stretch, stickiness, hop strength.
- **Creature Mixer:** pick 2 parents + up to 3 goo + name → a child creature with blended traits and mixed color. **Snapshot** button exports a PNG (DOM overlay, works on mobile).
- **Guided tutorial** (first visit): pulsing ring + 3 ordered steps (grab → stretch → fling) with a device-space bubble that never gets cropped.
- **How-to-Play screen:** 4 panels (Grab & Squish / Stretch & Fling / Toys / Mixer), reachable from title and HUD.
- **HUD:** device-space buttons (Mixer, Journal, Worlds, Sound) + world pill (name + ★ found/18) + rotating contextual hint bar ("Try this: …").
- **Audio:** 100% synthesized WebAudio — boings, splats, squelches, giggles, pops, plus a generative ambient pad. No audio files.
- **Save:** localStorage `wobble-world-save-v1` (giggles found, tutorial done, mixer creations, muted).

---

## 5. Controls

- **Touch / mouse:** press a creature to grab → drag to stretch → release to fling.
- **Toys:** tap goo balls to pop them; drag creatures onto trampolines/seesaws/magnets.
- **UI:** big round HUD buttons; Worlds screen to travel; journal/mixer are modal overlays with X close.

---

## 6. Tech notes

- **Scale:** stage 800×1200 portrait. Game world uses COVER (full-bleed, no bars); menus/overlays use FIT (never crops a button); HUD is device-space.
- **Budgets:** ≤8 creatures, ≤220 particles, 2 substeps × 3 solver iterations — 60fps target on real devices (54fps phone / 41fps desktop measured under headless software rendering, which is much slower than real GPUs).
- **Size:** 169,947 bytes, well under the 1.5MB budget. Zero external URLs (verified by build.sh).
- **Test hooks:** `window.__wobbleGame` and `window.WobbleTest` for automation.

---

## 7. What's NOT in this slice (full vision)

Full vision (BUILD-LEDGER.md) includes: 12 dioramas, creature moods/clothing, multiplayer "squish party" (local), seasonal events, photo stickers. This slice is ~45% of that vision — the complete toy-box loop (grab/stretch/fling + 6 worlds + 18 discoveries + mixer) is fully playable.
