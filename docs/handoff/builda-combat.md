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
- **One live pass** (GPU-mode Chromium against the dev server, 1600x900, the
  shipped Chapter-1 board): Switch Rikku in, then Steal -> `['action-start',
  'message', 'action-end']` with the message **"Stole Elixir!"**, and Bio Fury
  correctly answers with `minigame-request` rather than auto-rolling, because
  live play is interactive and the Fury dial belongs to the player. Zero console
  errors. Screenshot: `docs/screenshots/fix3/builda-combat-steal-live.png`.
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

---

# Release prep — 2026-09-19, the four defects Build A's tracks left outside their own files

Build A's flow and combat tracks each ended by naming a defect they could not
fix because they did not own the file. This pass owns those files. Four
defects, each proven by a test that is red on the code before it and green
after — checked by putting the old file back and re-running, not by assertion.

**Game-awareness** [AGENTS.md hard rule 14]: 1 and 2 are **both games** —
shared plumbing and bug fixes, which `critic/CHECKS.md` CHK-020 defines as
applying to both, and defect 1's leak was in `src/battle/ffx/setup.ts` *and*
`src/battle/ffx2/setup.ts` with a different set of leaked objects in each. 3 is
**FFX only** (Chapter 1's tactic; nothing under `src/engine/tactics/ffx2-*` was
opened). 4 is **FFX-2 only** and says so in the CSS: the FFX value is declared
at the exact hex the consumer was already falling back to, so no FFX screen
moves a pixel.

## 1. Battles stopped sharing enemy records — both games

`ENEMY_GROUPS_BY_ID` and the party builds are module singletons, and both
engines' `init()` copied them field by field, one level deep. Audited by
building a fresh `BattleState` per chapter and walking it for objects that were
**reference-identical** to something reachable from the shipped records
(`tests/unit/battle-records-per-battle.test.ts`, first block):

| Chapter | shared objects | which |
|---|---:|---|
| 1 Seymour Flux | 16 | 14 x `equipment.{weapon,armor}.autoAbilities`, `enemy.rewards.steal`, `enemy.rewards.bribe` |
| 2 Yunalesca | 16 | the same shape |
| 3 Braska's Final Aeon | 16 | the same, plus `enemy.forms[1].statOverrides` |
| 4 FFX-2 Bahamut | 5 | 3 x `dresspheres.abilitiesLearned`, the whole `enemy.forms` array, the whole `enemy.rewards` object |
| 5 Vegnagun / Shuyin | 5 | the same |

`src/battle/common/clone.ts` is the new one-function module (`structuredClone`
where the runtime has it, JSON otherwise — the same two-step
`src/battle/ffx/intent.ts` and `src/battle/ffx2/simulate.ts` already use), and
both `setup.ts` files now deep-copy `setup.party`, `setup.enemies` and
`setup.triggers` before reading them. The X-2 side also clones
`carriedParty.dresspheres`, which `applyCarriedState` adopted by reference —
the same object `BattleScreenSetup.carryPartyForward` hands to the *next* link
of a chain.

**One correction to `docs/handoff/builda-flow.md`'s note.** That note reported
"the Mortiorchis's `stats.maxHp` comes out of one run at 4,000, 3,000 or 1,000
depending on what ran before it" and Chapter 1's outcome changing with test
order. Measured here, that part does not reproduce: deep-freezing every shipped
record and playing all five chapters to an outcome throws nothing, and Chapter
1 at seed 1 already replayed identically in both orders with the other four
chapters in between. The decay the note saw is per-run and correct —
Mortibsorption walks `mount.stats.maxHp` down 4,000 / 3,000 / 2,000 / 1,000
*within* a battle (`scripted.ts:131`), on the combatant's own cloned stat
block. The sharing is real and was one write away from being exactly the bug
described — `advanceForm` writes `forms[n]`, `hp.ts` writes `part.stats.maxHp`
— it simply had not landed on an uncloned leaf yet. Both the identity audit and
the frozen-data run ship, so it cannot.

Tests: `tests/unit/battle-records-per-battle.test.ts`, 12 tests — the
five-chapter identity audit, four write-through demonstrations (FFX steal
table, FFX form overrides, FFX-2 forms + rewards, FFX-2 learned abilities), the
deep-freeze run of all five chapters, and the order-independence replay the
brief asked for, in both orders and for both games. **9 of the 12 are red on
the old code**; the three that were already green are the frozen-data run and
the two replays, which is the measurement above.

## 2. A killed tween settles — both games

