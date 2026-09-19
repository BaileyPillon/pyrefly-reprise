# builda-combat — critic round 02, the combat-engine blockers

**Track:** combat. **Files owned:** `src/battle/**`, ability/item/enemy data under
`src/data/ffx/**` and `src/data/ffx2/**` where an issue named it,
`src/engine/tactics/*.ts` where a fixed mechanic changed the intended line, and
tests. **Source of work:** [critic/rounds/round-02.md](../../critic/rounds/round-02.md),
issues #05, #06, #11, #12, #17, #24, #25.

Commits: `712f6e7` (FFX Overdrives and Trigger Commands), `f89724b` (Charon and
Yu Yevon).

## The shape of all seven

Six of the seven were the same defect: **the data declared a mechanic and
nothing in `src/battle` read the key**. `extra.resolvesToShots`,
`extra.resolvesToOneOf`, `extra.resolvesAsCommandKind`, `flags:
['destroys-user']` in the X-2 path, and `EnemyFields.doomTurns` each had zero
readers, so five shipped menu rows and one shipped item did nothing at all
while looking like working features. `tests/unit/ffx-overdrive-menu-rows.test.ts`
ends with the general guard for that class: **every row the menu offers,
submitted verbatim, must either change the battle or be refused out loud.**

## What changed

| # | Was | Now |
|---|---|---|
| 05 | Every Wakka reel set spent a full gauge for `damage: []`; `rollDefaultMinigame` read an `extra.reelStrip` that exists nowhere, so all four sets rolled against the Attack Reels strip | New `src/battle/ffx/reels.ts` resolves a spin to one of the ten shots per ffx-combat-core §5.6: symbol → shot, 3-of-a-kind all enemies, 2-of-a-kind one random enemy, no match Power Shot, Attack Reels' sum rule with its true 0 and 12 |
| 06 | Lulu's only Overdrive row was the generic `'fury'` marker, which `execute.ts` refuses on purpose; `timerMsFor` returned 0 for `lulu-fury` | `commands.ts` expands the marker into the Fury of every Blk Magic spell she has learned (§5.7); the dial gets §5.7's ~4 s window; an **untimed picker publishes no `timerMs` at all** rather than a 0 an overlay starts and expires |
| 11 | `destroys-user` read only by the FFX engine, so X-2's Charon was a free repeatable defence-ignoring nuke — 15/15 wins in 13.2 turns against the intended line's 77 | `ffx2/resolve.ts` KOs the caster through the ordinary death path (ffx2-combat-core §2.3, §3.12). Charon line now 0/15 |
| 12 | Talk was offered as `{ kind: 'ability' }` and `execute.ts` only handled `{ kind: 'trigger' }`, so Jecht's gauge could never be zeroed by a player and Seymour Flux's §4.7 bonuses did not exist | `commands.ts` emits the kind the catalog record names, for Talk **and** Flee; `ai/index.ts` dispatches Talk on the boss present; Kimahri +10 Str / Yuna +10 MDef, once each; the exhausted row is disabled with a reason instead of eating a turn |
| 17 | 40,000 steps, 25,364 turns, no `battle-over` | Doom reads the target's own `doomTurns` (one Candle, 3 of his turns, dead in 15); `reflect` is `single-any` so §3.5's Reflect route exists; and a stalemate guard ends a battle with no new enemy-HP low for 400 turns as `'escape'` |
| 24 | Phase 2 cast the player's `flare` (power 60, single-enemy); the encounter's `flare-self` (power 80, Self, `selfTargetBounce`) was referenced by nothing | `use(ai, 'flare-self', ...)`, so the bounce lands in §5.2's 1,900–2,100 band and §5.3's Reflect-dispelled self-damage case is reachable |
| 25 | `FLARED` was never cleared on the wait turn, so sub-50% Seymour cast **one** Flare for the whole phase | Cleared on the wait turn: §4.4.1's loop runs Flare → wait → Flare |

## How it was proven

Engine-level, on the shipped data, never by grep. Every assertion below fails on
the old code.

- `tests/unit/ffx-overdrive-menu-rows.test.ts` (15 tests) — each reel family
  deals real damage taken exactly as offered; §5.6's symbol→shot table and the
  Power Shot fallback; the Attack Reels hit-count table row for row including
  Miss/Miss/Miss = 0 and 2-2-2 = 12; a perfect spin lands twelve hits in the
  engine; Lulu's marker expands to her learned spells only; Fury lands multiple
  casts; timers; Talk in both encounters, its two charges, its refusal, and its
  §4.7 stat bonuses; and the every-row-does-something guard.
- `tests/unit/ffx-yu-yevon-exit.test.ts` (5) — the Doom, Poison and Reflect
  routes, the countdown coming off the enemy rather than the item placeholder,
  and the critic's defend-only repro now reaching an outcome in 1,054 decisions.
- `tests/unit/ffx2-ability-flags.test.ts` (2) — no Charon caster survives its
  own cast (read off the event log, because Charon has a charge time), and the
  Charon line wins 0 of 15.
