# TRUCK ART RALLY — ART DIRECTION (LOCKED 2026-10-18, before systems code)

## The star: the truck = a moving truck-art mural
Rendered as ONE 512×256 composite canvas texture, regenerated ONLY on paint changes.
Never flat boxes, never programmer-art. Every motif is layered vector drawing:

- **Chrome:** vertical multi-stop gradients (dark steel → near-white mirror band →
  steel), animated diagonal light-flare sweep on the bumper/grill at speed
  (flare intensity tied to velocity).
- **Floral medallions:** jewel-tone petals (ruby, emerald, sapphire, amber) with
  lighter inner glow edges + dark outline; 8–12 petals, stamen dots.
- **Peacock panels:** fan of 9 tail feathers, each feather = teardrop with eye
  (concentric ellipses: gold → teal → indigo), body with curved neck silhouette.
- **Roses:** spiral petal arcs in red/pink with green leaf pairs.
- **Poetry banners:** "HORN OK PLEASE", "DIL DA TRUCK", "MAA DA LADLA",
  "USE DIPPER AT NIGHT" on ribbon banners with scalloped edges and drop shadow.
- **Tassels:** hanging from bumper — 5 tassels, sine-wave sway animation
  (drawn per-frame as graphics, not baked).
- **Mudflaps:** black with painted rose, flex skew on bumps.
- **Cab details:** windshield with sky reflection gradient, mirror ornaments,
  "786" / eye motifs warding off nazar on the grill.

## Palette per leg
- LAHORE HIGHWAY (day): warm asphalt #6b5a4a, sky #7ec8f7→#e8f6ff, dhaba signs
  in red/green/yellow, marigold roadside.
- SALT RANGE (dusk): asphalt #5a4a52, sky #ff9a56→#7a3b6e, long shadows, rock walls.
- KARACHI COASTAL (night rain): asphalt #2a2f3a with neon reflections
  (cyan/magenta streaks), rain streaks, headlight cones, dark sea on one side.

## Rendering approach
- Pseudo-3D road: classic outrun-style projection done manually with a road
  ribbon drawn as a Graphics strip (segments with rumble, lane glow).
  Simpler robust approach: top-down-oblique? NO — brief says racer with drift.
  Decision: **behind-truck pseudo-3D** (player truck at bottom-center, road
  vanishing to horizon, traffic sprites scale by depth). Handled with custom
  projection math (no physics engine).
- Traffic: code-drawn canvas textures per vehicle type (rickshaw/bus/bike/
  donkey cart/police), each ONE texture, tinted per instance via slight palette
  variants baked at spawn (3 variants each, pooled).
- Parallax: 2 layers (far hills/city silhouette, near dhaba signs/palms/poles)
  drawn as repeating Graphics/canvas strips; birds as animated sprites.
- Particles: pooled — drift smoke, tire trails (fade ribbons), dust, rain
  (Karachi), splash, confetti on medals.

## UI
- English only. Chunky rounded panels, truck-art border motif (mini floral strip)
  on panel headers. Style meter = chrome-rimmed gauge with flame fill.
- Studio: garage backdrop, turntable-style light sweep, big truck preview,
  picker rows, 3 save slots, paint-budget coin counter.

## BANNED
Flat untextured boxes · programmer-art placeholders · popping state changes
(everything tweens) · external image/font requests · levels/XP jargon.
