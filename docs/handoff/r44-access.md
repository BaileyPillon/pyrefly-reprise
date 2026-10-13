# r44-access: the ACCESSIBILITY tab (OPT-B), REDUCE FLASHES and COLOUR VISION

Branch `r44-access`, from `origin/r43-rc` 7b2582e7. PR-0032 of `critic/rounds/round-25.json`. Plan: [r44-access-review](../plans/r44-access-review.md).
The target is the round's page, `critic/scratch/options-additions-2026-10-12/` (OPT-B frames and findings).

**This lane touches save data** (`Settings` in `src/app/SaveData.ts`): the save-data class, so a deep review runs on the candidate **before** the
deploy (`node tools/critic-plan.mjs` says DEEP). Nothing here is deployed, and NOW.md, the ledgers and CHANGELOG.md are not touched (records pass).

## What Bailey said, and what it built

Bailey, 2026-10-12 about 23:15 EDT, answering the driver's list: "I'll go with all of your recommendations" (decision 61d: **OPT-B** with
**NO-KEYS**; REDUCE FLASHES and the colour-vision setting in; key remapping out).

- A ninth tab, **ACCESSIBILITY**, right after OPTIONS: one COMFORT column of TEXT SIZE, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS, COLOUR VISION.
  TEXT SIZE, REDUCE MOTION and LOW EFFECTS moved there from OPTIONS (same ids, labels, values and keys); OPTIONS is 7 rows in FFX and 9 in FFX-2,
  as the mock says. A setting lives in one place (`tests/unit/pause-comfort-rows.test.ts`). The mock's KEYS column (REMAP KEYS, RESET KEYS TO
  DEFAULT and its note) is not built.
- **REDUCE FLASHES**, default OFF, softens 22 flash sources (table below). **COLOUR VISION**, default OFF, three values (OFF, RED-GREEN, BLUE-YELLOW),
  changes only the four groups that collapse under a colour-blindness simulation (table below).

## Save data

Two additive `Settings` fields, absent from every stored blob: `reduceFlashes: boolean` (false) and `colourVision: 'off' | 'red-green' | 'blue-yellow'`
('off'). `src/app/saveAccess.ts` holds the type, the stepping and `migrateAccess`, which coerces anything else to the default and is called from
`migrateComfort`. No `SAVE_VERSION` bump, no one-time rule, no veteran rule. Both are scalars, so `saveMerge.ts` merges them per key between two
open tabs. A build that does not know the fields keeps them (the settings spread keeps unknown keys). `tests/unit/access-save.test.ts`: the newest stored
export (`release-37.1.json`), the r43-rc schema (its defaults minus the two fields), every older export, garbage in both, a reload applied on
`<html>` at construction, two tabs both ways, storage blocked, reset. `SaveData.ts` grew by 6 lines.

## REDUCE FLASHES: the sources

The rule (`src/engine/flashRules.ts`, pure): a lower peak (35 % of full strength), white turns warm ivory (`#FFF1D6`, the ivory the spell rule already
used), durations unchanged, a dark flash (a dimming: the defeat dim, the knock-out fall) is left alone, a white wash of 600 ms or longer is a **cover**
(it hides a swap under it, so it stays opaque but is ivory at 35 % brightness, `#59544B`), only an action's first blow flashes. A CSS pulse becomes one
soft fade (35 % of its excursion, a longer ramp) or a steady highlight in the same colour. The engine, its events and the golden logs are untouched: the
setting is read where a flash is drawn. One case per source in `tests/unit/flash-sources.test.ts` (today's numbers pinned from the real presenter, rule or
stylesheet; the softened ones), the real stage in `flash-stage.test.ts`, the real actor in `flash-actor.test.ts`, the covers in `flash-covers.test.ts`.

