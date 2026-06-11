#!/usr/bin/env node
/* C² DEFENSE CLI driver — play the game from a terminal (human or AI agent).
 *
 *   npm install            # once (pulls playwright)
 *   node play.js           # REPL: type commands, get JSON back
 *   node play.js -e "start 1; build 0,4,5 cannon; wave; speed 8; state"
 *   node play.js --headed  # watch the browser while you drive
 *
 * Cells are addressed as face,u,v (0-10). Faces: 0 TOP · 1 BOTTOM · 2 EAST · 3 WEST · 4 SOUTH · 5 NORTH
 */
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const { chromium } = require('playwright');

const HEADED = process.argv.includes('--headed');
const cell = s => { const [f, u, v] = s.split(',').map(Number); return f * 121 + v * 11 + u; };

const HELP = `commands (JSON out):
  start [diff 0-2] [free] [seed]   new run (fixed seed => identical scenario)
  sim wall:f,u,v dig:f,u,v ...     dry-run terrain edits -> predicted route lengths
  state                        full snapshot: gold, lives, creeps, towers, path, mining...
  build f,u,v <type>           cannon|frost|laser|mortar|tesla|sniper
  upgrade f,u,v | sell f,u,v | branch f,u,v <0|1>
  prio f,u,v <first|strong|close>
  dig f,u,v | place f,u,v      terraform (matter-conserving)
  craft <tool>                 workshop: ironpick|crystalpick|bucket|shovel|lens
  bucket f,u,v                 scoop a liquid / pour the carried one (needs bucket)
  peek f,u,v                   prospector lens: what the next layer holds
  wave                         call the next wave early
  speed <1|2|4|8> | pause | resume | auto <on|off>
  ability <golem|freeze|strike>
  unlock                       wake the next biome (sandbox/testing)
  warp <n>                     jump wave counter during a break (testing; warp 19 => Warden next)
  walk | look <yaw> <pitch> | tool <0|1|2|3> | act [btn] | exit   first-person controls
  score                        benchmark scorecard (for AI model comparisons)
  meta [upgrade]               LEGACY shards/upgrades; with arg = buy (gold|dirt|luck|dmg|hero)
  eval <js>                    raw JS in the page (debugging; no ';')
  logs [n] | errors | debug    introspection
  shot [file.png]              screenshot
  help | quit`;

const LAUNCH_ARGS = [
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
];
async function launchBrowser() {
  try { return await chromium.launch({ headless: !HEADED, args: LAUNCH_ARGS }); }
  catch (e) {
    // fall back to any cached playwright chromium (version drift between npm pkg and cache)
    const root = path.join(os.homedir(), '.cache', 'ms-playwright');
    for (const d of (fs.existsSync(root) ? fs.readdirSync(root) : []).filter(d => d.startsWith('chromium'))) {
      const exe = path.join(root, d, 'chrome-linux', 'chrome');
      if (fs.existsSync(exe)) {
        try { return await chromium.launch({ headless: !HEADED, executablePath: exe, args: LAUNCH_ARGS }); } catch (_) {}
      }
    }
    throw e;
  }
}

