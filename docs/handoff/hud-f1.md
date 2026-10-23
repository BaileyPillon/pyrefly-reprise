# HUD F1 "Brushed slab" on the Clear Stage layout (lane hud-f1)

Conference demo (Monday 2026-10-26). Bailey, 2026-10-23 ~10:15, item 193: the HUD finish **F1 Brushed slab** (today's Ink & Gold, refined; decisions 191 "I want to keep today's hud but refine that more" and 192: **Less on screen, Bigger cleaner text, Painterly finish, Steps back in action**) on the "Clear Stage" layout. He plays the test build tonight.
Target (approved): `D:/Tools/pyrefly-scratch/2026-10-23/hud-inkgold/NOTES.md` and `src/hud.html` (the one source of every size, colour, position and texture; stills `stills/F1/*.jpg`).

**Game case: BOTH games, presentation only** (no number, ability, turn order or fight rule changes). Chapter I (`seymour-flux`, FFX, CTB): command block left, three-slot turn strip, Overdrive bars, Defend on Y. Chapter IV (`ffx2-bahamut`, FFX-2, ATB): no turn strip, ATB bars on the cards, a role chip, everything mirrored right with the slant flipped and the pink accent. Branch `hud-f1` from `origin/pro-look` (673d76b94).

## The switch

`?hud=f1`, or the shared `?pack=demo` (`?hud=today` wins over the pack for A/B). **Default OFF.** On only in the two demo chapters (the chapter id `BattleScreen` names through `engine/motion/DemoGate.ts`, as pro-look does). Everything off is pro-look's behaviour (tests pin it). Console: `__pyrefly.hudF1('f1' | 'today')`, `__pyrefly.hudF1On()`, `__pyrefly.hudF1Tune(key, value)` (the provisional choices below, live). The switchboard (`?switchboard=1`) has no new key: this lane did not touch it.

## What is where

| Piece | Where | Notes |
|---|---|---|
| The switch, the provisional choices (one line each) | `src/ui/hudf1/HudF1Switch.ts` (`HUD_F1_TUNE`) | pure |
| The layer: boss ribbon, hero, cue, prompt bar, Intel class, selected-verb help, the star | `src/ui/hudf1/HudF1.ts` | one instance per HUD (`FFXBattleHud.f1`, `FFX2BattleHud.f1`), ~10 hook lines in each HUD |
| The step-back (when) | `src/ui/hudf1/HudF1StepBack.ts` | reads `HudPort.setActing` and `onEvent`; one class on the HUD root, `f1-acting` |
| Layout and type, shared / Chapter I / Chapter IV | `hudf1.css`, `hudf1-ffx.css`, `hudf1-ffx2.css` | every rule under `.hud-f1`; sizes are the mockup's px at 2560 x 1440 divided by 4 (the HUD grid is 640 x 360) |
| The step-back (look) | `hudf1-act.css` | slide out 170 ms ease-in, back 220 ms ease-out; REDUCE MOTION fades |
| The brushed finish | `hudf1-finish.css`, `tex/*` (about 34 KB), `tools/gen-hudf1-textures.py` | baked masks and tiles, no live SVG filters; class `f1-finish` (`HUD_F1_TUNE.finish`) |
| Command rows: four verbs and the faded tail | `ui/common/hudTextSize.ts` `commandRowsCap` | 5 rows with the switch on |
| Tests | `tests/unit/hud-f1-{switch,layer,stepback,type}.test.ts` | |

## The six groups (Chapter I) and five (Chapter IV)

Boss ribbon (the headline enemy; a white bite drains behind a hit) · three-slot turn strip (Chapter I only: today's CTB list capped at 3, drawn as a strip, TURN ORDER and NOW labels) · command block (hero face and name, the one cue, four verbs and the faded fifth; the selected verb prints its help on its own row; the verb that holds the cue's move has the star) · party cards (fixed numeral columns: name, HP, /max, MP, the OD or ATB bar; the acting hero's card is offset and carries the accent stripe) · prompt bar (the game's own key/pad chips: `A Select, X Intel, Y Defend, Pause`; Chapter IV has no Y) .
Today's enemy details, guide, advisor card, Sensor card and enemy-intent chip are behind **X (Intel)**: Intel is "the strategy guide is shown" (its own toggle: G, or the pad's X), read from its root class; the guide's chips drop 27 px so they do not sit on the ribbon. The PAUSE chip, the Defend chip, the command help slab, the FFX-2 help band and the Active/Wait chip are not drawn (P, Start, Q and Y still work).

## PROVISIONAL CHOICES (built as the mockup draws them; each is one line in `HUD_F1_TUNE`)

1. The boss ribbon stays during an action (`ribbonStaysInAction: true`; false slides it up and out).
2. The step-back starts at the action's start (`stepBackAt`), after the target is confirmed.
3. The cue and prompt floor is 28 px at 1440p (`floorPx: 28`; the alternative the notes name for a 27-inch booth monitor is 32). Everything else in the HUD is at or above it.
4. The slim party cards drop the Overdrive/ATB bar and the /max numbers (`hudf1-act.css`, three lines).
5. Heal and party-damage number colours are as pro-look built them (this lane does not touch the numbers).

## Not done / open

(see the end of this note: filled at each push)
