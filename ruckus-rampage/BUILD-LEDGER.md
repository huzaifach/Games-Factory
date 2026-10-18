# RUCKUS RAMPAGE — BUILD LEDGER
**Batch 2 of the all-night game factory** | Owner: Huzaifa | Started: 2026-10-18 (~03:00 PKT)
**Folder:** `~/workspace/game-factory/ruckus-rampage/` | **Side chat:** "Research and build game prototypes"
**Engine:** Phaser 3.60.0 — single global copy at `~/workspace/global-libs/phaser/phaser-3.60.0.min.js`
(inlined into the dist HTML at build time; NEVER re-downloaded, never duplicated per-project)
**Research rank:** 8 (physics brawler vs bots in a neon akhara, landscape, 2-minute rounds)

---

## 1. FULL GAME VISION (the eventual complete game — this vertical slice is one milestone of it)

RUCKUS RAMPAGE is the definitive slapstick physics brawler for mobile browsers: chunky
wobble-blobs, desi street-fight comedy, and knockouts so big they deserve slow motion.
The full vision:

- **Roster of ruckus-bots:** 12+ named bots with distinct fighting personalities, signature
  taunts, rivalries, and evolving banter across matches (a mohalla of fighters you love
  to hate).
- **Many arenas:** neon akhara, rooftop rumble, beach brawl, truck-yard takedown, wedding
  hall havoc, monsoon terrace — each with unique hazards, crowd, and music flavor.
- **Deep weapon sandbox:** 20+ slapstick weapons (dhol-sticks, flying chappals, spring
  gloves, pillows, magnet hands, lota launchers, kite-string whips...) with distinct
  knockback arcs, combos, and weapon-vs-weapon clashes.
- **Ruckus draft roguelite-lite:** full upgrade trees across a tournament ladder; silly
  builds (butter-feet + heavy-belly = unstoppable sliding mountain).
- **Career:** seasons, championship belts, costume/weapon/arena collection, record book
  (biggest KO, longest rally, funniest kill-feed line), shareable KO compilation cards.
- **Party modes (later):** 2-player same-device (split controls), King of the Akhara
  survival ladder, challenge mode (hand-designed trick scenarios).

**This vertical slice is a milestone toward that vision — never "done", always a step.**

---

## 2. THIS VERTICAL SLICE — expanded scope (Batch 2, tonight)

A big, feature-rich slice — not a minimal one. Everything below is IN SCOPE tonight:

1. **Complete match flow:** Title → How-to-Play (3 illustrated steps) → Practice round
   (60s vs 1 passive bot with pulsing hints) → 3-round ladder match → Ruckus Draft
   between rounds → Sudden-death shrinking arena in round 3 → Win/Lose/Tie results
   with stats, stars, and unlocks → rematch.
2. **6 fighters per match:** YOU + 5 named bots with distinct fighting styles and
   kill-feed story lines —
   - **RUSHR** (red) — the Rusher: charges the nearest rival non-stop.
   - **CHILLO** (orange) — the Camper: holds the center, counter-punches.
   - **ZIGGY** (purple) — the Trickster: dashes, feints, throws weapons.
   - **THUMPA** (grey-brown) — the Heavy: slow, huge knockback, hard to move.
   - **SQUEAK** (yellow-green) — the Coward: runs away, throws from far.
   - **DUMMY** (practice only) — stands still, exists to be bonked.
3. **Wobble mechanic (the one-line rule):** "Hits make you WOBBLY — wobbly blobs fly
   farther!" Every hit adds wobble %; higher wobble = bigger knockback. Shown as a ring
   around each fighter. KO = launched off the arena (past the ropes/void) or dropped
   through a collapsed tile. 3 lives per round; respawn with brief invincibility.
4. **EVERYTHING IS A WEAPON — 5 slapstick weapons**, each with a distinct knockback arc
   and KO power, usable by player AND bots:
   - **DHOL-STICK** — big melee swing, wide arc, huge launch. "Big swing, big launch!"
   - **FLYING CHAPPAL** — thrown sandal, slight homing, medium KO. "It always comes back."
   - **SPRING GLOVE** — punch extends across the ring, massive knockback + ragdoll tumble.
   - **PILLOW** — soft wide smack, feather burst, builds wobble fast, low direct KO.
   - **MAGNET HAND** — yanks the nearest rival/weapon close, then SLAM.
5. **RUCKUS DRAFT:** after rounds 1 and 2, pick 1 of 3 random upgrades (one-line
   descriptions, silly builds encouraged):
   Double Jump / Sticky Hands / Shockwave Clap / Heavy Belly / Spring Legs /
   Butter Feet / Big Head / Feather Fall / Rubber Body.
