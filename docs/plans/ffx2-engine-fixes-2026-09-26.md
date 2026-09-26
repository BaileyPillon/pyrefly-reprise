# FFX-2 engine fixes, 2026-09-26: all-target hits (IC-2) and immune hits in a chain (IC-1)

**Game case: FFX-2 only** (AGENTS.md rule 14). The FFX engine resolves its own actions
(`src/battle/ffx/**`) and nothing here touches it. Branch `ffx2-engine-fixes-0926`, worktree
`D:/pyrefly-ffx2-engine-0926`, based on main `ea05f877`. **Not pushed, not deployed. Needs Bailey's
pick before it is merged** (section 6).

## 1. The two issues

They come from the independent check of Chapter XV (`chapter-gippal-ship-0925`, `0ec2e6a3`). Both
are on main as well.

- **IC-2.** `resolve.ts` `targetForHit` picked `living[hitIndex % living.length]` for an all-target
  move, and re-filtered that list after every hit. When a target died partway through the move,
  the later hits wrapped round onto a girl who had already been hit, and the last girl in the list
  was never hit. Seen live: Lightfall hit Yuna (immune), then Rikku (KO), then Yuna again; Paine
  was never hit. It works the same way against enemies: a party-wide move that killed one enemy
  moved that enemy's remaining strikes onto the others.
- **IC-1.** A girl left standing alone gets chain-locked. `resolve.ts` calls `registerHit` before
  it checks damage and immunity, so a hit that does nothing (an Invincible Yuna) still opens or
  extends her chain window. The window is 6,000 ticks and Nooj's bar is 5,737 ticks, so the window
  never closes and she sits with a full gauge while Nooj acts five or more times.

## 2. Sources and their status (`research/ffx2-combat-core.md` §9, commit `ea05f877`)

| Question | Answer | Status |
|---|---|---|
| A single-hit all-target move hits each character once | Yes. SinirothX 31807, Split_Infinity 25872, FF Wiki rev 3998493 | `[verified: 3 sources]` |
| A target dies partway through the move | Its hit is lost, and nothing moves to another character. This is the per-target definition's reading | **unsourced** (inference from the definition) |
| Random-target multi-hit moves roll each hit among the target group | Yes | `[verified: 3 sources]` |
| A **miss** feeds a chain | No | `[verified: 3 sources]` |
| An **immune / Invincible** hit feeds a chain | No source says. Split_Infinity's "will fail" is the nearest wording | **unsourced**; "no" is `[estimate]` |
| A hit slows the victim's gauge; an action takes time | Yes, but no amount is published | recorded as an open gap, not built |
| **Acta Est Fabula's target** (found by this measurement, section 4) | "both Redoubts": Full revive + full HP | `research/ffx2-vegnagun-shuyin.md` §3.4, `[verified: 2 sources]` |

## 3. What changed (all FFX-2 only)

1. **IC-2, fixed (sourced).** In `resolve.ts` `targetForHit`, hit `t` of an all-target move now
   belongs to `pool[t]`. The pool is taken once, when the action starts. If that target has been
   KO'd, the hit is **skipped**: it is not handed to anyone else (the conservative reading, at
   most once per target per strike). Random-target moves keep their per-strike roll among whoever
   is still standing. Single-target moves are unchanged. The RNG draw order is unchanged.
2. **IC-1, unsourced, so behaviour is unchanged.** The alternative is built as a named **OFF**
   switch: `constants.ts` `IMMUNE_HITS_SKIP_CHAIN = false`, with an engine option
   `immuneHitsSkipChain` for measuring. When it is on, the chain count is peeked
   (`chain.ts` `peekChainCount`) and only a non-immune result registers. With the switch off, the
   default path's event log is byte-identical: `computeDamage` is pure, so the chain event still
   comes before the damage event.
