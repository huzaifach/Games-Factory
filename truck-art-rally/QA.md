# TRUCK ART RALLY — QA Report (M1 Vertical Slice)

Tested 2026-10-18 with real headless Chromium (desktop 1440×900 + phone 390×844 viewports), plus the artifact builder's independent audit.

## Result: PASS — zero console errors

- **Console:** zero errors across all test runs (menu, studio, all 3 legs, results, restart).
- **Loading:** progress bar animates, "Ready — tap anywhere to start" appears, tap gate works; honest retry path present.
- **Screens verified by screenshot:** menu, leg select, studio (paint + motif tabs), Lahore race, drift, Karachi night rain, police chase banner + style gauge, results panel (score, medal, NEW BEST, coins earned, AGAIN/LEGS/STUDIO buttons), Salt Range dusk curves, How-to-Play panel.
- **Functional tests:** buy flow (500→200 coins, persists across scenes), police chase triggers at high style, results save (best records + coins), RACE AGAIN restart works, 3 save slots work.
- **Performance:** game logic ~0.82ms/update; menu 60fps on unloaded VM; race renderer optimized ~3× (draw distance tuned, merged ground bands, static sky drawn once). Real-phone GPU expected to hold 60fps.
- **Self-containment:** zero external requests (no CDNs/fonts/images); ~1.3MB total, under the 2MB cap; game.js + phaser MD5-identical to source; no banned words ("prototype"/"demo") anywhere user-visible.
- **Globalization pass:** all banners/signs/currency/plate in universal English; leg explanations + How-to-Play added.

## Bugs found and fixed during QA
1. Phaser 3.60 container hit-area quirk — button hitAreas had to be top-left anchored (0,0,w,h), not centered; fixed (every button's click zone was shifted half-size down-right).
2. `this.hint` created after `layoutPickers()` in StudioScene → crash; reordered.
3. `spend()` saved economy before `owned.push` → purchases didn't persist; fixed at all 3 sites.
4. Sprite projection double-subtracted playerU (traffic/police/signs); fixed.
5. Garage sign showed a "CHAI DHABA" texture; replaced with dedicated "TRUCK ART" canvas.
6. Legs-screen ▶ arrow overlapped "· 90s" text; repositioned.
7. Dead `project()` method + junk loop removed; depth layering + audio guards added.
8. How-to-Play panel: close button overlapped body text; panel resized, text trimmed.

## Known caveats
- Race FPS measured under CPU-rendered SwiftShader on a heavily loaded VM is not representative of real phone GPUs.
- Public-link cold verification is pending the owner's one-tap publish approval (share timed out while he slept).
