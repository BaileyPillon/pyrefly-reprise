# HUD F1 "Brushed slab" on the Clear Stage layout (lane hud-f1)

Conference demo (Monday 2026-10-26). Bailey, 2026-10-23 ~10:15, item 193: the HUD finish **F1 Brushed slab** (today's Ink & Gold, refined; decisions 191 "I want to keep today's hud but refine that more" and 192: **Less on screen, Bigger cleaner text, Painterly finish, Steps back in action**) on the "Clear Stage" layout. He plays the test build tonight.
Target (approved): `D:/Tools/pyrefly-scratch/2026-10-23/hud-inkgold/NOTES.md` and `src/hud.html` (the one source of every size, colour, position and texture; stills `stills/F1/*.jpg`).

**Game case: BOTH games, presentation only** (no number, ability, turn order or fight rule changes). Chapter I (`seymour-flux`, FFX, CTB): command block left, three-slot turn strip, Overdrive bars, Defend on Y. Chapter IV (`ffx2-bahamut`, FFX-2, ATB): no turn strip, ATB bars on the cards, a role chip, everything mirrored right with the slant flipped and the pink accent. Branch `hud-f1` from `origin/pro-look` (673d76b94): it keeps pro-look's markers (the FFX glove, the FFX-2 ring, the field flag, the TARGET plates standing aside, the heal numeral, the glass damage numbers) and matches them.

## The switch

`?hud=f1`, or the shared `?pack=demo` (`?hud=today` wins over the pack for A/B). **Default OFF.** On only in the two demo chapters (the chapter id `BattleScreen` names through `engine/motion/DemoGate.ts`, as pro-look does). Everything off is pro-look's behaviour (tests pin it; the browser check is below). Console: `__pyrefly.hudF1('f1' | 'today')`, `__pyrefly.hudF1On()`, `__pyrefly.hudF1Tune(key, value)` (the provisional choices below, live; apply with `hudF1('today')` then `hudF1('f1')`), `__pyrefly.hudF1Cost(true | false)` (the layer's own per-frame main-thread cost). The switchboard has no new key: this lane did not touch it.

## What is where

| Piece | Where | Notes |
|---|---|---|
| The switch, the provisional choices (one line each) | `src/ui/hudf1/HudF1Switch.ts` (`HUD_F1_TUNE`) | pure |
| The layer: boss ribbon, hero, cue, prompt bar, Intel class, selected-verb help, the star | `src/ui/hudf1/HudF1.ts` | one instance per HUD (`FFXBattleHud.f1`, `FFX2BattleHud.f1`), about 10 hook lines in each HUD |
| The step-back (when) | `src/ui/hudf1/HudF1StepBack.ts` | reads `HudPort.setActing` and `onEvent`; one class on the HUD root, `f1-acting`; a ghost copy of the block carries the slide out |
| Layout and type, shared / Chapter I / Chapter IV | `hudf1.css`, `hudf1-ffx.css`, `hudf1-ffx2.css` | every rule under `.hud-f1`; sizes are the mockup's px at 2560 x 1440 divided by 4 (the HUD grid is 640 x 360) |
| The step-back (look) | `hudf1-act.css` | slide out 170 ms ease-in, back 220 ms ease-out; REDUCE MOTION fades |
| The brushed finish | `hudf1-finish.css`, `tex/*` (about 38 KB), `tools/gen-hudf1-textures.py` | baked masks and tiles, no live SVG filters; class `f1-finish` (`HUD_F1_TUNE.finish`, default on) |
| Command rows: four verbs and the faded tail | `ui/common/hudTextSize.ts` `commandRowsCap` | 5 rows with the switch on |
| Debug | `src/debug/hudF1Api.ts` | |
| Tests | `tests/unit/hud-f1-{switch,layer,stepback,type,act-css}.test.ts` (41 tests) | the switch and its gate, the layer (ribbon, hero, cue, Intel, prompts, re-enable), the step-back's timing (action start, 220 ms after the end, the damage number, FFX-2's menu rule, victory), the 28 px floor and two typefaces, the CSS's numbers and REDUCE MOTION |

## The six groups (Chapter I) and five (Chapter IV)

