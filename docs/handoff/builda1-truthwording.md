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

## Round 04 repair (2026-09-20)

Critic round 04 (`critic/rounds/round-04.json`/`.md`) deep-reviewed the Build A.1 candidate
before deployment and returned **changed area FAIL**: item 4 above (commit `67e0a41`, this
track's own fix) introduced PR-0003, a major regression. Nothing was deployed. This section
fixes PR-0003 and the citation half of PR-0025, both owned by this track, plus PR-0038 (a
documentation-only correction outside this track's usual file list but assigned to it in the
repair brief).

### PR-0003 (major, FFX) — the row set was built from the AP-eligibility rule, not the roster

**Wrong:** item 4's own fix made `buildMemberRows`'s FFX branch derive its **row set** from
`Object.keys(result.sphereLevelsGained)` — the sourced §10.1 AP-eligibility rule. §10.1 only
says who *earns AP*; it says nothing about who is *listed*. A defeat means the whole active
party is KO'd, so the eligibility set is empty and the ledger printed **zero member rows** (the
right half of the 1600x900 results frame goes flat black); a victory with a member KO'd at the
very end silently dropped that member's row the same way. The critic measured this over Chapter
1 seeds 1-12 in `critic/rounds/round-04/bench/zz-critic04-rows.test.ts`: six of six FFX defeats
in that session's play hit the empty-rows case, while FFX-2's own defeat in the same session
still showed all three girls.

**Root cause:** conflating "who is shown" with "who is credited." They are different questions
with the same source data (`sphereLevelsGained`), and item 4's fix collapsed them into one.

**Fix (`src/ui/common/resultsMath.ts`, `buildMemberRows`):** the FFX row set is now the roster —
`build.activeSlots` plus any reserve member who is a `sphereLevelsGained` key (i.e. took a turn)
— ordered active-then-reserve. `sphereLevelsGained` is read only to decide each row's own AP and
Sphere Level: a member the sourced rule excludes still gets a row, with `award: 0` and
`levelDelta: 0` (no `+N S.Lv` badge — `ResultsScreen.membersHtml` already gates that badge on
`levelDelta > 0`), instead of vanishing. `src/app/screens/ResultsScreen.ts`'s `heroHtml()` now
reads the wedge's leader from `leaderId(chapter)` (new export, `resultsMath.ts`) — FFX's first
active slot, FFX-2's first member — instead of `this.rows[0]?.id`, so the fallen pose still
renders even when the row list is empty or reordered.

**Test:** `tests/unit/ffx-results-ap.test.ts`, new `describe('PR-0003: ...')` block, two cases,
both against the real engine (hard rule 3) — never a hand-built `sphereLevelsGained` fixture:

1. The real `seymour-flux` chapter (Chapter 1) driven by the shipped `intendedStrategy` against
   the real engine, `gagazetBuild` and `ENEMY_GROUPS_BY_ID['seymour-flux']`, to a documented loss
   (seed 1, `tests/unit/strategy-seymour-flux.test.ts`'s own `KNOWN_LOSSES`) — the critic's own
   repro shape. Confirmed failing on the pre-fix code (`expected [] to include 'tidus'`, i.e.
   zero rows on the real defeat) before applying the fix.
2. A minimal real-engine victory where one active-slot member (`kimahri`) starts and stays KO'd
   the whole fight (never takes a turn) while `tidus` lands the kill: asserts `kimahri` still
   gets a row, at 0 AP and `levelDelta: 0`. Confirmed failing on the pre-fix code
   (`expected undefined to be defined` — no row at all) before the fix.

Also updated the existing test's stale `§1.7` citations (see PR-0025 below) and left every other
case in the file untouched — none of them needed loosening; the two new cases are additive and
the three existing "who is eligible" cases still pass unchanged under the new row-set logic
(verified: `npx vitest run tests/unit/ffx-results-ap.test.ts` — 7/7 green, including the pre-
existing "switched out on the very first turn... gets no row at all" case, which still holds
because that scenario's member is genuinely outside both the real chapter's `activeSlots` *and*
its `sphereLevelsGained`).

**Game case: FFX only**, same as item 4 above (`research/ffx-combat-core.md` §10.1's
switch/reserve roster is an FFX mechanic). The FFX-2 branch of `buildMemberRows` is untouched;
`tests/unit/ffx-results-ap.test.ts`'s existing FFX-2 parity case (`build.members`/
`result.levelsGained`) still passes, confirming FFX-2 is unaffected.

