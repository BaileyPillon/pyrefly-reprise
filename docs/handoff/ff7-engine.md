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
  list (`setMenuLevel('deep')`, the default for a fresh menu).
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
