# C² DEFENSE — cube squared

A single-file 3D tower defense where the world is a cube. Six faces, six biomes, gravity points at the molten core. Creeps pour from biome portals and march across faces and over edges to your crystal.

**Run it:** open `index.html`, or serve it:

```sh
python3 -m http.server 8765 --directory .
# → http://localhost:8765/index.html
```

## The rules

- **Two modes.** CLASSIC (default): ONE portal for the whole game — every biome that wakes is new land, new hazards, and its native tower, and your job is to maze them the longest possible way around the cube. SIEGE: every waking biome opens its own portal (tinted to its color) — multi-front defense; multiplayer is always siege (each joining player owns a biome + portal). Either way: all routes end at the single crystal, and you never seal a route — only make it longer, slower, deadlier.
- **Waking the cube.** Runs start on the meadow. Surviving waves wakes biomes in a fixed order — **forest → desert → tundra → volcanic → caverns** — each bringing a new portal, its hazard, and its native tower. Difficulty sets the pace and ceiling: settler (3 biomes, every 9 waves), frontier (5, every 6), planetfall (all 6, every 4).
- **Native towers.** cannon→meadow (starter) · tesla→forest · sniper→desert · frost→tundra · mortar→volcanic · laser→caverns. A tower built on its home biome deals **+25%**.
- **Hazards.** forest undergrowth slows creeps · desert quicksand makes dug pits lethal-slow · tundra ice speeds creeps but frost slows last 1.5× · volcanic embers and cavern static burn % HP per second.
- **Matter is conserved.** Dig = +1 dirt carried, place = −1. No deleting, no conjuring. The AI director plays by the same law (it digs spoil before it walls).
- **Water finds its level.** Dig beside any liquid and the new hole floods (water, lava, and quicksand all spread — `simulate()` predicts it). Fill flooded cells with dirt to reclaim them. Face-border blocks hold the cube's seams together and can never be dug — maze inside the border. The caverns pool with lava, not water.
- **Terrain is read by class.** Walkers climb 1 block slowly; jumpers hop walls; crawlers scale anything; tanks nearly stall on slopes. 2-deep cliffs stop walkers cold.
- **Guns, not walls.** Towers never block or reroute creeps — only terrain bends the route, so you *have* to dig and terraform. A tower standing on the route gets trampled by passing creeps (towers have HP); building in the highway is a greedy gamble. Creeps pocketed by terrain slowly climb out — traps can't be sealed.
- **Abilities** (right bar): golem (120g + 3 iron) hunts and slams — cast again while it lives to **reforge it in place**: iron tier (80g + 2 iron, +50% life/damage) then crystal tier (120g + 1 shard, +100%, glowing seams); freeze (1 shard) hard-slows everything, airstrike (100g) carpets the route. Tier-3 towers buy one of two branch specializations at 3× base cost.
- **Path dots show speed:** green = full pace, yellow = slowed, red = crawling. Kill zones belong on red.
- **Mining is a gamble with a skill curve.** Every dig costs 3g to roll: 60% base success, +5% per mining level (cap 95%), XP for every attempt. Failures crumble the block and keep your gold. Chopping trees/scenery is free (+1 dirt) — and must happen before the ground under them can be dug. Successful digs go inward toward bedrock (3 layers): layer 1 drops gold, 2 iron, 3 shards/gems. The AI rolls on the same table.
- **CRAFTING — the WORKSHOP.** Mining loot becomes tools: press **K** (or the hammer chip beside the resources). One-time crafts, kept for the run. Everyone starts with the **STONE PICK** (digs meadow/forest/desert). **IRON PICK** (3 iron) bites frozen tundra ground — without it the dig is denied. **CRYSTAL PICK** (2 shards + 50g) cracks volcanic basalt and cavern crystalbed. **BUCKET** (2 iron) scoops a liquid tile and pours it elsewhere — matter conserved, one load at a time, and pouring can never seal the route. **SHOVEL** (1 iron) +10% mining success on soft ground (cap stays 95%). **PROSPECTOR LENS** (1 shard) — the dig cursor reveals what the next layer holds (a pure peek: it never consumes RNG rolls). Hardness is mapped by biome *name*; the AI director crafts at the same workshop with the same costs. In multiplayer the toolbox belongs to the room — guests' craft requests run host-side.
- **Wave 20 is THE WARDEN.** A phase boss replaces the whole wave: phase 1 it's armored (50% damage) and **crushes any tower within one cell**; below 66% the armor cracks but it **STOMPS** every ~6s (towers in range stunned 2s); below 33% it enrages — ×1.6 speed, birthing brood. Killing it pays +500g and the boss score — and is **victory**. If it breaches the crystal it costs **6 lives**.
- **ENDLESS after victory.** The break bar becomes CONTINUE — ENDLESS (or quit via the menu). Past wave 20, creep hp compounds +8% per wave, and **every 10th wave another Warden** arrives, +60% hp per appearance. Score keeps accruing; `scorecard()` reports `endless` and `deepWave`.
- **LEGACY shards (meta-progression).** Every run banks `floor(score/1000)` shards at victory, overrun, or quit (localStorage `c2meta`). Spend them on the splash screen's LEGACY panel: five permanent upgrades (start gold / start dirt / mining luck / tower damage / free hero skills), 3 levels each at 2/4/8 shards. Bonuses are derived at `start()` — base CFG is never mutated — and are **disabled on seeded runs** (see arena protocol).

