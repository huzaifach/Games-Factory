# SKYLINE STACK — QA REPORT (2026-10-18, ~03:00–04:30 PKT)
Tester: self (headless Chromium via factory harness: playwright-core + headless_shell).
Build under test: `dist/skyline-stack.html` (90.6 KB, zero external requests, <1MB budget).

## 1. Static QA — PASS
- `node --check` on all 5 source files: clean.
- `node build.js` audit: **zero external requests** (no http(s), no remote src/href/url(), no @import);
  all placeholders replaced; all key systems present; 90.6KB < 1MB budget.
- `node test/logic.test.js`: **44/44 pass** — drop resolution (perfect/saved/shear/missed boundaries),
  floor regrowth + MAX_W cap, debris side/width, crane difficulty curve + caps, wind gating at 15
  + 0..1 clamp, stars 0–5 + next-star, theme unlock ladder (0/30/60), score ordering.

## 2. Headless-browser QA — PASS (mobile 390×844 DPR2 touch + desktop 1280×800)
Scripted flows, all green, **zero console errors, zero pageerrors** across every run:
- Loader → staged progress → "TAP TO ENTER" → menu (state transitions verified).
- Menu: title, best chip, START BUILDING, 3 theme cards (2 locked), HOW TO PLAY, mute.
- How-to-Play: 3 animated mini-demos render; back + "GOT IT — BUILD!" both work.
- Start → tutorial: pulsing ring + "TAP WHEN LINED UP"/"NOW!" on first 5 drops; hint hides on drop.
- 14-drop tap-through: height 14, combo up to 14, PERFECT/SAVED!/shear all observed live.
- Pause (P key) → resume → forced miss → game-over panel → BUILD AGAIN (fresh run).
- Theme switch: unlocked desert via save, applied — palette/parallax swapped, persisted.
- 24-drop extended run: **tenant events fired** (floor 5/10/15/20 toasts + lit windows + stories),
  **wind gusts fired from floor 15** (telegraph → GUST! meter + tower sway + cable push),
  height 24, combo 9. Screenshots verified: wind meter, tenant toast, combo badge, skyline.
- Desktop: menu, start, 5 click-drops via Space-equivalent path, no errors.
- frameOps 182–203 (budget <700). fps 31–41 in headless **software rendering** (SwiftShader);
  on real GPUs the frame is ~200 simple canvas ops — comfortably 60fps. Auto-degradation
  armed if median frame time ever exceeds 24ms.

## 3. Visual QA (screenshot inspection) — PASS with 2 fixes
- Menu, tutorial, gameplay (7/14/19/24 floors), how-to, pause, game-over, desert theme: all HD,
  full-bleed (no black bars), no cut-off buttons, crisp text, coherent art direction.
- Fix 1 (found): How-to-Play title clipped at top on small screens (flex centering + overflow).
  → Fixed with `justify-content: safe center`.
- Fix 2 (found): menu crane cable crossed the title. → Crane carriage/cable hidden in menu
  (rail stays as scenery).
- Fix 3 (found): game-over screen never appeared after a miss (missing setState branch).
  → Fixed; verified panel + NEW BEST! + stars + buttons.
- Fix 4 (found): loader/menu overlap — menu unhidden behind loader, intercepting the start tap.
  → Fixed: menu preps silently, reveals only on TAP TO ENTER.
- All fixes rebuilt + re-verified in the final runs above.

## 4. Not covered (honest limits)
- Real-device touch feel (tap latency, 60fps on a physical phone) — inferred from budgets +
  headless runs, not measured on hardware. Huzaifa's playtest is the final gate.
- Audio audibility (headless has no audio sink) — graph construction + scheduling verified
  by zero errors; tones verified by code review, not by ear.
- Share-card PNG download — code path exercised (no error); the file-save dialog cannot be
  confirmed headless.

## Verdict: SHIPPABLE — all gates green, fixes verified, ready to publish.
