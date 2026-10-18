# RUCKUS RAMPAGE — QA Report (vertical slice)

Date: 2026-10-18 (PKT). Build: `dist/ruckus-rampage.html`, **1248 KB**, single file.
Engine: Phaser 3.60.0 (inlined from global-libs, never re-downloaded).

## Automated logic tests — 39/39 PASS
`test/test-logic.js` (Phaser-free pure logic, Node):
- Knockback scaling: wobble % increases launch force; wobbly blobs fly farther.
- Arena support: fighters stand on tiles; collapsing tiles cycle solid -> warn -> gone and drop blobs.
- Rope nets: calm blobs bounce back; wobbly blobs (wobble >= 150) burst through and are KO'd; Rubber Body saves once.
- Bumper dhols: bounce blobs away, add wobble.
- Jumping: single + double jump (with upgrade), no triple jump.
- AI: all 5 styles (rusher/camper/trickster/heavy/coward) pick targets, chase, attack, and retreat per style.
- Draft: 3 offered upgrades are distinct and not already owned; bots draft too.
- Stars: 1-3 star scoring by KOs; unlock math (costumes at 1/3/5/10 wins; arenas at 3/6 wins).
- Round rules: last-blob-standing wins the round; time-out winner = most lives, then most KOs.
- Kill-feed lines: per-style comedy lines for every KO cause (KO, wobble-launch, tile drop, rope burst, bumper pinball, weapon hits).

## Headless browser QA (Chromium, SwiftShader) — ALL PASS, zero page errors
Full tap-through flow, 640x360 mobile-emulated viewport with touch:
- Boot -> TAP TO START -> title (logo, buttons, arena behind).
- How-to-Play (3 illustrated steps, Start button).
- Practice (60s vs passive DUMMY): countdown, fight runs, joystick drag moves the player, HIT/JUMP buttons respond.
- Practice results (KOs counted, "PRACTICE AGAIN" / "START MATCH!").
- Match round 1 (120s): 6 fighters spawn, bots fight each other (wobble accumulates on bots), HUD shows objective + ROUND 1/3 + timer + lives + wobble meters.
- Pause (II) -> resume.
- Draft 1: 3 distinct cards, tap picks upgrade (player upgrades confirmed: feather, spring, bighead across runs).
- Round 2 -> Draft 2 -> Round 3 sudden death: arena shrink banner + collapsing tiles accelerate.
- Match results: win recorded (wins=1), stars awarded (2), unlock progress saved to localStorage.
- Rematch: back to round 1 cleanly.
- Console: zero page errors on every run (only the benign Phaser version banner log).

## Visual review (screenshots)
- Title: neon logo, glowing buttons, arena with crowd behind. Good.
- How-to-Play: 3 cards with blob art. Good after compact-layout fix (short landscape screens).
- Fight: teal player blob, tumbling bots with X-eyes, wobble rings + % labels, conveyor, rope nets, kill feed, JUMP/HIT buttons. Good.
- Draft: 3 cards with icons, names fit on one line (fixed "SPRING LEGS"/"STICKY HANDS" wrap), descriptions readable.
- Fixed during QA: banner stacking (only one banner at a time), kill-feed cleared between rounds, draft card name font size.

## Bugs found and fixed (all verified)
1. CRITICAL: input attached to the boot scene instead of Main scene — joystick/buttons never fired. Fixed: attach in MainScene.create with detach() cleanup.
2. CRITICAL: `RR.Input.poll()` returned `{mx}` but fighter read `ctl.move` -> undefined -> NaN physics. Fixed.
3. `Graphics.quadraticCurveTo` does not exist in Phaser 3.60 -> segment-sampled quadratic helper.
4. RenderTexture default origin 0.5 -> setOrigin(0) for background layers.
5. Practice-results buttons mislabeled -> dynamic labels.
6. Responsive: compact layouts for short landscape screens (H < 520) across title/howto/practice-intro/pause/draft/results.
7. Global-audience glosses: DHOL-STICK, FLYING CHAPPAL, NEON AKHARA each got a one-line in-game explanation.

## Budgets
- Size: 1248 KB < 1.5 MB target. Zero external requests (audit passes; 4 inert Phaser-internal URL strings allowlisted).
- Particles: pooled, capped (~200). Fighters: max 6. Target 60fps on real phones.

## Known headless-only quirks (NOT game bugs)
- SwiftShader renders ~0.5fps; game dt clamps at 0.05s/frame, so real-time countdowns run ~40x slow; QA fast-forwards via evaluate.
- Occasional browser disconnects correlate with `page.screenshot` ReadPixels under SwiftShader, not game crashes.
- Game survived 45s+ continuous fight with zero page errors.
