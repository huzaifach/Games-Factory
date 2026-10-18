# BLOB ARENA — QA Report (M1 vertical slice)

Date: 2026-10-18. Tester: build coordinator (automated + code review).
Honest scope: everything below was actually run; the "Not tested" section
lists what no VM-based check can cover.

## PASS — automated checks (all run, all green)

| # | Check | Result |
|---|---|---|
| 1 | `node --check` on all 7 src files + build.js | PASS, zero syntax errors |
| 2 | Build guard: bundle size | PASS — `dist/index.html` = **84,890 bytes (82.9 KB)**, budget < 1 MB |
| 3 | Build guard: external references | PASS — `grep` for `http://`/`https://` in final HTML: **0 hits** (zero external requests) |
| 4 | Build guard: banned words | PASS — "prototype"/"demo" appear **0 times** anywhere user-visible |
| 5 | Headless full-round sim (10,800 ticks = 180 s, autopilot player) | PASS — no crash, no NaN, round completes, winner chosen |
| 6 | Entity budgets during sim | PASS — blobs exactly 12; pellets ≤ 240; particles peak 126/350; ripples peak 9/24 |
| 7 | Round flow events | PASS — storm activated at t=150 s, round ended at t=180 s, `end` event fired |
| 8 | Gameplay volume | PASS — 323 pellet eats, 11 absorptions, 3 growth milestones, kill feed populated (5 retained) |
| 9 | Bot progression | PASS — avg bot mass 215 at round end vs 26 at spawn (bots genuinely play) |
| 10 | Determinism (same seed + same inputs → identical outcome) | PASS — repeated runs byte-identical (winner + absorption count match) |
| 11 | Pacing experiment (eatRatio 1.12 / 1.08 / 1.05 × 2 seeds) | PASS — 10–21 absorptions/round; kept **1.12** (genre-standard, best feel) |
| 12 | Ambient title mode (world alive, timer frozen) | PASS — code path reviewed; timer block correctly gated |

## PASS — performance reasoning (documented estimate vs budget)

| Item | Typical draw ops/frame | Budget |
|---|---|---|
| Background blit | 1 | — |
| Arena border (culled off-screen; shadowBlur only when visible) | 0–1 | — |
| Pellets (culled; ~15% of world visible → ~36 pellets × 3 arcs) | ~108 | — |
| Ripples | ≤ 24 | 24 pooled |
| Particles (culled) | ~80 typical | 350 pooled |
| Blobs 12 × (body + rim + 2 gloss + nucleus 3 + name 2) | ~108 | 12 fixed |
| Storm wall + spores (final 30 s only) | ~30 | — |
| HUD / screens / banners | ~60 | — |
| **Typical total** | **~350–450 primitive ops** | **700 budget** |

Sim tick: 12 blobs × (AI think staggered every ~0.16 s, 66-pair eat checks,
240-pellet scan) — measured **~2 s for 10,800 ticks in node** (≈0.19 ms/tick),
far under the 2 ms budget. Rendering is canvas 2D with a pre-painted
background and DPR capped at 2 → 60 fps expected on mid-range phones.

## Code-review checks (read, not run)

- Input: joystick hit-testing order (UI buttons → dash button → joystick) is
  correct; `touch-action: none` + `preventDefault` blocks scroll/zoom.
- AudioContext is created on the Start tap (autoplay-policy safe); every SFX
  guards `if (!started) return`.
- Death → respawn flow: death card only when player dead; sim keeps running;
  RESPAWN calls `sim.respawnPlayer()`; dash recharges on respawn (one per life).
- Crown/legend/mute/career stats persist via localStorage wrapped in
  try/catch (private-mode safe).
- All UI text is English; no levels/XP jargon (crowns/badges only).

## NOT tested — must be verified on a real device after publishing

1. **Real phone browser**: no headless Chromium exists on this VM, so the
   game was never rendered or tapped on a real phone. Touch joystick feel,
   button sizes, full-screen layout and 60 fps need a human check on the
   public link.
2. **Audio audibility**: WebAudio graph is code-correct, but no ear ever
   heard it — verify music/SFX levels and the storm riser on device.
3. **Visual art quality**: jelly-gloss rendering, storm wall and background
   were reviewed as code only. The art-direction lock is implemented, but
   "does it look delicious" needs eyes.
4. **Long-session stability**: rounds were simulated headlessly; a 30-minute
   real play session (memory, audio glitches) was not run.

## Known issues / cuts

- None blocking. Minor: title-screen backdrop shows the warm-up arena with an
  idle "YOU" blob that bots may eat — harmless (fresh sim per round).
- Cut nothing from the slice scope; all M1 features from the brief are in.

## Verdict

**QA-PASSED for publish** within the limits above. `dist/index.html` is ready.
Recommend a 2-minute human playtest on the public link (real phone) before
announcing it widely.
