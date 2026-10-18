# BLOB ARENA — Slice Scope (M1)

> What is playable in this vertical slice. Full vision: BUILD-LEDGER.md.

## The Round (fully playable start to finish)

- **3-minute battle royale**, portrait, one-thumb play. Countdown 3-2-1-GO,
  live timer, final whistle, results screen, instant rematch.
- **You vs 11 named bots**, each with a visible personality, color identity and
  name label: Brutus the Bully (hunts small), Shelly the Camper (hides in
  corners), Viper the Hunter (stalks the leader), Scaredy the Coward (flees
  everything), Gordo the Greedy (pellet-obsessed), Jinx the Trickster
  (baits and jukes), Boulder the Guardian (patrols center), Zippy the
  Sprinter (darts between clusters), Lurker the Ambusher (waits, then lunges),
  Wobbles the Jester (chaotic), Munch the Nomad (opportunist).
- **Momentum mass**: bigger = slower but stronger, with weighty eased movement.
- **Dash-split**: one per life — spectacular stretch animation, escape tool or
  kill lunge. Touch button + Space on desktop.
- **Final 30 seconds**: the shrink-storm closes in (swirling violet wall,
  tension riser in the music, danger vignette), forcing showdowns.
- **Eating feels delicious**: scale-pop spring, rising chime pitch with combo,
  ripple-merge absorption animation, screen shake on big absorbs, hit-pause
  beat on eliminations.

## Systems in this slice

- Live leaderboard (top 5 + your rank), live kill feed with personality
  flavor lines and ambient quips ("you won't believe what Scaredy did").
- Pellet combos (x3+ meter, fanfare every 8), 5 growth milestones with
  fanfare banners (GROWING! → LEVIATHAN!).
- Crown system: round winner keeps a crown next round (shown on blob +
  leaderboard); 3 crowns = permanent **Arena Legend** badge (localStorage).
- Career stats on the title screen (wins, biggest blob).
- Fully synthesized WebAudio: deep-sea pad music, pops, gulps, dash whoosh,
  elimination thud, countdown beeps, storm riser + heartbeat, victory jingle.
  Mutable, persisted.
- Loading screen with live progress % and honest TRY AGAIN on failure; Start
  waits until fully ready. Living arena animates behind the title.
- Controls: touch floating joystick (primary), mouse cursor-follow (desktop),
  dash button / Space. Full-screen portrait, DPR-aware, no black bars.

## Hand-designed, not procedural

Pellet layout uses 9 hand-placed clusters (rich center, corner stashes,
side pockets); procedural generation is used only for textures/particles.

## Deferred to later milestones (NOT in this slice)

M2: second arena (Coral Reef), 5 more bots, grudge AI. M3: crown unlock
ladder (cosmetic trails/skins), career stats page, seasons. M4: Pellet Rush +
Storm Survival modes. M5: pass-and-play tournaments, shareable result cards.
