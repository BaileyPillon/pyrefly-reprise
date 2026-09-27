# FF7 battle HUD "A+": option A, even more faithful (the refined target, 2026-09-27)

**Game case: FF7 only** (AGENTS.md rule 14). This is a picture, not a build: nothing under `src/`
changed, and no FFX or FFX-2 HUD, chrome, menu, token or font is touched. Everything lives in this
folder.

> **Status, 2026-09-27 01:06 EDT: source written, frames and sheets NOT rendered yet.** The
> render waits for the machine's browser gate (`D:/Tools/pyrefly-scratch/round14-capture.done`,
> held by the round 14 capture). To finish: `node src/render.mjs <scratch dir>` then
> `python src/sheet.py <scratch dir> .` from this folder, check `checks.json`, commit `frames/`,
> the `sheet-*.jpg` parts and `checks.json`, and delete this note. The file list below describes
> what those two commands write.

## What Bailey asked for

> "ff7 screen layout ill go with a but it needs to be EVEN more faithful than a but remember it is
> specific to the ff7 encounters not ffx or ffx-2 also look at our other project (lifestream encore
> it might have done most of the menu look and feel already)"

Recorded as D-237 (see `../README.md`). **Liked:** A. **Must change:** more faithful to FF7.
**Must remain:** FF7-only scope. This is the one refinement round of the end-state rule; a pick of
it approves only what Bailey names. It is built to the spec
[`docs/plans/ff7-hud-faithful-a-spec.md`](../../../plans/ff7-hud-faithful-a-spec.md) (commit
d74b53f7), which measured FF7's 320 x 224 battle picture on reference stills (kept outside the
repo) and read the official manual, the FF wiki and GameFAQs.

## The sheet (phone-readable, 8 parts, each under 1 MB and at most 2000 px tall)

| Part | What it shows |
|---|---|
| `sheet-1-a-vs-aplus.jpg` | A as picked, above A+ frame 1: the same moment |
| `sheet-2-what-changed.jpg` | the band of A beside the band of A+, and the 14 changes |
| `sheet-3-frames-1-2.jpg` | 1 Cloud's turn, cursor on Attack · 2 Magic open, MP cost |
| `sheet-4-frames-3-4.jpg` | 3 targeting Guard Scorpion · 4 Tail Laser, damage on the party |
| `sheet-5-frames-5-5b.jpg` | 5 Limit full, "Limit" in slot 1 · 5b the Limit window |
| `sheet-6-phone.jpg` | the five moments at 390 x 844 |
| `sheet-7-choices.jpg` | the two open choices: body font, and stretch or pillarbox |
| `sheet-8-checklist.jpg` | the spec §7 checklist with results, and what is still not FF7 |

Full-size frames: `frames/<n>-<moment>-1600.jpg` and `-390.jpg` (the phone frames are 2x), plus
`frames/type-rajdhani-1-1600.jpg` and `frames/pillarbox-1-1600.jpg`. `checks.json` holds the pixel
checks.

## What changed from A

1. **Window colour.** A's light 162° purple-leaning gradient became FF7's four-corner, blue-only
   gradient, per window: `#0000B0` TL, `#000080` TR, `#000050` BL, `#000020` BR, bilinear
   `[verified: 3 sources, PS1]`. (The PC release differs; we use the 1997 PlayStation values.)
2. **Frame.** A's near-white border, 10 px radius, glow, drop shadow and grain became a 3 u (12 px)
   neutral-grey bevel with the measured greys, light in the middle and dark on the inner edge,
   2 u radius, square inner corner, nothing outside it `[measured]`.
3. **The band.** Two windows edge to edge at 71.0 % to 95.1 % of the height, split at 42.5 % of
   the width, with FF7's black strip below. The enemy window is gone from the band.
4. **Left window = NAME + BARRIER**, with a two-bar Barrier / MBarrier box per row (empty: nobody
   has Barrier in this fight). The command window covers that column while it is open, as in FF7.
5. **Numbers.** HP reads `279/ 316` in two right-aligned fields of one size; MP shows the current
   value only; each has a 1 u line (blue to lavender for HP, teal to cream for MP, the lost part
   dark red).
6. **LIMIT and TIME** side by side in their own columns, raised grey boxes, cylinder-shaded fills:
   LIMIT pink, TIME mint while filling and pale yellow when full.
7. **Headers** once, in tiny grey outlined caps on the frame line: NAME, BARRIER | HP, MP, LIMIT,
   TIME. No per-row LIMIT / TIME words.
