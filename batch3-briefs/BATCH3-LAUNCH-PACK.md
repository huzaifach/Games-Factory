# GAME FACTORY — Batch 3 Launch Pack (prepared 2026-10-18, ready to fire on Huzaifa's "haan")
Source queue: ~/workspace/game-factory/BATCH3-QUEUE.md (prepared 2026-10-18 ~03:05 PKT)
Standing decision (pending, asked 2026-10-18 08:44 PKT): start batch 3 now or after his verdict on the 8 live games.

## Launch order (per RESEARCH.md/SUMMARY.md ranking)
9 → UNBOX RUSH · 10 → NEON MAZE DRIFT · 11 → PAINT DASH · 12 → RIFT RUNNER
One side chat + one folder per game under ~/workspace/game-factory/<slug>/ (same as batches 1–2).

## STANDING RULES — paste into every batch-3 builder brief (verbatim)
1. Work in English; ALL in-game UI fully English; talk to Huzaifa in Roman Urdu, respectful "aap".
2. NEVER call anything a prototype/demo. Full games only.
3. GLOBAL AUDIENCE RULE: instantly understandable anywhere; local visual identity OK as art, but no local-only names/text/UI without an in-game one-line explanation.
4. UNDERSTANDABILITY RULE: How-to-Play screen, guided tutorial in first 60 seconds, visible win/lose conditions, HUD always answers "what do I do now?".
5. Phaser 3.60.0 from ~/workspace/global-libs/phaser/ — copy at build time, NEVER re-download.
6. Single self-contained file, <2MB, ZERO external requests (fully offline), touch-first portrait.
7. BUILD-LEDGER.md first (vision + milestones + honest %), then art-direction lock, then performance budgets, then code, then self-QA.
8. Self-QA gates before any link: zero console errors (headless tap-through of the full loop), logic tests for core math, byte-verified build, mobile layout pass.
9. DELIVERY: publish web artifact → Huzaifa's one-tap approval (cannot be bypassed; approvals time out if he is asleep) → cold-verify → post link + full Roman Urdu summary in the build chat AND send game name + URL to the factory chat (chat_id 7802920b-616e-4e4d-a33b-f7698fe52104) via chat.send_message for the master link list. Write SLICE.md, QA.md, LINK.md in the game folder.
10. Automated cold-checks of muse.ai/s/ links return Cloudflare 403 (bot shielding) — this is NOT a dead link; Huzaifa's real-phone (realme C71) playtest is the final verification.

---

## BRIEF 1 — UNBOX RUSH: TOY BOX WORLD (research rank 9)
Folder: ~/workspace/game-factory/unbox-rush/ · Portrait, <1MB, offline.

**Hook:** Skill-based timing unboxer + collection. Tap when the needle hits the gold zone; zones shrink as rarity rises. Near-miss = "so close!" drama, never punishment.

**Global themes only** — toy sets: Space Explorers, Dino World, Candy Land, Robot Factory. No region-locked sets.

**Slice scope (big & feature-rich):**
- 4 themed toy-box lines, each with its own reveal ceremony (ribbon physics, paper-tear particles, slow-mo reveal with light rays).
- 120+ collectible toys; collection book with showcase shelves (glossy toys on velvet).
- Duplicate-dust crafting: melt duplicates to craft a targeted box. **Odds always shown** — no gambling framing.
- Timing meter with shrinking gold zones; combo streaks for perfect taps.
- ASMR-grade synthesized WebAudio: crinkles, pops, chimes. 100% code-drawn art.
- Guided first unboxing + How-to-Play (3 illustrated steps).

**Acceptance:** full loop headless tap-through (menu → unbox → reveal → collection book → craft → streak); zero console errors; odds displayed on every box screen.

## BRIEF 2 — NEON MAZE DRIFT (research rank 10)
Folder: ~/workspace/game-factory/neon-maze-drift/ · Portrait, <1MB, offline.

**Hook:** Live tile-twisting light-routing puzzler. Orbs queue at gates; rotate tiles to bend their paths LIVE while they move.

**Slice scope (big & feature-rich):**
- 20 hand-tuned levels (no random filler): single-path → multi-orb → timed gates → color-mixing.
- Color-mixing junctions: two merging orbs make a new color that unlocks matching gates (visual logic, zero jargon).
- Flow-streak scoring: uninterrupted flow multiplies; a break resets — "one more try" loop.
- Tron-elegant look: dark glass maze, glowing liquid-light orbs with trails, magnetic snap + ripple on rotation, cascade bloom on clear. 100% code-drawn.
- Level-select map with star ratings; How-to-Play (3 illustrated steps).

**Acceptance:** all 20 levels solvable (scripted solver check or manual path verification per level); live rotation never soft-locks an orb (no dead-end state); zero console errors.

## BRIEF 3 — PAINT DASH (research rank 11)
Folder: ~/workspace/game-factory/paint-dash/ · Portrait, ~1MB, offline.

**Hook:** Paint-the-road runner — YOU are the paint. Cover the road, outrun the grey.

**Slice scope (big & feature-rich):**
- Auto-run + swipe steering (touch) / arrows (desktop); paint splashes cover the track as you move.
- Dodge grey "eraser" blobs (they wipe your paint); coverage % = score with live color-bar HUD.
- Pickups: paint cans — magnet, wide-brush, shield.
- Rival painter bot on a parallel lane; finish with more coverage to win the "wall".
- Finish line = full mural reveal (shareable moment). Wet-gloss paint with drip physics.
- 3 track themes (day park / neon night / desert dusk); best-coverage records saved on device.
- Guided first run + How-to-Play (3 illustrated steps).

**Acceptance:** full run tap-through (start → pickups → eraser hits → mural reveal → results); coverage math tested; rival bot beatable but challenging; zero console errors.

## BRIEF 4 — RIFT RUNNER (research rank 12)
Folder: ~/workspace/game-factory/rift-runner/ · Portrait, ~1.5MB, offline.

**Hook:** Draft-relic top-down roguelite shooter. 10-minute dives; 3 relics drafted per dive; infinite builds.

**Slice scope (big & feature-rich):**
- 8 hand-designed rooms per dive (arena shapes, hazard layouts, spawn patterns) + endless depth scoring after the dive.
- Twin-stick-lite combat: left virtual stick moves, auto-aim option ON by default (touch-first); desktop WASD + mouse.
- 15 relics drafted as cards (pick 1 of 3 per room clear) with wild interactions (e.g., ricochet + nova + magnet chains). Zero jargon on cards — one-line plain-English effect text.
- Rift modifiers per dive: low gravity, mirror rooms, time-slow zones; daily rift seed shown on menu.
- Cosmic rift look: violet void, floating neon ruins, light-trail bullets, shard-burst kills. 100% code-drawn.
- How-to-Play (3 illustrated steps) + first-dive guided hints.

**Acceptance:** full dive tap-through (rooms 1–8 → drafts → modifiers → results); relic interactions produce no NaN/undefined states; difficulty curve playable on touch; zero console errors.

---

## How to fire (for the main agent, when Huzaifa says go)
1. Create 4 side chats (one per game) and drop in the matching brief + the 10 standing rules above.
2. Each builder follows the standing pipeline (BUILD-LEDGER → art lock → budgets → code → self-QA → artifact → approval → verify → dual delivery + SLICE/QA/LINK docs).
3. Do NOT start all 4 publishes at once if Huzaifa is asleep — approvals time out; stagger so each approval card arrives while he is awake.
