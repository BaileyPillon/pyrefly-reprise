# FF7 game-branch audit (`GameId` += `'ff7'`)

Written 2026-09-27 with the FF7 plumbing (branch `ff7-plumbing`; plan
`docs/plans/ff7-guard-scorpion-architecture.md` §3.3). **Game case: shared plumbing
(both + FF7).** FFX and FFX-2 answers are unchanged at every site (their goldens and
suites pass byte for byte); only the FF7 answer is new.

## Why

`GameId` became `'ffx' | 'ffx2' | 'ff7'`. Additive by the letter, but a two-way
`game === 'ffx' ? A : B` hands FF7 to FFX-2's `B` without a word. The rule for every
site: **an explicit `'ff7'` answer, or a guard that throws `Ff7NotHandledError`
naming the site** (`src/battle/common/game.ts`: `ffxFamily()`, `isFfxFamily()`), never
a silent fall into the FFX-2 branch. Where FF7 would fall into the *other* branch of an
`=== 'ffx2'` test, it gets the base Ink & Gold style (never FFX-2's), which is marked N
and is unreachable today anyway, because the battle screen throws first (below).

## How it was found

1. `grep -rnE "game\s*===|game\s*!==|=== 'ffx'|!== 'ffx'|=== 'ffx2'|!== 'ffx2'|switch \((\w+\.)*game\)"`
   over `src/`, `learn/` and the test harnesses: **134 lines** after the fix (124 before
   it on `main` d74b53f7; the ten new lines are guards and explicit branches added here).
2. `npx tsc --noEmit` after widening `GameId`, `Chapter.buildRef`, `BattleSetup.party`
   and `AnyCombatant`: **31 errors** in 17 files, each a site that assumed two games
   (the `Record<GameId, …>` maps, `'ffx' | 'ffx2'` parameters, member-build narrowing).
3. `npm test`: three suites that iterate `[...CHAPTERS, ...UNLISTED_CHAPTERS]` ran the
   experiment through the chapter flow (below, "Tests").
4. Proven by running (rule 3): `tests/unit/ff7-game-branch.test.ts` calls every guarded
   construction and presentation site with FF7 input.

## Where FF7 stops today

`FF7_EXPERIMENT_READY` (`src/app/experiments/ff7Flag.ts`) is **false**, so neither the
secret door nor `__pyrefly.gotoChapter('ff7-guard-scorpion')` reaches a battle
(`BattleScreenExperiment.ts` returns in its holding state). With the switch on, the
first unbuilt piece throws a named error: `battleSpellFx` in `BattleScreen.enter`,
then `createEngine`. (`createHud` answers `'ff7'` since 2026-09-27: the FF7 HUD,
no coach; `docs/handoff/ff7-hud.md`.) The FF7 engine track replaces the rest with
`'ff7'` branches; every other site below then becomes reachable and is
already safe.

## Dispositions

| Code | Meaning | Grep lines |
|---|---|---|
| **E** | explicit `'ff7'` answer added | 7 |
| **G** | guard throws `Ff7NotHandledError` (at the site, or at the module entry that precedes it) | 23 |
| **C** | closed at compile time: the parameter is `'ffx' \| 'ffx2'` (`FxGame`, `TurnCutInRequest`) or `Exclude<GameId, 'ff7'>`, and its only feeder is guarded | 17 |
| **U** | unreachable for FF7, with the reason (board tiles, prep, FFX/FFX-2 HUD-owned, `CHAPTER_IDS`-only) | 48 |
| **N** | `=== 'ffx2'` style switch: FF7 gets the base look, never FFX-2's; cosmetic; unreachable today | 14 |
| **S** | already safe: narrows to one game, or an existing throw | 8 |
| **F** | not a game branch (a minigame id, an ability's `game` data filter, a dataset string, a comment) | 17 |
| | **total** (rows marked "not grep" are extra sites tsc or reading found, not counted here) | **134** |

### App screens and flow (`src/app/screens/**`)

| Site | Code | Note |
|---|---|---|
| `battleAbilityFacts.ts:28` | F | FFX ability data filter |
| `battleAbilityFacts.ts:40` | G | `abilityFactsFor` |
| `BattleScreen.ts:327` | N | pause chip class; behind `battleSpellFx` |
| `BattleScreen.ts` spell effects (not grep) | G | `battleSpellFx(game)` now takes `GameId` and throws for FF7 |
| `BattleScreen.ts` play time (not grep) | E | an experiment's play time goes to `experiments:v1`, never the save |
| `BattleScreenContent.ts:65-66` | F ×2 | FFX data filters |
| `BattleScreenFlow.ts:146` `arcCleared` | E | `false` for FF7: never a vacuous "arc cleared" |
| `BattleScreenFlow.ts` `ARC_FINALE` (not grep) | C | `Record<Exclude<GameId, 'ff7'>, …>` |
| `BattleScreenFlow.ts` `runChapter` (not grep) | E | `chapter.experimental` goes to `runExperiment` before prep or any save write |
| `BattleScreenFlow.ts` `clearTimeToRecord` (not grep) | G | through `clearTimeMs` |
| `BattleScreenSetup.ts:61` | N | FFX-2 slot warning only |
| `BattleScreenSetup.ts:124-125` | G ×2 | `carryPartyForward`: FF7 has no chained link |
| `BattleScreenWiring.ts:68, 73` | G ×2 | `createEngine`: never an `FFX2Engine` |
| `BattleScreenWiring.ts:136, 138, 146` | G ×3 | `createHud`: never the FFX-2 HUD, Oversoul look or Rikku's coach; since 2026-09-27 an explicit `'ff7'` branch returns `Ff7BattleHud` (no coach, no shared phone rail) |
| `BattleScreenWiring.ts` `applyAtbConfig` (not grep) | U | only inside `createEngine`, after its guard |
| `BattleEncounterChain.ts` `cueForGroup` (not grep) | E | a `null` (silent) chapter cue starts nothing |
| `ChapterSelectScreen.ts:339` | U | board tiles are FFX and FFX-2 only |
| `CutsceneScreen.ts:163` | U | the experiment flow plays no cutscene |
| `frontend/chapterCards.ts:40-41` | G ×2 | `recommendedParty` (no FF7 card) |
| `frontend/chapterCards.ts:81, 147` | U ×2 | cards and rail groups exist only for tiles (and "ATB" would be right for FF7) |
| `frontend/chapterGrid.ts:187, 190, 210, 247` | U ×4 | the grid loops over `['ffx', 'ffx2']` only |
| `frontend/chapterGrid.ts` `GROUP_LABELS` (not grep) | C | `Record<FfxFamilyGame, string>` |
| `frontend/chapterProgress.ts:79, 89, 91` | U ×3 | strip pips come from tiles |
| `party-prep/phonePrep.ts:46` | U | FF7 has no prep; its content throws |
| `PartyPrepContent.ts:22` | G | `prepBuild` guards all three renderers |
| `PartyPrepContent.ts:46, 54, 77, 128` | G ×4 | behind `prepBuild` |
| `PartyPrepScreen.ts:94, 101` | F ×2 | panel registry filters (exact match) |
| `PartyPrepScreen.ts:158` | U | no prep for FF7 |
| `pause/meters.ts:274` | G | IN THIS FIGHT rows |
| `pause/panels.ts:104` | N | drops FFX-2's ATB row for FF7, which is right (FF7's mode is its own) |
| `pause/PauseView.ts:108` | E | "Final Fantasy VII" |
| `pause/plates.ts:231` | N | FF7 uses the plain id |
| `PauseScreen.ts:92` | N | base chrome |
| `ResultsScreen.ts:118` | G | `ffxFamily` at `:117` |
| `ResultsScreen.ts:182` | N | base chrome |
| `ResultsScreen.ts` best-time write (not grep) | E | an experiment never records into the save |
| `src/data/chapter-meta.ts` `GAME_LABELS` (not grep) | E | `ff7: 'FF7'` |

### Engine, presenter, tactics, spell effects (`src/engine/**`)

| Site | Code | Note |
|---|---|---|
| `spellfx/effects-elements.ts:36, 81, 183` | C ×3 | `FxGame` |
| `spellfx/effects-light.ts:25, 80, 88, 106` | C ×4 | `FxGame` |
| `spellfx/effects-shared.ts:34, 51, 55` | C ×3 | `FxGame` |
| `spellfx/FxDrawList.ts:91` | C | `FxGame` |
| `spellfx/SpellFxLookup.ts:20, 22` | C ×2 | `FxGame` |
| `spellfx/SpellFxTimeline.ts:41` | C | `FxGame` |
| `tactics/advisor.ts:1152` | E | `buildAdvisorView` returns `null` for FF7 (off in the slice) |
| `tactics/advisor.ts:651, 1039, 1606` | U ×3 | behind `buildAdvisorView` |
| `tactics/advisor-committed.ts:130`, `advisor-floor.ts:90`, `advisor-forecast.ts:94`, `advisor-menu.ts:113, 147`, `advisor-plan.ts:58`, `advisor-revive.ts:473`, `advisor-roll.ts:232, 238` | U ×9 | behind `buildAdvisorView`, owned by the FFX and FFX-2 HUDs |
| `tactics/targetLabel.ts:71, 72, 106, 126` | U ×4 | FFX and FFX-2 command help only |
| `tactics/braskas-final-aeon.ts` `boss.enemy` (not grep) | S | `'enemy' in boss` narrowing (tsc); FFX only |
| `TargetHighlight.ts:169` | N | `=== 'ffx2'` look |
| `TurnCutIn.ts:63` | E | no cut-in for FF7 until its options round |
| `TurnCutIn.ts:79` | U | behind `:63` |

### UI (`src/ui/**`)

| Site | Code | Note |
|---|---|---|
| `coach/coachCopy.ts:392` | E | no marks for FF7 |
| `coach/coachCopy.ts:402` | U | `speakerFor`, only inside `CoachLayer` |
| `coach/CoachLayer.ts:397` | E | `withCoach` hands an FF7 HUD back untouched |
| `coach/CoachLayer.ts:139, 307` | U ×2 | behind `:397` |
| `coach/CoachMark.ts:155, 231, 268` | U ×3 | behind `:397` |
| `common/BattleStartBanner.ts:111` | N | base card; option widened to `GameId`; behind `battleSpellFx` |
| `common/EnemyIntent.ts:290`, `MoveAdvisor.ts:156`, `StrategyGuide.ts:250` | N ×3 | owned by the FFX and FFX-2 HUDs |
| `common/MusicPlayer.ts:32` | F | a word in a cue key |
| `common/phoneBattle.ts:217, 246` | G ×2 | `installPhoneBattle` guards at its entry; `HOME_ASPECT` is `Record<FfxFamilyGame, number>` |
| `common/phoneBattleText.ts:46, 47` | N ×2 | "the whole party" / "ally", which is also FF7's wording |
| `common/resultsMath.ts:138-139` | G ×2 | `clearTimeMs`: the FF7 tick length is unsourced (core §2.2) |
| `common/resultsMath.ts:251, 253` | G ×2 | `buildMemberRows` |
| `common/resultsMath.ts:305` | E | `leaderId`: FF7 leads with active slot 1 |
| `common/transitions/index.ts:36` | N | left-to-right wipe |
| `common/transitions/TurnCutInLayer.ts:50, 65, 78` | C ×3 | `TurnCutInRequest.game` is `'ffx' \| 'ffx2'` |
| `common/transitions/TurnCutInLayer.ts:63` | F | comment |
| `common/victoryLine.ts:89, 101` | S ×2 | narrow to FFX-2 only |
| `ffx/OmnisReadout.ts:280`, `ffx/ZanmatoGauge.ts:262` | F ×2 | `dataset.phoneBattle` strings |
| `ffx/party-prep/panels.ts:29`, `SphereGridPanel.ts:232` | S ×2 | narrow to FFX |
| `ffx/party-prep/sphereGridModel.ts:53` | F | data filter |
| `ffx/TargetCursor.ts:162, 381` | U ×2 | `CursorChrome`, set by the FFX and FFX-2 HUDs |
| `ffx2/party-prep/panels.ts:40`, `StatsPanel.ts:19` | S ×2 | narrow to FFX-2 |
| `ffx2/withTargets.ts` (not grep) | E | the `'limit'` command kind fills its targets |

### Engines, main, learn site, tests

| Site | Code | Note |
|---|---|---|
| `battle/ffx/aeon-duel.ts:84`, `battle/ffx/execute.ts:270`, `battle/ffx2/engine.ts:349, 460`, `battle/ffx2/simulate.ts:202, 203` | F ×6 | minigame and input flags |
| `battle/ffx2/setup.ts:275` | S | the FFX-2 engine already refuses a non-FFX-2 party |
| `main.ts:88` | F | picks an FFX-2 chapter for a debug screen |
| `learn/atlas/chain.ts:32, 37`, `data.ts:75`, `main.ts:53`, `systems-catalog.ts:24, 41`, `learn/exploded/chapter-use.ts:60`, `main.ts:80`, `learn/shared/model.ts:29`, `learn/studio/main.ts:58` | U ×10 | the learn pages iterate `CHAPTER_IDS` (listed only); `requireChapter` now also throws for an experiment and `data.ts` guards with `ffxFamily` |
| `tests/unit/tactics-lookup-harness.ts:50` | S | test code; the FFX-2 engine's own guard caught FF7 here, and the suite now skips experiments |

## Tests changed

Three suites looped over `[...CHAPTERS, ...UNLISTED_CHAPTERS]` and ran the experiment
through the chapter flow, which it deliberately bypasses. Each now filters
`!c.experimental` with a one-line reason: `tactics-lookup.test.ts` (no FF7 engine
yet), `victory-line.test.ts` (no FF7 results panel yet), `pause-restart-checkpoint.test.ts`
(the experiment has its own flow). `party-face-manifest.test.ts`,
`story-triggers.test.ts` and `learn-atlas-data.test.ts` needed a type narrowing only.

## What the FF7 engine and HUD tracks owe this list

Replace the G sites that stop the flow today (`battleSpellFx`, `createEngine`; `createHud`
is done, 2026-09-27) with `'ff7'` branches, give the pause meters and `buildMemberRows` an FF7
answer (or keep them throwing and route FF7's pause and results through its own
panels), and decide `BattleScreen.ts:327`, `BattleStartBanner` and the N rows against
Bailey's picked HUD (option A, made more faithful; FF7 only). Re-run the grep above
when a new two-way branch lands; CHK-025 names this file.