8. **Command window.** Four fixed slots at 12 u (48 px) pitch: Attack, Magic, a blank where Summon
   would be, Item; over the names window and 4 u lower than the band.
9. **Cursor.** A white gloved finger (our own drawing, from the idea of Bailey's Lifestream Encore
   glove), not a triangle; the same hand points at the target in the scene.
10. **Top window.** Translucent, 89 % wide, centred white text, no speaker name, the game's own line
    with its opening quote mark and spelling: “Attack while it's tail's up!
11. **Type.** One rounded proportional sans at FF7's cap height (8 u = 3.6 % of the frame height),
    off-white `#E7E7E7` with a 1 u `#222222` shadow; commands white; no gold names.
12. **States added.** The yellow ready triangle over the actor; yellow HP at or below 1/4 (Barret,
    frames 4 and 5); the full Limit gauge's two blink colours (mint, peach); "Limit" in slot 1 with
    its letter-by-letter colour cycle; the magenta-to-red Limit window.
13. **Damage digits.** Chunky white numerals with a black outline over each target.
14. **Phone.** FF7's two band windows keep their internal layout at one scale (2.05 px per u) and
    stack; command slots 44 px.

## Still not FF7, and why

- **The font** is the largest remaining difference. FF7's own face is retail, and fan fonts traced
  from it are out too (rule 8). M PLUS Rounded 1c 500 stands in on every frame; Rajdhani 600 is
  shown beside it on `sheet-7` (spec §9 #2, Bailey's choice).
- **The finger and the damage numerals** are our own drawings in FF7's spirit (rule 8: no retail
  sprite, glyph or texture).
- **No pixel steps.** FF7 draws at 320 x 224; we draw smooth shapes at full resolution.
- **The stretch.** At 16:9 the band is stretched sideways (5 px per u across, 4 px down). A
  pillarbox would be exact but loses a quarter of the scene; both are on `sheet-7` (spec §9 #1).
- **Unsourced, shown as our estimate** until the in-game check (spec §9 #4): the Magic list's
  layout and the "MP 4/ 57" window; the target's name in the top window during targeting; the top
  window's 50 % blend; the Limit letter hues and the blink rate; the Limit window's two middle
  corner colours; the yellow of low HP. The orange full-TIME state is not shown (its meaning is
  unknown).
- **The hint line** keeps the game's wording and spelling; keeping it, fixing it or showing both is
  still Bailey's call (spec §9 #3).
- **Placeholders.** The scene and figures are option A's original SVG drawings, labelled on every
  frame. The art candidates in `docs/concepts/ff7-art-2026-09-27` are not used: Bailey has not
  picked them and Barret has no clean candidate, so putting them here would read as a pick.

## Values

- Max HP and MP: the research preset, `research/ff7-guard-scorpion.md` §8.4 `[derived]`: Cloud
  316 HP / 57 MP, Barret 317 HP / 43 MP. Spells: Cloud's Ice and Bolt, 4 MP each (same section).
  Limit names: Braver (Cloud), same section.
- **Current HP values are placeholders** chosen to tell one story (279 and 150 before, 205 and 77
  after). The Tail Laser damage (74, 73) sits in the derived range 72 to 77 (§9), and the Limit
  gauges after it follow §9's fill figures.
- Hint line and ability names: same file §7.1 and §4.

## Rule 8 (original assets) and Lifestream Encore

No retail font, glyph, window texture, cursor sprite, screenshot, music or sound is used. The
fonts are OFL: M PLUS Rounded 1c and Russo One (latin subsets from Google Fonts, in `src/fonts/`
with their OFL files; downloaded 2026-09-27 to this folder only, not to `public/fonts/`) and the
repo's own Rajdhani, Silkscreen and Chakra Petch. The window, frame, gauges, glove and triangle are
CSS and SVG written here. From Lifestream Encore (`D:\FF7`, Bailey's own project, retail check in
spec §2) we took ideas, not files: the glove's shape idea, the Barrier box and gauge markup, the
outlined damage digits; its colours and positions were replaced by the measured FF7 ones.

## How this was made

Static HTML (`src/mock.html` with `glove.js`, `scene.js`, `hud.js`, `frames.js`) rendered by one
short headless Chromium run (`node src/render.mjs <out>`; no dev server, no game build), then
`python src/sheet.py <out> .` wrote the frames, `checks.json` and the sheet parts.
