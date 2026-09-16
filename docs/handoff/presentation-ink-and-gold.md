# Presentation handoff — "Ink & Gold" (Direction A)

Approved by Bailey on 2026-09-15 (evening) from three mockup directions. Brief he
gave: the cinematic Persona-style presentation the way Clair Obscur: Expedition 33
incorporates it, shown as mockups first. **Nothing below is integrated yet** — this
document is the spec for whoever owns `src/ui/**`, the HUD, transitions and the
non-battle screens.

- Editable canvas (all boards, alternates on page 2): https://claude.ai/artifact/BYEY26pXa5HoxzBEXcDTjS
- Reference renders: `docs/screenshots/mockups/*.jpg`
- Reference source (static HTML/CSS with the exact values): `docs/handoff/ink-and-gold/*.dc.html`
  (image refs point at downsampled copies of `public/art/**`; ignore the `support.js`
  line and the `<x-dc>`/`<helmet>` wrappers — they belong to the canvas tool)

## What stays, what changes

**Stays:** every painting in `public/art/**`, the battle rules, CTB/ATB semantics,
the writing, Chakra Petch / Rajdhani / Exo 2, the visual-bible palette tokens.

**Changes:** all chrome (windows, menus, status, CTB queue, reticle, banners,
damage numerals), screen transitions, results, chapter select, and a new
turn-start cut-in. The blue FFX glass window (`hud-mock.css`) is retired.

## Tokens

| token | hex | use |
|---|---|---|
| `--ink` | `#0B0A12` | panels, type on ivory (existing) |
| `--paper` | `#F4F1E8` | slabs, banners, results background (existing) |
| `--yevon-gold` | `#E3B94A` | the one accent: acting, selected, ready, splashes (existing) |
| gold on ivory | `#B8862A` | tracked labels on paper backgrounds (darker for contrast) |
| `--blood` | `#B02A2A` | enemies only (existing) |
| `--spira-sky` | `#7FC6E8` | MP (existing) |
| `--pyre-pink` | `#F7B6D9` | replaces gold for the whole accent role in FFX-2 chapters |

One accent per context, never two. Ink alpha for over-art panels: `rgba(11,10,18,.84)`
(`.94` for the acting row, `.62` for name chips).

## Type

| role | face | size @1440 | notes |
|---|---|---|---|
| names, banners, results, damage | **Cormorant Garamond Bold Italic** (700 italic) | 24–200 px | new face — OFL, **in place**: `public/fonts/cormorant-garamond/` (variable 300–700, upright + italic, with `OFL.txt`), declared in `src/ui/common/fonts.css` as `--font-serif`; never a hosted link at runtime |
| commands, labels, chips | Chakra Petch Bold, tracked 0.12–0.34em, uppercase | 11–28 px | existing display face |
| HP/MP/tallies | Rajdhani Bold | 13–54 px | existing numeral face |
| descriptions, dialogue | Exo 2 | 16–19 px | unchanged |

Mockups are authored at 1440×810. The live HUD is authored on the 640×360 logical
grid, so divide every px below by **2.25**.

## Components (exact values from the mockups)

- **Slab** — the unit of chrome: `transform: skewX(-12deg)`; content counter-skewed
  `skewX(12deg)`; drop shadow `0 8px 20px rgba(0,0,0,.45)`.
- **Action banner** (top-left 48,40): ivory slab, `border-bottom: 4px` gold,
  padding `10px 34px 12px 28px`; name in serif 46 px + ink chip with gold 14 px
  label tracked 0.26em.
- **Command stack** (bottom-left 68 from left, 58 from bottom): rows 292×52, gap 8,
  each row indented **16 px** more than the last (cascade); Chakra 22 px tracked
  0.12em; ivory rows with ink text; **selected = gold**; disabled = 42 % opacity;
  cursor = 12×16 ink triangle; Overdrive row inverted (ink fill, 2 px gold border,
  gold text, "READY" tag 11 px). Larger variant on the cut-in screen: 380×66, 28 px,
  cascade 22.
- **CTB queue** (right 44, top 112): 46 px tiles, 2 px ivory border, portrait crop
  `object-position: 50% 10%`; current tile 64 px, 3 px gold border + `0 0 20px
  rgba(227,185,74,.6)` glow; enemy tiles blood border on `#2a0f12` with monogram +
  letter tag; each row shifted **−8 px** further left (diagonal); name chips 11 px
  tracked 0.2em on ink .62. Six rows visible.
- **Party status** (right 52, bottom 54): rows 450×62, gap 8, cascade **16 px**
  right-to-left; ink .84 background; `border-left: 6px` ivory, gold when acting
  (row also .94 ink); portrait 62 px; serif italic name 24 px (gold when acting);
  Rajdhani 26 px values with 13 px `/max` in `#9fb0c4`; MP in spira-sky; Overdrive
  bar 120×8 on `#2a3246`, gold fill.
- **Target bracket**: four 30 px corners, 3 px gold, glow `0 0 4px rgba(227,185,74,.6)`;
  name plate = ink slab with `border-left: 4px` gold, serif 24 px tracked 0.08em,
  hung off the bracket's left edge (clear of the damage number).
- **Damage numeral**: Cormorant 700 italic 128 px, ink, letter-spacing −0.02em, on
  a gold ink-splash polygon (12-point irregular shape, ~380×190, opacity .94). Enemy
  damage on the party would invert (ivory numeral on ink splash) — not mocked.
