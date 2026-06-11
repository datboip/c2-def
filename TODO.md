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
- **#22 content variety (2026-06-11)**: 4 new creeps — burrower w8+ (first hit sends it under 3s; water/ice/road deny the dive), swarm-mother w10+ (death-splits into 4 spawn with fresh nids), saboteur w12+ (shorts one tower 4s, spark tether), night-only wisp w9+ (50% dmg moving / 2× slowed) — lightly weighted in composeQueue; plus 1-2 seeded landmark set-pieces per biome (standing-stone circle, sandstone arch, glinting monolith, smoking vent, hollow stump, varied crystal clusters), all choppable DEC scenery off the route. Bestiary/portraits/GameAPI.grid updated.
- **#10 endgame (2026-06-11)**: THE WARDEN wave-20 phase boss (armored colossus, glowing core; P1 50% armor + crushes towers within 1 cell, P2 6s-cadence STOMP stuns towers in 2.5 + shake, P3 ×1.6 speed + 2 brood/5s via the swarm-mother birth path; leak = 6 lives, kill = +500g + victory) · ENDLESS continuation (break bar → CONTINUE — ENDLESS; +8%/wave hp compounding past 20, Warden every 10th wave at +60% hp each; scorecard reports endless/deepWave) · LEGACY meta (localStorage `c2meta`: floor(score/1000) shards banked at victory/overrun/quit; splash LEGACY panel, 5 upgrades ×3 lv at 2/4/8 shards; derived in start(), **disabled when an explicit seed is passed** — scorecard meta:false, see README arena note) · new sfx stomp/victory · `GameAPI.warp(n)` + play.js `warp`/`meta`/`eval` for testing. Stats graphs (the last bit of old item 4) still open.

- **golem tiers + stats graphs (2026-06-11)** — the last two wishlist items:
  - **Golem upgrade tiers**: casting golem again while one lives REFORGES it in place — t1 stone (120g+3 iron) → t2 iron (+50% life/slam dmg, 80g+2 iron, metallic plating: pauldrons + brow, ×1.16 scale) → t3 crystal (+100%, 120g+1 shard, glowing purple seams + chest gem + violet eyes, ×1.32). `GOLEM_T` table + `golemNextTier()`; ability button label/cost are dynamic (`a.lab()` — part of the cached renderAbil string so it repaints; shows "tier II/III" while upgradable, "golem III — MAX" when capped). Slam dmg ×mult at the one damage site; no rnd() involved. `state().golem={tier,life}` for agents.
  - **Stats graphs**: `RSTAT` sampler — gold+lives once per game-second into adaptive ring buffers (cap 300; when full every 2nd sample drops and the period doubles, so the WHOLE run always fits) + `kw[]` kills-per-wave. Pause menu gains two hairline canvas sparklines (amber gold / teal lives, design-language v2, midline+baseline grid, current-value readout). Victory letterbox refactored to `endPanelShow(title,color,sub)` — now ALSO fires on OVERRUN (non-blocking, auto-hides) — and draws `#vbars` kills-per-wave bars (amber, Warden waves teal, wave ticks every 5). drawSpark samples one point per pixel column (downsample for draw). All reset in resetGame.
