# RE parity RC10, lane FFX-N rows N2 and N3: Doublecast as two picks, each cast paid at its own cost check (FFX only)

Branch `re-parity-rc10-ffx-doublecast`, cut from `origin/r52-rc` (`3c92b60cc`). Written 2026-10-17 and 2026-10-18 by the lane (Sonnet sub-agents of the RE parity session; the first stopped on an expired login and
the second resumed from its commits). Paper preflight, written **before** the build (commit `be4500bb8` precedes `d6d9adf2a`; `critic-plan --paths` classes the change DEEP):
[re-parity-rc10-ffx-doublecast-review](../plans/re-parity-rc10-ffx-doublecast-review.md). Nothing here is deployed.

**Owner's words.** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-17 "keep going full speed". Decisions adopted: Q20 (the live check of Lulu's Doublecast MP) and Q21 ("Doublecast as two
separate picks (each its own spell and target)", the game's composition, yes after Q20, with a mockup of the pick flow first).

**Game case: FFX only.** Doublecast is Lulu's FFX command. `src/battle/ffx2`, `src/data/ffx2` and the FF7 engine are not touched; `ffx2-atb-golden` and `ff7-golden` are byte-identical
(`git diff 3c92b60cc..HEAD` on them, and on `ffx-engine-golden`, is empty).

## 1. What the game does (measured, not read)

`D:/Tools/ffx-parity/live/2026-10-17-live-session-4.md`, case 1, hypothesis H-B **[M]**: Lulu wore Half MP and chose Doublecast, then Fire, then Firaga. The pending MP read 2 and her MP went 452 -> 450 as Fire was
cast; the pending MP then read 8 and her MP went 450 -> 442 about 4.6 s later as Firaga was cast. **Each cast is paid at its own cost check, at its own spell's cost.** FFX-G07 finding 13 / open question 1
(who pays the first cast; the effect scripts were never read) is closed by that measurement. The pick screen is the other half: the menu closes one sub-action at each target pick, so a Doublecast is
spell 1 with target 1 and then spell 2 with target 2, and while spell 2 is chosen spell 1's cost is the menu's pending MP (FFX-G07 3.6, 3.11).

## 2. What the engine did before, and does now

**Before** (`doublecast.ts` at `3c92b60cc`): one spell, named by `AbilityCommand.wrappedId`, cast twice (at one target, or at two when `targets` held two ids). Each cast already ran its own cost check (Silence and
the MP again), its own range filter and its own payment (`applyMpDelta` of `mpCostFor(actor, spell)`), so for a pair of **one** spell the amounts and the timing were already the game's: Chapter XVIII's line
(D-694, `engine/tactics/sin-face.ts`: Doublecast Firaga while `mp >= 2 x Firaga`) relies on exactly that, and nothing the lane changes. What it could not do was two **different** spells, each with its own target.

**Now** (`src/battle/ffx/doublecast.ts`, 223 lines; `execute.ts` passes the command through; `types.ts` gains two optional names):

- **N2, the model.** `AbilityCommand.casts?: readonly [DoublecastCast, DoublecastCast]` (`DoublecastCast = { id, targets }`): spell 1 and target 1, spell 2 and target 2, in cast order. `castsOf` turns either shape
  into the two casts. The older shape (`wrappedId` + `targets`) is the **adapter**: it plans the same two casts it always meant (one target for both, or one each when two ids are given), with the same single
  engine-side draw for a self-only placeholder aim, so a pair of one spell is event for event the log it was. When both shapes arrive, `casts` wins.
- **N3, the MP.** Each cast is a sub-action: it prices **its own spell** with the caster's modifiers (Half, One MP, Magic Booster, Spellspring) at its own cost check, pays when it starts, and a second spell
  the MP that is left cannot pay does not start and pays nothing. Fire then Firaga costs 4 then 16 (2 then 8 under Half MP); Firaga then Fire costs 16 then 4, and at 19 MP the order decides which one fails.
- **Presentation.** Two different spells open one `action-start` / `action-end` bracket each (the Omnis volley's precedent), `abilityName` "Doublecast: Fire" then "Doublecast: Firaga", each announcing its own cast's
  targets, so the presenter plays the second spell's own effect. A pair of one spell keeps its single bracket. No shipped line submits a mixed pair (measured: 0 on 500 seeds), so no existing log has the second
  bracket. **The presenter was not run** (this lane never runs the game or the build); the claim is the event order, not the picture.
- **Bad picks.** A pick that is not Black Magic the caster has learned falls back to the strongest spell she can pay for twice (what the older shape always did; a headless-caller safety net, not game data); with
  none, "has no spell to double", nothing paid, a rank-3 turn.
- **For the picker**, `doublecastPicks(ctx, actor, firstId?)` (same file): every learned Black Magic spell with its `mpCost`, `first` (offered as pick 1: not Silenced, cost within the MP) and, when a first pick is
  given, `second` (offered as pick 2: first cost + this cost within the MP; `pendingMp`; `mpAfter`). It uses the kernel's `usableCost` with its pending-MP argument (the game's menu-side gate), which nothing used before.

## 3. Proof

Two test files, 29 tests, run in about a second each. The oracle is `tests/unit/helpers/ffxCommandRig.ts`, which restates the MP rule in its own terms and imports nothing from the kernels or the adapters; nothing
reads `doublecast.ts` to decide what is right (the expected payments, the MP left, which casts start, the order of the hits' elements and the brackets are worked out from the ability data and the rule in words).

`tests/unit/parity-ffx-doublecast.test.ts` (25 tests):

| Block | What it pins |
|---|---|
| the live case | Half MP, Fire then Firaga: payments 2, 8, MP 452 -> 450 -> 442; 4, 16 without; Firaga then Fire 16, 4; no hit lands before the first payment, Fire's hit lands between the two payments, and the second spell's hit after the second |
| marginal cases | 19 MP: Fire then Firaga leaves 15 and Firaga does not start; Firaga then Fire leaves 3 and Fire does not start; 20 MP pays both in either order; Silenced pays nothing |
| 700 generated scenes | two spells, Half / One MP / Booster / Spellspring, Silence, MP at the thresholds: the payments, the casts that start, the elements of the hits, the MP left and the brackets all equal the oracle's |
| the adapter | the older shape equals the two-pick form event for event (one target, two targets, too little MP, Silence, a killed target); a self-only placeholder never aims a foe spell at Lulu in either shape |
| brackets, targets, bad picks | the brackets; **each pick's own spell and own target** (Fire at one foe, Firaga at the other; each bracket announces its own cast's target); a killed target costs the second cast nothing; unlearned (a real Black Magic spell Lulu has not learned) and non-Black-Magic picks fall back; `casts` over `wrappedId`; one rank-3 turn |
| the picker | `doublecastPicks` equals the oracle over 300 pairs (cost, first, second, pending, MP left, the reasons) |
| a real turn | Lulu in Chapter XVIII submits Fire + Firaga through the engine: the payments equal the menu rows' own `mpCost`, in order |

`tests/unit/parity-ffx-doublecast-order.test.ts` (4 tests, added when the lane was resumed):

| Block | What it pins |
|---|---|
| the turn as one sequence | with two elements the hits say which cast they belong to: Blizzard then Thundaga is `pay 4, ice, pay 16, lightning` (the other order `pay 16, lightning, pay 4, ice`); with Half MP `pay 2, ice, pay 8, lightning`, 452 -> 442, and Fire then Firaga `pay 2, fire, pay 8, fire`; at 19 MP the sequence stops after the first cast |
| the picker and the engine agree | 400 generated scenes: whenever the first pick is legal, the picker offers the second spell exactly when the engine then starts it, and `mpAfter` is the MP the engine really leaves (a sum and a running balance, written apart) |

The four things the brief asked the tests to prove, and where: **2 then 8 with Half MP** (live-case block; order file); **4 then 16 without** (live-case block; the 700 scenes); **each payment at its own cast's cost check**
(the sequence block, the marginal cases at 19 and 20 MP, and the 700 scenes: the second price is judged against the MP the first payment left); **two independent picks with their own spell and own target**
(the targets test and the unlearned-pick test; the 700 scenes use two spells at once).

## 4. Mutation pass (24 faults; every one caught)

Each fault is one exact string replaced in one production file of a scratch copy of the tip, the lane's test files run, the file put back byte for byte (`mutate2.mjs`; checked after the run). 18 were planned by the
first agent and 6 added on the resume (M19 to M24). **Caught = at least one assertion failed.**

| # | Fault | Failed assertions |
|---|---|---:|
| M01 | the first cast is never paid | 17 |
| M02 | the second cast is never paid | 12 |
| M03 | the second cast pays the first spell's cost | 8 |
| M04 | the second cast has no cost check (starts with too little MP) | 6 |
| M05 | no range filter (a killed target is hit again and paid for) | 2 |
| M06 | a mixed pair never opens a second bracket | 4 |
| M07 | a pair of one spell also opens a second bracket | 3 |
| M08 | the two-pick field is ignored (the older shape is always read) | 18 |
| M09 | the casts resolve in reverse order | 14 |
| M10 | a two-pick aim skips the self-placeholder guard | 1 |
| M11 | a form that died in the first cast no longer cancels the second (Yunalesca) | 1 (`re-parity-ai-yunalesca`, which owns that rule) |
| M12 | the announced targets of one bracket repeat a target | 3 |
| M13 | the picker ignores the pending MP | 1 |
| M14 | the picker's MP left forgets the first cast | 2 |
| M15 | an unlearned Black Magic pick is accepted | 1 |
| M16 | the picker never says Silenced | 1 |
| M17 | the first bracket announces both casts' targets for a mixed pair | 1 |
| M18 | a payment of 0 or 1 MP is skipped | 1 |
| M19 | each cast pays the printed cost, not the caster's price (Half MP and the others ignored) | 2 |
| M20 | a cast is paid after its hits land instead of at its cost check | 2 |
| M21 | `execute.ts` drops the command's two picks on the way in | 18 |
| M22 | the second cast is aimed at the first cast's target | 2 |
| M23 | the picker's MP left forgets the second spell's own cost | 2 |
| M24 | a second bracket opens before the second cast's cost check (it opens for a cast that never starts) | 2 |

The order file alone catches M01 to M04, M08, M09, M13, M14, M18 to M21 and M23 (13 of 24); the other 11 are the first file's. An unmutated run of the three files first passed 66 of 66.

## 5. Measurements (FFX has no decision-time pace: it is CTB, so the shipped line `intendedStrategy` is the pace; whole event logs hashed per link)

Base `origin/r52-rc` `3c92b60cc`, against the tip. A digest of every link's whole event log (JSON, every field), seed by seed, over each chapter's whole chain.

**12 seeds of every FFX chapter** (the twelve listed, Mirror Aeons among them, the three hidden ones: Sinspawn Gui, Biran and Yenke, Evrae with FFX's camera, and the hidden Chapter 28, The Last Summoning, run as a
second small batch): **192 of 192 seeds have a byte-identical event log in every link** (180 of 180 in the first batch, whose two result files are byte-identical, and 12 of 12 for Chapter 28). The chapters that
never Doublecast (14 of 16) are therefore unchanged by measurement as well as by construction. Doublecasts by chapter on those 12 seeds: Chapter III (Braska's Final Aeon) 304, Chapter XVIII (Sin, the face) 157, every
other chapter 0; mixed-spell pairs 0.

**500 seeds of the two chapters that Doublecast** (Chapter III 12,475 Doublecast commands over the 500 seeds' chains, Chapter XVIII 6,529; every seed has some):

| Chapter | Wins | Party turns (mean) | Party KOs (mean) | Identical logs | Mixed pairs |
|---|---|---|---|---|---:|
| III, Braska's Final Aeon | 479 -> 479 of 500 | 232.1 -> 232.1 | 5.4 -> 5.4 | 500 of 500 | 0 |
| XVIII, Sin, the face | 500 -> 500 of 500 | 45.3 -> 45.3 | 0 -> 0 | 500 of 500 | 0 |

**500 seeds of the other thirteen chapters** (the listed chapters but III and XVIII, Mirror Aeons among them, and Sinspawn Gui, Biran and Yenke and Fayth; 6,500 chains): **6,500 of 6,500 identical in every link**, the two
result files byte-identical, win counts unchanged in every row (Flux 500, Yunalesca 453, Anima 470, Evrae 488, Yojimbo 493, Natus 483, Omnis 462, Isaaru 452, Sin's Fins and Core 432, Mirror Aeons 365, Sinspawn Gui 496, Biran and
Yenke 500, Fayth 488 of 500), party turns and KOs unchanged to the decimal, and **0 Doublecast commands in any of them**, so the new code is never entered there.

**Causes of the moves: none moved, so there is nothing to explain in player words.** The reason is the design: both shipped lines submit one spell twice (`wrappedId`), which the adapter reads as the same two casts, and the
cost check and the payment of each cast were already per cast (section 2). To show the measurement can see a move, the same 12 seeds were run on a copy of the tip with fault M02 (the second cast is never paid):
**0 of 12 logs identical in both Doublecasting chapters**, and Chapter XVIII's mean party turns 45.5 -> 44.1 (the fight is won faster once Lulu's second cast is free). So an unchanged digest is a real result.

Existing files run green on the tip: `ffx-doublecast-aim`, `ui-ffx-doublecast-menu`, `parity-ffx-engine-command`, `parity-ffx-command-gate`, `re-parity-ai-yunalesca`, `re-parity-ai-yu-yevon`, `chapters/omnis-bench`, and the three goldens: **`ffx-engine-golden`, `ffx2-atb-golden` and `ff7-golden` are not re-pinned** (nothing moved, so there is no cause to write).
`tsc --noEmit` clean; `node tools/orphans.mjs` lists 26 orphaned modules, none of them a Doublecast file (this lane adds no module that nothing imports). The full suite was not run (the brief: once, at the end, by the driver).

## 6. What the HUD needs from the engine (the release driver's mockup-first job; no UI file is touched here)

1. **Already there:** the Doublecast wrapper row (`wrapsCategory: 'blackmagic'`) and the Black Magic rows with `mpCost` (per spell, modifiers already applied: Fire 2 and Firaga 8 under Half MP), `enabled`,
   `disabledReason`, `validTargets`, `targeting`, `preferredTargets`; `predictTurnOrder(n, previewCommand)` already prices a Doublecast as the fixed rank 3.
2. **New: the command to submit.** `{ kind: 'ability', id: 'doublecast', targets: [], casts: [{ id: spell1, targets: [t1] }, { id: spell2, targets: [t2] }] }` (`targets` is required by the type; pass `[]`).
   The old `wrapCommand` shape keeps working.
3. **New: pick 2's list.** The second pick shows the same Black Magic rows but each judged with the first cast's cost as pending MP. `doublecastPicks(ctx, actor, firstId)` returns it (per spell: `mpCost`, `first`,
   `second { enabled, reason, pendingMp, mpAfter }`), enough for the whole MP trail ("452 -> 450 -> 442") the mockup can show with real numbers. **It needs a seam to reach the UI** (the UI holds a `Decision`, not
   a `Ctx`); three ways, the driver's call: (a) a method on `FFXBattleEngine` (additive, with a contract entry), recommended because `FFXEngine` already holds the context; (b) a field on the wrapper row; (c) the UI
   adds `first.mpCost + row.mpCost <= MP` itself from the rows it already has (the rule is a sum, but it is then the UI re-deriving legality, which `CommandMenuLogic` says it never does). The order file pins that the
   picker's answer and the engine's behaviour agree on 400 scenes, so whichever seam is chosen can trust the function.
4. **Targets per pick:** each pick opens its own spell's target step from that spell's row. Pick 2's list is not narrowed by pick 1 (it is a fresh target step in the game); the engine re-filters when the second
   cast starts, so a foe the first cast killed drops the second cast and it costs nothing. The picker may want to say so.
5. **What the presenter gets:** `mp-damage` (source Lulu) at each cast, between the hits, so the MP bar drops in two steps; for two different spells two brackets with `abilityId` / `abilityName` "Doublecast: Fire"
   then "Doublecast: Firaga" (so the ability banner will show twice in a row; not run).
6. **Cancel is free:** nothing is paid or committed until `submit`, so backing out of pick 2 to pick 1, or out of the wrapper, needs no engine call.
7. **Not wired, and a gap in today's flow:** `availableCommands` does not apply the pending-MP gate, so today's picker offers Firaga at 16 to 31 MP and the second Firaga then fails at its own cost check (one Firaga is
   cast). In the game the second pick would not have been offered. The two-pick picker closes it; the older flow keeps the behaviour it had.

## 7. Open items and disclosures

1. **The two-pick HUD is not built** (AGENTS.md rule 9: a mockup and Bailey's yes first; the driver's job). Until then the on-screen menu still asks for one spell and uses it twice, so **no player sees a change**.
2. **The seam for `doublecastPicks`** (section 6, item 3): the driver's call.
3. **Not run, not measured on the Steam copy:** (a) the presenter with two brackets (the second spell's own animation; the Omnis volley is the precedent); (b) what the game does when Doublecast is chosen with MP
   for only one spell (pick 2 would have nothing to offer): the engine casts the first spell alone and the turn still costs the rank-3 recovery, **inferred**; (c) a target the first cast killed: the engine drops the
   second cast and charges nothing (the sub-action range rule of RC7), **inferred for Doublecast**, not live-checked.
4. **The bad-pick fallback** (the strongest spell Lulu can pay for twice, then "has no spell to double") is a headless-caller safety net kept from the older code, not game data.
5. **The shipped lines still Doublecast one spell twice** (Chapter III's advisor line and Chapter XVIII's). Whether the advisor should now pick a mixed pair (for instance an elemental weakness plus a stronger
   spell) is new gameplay: it needs Bailey's yes (rule 10) and was not touched. Chapter XVIII's own rule `mp >= 2 x Firaga` is still the right arithmetic.
6. **Merge hot spots:** `src/battle/ffx/doublecast.ts`, `execute.ts` (one call line), `src/battle/common/types.ts` (`AbilityCommand`), `docs/CONTRACT-CHANGES.md` (an entry exists).
7. **A leftover folder of the first agent's:** `D:/Tools/ffx-parity/tmp/ffx-doublecast` (208 MB: scratch trees `base` and `after` with `node_modules` **junctions**, vitest temp). It was not this resume's folder, so it was
   left. To remove it, `cmd /c rmdir` the two junctions (`base\node_modules`, `after\node_modules`) first, never a recursive delete through them.
8. Nothing else is owed: no FFX-2 or FF7 file, no golden, no number retuned.

## 8. CHANGELOG paragraph (plain words; for the main session to paste, not edited into `CHANGELOG.md` here)

- **FFX, Lulu's Doublecast (the battle engine only; the menu is unchanged for now):** in the game a Doublecast is two separate choices: a spell and its target, then a second spell and its target, and each spell's MP
  is taken when that spell is cast, at that spell's own price. We measured it on the Steam copy: Lulu with Half MP chose Doublecast, then Fire, then Firaga, and her MP went 452, then 450, then 442 (2 for Fire, 8 for
  Firaga). The engine now plays exactly that. Fire then Firaga costs 4 then 16 (2 then 8 with Half MP), Firaga then Fire costs 16 then 4, and a second spell the MP that is left cannot pay is not cast and costs nothing,
  so with 19 MP the order decides which of the two you get. Two different spells show as two banners in a row ("Doublecast: Fire", "Doublecast: Firaga"). The two-choice menu itself waits for a mockup and your yes, so
  today the menu still asks for one spell and casts it twice, and nothing you can see changes: Chapter III and Chapter XVIII, the two fights whose line uses Doublecast, play event for event as before on 500 seeds
  each (479 and 500 wins, as before), and every other FFX chapter, which never Doublecasts, plays event for event as before too (12 seeds each, and 500 seeds each for the thirteen listed above). One difference from the game remains until that menu lands: with 16 to 31 MP the
  menu still offers Doublecast Firaga, the first Firaga is cast and the second is not (the game would not have offered the second choice). FFX only: Doublecast is Lulu's FFX command.

## 9. Re-run commands (repo root of the worktree; Node 24; TEMP and TMP on D:, here the per-lane folder `D:/Tools/ffx-parity/tmp/ffx-doublecast2`, deleted at the end)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .
TEMP=D:/Tools/ffx-parity/tmp/ffx-doublecast2 TMP=D:/Tools/ffx-parity/tmp/ffx-doublecast2 node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/parity-ffx-doublecast.test.ts tests/unit/parity-ffx-doublecast-order.test.ts
TEMP=... TMP=... node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts
node tools/orphans.mjs
```

Tooling outside the repo, kept in `D:\Tools\ffx-parity\rc10\ffx-doublecast\` (`zz-digest.test.ts`, `run-digest.sh`, `digest-compare.mjs`, `digest-md.mjs`, `mutate2.mjs`, `apply-mutant.mjs`, `retarget.mjs`,
`mutants.json` M01 to M18, `mutants-extra.json` M19 to M24, and the result files `mut-1.json`, `mut-2.json`, `mut-order.json`, `base-12.json`, `tip-12.json`, `base-12-ls.json`, `tip-12-ls.json` (Chapter 28), `sens-12.json` (the M02 sensitivity run), `base-500-dc.json`, `tip-500-dc.json`, `base-500-other.json`, `tip-500-other.json`): copy a tree with
`git archive <ref> src vitest.config.ts package.json tsconfig.json | tar -x -C <dir>` (add `tests` for the mutation runs), junction `node_modules`, put the digest test in `<dir>/tests/unit/`, run it with
`ZZ_SEEDS=1-500 ZZ_OUT=<file>` (and `ZZ_CHAPTERS=a,b`), then compare the two JSON files with `digest-compare.mjs`. The mutants are one exact string each, run in a scratch copy of the tree, never in a shared worktree.