**Still open:** none.

### PR-0025, citation half only (polish, FFX) — `results.ts` cited §1.7 for the AP rule instead of §10.1

The full PR-0025 (the denied-turn recovery constant in `src/battle/ffx/engine.ts`) is a different
track's file and is not touched here. This track owns only the half the critic flagged in
`src/battle/ffx/results.ts`: `earnedAp`'s doc comment cited "ffx-combat-core.md §1.7/AP" for the
"took at least one full turn" rule, but that sentence lives at §10.1 (`research/ffx-combat-
core.md:1755`, under "10. Sphere Grid" / "10.1 Rules"); §1.7 is Switch and carries only the
narrower "switched out during your first turn" line. Fixed the citation in `results.ts` and in
this track's own test file's matching citations (`tests/unit/ffx-results-ap.test.ts`, three spots)
so the comments and the test file agree with the research.

**Game case: FFX only** (§10.1 is FFX's Sphere Grid; FFX-2 uses EXP/Levels, a different system).

### PR-0038 (polish, both) — "mute is applied at boot" overstated what the boot fix does

Not this track's usual files, but assigned to it in the repair brief as a documentation-only
correction. The audio-boot commit (`ba0a5e4`, a different track's fix for round 03 #5) said in
its own message "a saved **mute** or a lowered volume never reached the mixer," and
`docs/handoff/builda1-boot-and-menus.md`'s write-up of that same item repeated the word ("lowered
or muted a volume," "a muted/lowered save"). Checked against the code: `Settings` has no `muted`
field, `AudioManager.applySettings` (`src/audio/AudioManager.ts:534`) touches the three volumes
only, and no screen calls `setMuted()` (that method exists solely on the debug API,
`PyreflyDebugApi`, for the console). There is no player-facing mute control today, so no player
has actually lost a setting — the wording simply implied a control that does not exist.

**Fix:** reworded the two spots in `docs/handoff/builda1-boot-and-menus.md` from "muted" to
"lowered (including to 0)," and added a short "Correction (round 04, PR-0038)" note under item 1
stating plainly what the fix does (applies the three saved volumes at boot and on unlock) and
does not do (no mute field, no mute control). Did not touch `ba0a5e4`'s own commit message —
rewriting another agent's already-pushed commit history is out of scope for a doc correction.

**Open question for Bailey, not built (per the brief and AGENTS.md rule 10):** should OPTIONS get
a fourth row — a mute toggle, separate from the three volume sliders? Nothing here adds one.

**Game case: both**, per the critic's own tagging — this is a wording correction to shared boot
plumbing, not a game-specific claim.

### Verification (this repair batch)

- `npx tsc --noEmit`: clean.
- `npx vitest run tests/unit/ffx-results-ap.test.ts tests/unit/ui-common-results.test.ts
  tests/unit/results-inkgold.test.ts`: 43/43 green (targeted, while iterating).
- `npx vitest run` (full suite, once): **163 files, 4280 tests — 4278 passed, 2 failed.** The two
  failures are `tests/unit/chk023-runtime-proofs.test.ts` (Yu Yevon Curaga/Gravija and a slept Yu
  Pagoda's turn order) — an **untracked file with `src/battle/ffx/engine.ts` mid-edit
  (`git status`), neither of which this track touches or owns**; unrelated to results/AP/rows and
  present before this session started work. Not fixed here per the shared-working-tree rule
  (stay inside this track's own files).
- No push, no deploy, per the brief.

### Files touched (this repair batch)

- `src/ui/common/resultsMath.ts` — `buildMemberRows` FFX row-set fix, new `leaderId` export
- `src/app/screens/ResultsScreen.ts` — `heroHtml()` reads `leaderId(chapter)`
- `src/battle/ffx/results.ts` — `earnedAp` doc citation §1.7 → §10.1
- `tests/unit/ffx-results-ap.test.ts` — new PR-0003 cases (real engine), citation fixes
- `docs/handoff/builda1-boot-and-menus.md` — PR-0038 wording correction
- `docs/handoff/builda1-truthwording.md` (this file)

None of the touched source files are listed in `docs/CONTRACTS.md`; no `CONTRACT-CHANGES.md`
entry needed.