- **#25 crafting (2026-06-11)**: the WORKSHOP (hotkey K / hammer chip by the resource bar, cockpit design language, all-SVG icons — bucket/pickiron/pickcrystal/shovel/lens/hammer added to `IC`). Six one-time tools per run: stone pick (free, soft biomes) · iron pick 3 iron (tundra frozen ground, + any soft cell beside ice) · crystal pick 2 shards+50g (volcanic/caverns) · bucket 2 iron (scoop liquid tile → carry one load → pour on land/pit; tryEdit-validated, matter conserved, scoop deliberately does NOT reflood from neighbours) · shovel 1 iron (+10% mining on soft ground, cap 95%) · prospector lens 1 shard (dig-cursor tooltip + walk-mode facetag show next layer). **Dig loot now comes from a per-(seed,cell,depth) mulberry32 HASH instead of the live RNG stream** (`lootRoll`/`lootAt`) so `GameAPI.peek` never consumes rolls — same probabilities, table shared by dig() and the lens. Pick gates by biome NAME apply to dig()/walk dig/aiDig/simulate(); the director greedily crafts the pick its newest biome needs when affordable. MP: room toolbox, host-authoritative — guests' craft/bucket acts forward like build/dig, toolbox mirrors via the static snapshot. G cycles dig→bucket in god view; bucket is hotbar slot 4 on foot. GameAPI: `craft/bucket/peek`, `state().tools`, `grid.tools`/`grid.digTiers`; play.js `craft/bucket/peek` commands.

## Open (priority order)

1. **Multiplayer** — biggest item. Owner's design: **each player owns a face/biome** — every join wakes one more face; each player defends their own portal lane toward the shared crystal; host-authoritative sim over a dumb WebSocket relay (a ~70-line `server.js` relay + gunner-mode client exist in an earlier claude.ai artifact of the flat-map version — port the pattern, not the code). FP gunner mode for guests is the proven fun loop.
2. **CLI driver** — tiny Node+Playwright wrapper around `GameAPI` so an agent can play from a terminal (`node play.js state`, `node play.js build 0,5,3 cannon`). All the hooks exist already.
3. **Audio & ambience** — footsteps in walk mode, core/portal hum, per-tower fire sounds (partial: synth `beep()` exists), volume slider.
4. ~~**Endgame**~~ ✅ DONE (see Done list, incl. stats graphs 2026-06-11). Balance note: wave 15+ income still outpaces sinks; the Warden + endless are now the sink, but mid-game tuning could use a pass with `GameAPI.warp`.
5. ~~**Nice-to-haves logged along the way**~~ ✅ DONE — golem upgrade tiers shipped 2026-06-11 (the walk-mode trio shipped with the walk-mode polish batch below).

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

### UI/flow wishlist round 2 (2026-06-11 review) — ✅ ALL DONE (2026-06-11, `shot-ui2.png`)

