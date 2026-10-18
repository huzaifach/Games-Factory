# BAZAAR SIEGE — Vertical Slice (2026-10-18)

A complete, playable tower-defense vertical slice: hold a glowing night bazaar for 15 waves against the smog-imp horde, then push into endless night. One self-contained HTML file, zero external requests, all art code-drawn, all audio synthesized.

## What's playable

**Core loop** — Build phase (place turrets on 9 stall rooftops, merge duplicates, upgrade 3 stalls, scout the next wave) ↔ Wave phase (imps march right-to-left down 3 lanes toward the bazaar gate; your turrets fire on their own) × 15 waves → victory/defeat → endless mode.

**6 merge-evolve turrets** (bottom dock cards, each with a universal one-line gloss):
- Rickshaw Rocket (60) — lobs splash rockets
- Kite-Cutter (50) — fast single-target blades, hits air
- Chai-Splash (70) — slowing splash field
- Lantern Mortar (90) — long-range arcing bombs, hits air
- Dhol-Drum (80) — radial shockwave pulses
- Peacock Prism (110) — piercing light beam, hits air

Drag any turret onto an identical unevolved turret → dramatic merge cinematic (white-gold flash, converging petal swirl, scale punch, star badge, shockwave ring, 70 ms hit-pause) → evolved form at ~2.6× damage with gold trim. Evolved turrets can't merge again (gentle shake + hint).

**10 enemy types**, each with a distinct silhouette and a one-line rule shown in the Scout panel: Runner, Brute, Shield (brass shield pool), Healer (heals allies), Splitter (bursts into 2 imp-lings), Kite (airborne — only blades, beams and mortars hit it), Digger (burrows with dust telegraph), Thief (steals 20 coins if it leaks, costs no life), Drummer (speed aura), Ember (death blast hurts other imps).

**2 bosses** — Wave 10: THE CONVOY (800 shield pool + 1400 body, "Break its shield first!"); Wave 15: THE SWARM-LORD (2600 HP, sheds 6 swarm imps every 7 s, "It bursts apart — splash hurts the swarm!").

**3 festival events** (banner + stinger + gameplay shift): Monsoon (waves 4, 14 — rain; splash turrets ×1.5), Blackout (waves 7, 13 — dim; everything ×0.45 except Lantern ×1.0, Prism ×0.5), Wedding Procession (wave 11 — a golden drum-tower marches the parade path for ~20 s, pounding imps with shockwaves).

**Stall economy** — 3 stalls under the battlefield; tap → upgrade panel (100/220/380 coins → +25%/+60%/+120% damage). Each stall buffs the 3 rooftops in the row directly above; glowing link-lines brighten per level.

**Understandability** — How-to-Play (3 illustrated steps, verbatim universal wording), guided tutorial across waves 1–3 (pulsing gold arrow: card → rooftop → NEXT WAVE → merge), a persistent hint pill that always answers "what do I do now?", Scout wave-preview panel (enemy icons + counts + one-line rules, boss seal + telegraph), and the always-visible goal "Hold the bazaar till dawn — Wave X of 15."

**Meta** — Best Night + victory stars in localStorage (`bazaarSiegeSaveV1`); victory stars by lives kept (≥15 → 3, ≥8 → 2, else 1); endless mode after victory; speed 1x/2x + pause (≥88 px targets); mute toggle; synthesized dhol-groove ambience that intensifies with danger.

## Controls

- **Tap** turret card → tap glowing rooftop = place. Tap placed turret = range ring + Sell (70% refund).
- **Drag** turret onto identical turret = merge/evolve. Drag to an empty rooftop = move.
- **Tap** stall = upgrade panel. **SCOUT** = next-wave preview. **NEXT WAVE** = ring the drum.
- Speed toggle + pause in the HUD. Everything is touch-sized (≥88 px); mouse works identically.

## Systems summary

- Placement/sell/move/merge on 9 hand-placed rooftop slots (layout from PERF.md).
- 15 hand-designed waves with per-group spawn scheduling (type/count/interval/delay/lane); HP scales ×(1 + wave×0.10); kill coins + wave bonus (25 + wave×5).
- Turret AI: staggered 0.15 s scans, targets the imp closest to the gate it can hit; per-turret anticipation (mortar tilt, drum pulse, beam charge feel); pooled projectiles (rocket/blade/chai/lantern) with arcs, trails, splash, slow puddles.
- Enemy behaviors: burrow cycles, healer pulses, drummer auras, splitter spawns, ember chains, thief steal-on-leak, boss shield phases and swarm bursts.
- Events: blackout dim + fireflies, monsoon rain + shimmer rings, wedding drum-tower ally.
- Game feel: hit flash, knockback, pooled damage numbers, petal/spark/smoke bursts, shockwave rings, screen shake (never in tutorial wave 1), hit-pause on merges/shield-breaks/boss kills, squash-and-stretch march, swaying lanterns, twinkling fairy lights, drifting petals.

## What's stubbed for the full game

- Only **one bazaar** (the full vision has five: Anarkali, Empress Market, Qissa Khwani, Hussain Agahi, Liaquat Bazaar).
- **6 turrets, 1 merge tier** (vision: 12 turrets, 3 tiers, truck-art skin collections).
- **10 enemies, 2 bosses** (vision: 25+ enemies, 8 multi-phase bosses, bigger festival deck incl. basant kite-storm and chand-raat rush).
- **Stalls buff one row only**; no persistent decorate-between-sieges meta, no idle earnings.
- **Endless is procedural**, not the hand-designed weekly seeds; "Best Night" is local-only, no leaderboards.
- No share-card screenshots yet.

## Global-audience wording layer

Per Huzaifa's standing rule: night-bazaar visuals stay, but every name in UI ships with a one-line universal gloss in plain English (turret cards, enemy display names + rules, event banners, tutorial, victory/defeat). Exact wordings live in ART-DIRECTION.md ("Global audience wording layer") and are asserted verbatim by `test/logic.test.js`. Internal code ids are unchanged.
