# DUSKLINE — Vertical Slice (M1)

**What is playable right now:** a complete 10-minute survivors-like roguelite run,
neon-desert edition. Portrait, touch-first, fully offline single file.

## Heroes (3 — hero-select cards)
- **SEHER** (unlocked) — orbiting light-blades, balanced fighter
- **RAAT** (unlock: survive to 4:00) — pulse nova mage, novas stun
- **TOOFAN** (unlock: 500 kills in one run) — chain-lightning gunner, fastest

## Auras & fusion (12 + 6 evolutions)
12 auras in 6 color families (Gold, Violet, Cyan, Ember, Jade, Rose), 2 per color:
Dawn Blades, Sun Lance, Night Pulse, Void Orb, Storm Chain, Frost Veil,
Ember Wisps, Starfall, Gale Gust, Thorn Bloom, Moonbeam, Mirage Shards.
**Fusion:** owning both auras of one color fuses them into an Evolved form
(Solar Crown, Event Horizon, Tempest Throne, World Pyre, Monsoon Heart, Lunar Requiem).
6 aura slots. 8 passive gifts (Wind Boots, Dune Heart, Lodestone, Hourglass,
Lucky Coin, Heavy Core, Iron Skin, Star Map), 6 slots, 5 ranks each.
Rank-up draft: pick 1 of 3 cards (new aura / power-up / gift / fusion highlighted).

## The run
- 10:00 survival, escalating wave director, victory at dawn
- **Dune events every 60s** (cycling): SANDSTORM (dust fog, reduced visibility),
  OASIS (green healing zone), NIGHT RAID (elite pack, rich shards)
- **Bosses:** DUNE TYRANT at 4:00 (telegraphed charges, radial fire, summons hounds),
  NIGHTMAW at 8:00 (spiral bullet storm, sweeping beam, summons razorbacks)
- 11 enemy types, distinct silhouettes + AI: Dust Hound, Gnat, Razorback (dasher),
  Matryosh (splitter), Spitflower, Aegis Crab (shielded), Sand Mole (burrower),
  Dune Titan (brute), Willo (orbital sniper), Springjaw (leaper) + crowned Elites

## Between runs
- **Relic vault (12 relics):** keep up to 3 across runs; post-run keep/swap draft
- **12 trophies (achievements)** → unlock RAAT, TOOFAN, and 6 hero skins
- Best time / kills / rank + totals in localStorage (`duskline_v1`)

## Feel & tech
- Hit flash, knockback, damage numbers, particles, screen shake, hit-pause,
  eased movement, squash-and-stretch, hurt vignette pulse, pickup magnet with sparkle trails
- 100% code-drawn HD art (canvas-gradient glows, parallax dune ridges, moon, twinkling stars)
- 100% synthesized WebAudio: dark-synth loop (4 intensity layers) + full SFX set
- Controls: dynamic virtual joystick + auto-aim (touch); WASD + mouse-aim bonus (desktop)
- Pause menu, game-over stats, victory screen, event banners, boss HP bars
- Object pooling throughout; entity caps: 120 enemies, 192 player shots, 96 enemy shots

## Not in this slice (future milestones)
M2: more heroes/auras/relics, daily dune seed, depths, endless mode.
M3: hero intros, boss cinematics, more music, weather. M4: highlights, leaderboards.
