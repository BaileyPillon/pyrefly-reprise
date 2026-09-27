# FF7 battle HUD "A+": option A, even more faithful (the refined target, 2026-09-27)

**Game case: FF7 only** (AGENTS.md rule 14). This is a picture, not a build: nothing under `src/`
changed, and no FFX or FFX-2 HUD, chrome, menu, token or font is touched. Everything lives in this
folder.

**Status, 2026-09-27 03:55 EDT:** rendered after the repair pass (the first A+ source was scored
7.4 by an adversarial fidelity judge before any frame existed; every point of that review is
answered below). The spec §7 pixel checks 1, 2, 3, 8, 12 and 16 pass on the frames (`checks.json`:
corners 168 / 122 / 85 / 38 sampled 14 px inside, centre 104 against a bilinear 104; bevel ramp
grey; band 71.0 % to 95.1 %, split 42.2 %, gap 3.0 u; command window 59 x 54 u, 4 u below the band;
"Cloud" ink 31 px = 3.44 % of 900 against FF7's 3.6 %; nothing crosses the phone edge). Not yet
re-judged on the frames.

## What Bailey asked for

> "ff7 screen layout ill go with a but it needs to be EVEN more faithful than a but remember it is
> specific to the ff7 encounters not ffx or ffx-2 also look at our other project (lifestream encore
> it might have done most of the menu look and feel already)"

Recorded as D-237 (see `../README.md`). **Liked:** A. **Must change:** more faithful to FF7.
**Must remain:** FF7-only scope. This is the one refinement round of the end-state rule; a pick of
it approves only what Bailey names. Built to the spec
[`docs/plans/ff7-hud-faithful-a-spec.md`](../../../plans/ff7-hud-faithful-a-spec.md), which measured
FF7's 320 x 224 battle picture on reference stills (kept outside the repo) and read the official
manual, the FF wiki and GameFAQs.

## The sheet (phone-readable, 11 parts, each under 1 MB and at most 2000 px tall)

| Part | What it shows |
|---|---|
| `sheet-1-a-vs-aplus.jpg` | A as picked, above A+ frame 1: the same moment |
| `sheet-2-what-changed.jpg` | the band of A beside the band of A+, the changes from A, and the repair list |
| `sheet-3-frames-1-2.jpg` | 1 Cloud's turn, cursor on Attack · 2 Magic open, MP cost (estimate) |
| `sheet-4-frames-3-3b.jpg` | 3 targeting, top window empty · 3b the name as SELECT help (estimate) |
| `sheet-5-frames-4-5.jpg` | 4 Tail Laser, damage on the party · 5 Limit full, "Limit" in slot 1 |
| `sheet-6-limit-and-closeups.jpg` | 5b the Limit window; close-ups: two steps of the "Limit" colours, the triangle, the damage digits |
| `sheet-7-phone.jpg` | the five moments at 390 x 844, phone A (stacked) and phone B (names on the status rows) |
| `sheet-8-type.jpg` | our own glyph set beside four OFL faces, with measured ratios |
| `sheet-9-stretch-or-pillarbox.jpg` | the stretch (every frame) and the 4:3 pillarbox |
| `sheet-10-checklist.jpg` | the spec §7 checklist, with pixel checks on the frames |
| `sheet-11-estimates-and-open.jpg` | every estimate and where it shows, the in-game check list, what is still not FF7 |

Full-size frames in `frames/` (`*-1600.jpg`; phone `*-390.jpg` at 2x). `checks.json` holds the
pixel checks, the spill report and the measured font ratios. Two files are stray duplicates from a
file-name clash on Windows (names ignore case), not phone B frames: `frames/phoneB-3-targeting-1600.jpg`
is frame 3b and `frames/phoneB-5-limit-full-1600.jpg` is frame 5b; `sheet.py` no longer writes them
(left in place: agents here delete nothing).

## What changed from A

1. **Window colour.** FF7's four-corner, blue-only gradient per window: `#0000B0` TL, `#000080`
   TR, `#000050` BL, `#000020` BR, bilinear `[verified: 3 sources, PS1]`.
2. **Frame.** A 3 u neutral-grey bevel with the measured greys (light middle, dark inner edge),
   2 u radius, nothing outside it `[measured]`.
3. **The band.** Two windows at 71.0 % to 95.1 % of the height; the left ends at 135 u and the right
   starts at 138 u (FF7's 3 u gap); FF7's black strip below. No enemy window in the band.
4. **Left window = NAME + BARRIER**, with a two-bar Barrier / MBarrier box per row (empty here).
5. **Numbers.** HP `279/ 316` in two right-aligned fields; MP current only; 1 u lines (blue to
   lavender, teal to cream, lost part dark red).
6. **LIMIT and TIME** side by side, raised grey boxes at FF7's 4:1, cylinder-shaded fills.
7. **Headers** once, on the frame line, in small heavy grey caps with a dark edge, in the body
   family (no second face).
8. **Command window.** FF7's 59 x 54 u box, right edge on the Barrier column, four fixed slots at
   12 u (Attack, Magic, blank, Item), 4 u lower than the band.
9. **Cursor.** A white gloved finger, our own drawing; the same hand points at the target.
10. **Top window.** Translucent, 89 % wide, centred, no speaker, the game's own line and spelling.
11. **Type.** PR7 Line, our own glyph set (see below), cap 8 u = 3.6 % of the height.
12. **States.** Ready triangle; yellow HP at or below 1/4; the full Limit gauge's two blink colours;
    "Limit" in slot 1 with its letter colours; the magenta-to-red Limit window.
13. **Damage digits.** Our own chunky set on equal cells, white with an even 1 u dark edge.
14. **Stretch rule.** Column starts stretch with 16:9; everything inside a column keeps FF7's
    proportions at the vertical scale (this replaces the spec's "gauge widths use h", which made the
    boxes 5:1 and spread the HP field).

## The repair pass (the judge's 16 points)

| # | Point | What was done |
|---|---|---|
| 1 | No frames | Rendered once (`node src/render.mjs`, one headless Chromium, no dev server); the §7 pixel checks 1, 2, 3, 8, 12, 16 run on the frames (sheet 10, `checks.json`). |
| 2 | The body face read as a soft modern UI face | **PR7 Line**: our own monoline glyph set (`src/glyphs.js`, A to Z, a to z, 0 to 9, punctuation), drawn on FF7's grid: cap 8 u, stroke 1.15 u (headers 2.0), square caps, rounded-square shoulders, tabular digits at 7.0 u (0.875 of the cap; the stills read 0.86 to 0.90), "Cloud" 3.74 caps (stills about 3.8). Not traced from any retail glyph or fan font; only those ratios came from the stills. Sheet 8 compares it with M PLUS Rounded 1c, Rajdhani, Exo 2 and Chakra Petch by the same ratios. |
| 3 | Phone stacking breaks the one-row read | Kept as **phone A**, declared as an adaptation. Added **phone B**: one scale (1.64 px/u), each name repeated at the left of its status row. Both on sheet 7, for Bailey. |
| 4 | "Limit" marched a rainbow | The 8 x 5 table read letter by letter off the reference animation (each letter its own order through the same eight colours); sheet 6 shows two consecutive steps. |
| 5 | Triangle outline, static | No outline; two shaded faces and a lit top edge, caught mid-spin. Spin rate: our estimate. |
| 6 | Glove cuff, seam, heavy outline | Cuff and seam gone, rounded wrist, soft grey shading, a thin `#4A4A4A` edge of about 0.5 u. |
| 7 | Name in the top window while targeting | Frame 3's top window is empty; frame 3b shows the name as the SELECT help (our estimate). |
| 8 | MP window over Cloud's gauges; unsourced Magic layout | The MP window sits right of the list, over the empty third party row; frame 2 carries an "our estimate" label; grid order, blanks and the command window's fate go to the in-game check. |
| 9 | Pixel header face beside smooth body | Headers use the body family, heavier (PR7 Line at stroke 2.0; each OFL candidate at its bold weight). Silkscreen is gone. |
| 10 | Stretched fields look sparse | Column starts stretch; the HP max field ends 32 u after the current field at FF7's scale; gauges 36 x 9 u (4:1); the command window keeps 59 u. Pillarbox still on sheet 9. |
| 11 | Proportional damage face | Our own numeral set on equal cells (a "1" takes a full cell), heavy stroke, even 1 u edge. Russo One is no longer used (its file stays in `src/fonts/`). |
| 12 | Greyed names never shown | Added to the in-game check list (sheet 11, and spec §9 #4); not shown until the check says when it happens. |
| 13 | Band gap 1 u | 3 u: left ends at 135 u, right starts at 138 u. |
| 14 | Phone command window floats above | Declared as a touch adaptation: its bottom keeps FF7's anchor (4 u below the names window) and it grows upward for 44 px slots, because the FF7 height would give 26 px slots. |
| 15 | Phone ignores the safe area | The top window sits at safe-top + 8; the phone frames show a simulated 47 px inset (dashed, labelled, not HUD). |
| 16 | Estimates not visible | Sheet 11 lists every estimate beside the frames where it shows; frames 2 and 3b carry an estimate label; all go to the in-game check list. |

## Still not FF7, and why

- **The letter shapes.** FF7's face is retail and fan traces of it are out (rule 8). PR7 Line has
  FF7's proportions but our own shapes, and no pixel steps.
- **Header caps** are our body family drawn heavier, not FF7's heavy pixel caps.
- **The finger, the triangle and the damage digits** are our own drawings (rule 8).
- **No pixel steps.** FF7 draws at 320 x 224; we draw smooth shapes at full resolution.
- **The stretch** loosens the band a little on 16:9; the pillarbox is exact (sheet 9, spec §9 #1).
- **The phone** has no FF7 original; both layouts are adaptations.
- **Unsourced values** are listed on sheet 11 with the frames that show them.
- **Placeholders**: the scene, the figures and the current HP. The art candidates in
  `docs/concepts/ff7-art-2026-09-27` are not used: Bailey has not picked them.

## Values

- Max HP and MP: the research preset, `research/ff7-guard-scorpion.md` §8.4 `[derived]`: Cloud
  316 HP / 57 MP, Barret 317 HP / 43 MP. Spells: Cloud's Ice and Bolt, 4 MP each. Limit: Braver.
- **Current HP values are placeholders** (279 and 150 before, 205 and 77 after). The Tail Laser
  damage (74, 73) sits in the derived range 72 to 77 (§9); the Limit gauges follow §9's fill figures.
- Hint line and ability names: same file §7.1 and §4.

## Rule 8 (original assets) and Lifestream Encore

No retail font, glyph, window texture, cursor sprite, screenshot, music or sound is used. The HUD
type, the damage digits, the window, frame, gauges, glove and triangle are SVG and CSS written here.
The comparison faces are OFL: M PLUS Rounded 1c (latin subset in `src/fonts/` with its OFL file)
and the repo's own Rajdhani, Exo 2 and Chakra Petch. From Lifestream Encore (`D:\FF7`, Bailey's own
project, retail check in spec §2) we took ideas, not files: the glove's shape idea, the Barrier box
and gauge markup, the outlined damage digits.

## How this was made

Static HTML (`src/mock.html` with `glyphs.js`, `glove.js`, `scene.js`, `hud.js`, `frames.js`),
rendered by one short headless Chromium run (`node src/render.mjs <scratch>`; no dev server, no game
build), then `python src/sheet.py <scratch> .` wrote the frames, `checks.json` and the sheet parts.
