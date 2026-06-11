# C² DEFENSE — cube squared

A single-file 3D tower defense where the world is a cube. Six faces, six biomes, gravity points at the molten core. Creeps pour from biome portals and march across faces and over edges to your crystal.

**Run it:** open `index.html`, or serve it:

```sh
python3 -m http.server 8765 --directory .
# → http://localhost:8765/index.html
```

## The rules

- **One in, one out.** Every awake biome has exactly one portal (tinted to that biome's color). All routes end at the single crystal. You never seal a route — you only make it longer, slower, and deadlier.
- **Waking the cube.** Runs start on the meadow. Surviving waves wakes biomes in a fixed order — **forest → desert → tundra → volcanic → caverns** — each bringing a new portal, its hazard, and its native tower. Difficulty sets the pace and ceiling: settler (3 biomes, every 9 waves), frontier (5, every 6), planetfall (all 6, every 4).
- **Native towers.** cannon→meadow (starter) · tesla→forest · sniper→desert · frost→tundra · mortar→volcanic · laser→caverns. A tower built on its home biome deals **+25%**.
- **Hazards.** forest undergrowth slows creeps · desert quicksand makes dug pits lethal-slow · tundra ice speeds creeps but frost slows last 1.5× · volcanic embers and cavern static burn % HP per second.
- **Matter is conserved.** Dig = +1 dirt carried, place = −1. No deleting, no conjuring. The AI director plays by the same law (it digs spoil before it walls).
- **Terrain is read by class.** Walkers climb 1 block slowly; jumpers hop walls; crawlers scale anything; tanks nearly stall on slopes. 2-deep cliffs stop walkers cold.
- **Guns, not walls.** Towers never block or reroute creeps — only terrain bends the route, so you *have* to dig and terraform. A tower standing on the route gets trampled by passing creeps (towers have HP); building in the highway is a greedy gamble. Creeps pocketed by terrain slowly climb out — traps can't be sealed.
- **Abilities** (right bar): golem (120g + 3 iron) hunts and slams, freeze (1 shard) hard-slows everything, airstrike (100g) carpets the route. Tier-3 towers buy one of two branch specializations at 3× base cost.
- **Path dots show speed:** green = full pace, yellow = slowed, red = crawling. Kill zones belong on red.
- **Mining is a gamble with a skill curve.** Every dig costs 3g to roll: 60% base success, +5% per mining level (cap 95%), XP for every attempt. Failures crumble the block and keep your gold. Chopping trees/scenery is free (+1 dirt) — and must happen before the ground under them can be dug. Successful digs go inward toward bedrock (3 layers): layer 1 drops gold, 2 iron, 3 shards/gems. The AI rolls on the same table.

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

## AI / automation API

The game is fully drivable by an agent — `window.GameAPI` is exposed for the browser console, Playwright/CDP `evaluate`, or any MCP browser tool. Cells are global indices: `cell = face*121 + v*11 + u`.

```js
GameAPI.start(1, false)          // diff 0..2, free=true for sandbox
GameAPI.state()                  // full JSON snapshot: gold, lives, creeps, towers,
                                 //   hmap, live path, portals, next wave, unlocked towers
GameAPI.build(GameAPI.cell(0,5,3), 'cannon')   // → {ok, spent} or {ok:false, why}
GameAPI.upgrade(i) / GameAPI.sell(i)
GameAPI.dig(i) / GameAPI.place(i)              // terraform (matter-conserving)
GameAPI.callWave()               // call early during a break
GameAPI.speed(4); GameAPI.pause(true); GameAPI.auto(true)
GameAPI.logs(50)                 // timestamped event log (builds, leaks, unlocks…)
GameAPI.errors()                 // captured runtime errors (also shown in the red bar)
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