| # | source | game | today | with REDUCE FLASHES | where |
|---|---|---|---|---|---|
| 1 | Summon (an aeon arrives) | FFX | white wash, 260 ms | ivory wash at 35 %, 260 ms | `PaintedStage.screenFlash` |
| 2 | Boss changes form | FFX | white wash 220 ms, with a camera shake | ivory at 35 % (the shake is REDUCE MOTION's) | same |
| 3 | Spherechange | FFX-2 | white flash on the girl (peak 1, 420 ms) and a white wash (180 ms) | both 35 %, ivory | `PaintedActor.flash`, `screenFlash` |
| 4 | Big attack about to land | both | stage 2: red wash 28 % (420 ms) and a peak-1 red flash on the boss (620 ms); stage 1: amber flash at 70 % | the wash is already under the cap; the boss flashes 35 %, same colour | `PaintedActor.flash` (`charge` beat, `TelegraphHold`) |
| 5 | Element hits that wash the screen | both | the element's colour, 220 ms | 35 %, white becomes ivory | `impactAt('screen')` into `screenFlash` |
| 6 | Spell effects (Holy, Thunder, Flare...) | both | washes and glows up to full, one per strike, Thunder strikes three times | washes and glows 35 %, white ivory, one wash per action, Thunder once | `REDUCED_FLASH_PARAMS` (the rule existed) via `battleFlashParams` |
| 7 | Every hit | both | the fighter flashes (a crit white at peak 1, 260 ms; a hit pale peach at 0.8, 200 ms) and a bloom of 0.55 opens | 35 % (a crit's white ivory), the bloom 35 %, and only the action's first blow flashes and blooms | `PaintedActor.flash`, `ImpactFlash.play(cap)`, `BattlePresenterBeats.damage` (`quiet`) |
| 8 | Heal, revive, petrify, status flashes | both | mint 0.6, pale gold 0.9, stone grey 0.85, lilac 0.5 | all 35 % | `PaintedActor.flash` |
| 9 | Target bracket while aiming at a group | FFX | flashes every 0.9 s | steady | `comfort-flashes.css` |
| 10 | Party card when a member is hurt | FFX | one 0.3 s flash, +60 % brightness | one 0.6 s fade, +21 % | same |
| 11 | Girl's card when she is hit | FFX-2 | one 0.2 s flash, +80 % | one 0.5 s fade, +28 % | same |
| 12 | Big-attack warning plate and slab | both | pulses about twice a second (`.ffx-telegraph--stage-2`, `.ffx2hud__telegraph--s2`, `.ffx2enemy__pip--s2`, `.eint__charge--s2`) | steady, `brightness(1.1)`, same colour | same |
| 13 | Overdrive timing flash | FFX | mint on a hit, red on a miss, up to 50 % for 240 ms | one soft fade capped at 35 %, 0.4 s (the miss's shake stays: REDUCE MOTION's) | same |
| 14 | Overdrive and Special splash | both | slab slams in over 180 ms with speed lines; a repeat is a 250 ms flash | every play is the 200 ms static fade REDUCE MOTION already uses | `splashMode` |
| 15 | Impact frame | both | two-frame ink-then-paper flash | one ivory frame | the rule existed (`SpectacleRules`) |
| 16 | Save Sphere wash | FFX-2 (Chapter XI) | 74 % pale lilac-white over the frame, the sphere pulses | an opaque cover in dim ivory (it hides the swap to the next link), the pulse stopped, the same 520 / 1700 / 620 ms | `SaveSphereCard`, `save-sphere-card.css` |
| 17 | Cutscene flashes | both | white or cream at 70 %, 140 ms to 1.2 s, in nine scripts | 35 % ivory; the two long whites (the Shuyin cannon's 900 ms, Sinspawn Gui's 1200 ms) are covers | `CutsceneStage.flash`; mid-battle through the stage |
| 18 | Lens flare on spell landings | both | ghost images, peak 0.8 / 0.85 | peak 0.35, no ghosts | the rule existed (`LensFlare`) |
| 19 | Spell moments | both | 4 light passes (2 on a phone), lifts 0.16 to 0.25 | 1 pass, lifts 0.06 to 0.08 | the rule existed (`SpellMoments`) |
| 20 | Arena lighting on boss phases | both | the new look eases in over about 1.5 s | the look lands at once | the rule existed (`PhaseLighting`); `BattleScreen` now passes the setting |
| 21 | FFX-2 ready gauge's shimmer (found by the round) | FFX-2 | a four-step shimmer about four times a second, never stopped by REDUCE MOTION | held steady, by REDUCE FLASHES and now by REDUCE MOTION too | `comfort-flashes.css` |
| 22 | Chain counter at chain 20 and up (found while checking) | FFX-2 | each increment draws a two-frame pink veil over the screen and a two-frame white numeral | neither | same |

The five rules that were already in the code (6, 15, 18, 19, 20) were set by nothing; the row sets them (`fxEnv.ts` reads it, `battleSpellFx` and `BattleScreen` pass it).

Left alone on purpose, as the page says: the defeat dim (55 % black) and the knock-out fall flash (dark blue-grey) are dark, not bright.
The page's open question (the covers): answered as its recommendation, "fade those through the warm ivory at a lower peak and keep the cover opaque for the swap".

## COLOUR VISION: the four groups

`src/ui/common/colourVision.ts` is the one table. `applyComfort` writes `data-colour-vision` and the `--cvd-*` variables on `<html>`; OFF removes both.
`colour-vision.css` holds the rules; the painted tint, the Spherechange wheel and flourish read the same table. RED-GREEN (protanopia and deuteranopia) moves
red-against-green pairs onto blue-against-orange; BLUE-YELLOW (tritanopia) moves blue-against-green pairs onto red-against-cyan. Hex values from the page
(Okabe-Ito where a hue moved), re-scored in `tests/unit/colour-vision.test.ts` with the round's own simulation (CIEDE2000 under Machado 2009).

| group | game | today's closest pair | RED-GREEN | BLUE-YELLOW | second cue (any mode but OFF) |
|---|---|---|---|---|---|
| Berserk and Curse tints | FFX | 2.9 (protan) | Berserk magenta `#C46BB5`, Curse umber `#5E5648`: 33.1 | Curse umber: 38.1 | a B or a C over the head (`statusMarks`) |
| Ally and self marks (bracket, plate, ALL label, the pool under the figure) | both (the page tagged it FFX; FFX-2's HUD draws the same corners, plate and pool in the same colours, seen in play) | 6.2 ally/self (tritan) | ally sky `#56B4E9`, self paper `#F4F1E8`: 27.5 | self paper: 21.6 | a diamond (enemy), a plus (ally) or a ring (self) on each bracket corner |
| Heal and MP numbers | both | 8.2 heal/MP (tritan) | unchanged (the page: "Unchanged") | MP violet `#B48CF0`: 14.4 | "+" on a heal (already printed), "MP" on an MP number |
| Garment Grid gates (Spherechange wheel, flourish, party-prep pips) | FFX-2 | 8.9 green/yellow (protan) | the Okabe-Ito four: 18.2 | green cyan `#00A6A6`, blue violet `#7A4FD0`: 28.4 | the gate's letter R, G, B or Y |

Nothing else changes colour: the other seven groups the round measured (weak and resist chips, the overdrive timing flash, the status rim, HP, the warning
stage, the ATB gauge state, the Nul orbs) shrink but stay readable or already carry a word. FFX-2's own pink flower reticle and TARGET plate carry no side colour and are
not touched; its HUD's ally and self corners, name plate and pool are, as FFX's. The ally/self row is the one place this build corrects the page's game tag (rule 14: from
what the game draws). FF7 has no COLOUR VISION row (none of the four groups is drawn there).

## Deviations from the mock

1. The mock's KEYS column is not built (NO-KEYS); the tab is one column.
2. On a phone the COMFORT block sits about 41 px lower than the frame draws it: the frame was cloned over the lifted OPTIONS layout, and a short body is not lifted
   (`phoneFit.ts`). Row spacing, key width and the all-five-rows view match. The phone frame shows a focus pip on REDUCE FLASHES that touch does not have.
3. A real defect the mock hid: the phone's OPTIONS window (five rows of height, scrolling, a fade at the foot) counts the column's heading as a row, so the new
   tab showed three and a half rows. `pause-phone.css` lets this tab's column grow to its content.
4. COLOUR VISION is not listed in the FF7 pause.

## Not done, or out of scope

- The first-launch comfort card (D-220 option C), which the page notes was never built.
- Key remapping (NO-KEYS).
- FF7's own effect layer (`battleFf7Fx.ts` keeps its own calm flash rule); the shared stage, actor and bloom softening applies there too.
- Scene `Lighting.flicker()`, FFX-2's Pointless pulse and the boss-charge heartbeat vignette (all under 3 Hz; none is on the page's list).
- A flash and strobe measurement of a twelve-hit Attack Reels at the default settings (a pre-existing question from `docs/plans/accessibility-review.md` section 5.2).
- Records: NOW.md, DECISIONS.md, ACTIONS.md, CHANGELOG.md, the critic obligations.
- The Playwright suite (`tests/e2e`) was edited for the new tab (`accessibility-a2.spec.ts`, `pause.spec.ts`) but not run.

## Proof

`tsc` clean; `node tools/orphans.mjs` lists none of the new modules. New tests: `flash-rules`, `flash-sources`, `flash-stage`, `flash-actor`, `flash-covers`,
`colour-vision`, `access-save`, `access-off-is-today` (and `helpers/cvdSim.ts`); updated: `pause-comfort-rows`, `pause-remake`, `pause-credits`,
`pause-fx-looks-rows`, `save-comfort-migration`, `save-fx-looks`, `save-fx-parts`.

Browser: `tools/access-proof.mjs` (headless Chromium on the real GPU, `PYREFLY_BROWSER=gpu`, real keys on desktop, real touch on a phone, a vite dev server):

```
PYREFLY_BROWSER=gpu node tools/access-proof.mjs --base=http://127.0.0.1:5191/ --out=docs/screenshots/r44-access
```

Under `docs/screenshots/r44-access/` (`proof.json` has every measurement; the raw frames the composites are cut from go to a `build/` folder there, which `.gitignore` leaves out of the commit and the command above makes again):

- `desk-ffx-accessibility`, `desk-ffx2-accessibility`, `phone-ffx-accessibility`, `phone-ffx2-accessibility`, and `desk-*-options` (OPTIONS after the move), each
  `-target-vs-build.jpg` (the mock left, the build right);
- `cover-ffx2-save-sphere-before-after.jpg`: the Save Sphere card of Chapter XI over the live battle, REDUCE FLASHES off (74 % pale lilac-white) then on (an opaque cover in ivory at 35 % brightness, no sphere pulse);
- `flash-ffx-before-after.jpg`: the same white wash through the real presenter, frozen at its peak, REDUCE FLASHES off (opacity 1, white) then on (opacity 0.35,
  `rgb(255, 241, 214)`); `proof.json` also has the heal flash on Tidus (0.6 then 0.35), the party card's pulse (`brightness(1.6)` over 0.3 s, then `brightness(1.21)`
  over 0.6 s) and the five existing rules reading the live setting;
- `colour-ffx-ally-before-after.jpg`, `colour-ffx-self-before-after.jpg`, `colour-ffx2-target-before-after.jpg` (the target brackets, plate and pool, off then RED-GREEN, in both games), `colour-numerals-before-after.jpg` (an MP numeral,
  off, RED-GREEN, BLUE-YELLOW), `colour-ffx2-gates-before-after.jpg` (the party-prep gate pips, off, RED-GREEN, BLUE-YELLOW);
- the settings were changed as a player changes them: Escape, the strip, the row, Enter or Left and Right on a desktop; taps on a phone (`proof.json` `touch`).
  The gate frames set COLOUR VISION through the save store (the row's own write) because the pause does not open over party prep.

## Next

The deep review of this candidate before any deploy (save-data class). A record pass for Bailey's decision (OPT-B, NO-KEYS, the 22 sources, the four groups, the
covers). Review every cover in play (the Save Sphere in Chapter XI, Sinspawn Gui's plate swap and scene seam) with the setting on.