Boss ribbon (the headline enemy; a white bite drains behind a hit) · three-slot turn strip (Chapter I only: today's CTB list capped at 3, drawn as a strip, TURN ORDER and NOW labels) · command block (hero face and name, the one cue, four verbs and the faded fifth; the selected verb prints its help on its own row; the verb that holds the cue's move has the star) · party cards (fixed numeral columns: name, HP, /max, MP, the OD or ATB bar; the acting hero's card is offset and carries the accent stripe; the status icons keep their room) · prompt bar (the game's own key/pad chips: `A Select, X Intel, Y Defend, Pause`; Chapter IV has no Y).
Today's enemy details, guide, advisor card, Sensor card and enemy-intent chip are behind **X (Intel)**: Intel is "the strategy guide is shown" (its own toggle: G, or the pad's X), read from its root class; the guide's chips drop 22 px so they do not sit on the ribbon. The PAUSE chip, the Defend chip, the command help slab, the FFX-2 help band and the Active/Wait chip are not drawn (P, Start, Q and Y still work). The action banner (an enemy's move, top left) steps under the ribbon. The damage numbers, the target flag and glove and the TARGET plates are pro-look's, unchanged (they use Exo 2: a third face on screen that this HUD does not own).

## The step-back (decision 192)

At the action's start (after the target is confirmed: `HudPort.setActing` `action-start`, and the event stream) `f1-acting` goes on the HUD root: the command block (a ghost copy of hero, cue and verbs: FFX closes its stack a frame after the signal) slides out along its own edge (FFX left, FFX-2 right), the prompt bar slides down, the party cards go slim (face, name, HP, MP; the OD/ATB bar and the /max numbers are hidden). The boss ribbon and the turn strip stay (today's FFX acting fade would take the strip to 16 percent; this HUD keeps it). It returns 220 ms after the action's end and not before the damage number has gone (cap 1.5 s), by the same transitions; the next menu waits out of the way and slides in. **FFX-2 Active ATB (D-357, D-441): nothing steps back while a command menu is open, and an open menu ends a step-back at once.** A victory or a defeat takes everything back at once. REDUCE MOTION (the game's row or the OS preference): the same states, faded and not slid.
Measured in a real fight, Chapter I (pad, headless Chromium on the real GPU): action start at 2.131 s, the ghost sliding out in the same frame, the HUD back 276 ms after the last damage number left (timeline in `evidence/ch1-flat-results.json`).

## PROVISIONAL CHOICES (built as the mockup draws them; each is one line in `HUD_F1_TUNE`)

1. The boss ribbon stays during an action (`ribbonStaysInAction: true`; false slides it up and out).
2. The step-back starts at the action's start (`stepBackAt`), after the target is confirmed.
3. The cue and prompt floor is 28 px at 1440p (`floorPx: 28`; the alternative the notes name for a 27-inch booth monitor is 32). Everything else in the HUD is at or above it.
4. The slim party cards drop the Overdrive/ATB bar and the /max numbers (`hudf1-act.css`, a few lines).
5. Heal and party-damage number colours are as pro-look built them (this lane does not touch the numbers).
6. The finish is on (`finish: true`; false leaves the flat Clear Stage slabs) and its edges are the dry-brush ones (`edgeCalm: false`; true swaps in calmer masks if the ivory rows read as torn masking tape).

## Evidence and cost (scratch: `D:/Tools/pyrefly-scratch/2026-10-23/hud-f1/evidence/`)

- `compare-ch1-*`, `compare-ch4-*`: mockup | built, the same moment, at 2560 x 1440, 1920 x 1080 and 1280 x 720, flat and finished; `ch1-*-first-confirm.jpg` is the mid-slide frame against the mockup's action still.
- Numeral columns at 9999 HP and 999 MP on every card, both chapters: no collision, nothing past the card (`*-flat-results.json` `columns`).
- Frame time at 2560 x 1440 (uncapped rAF, the real GPU, a menu open and idle, 7 s windows, shared machine so noise is about 10 percent): HUD on versus off, mean / p95 / p99 ms. Chapter I flat 5.4 / 9.2 / 11.7 against 5.4 / 8.9 / 10.4; Chapter I finished 6.0 / 12.3 / 24.2 and 5.9 / 11.6 / 14.6 against 6.4 / 12.1 / 15.4; Chapter IV flat 6.2 / 11.4 / 15.9 and 7.1 / 12.7 / 16.3 against 6.7 / 12.1 / 16.2; Chapter IV finished 6.7 / 13.9 / 21.2 and 6.6 / 14.3 / 24.5 against 7.2 / 19.1 / 30.5. The count of frames over 8.4 ms is the same on and off within the window-to-window spread (about 160 to 320 of 1000 to 1300 either way: the machine was shared with other lanes). The layer's own main-thread cost is under the timer's 0.1 ms grain (mean 8 to 10 microseconds). **No new frame over 8.3 ms is caused by the HUD that these runs can show.**
- Real input: the simulated pad (A, B, X, d-pad) in both chapters, and the keyboard (G, arrows, Enter, Esc) in the finished pass; 0 console errors in every run.

