# BAZAAR SIEGE — ART DIRECTION (LOCKED 2026-10-18)

All graphics are 100% code-drawn (Phaser Graphics → generated textures). Zero image assets.
The HD look comes from light, not polycount: layered gradients, lantern glow, bokeh, soft shadows.

## Visual pillars
1. **Truck-art night bazaar** — jewel tones on deep indigo night; everything glows warm.
2. **Rounded organic shapes only** — capsules, circles, blobs, arches. Flat boxes and programmer-art grids are BANNED.
3. **Light does the heavy lifting** — lantern halos (additive), fairy-light twinkle, projectile light trails, marigold petal bursts.
4. **Shadow-puppet enemies** — smog imps are dark smoky silhouettes with glowing eyes; they read instantly against the warm bazaar.
5. **Everything is alive** — swaying lanterns, twinkling fairy lights, drifting petals, steaming chai, fluttering awning edges. Nothing static.
6. **No popping** — every state change animates (tweens with Back/Quad easing, never instant show/hide).

## Palette
- **Night sky:** `#0b1030 → #1b2452 → #3a2350` (deep indigo to ember horizon), stars + big low moon with halo.
- **Jewel tones:** emerald `#0fae7e`, ruby `#e33e5f`, amber `#ffb347`, turquoise `#35d0c5`, magenta `#c83e8f`, gold `#ffca7a`.
- **Lantern glow:** warm `#ffca7a` halos, additive blend.
- **Smog imps:** body `#1a1626` with purple rim-light `#6b4fa1`; glowing eyes per type (runner = lime, brute = red, shielded = cyan, healer = green, splitter = orange, kite-flyer = violet, digger = amber, thief = white, drummer = pink, ember = fiery orange).
- **Marigold:** `#ff9a1f` / `#ffc93c` petals for explosions, merges, celebrations.

## Background (3 parallax layers, overscan 800×1400 for the 720×1280 canvas)
1. **Far:** night sky gradient, stars, moon with halo, distant mosque/minaret + city silhouettes in deep purple.
2. **Mid:** bazaar street — rows of stalls with striped awnings (alternating jewel/cream stripes, scalloped edges), hanging lanterns swaying on sine, catenary fairy-light strings with per-bulb twinkle.
3. **Near/foreground:** soft vignette + occasional drifting marigold petals; the 3 lanes are subtly lighter stone paths with rounded cobble texture (procedural noise dots), lane edges lined with tiny glowing diyas.

## Turrets (each a distinct silhouette; evolved form = same silhouette + gold trim, extra ornament, star badge)
1. **Rickshaw Rocket** — green-yellow auto-rickshaw body, three wheels, twin rocket tubes on top; evolved: double tubes + peacock-tail fletching, gold canopy.
2. **Kite-Cutter** — diamond paper-kite frame (turquoise/magenta) spinning twin blade-discs; evolved: larger double-kite, golden string reel.
3. **Chai-Splash** — brass chai kettle / steaming clay cup on a cart; evolved: double kettle, bigger steam plume, gold rim.
4. **Lantern Mortar** — red paper lantern on a wooden stand, tilts back when firing; evolved: twin lanterns, ornate stand, gold tassels.
5. **Dhol-Drum** — wooden dhol drum with rope lacing, sticks that strike on pulse; evolved: bigger drum, brass rings, gold lacing.
6. **Peacock Prism** — fanned peacock feathers (eye-spots) around a crystal prism; evolved: fuller fan, larger crystal, gold filigree.
- **Placement pop:** scale 0 → 1 with Back.easeOut + dust ring + small petal puff.
- **Merge transformation:** white-gold flash, swirl of marigold petals converging, scale punch (1 → 1.35 → 1), evolved texture swaps in at the flash peak, star badge pops on, shockwave ring.

## Enemies — shadow-puppet smog imps (all dark smoky bodies, glowing eyes, distinct silhouettes)
- **Runner:** lean imp, long legs, mid-stride pose; fast scuttle (leg-swap animation).
- **Brute:** huge round body, tiny legs, heavy waddle with squash on each step.
- **Shielded:** imp holding a round brass thali-shield in front; shield flashes white on block, cracks visibly as it breaks.
- **Healer:** slimmer imp carrying a glowing moth-lantern; periodic green sparkle burst on heal.
- **Splitter:** lumpy two-lobed body with a visible seam; on death splits with a pop into 2 imp-lings (small fast round imps).
- **Kite-flyer:** paper-kite body (diamond) with string tail, floats above the lane with a soft shadow on the ground; bobs on sine.
- **Digger:** mole-snouted imp; dives (sinks with dust puff, dust-trail while under), resurfaces with a pop.
- **Lantern-thief:** sneaky crouched imp with a bulging sack; jingles (coin sparkle) as it runs.
- **Drummer-imp:** small imp with a tiny dhol; beat rings pulse outward (the aura visual).
- **Ember-imp:** imp with a crackling ember core in its chest; on death erupts in a fire-petal explosion.
- **Boss — THE CONVOY:** big war-rig (truck silhouette) with a translucent hex shield dome; shield shatters with glass-like shards when broken; escorted by shielded imps.
- **Boss — THE SWARM-LORD:** large moth-like imp with tattered wings; burst = ring of small swarm imps spiraling out with petal-flash.
- **Deaths:** every imp death = squash + marigold petal burst + eye-glow fade; never a pop-out.