1. ~~**Wave-end summary card**~~ ✅ — `#wavesum` panel (design-language v2: flat, hairlines, beveled corners, Oxanium header) below the wave banner strip at each wave clear: top-3 kills by tower type (+hero), leaks by portal, bounty gold earned (`waveGold`/`waveKills` ledger reset per wave), PERFECT flag. ~3.2s auto-hide, click dismisses; suppressed in DEMO and at speed ≥4 (spam).
2. ~~**Build-bar hover panel**~~ ✅ — `#bhover` styled card (pointer-events:none, delegated pointerover/out so renderBar repaints can't orphan it): dmg/rate/range/HP, splash/chain/slow extras, home biome +25% note, both tier-3 branches with the 3× cost. Native `title` removed from bar items; positions above the hovered slot, zoom-aware.
3. ~~**HUD scale setting** + prefs~~ ✅ — settings slider 0.8–1.3 (CSS `zoom` on the HUD roots); localStorage `c2prefs` persists hudScale, hide-UI, history-panel, SETT.vol/music/bob/sens/invert — loaded on boot (controls synced), saved on every change. Verified round-trip through a page reload.
4. ~~**Damage ticker**~~ ✅ — 1Hz `dmgDealt` samples per tower into an 11-slot ring (game-time normalized so ×8 doesn't inflate); tower panel shows rolling `dps (10s)` via a targeted `#pDps` textContent write (never repaints the panel's buttons). Also in `state().towers[].dps` for agents.
5. ~~**Creep inspector**~~ ✅ — god-view click on a creep (same castAt path as towers/hero, armed build/dig tools keep tile priority): type+class, hp/max, speed + live modifiers (slowed/stunned/burrowed/burning/sabotaging/warden phase/wisp state/night), source portal biome, walk-field cells-to-crystal (or "pocketed"), bounty. Refreshes at 4Hz (cached string), closes on click-elsewhere or death; `GameAPI.inspect(n)` for agents/tests.

### Walk-mode (1st/3rd person) wishlist — ✅ ALL DONE (2026-06-11, `shot-walkmode.png`)

1. ~~**Aimed-tile highlight**~~ ✅ — Minecraft-style `LineSegments` box outline on the aimed block, sized to the tile, slightly proud (1.035×, +.012 lift) so it never z-fights the top face. Color by tool: amber dig · teal place · blue bucket · tower-color build; outlines the block that *goes* for dig/scoop and the *incoming* block for place/build/pour; tracks HMAP every frame; hidden out of reach / gun slot. Visual only — acts still route through dig/placeDirt/bucketAct/tryBuy.
2. ~~**Build from walk mode**~~ ✅ — 5th hotbar slot (after dig/wall/gun/bucket) showing the selected tower's bar icon + cost (red when unaffordable); **T** cycles unlocked types; acting calls the same `tryBuy` validation path (cost, unlock, water, pit, creep, trample rules all intact) with its denial toasts. `GameAPI.fp.build(type)` + `state().fp` for agents.
3. ~~**Cube compass**~~ ✅ — 90px overlay canvas bottom-right: wireframe mini-cube matching camera orientation (back edges fade for depth), current face filled amber, teal dot = crystal, tinted dots = awake portals (far-side dots dim). Redrawn per frame in walk mode only.
4. ~~**TP camera collision**~~ ✅ — per-frame raycast head→boom against tiles + towers; camera pulled in front of the first hit with .25 margin (snaps in, eases back out at ~5/s). Verified error-free with walls on all 4 sides.
5. ~~**Feel pass**~~ ✅ — stride-driven head-bob (FP only, eases in/out, `SETT.bob` toggle in settings, default ON) · footstep ticks (two alternating quiet noise voices `step0/step1`, cadence from distance travelled) · landing puff + `land` thump when dropping >1 block · edge crossings now roll gravity over ~.45s (slerp rate 4.5 during `reorientT`) instead of snapping.
6. ~~**Mining feedback**~~ ✅ — every dig act pulses the aim wireframe (scale + white flash, .3s decay) so each roll of the gamble reads; success/crumble debris puffs were already there.

Verdicts: settler idle pacing is healthy (wave 8, no prestige, autopilot bought tesla and mazed to 32 cells). Planetfall is appropriately brutal. Frontier's danger is entirely concentrated at biome unlocks — items 2 and 4 are the fix.

## Gotchas

- **The dangling-else incident (fixed 2026-06-10, do not regress):** `if(tt.splash)for(...)if(near)damage(...); else damage(...)` — the else bound to the inner if, so **non-splash towers (cannon/frost/laser/sniper) dealt zero projectile damage for the project's entire history**. Only tesla chains, mortar splash, the crystal zap, and abilities ever killed anything; all pre-fix balance was unknowingly tuned around it. The fix is one set of braces in the shot-hit block (commented at the site). If kills/damage ever read zero on a working tower, check `GameAPI.testDmg()` and the shot-hit block first.

- Tile heights: one logical level = `HSTEP` (0.98 world units, full Minecraft-style blocks). Tile boxes are 4.4 deep so 3-deep pits show solid walls.
- `FACES[]` basis vectors define each face's tangent frame; walk-mode yaw is re-expressed when crossing edges (degenerate head-on case handled — don't simplify it away).
- Pointer lock fails in sandboxed/embedded contexts; the drag-look fallback (~380ms timeout) is load-bearing. Never make FP depend on lock.
- `renderBar`/`renderAbil`/HUD all cache their HTML strings — if you add UI state, make sure it's part of the string or it won't repaint.
- Shadows render every 2nd frame (`shadowMap.autoUpdate=false`) — if lighting looks stale after a scene change, that's why.