`Tween.kill()` set `_killed` and fired nothing, so the promise
`TweenGroup.toAsync` had handed out was never settled and the caller awaited
for ever. That is the root cause of flow #01 ("Chapter 4 is won and then never
ends"), reported there and left for whoever owns `src/engine/Tween.ts`.

- `TweenOptions.onKilled` is new; `kill()` fires it exactly once, never after a
  completion, and killing twice is a no-op.
- `toAsync` registers it and **resolves** on that path. It never rejects: a
  dropped animation is not an error, and a rejection here would land as an
  unhandled rejection inside whichever `dispose()` did the killing.
- `killAll()` empties its array *before* killing, so an `onKilled`
  continuation that starts a replacement tween is not adding to a list being
  truncated under it.
- `Tween.killed` is a new getter.

**Why the promise resolves `void` rather than a "killed" result**, which is
what the brief asked for: every animation in `ActorHandle` / `CameraHandle`
(`src/engine/BattlePresenterPorts.ts`) is typed `Promise<void>`, and widening
`toAsync` was measured at **sixteen signatures across four files plus both port
interfaces and their fakes** — a cascade reaching `BattlePresenterPorts.ts` and
`BattleScreen.ts`, to carry a value the presenter does not read. The outcome is
reported through `onKilled` instead, which a caller that cares passes. The
`settled()` guards in `BattlePresenterEvents.ts` are untouched: they cover an
animation that *overruns*, which is a different failure.

Test: `tests/unit/engine-tween-kill.test.ts`, 7 tests, each written against a
**deadline** (`settlesWithin` races the promise against a timer) because on the
old code these hang rather than fail. **6 of 7 red on the old code.**

## 3. Chapter 1's intended line — 23 of 40 to 26 of 40, and the target was 34

Three changes in `src/engine/tactics/seymour-flux.ts`. The boss is untouched
and so is battle math; no data file was opened.

| | seeds 1-40 | 41-80 | 101-140 | 1001-1040 | **160 seeds** |
|---|---:|---:|---:|---:|---:|
| before | 23 | 26 | 24 | 24 | **97** |
| after | **26** | 21 | 24 | 29 | **100** |

1. **An aeon spends its one turn on its Overdrive** (§4.5, §5.7). The strike
   ladder knew three Overdrive labels and all three were the *party's*, so
   every summon fell through to the thrown-item rung: 35 Bahamut summons over
   forty seeds, 35 Fire Gems thrown by Bahamut, **Mega Flare cast zero times**.
   §5.7 prices that turn at 9,889–13,485 and calls a full sweep of them "the
   shape of the intended 'phase 2 burst' win". An aeon now short-circuits the
   party ladder entirely — it is the only *present* friendly actor while the
   party is frozen off-stage, so the Zombie cure and the wards were reasoning
   about a board it is not standing on. Below the Overdrive it throws a Gem
   rather than its Special: Meteor Strike / Aerospark / Heavenly Strike are
   Strength-formula power 16-17 against Defense 40 and measured 6 wins worse.
2. **Two aeons are held back until he crosses 50%** (§6 row 15, which says "in
   phase 2" in so many words; §4.4.2, where a summon is the only thing that
   postpones Total Annihilation). A reserve of 0 / 1 / 2 / 3 measures
   91 / 96 / 100 / 56 wins of 160 — a peak, not a slope, because phase 1 needs
   the stall too.
3. **Dispel his Reflect as a phase-2 rung** above the Silence rung rather than
   below the Cheer ladder (§6 row 8, §5.3). This is the "new home above step 6"
   step 7's comment has promised since §4.4.1's loop was fixed and never had.
   Worth 4 wins in 160.

**The brief asked for 34 of 40 and this is 26. That is a miss, not a rounding.**
What caps it, measured on this window rather than guessed: **`Full-Life` is 50
of the 110 party KOs.** Lance of Atrophy zombifies, the mount's very next
action kills, and at Agility 38 apiece the two enemy actors routinely take
those two steps with no party turn in between — the pairing this file's header
already names. Of 78 Cross Cleave casts only 88 damage events land, i.e. the
party is down to roughly **one standing member** by the time the party-wide hit
arrives. Phase 2 is no longer the wall: Shell coverage when Total Annihilation
lands is **92%** and it is down to ~348 a hit, ~1,740 for all five.

