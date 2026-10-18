# GAME FACTORY — Market Research & Concept Slate
**Date:** 2026-10-18 | **Researcher:** Muse (subagent) | **Owner:** Huzaifa
**Mission:** Ranked slate of 12 vertical-slice game concepts for the all-night build shift.

---

## 0. STANDING CONSTRAINTS (from Huzaifa — apply to every slice)

1. **HOST EVERYTHING ONLINE.** Every vertical slice must end as a publicly hosted, playable link — a web artifact with a public URL in the same pattern as Ink Warrior's `muse.ai/s/...` links. No slice is "done" until its public link is verified working on a real phone browser. Each concept below carries a **Mobile Hosting Note** explaining how it stays lightweight enough to host and play well on mobile browsers.
2. **LIBRARIES ALLOWED, DOWNLOADED ONCE.** Builders may use as many libraries/frameworks as needed for top quality — BUT each library is downloaded **exactly once** into `~/workspace/global-libs/<lib-name>/` (single global copy) and reused across all projects. **Never re-download per project.** Phaser 3.60.0 already lives at `~/workspace/global-libs/phaser/phaser-3.60.0.min.js` — use it, don't fetch it again.
3. **QUALITY-FIRST PACING.** Prefer fewer fully-QA'd excellent slices over many sloppy ones. Every slice ships only after passing the QA checklist (Section 5). Keep building until the weekly limit exhausts.
4. **Language:** all work in English; game UI fully in English (Huzaifa's standing rule).
5. **Progression:** no levels/XP-jargon-heavy systems. Keep progression simple and readable (stars, collections, color tiers, unlock ladders).
6. **One project = one chat.** Each vertical slice gets its own separate chat and its own folder: `~/workspace/game-factory/<slug>/`.
7. **AAA-feel, never "bachkana".** 100% code-drawn graphics must look HD: layered gradients, soft shadows, glow particles, squash-and-stretch, parallax, rounded organic shapes. Flat boxes and programmer-art grids are banned.
8. **No gambling, no pure clones, no backend multiplayer in the slice.** Local bot simulation is allowed for arena/.io-style concepts.

---

## 1. MARKET SNAPSHOT (what the research found, Oct 2026)

- **Puzzle owns casual:** Puzzle = 44%+ of casual revenue (H1 2026). Match-3 alone did ~$2.5B in six months. New entries can still break in (Royal Kingdom, Match Villains) with fresh mechanics + polish.
- **Hybrid-casual is the money formula:** take a proven hyper-casual core, strip the intrusive ads, add a coin economy + boosters + lives. (Grand Games' Maze Out model.)
- **Arrow/maze mechanics are hot:** CubeAway hit **#4 in top downloads** (Sept 2026) with a 3D arrow-cube twist; the whole "arrow sweep" genre is cloning fast.
- **Block Blast / satisfying games dominate downloads** via simplicity + offline play + emerging markets.
- **Pakistan specifics:** Ludo King at **2 BILLION downloads**; top free games in Pakistan are Ludo titles + PUBG Mobile + Free Fire + COD Mobile. Cricket is a cultural juggernaut. Desi-themed games are radically undersupplied.
- **Physics = viral:** Happy Wheels (2010 browser game) pulled **750,000 Steam wishlists in 2 weeks** on nostalgia alone. Janky-chaotic physics is streamer bait.
- **Roguelite brawlers are surging:** Stick It to the Stickman (Free Lives/Devolver) at 95.7% positive — physics brawler + roguelite is proven demand.
- **Survivors-likes** (Vampire Survivors → Halls of Torment → mobile clones) remain the highest-ROI-per-dev-hour genre in indie.
- **Collector/ASMR crazes:** Fidget Trading / blind-box unboxing games charting among newest casual releases; collection addiction drives retention.
- **.io games** still print engagement; bots make a slice feasible without servers.

**Bottom line for the slate:** cricket + survivors-like + a cultural IP nobody owns (Pakistani truck art) are the three highest-ceiling bets. Physics toys and .io-bots are the viral lottery tickets. Satisfying stackers/puzzlers are the safe floor.

---

## 2. RANKED CONCEPT SLATE (Rank 1 = build first)

Each concept: Title | Genre | 1-line hook | 30-second core loop | 3 key mechanics | visual direction | viral/earn case | references to beat | vertical-slice scope | mobile hosting note.

---

### RANK 1 — GULLY CHAMPION 🏏
- **Genre:** Hyper-casual sports / timing flick (mobile-first, portrait)
- **Hook:** Tape-ball gully cricket — one thumb, one over, be the mohalla legend.
- **30-sec core loop:** Bowler runs in → tap-and-hold to set power, release to time the flick → ball rockets (or you miss and the gali laughs) → score runs, chase a target in 6 balls.
- **3 key mechanics:**
  1. **Flick-timing batting** — release-point timing decides loft/direction; perfect releases trigger slow-mo "GULLY SIX" moments.
  2. **Bowler mind-games** — inswinger/outswinger/yorker telegraphs; reading the seam = skill ceiling.
  3. **Mohalla Cup ladder** — street-tournament bracket vs named local rivals (bot personalities: "Chacha Yorker", "Speedy Shahid"); win to unlock new gallis (rooftop, beach, mountain road).
- **Visual direction:** Golden-hour street cricket: warm gradient sky, string-light bokeh, dust particles on every hit, ball with motion-blur trail, screen-shake + confetti-burst on sixes. Crowd = layered silhouettes with wave animation. Code-drawn, zero assets. Player/bowler = stylized rounded figures with squash-stretch bowling/jump animation — never boxy.
- **Viral/earn:** Cricket = religion in Pakistan, India, Bangladesh, UK, Australia. "Beat my 6-ball score" share cards. Earn: tournament passes, bat skins (truck-art bats!), ad-friendly short sessions. Huge TikTok/WhatsApp-status clip potential.
- **References to beat:** Stick Cricket (too stiff), Cricket League by Miniclip (good but generic), Real Cricket (too sim-heavy). **Our edge:** gully soul — tape ball, street banter, 60-second matches.
- **Vertical slice:** One over (6 balls) vs one AI bowler, one gali (rooftop at sunset), score chase + share card.
- **Mobile hosting note:** Tiny by design — one background, two characters, one ball; all procedural. Estimated artifact < 1 MB, 60fps on low-end Android, portrait, touch-only, offline-capable.

### RANK 2 — DUSKLINE
- **Genre:** Midcore survivors-like roguelite (auto-attack arena survival)
- **Hook:** Survive 5 neon-drenched minutes in the desert dark — your build is your weapon.
- **30-sec core loop:** Kite the swarm → auto-attacks fire → grab XP shards → pick 1 of 3 upgrades → watch your build melt bigger waves.
- **3 key mechanics:**
  1. **Aura-synergy builds** — weapons are auras/projectiles/orbits; stacking same-color auras fuses them into evolved forms (readable, no stat-sheet jargon).
  2. **Dune events** — every 60s a twist: sandstorm (visibility), oasis (heal zone), night raid (elite pack).
  3. **Relic drafting between runs** — keep 3 relics across runs; simple "keep / swap" choice, shown as cards.
- **Visual direction:** "Neon desert night": deep indigo sky, glowing dune ridgelines (parallax), enemies as luminous ink-blobs with wobble physics, attacks as light-trails and particle blooms, screen-edge vignette pulse when hurt. Thousands of enemies via particle-style batching — must feel lush, not dotty.
- **Viral/earn:** Survivors genre has the best dev-hour-to-revenue ratio in indie; 5-min runs = perfect ad/session pacing; build-variety = streamer "one more run" content. Earn: relic slots, hero skins, season dunes.
- **References to beat:** Vampire Survivors (PC-first), Halls of Torment, Brotato. **Our edge:** browser-native, 5-minute mobile sessions, prettier than all of them.
- **Vertical slice:** One 5-minute run, one hero, 8 auras, 3 dune events, one boss at 4:00.
- **Mobile hosting note:** Performance is the product — cap entity counts with object pooling, procedural sprites only, no audio files (WebAudio synth SFX). Target 60fps on 2022-era phones; artifact ~1.5 MB.

### RANK 3 — TRUCK ART RALLY 🚚
- **Genre:** Desi-cultural arcade racer + creative decorator
- **Hook:** Paint your truck in legendary Pakistani truck art, then rally it across the country.
- **30-sec core loop:** Pick/paint panels (peacocks, roses, poetry, chrome) → hit the highway → dodge/weave traffic, near-miss for style points → earn paint-budget → bling it harder.
- **3 key mechanics:**
  1. **Generative truck-art studio** — procedural motifs (floral medallions, peacock, "Horn OK Please" poetry banners, tassels) composited live on your truck; every truck is unique and screenshot-worthy.
  2. **Style-point racing** — near-misses, drifts, and airtime feed a Style meter; higher style = faster + richer.
  3. **Grand Trunk Road tour** — Lahore → Islamabad → Karachi route legs, each with distinct palette/traffic/weather.
- **Visual direction:** The star is the truck: chrome gradients, mirror highlights, jewel-tone florals with glow edges, animated tassels and mudflaps, light-flare on chrome at speed. Road = warm asphalt with animated lane-glow, parallax truck-stop dhaba signs. Must look like a moving truck-art mural, not a cartoon.
- **Viral/earn:** Zero direct competition; truck art is globally fascinating and deeply Pakistani. "Show your truck" sharing is built-in virality. Earn: premium motif packs, poetry banners, chrome finishes. Tourism-board / brand collab potential.
- **References to beat:** Hill Climb Racing (physics), Subway Surfers (runner polish), generic "Pakistani truck games" (all low quality). **Our edge:** the art IS the game — nothing else looks like this.
- **Vertical slice:** Art studio (3 motifs × paint) + one 90-second Lahore highway run with style scoring.
- **Mobile hosting note:** Truck is one composite canvas texture regenerated on paint changes; road is a scrolling shader-like gradient. Artifact ~1.5–2 MB, landscape, touch steer.

### RANK 4 — BAZAAR SIEGE
- **Genre:** Midcore lane tower defense (portrait)
- **Hook:** The night bazaar glows — hold the lanes till dawn with rickshaw turrets and kite-string traps.
- **30-sec core loop:** Wave incoming → drag turret onto a stall-rooftop → turret auto-fires with juicy arcs → merge two same turrets for an evolved form → survive the wave, bank coins.
- **3 key mechanics:**
  1. **Merge-evolve towers** — 6 base turrets (Rickshaw Rocket, Kite-Cutter, Chai-Splash, Lantern Mortar, Dhol-Drum shockwave, Peacock Prism); merging = visible transformation, not numbers.
  2. **Festival events** — mid-wave twists: blackout (lanterns matter), monsoon (splash towers buffed), wedding procession (a golden dhol-tower marches across as a free ally).
  3. **Stall-keep economy** — between waves, spend coins on stall upgrades that buff adjacent towers (simple adjacency, shown visually).
- **Visual direction:** Truck-art bazaar at night: jewel-tone stalls with striped awnings, hanging lantern glow, fairy-light strings, enemies as shadow-puppet "smog imps" with glowing eyes. Projectiles = light trails; explosions = marigold petal bursts. Rich, warm, dense — HD through lighting, not polycount.
- **Viral/earn:** TD is evergreen (Bloons/Random Dice prove spend); merge mechanic = satisfying clips; desi skin = differentiated in a crowded genre. Earn: tower skins, endless-mode tickets, festival passes.
- **References to beat:** Plants vs Zombies (too slow now), Bloons TD 6 (great but heavy), Random Dice (RNG-heavy). **Our edge:** merge-evolution + living bazaar events, all readable at a glance.
- **Vertical slice:** 8 waves, 4 turrets, 1 festival event (monsoon), 1 boss wave, endless toggle.
- **Mobile hosting note:** Fixed grid, pooled projectiles, all sprites procedural; waves are data, not assets. ~1.5 MB, portrait, offline.

### RANK 5 — BLOB ARENA
- **Genre:** Experimental viral — .io-style arena vs bots (local simulation)
- **Hook:** Eat, dodge, outgrow — 3-minute blob battle royale against 11 hungry bots.
- **30-sec core loop:** Spawn small → eat pellets, dodge bigger blobs → absorb a smaller bot for a growth spike → leaderboard shuffle → final-30s shrink-storm forces showdowns.
- **3 key mechanics:**
  1. **Momentum mass** — bigger = slower but can dash-split once per life (risk/reward escape or kill move).
  2. **Bot personalities** — 11 bots with visible temperaments (bully, camper, hunter, coward) so the arena feels alive, not random.
  3. **Crown rounds** — winner keeps a crown next round; 3 crowns = "Arena Legend" badge shown forever (simple prestige, no XP jargon).
- **Visual direction:** Jelly-gloss blobs with wobble physics, internal nucleus glow, absorption = ripple-merge animation, arena = deep-sea gradient with drifting plankton particles. Eating feels delicious: scale-pop + chime + ripple.
- **Viral/earn:** .io games are engagement machines; 3-min rounds = perfect share/stream loop; bot personalities create "you won't believe what Coward did" stories. Earn: blob skins/trails, crown cosmetics. Backend multiplayer can come later — bots now.
- **References to beat:** agar.io (dated), slither.io, diep.io. **Our edge:** prettier, funnier bots, faster rounds.
- **Vertical slice:** One 3-minute arena, 11 bots, pellets, leaderboard, crown carry-over in localStorage.
- **Mobile hosting note:** All circles + shaders; trivial asset weight (< 1 MB). 60fps easy; touch-drag control; offline.

### RANK 6 — SKYLINE STACK
- **Genre:** Hyper-casual one-tap precision stacker + city meta
- **Hook:** One tap builds a floor — how tall before the tower sways?
- **30-sec core loop:** Crane swings a floor → tap to drop → perfect drops grow the floor back, misses shear it off → tower sways with physics → tenants move in, lights flick on.
- **3 key mechanics:**
  1. **Forgiving perfection** — near-misses magnet-snap with a "SAVED!" slow-mo; feels amazing, clips great.
  2. **Living tower** — every 5 floors a tenant event: lights on, tiny window stories, rooftop garden/pool/antenna milestones.
  3. **Wind nights** — periodic wind gusts visibly bend the tower; sway physics is the real difficulty curve.
- **Visual direction:** Dusk-city gradient, tower windows glowing warm as tenants arrive, crane with cable-sway physics, floor edges with neon trim, perfect-drop = light-bloom + chime. Background parallax skyline with lit windows. Satisfying = juicy.
- **Viral/earn:** Stack is proven (Ketchapp's Stack = 100M+); near-miss saves are made for short video. Earn: tower themes (Neon Karachi, Desert Oasis), crane skins, revive tokens.
- **References to beat:** Stack (Ketchapp), Tower Blocks, Block Blast (satisfying DNA). **Our edge:** the tower comes alive — it's a city, not a score.
- **Vertical slice:** Endless stacking, wind nights from floor 15, tenant milestones, best-height share card.
- **Mobile hosting note:** One mechanic, procedural everything; < 1 MB; portrait; one-thumb; offline.

### RANK 7 — WOBBLE WORLD
- **Genre:** Experimental viral — physics toy sandbox
- **Hook:** A world of pure wobble. Fling it, stretch it, stack it, break it (lovingly).
- **30-sec core loop:** Grab a wobble-creature → stretch and fling it → it splats, wobbles, reforms → chain reactions knock domino-towers of jelly → discover hidden interactions.
- **3 key mechanics:**
  1. **Soft-body everything** — spring-physics blobs, jelly platforms, trampoline mushrooms; touch = deformation.
  2. **Toy-box levels** — 6 tiny dioramas (jelly kitchen, bounce canyon, magnet cave…), each with 3 hidden "giggle moments".
  3. **Creature mixer** — feed creatures color-goo to change their bounce/stickiness; share your weirdest creation.
- **Visual direction:** Glossy translucent jelly with refraction-ish highlights, squash-stretch on every interaction, pastel dioramas with soft shadows, particle "boing" rings. Must feel tactile and expensive — the anti-boxy test case.
- **Viral/earn:** Pure streamer/creator bait (Goat Sim energy); "look what I found" discovery clips. Earn: new dioramas, creature skins, goo colors. Merch-able characters.
- **References to beat:** Happy Wheels (chaos), Goat Simulator (mayhem), Human Fall Flat (wobble). **Our edge:** wholesome chaos — no gore, all giggle, kid-safe viral.
- **Vertical slice:** 2 dioramas, 3 creatures, creature mixer, 6 hidden giggle moments.
- **Mobile hosting note:** Custom 2D spring physics (no lib needed); pooled particles; ~1.5 MB; touch-drag; offline.

### RANK 8 — RUCKUS RAMPAGE
- **Genre:** Midcore physics brawler vs bots (arena roguelite-lite)
- **Hook:** Fling, slam, and yeet rival ruckus-bots out of the arena — last blob bouncing wins.
- **30-sec core loop:** Grab a weapon (dhol-stick, flying chappal, spring-boxing glove) → wobbly-fight 5 bots → knock them off the platform → between rounds draft 1 of 3 ruckus-upgrades.
- **3 key mechanics:**
  1. **Everything is a weapon** — environmental pickups + slapstick weapons with ragdoll knockback; hits feel huge.
  2. **Ruckus draft** — after each round pick 1 upgrade (double-jump, sticky hands, shockwave clap); builds get silly fast.
  3. **Arena hazards** — rotating platforms, bumper dhols, collapsing floors; bots die funny too.
- **Visual direction:** Chunky rounded brawlers with springy limbs, impact star-bursts + slow-mo on big KOs, confetti on round wins, arena = neon akhara (wrestling pit) with rope physics. Slapstick must read instantly.
- **Viral/earn:** Stick It to the Stickman proved the appetite (95.7% positive); KO compilations are algorithmic gold. Earn: brawler costumes, weapon packs, arena themes.
- **References to beat:** Stick It to the Stickman (PC/Steam), Gang Beasts, Stick Fight: The Game. **Our edge:** browser + mobile, desi slapstick flavor, 2-minute rounds.
- **Vertical slice:** One arena, 5 bots, 6 weapons, 3-round draft ladder.
- **Mobile hosting note:** Few entities, big juice; pooled effects; ~1.5 MB; touch joystick + one attack button; offline.

### RANK 9 — UNBOX RUSH
- **Genre:** Hyper-casual timing unboxer + collection
- **Hook:** Time the tap, crack the box, chase the 1% golden — 200+ desi toys to collect.
- **30-sec core loop:** Box rattles → tap when the needle hits the gold zone → box bursts open in slow-mo → reveal (common → legendary) → collection book fills, duplicates become sparkle-dust.
- **3 key mechanics:**
  1. **Skill-based unboxing** — timing zones shrink as rarity rises; near-miss = "so close" drama, not punishment.
  2. **Themed dabbas** — Mithaas Box, Truck-Art Box, Cricket Box, Space Box… each with its own toy set and reveal ceremony.
  3. **Collection book + trades** — showcase shelves; duplicate dust crafts targeted boxes (no gacha-currency jargon — "dust → box").
- **Visual direction:** ASMR-grade: boxes with ribbon physics, paper-tear particles, slow-mo reveal with light-rays, toys rendered as glossy collectibles on velvet shelves. Sound design (synth) does half the work — crinkles, pops, chimes.
- **Viral/earn:** Blind-box culture (Pop Mart) + Fidget Trading charting prove the itch; reveal reactions are content. Earn: premium dabbas, shelf themes. (No gambling: odds shown, no real-money loop in slice.)
- **References to beat:** Fidget Trading: Dumpling Box, box-simulator genre, Royal Match (collection meta). **Our edge:** skill > luck framing + desi toy sets nobody else has.
- **Vertical slice:** 3 dabba types, 30 toys, timing mechanic, collection book.
- **Mobile hosting note:** UI-heavy, tiny runtime; textures procedural; < 1 MB; portrait; offline.

### RANK 10 — NEON MAZE DRIFT
- **Genre:** Hyper-casual maze/arrow puzzler (rides the 2026 arrow-mechanic wave)
- **Hook:** Twist the maze, ride the light — guide every orb home in one flowing move.
- **30-sec core loop:** Orbs queued at gates → drag/rotate maze tiles → release → orbs flow along paths, splitting at junctions → all orbs home = cascade clear.
- **3 key mechanics:**
  1. **Tile-twist routing** — rotate tiles to bend paths live while orbs are moving (real-time, not turn-based).
  2. **Color-mixing junctions** — two orbs merging make a new color that unlocks matching gates (simple, visual logic).
  3. **Flow-streak scoring** — uninterrupted flow multiplies; breaks reset — built for "one more try".
- **Visual direction:** Dark glass maze, orbs as glowing liquid light with trails, tile rotations with magnetic snap + ripple, clears = color-cascade bloom. Tron-elegant, never flat.
- **Viral/earn:** Arrow/maze wave is peaking (CubeAway #4 downloads); satisfying flow = watchable. Earn: maze themes, orb trails, hint tokens.
- **References to beat:** CubeAway (3D arrows), Maze Out / Color Maze, Flow Free. **Our edge:** live tile-twisting while orbs move + color-mixing.
- **Vertical slice:** 15 hand-tuned levels, 2 orb colors, mixing junctions.
- **Mobile hosting note:** Grid logic, minimal draw calls; < 1 MB; portrait; offline.

### RANK 11 — PAINT DASH
- **Genre:** Hyper-casual paint-runner
- **Hook:** You are the paint — cover the road, outrun the grey.
- **30-sec core loop:** Auto-run forward → swipe to steer → paint splashes cover track → dodge grey "eraser" blobs that strip your paint → coverage % = score.
- **3 key mechanics:**
  1. **Coverage scoring** — score = % of road painted, shown as a live color-bar; encourages full-width risky lines.
  2. **Paint combos** — rainbow streaks, splash zones, and paint-can pickups (magnet, wide-brush, shield).
  3. **Rival painter** — a bot paints a parallel lane; finish with more coverage to win the "wall".
- **Visual direction:** Grey paper world blooming into color (Ink Warrior-adjacent joy), paint with wet-gloss highlights and drip physics, eraser blobs as smoky voids. Finish line = full mural reveal. Lush and juicy.
- **Viral/earn:** Painting = satisfying genre (Paper.io DNA); mural reveals are shareable. Earn: brush styles, mural galleries, paint-can skins.
- **References to beat:** Paper.io 2 (territory), Color Road, Splatoon (vibe only). **Our edge:** coverage-as-score + mural reveal payoff.
- **Vertical slice:** 3 tracks, rival bot, 3 pickups, mural gallery.
- **Mobile hosting note:** Paint via canvas texture stamping (cheap); ~1 MB; portrait; offline.

### RANK 12 — RIFT RUNNER
- **Genre:** Midcore draft roguelite top-down shooter
- **Hook:** Dive the rift, draft your disaster — 3 relics per dive, infinite builds.
- **30-sec core loop:** Enter rift room → twin-stick-lite combat (auto-aim option) → clear → draft 1 of 3 relics → rooms get weirder, build gets wilder.
- **3 key mechanics:**
  1. **Relic drafting** — 40 relics, wild interactions (lightning + bounce + multishot = storm); shown as cards, zero jargon.
  2. **Rift modifiers** — each dive rolls 2 world quirks (low gravity, mirror rooms, time-slow zones).
  3. **Depth score** — how deep did you dive? One number, endless chase, daily rift seed.
- **Visual direction:** Cosmic rift: deep violet void, rooms as floating neon ruins, relics as glowing artifacts, bullets as light-trails, kills = shard-bursts. Premium sci-fantasy look, all procedural.
- **Viral/earn:** Roguelite runs = streamer content; build variety = discussion. Earn: hero frames, rift themes. (Most crowded genre on this list — hence rank 12.)
- **References to beat:** Archero, 20 Minutes Till Dawn, Enter the Gungeon. **Our edge:** browser-playable, 10-minute dives, wilder relic combos.
- **Vertical slice:** 8 rooms, 15 relics, 1 boss, depth scoring + daily seed.
- **Mobile hosting note:** Room-based (bounded entities); pooled bullets; ~1.5 MB; touch twin-stick; offline.

---

## 3. BUILD ORDER & PACING GUIDANCE

**Wave 1 (prove the factory):** Rank 1 → 2 → 3. Cricket first (fastest slice, biggest home market), then Duskline (retention depth), then Truck Art Rally (differentiation showcase).
**Wave 2 (viral lottery):** Rank 5 (Blob Arena) → 7 (Wobble World) → 8 (Ruckus Rampage).
**Wave 3 (safe floor):** Rank 6 → 9 → 10 → 11 → 4 → 12, in whatever order energy allows.

Quality-first pacing rule: **a slice is not done until** (a) it passes the QA checklist, (b) it has a verified public link, (c) Huzaifa can play it start-to-finish on his phone. Three excellent slices beat twelve rough ones.

---

## 4. SHARED TECH STANDARDS (all slices)

- **Engine:** Phaser 3.60.0 from `~/workspace/global-libs/phaser/phaser-3.60.0.min.js` — script-tag it, never re-download.
- **New libraries:** download ONCE to `~/workspace/global-libs/<name>/`, document in `~/workspace/global-libs/README.md`, reuse everywhere.
- **Artifacts:** single self-contained web artifact per slice (inline code-drawn graphics; external requests = zero, same as Ink Warrior v1's offline standard). Target **< 2 MB** per artifact; test on real mobile Chrome.
- **Controls:** touch-first; desktop keys as bonus. Portrait for hyper-casual, landscape for racers/brawlers.
- **Audio:** WebAudio-synthesized SFX where possible; keep any audio tiny or generated.
- **Folders:** `~/workspace/game-factory/<slug>/` with `SLICE.md` (scope), `QA.md` (checklist results), `LINK.md` (public URL).
- **No levels/XP jargon** in UI; English everywhere.

## 5. QA CHECKLIST (per slice, before public link)

1. Loads to playable in < 5s on mid-range Android Chrome, zero console errors.
2. Full loop completable start-to-finish on touch; no dead-ends, no soft-locks.
3. Text 100% English; no placeholder/tofu glyphs.
4. 60fps target (30fps minimum) during heaviest moment; no memory leak over 10 min.
5. Share/clip moment exists and is reachable within 60 seconds of play.
6. Public link opened cold (fresh browser, no cache) and played by a second tester pass.

## 6. SOURCES

- Analyst Bulletin: Mobile game market review, Sept 2026 — clean-2026.com
- Mobile Gaming 2025–2026: Top Downloads & Trends — techretry.com
- Fun Games for Android 2026 (Play-data ranked) — techlila.com
- Top 20 trending Casual Games (Oct 2026) — appbrain.com
- Cost of Developing Hyper-Casual Games 2026 — brsoftech.com
- Puzzle & merge lead casual growth H1 2026 — mobidictum.com
- Maliyo Games: Ludo mania Lagos→Lahore; Pakistan top charts — gamesindustryafrica.com
- Online Gaming in Pakistan 2026 — whatsgroupslinkz.com
- Happy Wheels 750k Steam wishlists — dexerto.com
- Stick It to the Stickman 95.7% positive — boilingsteam.com / engadget.com
- 5 Physics Browser Games 2026 — dev.to