## Controls

| | |
|---|---|
| drag from build bar | place tower (ghost shows range) |
| click a tower | upgrade / sell panel |
| left-drag / wheel | orbit / zoom |
| **middle-drag** | pan to focus an area (middle-click toggles path dots) |
| V | walk the cube first-person (WASD, wheel = tool, gravity follows you over edges) |
| N / pill button | call wave early for bonus gold |
| space, 1/2/3 | pause, speed ×1/×2/×4 |
| R | auto-rotate cube |

## Multiplayer — each player owns a biome

Host-authoritative co-op over a dumb WebSocket relay (no game logic server-side):

```sh
npm install && node relay.js        # relay on :8090 (PORT=... to change)
# host (first to join — runs the real sim):
http://yourserver/index.html?ws=ws://yourserver:8090&room=garage&name=thomas
# friends (each join WAKES the next biome, which is theirs to defend):
http://yourserver/index.html?ws=ws://yourserver:8090&room=garage&name=dale
```

Rules: the host plays normally. Each guest's arrival wakes the next biome **and assigns it to them** — they build, dig, and wall on their own face (plus the shared meadow); actions are validated and executed host-side, the world streams back at ~8Hz. Guests can request early waves; host controls speed/pause. Host leaving ends the room. The HUD badge shows your role (`HOST · 3P` / `GUEST · desert`). For internet play put the relay behind TLS (wss://) on any $5 VPS.

## CLI play (terminal / AI agents)

```sh
npm install          # once
node play.js         # REPL — type `help` for commands, JSON out
node play.js -e "start 1; build 0,4,5 cannon; upgrade 0,4,5; wave; speed 8; wait 6; state"
node play.js --headed  # watch the browser while you drive
```

Cells are `face,u,v` (faces: 0 TOP · 1 BOTTOM · 2 EAST · 3 WEST · 4 SOUTH · 5 NORTH). Covers everything: build/upgrade/sell/branch/prio, dig/place, waves/speed/abilities, first-person (`walk`, `look`, `tool`, `act`), `state`/`logs`/`debug`/`shot file.png`.

## Benchmarking AI models

The game scores every run, so different models (or humans) can be compared on identical terms:

| event | score |
|---|---|
| creep kill / boss kill | +5 / +50 |
| wave cleared | +100 + 10×wave |
| perfect wave (zero leaks) | +50 bonus |
| biome awakened | +150 |
| mining level | +30 |
| leak | −25 |
| overrun (prestige) | −400 |

