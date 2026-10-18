# DUSKLINE — QA Report (M1 vertical slice)
**Build:** dist/duskline.html — 1,335,115 bytes (1.27 MB), single file, zero external requests
**Date:** 2026-10-18 | **Method:** headless Chromium (SwiftShader) — 21-check smoke suite +
10-check flow suite (defeat → end screen → relic keep/swap → menu → hero unlock/select),
plus static analysis (node --check, texture-key cross-check, D.* reference check, data-consistency checks)
and screenshot review of boot / menu / gameplay / draft / combat / boss / victory / defeat / relic screens.

## Final results
- **Smoke suite: 20/21 PASS.** The single FAIL is the fps gate (2fps under SwiftShader CPU
  rasterization — documented non-representative, see #4). All functional checks pass:
  boot, menu nav, game start, enemy spawning, signature aura, WASD movement, rank-up draft
  open/pick/close, aura fusion → evolved form, sandstorm event, DUNE TYRANT spawn + kill +
  achievement, pause menu, victory at 10:00, localStorage save — **zero console/page errors**.
- **Flow suite: 9/10 real PASS** (1 false negative: end-screen text check missed nested container
  children; the end screen, relic draft, swap, and menu return all verified working).
  Verified: defeat → end screen with stats → CHOOSE RELICS → keep/swap draft (relic persisted
  [] → ["greed"]) → RETURN TO CAMP → Menu → reach4 unlocks RAAT → RAAT selectable →
  new run starts with pulseNova.

## Checklist results
| # | Check | Result |
|---|---|---|
| 1 | Loads to playable, zero console errors | **PASS** — 0 console/page errors across full suite (boot → menu → 10-min run → victory → relics) |
| 2 | Full loop completable start-to-finish on touch | **PASS** (simulated) — menu → hero select → run → draft → events → bosses → victory/defeat → relic keep/swap → menu all exercised via automation |
| 3 | Text 100% English, no placeholder/tofu | **PASS** — all UI strings English; no tofu glyphs in screenshots (icon emoji ☀❄ etc. render in headless; verified visually) |
| 4 | 60fps target / 30fps min in heaviest moment | **CANNOT VERIFY HEADLESS** — SwiftShader (CPU rasterizer) gives 1–7 fps, not representative of phone GPUs. Root-caused 2026-10-18: Phaser's Clock/tweens/timers are all CORRECT — they only appear slow because the headless renderer yields ~1fps and Phaser smooths frame delta, dilating game-time ~40x vs wall-clock. Pure test-environment artifact. Mitigations in place: hard entity caps (120 enemies / 192 shots / 96 enemy shots / ~700 particles), shared textures, spatial-hash separation, no per-frame allocation in hot loop, off-screen AI sleep. Real-device check still needed. |
| 5 | No memory leak over 10 min | **PARTIAL** — 6-min heavy soak (102 enemies, evolved aura): no errors, pools stable, texture count constant (74). True 10-min wall-clock soak not done. |
| 6 | Share/clip moment within 60s | **PASS** — first fusion can trigger within ~60–90s of play; event banners + boss intros are the clip moments |
| 7 | Public link cold-load verified | **PENDING** — parent publishes; must be verified on real phone Chrome after publish |

## Bugs found & fixed during QA
1. **Boot crash: `fillEllipse` 5th arg** — passed rotation where Phaser expects smoothness → `TypeError`. Fixed (removed rotation args). The boot screen's honest TRY AGAIN path worked as designed.
2. **Dark squares around glowed textures** — 3+ overlapping translucent Graphics fills corrupt under SwiftShader's canvas path. Fixed by baking all soft glows as canvas radial gradients (`compositeGlow`), verified clean in screenshots.
3. **Sky/moon/stars hidden behind opaque ground** — reordered: ground first, moon/stars additive above, ridges as parallax bands, 12 world-locked color blotches for ground variation.
4. **evoGold cooldown 0** — would have dead-featured its lance rain. Set to 2.6s.
5. **Player/pickup physics bodies not synced** (manual movement) — pickup magnet collection would have failed. Fixed with `body.updateFromGameObject()`.
6. **Draft card text overlap** on wrapped descriptions — fixed with dynamic line spacing.
7. **Menu "BEST" text overlapped title; "LOCKED" badge clipped** — repositioned.
9. **hit-pause used Phaser-scaled delayedCall for restore** — restore timing stretched under timeScale; end-of-run panel could be delayed. Fixed with real-time setTimeout restore + timescale reset in gameOver().
10. **Resize listeners accumulate / cross-scene restart** — each scene registered `scale.on('resize') → scene.restart()` and never unregistered; a resize in Menu/Game would misbehave. **Known issue, accepted for slice:** rotation mid-run restarts the run (documented). Fix scheduled for M2 (single resize handler, layout-only response).

## Honest limitations
- No real-phone test yet (no device in this environment). Touch joystick exercised via simulated touch only; feel on real hardware (joystick radius, button sizes) needs Huzaifa's playtest.
- Audio graph runs without errors, but music/SFX quality not ear-checked here.
- Balance (difficulty curve, aura power, boss HP) is designer-estimate, not playtest-tuned.
- `window.__duskline` debug handle and Playwright-only test scripts are dev artifacts, not in the game file.
- localStorage save version `duskline_v1`; schema changes in M2 will need migration.

## Static checks (all pass)
- `node --check` on all 7 source files: OK
- Texture keys: every referenced key generated (64 textures incl. per-color/per-enemy variants)
- `D.*` references: all resolve (2 regex false positives manually confirmed)
- Data: 12 auras = 6 colors × 2, 6 evolutions cover all pairs, all aura kinds handled, achievement rewards valid, rank thresholds ascending, no "prototype"/"demo" in user-visible strings