- `tests/unit/ffx-ai.test.ts` — the Seymour phase-2 loop, rewritten to assert
  Flare → wait → Flare → wait → Flare and the `flare-self` id.
- Chapter verifiers re-run: Chapter 1 (`strategy-seymour-flux`), Chapter 2,
  Chapter 3 (`strategy-braskas-final-aeon`, `chapters/possessed-aeons`),
  Chapter 4 (`strategy-ffx2-bahamut`), Chapter 5
  (`strategy-ffx2-vegnagun-shuyin`). All intended lines still win; all
  wrong-tactic lines still lose.

## The one number that went down, and why

**Chapter 1 fell from 26 wins in forty seeds to 23**, and that is the fix
working. Phase 2 used to deadlock after a single Flare; it now runs §4.4.1's
loop with the encounter's own power-80 Flare bouncing ~2,000 onto the party
every other turn. "Never weaken a boss" is not negotiable, so the line absorbed
it:

- The §4.7 Talk opener, newly executable, is worth **+4 wins** (19 → 23). It is
  placed last of the openers and behind a readiness gate; measured ahead of
  Mighty Guard and Hastega it wiped the party in phase 1 on 70,000.
- Seed 1 is recorded in the test as a **documented loss**, with the numbers, so
  the next pass can try to win it back rather than discovering it cold.
- The mount-line ("wrong tactics still lose") bound moved 30,000 → 20,000,
  because Kimahri's +10 Strength kills the mount faster and every mount death is
  a Mortibsorption that drains Seymour. It still loses on every seed.

## Left, and what it needs

1. **FFX-2 Lady Luck's reels — not fixed, deliberately.** Round 02 filed it
   under #05 as "the same class", and it is: `x2-lady-luck-attack-reels` and
   `-magic-reels` are `formula: 'none'`, `power: 0`, so a spin does nothing.
   But X-2's reels are **not** Wakka's, and the owner's standing rule is that a
   rule true of FFX is not applied to FFX-2. ffx2-combat-core §3.12 has its own
   table: Red 7 / BAR / Cherry / three suit symbols, three payoff tiers
   (3-of-a-kind, pair, Cherry-any-any) and a **Dud** that hits the whole party
   for 75% of current HP ignoring defence. Implementing it means authoring that
   table plus ~8 ability records the X-2 data does not have (Shin-Zantetsu,
   Clean Slate, Magicide, the Auto-Life reel, Item and Random Reels). That is a
   content job, not a one-line reader, and half of it would be worse than none:
   the Dud alone is all downside. **Scope for whoever takes it:** a sourced
   `src/data/ffx2/reels.ts` table, the missing payload records, and resolution
   in `ffx2/resolve.ts` mirroring the FFX shape in `reels.ts`.
2. **Four X-2 ability flags still have no reader** in `src/battle/ffx2`:
   `adds-equipment-crit`, `long-range`, `reflectable`, `weak-delay`. The critic
   suggested a blanket "every declared flag is read" test; it is not written
   here because it would go red for four pre-existing gaps outside this track's
   issues. `reflectable` is the notable one — X-2 ships a Reflect spell that
   bounces nothing.
3. **Chapter 1 is at 23/40 (58%)**, short of the 90% the project asks. The cap
   is still what `strategy-seymour-flux.test.ts`'s header says: the
   Lance-of-Atrophy → Full-Life pairing landing back-to-back with no party turn
   in between. A second, newly-measured cap: **the aeons throw Fire Gems**.
   `strike()` in `src/engine/tactics/seymour-flux.ts` knows three Overdrive
   labels, all of them the party's, so every summon falls through to the
   thrown-item rung — seed 1 spends five aeon turns on five Fire Gems with
   Bahamut on the 100% gauge §7.9.2 gives him for Mega Flare. A naive fix
   (Overdrive first for the aeon) was measured at **19 wins**, worse than 23,
   because it pushes him into the harder phase 2 sooner; it needs the phase-2
   line improved first, so it is left alone and written down here.
4. **§6 row 7, Silence on Seymour**, is in the tactic but can never fire in the
   shipped preset: Wakka owns both rows and is benched, and a rule that swaps
   him in **ping-pongs against the rule that swaps Yuna in** — a switch is rank
   0 and hands the turn straight over, so the forty-seed sweep stopped
   terminating. Any future bench rule needs a one-directional guard.

---

# Fix pass — 2026-09-19, after the adversarial verifier

The verifier refuted two of the claims above. Both were the same defect the
track said it had closed, hiding in the two places the guard never looked: an
actor it never asked (Rikku, one Switch off the Chapter-1 bench) and an event it
miscounted as an effect (`overdrive-gauge{cause:'spent'}`, which is a row's
**cost**). Closing them turned up two more of the same family. All five are
**FFX only** — Steal, Mix, Fury, the Overdrive gauge and Rikku's `Use` submenu
are FFX commands, in FFX data, resolved by the FFX CTB engine. Nothing under
`src/battle/ffx2` was touched, and `tests/unit/trigger-commands.test.ts` audits
chapters 4 and 5 unchanged to prove the FFX-2 side needed nothing
[AGENTS.md hard rule 14].