**The arena protocol** (for pitting models against each other):
1. `start 1 <seed>` — frontier, real economy, **fixed seed** so every model faces the identical scenario (same map, waves, loot dice, AI dice). Never `free`, autopilot **off** (`auto off`) — the model plays, not the director. Also fix the **mode**: `GameAPI.start(1,false,seed,'classic')` (one portal, default) or `'siege'` (portal per biome) — scorecard records it. **Passing an explicit seed force-disables LEGACY meta-upgrades** (start gold/dirt, mining luck, tower damage, hero skills) and `scorecard()` reports `meta:false` — arena runs depend on identical conditions, so a player's permanent upgrades never tilt the comparison.
2. Fixed speed (×8) and a fixed **`playSec` budget** (e.g. 60 or 300). Budget by `playSec` from `scorecard()`, not wall-clock — headless browsers throttle frames.
3. The model may read `GUIDE.md` (full bestiary/tower/terrain data — also machine-readable at `GameAPI.grid`) and gets `state` between actions.
4. When the budget expires, report `GameAPI.scorecard()` verbatim.

Via CLI: `node play.js -e "start 1; auto off; ...model's moves...; score"`. Sanity baseline: `node play.js -e "bench 60"` runs the built-in autopilot under the same budget.

| player | score | wave | perfect | leaks | notes |
|---|---|---|---|---|---|
| built-in autopilot | **4600** | 17 | 15 | 4 | frontier · 60 playSec · ×8 |
| *your model here* | | | | | |

## AI / automation API

The game is fully drivable by an agent — `window.GameAPI` is exposed for the browser console, Playwright/CDP `evaluate`, or any MCP browser tool. Cells are global indices: `cell = face*121 + v*11 + u`.

```js
GameAPI.start(1, false, 7777)    // diff 0..2, free, SEED — same seed = identical scenario
GameAPI.simulate([{cell, action:'wall'|'dig'|'chop'}, ...])   // dry-run: predicted route
                                 //   lengths + gain, valid:false = would seal. Nothing committed.
GameAPI.plan([['build',i,'cannon'],['place',j],['callWave']]) // batch actions, one round-trip
GameAPI.state()                  // full JSON snapshot: gold, lives, creeps, towers,
                                 //   hmap, live path, portals, next wave, unlocked towers
GameAPI.build(GameAPI.cell(0,5,3), 'cannon')   // → {ok, spent} or {ok:false, why}
GameAPI.upgrade(i) / GameAPI.sell(i)
GameAPI.dig(i) / GameAPI.place(i)              // terraform (matter-conserving)
GameAPI.craft('ironpick')        // WORKSHOP — ironpick | crystalpick | bucket | shovel | lens
                                 //   state().tools lists owned + carried liquid;
                                 //   GameAPI.grid.tools / grid.digTiers = costs & pick gates
GameAPI.bucket(i)                // scoop a liquid tile / pour the carried one (needs bucket)
GameAPI.peek(i)                  // prospector lens: next layer's loot — never consumes RNG
GameAPI.callWave()               // call early during a break
GameAPI.speed(4); GameAPI.pause(true); GameAPI.auto(true)
GameAPI.logs(50)                 // timestamped event log (builds, leaks, unlocks…)
GameAPI.errors()                 // captured runtime errors (also shown in the red bar)
GameAPI.meta()                   // LEGACY shards + owned upgrades + this run's bonuses
GameAPI.buyMeta('luck')          // spend shards: gold | dirt | luck | dmg | hero
GameAPI.warp(19)                 // testing tool (like unlock): jump the wave counter
                                 //   during a break — next called wave composes as n+1
GameAPI.grid                     // static data: biomes, hazards, tower stats
GameAPI.decode(i)                // index → {face, faceName, u, v}
```

Every action returns `{ok, …}` / `{ok:false, why}` and never throws. A typical agent loop: `state()` → decide → `build/dig/place` → `callWave()` → poll `state()` until `breakSec > 0` → repeat.

## Example: drive it from Claude Code / any CDP client

```js
// playwright
const s = await page.evaluate(() => GameAPI.state());
await page.evaluate(() => GameAPI.build(GameAPI.cell(0, 5, 4), 'cannon'));
```
