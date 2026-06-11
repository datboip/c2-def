# C² DEFENSE — field guide

Everything a player (human or AI) needs to know to play well. Machine-readable versions of these tables: `GameAPI.grid` (towers, creeps, biomes).

## Enemies

Creep HP = `9 × 1.12-1.20^wave × hpMult × difficulty`. Bounty is flat gold per kill.

| creep | hp× | speed | class | appears | special | best counter |
|---|---|---|---|---|---|---|
| grunt | 1.0 | 1.4 | walker | w1 | — | anything; cannon fodder |
| runner | 0.5 | 2.3 | walker | w1 | fast | frost slow + high fire rate (laser/gatling) |
| tank | 2.8 | 0.9 | walker | w1 | climbMul 0.3 — **nearly stops on any slope** | sniper ("strong" priority); slopes turn it into a target dummy |
| jumper | 0.9 | 1.5 | jumper | w6 | hops 1-high walls, rides them | **2-high walls stop it**; tesla chains |
| crawler | 1.3 | 1.1 | climber | w7 | **ignores ALL terrain** (half speed doing it) | pure DPS — your maze means nothing to it; mortar splash on the straight line |
| healer | 1.2 | 1.2 | walker | w6 | heals nearby creeps 8%/2s | kill FIRST — tesla chains reach it behind tanks; executioner deletes it |
| shield | 1.6 | 1.1 | walker | w9 | **35% damage reduction** | big single hits (sniper/railgun); slows + time |
| boss | 15 | 0.75 | walker | every 5th wave | regenerates 1.2% max hp/s | focus fire + freeze + burn (DoT outpaces regen); +150 bounty, +50 score |

Class rules: **walkers** climb 1-level slopes slowly (× their climbMul), blocked by 2-level cliffs. **Jumpers** clear height-1, blocked by height-2. **Climbers** cross everything. Night (sun down): all creeps +15% speed, eyes glow red.

## Towers

Native biome in parentheses — built on its home face: **+25% dmg**. On a wall: **+15% range**. Towers have HP (50, +40/tier) and get **trampled** by creeps standing on their cell — they never block the route.

| tower | cost | dmg | rate | range | role | tier-3 branches (3× cost) |
|---|---|---|---|---|---|---|
| cannon (meadow) | 50 | 8 | 0.9/s | 2.7 | starter workhorse | inferno (burn DoT) / gatling (rate ×2.2) |
| frost (tundra) | 50 | 3 | 0.8/s | 2.4 | 50% slow 1.5s | blizzard (slow splashes) / permafrost (85% slow 2.5s) |
| laser (caverns) | 75 | 2.6 | 2.4/s | 3.3 | anti-runner chip damage | prism (forks to 2nd target) / overcharge (dmg ×2, range +20%) |
| mortar (volcanic) | 100 | 12 | 0.38/s | 3.6 | splash, min-range 1.3 | heavy shell (dmg ×2.2, wider) / cluster (3 shells) |
| tesla (forest) | 100 | 5 | 0.75/s | 2.5 | chains to 3 | storm (chains to 5) / overload (20% stun) |
| sniper (desert) | 150 | 34 | 0.28/s | 5.5 | anti-tank/boss, defaults "strong" targeting | executioner (kills non-boss <20% hp) / railgun (dmg ×2.2) |

Upgrades: tier 2 = base cost, tier 3 = 2× base (bronze → silver → gold base). Sell refunds 75% of everything invested. Targeting priority per tower: first / strong / close.

## Terrain & economy

- Matter conserved: dig = +1 dirt, place = −1. Chop scenery free (+1 dirt); builds auto-chop.
- Mining: 3g per roll, 60% +5%/level success (cap 95%), XP per attempt. **First 10 digs per run are free and guaranteed** (surveyor's kit).
- Loot by depth: layer 1 gold, layer 2 iron, layer 3 shards/gems. Bedrock at −3.
- 1-deep pit = speed bump · 2-deep = walker-proof cliff · walls: 1-high slows walkers/stops nothing special, 2-high stops walkers AND jumpers. Crawlers cross all of it.
- Hazards: forest undergrowth −15% speed · desert quicksand makes pits lethal-slow · tundra ice +15% speed but frost slows last 1.5× · volcanic embers / cavern static burn % hp per second.
- Waves: call early for +20+5×wave gold. Wave clear pays 30+10×wave. Biomes wake on schedule (first at w4) or **breach early** via the countdown chip (120g +60/face → expedition cache + the native tower).

## Abilities & hero

- **golem** 120g+3 iron — walks to creeps, AoE slams, 75s. **freeze** 1 shard — 85% slow everything 3s. **strike** 100g — 6 shells on the route. **pilot** 2 shards once — your hero auto-roams and hunts.
- The **hero** is always fielded: sentries (3.5 range, ~12+ dmg) when unmanned, V to possess, C for third person.

## Score (the benchmark)

+5/kill (+50 boss) · +100+10w per cleared wave (+50 perfect) · +150/biome · +30/mining level · −25/leak · −400/overrun. See README for the arena protocol. **Autopilot baseline: 4600** (frontier, 60 playSec @ ×8).
