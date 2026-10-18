# BAZAAR SIEGE — BUILD LEDGER
**Batch 2, item 1 of the all-night game factory** | Owner: Huzaifa | Started: 2026-10-18 (~02:56 PKT)
**Folder:** `~/workspace/game-factory/bazaar-siege/` | **Side chat:** "Research and build game prototypes"
**Engine:** Phaser 3.60.0 — single global copy at `~/workspace/global-libs/phaser/phaser-3.60.0.min.js` (copy/inline from there at build time; NEVER re-download)

---

## 1. FULL GAME VISION (the eventual complete game — this slice is one milestone of it)

BAZAAR SIEGE is the definitive desi tower-defense saga: hold the night bazaars of Pakistan till dawn against the smog-imp horde. The full vision:

- **Five bazaars:** Lahore's Anarkali, Karachi's Empress Market, Peshawar's Qissa Khwani, Multan's Hussain Agahi, Quetta's Liaquat Bazaar — each a hand-designed map with distinct palette, lane shapes, stall layouts, and a signature festival calendar.
- **12 merge-evolve turrets** across 3 merge tiers (base → evolved → legendary), each with a truck-art skin collection to unlock.
- **25+ enemy types, 8 bosses** with multi-phase mechanics; a festival event deck (blackout, monsoon, wedding, basant kite-storm, chand-raat rush).
- **Stall-keep tycoon meta:** a persistent bazaar you decorate and upgrade between sieges; stalls earn coins even while you sleep (idle, honest timers).
- **Endless leagues:** weekly hand-designed endless seeds, leaderboard-style "Best Night" badges (local-first, no backend multiplayer).
- **Share-first:** every boss kill and legendary merge produces a screenshot-worthy share card.

This vertical slice (tonight) is milestone 1 of that vision: one bazaar, 6 turrets, 15 waves, 2 bosses, 3 festival events, stall upgrades, endless mode.

## 2. THIS VERTICAL SLICE — expanded scope (Batch 2, tonight)

A big, feature-rich slice — never a minimal demo:

1. **Lane defense core:** 3 lanes, smog imps march right-to-left toward the bazaar gate; 9 hand-placed stall-rooftop slots; tap-card → tap-rooftop placement; drag-to-merge.
2. **6 merge-evolve turrets** with distinct silhouettes/roles/projectiles: Rickshaw Rocket (splash), Kite-Cutter (fast single), Chai-Splash (slow field), Lantern Mortar (long-range arcs), Dhol-Drum (shockwave), Peacock Prism (beam). Merge = dramatic visible transformation + star badge.
3. **10 enemy types** with distinct silhouettes and one-line rules: runner, brute, shielded, healer, splitter, kite-flyer (airborne), digger, lantern-thief, drummer-imp, ember-imp.
4. **2 bosses:** wave-10 THE CONVOY (shielded war-rig + escorts; "Break its shield first!"), wave-15 THE SWARM-LORD (bursts into swarm rings; splash counters).
5. **15 hand-designed waves + endless mode** after victory; 20 lives; wave preview ("Scout") panel; boss warning banners; speed 1x/2x/pause.
6. **3 festival events** mid-wave with banner + stinger: Blackout (lanterns fight at full power, others weakened), Monsoon (splash buffed + rain), Wedding Procession (golden dhol-tower ally marches across).
7. **Stall-keep economy:** 3 upgradable stalls; upgrades buff adjacent turrets; glowing link-lines show the buff visually.
8. **Understandability package:** How-to-Play screen (3 illustrated steps), guided tutorial across waves 1–3 (pulsing highlights: card → rooftop → merge), persistent hint line answering "what do I do now?", win/lose always visible ("Hold the bazaar till dawn — Wave X of 15"). **Global audience wording:** every turret/enemy/event name in UI carries a one-line universal gloss in plain English (flavor kept, terms glossed — see ART-DIRECTION.md "Global audience wording layer").
9. **Full game feel:** hit flash, knockback, damage numbers, particles, screen shake, hit-pause on big moments, eased motion, squash-and-stretch, ambient life (swaying lanterns, twinkling fairy lights, drifting petals), synthesized WebAudio (dhol beats, per-turret shots, festival stingers, bazaar ambience).
10. **Victory/defeat flow:** survive 15 → stars by lives left + endless unlock; 0 lives → defeat with "Best Night" + one-tap retry. Best Night + stars in localStorage.
11. **Mobile-first delivery:** portrait 720×1280 FIT, full-screen no black bars, ≥88px touch targets, zero console errors, single self-contained HTML < 2MB, zero external requests.

## 3. MILESTONES — honest % complete

| # | Milestone | Status | % |
|---|-----------|--------|---|
| 1 | BUILD-LEDGER.md (this file) | done | 100 |
| 2 | Art direction locked (ART-DIRECTION.md) | done (incl. global-audience wording layer) | 100 |
| 3 | Performance budgets set (PERF.md) | done | 100 |
| 4 | Data + pure logic (data.js, logic.js, node tests) | done — 22/22 tests pass | 100 |
| 5 | Synthesized WebAudio engine (audio.js) | done | 100 |
| 6 | Art factories — all textures code-drawn (art.js) | done | 100 |
| 7 | Boot + Menu + How-to-Play (3 illustrated steps) | done | 100 |
| 8 | Game scene: lanes, slots, placement, drag-merge, sell | done | 100 |
| 9 | 15 waves + 2 bosses + 3 festival events | done | 100 |
| 10 | Stall economy + waves 1–3 guided tutorial + hint line | done | 100 |
| 11 | Game-feel pass (all juice, no popping) | done (reviewed) | 100 |
| 12 | Self-QA + single-file build (dist/bazaar-siege.html) | done — 1.26MB, 0 ext refs, headless tap-through green, coordinator re-verified | 100 |
| 13 | Publish + cold-verify public link | parent's step | 0 |

**Overall: ~95%** — the vertical slice is complete, self-QA'd, and the final
single-file build (`dist/bazaar-siege.html`, 1.26 MB, zero external requests)
is byte-ready for publish. Only the parent's artifact publish + cold browser
verification remain.

## 4. STANDING RULES (apply to every line of work)

1. English only — code, comments, docs, in-game text. Never "prototype"/"demo": this is a **vertical slice**.
2. Global libs single-copy rule: Phaser inlined from `~/workspace/global-libs/phaser/` at build time, never re-downloaded. Dist < 2MB, zero external requests.
3. Art direction locked before systems code; performance budgets before building.
4. Zero console errors; test everything; mobile-first (touch + desktop).
5. Game feel is non-negotiable; cut a feature before shipping it feeling cheap.
6. Every mechanic explainable in ONE simple line, or it gets simplified/cut.
7. HUD always answers "what do I do now?"; win/lose always visible; no dead ends.
8. No levels/XP jargon; no gambling; no backend multiplayer.
9. Write exhaustively — terse docs are a defect.
10. GLOBAL AUDIENCE RULE (set 2026-10-18 on Huzaifa's order): the game is globally themed for the whole mass world audience. The night-bazaar visual identity STAYS — it reads as festive market art anywhere — but everything must be instantly understandable to a player anywhere: no local-only reference in tower/enemy/event names or UI text without an in-game one-line explanation; prefer universally understood wording (keep the flavor, gloss the terms); gameplay itself stays universal. This stacks with the "every mechanic in ONE simple line" rule — it is purely a naming/wording/understandability layer; art direction and systems are unchanged.