- **Surface**: 13 % fractal-noise grain in overlay blend across the whole frame;
  vignette `radial-gradient(120% 90% at 55% 40%, transparent 45%, ink .55)` plus a
  top/bottom ink ramp so chrome never sits on raw paint.

## Screens

- **Battle start** — ivory wedge `clip-path: polygon(46% 0, 100% 0, 100% 100%, 30% 100%)`
  with a 1.4 %-wide gold stripe on its leading edge; boss cutout full-height on the
  ink side with a gold rim glow; on the ivory side: gold label
  `CHAPTER I · MT. GAGAZET — THE PROMINENCE` (15 px, 0.34em), boss name in serif
  176 px on two lines (second line indented 140), 3 px ink rule, italic subline;
  bottom: 96 px gold strip clipped to a wedge (`polygon(0 40%, 100% 0, 100% 100%, 0 100%)`)
  carrying party tiles + names and `BATTLE START` 24 px italic tracked 0.24em.
- **Turn cut-in** — backdrop blurred 7 px and dimmed to .55; a 620×880 ivory slab
  (skew −12°) from the left edge holding the actor's portrait at ~940 px tall with an
  ivory fade at the foot; an 8 px gold stripe on its right edge; the actor's name as a
  300 px serif ghost at 16 % gold behind the menu; `YOUR TURN · CTB 1 OF 3` label +
  92 px serif name at bottom-left; large command stack at 640,176; an ink .82 info slab
  with a gold left border for the selected ability's description.
- **Chapter select** — blurred dome backdrop at .32; gold rule + `CHAPTER SELECT`
  16 px tracked 0.4em; selected chapter as a 560×336 slab (skew −8°) with 3 px gold
  border and a 10 px gold .12 halo, painting inside, chapter label + 64 px serif name
  over an ink ramp; other chapters as 250×150 slabs (locked = ink with 18 % border);
  ivory info slab (900 wide) with 40 px serif title, `CTB` outline chip, Exo 2 19 px
  description, gold `BOSS / PARTY / BEST` labels; nav chips skewed −8°.
- **Results** — paper background; ink block `clip-path: polygon(62% 0, 100% 0, 100% 100%, 48% 100%)`
  with the gold stripe; a party portrait ~900 px tall inside it and a vertical
  gold caption on the far right; `RESULTS · 1:42 · OVERKILL ×1` ink chip; **Victory**
  in serif italic 200 px, letter-spacing −0.03em, 300×6 gold underline; ledger rows
  (`AP / GIL / ITEMS`) with 2 px ink rules, 54 px Rajdhani values; per-member AP
  list with 48 px portraits; `CONFIRM ▸` ivory slab bottom-right.
- **Approved by Bailey, 2026-09-15 (round 2)** (canvas page "Ink & Gold — approved, round 2";
  renders `A-title`, `A-party-prep`, `A-dialogue`, `A-swordplay-overlay`,
  `A-ffx2-battle`; sources in `docs/handoff/ink-and-gold/`): title screen (ivory
  slab over the title painting, 156 px serif on two lines, `PRESS ENTER` ink chip),
  party prep (roster slabs with portraits, tab row with gold underline, ivory
  stats ledger, ivory party-slot slabs, gold `START BATTLE`), cutscene dialogue
  (900×190 ivory slab, 220 px portrait cut-in overlapping its top, name + role
  chip, Exo 2 24 px line, gold advance triangle), Swordplay overlay (720-wide
  ivory slab at 56,126 with the timing bar — ink track, gold zone, ivory cursor —
  timer ring and bonus chip; command stack hidden), and the FFX-2 skin (accent
  `#F7B6D9`, slabs skewed +12° with the accent border on the right, chrome
  anchored right, boss HP bar top-left, ATB bars, `CHAIN ×N` chip on the damage
  splash, dressphere monogram tiles). Other minigame overlays (Bushido, Slots,
  Fury, Mix, Trigger Happy, Lady Luck) follow the Swordplay slab pattern.

## Shared layer (built)

`src/ui/inkgold/` — `tokens.css` (the tokens above as `.ig` custom properties,
`.ig--ffx2` swaps the accent to pink), `slabs.css` (every component class,
values converted to the 640×360 logical grid with the 1440 value in a comment),
`wipe.ts` (`playWipe(root, {direction, durationMs, color, onCover})`),
`cutin.ts` (`showTurnCutIn(root, {name, portraitUrl, ctbLabel, side})` →
`{dismiss()}`), `index.ts` (`installInkGoldStyles()`), `README.md` (how a HUD
adopts it). 23 unit tests in `tests/unit/inkgold.test.ts`. Reduced-motion aware.
HUD owners add `.ig` to their overlay root and replace window chrome with the
slab classes; the layer touches no existing file.

## Motion & camera

- Turn cut-in slams in from the left in **180 ms**, overshoots to −24° skew and
  settles at −12°; command rows cascade in at **40 ms** each.
- Damage: splash pops 0 → 1.1 → 1 in 120 ms, numeral stamps in one frame later.
- Every screen change is a diagonal ivory wipe at **19°** (battle start → battle,
  battle → results, menu → chapter).
- Camera: −4° roll on every attack, 8° push-in on Overdrive, backdrop depth-of-field
  while a menu is open (the `BattleCamera` rigs already exist).
- Grain stays on through everything so paint and chrome read as one surface.

## Audio hooks (already in the bank — `docs/AUDIO-GUIDE.md`)

`battle-start` for the wipe, `turn-ready` for the cut-in, `menu-page` for wipes
between menus, `od-*` for minigames, `victory-fanfare` + `coin-tick` on results.
