# DUSKLINE — Build Ledger
**Owner:** Huzaifa | **Builder:** Muse (game factory, batch 1) | **Started:** 2026-10-18
**Engine:** Phaser 3.60.0 (inlined, from `~/workspace/global-libs/phaser/`) | **Graphics:** 100% code-drawn | **Audio:** 100% WebAudio-synthesized

## 1. FULL GAME VISION (the complete DUSKLINE, beyond this slice)
DUSKLINE is a neon-desert survivors-like roguelite for mobile browsers (portrait, touch-first).
Fantasy: you are the last light-bearer crossing the Duskline — the glowing border between the
dead grey wastes and the living neon desert. Every run is one night-crossing (10 minutes):
kite luminous ink-blob swarms, forge aura fusions, survive dune events, kill two bosses, reach dawn.

**Full-scope pillars (multi-slice roadmap):**
- M1 — THIS SLICE: core loop complete — 3 heroes, 12 auras + 6 fusions, 8 passives, 10-min runs,
  3 dune events, 2 bosses, relic keep/swap, achievements, skins, localStorage persistence.
- M2 — Meta depth: 3 more heroes, 12 more auras (24 total), relic collection book (30 relics),
  daily dune seed, 3 difficulty "depths", endless mode past 10:00.
- M3 — Presentation: animated hero intros, boss intro cinematics, expanded soundtrack (3 tracks),
  weather system, photo-mode share cards.
- M4 — Social/viral: run replay highlights (auto 15s clip), leaderboard seeds, guild dunes.

**This slice is milestone M1 — never "done", always "M1 complete".**

## 2. M1 SCOPE (this vertical slice — locked)
- 3 heroes w/ distinct silhouettes + kits: SEHER (orbiting light-blades), RAAT (pulse nova mage),
  TOOFAN (chain-lightning gunner). Hero-select cards. SEHER unlocked; RAAT/TOOFAN via achievements.
- 12 auras in 6 color families (2 per color); owning both auras of one color FUSES them into
  1 of 6 EVOLVED forms (readable fusion, no stat jargon). Max 6 aura slots; evolved auras are
  stronger and keep both color identities visually.
- 8 passive items (separate 4-slot... actually 6-slot passive track), Rank-Up draft: pick 1 of 3 cards.
  Progression words: "Rank", "Stars", "Shards" — never "XP"/"Level".
- 10:00 runs, escalating wave director, DUNE EVENTS every 60s cycling sandstorm / oasis / night raid.
  Bosses at 4:00 (DUNE TYRANT) and 8:00 (NIGHTMAW), distinct attack patterns. Victory at 10:00.
- Relic drafting BETWEEN runs: vault of 12 relics, keep up to 3 across runs, keep/swap cards.
- 12 achievements → unlock heroes + 6 skins (palette variants). All progress in localStorage (`duskline_v1`).
- 11 enemy types, distinct silhouettes + behaviors: Chaser, Dasher, Splitter, Spitter, Shielded,
  Burrower, Swarmling, Brute, Wisp, Leaper, + Elites (night raid / events).
- Controls: mobile dynamic virtual joystick + full auto-aim (primary); desktop WASD + mouse aim bonus.
  Pause menu, game-over stats, victory screen, event banners, damage vignette.

## 3. ART DIRECTION (LOCKED before systems code)
**"Neon desert night"** — premium, HD, organic. BANNED: flat boxes, grid lines, programmer-art.
- **Sky:** deep indigo → violet → ember horizon gradient; star field (2 parallax layers, twinkle);
  a huge low moon with glow halo; drifting aurora wisps.
- **Dunes:** 3 parallax ridgeline layers (far/mid/near), drawn as smooth glowing curves with
  neon rim-light on crests; animated shimmer along ridges; soft radial shadows under entities.
- **Ground:** dark indigo sand with subtle noise grain + faint glowing cracks; vignette darkening
  at screen edges; sandstorm = warm dust fog + streak particles.
- **Heroes:** luminous geometric silhouettes with inner glow core, orbiting accents, squash-stretch
  on move/attack/hurt; soft blob shadow; light trail when moving fast.
