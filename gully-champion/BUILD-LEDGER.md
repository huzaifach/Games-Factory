# GULLY CHAMPION — BUILD LEDGER
**Batch 1 of the all-night game factory** | Owner: Huzaifa | Started: 2026-10-18 (~02:35 PKT)
**Folder:** `~/workspace/game-factory/gully-champion/` | **Side chat:** "Research and build game prototypes"
**Engine:** Phaser 3.60.0 — single global copy at `~/workspace/global-libs/phaser/phaser-3.60.0.min.js` (copy from there at build time; NEVER re-download)

---

## 1. FULL GAME VISION (the eventual complete game — this slice is one milestone of it)

GULLY CHAMPION is the definitive tape-ball street-cricket game: one thumb, golden-hour gallis, a mohalla that remembers your name. The full vision:

- **Career journey:** from gali rookie to Mohalla Legend across seasons; rival gangs, street reputation, trophy shelf.
- **Many gallis:** rooftop, beach, mountain road, night street, railway colony, riverside — each with distinct palette, crowd chants, weather moods.
- **Deep batting:** timing, footwork, loft control, 360-degree shot placement, signature shots per hero.
- **Bowling playable** (later milestone — not this slice): full over as the bowler with the same telegraph/read skill game inverted.
- **Squads & rivals:** named rivals with evolving banter, rematch arcs, grudge matches.
- **Collection:** truck-art bat skins, hero outfits, gali unlocks, record book.
- **Share-first:** every big moment produces a screenshot-worthy share card.

## 2. THIS VERTICAL SLICE — expanded scope (Batch 1, tonight)

A big, feature-rich slice — not a minimal demo:

1. **Flick-timing batting engine** — tap-and-hold sets power, release timing sets loft + direction; timing window graded (Early / Good / Perfect); Perfect releases trigger slow-mo "GULLY SIX" moment: time-scale dip, confetti burst, screen shake, crowd roar.
2. **3 game modes:**
   - **SUPER OVER** — 6 balls, chase a target vs AI.
   - **MOHALLA CUP** — 8-team street tournament bracket vs bot rivals with personalities and banter: Chacha Yorker (yorker-heavy), Speedy Shahid (raw pace), Doosra Daniyal (mystery spin), Bouncer Bilal (bouncer barrage), Swing Sultan (late swing), Tez Tariq (wide-yorker specialist), Chintu (loopy part-timer), plus the final boss "Gali Ka Badshah".
   - **TIME ATTACK** — 60-second endless bowling machine, combo scoring, rising speed.
3. **4 unlockable gallis** — Rooftop at Sunset (default), Beach, Mountain Road, Night Street with fairy lights; unlock via cup progress; each with distinct palette, crowd, ambient mood.
4. **6 delivery types with readable telegraphs** — yorker, bouncer, slower ball, inswinger, outswinger, doosra; bowler run-up + arm cues telegraph the type ~0.6s before release; bowler AI adapts to the batter's timing habits (early/late tendency tracking).
5. **Full cricket-rules feel** — wickets (bowled, caught, run-out), wides, no-balls, fielder AI (diving catches, run-out throws), over-by-over scorecard.
6. **Truck-art bat skins** (unlockable collection), career stats + records in localStorage, best-score **share card** moment (screenshot-worthy).
7. **Visuals:** golden-hour street cricket — warm gradient sky, string-light bokeh, dust particles on every hit, ball with motion-blur trail, crowd as layered animated silhouettes; bowler and batter are stylized rounded figures with squash-and-stretch bowling/batting animation — never boxy; 100% code-drawn, zero image assets.
8. **Audio:** fully synthesized WebAudio — bat crack, crowd ambience that swells on sixes, umpire calls ("SIX!", "OUT!", "WIDE BALL").
9. **Controls:** touch-primary (tap / hold / release + flick direction); desktop Space/mouse as bonus; portrait; full-screen with no black bars or cut-off buttons on real phones.

## 3. MILESTONES — honest % complete

