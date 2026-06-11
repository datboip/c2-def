# UI/UX research: making it read as a "real game" (2026-06-11)

Compiled by a research agent (cited). Applied so far: flat panels + hairlines, semantic-only accents, idle animation killed, Oxanium/Inter type split, tabular numerals, enemy portraits in help, action-driven tutorial.

## The diagnosis
Mobile-ad tells: glossy pills, radius everywhere, decorative glow, rainbow palette, idle pulsing, floaty cards. Real-game tells (Into the Breach, Factorio, Mindustry, FTL): layered neutral surfaces, accent = meaning only, one corner language, dense purposeful info, motion only on state change. Reference archives: interfaceingame.com, gameuidatabase.com. Mindustry is open source — study `core/src/mindustry/ui/`.

## Remaining checklist (top items not yet applied)
- [high] 4-layer surface system: base → panel (+5% light) → inset wells (darker) → action accents. Build-tray slots as inset wells (`inset 0 1px 2px rgba(0,0,0,.5)`).
- [high] Gray text ramp (#e8eaf0/#9aa3b2/#5a6272) for all non-semantic text; gold ONLY for currency, teal ONLY for selection/abilities.
- [high] One corner language: bevel/notch 1-2 corners of KEY containers only (clip-path), everything else square. Selection = corner brackets or 2px accent edge, never glow.
- [high] Damage numbers: white + 1px dark outline, 1.2→1.0 scale pop in 100ms, drift 24-40px, fade 600-800ms, pooled elements.
- [med] Hotkey badges (1-9) on tower/ability buttons — strongest "real PC game" signal.
- [med] Disabled = desaturated icon + darkened well + red cost, not opacity .5.
- [med] Motion tokens: hover 80-120ms ease-out, panels 150-250ms cubic-bezier(.22,1,.36,1), exits 30% faster, active = translateY(1px), never scale-bounce.
- [med] Resource changes: tween count ~300ms, flash digits only.
- [med] Wave banner: letterbox strip w/ expanding hairlines, no scale bounce.
- [med] Enemy HP bars → instanced WebGL quads past ~100 creeps (currently fine).
- [med] Tooltips ≤100ms, data-dense w/ mini stat bars (Into the Breach lesson: diagrams not prose).
- [med] Tutorial highlight: backdrop cutout (box-shadow 0 0 0 9999px) + input gating per step.
- [low] 1-3% noise texture on panels only; faint vignette; one diegetic leader-line from selected tower to its panel.
- Icons: game-icons.net (4000+ CC-BY, cohesive silhouettes) if we outgrow hand-drawn SVGs.
- Fonts applied: Oxanium (display) + Inter (UI). Alternatives: Rajdhani+IBM Plex Mono, Chakra Petch+Space Grotesk. Avoid Orbitron.

Key sources: Factorio FFF-212/243 + community style guide (man.sr.ht/~raiguard/factorio-gui-style-guide), Into the Breach GameDeveloper interview, NN/g animation duration, Dave Rupert corner-shape, game-icons.net.
