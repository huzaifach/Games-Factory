# RUCKUS RAMPAGE — VERTICAL SLICE (Batch 2, 2026-10-18)

**What it is:** a physics party-brawler. You are a wobbly blob in a neon wrestling
pit with 5 rival bots. Grab slapstick weapons, whack everyone, and knock them out
of the arena. Last blob bouncing wins the round.

**The one-line rule (the whole game in one sentence):**
> Hits make you WOBBLY — wobbly blobs fly farther!

## Playable scope

- **Full match flow:** Title → How-to-Play (3 illustrated steps) → Practice round
  (60s vs DUMMY with pulsing hints: MOVE → GRAB → WHACK) → 3-round ladder →
  Ruckus Draft between rounds → sudden-death shrinking arena in round 3 →
  Win/Lose/Draw results with stats, stars, and unlocks → rematch.
- **6 fighters:** YOU (teal) + 5 named bots with distinct styles and kill-feed
  personalities — RUSHR (charges), CHILLO (camps the middle), ZIGGY (dashes and
  throws), THUMPA (slow, hits like a truck), SQUEAK (runs away, throws from far).
- **5 slapstick weapons** (everyone can grab and use them):
  DHOL-STICK (a drum-stick — big swing, big launch), FLYING CHAPPAL (a flying
  sandal — throw it, slight homing), SPRING GLOVE (punch from across the ring),
  PILLOW (soft, builds wobble fast, feather burst), MAGNET HAND (yank a rival
  close, then SLAM). Auto-pickup by walking over; durability pips on held weapons.
- **Ruckus Draft:** after rounds 1 and 2, pick 1 of 3 upgrades (9 total:
  Double Jump, Sticky Hands, Shockwave Clap, Heavy Belly, Spring Legs,
  Butter Feet, Big Head, Feather Fall, Rubber Body). Builds get silly fast.
  Bots draft too.
- **Arena hazards:** rotating conveyor platform, 3 bumper dhols (BOING!),
  4 collapsing edge tiles, springy rope nets at both ends (calm blobs bounce,
  wobbly blobs burst through). Round 3 = sudden-death shrink.
- **Progression (localStorage):** match stars (1–3), total wins, 5 costumes
  (Plain → Red Bandana → Golden Turban → Pirate Hat → Champion Crown),
  3 arena themes (Neon Akhara → Rooftop Rumble → Beach Brawl).
- **Game feel:** ragdoll tumbles, impact star-bursts, slow-mo MEGA KOs, screen
  shake, hit-pause, squash-and-stretch, confetti, jumping crowd, comic word pops
  (POW! THWACK! BYEEE!), kill feed with personality lines.
- **Audio:** fully synthesized WebAudio — dhol-beat match music (per-theme),
  thwacks, boings, chappal slaps, crowd oohs/aahs/cheers, UI stingers. Mute toggle.
- **Controls:** touch = dynamic left joystick + HIT/JUMP buttons (landscape-first,
  polite rotate hint in portrait); desktop = A/D or arrows + W jump + J/Space hit.
- **Understandability:** objective banner always visible
  ("KNOCK OUT 5 BOTS — LAST BLOB BOUNCING WINS!"), wobble % under every fighter,
  lives pips above every fighter, practice hints, how-to before first play.

## Tech

- Engine: Phaser 3.60.0 (single global copy, inlined at build time — never
  re-downloaded) + custom knockback/wobble physics + hand-rolled WebAudio synth.
- 100% code-drawn, zero image assets, zero external requests.
- Single file: `dist/ruckus-rampage.html` (~1.22 MB).
- Source: `src/` (11 modules), tests: `test/test-logic.js` (39 node tests).
- Docs: BUILD-LEDGER.md (vision + milestones), ART-DIRECTION.md, PERF.md,
  QA.md (checklist results), LINK.md (public URL).

## Out of scope for this slice

Online multiplayer, more arenas/weapons/bots, career/season mode, same-device
2-player, challenge scenarios, share-card export. (All in the full vision —
see BUILD-LEDGER.md.)