## Not done / open

What a reviewer should look at first, then what is not done:

1. **The prompts.** The cue and the prompt bar are at the mockup's 30 px (28 px floor); on a 27-inch booth monitor the notes expect 32 to be safer (`HUD_F1_TUNE.floorPx: 32`, then `__pyrefly.hudF1('today'); __pyrefly.hudF1('f1')`). The 28 px items (TURN ORDER, NOW, OD, ATB, the role chip, /max) cannot grow without the cards growing.
2. **The calm edges.** The mockup's own risk: the ends of the ivory rows can read as torn masking tape. `HUD_F1_TUNE.edgeCalm: true` swaps in calmer masks (7 extra files, 4 KB); judge on `evidence/ch1-finish-cmd-2560.jpg` and its 1:1 crops.
3. **Chapter I's ribbon shows the boss's real HP bar from the first menu**, as the mockup draws it (a 1 percent bite after the 732 hit). today's FFX HUD shows an enemy's HP only through the Sensor card (FFX-2 already shows its bar). The mockup is the approved target, so this is built, but it is a game-aware point for the driver (hard rule 14): `HUD_F1_TUNE` has no switch for it; the place is the ribbon in `HudF1.sync`.
4. **Not as the mockup draws it:** the FFX-2 role chip (WM / DK / WR) stays at the corner of the face tile (today's), not at the card's right end; the damage numbers are pro-look's glass numbers (Exo 2), not the mockup's gold Cormorant numeral with the brushed underline (provisional choice 5); the Chapter I turn strip's NOW tag and TURN ORDER label are drawn by CSS pseudo-elements.
5. **Verified with real input, headless Chromium on the real GPU (not a booth PC):** Chapter I and Chapter IV at 2560 x 1440 (all of it), 1920 x 1080 and 1280 x 720 (the first menu), the pad and the keyboard, an attack and a spell, a victory in both chapters (the party plates and, in Chapter I, the strip are up at the last blow), the switch off (`?hud=today`: no class, six rows, Rajdhani numerals, the guide chip, the PAUSE chip, the same frame as pro-look's). Not verified: a real pad's rumble and hold timing, a 120 Hz display, the booth monitor's size, Chapter IV's step-back with a menu closed for more than about a second (Active ATB almost always has a girl's menu up: by the rule nothing steps back then).
6. **Tests:** the five hud-f1 files (41 tests) and 374 UI-family files pass; a handful of heavy suites (`advisor`, `advisor-floor`, `ffxcam-load`, `ui-pause-stack`, `ui-ffx2-atbmode`) time out at their default 15 s when the machine is loaded and pass alone with a longer timeout; the full `npm test` was not run. `tsc --noEmit` is clean for `src/` (the `pause-living-portrait` test files need `docs/concepts` that this sparse tree does not carry: red before this lane).
7. **Merge notes:** the hooks are about ten lines in `FFXBattleHud.ts` and `FFX2BattleHud.ts` (`f1` field, mount, unmount, sync, syncVitals, update, setActing, onEvent, chooseCommand), one line in `ui/common/hudTextSize.ts` (`commandRowsCap`), two in `main.ts`; everything else is new files. The HUD sits above the FFX frame's vignette under the switch (`.ffxhud.hud-f1 > .ffxhud__stage { z-index: 1 }` and `isolation: isolate` on the root).
8. **Textures** are procedural (`tools/gen-hudf1-textures.py`, numpy and Pillow, deterministic seeds; the edge masks are PNG because a lossless WebP with alpha drew with its top and bottom rows missing in Chromium; the two paint tiles are lossy WebP without alpha). About 38 KB in all.
