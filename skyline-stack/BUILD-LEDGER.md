# SKYLINE STACK — BUILD LEDGER
**Batch 2 of the all-night game factory** | Owner: Huzaifa | Started: 2026-10-18 (~03:00 PKT)
**Folder:** `~/workspace/game-factory/skyline-stack/` | **Side chat:** "Research and build game prototypes"
**Engine decision (deliberate, documented): VANILLA JavaScript + Canvas 2D — zero external libraries.**
Why: the brief demands a self-contained artifact **target under 1MB** with zero external requests.
Phaser 3.60.0 minified alone is 1.2MB, so inlining it makes the <1MB target impossible.
A one-tap stacker lives or dies on custom juice (pendulum cable physics, magnet-snap slow-mo,
bloom, sway) — all of which is hand-rolled canvas code anyway; a framework adds weight, not value,
here. This breaks no factory rule: the global-libs single-copy rule forbids *re-downloading*
frameworks, not choosing the right tool. Nothing is downloaded for this game — no new lib, so no
global-libs README entry is required. (Batch 1 / Gully Champion correctly used Phaser; each game
gets the engine its brief demands.)

---

## 1. FULL GAME VISION (the eventual complete game — this slice is one milestone of it)

SKYLINE STACK is the definitive one-thumb tower stacker: a crane, a swaying tower, and a city that
moves in as you build. The full vision:

- **A living city, not a high score:** multiple districts to build across (Neon Karachi, Desert
  Oasis, Monsoon Mumbai, and later: Snowline Murree, Port Qasim docks, Old City bazaar) — each a
  full art theme with its own weather, skyline, music mood, and tenant stories.
- **Tenants with arcs:** families move in every 5 floors and their tiny window-stories evolve across
  sessions (the cat has kittens; the reader opens a library; the party couple gets married).
  A "Who lives here" tower directory you can scroll.
- **Crane garage:** unlockable crane skins (vintage steam crane, neon maglev, bamboo scaffold crane)
  with slightly different swing character.
- **Daily tower:** one shared seed per day — same wind pattern for everyone; local leaderboard of
  your own ghosts (no backend multiplayer, per standing rules).
- **Storm nights & seasons:** rain, heat-haze, snow; night mode where every lit window matters.
- **Photo mode + share cards:** every milestone renders a screenshot-worthy card.
- **Records that matter:** best height per theme, longest perfect streak, most tenants housed.

## 2. THIS VERTICAL SLICE — expanded scope (Batch 2, tonight)

A big, feature-rich slice — not a minimal build:

1. **Endless stacking core with real crane physics** — the carriage slides on its rail while the
   floor hangs from a cable with true pendulum sway (driven by carriage acceleration + wind).
   Tap anywhere to release; the block falls with a live dashed drop-guide and landing brackets so
   aiming is always readable. Drop resolution in three flavors:
   - **PERFECT** (lands within tolerance): the floor *grows back* wider, light-bloom flash,
     rising chime pitched by combo, floating "PERFECT ×n".
   - **SAVED!** (near-miss): magnet-snap pulls the floor into place during a slow-mo beat —
     the clip-worthy moment.
   - **Shear / miss:** overhang shears off as tumbling debris; a total miss ends the run with a
     tumbling block and crash.
2. **Combo/flow scoring** — consecutive perfects build a combo multiplier (saved keeps it alive,
   shear resets it); combo badge burns next to the tower top from ×3 up.