| # | Milestone | Status | % |
|---|-----------|--------|---|
| 1 | BUILD-LEDGER.md (this file) | done | 100 |
| 2 | Art direction locked (ART-DIRECTION.md) | done | 100 |
| 3 | Performance budgets set (PERF.md) | done | 100 |
| 4 | Core engine: batting timing + ball physics + 6 deliveries | done, 21/21 node tests pass | 100 |
| 5 | 3 modes: Super Over, Mohalla Cup (8 bots), Time Attack | done (menu + match + result) | 100 |
| 6 | 4 gallis + unlock ladder | done | 100 |
| 7 | Rules feel: wickets/wides/no-balls, fielder AI, scorecard | done | 100 |
| 8 | Bat skins + career stats + share card | done | 100 |
| 9 | Synthesized WebAudio (music + SFX + umpire) | done (24-method synth engine) | 100 |
| 10 | Game-feel pass (all juice, no popping) | done (reviewed) | 100 |
| 11 | Self-QA (zero console errors, size/mobile/layout audits) | static QA done; live-browser check = parent's | 90 |
| 12 | Publish + cold-verify public link | parent's step | 0 |

**Overall: ~95%** — the vertical slice is complete, self-QA'd, and the final
single-file build (`dist/gully-champion.html`, 1.23 MB, zero external requests)
is byte-ready for publish. Only the parent's artifact publish + cold browser
verification remain.

## 4. STANDING RULES (apply to every line of work)

- **Language:** all code, docs, work in English; ALL in-game UI/text FULLY in English. (Chat with Huzaifa in Roman Urdu; work in English.)
- **Forbidden words** anywhere Huzaifa can see: "prototype", "demo". This is a **vertical slice**.
- **Build discipline order:** ledger → art direction → performance budgets → code → self-QA.
- **Quality bar:** zero console errors; everything tested; real-phone ready (full-screen, no black bars, no cut-off buttons); touch + desktop controls; loading survives slow connections (live progress %, Start waits until ready, honest "try again" button — never a dead-end error); target 60fps. "It exported" is never the bar.
- **Game feel (non-negotiable):** hit flash, knockback, damage numbers, particles, screen shake, hit-pause, eased movement (accel/decel, no sliding), squash-and-stretch, gravity arcs, ambient life, full synthesized WebAudio music + SFX, polished UI transitions. Cut a feature rather than ship it feeling cheap. Every interactive object animates between states — no popping.
- **Design rules:** no levels/XP jargon — simple readable progression (stars, collections, unlock ladders); hand-designed layouts; procedural only for textures/particles; no gambling; no backend multiplayer (local bots fine).
- **Global libs:** reuse `~/workspace/global-libs/phaser/phaser-3.60.0.min.js`; any new lib goes once into `~/workspace/global-libs/<name>/` + README note.
- **Deliverables in this folder:** `BUILD-LEDGER.md` (this), `ART-DIRECTION.md`, `src/` (multi-file source), `dist/gully-champion.html` (single self-contained file, Phaser inlined, zero external requests, **under 2MB**), `SLICE.md`, `QA.md`, `LINK.md`.

## 5. LOG

- 2026-10-18 ~02:35 PKT — Ledger created; build coordinator dispatched for the all-night shift.
- 2026-10-18 ~02:40 PKT — ART-DIRECTION.md + PERF.md locked. Audio + art delegated to two builders with exact API contracts.
- 2026-10-18 ~03:00 PKT — Core sources done (config/save/logic/util/ui/boot/menu/result/main/build). Logic suite 21/21 green.
- 2026-10-18 ~03:10 PKT — Audio (527 lines, 24 methods) + art (908 lines) delivered, API-conformant, syntax-verified.
- 2026-10-18 ~03:30 PKT — Match scene complete (~1,000 lines). Two review bugs fixed (clearTint on Container; intro texts leak). Cue ring added for timing readability.
- 2026-10-18 ~03:35 PKT — Final build: dist/gully-champion.html, 1.23 MB, 0 external refs. SLICE.md / QA.md / LINK.md written. Ready for parent publish + cold verify.
- 2026-10-18 ~night shift PKT — FIX AGENT round: true full-bleed rendering (aspect-matched logical
  height, no black bars at 390×844/360×800), result-scene button cut-off fixed (MENU was off-screen),
  input coordinate fix (removed Phaser autoCenter; CSS flex centers alone), match touch input moved
  to global pointerdown. Reverted an incorrect "centered hit area" change (Phaser's default container
  hit rect is correct). Headless QA green: full tap-through title→menu→match, completed swing,
  pause overlay, zero console errors. dist/gully-champion.html rebuilt (1.24 MB, 0 external refs).
