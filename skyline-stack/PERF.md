# SKYLINE STACK — PERFORMANCE BUDGETS (SET BEFORE CODE, 2026-10-18 ~03:15 PKT)
Target: **60fps** on a 2021 mid-range phone (e.g. realme C71-class) at devicePixelRatio ≤ 2.
Strategy: prerender everything static; cap everything dynamic; zero per-frame allocation in
the hot loop (pooled particles/texts/debris).

## Frame budget (16.7ms)
| System | Budget | How |
|---|---|---|
| Sky + stars + sun/moon | 1 draw | Prerendered to offscreen on resize/theme change; blitted |
| Skyline parallax (3 layers) | ≤ 6 draws | Each layer prerendered 2× wide, drawn twice for wrap |
| Clouds | 6 draws | Prerendered blob sprites |
| Tower floors (full detail) | ≤ 40 floors | Only top 40 drawn fully; older = silhouette |
| Tower silhouette (old floors) | 2 draws | 1 dark rect + 1 sparse window-dot strip (prerendered pattern) |
| Rooftop decorations | ≤ 3 × ~8 ops | Only if within the 40-floor detail window |
| Tenant stories | ≤ 3 active | Stories animate only for ~6s after move-in, only if on screen |
| Crane (rail/carriage/cable/block/guide) | ~12 ops | Vector, no shadowBlur |
| Particles | ≤ 260 live | Pooled array, additive-ish via globalAlpha only |
| Floating texts | ≤ 14 live | Pooled |
| Debris chunks | ≤ 8 live | Pooled |
| Rain (monsoon only) | 120 line strokes | Single path batch, one stroke call |
| HUD numbers/combo | canvas text ≤ 6 | DOM for the rest |
| **Total per-frame ops** | **< 700 simple ops** | Measured via `__skyline.frameOps` counter in QA |

## Memory / size budgets
- Single-file artifact **< 1MB** (target ~150–250KB; hard ceiling 1MB).
- Zero external requests (audit in build.js: fails on any `http://`, `https://`, remote `src=`/`href=`/`url(`).
- Offscreen caches: sky (1×), skyline layers (3×), cloud sprites (3×), silhouette strip (1×) —
  each ≤ 900×400; total < 4MB GPU.
- localStorage: one JSON key `skylinestack.v1` (< 2KB).

## Entity caps (hard)
- particles: 260 · floatingTexts: 14 · debris: 8 · toasts (DOM): 2 · banners: 1
- tenant story animations: 3 concurrent · birds: 2 flocks · clouds: 6
- floors array: unbounded logically (numbers), but draw-capped as above.

## Timing rules
- dt clamped to 1/30 max (tab-jank safety); slow-mo via timeScale (0.25) — physics uses
  scaled dt, UI tweens use real dt.
- Wind/tower sway: analytic spring integrated at frame dt — stable for dt ≤ 1/30.
- Audio: lookahead scheduler (100ms tick, 250ms horizon); no per-frame audio alloc.

## Degradation (automatic, no settings UI)
- If median frame time > 24ms over 120 frames: halve particle spawn rates + disable rain
  streaks' second pass (`__skyline.degraded=true`, logged in QA).
- DPR capped at 2 (canvas backing store).

## QA gates (must all pass)
1. `node test/logic.test.js` — all assertions green.
2. build.js audit: zero external refs, size < 1MB.
3. Headless Chromium (mobile 390×844 DPR2 + desktop 1280×800): zero console errors,
   zero pageerrors; menu → how-to → start → 12+ scripted taps → game over reachable;
   screenshots inspected for HD quality, full-bleed (no bars), no cut-off buttons.
4. `window.__skyline` exposes state for scripted QA (height, state, fps, frameOps, errors).
