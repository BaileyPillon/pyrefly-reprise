# FF7 engine: Guard Scorpion (plan steps 2 to 5)

Branch `ff7-engine` (worktree `D:/pyrefly-ff7-engine`, from `ff7-plumbing`), 2026-09-27.
Not merged, not deployed. **Game case: FF7 only**, plus two optional fields and one
category on the shared contracts (`docs/CONTRACT-CHANGES.md`, 2026-09-27 "the FF7 engine's
events and clock"). No file under `src/battle/ffx*` changed; the FFX and FFX-2 goldens and
suites are unchanged. Plan: `docs/plans/ff7-guard-scorpion-architecture.md`. Sources:
`research/ff7-battle-core.md` ("core"), `research/ff7-guard-scorpion.md` ("gs"),
`research/ff7-battle-staging.md` ("staging").

## What exists

Part 1 (commit c1b4f65a): `defs.ts`, `stats.ts`, `formulas.ts`, `hit.ts`, `atb.ts`,
`limit.ts` and the cited data in `src/data/ff7/`. Part 2 (this track), all pure (no DOM,
no `three`, no `src/data`/`engine`/`ui` import, no `Math.random`; every file under 400 lines):

| File | What |
|---|---|
| `engine.ts` | `Ff7Engine`: the `BattleEngine` facade plus `tick`, `gaugeSnapshot`, `inputValid`, `atbMode`, `clockHeld`, `setMenuLevel` (what the presenter duck-types), `setFf7AtbMode`, `setBattleSpeed`, `inventory`, `inputQueue`, `graceTicks`. |
| `clock.ts` | The three modes (Recommended default, core §2.5), the Wait sub-menu hold, the grace pause, ticks and ms, the Turn Timer step. |
| `setup.ts` | Combatants from the build (derived stats with Materia) and the enemy group; NormalSpeed, Turn Timer rates, battle-start timers. |
| `commands.ts` | The command window: Attack (Limit in its place when full), Magic from Materia (`'magic'` category), Item, Defend; the submit check; execution-time targets. |
| `resolve.ts` | A turn: enemy commit at its fill, executing a queued action, counters, the end check. |
| `perform.ts` | One ability on its targets: hit, critical, damage chain, KO, Phoenix Down, the Limit gauge. |
| `results.ts` | Victory / defeat, EXP / AP / gil, drops by class (`Rnd(0..63) <= class`). |
| `ai/` | Script shape (Setup / Main / Counter General / Counter Death, core §12) and Guard Scorpion's script with the verbatim warning lines. |
| `simulate.ts` | Headless runner, three policies (sensible, naive, literal hint), a log summary. |

`createEngine('ff7')` (`src/app/screens/BattleScreenWiring.ts`) now builds `Ff7Engine` with
`ff7Registry()`. The flow still stops at `createHud` (the HUD track) and
`FF7_EXPERIMENT_READY` stays `false`, so nothing a player can reach changed.

## Behaviour, in one screen

- **Clock:** time enters only through `tick(ms)`. An enemy whose gauge fills commits its
  Main section and acts inside that `tick` (core §2.4). A party member whose gauge fills
  joins a first-in first-out input queue; without `throughInput` the clock stops there,
  with it (a running menu) time goes on. Wait holds only while the menu is below its top
  list (`setMenuLevel('deep')`; a fresh menu starts at the top list since the FOLLOW-UP).
- **Queue (our estimate, core §2.6):** one action at a time; party actions queue on
  confirm, a Limit jumps the queue (core §7.2), a KO'd actor's queued action is dropped,
  counters jump the queue and never touch the counterer's gauge (core §12, estimate).
- **Boss:** the fixed 8-turn cycle on the turn counter (gs §5.2, §5.3); Search Scope prints
  "Locked On Target" (a `message` with `ff7: { kind: 'lock-on', targetId }`); the attack
  hits that target (a random living one if it fell, gs G7 estimate); Raise Tail and Drop Tail
  are `form-change` events and swap Def/MDf (40/256 to 255/384); while the tail is up every
  hostile action on it, hit or miss (G6 estimate), gets one Tail Laser on the whole party;
  a killing blow runs the death counter (Drop Tail, no laser).
- **Warning lines:** three `message` events (kind `'story'`, `ff7: { kind: 'hint', hintCase,
  line, speakerId }`) at the first Raise Tail only, verbatim per gs §7.1 for both alive,
  Cloud only, Barret only; "{barret}" is Barret's combatant name.
- **Limit:** fills only from damage an enemy does, with Cloud's LNum 140 and Barret's 129;
  empties on use and on KO; `limit-gauge` events. Braver 48 and Big Shot 52 (core §7.3).
- **Event order in a turn:** `turn-start`, `action-start`, (`form-change`), (lock-on
  `message`), per target `miss` / `damage` / `revive` / `limit-gauge` / `ko`, `action-end`,
  (hint lines), then each counter as `counter`, `action-start`, effects, `action-end`, and
  last `victory` or `defeat`. Healing is a negative `damage`.

## Tests (all FF7 suites: 242 tests in 15 files; 60 new in 5 files)

`ff7-engine-clock` (16), `ff7-engine-commands` (15), `ff7-guard-scorpion-ai` (14),
`ff7-engine-battle` (12, includes determinism, JSON safety and the layering / 400-line
checks), `ff7-golden` (3; fixture `tests/fixtures/ff7-golden.json`, seeds 1 to 20 for the
sensible and naive policies; re-pin deliberately with `FF7_GOLDEN_WRITE=1`), plus the updated
`ff7-game-branch` (createEngine now builds the FF7 engine). Helpers: `tests/unit/helpers/ff7.ts`.

## Bench (`docs/plans/ff7-engine-bench.md`, `node tools/ff7-bench.mjs`)

200 seeds, Recommended: sensible **200/200**, median 30 battle turns, no attack into the
raised tail, no KO; naive **0/200** (every run attacks into the tail, 4.4 lasers and 609
laser damage on average; the research's own arithmetic, explained there, nothing tuned);
literal hint **107/200**. Active and Wait give identical outcomes and turn counts.

## Estimates (say "our estimate" to Bailey)

Ticks per second 30 (core §2.2); grace pause `[SpeedValue / 6]` = 15 ticks at the default
speed (core §2.5 Q2); the queue model (core §2.6); counters leave the gauge alone (core §12);
the counter fires on a miss (gs G6); Search Scope's retarget and the same rule for a party
member's single target that fell (gs G7); the draw orders (battle start party first, per
target hit then critical then variance, the 1/3 roll before the HP check); a revived member's
Turn Timer starts at 0; Defend ends when the member's next action executes (Fergusson's
"most recent turn"; at zero decision time the same as the wiki's "until the next turn begins");
item effects never miss; the preset party (gs §8.2, §8.5).

## Open

1. **Change** (row swap) is not offered: it needs a `Command` kind the shared contract does
   not have. Add one (contract change) when the HUD wants it.
2. **Active mode's animations:** FF7's Active runs the clock during animations; our presenter
   never hands animation time to `tick`, so Active currently differs from Recommended only by
   having no grace pause. Wiring it means the presenter passing animation time for FF7.
3. **Config rows:** nothing sets `setFf7AtbMode` or `setBattleSpeed` yet; Recommended and 128
   until the HUD track adds FF7 Config (never through `applyAtbConfig`, which is FFX-2's).
4. **Hint wording** (gs §7.3) stays as transcribed; the bench's literal-hint result may inform
   Bailey's call.
5. **Results screen:** `BattleResult.exp` is the per-member total (core §11: each living member
   gets all of it); levels gained, AP per Materia and the Assault Gun's arrival are for the FF7
   results panel.
6. Unreachable here and not built: statuses and their timers, Barrier / MBarrier, escape,
   Cover, back attacks, Recovery's effect.
7. Merge order: this branch sits on `ff7-plumbing`; the HUD track (`D:/pyrefly-ff7`) owns
   `src/ui/**` and `createHud`.

## CHECK (adversarial engine check, 2026-09-27, a second agent that did not build it)

Method (rule 3, run, not grepped): a scratch replay verifier, `tools/zz-ff7check.tmp.mjs` and
`tools/zz-ff7check2.tmp.mjs` (not committed), with its **own** implementation of the formulas
taken from `research/ff7-battle-core.md` and `research/ff7-guard-scorpion.md`. It played 800
seeded battles (seeds 1 to 200 for the sensible, naive and literal-hint policies, plus a
fourth, "Bolt/Ice always", that casts into the raised tail) and checked every event in every
log against the hand formula. No browser was used (the machine was busy); the sources were
the two research files and their worked tables.

**Verdict: no blocker.** One major (a missing command the research lists as needed now), six minors.

What was proven:

- **Formulas, 18 hand anchors** against the research's printed ranges (core §14, gs §4, §9):
  Cloud Attack 38-41, critical 76-82, tail up 20-22; Bolt 90-96 / 44-48; Ice 45-48; Braver
  116-124 / 62-67; Barret Attack 32-35; Big Shot 105-113 / 57-61; Cure 232-248; Rifle on Cloud
  front 35-38, back row 17-19, Defended 17-19; Scorpion Tail 63-68 on Cloud (the research's
  62-68 spans Cloud and Barret); Tail Laser split 72-77, split and Defended 35-38. All match.
- **Every damage event in the 800 logs** (24,658 hits, 2,900 heals, 133 Phoenix Downs at
  `[MaxHP / 4]` = 79) fell inside the independent min-max for its attacker, target, form
  (Def 40/255, MDf 256/384), Defend, critical and split. Zero outside.
- **Limit fill**: all 12,760 enemy hits on a party member produced exactly
  `[[300 * HPLost / MaxHP] * 256 / LNum]` (LNum 140 / 129); gs §9's anchors 65/69, 117/127,
  133/142 reproduce. Gauge empties on use and on KO.
- **Rates**: party Attack crit 2.2% (want [10/4] and [11/4] = 2%), boss crit 1.1% (want 1%),
  Lucky Evade Cloud 3.2% / Barret 4.0% (want 3% / 4%), party Attack misses 0 of 3,305
  (Hit% 100 and 101). Turn Timer fills in 369 / 361 / 361 ticks (core §2.3); Normal start puts
  the highest timer at 57,344; derived stats Max HP 316/317, MP 57/43.
- **AI cycle**: 1,219 full 8-turn cycles (up to 5 in one battle) all read Search Scope, attack,
  Search Scope, attack, Raise Tail, pass, pass, Drop Tail. All 3,389 attacks hit the locked
  target while it lived; below 400 HP it was always Scorpion Tail; at 400 or more the Scorpion
  Tail share was 0.342 (want 1/3). The warning played once in every battle (three lines).
- **Tail-up counter**: 5,119 counters; every party action on the boss while the tail was up
  was answered by one Tail Laser (0 missing), none while it was down (0), and the 107 killing
  blows landed with the tail up each got Drop Tail and no laser (0 lasers).
- **Determinism**: same seed, identical log (47 kB JSON); the clock stepped in 17 ms chunks
  gives the same events as whole steps. The golden fixture test passes.
- **Rewards**: 100 EXP, 10 AP, 100 gil, Assault Gun on a win.
- **FFX / FFX-2 untouched**: `git diff main...ff7-engine -- src/battle/ffx src/battle/ffx2` is
  empty; `ffx2-atb-golden` (6), `ffx-engine`, `ffx-ctb`, `ffx2-engine`, `ffx-formulas`,
  `ffx2-formulas`, `ffx-fixtures` and all 15 `ff7-*` files pass (22 files, 423 tests);
  `tsc --noEmit` is clean. Engine files are under 400 lines, with no `Math.random`, DOM or `three`.
- **Cites**: every registry record carries a § and a tag (`ff7-data-cites`), and every estimate
  in the brief is labelled in the code. The one exception is minor 5 below.

Findings:

1. **Major: no Change (row swap).** core §13 lists "Row, Long Range, Defend, Change" as
   needed now, and the wiki's strategy is to move Barret to the back row. The row rule works
   (back row 17-19 was proven through the formula), but the player cannot reach it. Already
   listed as Open 1; it needs a contract `Command` kind.
2. Minor: **Active is Recommended without the grace pause**, because animation time never
   reaches `tick` (Open 2). The bench's "Active = Recommended" is true by construction, so it
   does not show that Active works.
3. Minor: **Wait holds at the top list by default.** A fresh menu starts `'deep'`, so until the
   FF7 HUD reports `onMenuLevel('top')` Wait also stops the clock at the top command list,
   which core §2.5 says keeps running. The FF7 HUD must wire `onMenuLevel`.
4. Minor: `createEngine` imports `Ff7Engine` and `ff7Registry` statically into
   `BattleScreenWiring.ts`, so the hidden experiment's engine and data ship in every player's
   bundle. FFX and FFX-2 behaviour does not change. Consider a dynamic import.
5. Minor, not labelled: when one party member is down, Tail Laser has a single target, so it
   does not split and deals the full 109-116. This is a fair reading of core §4.5 step 8
   ("a multi-target hit"), but the research does not state it. Label it `[derived]` or
   `[estimate]` in `perform.ts` and the handoff.
6. Minor, not labelled: an item aimed at an ally who fell while the menu was open is used up
   and misses (`payFor` runs before the wrong-state miss). This is unsourced; label it or refund.
7. Minor: Defend ends when the member's next action executes (labelled as our estimate). At
   real decision times this lasts longer than the wiki's "until their next turn begins" when
   read as the gauge filling. That is worth a line to Bailey if the HUD shows Defend.

## FOLLOW-UP (2026-09-27, after the CHECK)

**Game case:** FF7 only, plus one shared-plumbing contract change (both + FF7): `Command`
gains FF7's Change. `git diff main...ff7-engine -- src/battle/ffx src/battle/ffx2` is still
empty; `ffx2-atb-golden` and every FFX / FFX-2 suite pass; no FFX or FFX-2 chapter changes.

**New source read for this pass:** the North American FF7 manual (PlayStation's manual archive,
URL in `research/ff7-battle-core.md` Sources, read 2026-09-27): p. 16 (Change is barred in a Side
Attack and an Attack From Both Sides), p. 18 (Change; Defend "until the Time gauge fills up"), p. 29
(Config ATB wording). The notes are added to core §2.5, §5.1 and §5.2.

What changed, by finding:

- **C1, Change (major): done.** `RowChangeCommand = { kind: 'row-change'; targets: [] }` in
  `types-ff7.ts`, in the `Command` union through `Ff7Command` (`docs/CONTRACT-CHANGES.md`, same
  date; `types.ts` did not grow). The command window offers **Change** to every member, enabled,
  no target, category `'special'`, listed just before Defend (the manual puts it off the window's
  left edge and Defend off its right edge: the HUD places them). It is offered with a full Limit
  gauge too. It executes like Defend: `turn-start`, `action-start` (the command), the row flips
  front <-> back, `action-end`; the new row is on the combatant (`ff7.row`). Sourced: that it
  swaps the row [core §5.1, 2 sources now], who has it (every member, manual p. 18), and that the
  row then halves physical damage both ways unless Long Range (`formulas.rowHalves`, unchanged).
  **Our estimate:** that it spends the turn and resets the gauge, and that it queues like any
  command and starts the grace pause (no source says either way). Tests: a battle where Barret
  moves back (12 seeds): Rifle 17-19, Scorpion Tail 30-34, split Tail Laser 35-38 on him, his
  Long Range Gatling Gun still 32-35; Cloud at the back attacks for 18-20 instead of 38-41
  `[derived]`. The one file outside `src/battle` this needed is `src/ui/ffx2/withTargets.ts`
  (FFX-2's, not the FF7 HUD's): one `case 'row-change':` line in its exhaustive no-target group,
  or `tsc` fails. The FF7 HUD track should know the kind exists.
- **C2, Active mode (minor): done in the engine.** New engine input
  `setAnimating(on, { summon? })` (and `animating()`): while an action animates, `clockHeld()` is
  true under Recommended and Wait, and under Active only for a Summon; under Active `tick(ms)` runs
  every gauge (a party member who fills joins the input queue, an enemy commits) but executes
  nothing until the animation ends [core §2.5; queue model our estimate]. Default off, so the
  existing path is unchanged. **Not wired to the presenter:** the FF7 presenter/HUD path must call
  `setAnimating(true)` when an action's playback starts, keep calling `tick(dt)` during it, and
  `setAnimating(false)` at the end. The headless runner now takes `animationMs` and
  `menuMs: { top, deep }` (the bench's player model, **our numbers**), and the bench has a third
  table: with 1.5 s animations and 0.5 s + 1.5 s menus the boss's share of turns is 0.333 (Wait),
  0.360 (Recommended), 0.368 (Active) for the sensible player, the wiki's difficulty order.
  Outcomes barely move for the sensible (200/200 in every mode) and naive (0/200) players; the
  literal-hint player wins 106 (Wait), 66 (Recommended), 74 (Active), where the Active /
  Recommended gap is about one binomial standard deviation (`docs/plans/ff7-engine-bench.md`).
  The zero-time row "Active = Recommended" is kept and now labelled as true by construction.
- **C3, Wait's fresh menu (minor): done.** A newly offered menu starts at the top list
  (`level = 'top'`), where Wait's clock runs; it holds only after the HUD reports
  `setMenuLevel('deep')` (a sub-menu or targeting) [core §2.5; manual p. 29]. The HUD must still
  report `'deep'` when the player enters Magic, Item or targeting, or Wait will never hold.
- **C4, the static import (minor): open.** `createEngine` in `BattleScreenWiring.ts` is
  synchronous; a dynamic import would ripple into the app's engine construction. No source
  settles it; an engineering call for the merge.
- **C5, the unsplit one-target Tail Laser (minor): labelled.** `formulas.splits` now says a
  one-target hit never splits `[derived from "a multi-target hit", core §4.5 step 8]`.
- **C6, an item on an ally who fell (minor): labelled** as our estimate in `resolve.payFor` (the
  item is used and misses; no source says whether FF7 refunds it).
- **C7, when Defend ends (minor): settled by a source and changed.** The manual says damage is
  halved "until the Time gauge fills up" (p. 18), which agrees with the wiki's "until their next
  turn begins" read as the gauge filling. Defend now ends at the fill (`resolve.gaugeFilled`),
  not when the member's next action executes. The golden fixture did **not** move (seeds 1 to 20,
  sensible and naive: no boss turn fell between a defender's fill and their command). The bench's
  literal-hint Recommended row moved from 107 to 106 wins (the only policy that Defends on every
  tail-down turn).

Checks run: `npx tsc --noEmit` clean; the 16 FF7 files plus `ffx2-atb-golden` (17 files, 260 tests;
FF7 254, of which 12 new in `ff7-engine-followups`); the full `npm test` once: 507 files pass,
1 failure, `strategy-ffx2-bahamut` "heal-only route" timing out at 15 s under the full load, which
passes alone (19/19); `node tools/ff7-bench.mjs` re-run (about 2 s) and
`docs/plans/ff7-engine-bench.md` updated. Engine files stay under 400 lines (`engine.ts` 360).

Still open after the follow-ups:

1. Presenter wiring for `setAnimating` (C2) and the HUD's `setMenuLevel('deep')` reports (C3),
   and the HUD's Change slot on the command window's left edge: HUD / presenter track.
2. Whether Change spends the turn (our estimate: yes, like Defend): no source read says.
3. Manual vs wiki on Recommended's animation hold: the manual names only Magic and Item effects
   (p. 29); the engine follows the wiki's "battle animations" [core §2.5, marked conflict]. A
   question for Bailey only if the presenter ever distinguishes animation kinds.
4. C4 (dynamic import), C6 (refund or not): unsourced; left as they are.
5. The earlier Open list (Config rows, hint wording, results screen, unreachable statuses, merge
   order) is unchanged, except that items 1 (Change) and 2 (Active's animations, now an engine
   input awaiting the presenter) are addressed as above.