Measured and rejected on the way, each worse than the line above, so the next
pass does not re-walk them: party-wide Reflect off the six Star Curtains
(**33** of 160 — Full-Life *is* `reflectable` and it does bounce, but Dispel
strips the mirror every cycle and it blocks Yuna's own heals), benching Kimahri
the moment Mighty Guard is spent (91), benching Yuna when she is idle (85),
rebuilding the Cheer ladder after each death (93), buying Silence with a Wakka
swap (94), farming the Mortiorchis while its max HP is still decaying (98),
gating the Poison Fang opener on the party being safe (70), Grand Summon aimed
at the empty-gauge aeons instead of the full ones (level), and every
combination of the heal thresholds (`PARTY_HOLE` 900/1500/2500 x `TOPPED_UP`
0.85/0.95/1.0 — the shipped pair is already the best of the nine).
§6 row 11's **Haste on Seymour** is the one canon strategy still unreachable:
the shipped `haste` record is `targeting: 'single-ally'`, so the engine never
offers him as a target, and changing that is a data change touching every
chapter.

`tests/unit/strategy-seymour-flux.test.ts` records it honestly: three of the
four named seeds are documented losses now (1, 42, 20260916) where one was
before, and the forty-seed bound moves **22 to 25**. Both are true at once
because four seeds are a sample of forty — a 65% line drops three of any four
about one window in nine — and the aggregate is the assertion that guards the
chapter. The full before/after table and the rejected list are in the file.

Re-run and unchanged: Chapter 2 (`strategy-chapter2`), Chapter 3
(`strategy-braskas-final-aeon`, `chapters/possessed-aeons`), Chapter 4
(`strategy-ffx2-bahamut`), Chapter 5 (`strategy-ffx2-vegnagun-shuyin`) — 61
tests, all green, every intended line still winning and every wrong-tactic line
still losing.

## 4. The FFX-2 battle-start eyebrow is pink — FFX-2 only

`--ig-accent-deep` was **declared nowhere**. `battle-start-banner.css` read it
as `var(--ig-accent-deep, #a67c16)`, so the `CHAPTER IV · …` eyebrow fell back
to gold on an FFX-2 screen — visible in
`docs/screenshots/flow/battle-start-ffx2.png` and reported at the bottom of
`docs/handoff/builda-flow.md`. `src/ui/inkgold/tokens.css` now declares it on
`.ig` at **#a67c16**, the exact fallback the consumer already used, so FFX is
byte-identical, and repoints it on `.ig--ffx2` to `var(--ig-accent-on-paper)` —
**#b8437e**, the deep pink that block already ships — rather than a new shade,
because inventing a darker pink would put a colour on an approved screen Bailey
has not seen [hard rule 9].

Test: two in `tests/unit/inkgold.test.ts`'s `tokens.css` block, both red on the
old file. The first is general rather than a spot check — *every*
`--ig-accent*` role the base block defines must be repointed under
`.ig--ffx2`, so the next accent token added without an FFX-2 value goes red the
day it lands. (It also fixes a latent bug in that block's own slicing:
`css.indexOf('.ig--ffx2')` finds a mention in a comment, not the rule.)

**Still owed:** a screenshot of the FFX-2 card with a pink eyebrow. This pass
was told to keep browser work at zero, so `docs/screenshots/flow/battle-start-ffx2.png`
still shows the gold one and the end-state board still has no approved
`battle-start` tile.

## One test outside these four, and why it moved

`tests/unit/advisor.test.ts` went red on "puts a number on everything that has
one": with two aeons held back, Chapter 1's line reaches its Kimahri → Auron
hand-off often enough to top the advisor card with it at seed 4, and it
suggests `Dispel` in phase 2. Neither carries a damage figure, and neither
should — a switch hands the turn to somebody else and Dispel takes a status
off. So `Dispel` joins that test's `NUMBERLESS` list, and a top suggestion that
`isSwitch` is counted in `switches` (which the next test bounds) instead of in
`bare`. The card-design question the list's own note raises — whether a summon,
a party buff or a Dispel should carry a *forecast* instead of nothing — is
unchanged and still open for the advisor track.

## How it was proven

- `npx tsc --noEmit`: clean.
- `node tools/orphans.mjs`: `src/battle/common/clone.ts` is imported by both
  engines and does not appear.
- Targeted: `battle-records-per-battle` (12), `engine-tween-kill` (7),
  `inkgold` (25), `strategy-seymour-flux` (10), and the five chapter verifiers
  (61).
- Full suite: **3,928 passed, 1 failed** — `tests/unit/menu-cancel.test.ts`,
  the FFX-2 menu track's in-flight work, failing the same way it was already
  failing before this pass (see the fix-pass note above).
- No browser work: engine-level replay and unit tests only, as the brief asked.
