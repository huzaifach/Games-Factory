# BLOB ARENA — Build Ledger

> The single source of truth for this game. Read before touching code.
> This vertical slice is **Milestone M1** — a milestone, never "done".

## Game Identity

**BLOB ARENA** — a 3-minute, portrait, mobile-first .io-style blob battle royale.
You spawn small in a deep-sea arena with 11 bot rivals, each with a visible
personality. Eat glowing pellets, dodge bigger blobs, absorb smaller rivals for
growth spikes. In the final 30 seconds a shrink-storm closes in and forces
showdowns. The biggest blob when the timer hits zero wins the round and keeps
the crown.

In-game language: 100% English. No levels/XP jargon anywhere — progression is
crowns, badges and unlock ladders only. 100% code-drawn visuals, zero image
assets. Fully synthesized WebAudio (music + SFX). 11 local bots, no backend
multiplayer, no gambling.

## Full Vision Scope (the complete game this slice grows into)

1. **Modes** — Battle Royale (this slice), Crown Defense (king-of-the-hill with
   a roaming crown zone), Pellet Rush (60-second solo score attack), Storm
   Survival (endless shrinking arena vs waves of bots).
2. **Arenas** — 4 hand-designed biomes: Deep Sea (this slice), Coral Reef,
   Kelp Forest, Abyssal Trench — each with distinct palette, hazards
   (currents, urchin spikes) and pellet layouts.
3. **Roster** — 24 named bot personalities with rivalries, grudges and
   evolving behavior across rounds (a bot that you eliminate twice starts
   hunting *you*).
4. **Unlock ladder** — spend crowns on visual unlocks: blob trails, nucleus
   styles, victory emotes, arena themes. Cosmetic only, no pay-to-win, no
   gambling mechanics.
5. **Persistence** — career stats (wins, eliminations, biggest blob), season
   crowns, daily "tide" challenges, highlight replays of your best absorbs.
6. **Social-lite** — pass-and-play local tournaments (up to 4 humans on one
   device via split touch zones), shareable result cards.

## Milestones & Honest % Complete

| Milestone | Scope | % of full vision |
|---|---|---|
| **M1 — Vertical slice (THIS BUILD)** | 3-min battle royale, 11 personalities, crown system (3 crowns = Arena Legend), storm finale, dash-split, combos + milestones, kill feed + leaderboard, full synth audio, portrait mobile + desktop | **~40%** |
| M2 — Second arena + roster to 16, rivalries/grudges | Coral Reef biome, 5 new bots, grudge AI | ~55% |
| M3 — Unlock ladder + career stats | crown shop (cosmetic), stats screen, seasons | ~70% |
| M4 — Extra modes | Pellet Rush + Storm Survival | ~85% |
| M5 — Polish & launch | 4th arena, pass-and-play, result cards, final QA | 100% |

M1 is playable and complete **as a slice** — it is not the full game.

## Art Direction (LOCKED — settled before any systems code)

**World:** deep-sea gradient arena (abyssal navy `#04121f` at edges → teal
`#0e5a6d` glow at center), god-light rays slanting from the surface, drifting
plankton motes, soft vignette. The arena floor has faint hand-placed current
swirls (procedural texture only — layout is hand-designed).

**Blobs:** jelly-gloss bodies — radial gradient (pale highlight top-left →
saturated color → deep rim), white specular gloss streak, pulsing inner nucleus
with its own glow, spring-driven wobble on a 16-point perimeter (never a rigid
circle), squash-and-stretch along velocity. **Flat circles with no life are
banned.**

**Eating must feel DELICIOUS:** scale-pop (spring overshoot) + rising chime +
expanding ripple ring that merges into the eater. Big absorbs add screen shake;
eliminations add a hit-pause beat. Nothing pops between states — everything
tweens.

**Storm:** bruised-violet swirling wall with drifting spores; danger vignette
pulses red at the edge of the safe zone.

## Performance Budgets (set before building)

| Budget | Value | Rationale |
|---|---|---|
| Blobs | 12 (1 player + 11 bots) | fixed cast, O(n²) eat checks = 66 pairs |
| Pellets | 240 max, pooled | constant density, culled off-camera |
| Particles | 350 max pooled (70 ambient plankton + 280 effects) | zero per-frame allocation |
| Ripples | 24 pooled | merge/pulse rings |
| Draw ops / frame | ≤ 700 primitives | bg 1 blit + culled pellets + 12 blobs × ~6 ops + particles + UI |
| Sim tick | ≤ 2 ms @ 60 Hz fixed step | simple steering, spatial checks trivial at this scale |
| Frame target | 60 fps on mid-range phones | canvas 2D, DPR-aware, offscreen bg |
| Bundle | single HTML < 1 MB, zero external requests | vanilla JS + canvas, no frameworks |

## The 11 Personalities (the soul of the game)

| # | Name | Title | Color | Behavior |
|---|---|---|---|---|
| 1 | Brutus | the Bully | red `#ff4d5e` | hunts smaller blobs relentlessly |
| 2 | Shelly | the Camper | teal `#3fd0c9` | hides in corners, opportunistic |
| 3 | Viper | the Hunter | purple `#9b5cff` | stalks the current leader |
| 4 | Scaredy | the Coward | pale yellow `#ffe066` | flees everything, erratic darts |
| 5 | Gordo | the Greedy | orange `#ff9f2e` | pellet-obsessed, ignores danger |
| 6 | Jinx | the Trickster | magenta `#ff4fd8` | baits, feints, jukes |
| 7 | Boulder | the Guardian | steel blue `#5e7fa3` | patrols center, slow methodical |
| 8 | Zippy | the Sprinter | lime `#7dff5e` | darts between pellet clusters |
| 9 | Lurker | the Ambusher | indigo `#4a3fa3` | waits at clusters, lunges |
| 10 | Wobbles | the Jester | cyan `#4fe3ff` | chaotic, unpredictable, funny |
| 11 | Munch | the Nomad | coral `#ff7a5e` | opportunistic wanderer |

Each has a name label, color identity, kill-feed lines and ambient quips so
stories emerge ("you won't believe what Scaredy did").

## Crown System

- Round winner keeps a **crown** (shown on their blob + leaderboard) next round.
- **3 crowns = permanent "Arena Legend" badge** (localStorage).
- Crowns are the only progression in M1. No XP, no levels, no jargon.

## Build Log

- 2026-10-18 — M1 slice built: vanilla JS + canvas, single self-contained
  `dist/index.html` (< 1 MB, zero external requests). See SLICE.md for scope,
  QA.md for verification results.
