# RUCKUS RAMPAGE — ART DIRECTION (LOCKED 2026-10-18 ~03:05 PKT)

Locked BEFORE systems code, per build discipline. Everything is 100% code-drawn
(Phaser Graphics / generated textures); zero image assets; zero external requests.

## Core visual promise
**Chunky wobble-blobs brawling in a glowing wrestling pit.** Slapstick must read
instantly at phone size: big round bodies, springy limbs, huge impact bursts.
Flat boxes and programmer-art are BANNED.

## Fighters — "Ruckus Blobs"
- Body: big rounded blob (squash-and-stretch on move/hit/land; never a box).
- Face: two white eyes + pupils that look toward movement, open "O" mouth on big hits,
  X-eyes while ragdoll-tumbling. Brows for personality (RUSHR angry, SQUEAK worried).
- Limbs: springy noodle arms/legs (2-segment, spring-damped) that flail when tumbling,
  pump when running, wind up before a swing. Feet sync to movement speed — no sliding.
- Wobble ring: colored ring under each fighter grows/shifts color (green→yellow→red)
  with wobble % — the whole mechanic is readable at a glance.
- Player marker: small golden crown-triangle above YOU + name tag ("YOU") so the
  player never loses themselves in the ruckus.
- Ragdoll tumble: on big hits the blob spins (angular velocity), limbs flail outward,
  motion-blur arc trail behind. Funny, never gory.
- Costumes (player): headgear only, drawn on the blob — Red Bandana, Golden Turban,
  Pirate Hat, Crown. Instantly readable silhouette changes.

## Arena — "Neon Akhara"
- Raised circular/rounded-square wrestling platform floating over a void, neon edge
  trim (magenta/cyan glow), dark arena floor with subtle radial texture.
- **Rope physics:** 3 elastic ropes around the platform edge, simulated as spring
  chains (16 segments per side) that wobble when fighters bounce off them and snap
  taut during sudden-death shrink. Ropes are visual + soft bounce colliders.
- Corner posts: glowing pylons with pulsing caps.
- **Crowd:** 2–3 rows of dark silhouettes around the arena (pre-rendered, cheap),
  bobbing/waving arms, they JUMP on big KOs; confetti cannons on round wins.
- **Hazards, readable at a glance:**
  - Rotating platform: center disc with glowing chevron arrows showing spin direction.
  - Bumper dhols: big striped drums with springy rims; squash on bounce, "BOING!".
  - Collapsing tiles: edge tiles flash red → shake → drop into the void → respawn.
- **Themes (palette swaps + prop swaps, same layout):**
  - NEON AKHARA (default): deep indigo bg, magenta/cyan neon, rope pit.
  - ROOFTOP RUMBLE (3 wins): sunset orange/purple sky, clotheslines, water tanks,
    fairy lights, pigeon silhouettes.
  - BEACH BRAWL (6 wins): teal sky, sand platform, waves at edges, umbrellas,
    crab silhouettes.

## Impact language (the viral fuel)
- Hit: star-burst (8-point jagged star, white→yellow), expanding ring, "POW!"/"THWACK!"
  comic word pops in chunky rounded font.
- Big KO (high wobble): **slow-mo 0.25x for 0.7s**, zoom-punch (camera kick), giant
  star-burst, "MEGA KO!" banner, confetti + crowd eruption.
- Screen shake scaled to hit size; hit-pause 60–90ms on weapon connects.
- KO'd fighter: launched with spin + trail, shrinks into the void with a "BYEEE!" pop
  (comic, friendly). Respawn: poof cloud + drop-in with invincibility blink.

## UI
- Chunky rounded panels, thick outlines, bouncy scale-in transitions (Back.easeOut),
  never popping. Title logo: fat rounded letters with neon glow + wobble idle animation.
- Objective banner top-center always visible during play ("KNOCK OUT 5 BOTS — 3 LEFT!").
- Kill feed top-left, comic style, auto-fades. Comic word pops use system rounded fonts
  (no webfonts — zero external requests).

## Palette (Neon Akhara)
- BG deep indigo #14102e → #1e1650; neon magenta #ff2e88; neon cyan #29f3ff;
- gold #ffd23f (accents/stars); fighter colors: YOU teal #2dd4bf, RUSHR #ff4d4d,
  CHILLO #ff9f1c, ZIGGY #b388ff, THUMPA #9c8b7a, SQUEAK #b8e62e, DUMMY #8a8f9d.
