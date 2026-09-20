# Build A.1 — truth-wording track

Owner files: `src/engine/tactics/advisor*.ts` (description/effect sentences),
`src/ui/common/EnemyIntent*.ts` + css, the pause dossier's encounter field
(`src/ui/common/chapterObjectives.ts`, consumed by `src/app/screens/Pause*`),
`src/battle/ffx/results.ts`, `src/ui/common/resultsMath.ts`, and their tests.

All four round-03 items assigned to this track are fixed, tested against a
real reproduction first, `npx tsc --noEmit` clean, and committed individually
to `main`. No push, no deploy (per the brief).

## 1. Single-target Haste described as party-wide

**Wrong:** `src/engine/tactics/advisor.ts:441`'s `describeAbility` gated the
CTB-formula sentence's target noun on `heals` (`def.targeting.startsWith('all-all')
|| heals`). `heals` is a *sign* flag (speeds up vs. pushes back), not a scope
flag, so single-target Haste and the item Chocobo Feather (`targeting:
'single-ally'`, `heals`) both read "Speeds the party's turns up", and Silver
Hourglass (`targeting: 'all-enemies'`, no `heals`) read "Pushes the target's
turn back" instead of naming the enemies.

**Root cause:** the noun/pluralisation must come from `def.targeting` (the
same source `scope` above it is computed from), never from the sign flag.

**Fix:** `ctbWho`/`ctbNoun` derived from `def.targeting`; `heals` now only
picks the direction (speeds up / pushes back).

**Test:** `tests/unit/advisor.test.ts`, `describe('the CTB scope word matches
the real targeting, for every player command')` — table-driven over every
`formula: 'ctb'` ability in both games' full registries (minus `category:
'enemy'`). Confirmed it fails on the pre-fix code for `haste`,
`chocobo-feather`, `slowga`, `silver-hourglass` (stashed the source fix and
re-ran).

**Game case: both.** `describeAbility` is one engine-agnostic function
shared by both games (CHK-020). FFX-2 ships no `formula: 'ctb'` ability today
— Haste/Slow are a CTB mechanic and FFX-2 runs ATB
(`research/ffx-vs-ffx2-presentation.md`) — so the FFX-2 half of the table is
currently empty; the test still iterates both registries so a future FFX-2
CTB ability is caught by the same check.

**Still open:** none.

## 2. FFX-2 intent panel shows a Damage block for a status-only move

**Wrong:** `src/ui/common/EnemyIntent.ts`'s `damageHtml` rendered a "Damage"
section reading "0" / "0% HP" for Bahamut's Curse (Chapter 4), a
`formula: 'none'`, `power: 0` status move. `touchedFFX2` (and its FFX twin)
list a status-only target in `perTarget` because the move touched them
(applied a status) even though it moved no HP.

**Root cause:** `damageHtml` only checked `perTarget.length === 0`, not
whether any row actually had a nonzero amount.

**Fix:** filter `perTarget` to rows with `amount !== 0` before deciding
whether to render the section.

**Test:** `tests/unit/ui-enemy-intent.test.ts`, "prints no Damage section for
a real status-only move (Bahamut's Curse)" — real `FFX2Engine` on
`bahamutSetup(1)`, `engine.intent()` fed straight into the mounted panel.
Reproduced the exact live text ("DamageRikku00% HP") before the fix.

**Game case: both.** `EnemyIntent.ts` is the one component both
`FFXBattleHud` and `FFX2BattleHud` mount; the FFX side already relies on the
same `perTarget.length === 0`-only guard for its own zero-damage flavour
turns, so this generalizes correctly to both games' data.

**Still open:** none.

## 3. Pause dossier prints "LINK N OF M" (developer vocabulary)

**Wrong:** `src/ui/common/chapterObjectives.ts`'s `encounterProgress` labelled
a chained chapter's row `LINK ${link} OF ${chainLength}` — CHK-007: a word
the player was never taught. Affects Chapter 3 (Braska's Final Aeon →
possessed-aeon gauntlet → Yu Yevon, 7 formations) and Chapter 5 (Vegnagun →
Shuyin, 5 formations).

**Fix:** relabelled `BATTLE ${link} OF ${chainLength}`. "Battle" is taught
before either fight starts — party prep's own START BATTLE button
(`src/ui/ffx/party-prep/index.ts`).

**Test:** `tests/unit/pause-objectives.test.ts`, `encounterProgress`
describe block, updated + a new assertion that the label never contains
"LINK". Confirmed it fails on the pre-fix code (stashed and re-ran).

**Game case: both.** One `encounterProgress` function serves every chapter
of both games; only FFX currently ships a chain longer than one formation,
so the FFX-2 half of this rule is exercised the moment a chained FFX-2
chapter ships, by the same code path.

**Still open:** none. (Not touched: `src/app/screens/BattleScreen.ts:306`'s
comment still says `"LINK 2 OF 4"` as an example — a stale comment only, and
`BattleScreen.ts` is outside this track's owned files.)

## 4. Chapter 1 results credit a switched-out member with AP but no level

**Wrong:** `src/battle/ffx/results.ts`'s `sphereLevels()` keyed
`sphereLevelsGained` off `ctx.state.activeIds` (whoever is active when the
battle *ends*), while `src/ui/common/resultsMath.ts`'s `buildMemberRows()`
listed rows from `build.activeSlots` (whoever started the battle there).
Different sets: a member switched out *after* already taking a turn earlier
in the fight was dropped from `activeIds` (and so from `sphereLevelsGained`)
but still listed by `resultsMath` (pre-battle roster) with the flat AP award
and no S.Lv gain — the reported "S.LV 25 · 10,000/442 AP, no badge". A member
switched *in* who leveled up was the mirror failure: present in
`sphereLevelsGained`, absent from the pre-battle row list entirely.

**Research (ffx-combat-core.md §1.7/AP):** "Every party member who took at
least one full turn earns AP at the end of a battle. Characters switched out
during their first turn, KO'd, or petrified at the end earn nothing."

**Root cause / fix:** `ActorRuntime.turnsTaken` (`engine.ts`) already tracks
exactly this — it only increments at `onTurnEnd`, so a member switched out
via the `switch` command's `handOffTo` never reaches it for the interrupted
turn. `sphereLevels()` now checks `turnsTaken > 0` plus alive/not-KO'd/not-
petrified, over the full party (`activeIds` + `reserveIds`), not just the
end-state active three. `buildMemberRows()` now builds its FFX row list from
`sphereLevelsGained`'s keys (the one place eligibility is computed) instead
of `build.activeSlots`.

**Test:** `tests/unit/ffx-results-ap.test.ts` (new) — real `FFXContentRegistry`
+ `createFFXEngine`, a controlled `formula: 'fixed-no-variance'` Attack for
deterministic damage. Tidus takes turn 1, Yuna and Auron each take a turn,
then Tidus is switched out for Kimahri on Tidus's *second* turn (so he
already banked turn 1) and Kimahri lands the kill. Confirmed against the
pre-fix code: Tidus was missing from both `sphereLevelsGained` and the
rendered rows. A second scenario (switched out on the very first turn)
confirms that member correctly gets nothing. `tests/unit/ui-common-results.test.ts`'s
existing fixture updated to a realistic `sphereLevelsGained` (was
under-specified in a way that only worked by coincidence with the old code).

**Game case: FFX only.** The switch/reserve roster this bug is about is
§1.7's FFX mechanic. FFX-2's results screen is one screen of EXP/gil/items
with no chained-roster concept; `tests/unit/ffx-results-ap.test.ts`'s last
test pins that `buildMemberRows` still reads FFX-2's
`build.members`/`result.levelsGained` pair unchanged.

**Still open:** none.

## Verification

- `npx tsc --noEmit`: clean (two pre-existing errors in
  `tests/unit/ffx-yu-yevon-counters.test.ts` and `tests/unit/zz-engst-tmp.test.ts`
  are untracked files from other agents' in-flight work, confirmed unrelated
  by stashing all four of this track's diffs and re-running — same two
  errors present either way).
- `npx vitest run` (full suite, once): 151 files, 4181 tests, all green.
- No browser/screenshot work: none of these four items touch anything
  perceptual (wording/data-shape fixes only), so hard rule 9's end-state
  process does not apply and the brief's browser-pass instructions were not
  needed.

## Commits (this track only)

1. `3dd3a89` — advisor Haste/CTB scope fix
2. `a9ccd23` — EnemyIntent Damage-section fix
3. `559cace` — pause dossier BATTLE-not-LINK fix
4. `67e0a41` — FFX results AP-eligibility fix

## Files touched

- `src/engine/tactics/advisor.ts`, `tests/unit/advisor.test.ts`
- `src/ui/common/EnemyIntent.ts`, `tests/unit/ui-enemy-intent.test.ts`
- `src/ui/common/chapterObjectives.ts`, `tests/unit/pause-objectives.test.ts`
- `src/battle/ffx/results.ts`, `src/ui/common/resultsMath.ts`,
  `tests/unit/ffx-results-ap.test.ts` (new), `tests/unit/ui-common-results.test.ts`
- `docs/handoff/builda1-truthwording.md` (this file)

None of the touched files are listed in `docs/CONTRACTS.md`, so no
`docs/CONTRACT-CHANGES.md` entry is needed.
