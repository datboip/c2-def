# C² DEFENSE — handoff & roadmap

State as of 2026-06-10. The entire game is `index.html` (one file, no build step, three.js r128 from cdnjs). `README.md` has the game rules and the full `window.GameAPI` automation docs — **read it first**.

## How to work on this

```sh
python3 -m http.server 8765 --directory .   # serve
# open http://localhost:8765/index.html
```

- **Verify loop used so far:** extract the inline `<script>` → `node --check` for syntax; drive the game headlessly via Playwright `page.evaluate` against `window.GameAPI` (state snapshots, build/dig/place/callWave, `GameAPI.fp.*` for walk mode); any runtime error prints in the red `#errbar` at the bottom with line numbers and is captured in `GameAPI.errors()`.
- **House style (owner cares, repeatedly):** no emoji anywhere in UI — inline SVG icons only (the `IC` object); real HUD strips, not floating text boxes; game-feel polish on everything (press states, glows, banners).

## Design laws (do not break)

1. **Matter is conserved** — dig = +1 carried dirt, place = −1. Nothing from nowhere. The AI director obeys too.
2. **Guns, not walls** — towers never block or reroute pathfinding. Only terrain (walls/trenches/scenery) bends the route. Towers standing on the route get trampled (towers have HP).
3. **The route can never be fully sealed** — every terrain edit is validated; pocketed creeps slowly climb out.
4. **Mining is a gamble** — 3g per roll, 60% + 5%/mining-level success (cap 95%), XP per attempt, failures crumble. AI rolls on the same table.
5. **One in, one out** — one portal per awake biome (tinted to match), one crystal.
6. **Biomes = progression** — wake order forest→desert→tundra→volcanic→caverns; first at wave 4, then per difficulty cadence. Each biome brings its portal, its hazard, and unlocks its native tower (+25% dmg on home face). Difficulty caps faces = caps arsenal.

## Done

- Cube world, 6 biome faces, edge-wrapping pathfinding (heap Dijkstra ×3 movement classes), creep classes (walkers/jumpers/crawlers), conserved terraforming, speed-colored path dots (green/yellow/red).
- First-person + third-person (C key) walk mode with solid collisions, hold-to-mine, edge-crossing gravity (three nasty bugs fixed here — see git history).
- Abilities: golem (120g+3 iron), freeze (1 shard), airstrike (100g) with cooldown UI.
- Tier-3 branch specializations, 2 per tower type (burn/stun/execute/fork/volley/slow-splash all implemented).
- Demo attract mode, splash with difficulty + biome strip, pause menu w/ stats, settings, autopilot director (banks for big towers, mazes terrain, pays mining costs).
- Day/night (night = +15% creep speed, red eyes), per-biome hazards, sun/moon synced to light.
- `window.GameAPI` — full agent control surface (also `GameAPI.fp.*` for walking). Balance was tuned with it.

## Open (priority order)

1. **Multiplayer** — biggest item. Owner's design: **each player owns a face/biome** — every join wakes one more face; each player defends their own portal lane toward the shared crystal; host-authoritative sim over a dumb WebSocket relay (a ~70-line `server.js` relay + gunner-mode client exist in an earlier claude.ai artifact of the flat-map version — port the pattern, not the code). FP gunner mode for guests is the proven fun loop.
2. **CLI driver** — tiny Node+Playwright wrapper around `GameAPI` so an agent can play from a terminal (`node play.js state`, `node play.js build 0,5,3 cannon`). All the hooks exist already.
3. **Audio & ambience** — footsteps in walk mode, core/portal hum, per-tower fire sounds (partial: synth `beep()` exists), volume slider.
4. **Endgame** — wave-20 phase boss, endless mode, persistent prestige meta-upgrades, stats graphs. Balance beyond wave ~10 is untested; the autopilot survives to ~wave 7+ on frontier but humans play better.
5. **Nice-to-haves logged along the way:** block-place wireframe ghost in walk mode, TP camera wall-clipping, walk-mode footstep bobbing, golem upgrade tiers.

## Playtest wishlist (from 4 scripted GameAPI runs, 2026-06-10)

Findings from actually playing frontier (manual ×2), settler (idle), planetfall (manual):

1. ~~**Auto-chop on build**~~ ✅ DONE — building (or placing dirt) on scenery auto-chops it (+1 dirt); ghost ring shows on deco cells now.
2. ~~**Telegraph the next biome**~~ ✅ DONE — HUD chip shows "<biome> Nw" countdown; one wave out, a tinted ghost portal + dotted preview route appear (route computed by briefly waking the face). Meadow also recolored bright spring green so it stops reading like the forest face.
3. **Trample visibility**: towers on the route die silently. HP bars over damaged towers, red badge when a tower stands on the live route.
4. **Soften new-portal entry**: first 2 waves from a fresh portal at ~50% spawn share.
5. **QoL batch**: clear event LOGS on reset (bug — bleeds across runs), 8× speed for idle, wave-preview chips tinted by source portal, per-tower targeting priority, hover shows pit depth.
6. **Trench ergonomics**: 2-deep moats are the premium defense but cost many gamble-clicks with no depth feedback; consider a dig-queue or at least depth indicators.

Verdicts: settler idle pacing is healthy (wave 8, no prestige, autopilot bought tesla and mazed to 32 cells). Planetfall is appropriately brutal. Frontier's danger is entirely concentrated at biome unlocks — items 2 and 4 are the fix.

## Gotchas

- Tile heights: one logical level = `HSTEP` (0.98 world units, full Minecraft-style blocks). Tile boxes are 4.4 deep so 3-deep pits show solid walls.
- `FACES[]` basis vectors define each face's tangent frame; walk-mode yaw is re-expressed when crossing edges (degenerate head-on case handled — don't simplify it away).
- Pointer lock fails in sandboxed/embedded contexts; the drag-look fallback (~380ms timeout) is load-bearing. Never make FP depend on lock.
- `renderBar`/`renderAbil`/HUD all cache their HTML strings — if you add UI state, make sure it's part of the string or it won't repaint.
- Shadows render every 2nd frame (`shadowMap.autoUpdate=false`) — if lighting looks stale after a scene change, that's why.