6. **ARENA HAZARDS:** rotating center platform (carries fighters), bumper dhols
   (bounce you sky-high with a BOING), collapsing edge tiles (flash → fall → respawn).
   Bots die funny too — kill-feed calls it out.
7. **Sudden death:** round 3 arena shrinks over 90 seconds; ropes close in; no hiding.
8. **Progression (localStorage):** match stars (1–3), total wins, 5 unlockable costumes
   (Red Bandana → Golden Turban → Pirate Hat → Crown), 3 arena themes
   (Neon Akhara → Rooftop Rumble at 3 wins → Beach Brawl at 6 wins).
9. **Understandability systems (Huzaifa's hard rule):**
   - How-to-Play screen BEFORE first play (3 illustrated steps, code-drawn).
   - Practice round: 1 passive bot, pulsing hint arrows teach move → grab → KO in 60s.
   - Win condition always visible: objective banner "Knock out 5 bots — N left!".
   - HUD always answers "what do I do now?" (objective + timer + your lives + your wobble).
   - Every mechanic explainable in ONE simple line — or it gets cut.
10. **Game feel (non-negotiable):** huge knockback with ragdoll tumble (spinning limbs),
    impact star-bursts + slow-mo on big KOs, screen shake, hit-pause, squash-and-stretch,
    eased movement, ambient life (crowd silhouettes waving, confetti on round wins),
    fully synthesized WebAudio (dhol-beat match music, thwacks, boings, crowd oohs/aahs),
    polished UI transitions. Cut a feature rather than ship it feeling cheap. No popping.
11. **Controls:** virtual joystick (left) + HIT and JUMP buttons (right) on touch,
    landscape-first; WASD/arrows + J/Space + K/W on desktop; portrait shows a polite
    rotate hint.
12. **Quality bar:** zero console errors; full-screen on real phones (no black bars, no
    cut-off buttons); loading with live progress %, Start waits until ready, honest
    "try again" on failure; 60fps target; single self-contained HTML, zero external
    requests, < 1.5 MB.

### Explicitly OUT of this slice (future milestones)
Online multiplayer, more arenas/weapons/bots, tournament career, same-device 2P,
challenge scenarios, share-card export.

---

## 3. MILESTONES — honest % complete

| # | Milestone | Status | % |
|---|-----------|--------|---|
| 1 | BUILD-LEDGER.md (this file) | done | 100 |
| 2 | Art direction locked (ART-DIRECTION.md) | pending | 0 |
| 3 | Performance budgets set (PERF.md) | pending | 0 |
| 4 | Core engine: custom knockback/wobble physics + ragdoll tumble | pending | 0 |
| 5 | 6 fighters + 5 bot personalities + DUMMY practice AI | pending | 0 |
| 6 | 5 weapons with distinct arcs (player + bot usable) | pending | 0 |
| 7 | Arena: ropes w/ physics, rotating platform, bumper dhols, collapsing tiles | pending | 0 |
| 8 | Match flow: title → how-to → practice → 3 rounds → drafts → sudden death → results | pending | 0 |
| 9 | Ruckus draft (9 upgrades, pick-1-of-3, silly stacking) | pending | 0 |
| 10 | Progression: stars, costumes, arena themes, localStorage | pending | 0 |
| 11 | Synthesized WebAudio (dhol-beat music + full SFX + crowd) | pending | 0 |
| 12 | Game-feel pass (slow-mo KOs, star-bursts, shake, hit-pause, confetti, crowd) | pending | 0 |
| 13 | Controls: touch joystick + buttons, desktop keys, rotate hint | pending | 0 |
| 14 | Node logic tests (knockback, AI, draft, rounds, unlocks) | pending | 0 |
| 15 | Self-QA (zero console errors, size/mobile/layout audits) | pending | 0 |
| 16 | Publish + cold-verify public link; SLICE.md / QA.md / LINK.md | pending | 0 |

**Overall: ~6%** — ledger written; everything else is tonight's work.

---

## 4. STANDING RULES (apply to every line of work)

- Roman Urdu to Huzaifa (respectful "aap", simple, non-technical); ALL work/code/docs in English; ALL in-game UI/text FULLY in English.
- NEVER the words "prototype"/"demo" anywhere user-visible — this is a **vertical slice**.
- Global-libs single-copy rule: Phaser inlined from `~/workspace/global-libs/phaser/` at build time only.
- BUILD-LEDGER first → art direction lock → perf budgets → code → self-QA.
- Chunky rounded brawlers with springy limbs; flat boxes and programmer-art are BANNED.
- Understandable-first: how-to screen, practice round, always-visible objective, one-line mechanics.
- Zero console errors; test everything myself; "it exported" is never the bar.
- Cut features rather than ship them feeling cheap.