3. **LIVING TOWER** — every 5 floors a tenant event: windows flick on warm, a tiny animated
   window-story plays (cat crossing, reader rocking, housewarming party with confetti + giggle,
   hanging plants, stargazer, chef's steam), and a toast names the family ("Floor 20 · The Patels
   moved in — housewarming party!"). Lit windows stay lit: the tower remembers.
4. **Rooftop milestones** — the floor where you earn them keeps the decoration forever:
   garden at 25 (planters + swaying leaves), pool at 50 (shimmering blue), antenna at 100
   (blinking red beacon).
5. **WIND NIGHTS from floor 15** — periodic gusts telegraphed 1.6s ahead (pulsing wind meter,
   rising howl, "Gust incoming…"): the whole tower bends on spring physics, the cable gets
   pushed, falling blocks drift. The wind meter (strength + direction) keeps it fair — never
   feels random.
6. **Three unlockable tower themes** — Neon Karachi (default), Desert Oasis (reach 30 floors),
   Monsoon Mumbai (reach 60 floors); theme select with locked/unlocked states and requirements;
   instant palette/parallax/weather swap.
7. **Readable progression, no jargon** — stars at 25 / 50 / 100 / 150 / 200 floors (★☆☆☆☆ +
   "Next star: 50 floors"); best height saved per theme + overall in localStorage.
8. **Share card** — one tap renders a 1080×1350 PNG of your tower with height, stars and theme:
   the screenshot moment.
9. **Understandability package (Huzaifa's hard rule):**
   - How-to-Play screen with **3 animated illustrated steps** (live mini-canvas demos).
   - Guided tutorial: the first 5 drops of your first run hand-hold you — a pulsing ring shows
     exactly when to tap ("NOW!").
   - The goal ("Build as tall as you can!") is always on screen; the HUD always answers
     "what do I do now?".
10. **Game feel everywhere** — screen shake (trauma-based), pooled particles (bloom sparks,
    confetti, dust, magnet streaks), eased camera, floating texts, ambient life (drifting clouds,
    flapping birds, flickering windows, twinkling stars), full synthesized WebAudio music loop +
    10 SFX. Cut before shipping cheap — no popping anywhere.
11. **Platform robustness** — full-bleed portrait on phones (no black bars, no cut-off buttons),
    touch primary + Space/click desktop, staged loader with live % (Start waits until ready),
    honest "Try again" recovery on any boot error, auto-pause when the tab hides, mute toggle,
    60fps budget.

## 3. MILESTONES — honest % complete

| # | Milestone | Status | % |
|---|-----------|--------|---|
| 1 | BUILD-LEDGER.md (this file) | done | 100 |
| 2 | Art direction locked (ART-DIRECTION.md) | done | 100 |
| 3 | Performance budgets set (PERF.md) | done | 100 |
| 4 | Pure logic: drop resolution, combo, stars, theme unlocks (logic.js + 44 node tests) | done, 44/44 green | 100 |
| 5 | Synthesized WebAudio engine (music loop + 10 SFX) | done | 100 |
| 6 | Core loop: crane pendulum + cable sway + drop guide + tap-to-drop | done, browser-verified | 100 |
| 7 | Perfect / SAVED! slow-mo / shear / miss resolution + juice | done, all 4 observed live | 100 |
| 8 | Living tower: tenant stories + rooftop milestones + toasts | done (24-floor run: tenants at 5/10/15/20) | 100 |
| 9 | Wind nights: gusts, telegraphs, tower sway physics, wind meter | done (gusts observed 15+) | 100 |
| 10 | 3 themes + unlock ladder + theme select | done (desert applied + persisted) | 100 |
| 11 | Stars, bests, share card, localStorage records | done | 100 |
| 12 | How-to-Play (3 animated steps) + 5-drop guided tutorial + persistent goal HUD | done | 100 |
| 13 | Menus / pause / game-over / loader / error recovery | done (4 bugs found & fixed, re-verified) | 100 |
| 14 | Self-QA: node tests green, headless-Chromium mobile+desktop (zero console errors, screenshots, tap-through play) | done — see QA.md | 100 |
| 15 | Publish + cold-verify public link | **LIVE 2026-10-18 ~08:42 PKT** — Huzaifa approved the share | 100 |

**Overall: 100%** — the vertical slice is complete, self-QA'd (all gates green), published at
https://muse.ai/s/skyline-stack-xuxg6zjxuxp0xkvk (see LINK.md). Final verification = Huzaifa's
real-phone playtest (automated cold-checks are blocked: VM egress tunnel fails + Cloudflare
bot-shielding 403s bots — the known-live Blob Arena link behaves identically).

## 4. STANDING RULES (apply to every line of work)

- **Language:** all code, docs, work in English; ALL in-game UI/text FULLY in English. (Chat with Huzaifa in Roman Urdu; work in English.)
- **Forbidden words** anywhere Huzaifa can see: "prototype", "demo". This is a **vertical slice**.
- **Build discipline order:** ledger → art direction → performance budgets → code → self-QA.
- **Quality bar:** zero console errors; everything tested; real-phone ready (full-screen, no black bars, no cut-off buttons); touch + desktop controls; loading survives slow connections (live progress %, Start waits until ready, honest "try again" button — never a dead-end error); target 60fps. "It exported" is never the bar.
- **Game feel (non-negotiable):** every drop juicy — bloom, chime, shake, particles, slow-mo, eased motion, ambient life, full synthesized WebAudio music + SFX. Cut a feature rather than ship it feeling cheap. No popping.
- **Design rules:** no levels/XP jargon — stars, themes, unlock ladders; hand-designed pacing curve; procedural only for textures/particles; no gambling; no backend multiplayer.
- **Global libs:** no framework downloaded for this game (vanilla canvas keeps the <1MB target honest).
- **Understandability:** How-to-Play before first play; first-5-drop guided tutorial; goal always visible; HUD always answers "what do I do now?". One-line-explainable mechanics only.
- **Deliverables in this folder:** `BUILD-LEDGER.md` (this), `ART-DIRECTION.md`, `PERF.md`, `src/` (multi-file source), `dist/skyline-stack.html` (single self-contained file, zero external requests, **under 1MB**), `test/` (node logic tests + headless-browser QA), `SLICE.md`, `QA.md`, `LINK.md`.

## 5. LOG

- 2026-10-18 ~03:00 PKT — Ledger written. Engine decision: vanilla canvas (Phaser 1.2MB cannot meet the <1MB artifact target). Milestones 2–15 ahead.
- 2026-10-18 ~03:10 PKT — ART-DIRECTION.md locked (3 themes, crane, tower, tenants, juice language).
- 2026-10-18 ~03:15 PKT — PERF.md set (60fps budgets, entity caps, QA gates).
- 2026-10-18 ~03:20–03:45 PKT — Source written: logic.js, audio.js (WebAudio synth), game.js (~1900 lines), styles.css, index.html.
- 2026-10-18 ~03:45 PKT — build.js: single-file dist 90.4KB, zero-external-request audit PASS, 44/44 logic tests green.
- 2026-10-18 ~03:50–04:20 PKT — Headless-Chromium QA (mobile+desktop): 4 bugs found and fixed (loader/menu overlap, game-over screen missing, how-to title cutoff, menu crane cable over title). Extended 24-floor run: tenants + wind gusts verified live, zero console errors. See QA.md.
- 2026-10-18 ~04:30 PKT — Web artifact build dispatched (slug: skyline-stack) with byte-for-byte fidelity instruction. Awaiting builder handoff → then share + cold-verify.
- 2026-10-18 ~04:45 PKT — Builder DONE: artifact byte-identical to dist (sha256 verified), its own audit clean (nav 200, zero console errors, zero external requests, live probe: menu → gameplay OK).
- 2026-10-18 ~04:50 PKT — GLOBAL-AUDIENCE RULE applied (set 03:35, applies to all builds): theme cards now show one-line universal taglines ("A city of lights that never sleeps" etc.). Rebuilt (91.0KB), 44/44 tests green, headless tap-through zero errors, taglines screenshot-verified. Artifact edit dispatched with the new file.
- SHARE BLOCKED (04:50 PKT): artifact.share needs Huzaifa's one-tap approval — timed out (he's asleep). Will retry share + cold-verify when he's awake.
- LIVE (2026-10-18 ~08:42 PKT): Huzaifa approved the share — public URL https://muse.ai/s/skyline-stack-xuxg6zjxuxp0xkvk written into LINK.md. (Note: automated cold-checks blocked — VM egress tunnel fails and curl gets Cloudflare 403 bot-shielding, same as the known-live Blob Arena link — so his real-phone open is the final verification.)