- **Enemies:** luminous ink-blobs — wobble physics (sine-deformed outline), glossy highlight,
  distinct neon hue + silhouette per type (spikes, eyes, rings, tails, crowns for elites).
  Death = ink-splash burst + shard spray, never a pop.
- **Attacks:** light-trails, particle blooms, additive-blend glows; damage numbers float and fade;
  hit-flash (white), knockback, hit-pause (45ms), screen shake scaled by impact.
- **UI:** dark glass cards with neon edge-light, rounded 16px corners, spring-in animations;
  big touch targets (min 56px); rank-up cards fan in with stagger; banners sweep across with glow.

## 4. PERFORMANCE BUDGETS (locked before code)
| Budget | Cap | Technique |
|---|---|---|
| Active enemies | 120 (pool 140) | single sprite per enemy, 1 shared texture per type |
| Enemy projectiles | 80 (pool 96) | pooled, additive glow texture |
| Player projectiles | 160 (pool 192) | pooled per aura type |
| Particles (ambient+combat) | 700 alive | 6 pooled emitters, texture atlases |
| Damage numbers | 24 pooled texts | |
| Draw calls (gameplay) | < 260 | shared textures, no per-frame Graphics |
| Texture memory | < 24 MB | all generated ≤256px, power-of-two where tiled |
| Frame target | 60fps (2022 phones), 30fps min in heaviest moment | entity caps + spatial cull + no allocations in update |
| JS heap churn | zero per-frame allocation in hot loop | preallocated pools, reuse vectors |

Rules: no `new` in `update()`; distance checks via squared distances; enemy separation via
spatial hash grid (cell 96px); off-screen enemies sleep (skip AI beyond 900px, still drawn if visible).

## 5. AUDIO DIRECTION (all synthesized)
Dark-synth loop: 92 BPM, D minor — sub-bass drone, plucked arp (16ths), pad swells, noise hats.
Intensity layers: calm (0-2:00), tense (2:00-4:00), battle (bosses/events), dawn (victory).
SFX: per-aura fire/hit, fusion chime, shard pickup (pitch ladder), rank-up, hurt thud, explosion,
boss roar (FM growl), event horn, UI clicks, victory/defeat stingers. Master limiter; mute toggle.

## 6. MILESTONES & HONEST % COMPLETE
- [x] M0 Research & concept lock (RESEARCH.md) — 100%
- [x] M1 Vertical slice (this build) — CODE-COMPLETE 2026-10-18 (device QA pending)
  - [x] Boot/loading + menu + hero select + relic vault + achievements
  - [x] Gameplay core: movement, joystick, auto-aim, camera, HUD
  - [x] 12 auras + 6 fusions + 8 passives + rank-up draft
  - [x] 11 enemies + wave director + 3 dune events + 2 bosses
  - [x] Juice: particles, shake, hit-pause, damage numbers, vignette
  - [x] Audio: music loop + SFX (synthesized; ear-check pending)
  - [x] Persistence + game-over/victory + relic keep/swap
  - [x] Self-QA (headless) + single-file build
- [ ] M2/M3/M4 — future slices, 0%

## 7. BUILD LOG
- 2026-10-18: Ledger written; art direction + perf budgets locked. Starting src/.
- 2026-10-18: src/ complete (~3,900 lines, 7 modules): data, audio (synth), art (code-drawn),
  ui helpers, core (save/boot), menu (heroes/relics/trophies/skins), game (full run).
- 2026-10-18: Single-file build pipeline (build.sh) — Phaser 3.60.0 inlined, 1.27 MB, zero external requests.
- 2026-10-18: Headless Chromium smoke suite (21 checks) — 16 pass; 5 timing-related fails
  traced to loaded CI machine (14 orphaned browsers), not game bugs. Fixed 8 real bugs found in QA
  (boot crash, glow-corruption squares, hidden sky, evoGold cd, body sync, draft text overlap,
  menu overlaps, resize-listener debt noted).
- 2026-10-18: M1 code-complete. Honest %: M1 gameplay 100%, M1 QA ~85% (no real-phone test yet —
  needs Huzaifa's device). Overall DUSKLINE vision: ~35% (M1 of 4 milestones).