## What changed

| # | Was | Now | Where |
|---|---|---|---|
| 1 | Bio / Death / Demi Fury spent a full gauge and emitted **no event at all** | A connecting hit that computes to 0 emits `damage` with `amount: 0`, the way FFX puts the number on screen | `src/battle/ffx/abilities.ts` |
| 2 | `extra.deathChance` had **no reader** — Death, Death Fury, the aeon's Pain, **Zanmato** and the two Wisps all did nothing | Rolled on the `ko` path through `rollStatus`, honouring `extra.ignoresAllResistance` | `src/battle/ffx/scripted.ts` |
| 3 | `Steal` was an enabled row that emitted nothing; `extra.stealRoll` and `EnemyFields.rewards.steal` had no reader | §7.8.1's roll, its per-monster counter, Master Thief / Pickpocket, and a message on every branch | `src/battle/ffx/steal.ts` (new) |
| 4 | `Use` was an enabled row that spent a turn in silence | Not offered (this menu is flat, so the gems and grenades it fronts are rows already) and refused out loud if submitted anyway | `src/battle/ffx/state.ts`, `commands.ts`, `execute.ts` |
| 5 | `MIX_RECIPES` had **no reader in the project**; Mix ate a full gauge | The registry carries the table, the engine resolves the pair and consumes both ingredients; an unresolvable bag is refused with `"Mix failed!"` and keeps the gauge | `registry.ts`, `overdrive.ts`, `execute.ts`, `index.ts`, `app/screens/BattleScreenContent.ts` |

Number 5 is the one file outside this track's list: `BattleScreenContent.ts` is
the documented data-to-engine join (`registerFFXAbilities` /
`registerFFXItems`), it was clean in the tree, and the change is two lines that
hand over a table that already existed.

## How it is proven

- **The verifier's own repro**, `critic/scratch/builda/REFUTATION.test.ts`, run
  unchanged: 4 failures before, 0 after (the one remaining assertion is its
  precondition "Use is offered", which is the fix).
- **`tests/unit/trigger-commands.test.ts`** (new, the file critic #12's
  suggested fix asked for by name): every chapter in `CHAPTERS`, every actor,
  every enabled row, submitted verbatim on a fresh engine replayed to the same
  turn, at three seeds — 8 tests. FFX chapters walk the bench in too, which is
  where the two refuted rows were. `overdrive-gauge{spent}` no longer counts as
  an effect. This is the test that found Mix: it listed
  `rikku / Mix (overdrive)` as inert on chapters 1-3 before the fix.
- **`tests/unit/ffx-unread-riders.test.ts`** (new, 14 tests): Bio Fury's hits
  and its Poison rider actually rolling (and correctly failing against
  Seymour's resistance 90 versus chance 80); Death killing a vulnerable target
  and being refused by a `ko: 255` one, so **no boss is weakened**; Steal
  guaranteed on the first attempt against a `baseChance: 100` table, halving on
  success only, capped at eight, and saying so on every branch; Mix resolving
  Potion + Potion to Ultra Potion and consuming both; `Use` gone from the menu
  and refused if submitted.
- **`tests/unit/ffx-overdrive-menu-rows.test.ts`**: the old guard's filter now
  excludes `overdrive-gauge{spent}`, and Rikku was added to its actor list.
- `npx tsc --noEmit` clean; `node tools/orphans.mjs` shows `steal.ts` imported;
  full unit suite **3879 passed / 1 failed**, the one failure being
  `tests/unit/menu-cancel.test.ts`, the FFX-2 menu track's in-flight work.

## What is left

1. **The gil-steal family is still unimplemented.** `nab-gil` is in two shipped
   builds. It deals its Strength-formula damage, so it is not silent and the
   guard holds — but §7.8.1 rolls the gil steal "against the monster's gil-steal
   byte", and neither `EnemyFields` nor any shipped enemy record has that byte.
   Implementing it would mean inventing game data [hard rule 6]. It needs a
   sourced field first.
2. **`extra.repeatsPreviousAllyAction` (Copycat) and `extra.opensItemMenuAtRank`
   (Quick Pockets) still have no reader.** Neither is in any shipped build, so
   no menu can offer them today and the guard cannot see them.
3. **Items are the guard's one exemption**, and it is a fidelity call: an
   Antidote used on somebody who is not poisoned legitimately does nothing in
   both games, and `validTargets` does not filter by what an item would help.
   Narrowing item targeting is a real improvement and a separate job.
4. **The Mix overlay** (`src/ui/ffx/minigames/`) still reports
   `resultAbilityId: null`. It does not have to change — the engine resolves the
   pair from `ingredients` now — but it cannot preview the result to the player
   until it reads the table too.
