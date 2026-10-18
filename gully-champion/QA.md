# GULLY CHAMPION — QA Report (vertical slice, 2026-10-18)

## Automated checks — all PASS
| Check | Result |
|---|---|
| `node --check` on all 12 source files + build script | PASS |
| Pure-logic test suite (`test/logic.test.js`) | **21/21 PASS** (timing grades, shot model, bowler-AI adaptation, outcome resolution, target sim) |
| Build: single self-contained HTML | PASS — `dist/gully-champion.html`, **1.23 MB** (budget 2 MB) |
| External requests audit (src=/href=/url(/fetch(/import() refs) | **0** — fully offline (4 false positives verified: XML namespace constants + phaser.io comment/banner strings, none fetched) |
| Forbidden words in user-visible strings ("prototype"/"demo") | **0** (only JS `.prototype` internals) |
| Phaser source | Copied from `~/workspace/global-libs/phaser/phaser-3.60.0.min.js` at build time — never re-downloaded |

## Static review — PASS
- Full state machine traced: Boot → Menu → (Super Over / Cup bracket / Time Attack) →
  Match (intro → runup → bowling → contact/miss → fielding → next ball → innings end) →
  Result (share card / next cup match / replay / menu). No dead ends; every button
  has a working handler.
- All DOM/audio access guarded (try/catch, `ready` checks); AudioContext only
  created on user gesture.
- Mobile layout: HUD top bar, dots strip, power meter + hint inside safe area;
  pause button 96px at top-right, excluded from the touch zone; portrait 720×1280
  FIT with overscan backgrounds (no black bars).
- API conformance verified against the audio/art contracts (all 24 audio methods,
  all art factories present with exact names).
- Two real bugs caught and fixed in review: `clearTint()` on a Container (would
  throw at ball release), and intro title texts never destroyed.

## Game-feel checklist — implemented
Hit flash, dust/spark bursts, hit-pause, "GULLY SIX!" slow-mo moment, screen shake,
damage-number run popups, timing feedback, eased fielder runs, diving catches,
squash-and-stretch batting/bowling, gravity-arc ball flight, motion-blur trail,
ambient crowd sway + celebrations, per-gali music groove, UI transitions everywhere.

## NOT verifiable by the builder (no live browser at this layer)
- [ ] Zero console errors on a real phone browser (cold load)
- [ ] 60fps on low-end Android during six + confetti + crowd celebration
- [ ] Touch timing feels right (release windows vs. ball visuals)
- [ ] Speech-synthesis umpire calls on mobile Chrome
- [ ] Share-card PNG download on mobile
**→ Parent's cold public-link verification must confirm these before delivery.**

## Full-bleed + input verification (headless, 2026-10-18 night shift) — PASS

**Fix:** Aspect-matched logical height. `src/main.js` computes `LH = round(720 / (innerWidth/innerHeight))`
(clamped 1280–2400) before `new Phaser.Game`; FIT then never letterboxes. Each scene centers the
720×1280 design space via `cameras.main.setScroll(0, -(H-1280)/2)`; backgrounds paint full-bleed;
bottom UI (menu utility row/tagline, power meter, result buttons) anchored to actual height.
`autoCenter` removed (CSS flexbox already centers — double centering shifted input coords).

**Headless QA** (chromium headless shell + playwright-core, `python3 -m http.server 8765` on `dist/`):
- 390×844 (H=1558): title, menu, match, result screenshots — zero black bars, gradient edge-to-edge.
- 360×800 (H=1600): title, menu, match screenshots — zero black bars.
- No cut-off buttons: menu utility row + tagline visible; result SHARE CARD / PLAY AGAIN / MENU all
  inside the visible area (result relaid out — MENU was at y=1320, off-screen even at 1280).
- No overlapping buttons: menu mode buttons and utility row have exclusive hit areas (the earlier
  "overlap" report was a test-harness coordinate error — screenshots show no visual overlap, and
  Phaser's default container hit rect (0,0,w,h) is correct; explicit "centered" rects were tried
  and reverted because they break hit-testing).
- Match scene renders: HUD, bowler, fielders, batter, stumps, crowd, telegraph, hint all visible.
- Completed swing proven: CDP touch hold-release during bowling → ball resolved (0.1 ov, phase
  back to 'between', balls 0→1). Pause button tap → pause overlay (PAUSED/RESUME/QUIT TO MENU).
- Zero console errors / pageerrors throughout (only the Phaser v3.60.0 banner log).

**Not verifiable headless** (needs Huzaifa's realme C71): 60fps under load, touch timing feel,
speech-synthesis umpire calls, share-card PNG download.