3. **Acta Est Fabula targets the Redoubts only (sourced, boss-side, Bailey's call).** Acta is an
   `all-allies` row, so it also hit its caster: the Vegnagun Head healed itself for **9,999 every
   cast**, although the source's target is "both Redoubts". The IC-2 wrap had hidden this, because
   a Redoubt dying to Black Sky used to send its remaining strikes onto the Head. The row now
   carries `extra.namedTargetsOnly`. `resolve.ts` then hits only the ids the Head's script names,
   while `constants.ts` `NAMED_TARGETS_ONLY` is on. **It is on in this branch**, and
   `namedTargetsOnly: false` restores the old target set. No boss number moved.

Tests: `tests/unit/ffx2-all-target-hits.test.ts` runs the real resolver. The IC-2 cases failed
first, before the fix (Ultima `[2, 1, 0]`, Sword Dance `[4, 1, 1]`), and pass after it. It also
checks random-target moves, the IC-1 switch off and on, the chain count inside an open window,
and Acta on and off. The bench is `tests/unit/ffx2-engine-fixes-bench.test.ts`
(`PYREFLY_MEASURE=1`). These tests were re-pinned, and each one explains its move in place:
`ffx2-atb-golden`, `ffx2-hit-closes-menu`, `strategy-ffx2-bahamut` and `combat-fixes-bench` (a).

## 4. Every FFX-2 chapter, before and after (200 seeds a row)

"Human" is the live default, the Wait split: 1.5 s per menu, 0.5 s of it on the top-level list.
"Bench" is zero decision time. "Within 5" is the chapter's own retry bench where it has one
(XV, which retries from Baralai). Everywhere else it is 1-(1-p)^5, computed from the first-try
rate. **Before** is the same bench file run on `ea05f877`. **After** is this branch (IC-2 fix plus
Acta on the Redoubts). XV comes from branch `chapter-gippal-ship-0925` at `79434a56` with this
engine patch applied; section 7 explains how.

| Chapter | Human first try, before -> after | Human within 5 | Bench, before -> after | Event logs that move (human / bench) |
|---|---:|---:|---:|---:|
| IV Bahamut | 200 -> 200 (100 %) | 100 % | 200 -> 200 | 0 / 0 |
| V Vegnagun + Shuyin | 159 -> **175** (79.5 -> 87.5 %) | 100 % | 187 -> 188 | 197 / 200 |
| VI Leblanc | 158 -> 159 | 100 % | 194 -> 195 | 54 / 27 |
| XI Fallen Aeons | 159 -> 157 (79.5 -> 78.5 %) | 100 % | 174 -> 174 | 176 / 184 |
| XIII Trema | 16 -> 16 (8.0 %) | 34.1 % | 15 -> 14 | 34 / 29 |
| XV Den of Woe | 39 -> **34** (19.5 -> 17.0 %) | 160 -> **149** (80 -> 74.5 %) | 102 -> 94 (within 5: 199 -> 196) | not hashed |

**Chapter V with the IC-2 fix alone (Acta as it was): 0 / 200 at both speeds.** Every run loses at
the Head. Black Sky and Darkness now give the Head one hit per strike instead of the Redoubts'
wrapped share. The Head casts Acta Est Fabula about 134 times, each cast heals it 9,999, and
Mors Certa wears the party down (seed 1: 1,252 s in the Head link). With Acta on the Redoubts only
and the old wrap, Chapter V is 175 / 200 human and 186 / 200 bench. So the Acta change is what
lifts V's human rate, and the IC-2 fix on top of it is neutral there (175 / 188).

**IC-1's switch** (immune hits open no chain), measured on top of the branch: IV, V, VI, XI and
XIII do not change (identical rows). XV human goes 34 -> **48** (24 %), within 3 / 5 is
133 / 171, and bench goes 94 -> 112.

**What gets harder:** XV by 2.5 points at human pace (5.5 points within 5), and XI by 1 point
(2 seeds, noise-sized). Chapter IV's heal-only route (not shipped) goes from 27 / 30 to 1 / 30;
see "Chapter IV" below. **What gets easier:** V by 8 points, entirely from Acta. No chapter
drops below 1 in 10 because of the fix. **Trema (XIII) was already at 8 % before** and does not
move. That is a separate, existing question, not caused by this work.

### Golden logs that move

Every move was checked against the old engine with a throwaway probe. Each moved seed's first
differing event comes right after a KO inside an all-target action: a Bulwark dying to Black Sky,
a girl dying to the Tail, a Node, the Leg, or the Leblanc Ormi's party-wide move. The rest come
from Acta's target set.

- `ffx2-atb-golden.test.ts`: `CH5_D0` all 20 seeds move (every seed casts Acta 5-6 times, and 2
  also hit IC-2); D = 0 is still 20/20. `CH5_D1500`: 9 of 10 seeds move. Seed 6 has neither case
  and does not move. Wins go 0 -> 1 (seed 7). `CH4_D0` and `CH4_D1500` do not move.
- `ffx2-hit-closes-menu.test.ts` PINNED: Chapter V seeds 1-3 (same as `CH5_D0`) and Chapter VI
  seed 3 (IC-2, Ormi) move.

No guide states the old behaviour, so no guide changed. No boss number changed.

### Chapter IV: the shipped line is unchanged, but two lines that are not shipped move

The shipped Chapter IV line (Shell + Breaks) is unchanged: 200 / 200 at both speeds, and no golden
log moves. Two lines that are not shipped lost the wrap's help. In the old engine, Mega Flare
killed Rikku partway through the move, and its third hit then wrapped onto Yuna, so Yuna was hit
twice and Paine was never hit. Now each girl is hit once. Rikku and Paine fall, and the White Mage
Yuna is left standing alone. She has no Attack row.

- `strategy-ffx2-bahamut.test.ts`, **heal-only route** (no Shell, no Breaks), one of §2.4's three
  researched routes: **27 / 30 wins -> 1 / 30**. The other 27 runs stop undecided with Yuna alone,
  because this harness allows no spherechange. A real player could spherechange Yuna to Gunner and
  keep shooting, so the route is not proven dead. But the "Paine finishes him" ending came from
  the wrap. The Shell route and the Magic Break route stay at 30 / 30. Bar re-pinned 20 -> 1, with
  the reason in the test.
- **Mash-Attack line** (strategy test and `combat-fixes-bench` (a) "wrong"): it still never wins
  and still leaves most of his HP on him (5,408-5,455). But it no longer ends in a wipe: it was
  200 defeats and is now 200 undecided (the lone White Mage). The assertions now check "no
  victory, most HP left, both damage dealers down". "Whole party down by Mega Flare" is gone.
- For Bailey, and for the research: §2.4 says heal-only survives Mega Flare, and that still holds
  for Yuna. What changes is who is left alive afterwards. It is worth a look in the real game
  before anything is built on it (for example a guide line such as "if only Yuna is left,
  spherechange").

## 5. What stays open (not built: no number is published)

- A damaging hit slowing the victim's gauge (2 sources, amount unpublished).
- The length of action time (E4, 2 sources, length unpublished).
- Whether a random-target hit can land on a KO'd girl (unsourced; the engine excludes the KO'd).
- Whether an immune or Invincible hit staggers (IC-1). Bailey's word or a real-game look in the
  Steam HD Remaster would settle it.

## 6. Options for Bailey

- **A. Ship the IC-2 fix as it is (Acta unchanged).** It is sourced, but **Chapter V becomes
  unwinnable (0 / 200)**. Not shippable alone.
- **B. Ship the IC-2 fix together with Acta Est Fabula on the Redoubts only.** This is the
  branch as built, and **the recommendation**. Both changes are sourced. V: 175 / 200 human
  (+8 points), 188 bench. XV: 17 % first try, 74.5 % within 5 (-2.5 / -5.5 points). XI: -1 point.
  Nothing new falls below 1 in 10, so no kit answer is needed. Chapter IV's shipped line does not
  change. Its heal-only route (not shipped) drops to 1 / 30 in a harness that allows no
  spherechange.
  - **B + IC-1's switch** (also turn on `IMMUNE_HITS_SKIP_CHAIN`): XV 24 % first try, 85.5 %
    within 5, and nothing else changes. This is **our reading** of Split_Infinity, not a source.
    It needs Bailey's word or a look in the real game before it is turned on.
- **C. Keep the old behaviour.** This is wrong on the sources: a party-wide move hits a girl twice
  and skips another (IC-2, contradicting three sources), and the Vegnagun Head heals itself 9,999
  from a move whose source targets only the Redoubts. The old numbers only looked balanced because
  the two errors cancelled out in Chapter V.

## 7. How XV was measured

`chapter-gippal-ship-0925` does not merge cleanly into this branch. It has conflicts in
`src/data/chapter-meta.ts`, `src/data/chapters-unlisted.ts` and `src/data/encounters.ts`, so it was
**not merged**. XV was instead measured in a scratch export of `79434a56` (`git archive`, outside
the repo, deleted afterwards): the unmodified engine first, then with this branch's
`src/battle/ffx2` patch applied. It used that branch's own driver (`denOfWoeDrive.ts`), its shipped
kit and line, 200 seeds, and within 3 / 5 retried from Baralai, as its shipped bench does. Once both
branches are on main, re-run `den-of-woe-shipped-bench.test.ts`.

## 8. Independent check, 2026-09-26 (a separate agent that did not build this branch)

**Game case: FFX-2 only.** Checked branch head `71974277` against main `ea05f877`. Every number
below was re-run, none was copied. The runs used scratch exports on D: (`git archive` of
`71974277`, `ea05f877` and `79434a56`), and those exports are deleted. Nothing was pushed or
deployed. NOW.md, critic/ and the main tree were not touched.

### Verdict

- **The IC-2 fix is right and goes no further than the sources.** Hit `t` of an all-target move
  now belongs to `pool[t]`, taken once when the action starts. A target KO'd partway is skipped,
  and nothing is redirected. Random-target and single-target moves are unchanged. This matches
  `research/ffx2-combat-core.md` §9.1. Skipping, rather than redirecting, when a target dies
  partway is correctly labelled our reading.
- **Acta Est Fabula on the Redoubts is sourced, and no boss number moved.** §3.4 says "both
  Redoubts", and the Head's script already names exactly the two Redoubts (`ai/vegnagun-head.ts`).
  The switch filters only on those ids. No power, HP, stat or timer changed.
- **IC-1 ships OFF, and the sheet says honestly that it is unsourced.** The code change is safe
  with the switch off: `computeDamage` takes `chainCount` as an argument and is pure, so moving
  the `chain` emit after it changes no default log. Chapter IV's 400 logs are unchanged at both
  speeds, which confirms this.
- **Blocker: the full unit suite is not green, and the change causes it.** See B1 below.

### Re-run results

| Check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `tools/orphans.mjs` | 24, the same as `ea05f877` |
| `ffx2-all-target-hits.test.ts` on the branch | 11 / 11 pass |
| The same file with `targetForHit` reverted to the old wrap (scratch copy) | the 3 IC-2 cases fail: Ultima `[2, 1, 0]` twice (boss side and party side), Sword Dance `[4, 1, 1]`. The other 8 pass. Restored afterwards, and the copy is byte-identical to the branch |
| Full vitest `--testTimeout=60000` | 429 passed, 4 skipped, 8,016 tests, **exit 1**: `audio-fade-units.test.ts` never finishes (see B1) |
| Bench, before (`ea05f877`) | IV 200/200, 200/200 · V 159, 187 · VI 158, 194 · XI 159, 174 · XIII 16, 15. **Exact** |
| Bench, after (branch) | IV 200, 200 · V 175, 188 · VI 159, 195 · XI 157, 174 · XIII 16, 14. **Exact** |
| `ic2-only` arm (Acta's old target set) | V 0 / 200 at both speeds. **Exact** |
| Acta on the Redoubts with the old wrap (scratch revert of `targetForHit` only) | V 175 human, 186 bench. **Exact** |
| Event logs that move vs `ea05f877` (per-seed hashes compared) | IV 0 / 0, V 197 / 200, VI 54 / 27, XI 176 / 184, XIII 34 / 29. **Exact** |
| IC-1 switch arm | IV, VI, XI and XIII logs are identical to the built arm. **V's wins are identical, but 13 / 6 of V's logs move** (human / bench; average minutes 4.85 -> 4.86 at bench). Section 4's "identical rows" holds for wins only |
| XV (`79434a56`, and the same with this branch's `src/battle/ffx2` patch; shipped line, retry from Baralai) | human 39 -> 34, within 3 115 -> 102, within 5 160 -> 149; bench 102 -> 94, within 5 199 -> 196. With the switch on: 48, 133 / 171; bench 112. **Exact** |
| `strategy-ffx2-bahamut` routes, base -> branch | heal-only 27 / 30 -> 1 / 30. Shell and Magic Break stay 30 / 30. Mash seed 1 goes from a defeat with 3,718 HP left on Bahamut to undecided with 5,408 left. **Exact** |

### Blocker

- **B1. `audio-fade-units.test.ts` runs out of memory on this branch. It passes on main in about
  40 ms.** The builder's notes call this crash "unrelated test-runner noise", but it is caused
  by the change. The file's first test drives the real Chapter IV fight (`ffx2-bahamut`, seed 1)
  through `BattlePresenter` with no HUD. With no HUD the presenter picks `firstEnabled` for every
  command, and the loop has no decision cap. On `ea05f877` the fight ends in a defeat after about
  170 decisions: Mega Flare's wrapped hit killed Yuna. On the branch, Mega Flare hits each girl
  once, so Rikku and Paine fall and the White Mage Yuna is left alone. Mega Flare does about 527
  to her (MDef 132), and Bahamut spends his other turns on the countdown. Once her MP is gone,
  Vigor (about 340 a cast) keeps her up forever. Probe on seeds 1 to 5: no outcome after 20,000
  decisions, 3,368 Vigor casts, and Bahamut still on 4,924 to 5,436 HP. The event log grows until
  the worker hits the 4 GB heap limit and exits with code 134. With `targetForHit` reverted, the
  file passes again, so the IC-2 fix alone is the cause.
  - The run exits 1, so `npm test` is red, and "full `npm test` before any push" (AGENTS.md,
    "Done means") fails. The summary line "429 passed" hides it: 429 + 4 skipped is 433 of 434
    files.
  - The engine fix itself is not wrong. This is the same lone White Mage the sheet already
    describes for the heal-only route. But the branch needs one of the following before it merges:
    (a) the test drives a fight that reaches a decision (a strategy, a different chapter or seed,
    or a cap on the presenter loop in the test), or (b) Bailey rules on the stalemate first.
    The shipped line and the e2e specs play `intended`, which still wins 200 / 200, so no player
    path hangs. `window.__pyrefly.autoBattle('defend' | 'attack' | 'random')` on Chapter IV could
    run without end. That is a debug path only, and it was not run here.

### Findings that do not block

- **F1.** Section 4 says the IC-1 switch leaves the other chapters "identical rows". That is true
  of wins, but Chapter V's logs move on 13 human / 6 bench seeds (see the table).
- **F2.** Add to section 6, for Bailey: under option B, a lone White Mage Yuna cannot be killed by
  Bahamut, and she cannot kill him without a spherechange. The fight turns into a stalemate the
  player must break, which the old wrap hid. Whether a lone White Mage outlasts Mega Flare in the
  real game is unsourced, and it is worth one look in the Steam HD Remaster before anything is
  built on it.
- **F3.** `resolve.ts` is 485 lines (it was 469) and `engine.ts` is 636 (it was 634). Both were
  already over the 400-line house rule, and this branch adds 18 lines.
- **F4.** Outside this change, not touched: the data layer has a second Acta row,
  `x2-vegnagun-acta-est-fabula` (`src/data/ffx2/enemies/shuyin-abilities.ts`), with
  `misses-if-target-alive`. The engine plays its own row, `acta-est-fabula`
  (`abilities-shuyin.ts`), which carries the new key. If a later change routes the data row
  into the engine, the Head-heal question comes back in a different form.
- The re-pinned golden logs (`ffx2-atb-golden` CH5 x2, `ffx2-hit-closes-menu` V and VI seed 3) are
  covered by the log-movement counts above: CH4 unchanged, CH5 D1500 seed 6 unchanged
  (`0fa90654a8923b1e`, the same as before). Each re-pin has its reason written in the test. The
  relaxed assertions in `strategy-ffx2-bahamut` (mash no longer "must reach a decision" or "whole
  party down") and in `combat-fixes-bench` (a) ch4 "wrong" are explained and match the reproduced
  runs.
