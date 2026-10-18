# TRUCK ART RALLY — BUILD LEDGER
**Batch 1 · Game factory · started 2026-10-18 ~02:45 PKT**
**Genre:** Desi-cultural arcade racer + generative decorator · landscape · mobile-first

## FULL GAME VISION (this is the target the slices build toward)
Paint a legendary Pakistani truck-art masterpiece in a generative studio, then rally it
up the Grand Trunk Road — Lahore → Salt Range → Karachi. Style-point racing: near-misses,
drifts and airtime feed a Style meter that makes the truck faster and earns paint-budget,
which is spent on new motifs, chrome and poetry banners back in the studio.
Medals per leg, best-time records, police-chase events, traffic AI, day→dusk→night weather
tour. 100% code-drawn, zero image assets, synthesized WebAudio, 60fps on a phone.

## MILESTONES (honest % = share of FULL vision)
| # | Milestone | Scope | % of vision |
|---|-----------|-------|-------------|
| M1 | **Vertical slice (THIS BUILD)** | Studio (motifs, paint, 3 save slots) + 3 legs (~90s each, day/dusk/night-rain) + style racing + paint-budget economy + medals/best times + full game feel + audio | **~55%** |
| M2 | Extra legs (Islamabad, Multan desert, Thar night) + truck variants (bus, rickshaw) | 6 legs, 3 vehicle bodies | 70% |
| M3 | Share cards ("show your truck" screenshot export) + 10 more motif families | social loop | 80% |
| M4 | Boss leg (Smuggler convoy chase) + hard-mode traffic | endgame | 90% |
| M5 | Full meta: collection book, seasonal motifs, polish pass | 100% |

## THIS SLICE — M1 EXPANDED SCOPE (what ships tonight)
1. **Generative Truck-Art Studio** — live composite canvas texture: floral medallions,
   peacock panels, roses, "HORN OK PLEASE" poetry banners, chrome gradients, tassels,
   mudflaps. Pickers for paint color / motif family / banner text; Randomize; 3 save slots
   in localStorage. Truck shown in a studio garage with light sweep.
2. **Grand Trunk Road Tour — 3 legs, ~90s each**
   - LEG 1 LAHORE HIGHWAY — day, dense traffic, warm palette
   - LEG 2 SALT RANGE — dusk, curvy mountain road, fewer but faster vehicles
   - LEG 3 KARACHI COASTAL — night rain, neon reflections, wet road
3. **Style-point racing** — near-miss, drift, airtime feed Style meter; high style =
   speed boost + paint-budget income; police-chase event above style threshold.
4. **Traffic AI** — rickshaws, buses, bikes, donkey carts; lane behavior, brake lights,
   overtaking; leg-specific mixes.
5. **Paint-budget economy** — earn from style points; spend in studio on motifs
   (families unlock by price), chrome finishes, poetry banners. Medals per leg
   (bronze/silver/gold by style score), best-time records in localStorage.
6. **Game feel** — eased steering with weight, near-miss slow-mo + zoom punch, drift
   smoke + tire trails, screen shake, squash-and-stretch over bumps, dhaba signs,
   birds, dust, full WebAudio: engine hum, air horn, dhol stingers, rain ambience.
7. **Controls** — touch drag steering + drift button (landscape primary); desktop
   arrows + Space. Full-screen, no black bars, loading with live % and honest retry.

## PERFORMANCE BUDGETS (locked before code)
- Draw calls: truck 1 sprite (composite texture) · road 1 · each traffic vehicle 1
  (pooled, ≤14 alive) · particles pooled ≤120 · parallax ≤8 · UI ≤20 → **≤60 total**
- Entities: ≤14 traffic + 1 police + ≤120 particles + 1 player
- Texture: truck composite 512×256 (regen only on paint change) · road tiles cached
- Physics: none — custom arcade kinematics, fixed timestep 60Hz, dt clamped
- Audio: 1 AudioContext, ≤8 concurrent voices, synthesized only
- Target: 60fps on mid Android · artifact ≤2MB (Phaser 1.15MB + code ≤0.5MB)

## STATUS
- [x] M1 scope locked (2026-10-18 02:45)
- [x] Code complete (2026-10-18 ~03:30, ~2,450 lines, single game.js + index.html)
- [x] Self-QA passed (2026-10-18 ~04:00 — real headless-Chromium playthrough:
      zero console errors; menu/studio/legs/race/results all navigated and
      screenshotted; buy flow, police chase, medals, best-records, restart verified;
      60fps menu on unloaded renderer, game logic 0.82ms/update; road renderer
      optimized 3x; Phaser-3.60 container hit-area quirk found & fixed)
- [x] Global-audience pass (2026-10-18 ~03:35 — banners/signs/currency/plate globalized,
      leg one-line explanations, How-to-Play panel added, per standing rule)
- [x] Artifact build complete + audit-verified (2026-10-18 ~03:37 — zero console errors,
      zero external requests, ~1.3MB, files MD5-identical to source)
- [x] Published + public link verified (2026-10-18 ~08:41 PKT — Huzaifa approved the share;
      public URL https://muse.ai/s/truck-art-rally-xnxh6zjxtxo4z2xp; artifact was byte-verified +
      audit green before sharing; curl cold-check 403 is Cloudflare bot-shielding, same as the
      known-live Blob Arena link; his real-phone open is the final verification)
- [x] SLICE.md / QA.md / LINK.md written
- [x] Link posted in this chat + sent to factory side chat (delivery rule)
