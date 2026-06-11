# Beyond the Browser: Unity / Steam / Multiplayer research (2026-06)

Research on taking C² DEFENSE (single-file three.js, ~2.5k lines, procedural geometry, WebAudio synth, DOM UI, GameAPI automation layer) beyond the browser. Compiled by a research agent with web sourcing; fluff flagged.

## TL;DR recommendation

**Don't port.** The game runs everywhere, loads instantly, and the GameAPI/AI-arena layer is an asset no other path preserves.
1. **Steam** → Electron + steamworks.js (~1 week, $100 Steam Direct fee, proven by Vampire Survivors / CrossCode / Industry Idle).
2. **Multiplayer** → Node WebSocket or Colyseus server on the existing JS sim (1–2 weeks to co-op prototype; the automation API doubles as a bot-client test rig).
3. **Unity** → only when a web-impossible goal appears (console port, entity-count performance wall). Per the Vampire Survivors precedent: migrate *after* success, for a concrete reason — an LLM-assisted rewrite at that point is a 1–2 week job.

## Findings by option

| Option | Effort | Risk | Cost | Verdict |
|---|---|---|---|---|
| Automated three.js→Unity transpiler | — | total | $0 | **Does not exist.** Dead/toy repos only; SEELE AI's "Unity export" is a generator, not a converter (fluff). |
| LLM-assisted Unity port | 4–10 days | medium | ~$0–100 tokens | Viable when needed. Logic ports nearly free; DOM UI rebuild + WebAudio synth are the hard parts (no oscillator equivalent; `OnAudioFilterRead` doesn't work in Unity WebGL). LLMs hallucinate Unity APIs far more than web APIs. Handedness flip (RH→LH) at scene root. |
| Webview inside Unity (Vuplex, $130–420) | 3–7 days | high | $130–420 | Worst of both worlds: Chromium-in-Unity, ~2–4 frames input latency, macOS is CPU-readback, zero shipped-game precedent. OneJS is NOT a webview (no DOM/WebGL — three.js can't run on it). |
| **Electron + steamworks.js → Steam** | 3–10 days | **low (proven)** | $100 | **Best Steam path.** steamworks.js maintained (Greenworks dead). Runs on Steam Deck under Proton. Skip macOS initially (signing pain; Industry Idle: 99% of desktop players were Windows). |
| Tauri wrapper | 5–10 days | med-high | $100 | Avoid for Steam: per-OS webviews (WKWebView WebGL lags) + hand-written Rust Steamworks glue (documented deal-breaker). |
| PlayCanvas / Needle Engine | weeks / days | low-med | $15/mo / €49–67/mo | Rewrite (PlayCanvas ECS ≠ three.js) or subscription (Needle free tier = non-commercial + watermark). Solves non-problems. |
| Godot rewrite | 2–4 weeks | medium | $0 | Web export improved (4.3+ single-threaded, ~5MB) but still worse than the current zero-runtime setup. Only for FOSS-engine ambitions. |
| **Stay web + WebSocket/Colyseus multiplayer** | 1–2 wks | low-med | $5–15/mo | **Best multiplayer path.** Sim code reused as-is; Colyseus (MIT, rooms + delta state sync, three.js examples). Unity alternative = full port + steep Netcode-for-GameObjects curve + paid Relay coupling (free tier 50 avg CCU, then $0.16/CCU). |

## Key gotchas if a Unity port ever happens
- Coordinate handedness: three.js RH vs Unity LH — flip Z once at the root; watch inside-out meshes and Euler-order (XYZ vs ZXY).
- WebAudio synth is the highest-risk subsystem — pre-bake procedural AudioClips or accept `OnAudioFilterRead` (desktop only).
- Much Unity UI lives in Inspector/scene state that LLMs can't express as code; Unity MCP bridges (e.g. mcp-unity) mitigate.
- Build characterization tests around the original first (a documented C++→C# audio port compiled fine but was silently wrong).
- Ports tend to shrink/subset code rather than translate 1:1 — treat the JS version as the spec.

## Fluff flags from the research
SEELE AI "Unity export" (generates, doesn't convert) · Vuplex "144 FPS" (real mechanism, marketing number) · Unity WebGPU (experimental, "not for production") · Needle "free" (non-commercial + watermark) · Rune's WebRTC-vs-WebSockets article (vendor content) · Unity's NGO success blogs (marketing channel).