## Projectiles & effects
- Rockets: small rocket with flame + smoke trail (pooled), arc slightly; impact = splash ring + petals.
- Kite blades: spinning discs with motion streaks.
- Chai splash: lobbed blob that splats into a lingering slow puddle (rounded, steaming).
- Lantern bombs: glowing lanterns arcing high with light trail; big warm explosion.
- Dhol shockwave: expanding gold rings from the drum, drums sticks strike.
- Prism beam: shimmering prismatic beam (gradient white→jewel), impact sparkle.
- Damage numbers: pooled text, cream with dark outline, rise + fade, crits (boss shield break, ember chains) larger + gold.
- Hit flash: white overlay flash on the victim (tint pulse), knockback nudge along the lane.
- Screen shake: small on leaks, bigger on boss deaths (never during tutorial wave 1).
- Hit-pause: 70ms freeze on boss shield break, boss death, and legendary merges.

## Festival events
- **Blackout:** global dim tween (0.6s) to deep blue; lanterns/mortar/prism keep warm halos; lightning-fireflies drift.
- **Monsoon:** diagonal rain streaks (pooled), splash turrets get a blue shimmer ring, puddle ripples on lanes.
- **Wedding procession:** golden dhol-tower (ornate palanquin silhouette) marches along a top parade path with marigold garlands, sparkles, and shockwave drumbeats; confetti petals trail behind it.

## UI language
- Rounded panels (radius 22), deep plum `#1c1430` at ~90% alpha, gold `#ffca7a` accents, cream `#fff6e8` text.
- Title: big rounded golden letterforms with soft glow + tiny lantern icon.
- Buttons: min touch target 88px, press = scale 0.94 + glow pulse + click sound.
- Banners (wave / boss / festival): full-width ribbon slides in with Back ease, golden text with glow, auto-dismisses.
- Screen transitions: fade + slight scale, never hard cuts.
- Hint line: cream text on a dark pill, always visible under the HUD, with a pulsing gold dot.

## Animation language
- Easing: `Back.easeOut` for pops, `Quad.easeInOut` for moves, elastic overshoot for merges.
- Idle: every turret has a subtle idle (bob/sway/steam); imps bob as they march; nothing ever freezes.
- Anticipation → action: mortar tilts back before firing, dhol sticks raise before the pulse, prism crystal brightens before the beam.

## Global audience wording layer (UI text — art and systems unchanged)
Night-bazaar visuals stay exactly as locked above. Every flavorful name shown in UI carries a one-line universal gloss in plain English. Internal code ids may keep short names; DISPLAY names use this table.

**Turrets (card name + gloss, always shown together):**
- Rickshaw Rocket — lobs splash rockets
- Kite-Cutter — fast single-target blades
- Chai-Splash — slowing splash field
- Lantern Mortar — long-range arcing bombs
- Dhol-Drum — radial shockwave pulses
- Peacock Prism — piercing light beam

**Enemies (display name + one-line rule, shown in Scout panel / first-appearance hint):**
- Runner Imp — fast but weak; it sprints for your gate.
- Brute Imp — slow and very tough.
- Shield Imp — carries a shield; break the shield first.
- Healer Imp — heals nearby imps; stop it early.
- Splitter Imp — splits into two small imps when beaten.
- Kite Imp — flies above the lane; only blades, beams and mortars can hit it.
- Digger Imp — dives underground; watch the dust trail.
- Thief Imp — catch it for bonus coins; if it escapes, it steals coins.
- Drummer Imp — speeds up nearby imps; stop it first.
- Ember Imp — explodes when beaten; let it blow up its friends.

**Bosses (banner + one-line telegraph):**
- THE CONVOY — "Break its shield first!"
- THE SWARM-LORD — "It bursts apart — splash hurts the swarm!"

**Festival events (banner wording):**
- MONSOON — rain falls; splash turrets hit harder.
- BLACKOUT — darkness falls; lantern turrets fight at full power.
- WEDDING PROCESSION — a golden drum-tower marches across and fights beside you for a while.

**How-to-Play (3 illustrated steps, plain universal English):**
1. PLACE — Tap a turret card, then tap a glowing rooftop.
2. MERGE — Drag two matching turrets together to evolve one stronger turret.
3. HOLD TILL DAWN — Stop the imps reaching your gate. You have 20 lives.

**HUD hint line / victory / defeat:** plain universal English at all times; any flavored term is glossed in the same line. Victory: "DAWN BREAKS — the bazaar stands!" Defeat: "The bazaar falls silent… Try again?"