(async () => {
  const html = path.join(__dirname, 'index.html');
  if (!fs.existsSync(html)) { console.error('index.html not found next to play.js'); process.exit(1); }
  const srv = http.createServer((req, res) => {
    fs.readFile(html, (err, data) => {
      if (err) { res.writeHead(500); res.end(); return; }
      res.writeHead(200, { 'content-type': 'text/html' }); res.end(data);
    });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const browser = await launchBrowser();
  const page = await (await browser.newContext()).newPage();
  await page.goto(`http://127.0.0.1:${srv.address().port}/`);
  await page.waitForFunction(() => !!window.GameAPI);

  async function run(line) {
    const parts = line.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return null;
    const [cmd, a, b] = parts;
    switch (cmd) {
      case 'start': { /* start [diff] [free] [seed]  or  start [diff] [seed] */
        let free = false, seed = null;
        if (b === 'free') { free = true; seed = parts[3] != null ? +parts[3] : null; }
        else if (b != null) seed = +b;
        return page.evaluate(([d, f, s]) => GameAPI.start(d, f, s), [a == null ? 1 : +a, free, seed]);
      }
      case 'state':   return page.evaluate(() => GameAPI.state());
      case 'build':   return page.evaluate(([i, t]) => GameAPI.build(i, t), [cell(a), b]);
      case 'upgrade': return page.evaluate(i => GameAPI.upgrade(i), cell(a));
      case 'sell':    return page.evaluate(i => GameAPI.sell(i), cell(a));
      case 'branch':  return page.evaluate(([i, k]) => GameAPI.branch(i, k), [cell(a), +b || 0]);
      case 'prio':    return page.evaluate(([i, p]) => GameAPI.prio(i, p), [cell(a), b]);
      case 'sim': { /* dry-run: sim wall:0,4,5 dig:0,3,3 -> predicted route lengths, nothing committed */
        const edits = parts.slice(1).map(t => { const [act, c] = t.split(':'); return { action: act, cell: cell(c) }; });
        return page.evaluate(e => GameAPI.simulate(e), edits);
      }
      case 'dig':     return page.evaluate(i => GameAPI.dig(i), cell(a));
      case 'place':   return page.evaluate(i => GameAPI.place(i), cell(a));
      case 'craft':   return page.evaluate(k => GameAPI.craft(k), a);
      case 'bucket':  return page.evaluate(i => GameAPI.bucket(i), cell(a));
      case 'peek':    return page.evaluate(i => GameAPI.peek(i), cell(a));
      case 'wave':    return page.evaluate(() => GameAPI.callWave());
      case 'speed':   return page.evaluate(n => GameAPI.speed(n), +a);
      case 'pause':   return page.evaluate(() => GameAPI.pause(true));
      case 'resume':  return page.evaluate(() => GameAPI.pause(false));
      case 'auto':    return page.evaluate(v => GameAPI.auto(v), a !== 'off');
      case 'ability': return page.evaluate(k => GameAPI.ability(k), a);
      case 'hero':    return a ? page.evaluate(k => GameAPI.heroSkill(k), a) : page.evaluate(() => GameAPI.state().hero);
      case 'unlock':  return page.evaluate(() => GameAPI.unlock());
      case 'warp':    return page.evaluate(n => GameAPI.warp(n), +a); /* testing: jump wave counter */
      case 'walk':    return page.evaluate(() => GameAPI.fp.enter());
      case 'exit':    return page.evaluate(() => GameAPI.fp.exit());
      case 'look':    return page.evaluate(([y, p]) => GameAPI.fp.look(y, p), [+a, b == null ? null : +b]);
      case 'tool':    return page.evaluate(n => GameAPI.fp.tool(n), +a);
      case 'act':     return page.evaluate(n => GameAPI.fp.act(n), +a || 0);
      case 'score':   return page.evaluate(() => GameAPI.scorecard());
      case 'player':  return page.evaluate(n => GameAPI.player(n), a);
      case 'lead':    return page.evaluate(() => GameAPI.leaderboard());
      case 'bench': { /* autopilot baseline: bench [playSec=60] [diff=1] */
        const target = +a || 60, diff = b == null ? 1 : +b;
        await page.evaluate(d => { GameAPI.start(d, false); GameAPI.auto(true); GameAPI.callWave(); GameAPI.speed(8); }, diff);
        let card;
        do { await new Promise(r => setTimeout(r, 2000)); card = await page.evaluate(() => GameAPI.scorecard()); }
        while (card.playSec < target);
        return card;
      }
      case 'meta':    return a ? page.evaluate(k => GameAPI.buyMeta(k), a) : page.evaluate(() => GameAPI.meta());
      case 'eval': {  /* raw JS in the page (no ';' — the -e splitter eats them).
                         eval is deliberate: this is a local dev/debug CLI executing the
                         operator's own input against their own localhost game page —
                         same trust boundary as the browser console. */
        const code = parts.slice(1).join(' ');
        return page.evaluate(c => { try { return JSON.parse(JSON.stringify(eval(c)) || 'null'); } catch (e) { return { ok: false, why: String(e && e.message || e) }; } }, code);
      }
      case 'logs':    return page.evaluate(n => GameAPI.logs(n), +a || 30);
      case 'errors':  return page.evaluate(() => GameAPI.errors());
      case 'debug':   return page.evaluate(() => GameAPI.debug());
      case 'shot':    { const f = a || 'shot.png'; await page.screenshot({ path: f }); return { saved: f }; }
      case 'wait':    await new Promise(r => setTimeout(r, (+a || 1) * 1000)); return { waited: +a || 1 };
      case 'help':    return HELP;
      case 'quit': case 'exit!': await browser.close(); process.exit(0);
      default:        return { ok: false, why: 'unknown command — try help' };
    }
  }

  const ei = process.argv.indexOf('-e');
  if (ei >= 0) {
    for (const c of process.argv[ei + 1].split(';')) {
      const r = await run(c);
      if (r !== null) console.log(typeof r === 'string' ? r : JSON.stringify(r));
    }
    await browser.close(); process.exit(0);
  }

  console.log('C² DEFENSE CLI — type help');
  process.stdout.write('> ');
  const rl = require('readline').createInterface({ input: process.stdin });
  for await (const line of rl) {
    try {
      const r = await run(line);
      if (r !== null) console.log(typeof r === 'string' ? r : JSON.stringify(r));
    } catch (e) { console.log(JSON.stringify({ ok: false, err: String(e.message || e) })); }
    process.stdout.write('> ');
  }
})();
