# BAZAAR SIEGE — QA Report (vertical slice, 2026-10-18)

## Automated checks — all PASS
| Check | Result |
|---|---|
| `node --check` on all 10 source files + build script | PASS |
| Pure-logic test suite (`test/logic.test.js`) | **22/22 PASS** — waves, bosses, events, merge, stall buffs, targeting, rewards, stars, turret glosses, enemy displayNames + hints, verbatim banner wordings, local-terms denylist, economy sanity |
| Build: single self-contained HTML | PASS — `dist/bazaar-siege.html`, **1.26 MB** (budget 2 MB) |
| External requests audit (src=/href=/url(/fetch(/import() refs) | **0** — fully offline; Phaser inlined from `~/workspace/global-libs/phaser/phaser-3.60.0.min.js`, never re-downloaded |
| Forbidden words in user-visible strings ("prototype"/"demo") | **0** (only JS `.prototype` internals) |
| Global-audience wording | PASS — every turret has `gloss`, every enemy `displayName` + one-line `hint`; banner/HowTo/victory/defeat strings verbatim per ART-DIRECTION.md; denylist scan for unexplained local-only terms clean |

## Headless browser verification — PASS (real Chromium, touch events)
Run against the final dist in headless Chromium (mobile 390×844, touch). Canvas2D forced via init script for stability; WebGL path separately loaded with zero page errors.

**Full tap-through flow (all PASS, state asserted after each step):**
- Boot (staged 0→100%, ENTER enabled only when ready) → Menu → HowTo → Game
- Tutorial W1: Rickshaw card tap → slot (360,510) tap → placed (coins 150→90, tut stage 0→2) → NEXT WAVE → wave 1 runs → clears → back to build (tut 5, "Well defended!")
- W2: Kite card → slot (150,510) → placed (tut 7) → NEXT WAVE → wave 2 runs
- Merge: drag Rickshaw (570,510) → Rickshaw (360,510) → evolved (`rickshaw+`), star badge visible in screenshot
- Sell: Prism (110) → refund 77 (70%) ✓; sell button + range ring appear on turret tap ✓
- Stall: upgrade panel opens/closes; upgrade deducts 100 → level 1, texture + link-lines update ✓
- Scout: panel opens with enemy icons/counts/hints, closes ✓
- Pause: freezes; resume ✓. Speed 1x→2x ✓
- Events: monsoon (110 rain streaks → cleared), blackout (dim tweens 0→0.5→0, 14 fireflies → cleared), wedding (drum-tower spawns, shockwaves → cleared) ✓
- Boss W10: Convoy spawns with 800 shield; shield depletes first, "SHIELD BROKEN!" fires, body 1400 → dies, `bossActive` clears ✓ (screenshot: hex dome, prism beam, dhol ring)
- Swarm-Lord: burst timer → exactly 6 swarm imps ✓
- Kite Imp: airborne (`img.y=-34`), `canHit` false for rickshaw/chai/dhol, true for kite/lantern/prism ✓
- Digger: burrows on schedule (untargetable while under) ✓
- Leak: runner at gate → lives-1; thief → steals 20 coins, no life lost ✓
- Victory: wave 15 cleared → "DAWN BREAKS — the bazaar stands!", 3 stars for 20 lives, Best Night + stars saved ✓ (screenshot)
- Defeat: lives 0 → "The bazaar falls silent… Try again?", Best Night saved, Try Again restarts ✓
- **Zero page errors / zero console errors** across all runs (only the benign Phaser version banner)

**Screenshots reviewed:** boot (clean title glow, working ENTER button), menu, howto (3 verbatim steps, real-texture illustrations), game-build (HUD, hint pill, 9 rooftops, stalls + link-lines, 6 cards with glosses), wave-running (rocket in flight, runner with HP bar), merged (evolved rickshaw + star badge), boss (convoy under fire), victory (3 stars + endless button).

## Real bugs caught and fixed during QA
1. **Boot ENTER button used a not-yet-generated texture** → permanently showed Phaser's green `__MISSING`. Fixed: boot UI (ENTER + retry buttons) drawn with raw Graphics; title/banner glows switched from `shadowBlur` to layered text (headless rendered shadowBlur as a dark box).
2. **Container hit areas were centered rects** → Phaser adds `displayOrigin` before the hit test, so only the top-left quadrant of every button/card/turret responded. Fixed: all container hit areas are now frame-space `Rectangle(0, 0, w, h)`. (Latent in gully-champion too — its taps happened to land inside; not touching that game.)
3. **Phaser autoCenter + CSS flex double-centered the canvas** (113px vs 75px top) → all input coords shifted. Fixed: flexbox only, no Phaser autoCenter.
4. **NEXT WAVE hidden at game start** → wave 1 could never begin. Fixed: visible from the start.
5. **Blackout dim + leak vignette never rendered** — rects created with `fillAlpha: 0` while tweens drove object `alpha`. Fixed: full fill + object alpha 0.
6. **`triggerEvent` didn't set `eventKind`** → `clearEvent()` was a no-op when called directly. Fixed: triggerEvent sets it.
7. **Selling a Prism mid-beam leaked a frozen beam graphic.** Fixed: beam graphics destroyed on sell.
8. **Endless Scout preview could differ from the started wave** (regenerated). Fixed: preview cached and consumed by `startWave`.
9. **Wave 1 leaked 3 lives in the smoke test** (8 runners vs 1 rickshaw). Tuned: 5 runners at 2.0s interval — the single tutorial rickshaw now holds the lane.
10. Splash/AoE (Chai, Dhol) could hit airborne imps it shouldn't reach — filtered by `canHitAir`.
11. Tutorial could soft-lock if the merge pair was sold mid-tutorial — stage 12 now rewinds to "place another rickshaw" if fewer than 2 unevolved rickshaws exist.

## Static review — PASS
- Full state machine traced: Boot → Menu → HowTo → Game (build ↔ wave ×15 → victory/defeat → endless). No dead ends; every button has a working handler; window-error hook + 20s watchdog → retry overlay on Boot.
- All DOM/audio access guarded (try/catch, ready checks); AudioContext created only on user gesture; every `AudioEngine` method safe to call pre-unlock.
- Budgets respected: enemies ≤70, projectiles pooled (40/type), particles pooled (≤250), damage numbers pooled (24), ≤9 turrets, rain ≤120, textures generated once at boot, no per-frame allocation in hot loops, targeting via staggered 0.15s scans, custom lane integration (no physics engine).
- Mobile layout: HUD + hint pill + dock inside safe area; all buttons ≥88px; portrait 720×1280 FIT; overscan backgrounds.
- Save contract: `bazaarSiegeSaveV1` {bestNight, stars, tutorialDone, muted}; corrupt save → defaults; storage failure → play without saving.
- Wording: global-audience layer applied everywhere (turret glosses, enemy display names + rules, verbatim event banners, verbatim HowTo steps, "DAWN BREAKS — the bazaar stands!" / "The bazaar falls silent… Try again?").

## Game-feel checklist — implemented
Hit flash (tint pulse), knockback nudge, pooled damage numbers (gold crits), petal/spark/smoke bursts, shockwave rings, screen shake on leaks/boss deaths (never in tutorial wave 1), 70ms hit-pause on merges/shield-breaks/boss kills, placement pop (Back.easeOut + dust ring), merge cinematic (flash, converging petals, scale punch, star badge, shockwave), squash-and-stretch march, burrow dust telegraphs, swaying lanterns, twinkling fairy lights, drifting petals, steaming chai, per-turret anticipation (mortar tilt-back, drum pulse, beam), dhol-groove ambience with danger-driven intensity, festival stingers, boss drums, win/lose motifs.

## NOT verifiable by the builder (no live device at this layer)
- [ ] Zero console errors on a real phone browser (cold load, WebGL path)
- [ ] 60fps on low-end Android during monsoon + boss + full turret barrage
- [ ] Touch drag for merge feels right on a real touchscreen (tested via CDP touch events only)
- [ ] WebAudio dhol groove + stingers on mobile Chrome (Autoplay Policy after real taps)
- [ ] Long-session stability (30+ min endless) and localStorage persistence across app restarts
**→ Parent's cold public-link verification must confirm these before delivery.**

## Cuts made (per "cut before shipping cheap")
- Stall level-0 and level-1 share the `stall-1` art (level 1 is shown via brighter link-lines + pips); a distinct L1 art pass was cut as visual noise.
- Ember death-blast chains and splitter splits are instant (no chained cinematic) — kept as gameplay, not spectacle, to protect the particle budget.
- No share-card screenshots (full-vision feature) — victory panel is screenshot-friendly as-is.

## Coordinator independent verification (2026-10-18 ~03:10 PKT)
Re-ran everything from scratch after the builder's handoff — independent pass, not a copy of the builder's claims:
- `node build.js`: BUILD OK — `dist/bazaar-siege.html`, **1,317,488 bytes (1.26 MB)**, 0 external resource refs (re-audited independently).
- `node test/logic.test.js`: **22/22 PASS** (re-run green).
- `node --check` on all 10 src files + build.js: PASS, zero failures.
- Forbidden words in dist: all 139 "prototype" hits are JS/Phaser internals (`.prototype`, `isPrototypeOf`) — zero user-visible occurrences of "prototype"/"demo".
- Headless Chromium (real shell, mobile viewports 390×844 and 360×640): **zero console/page errors** on boot; screenshots reviewed.
- **Letterbox decision (documented honestly):** the game uses Scale.FIT at 720×1280. On taller phones (e.g. 390×844) the canvas centers with ~75px top/bottom margins. A gradient page background was tried and REJECTED (visible seam where canvas met page). Final: page background is solid `#0b1030` — the game's own night color — so margins read as continuous night sky, not black bars. Deliberate trade-off, recorded here: FIT guarantees zero cropped gameplay/buttons on every aspect ratio (ENVELOPE/cover would crop the gate at x=40 and spawn at x=760 on tall phones); the cost is non-black, sky-colored margins on taller-than-16:9 phones. On 16:9 phones (360×640) the canvas fills the screen exactly. Parent's cold check on a real phone should confirm the margins look intentional.
- Phaser 3.60.0 inlined from `~/workspace/global-libs/phaser/phaser-3.60.0.min.js` at build time — never re-downloaded; no other libraries added.
- Global-audience rule verified in dist strings: turret glosses, enemy display names + one-line hints, verbatim event banners / HowTo steps / victory ("DAWN BREAKS — the bazaar stands!") / defeat ("The bazaar falls silent… Try again?") all present.
