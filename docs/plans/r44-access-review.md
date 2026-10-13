# Paper preflight: the ACCESSIBILITY tab (OPT-B), REDUCE FLASHES and COLOUR VISION

Paper preflight under AGENTS.md rule 15 and `critic/RUBRIC.md` §4, written 2026-10-13 by the agent that built it (branch `r44-access`,
from `origin/r43-rc` 7b2582e7), at the start of the build and kept to what the build then did. Track: `r44-access` (PR-0032 of
`critic/rounds/round-25.json`; follows `docs/plans/accessibility-review.md`, which planned the earlier, bigger version of this).

`node tools/critic-plan.mjs --paths src/app/SaveData.ts,src/app/screens/pause/tabs.ts,src/engine/BattlePresenterStage.ts` says **DEEP, before
deploy** ("save data and settings is a shared system"; the settings schema is the save schema, `SaveData.settings`). Obligations: live + focused
+ deep. This lane touches save data.

## What Bailey approved, and only that

Bailey, 2026-10-12 about 23:15 EDT, answering the driver's list ("OPT-B with NO-KEYS: the accessibility tab"): "I'll go with all of your
recommendations". Decision 61d: **OPT-B** of `critic/scratch/options-additions-2026-10-12/` (a new ACCESSIBILITY tab), with REDUCE FLASHES and
the colour-vision setting; key remapping is **not** built (NO-KEYS), so the mock's KEYS column (REMAP KEYS, RESET KEYS TO DEFAULT and its note) is
not built. His pick approves the layout on the mock's frames; the page's recommendations (35 % peak, warm ivory, "fade the covers through ivory at a
lower peak and keep them opaque for the swap", the four colour groups and their marks) are what "all of your recommendations" took.

## Game case (rule 14), per part

| part | game |
|---|---|
| the ACCESSIBILITY tab, REDUCE FLASHES row, the save fields | both (COLOUR VISION row is left out of the hidden FF7 pause: none of its four groups is drawn there) |
| flash sources 1, 2, 9, 10, 13 | FFX only (summon, boss form change, group bracket, party card, Overdrive timing flash) |
| flash sources 3, 11, 16, 21, 22 | FFX-2 only (Spherechange, girl's card, Save Sphere of Chapter XI, ready gauge, chain veil) |
| flash sources 4 to 8, 12, 14, 15, 17 to 20 | both (shared presenter, stage, HUD pulse, cut-ins, cutscene, eye-candy rules) |
| colour group `tints` (Berserk, Curse) | FFX only (FFX-2 has no Berserk look, and its Curse is a grey darkening) |
| colour group `target` (ally, self) | both: the round's page tagged it FFX, but FFX-2's HUD draws the same `.ffx-target--*` corners, name plate and pool in the same colours (seen in play), so the change is true to both |
| colour group `numerals` (heal, MP) | both (one `DamageNumbers` serves both HUDs) |
| colour group `gates` (Garment Grid) | FFX-2 only |

## The save change

Two **additive** fields in `Settings` (`src/app/SaveData.ts`; helpers in the new `src/app/saveAccess.ts`): `reduceFlashes: boolean` (default false)
and `colourVision: 'off' | 'red-green' | 'blue-yellow'` (default 'off'). Both are absent from every stored blob; the `...raw.settings` spread
leaves the default in place, `migrateComfort` calls `migrateAccess` to coerce garbage to the default (CHK-024). No `SAVE_VERSION` bump, no one-time
rule, no veteran rule. Both are scalars, so `saveMerge.ts` merges them per key between two open tabs. A build that does not know the fields
keeps them through a load and a save (the spread keeps unknown keys). `SaveData.ts` grew by 6 lines. Proven in `tests/unit/access-save.test.ts`.

## Design, in the order it was built

1. **Settings and tab.** `tabs.ts` gains `accessibility` after `options`; `PauseScreenPanels.accessRows` lists TEXT SIZE, REDUCE MOTION, REDUCE
   FLASHES, LOW EFFECTS, COLOUR VISION; `optionRows` loses the three that moved (a setting lives in one place); `adjustSetting` handles the two new ids.
   The column takes the settings column's id so the shipped stylesheet gives it the mock's key width, cursor-dot room and phone scroller.
2. **REDUCE FLASHES, one setting, 20 sources + 2 found while checking.** The rule is `src/engine/flashRules.ts` (pure): 35 % peak, white turns warm
   ivory, durations unchanged, a dark flash is left alone, a white wash of 600 ms or longer is a cover (opaque but dim ivory, so the swap stays hidden),
   only an action's first blow flashes. Applied at the three places a flash is drawn, never in the engine: `PaintedStage.screenFlash` and the bloom,
   `PaintedActor.flash`, `CutsceneStage.flash`; and as `html[data-reduce-flashes]` rules (`comfort-flashes.css`) for the HUD pulses. The five rules
   that were already written (spell effects, impact frame, lens flare, spell moments, arena lighting) are set by the same row: `fxEnv.ts` already read
   it, `battleSpellFx` and `BattleScreen` now pass it.
3. **COLOUR VISION, the four groups only.** One table (`src/ui/common/colourVision.ts`) feeds the CSS variables `applyComfort` writes, the painted
   figure's tint, and the Spherechange wheel's inline colours; `colour-vision.css` holds the rules and the second cues (a diamond, a plus, a ring on
   the bracket corners; B and C over the head; "MP" on an MP numeral; the gate's letter). OFF removes the attribute and every variable.
4. **Tests**: one case per flash source (today's numbers pinned from the real presenter, rule or stylesheet; the softened numbers), one block per
   colour group scored with the round's own simulation (CIEDE2000, Machado 2009), the settings round trip, the migration from the current schema, and
   a file pinning that nothing changes with both settings off.

## Risks, and what answers each

- **A flash source missed.** The list is the page's 20 plus the FFX-2 ready gauge and the FFX-2 chain veil; the proof counts them
  (`tests/unit/flash-sources.test.ts`). Out of scope, and said so: the hidden FF7 chapter's own effects, scene light flicker (`Lighting.flicker`),
  FFX-2's Pointless pulse and the boss-charge heartbeat vignette (all under 3 Hz; none is on the page's list).
- **A cover that stops hiding its swap.** A white wash of 600 ms or longer stays opaque (dim ivory at 35 % brightness over black). The two it
  matters for (Save Sphere, Sinspawn Gui's plate swap and scene seam) keep their timing exactly.
- **Off must be today.** `tests/unit/access-off-is-today.test.ts`, and every feature's own file, pin the off values; every selector of the two new
  stylesheets is under a `html[data-...]` attribute that exists only while the setting is on.
- **Layering.** `src/battle/**` and `engine/BattlePresenter*.ts` import no DOM and no `three`: the presenter reads the setting through the optional
  `MomentsPort.reduceFlashes?()` (additive), exactly as it reads REDUCE MOTION; the engine events and the golden logs do not move.

## Acceptance checks for the deep review

- AC-1 (save, CHK-024): `access-save.test.ts` passes from the stored exports; no progress field changes; no throw on garbage.
- AC-2 (applied at boot): a saved REDUCE FLASHES or COLOUR VISION is on `<html>` at construction, before the pause is opened.
- AC-3 (tab): the ACCESSIBILITY tab at 1600x900 and 390x844 in both games matches the mock's frames bar the KEYS column (`docs/screenshots/r44-access/`).
- AC-4 (flashes): every source is softened or listed as out of scope; with the row off the numbers are today's.
- AC-5 (colour): each group's second cue is present in each mode; nothing outside the four groups changed colour.
- AC-6 (house): `tsc` clean, the touched tests and the full suite pass, `node tools/orphans.mjs` lists none of the new modules.
