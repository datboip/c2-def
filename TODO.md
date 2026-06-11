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
3. ~~**Trample visibility**~~ ✅ DONE — HP bars over damaged towers, spinning red diamond over towers standing on the live route, one-time "is being TRAMPLED" toast, hp shown in the tower panel.
4. ~~**Soften new-portal entry**~~ ✅ DONE — fresh portals send ~50% of their share to the meadow portal for their first 2 waves.
5. ~~**QoL batch**~~ ✅ DONE — LOGS clear on reset, ×8 speed (key 4 / new segment), "from ●●●" portal swatches in the wave preview, per-tower targeting priority (first/strong/close — snipers default strong), dig success floats its new depth.
6. **Trench ergonomics**: 2-deep moats are the premium defense but cost many gamble-clicks with no depth feedback; consider a dig-queue or at least depth indicators.

### The AI player's wishlist — ✅ ALL DONE (2026-06-10)

1. ~~Dry-run simulator~~ — `GameAPI.simulate(edits)` predicts route lengths/gain for hypothetical walls/digs/chops, flags sealing, commits nothing.
2. ~~Seeded determinism~~ — `start(diff, free, seed)`: mulberry32 PRNG drives all gameplay rolls (waves, loot, AI dice, decoration layout). Same seed = same scenario (frame-timing still adds small combat variance).
3. ~~Batch plan~~ — `GameAPI.plan([[method, ...args], ...])` executes many actions in one round-trip.
4. ~~Leak forensics~~ — every leak logs creep type + source portal; `state().recentLeaks`.
5. ~~Timing lever~~ — `surge` ability: 80g, all towers +50% fire rate for 10s, 45s cooldown.

### UI/flow wishlist round 2 (2026-06-11 review)

1. **Wave-end summary card**: brief overlay after each wave — kills by tower, leaks by portal, gold earned. The data all exists (per-tower stats, leak forensics).
2. **Build-bar hover panel**: tooltips work but a styled hover card (stats + branch preview) would beat the native title popup.
3. **HUD scale setting** + remember hide-UI/history prefs in localStorage.
4. **Damage ticker**: small rolling DPS readout per tower in its panel (have dmgDealt; sample over 10s).
5. **Creep inspector**: click a creep → type, hp, speed, source portal, distance to crystal.

### Walk-mode (1st/3rd person) wishlist — from playing both views

1. **Aimed-tile highlight** *(top FP/TP item)*: a Minecraft-style wireframe on the block you're about to dig/place. Right now you act blind; the overview has a ghost ring, walk mode has nothing.
2. **Build from walk mode**: a 4th hotbar slot that cycles tower types so walk mode is a complete way to play, not just a terraforming trip.
3. **Cube compass**: a small corner gizmo showing which face you're on and where the crystal/portals are — on side faces you lose orientation fast.
4. **TP camera collision**: the trailing camera clips through walls/towers behind the avatar; pull it in when blocked.
5. **Feel pass**: subtle head-bob + footstep ticks when moving, slightly slower gravity roll when crossing an edge (current snap is functional but not planetary), faint landing puff when dropping into a pit.
6. **Mining feedback**: hold-to-mine resolves instantly per roll; a quick crack-flash on the block per roll would sell the gamble.

Verdicts: settler idle pacing is healthy (wave 8, no prestige, autopilot bought tesla and mazed to 32 cells). Planetfall is appropriately brutal. Frontier's danger is entirely concentrated at biome unlocks — items 2 and 4 are the fix.

## Gotchas

- **The dangling-else incident (fixed 2026-06-10, do not regress):** `if(tt.splash)for(...)if(near)damage(...); else damage(...)` — the else bound to the inner if, so **non-splash towers (cannon/frost/laser/sniper) dealt zero projectile damage for the project's entire history**. Only tesla chains, mortar splash, the crystal zap, and abilities ever killed anything; all pre-fix balance was unknowingly tuned around it. The fix is one set of braces in the shot-hit block (commented at the site). If kills/damage ever read zero on a working tower, check `GameAPI.testDmg()` and the shot-hit block first.

- Tile heights: one logical level = `HSTEP` (0.98 world units, full Minecraft-style blocks). Tile boxes are 4.4 deep so 3-deep pits show solid walls.
- `FACES[]` basis vectors define each face's tangent frame; walk-mode yaw is re-expressed when crossing edges (degenerate head-on case handled — don't simplify it away).
- Pointer lock fails in sandboxed/embedded contexts; the drag-look fallback (~380ms timeout) is load-bearing. Never make FP depend on lock.
- `renderBar`/`renderAbil`/HUD all cache their HTML strings — if you add UI state, make sure it's part of the string or it won't repaint.
- Shadows render every 2nd frame (`shadowMap.autoUpdate=false`) — if lighting looks stale after a scene change, that's why.
