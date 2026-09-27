# Hotfix 24: the aeon you pick comes out, and the party leaves the field (2026-09-27)

Branch `hotfix-24` (worktree `D:/pyrefly-hotfix24`, sparse: no `docs/screenshots` except this
track's frames). **Not deployed**: the driver deploys (release 24). **Game case: FFX only**: Grand
Summon, Mix, Ronso Rage and the summon staging exist only in the FFX chapters; FFX-2 has no aeons,
and its engine keeps the bare minigame re-submit it always had.

Bailey, 2026-09-27 ~11:00 EDT: "i tried my overdrive and i think valefor came out i had yuna
selected ... my whole party was still there" (Chapter IX). Investigation:
[docs/plans/valefor-overdrive-bug-2026-09-27.md](../plans/valefor-overdrive-bug-2026-09-27.md).
Bailey, ~12:10 EDT, on the driver's "fix 1 and 2 and ship them as release 24": "I'll go with all of
your recommendations." The Valefor painting (colour, size, S2) is **not** in this release; it needs
Bailey's pick.

## What changed

| # | Fix | Where |
|---|---|---|
| S1 | The engine sends Grand Summon's picker `{ id, name, storedGauge }` per aeon (it sent bare ids; the overlay read `.name`, threw on its first render, and the engine's default roll put Valefor out every time). | `src/battle/ffx/pickerParams.ts`, `overdrive.ts` `minigameParams` |
| S1 | The overlay skips an entry with no id and names a bare id by itself, instead of throwing. | `src/ui/ffx/minigames/YunaGrandSummon.ts` |
| S1 | A thrown overlay is a `console.error`, and it (or the player's Escape) hands the turn back to the actor's menu with the gauge kept: `askMinigame` returns result / cancelled / failed, and the presenter calls `FFXEngine.backOutOfMinigame()`, which clears the suspended request so the next pick asks again. Engines without the method keep the bare re-submit. The engine's own default roll for a headless or AI Grand Summon is unchanged (`defaultGrandSummonAeon`, `''` when no aeon can take the field). | `BattlePresenterUtil.ts`, `BattlePresenter.ts` `resolveMinigame`, `battle/ffx/engine.ts` |
| sibling | **Rikku's Mix had the same class of bug, proved by running** Chapter VII seed 1: the engine sent `inventory`, the overlay read `ingredients` and `recipes`, and the list opened empty. The engine now also sends `ingredients` (named), `recipes` and `recipeNames`; the overlay reads either shape and skips a bad entry. Kimahri's Rage overlay already normalised its entries. | `pickerParams.ts`, `RikkuMix.ts` |
| found live | The list pickers show four rows and scroll, but nothing followed the cursor: Bahamut, Grand Summon's 5th row, was chosen out of sight. `keepRowInView` follows the cursor (Grand Summon, Mix, Rage). | `minigames/params.ts` |
| S3 | Cherry-picked `ddc1649d` (PR-0181) from `iter2-b5` as `3ab05ec5`: the party fades off the field with the aeon's 620 ms arrival and comes back on Dismiss, KO or Banish; the status rows show the aeon's row alone while it is out. One conflict, imports only in `FFXBattleHud.ts` (main lacks B5's `actionBanner` / `actingFade` / `groupLabelFit` imports; kept main's and added `statusRowIds`). It needed nothing else from `iter2-b5`. | `SummonStaging.ts`, `fieldRows.ts`, the presenter beats and stage, `FFXBattleHud.ts` |

No contract file changed (`types.ts`, `FFXBattleEngine`, `HudPort` untouched); the protocol note is
in `docs/CONTRACTS.md` and `docs/CONTRACT-CHANGES.md`. Files over 400 lines did not grow
(`BattlePresenter.ts` 688, `overdrive.ts` 472, `engine.ts` 473 to 465).

## Checks

- Unit, test first (`ffx-overdrive-pickers.test.ts` was written before the fix and failed 9 of 11,
  on the id-only aeons, the overlay's `replace` TypeError, the empty Mix list and the missing
  back-out; it passes now): `tests/unit/ffx-overdrive-pickers.test.ts` (real IX and VII engines, the real overlays in jsdom:
  the 3rd row is Ixion and Ixion is summoned; a malformed list never throws; back-out then the same
  Overdrive asks again; Mix lists named items and a listed pair makes a real mix; the FFX-2 absence
  case) and `tests/unit/ffx-overdrive-picker-presenter.test.ts` (the real presenter: a thrown and a
  cancelled picker go straight back to Yuna's menu, no summon; an answer summons Ixion).
- `npx tsc --noEmit` clean; `tsc -p tsconfig.e2e.json` clean; full vitest (`--testTimeout=60000`):
  551 files, 9218 tests pass (ffx2-atb-golden and the FFX engine suites included);
  `node tools/orphans.mjs`: 29 orphaned, the same as main.
- **Real keys on a production build**: `tests/e2e/grand-summon-picker.spec.ts` (own build
  `.dist-hotfix24-tmp`, own preview on 7100-7109, stopped by PID). Chapter IX seed 1: Yuna's gauge
  filled by the debug API as setup only; Lulu and Kimahri Attack; Yuna: Overdrive, Grand Summon,
  **Escape** (back to her menu, no aeon, gauge 100), Grand Summon again, ArrowDown x2, Enter:
  **Ixion** is summoned, the party's alpha is 0, the aeon's 1, the one status row is Ixion's;
  Ixion's menu, Dismiss: the party back at alpha 1 and three rows. Chapter X seed 1: the same, with
  the cursor first visiting the 5th row (Bahamut in sight), then back to the 3rd, Ixion. No
  overlay error on the console. Both pass (about 25 s each). Run it with a config that has no
  shared `webServer` (the repo's config starts one on `dist/`), `PYREFLY_BROWSER=gpu`, and
  `HOTFIX24_SHOTS=1` to write the frames here.
- Frames, `docs/screenshots/hotfix-24/`: `ch09-1-yuna-menu`, `ch09-1b-backed-out-menu`,
  `ch09-2-picker-third-row`, `ch09-3-summon-moment`, `ch09-4-aeon-alone-menu`, `ch09-5-party-back`,
  and the `ch10-*` set with `ch10-2a-fifth-row-in-view`.

Target and build: there is no picture target for this; the "target" is canon
(`research/ffx-combat-core.md` §5.4: the player chooses the aeon; §6.1 `[verified: 2 sources]`: the
aeon replaces the whole party, dismissal or its KO returns it). Before: Valefor always, the party
standing in front of her (`docs/screenshots/valefor-bug/ch09-5-next-player-turn.jpg`). After:
`docs/screenshots/hotfix-24/ch09-4-aeon-alone-menu.jpg`.

## Not in this release, open

- **The aeon's scale** (Valefor at party height in IX and X; plan B.2) and **the Valefor painting's
  colour** (S2, plan C): both change how the aeon looks and need Bailey's pick first.
- The KO exit is covered by `ddc1649d`'s unit test and code path (every aeon exit emits `dismiss`),
  not by this e2e, which uses the Dismiss command.
- B5 (`iter2-b5`) still carries `ddc1649d`; when B5 merges, git will see the same change twice. The
  cherry-pick was made with `-x`, so the source commit is named in `3ab05ec5`.

## CHECK (independent, 2026-09-27; not the builder)

Game case: FFX only (the FFX-2 and FF7 runs below are regression checks). Branch `hotfix-24` at
`3a027134`, pulled; own production build `.dist-check24-tmp`, own preview on 7110 (stopped by PID),
headless Chromium (`PYREFLY_BROWSER=gpu`), 1600x900. Setup through the debug API only (seed,
chapter, cutscenes skipped, Yuna's or Rikku's gauge to 100 at the first menu; in the KO runs the
aeon's HP to 1 after its second action); every command after that is a real key.
Scripts: `.check24-tmp/*.spec.ts` (agent scratch, not committed).

- `npx tsc --noEmit` and `tsc -p tsconfig.e2e.json`: clean. Full vitest `--testTimeout=60000`:
  551 files, 9218 tests pass (5 files, 37 tests skipped, as on main). `node tools/orphans.mjs`: 29
  orphaned, the same as main. `git merge-tree --write-tree origin/main hotfix-24` (origin/main
  `3c3dfa06`): clean.
- **Grand Summon, every row, three chapters (15 runs, all pass).** IX seed 1, X seed 1 and I
  seed 2, rows 1 to 5 (Valefor, Ifrit, Ixion, Shiva, Bahamut). In every run the picker listed all
  five by name, the selected row was inside the list (rows 5 included), and the aeon on that row
  came out (`summon` event and `state.aeonId`). The party went to alpha 0, the aeon to 1, and the
  only status row was the aeon's. The aeon's menu was Attack / Overdrive ▸ READY / Aeon ▸ ×3 /
  Dismiss. Attack dealt damage in all 15 runs, and Aeon abilities fired (Meteor Strike,
  Aerospark, Impulse). No enemy damage, KO or status reached a party member while an aeon was
  out, and the enemies hit only the aeon. The exits: IX, the aeon's **KO** by Yojimbo in all five
  runs; X and I, Seymour's **Banish** in all ten. Every time the party came back at alpha 1 with
  three rows. No page error, and no overlay error on the console.
- **Dismiss by real keys** at the aeon's first menu: IX Bahamut, X Valefor, I Ixion. The
  `dismiss` reason is `command`, the party comes back at alpha 1, and the three rows return.
  In I, Kimahri was KO'd before the summon and he comes back lying down with a greyed row, as on
  main.
- **Party held off during targeting**: in X with Bahamut out, while the Attack target is being
  picked (including moving the target cursor), the party stays at alpha 0 in all 13 samples.
- **Back out**: Escape in the Grand Summon picker (X) and in Mix (VII) returns to the actor's
  menu. The screen stays `battle`, and the pause menu does not open.
- **Rikku's Mix** (VII seed 1): the list shows 15 named items with counts, and Grenade (row 12)
  scrolls into view. Potion + Potion shows "Ultra Potion" in the preview, and Rikku uses Ultra
  Potion. Grenade + Grenade shows "? ? ?", the engine says "Mix failed!", the turn goes back to
  Rikku's menu and the gauge is kept (the engine's refusal rule, `execute.ts:265-273`).
- **First command menu, every FFX chapter, candidate against the live build.** Live is release
  23. origin/main has no `src` change since that release, so live stands in for main's build. The
  nine chapters are I, II, III, VII, VIII, IX, X, XII and XIV, all on seed 1. The acting member,
  the command rows and the status rows are identical in all nine.
- **FFX-2**: Chapter IV (ffx2-bahamut) with real keys for 60 s: 25 party actions and 36 damage
  events, no page error. **FF7**: LIMIT typed on chapter select opens the hidden fight, which is
  played to **victory** with real keys (`ff7-play.ts` `playToEnd`), no page error.

Findings (none blocking):
- Minor, house style: the cherry-pick `3ab05ec5` grew three files that were already over 400
  lines. `BattlePresenterEvents.ts` goes 434 to 435, `BattlePresenterStage.ts` 839 to 843 and
  `FFXBattleHud.ts` 1577 to 1578. The builder's line "files over 400 lines did not grow" holds
  only for its own commit.
- Minor, UI: the Grand Summon subtitle "GRAND SUMMON · AEON ARRIVES WITH A FULL OVERDRIVE" runs
  past the panel's slanted right edge at 1600x900. The overlay existed before, but players never
  saw it until now.
- Minor, UX, not a regression: Mix lists every item in the bag, but the recipe table knows only
  some pairs. A pair outside the table shows "? ? ?" and ends in "Mix failed!" (the gauge is
  kept). Before this fix the list was empty.
- Harness note: my 60 s real-key probe of Chapter VI (ffx2-leblanc) saw no party action. The live
  build does the same (it is a pre-fight story beat that the probe does not handle), so this is
  not a regression.
- Not changed, as planned: the aeons still stand at party height in IX and X (Bahamut in X is
  small next to Seymour), and the Valefor painting is unchanged.

Verdict: SHIP for the changed area. No critical or major issue, and no regression against live.
