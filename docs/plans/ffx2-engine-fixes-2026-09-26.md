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
  - **B + the menu-cancel correction** (section 9, sourced, built OFF): only a Delay or
    Action-cancel ability closes an open menu. Recommended with B; see section 9.5.
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

## 9. B1 closed, and the menu-cancel correction measured (2026-09-26, later)

**Game case: FFX-2 only** (the menu-cancel rule and the chapters are FFX-2's; the test cap in 9.1 is
shared test plumbing and touches no game code). Nothing pushed or deployed; NOW.md and `critic/` not
touched; the main tree was only read (`research/ffx2-combat-core.md` §9 at `ea05f877`).

### 9.1 B1: the test, not the engine

- `tests/unit/audio-fade-units.test.ts` (the Chapter IV chain test) now plays the chapter's own
  line (`intendedStrategy`) through the real presenter, under a player-decision cap. The cue it tests
  is played before the first decision, so nothing about the audio check changed. It also asserts the
  fight ended by victory or defeat, not by the cap. Proven both ways: with the line it passes in
  about 50 ms; with the old first-enabled line the cap aborts the stalemate after 5,001 decisions in
  about 0.3 s and the test fails loudly, where it used to exhaust the 4 GB heap.
- The cap is `tests/unit/helpers/presenterCap.ts` (`setCappedAutoPlay`, 5,000 player decisions, then
  it aborts the presenter). The presenter's own loop guards only against livelock (no events) and
  against one actor being offered the same turn forever; a fight that keeps emitting events and
  never ends has no bound.
- **Every loop that plays a fight to its end, checked:**

  | Where | Loop | Cap before | Now |
  |---|---|---|---|
  | `audio-fade-units.test.ts` (Ch. IV chain) | presenter, real FFX-2 engine, no strategy | none (B1) | intended line + cap |
  | `audio-chain-entrance-owner.test.ts` | presenter, every chapter, intended | none | cap added |
  | `flow-encounter-chain.test.ts` (2 sites) | presenter, every chapter / Ch. IV, intended | wall-clock deadline only | cap added |
  | `presenter-vitals-sync.test.ts` `playChapter` | presenter, FFX and FFX-2, intended | HUD aborts on a stuck sync only | cap added |
  | `ffx2-berserk-zero-rows.test.ts` | presenter, Ch. IV, 32 seeds | none (asserts "not aborted", so a cap hit fails) | cap added |
  | `chk023-runtime-proofs.test.ts` | presenter, FFX Yu Yevon only | none | unchanged: FFX engine, no IC-2 path |
  | `presenter-vitals-hp-ceiling.test.ts` | presenter | its strategy aborts | unchanged |
  | `presenter-playback.test.ts` | presenter on `FakeEngine` | fake fights end | unchanged |
  | `ffx2-active-*`, `ffx2-wait-*`, `target-frame-hold*`, `presenter-cut-in-no-delay`, `ffx-no-active-clock` | `void presenter.run`, then `abort()` | the test aborts | unchanged |
  | `fallen-aeons-flow-chain.test.ts`, the Ch. V case in `audio-fade-units` | scripted presenter stub | no fight | unchanged |
  | Engine drivers: `ffx2ChapterDrive`, `combatFixesDrive`, `fallenAeonsDrive`, `tremaDrive`, `advisor-committed`, `ffx2-active-measure`, `ffx2-advisor-wait-split-bench`, `strategy-*` | `nextDecision` loops | 20,000 to 30,000 decisions a link | already capped |
  | `src/scenes/evrae-airship-debug-battle.ts` (FFX) | `maxSteps` | capped | unchanged |

- **`window.__pyrefly.autoBattle('defend' | 'attack' | 'random')` on Chapter IV is not a plain
  loop.** `src/debug/api.ts` only calls `presenter.setAutoPlay(strategy)`, and the live presenter's
  loop then plays at the chosen speed. So no cap was added there. With a strategy that cannot win,
  the lone White Mage stalemate would play on until the page is left (the pause menu's exits abort
  the presenter). A cap would belong in the presenter's own loop, which both games and every player
  share; that is a separate change and was not made here.
- Full suite: **431 files passed, 4 skipped, 8,030 tests, exit 0** (`--testTimeout=60000`). B1 is closed.

### 9.2 The menu-cancel correction, built OFF

`research/ffx2-combat-core.md` §9.2 (`ea05f877`, `[verified: 2 sources]`, Split_Infinity G1041 and
G1042) corrects §1.1: an open command menu is closed only by an ability with a **Delay effect** or
**Action-cancel**, not by every hit. Release 17 (decision sheet 2026-09-25 item 4 A1,
`tests/unit/ffx2-hit-closes-menu.test.ts`) closes it on any damaging enemy hit.

- **Switch:** `constants.ts` `MENU_CANCEL_ONLY_DELAY_ABILITIES = false`, and the engine option
  `menuCancelOnlyDelayAbilities`. When it is on, `active.ts` `closesOpenMenu` also requires the
  hitting ability to carry one of the two. `menu-cancel.ts` `carriesMenuCancel` reads that from the
  row itself: the `weak-delay` / `strong-delay` flags, or a `delay-effect` / `action-cancel` status
  row. The engine learns which ability a hit belongs to from the `action-start` / `action-end` drafts
  it already emits (`ActingAbilities`: a charged ability's start is kept until it fires, and a counter
  nests inside). No row was given a flag, and no delay amount is applied (A2 stays unbuilt: no source
  gives the percentage for an enemy ability).
- **Which enemy abilities carry it in the FFX-2 chapters.** Every enemy row in the data table and in
  the engine's own table was listed, and XV's branch was listed too:

  | Chapter | Ability | Carries | Source |
  |---|---|---|---|
  | V | Vegnagun Leg, **Vita Brevis** | strong Delay (guaranteed) | `research/ffx2-vegnagun-shuyin.md` §3.2 |
  | VI | Ormi, **Supercollider** | Delay | `research/ffx2-leblanc-syndicate.md` §4.2, `[verified: 2 sources]` (zero_six FAQ 28832 and the wiki) |
  | VI | Ormi, **Huggles** | Delay on each hit | same §4.2, `[verified: 2 sources]` |
  | VI | Leblanc, **Mach Fan** | weak Delay | same file §4.4, `[verified: 2 sources for effect]` |
  | IV, XI, XIII, XV | none | none | Bahamut, the Fallen Aeons, Trema and the Den of Woe trio have no Delay or Action-cancel ability in their research files (only an immunity to Delay and Interrupt) |

  No enemy row in these chapters carries Action-cancel. The party's own Delay rows (Delay Attack,
  Delay Buster, Bully Ghiki, Shockstorm, Fright, Gold Hourglass) hit enemies, which have no menu.
- **Tests** (`tests/unit/ffx2-menu-cancel-delay.test.ts`, 7 tests). The switch ships off. With the
  switch off (absent, and `false`), Chapters IV, V and VI at Active 1.5 s and at the Wait split
  1.5 s / 0.5 s replay, byte for byte, the hashes taken from `d0d53cb4`, before the switch existed.
  With the switch on, Bahamut's hits land on a girl under an open menu and the menu stays open
  (10 seeds). In Chapter VI (3 formations x 40 seeds), every step where an enemy hit landed on the
  owner closes her menu exactly when the ability carries Delay. Steps where a status also landed on
  her (Russian Roulette's Petrify or Eject) are left out, because a status closes the menu by its own
  rule. The existing `ffx2-hit-closes-menu` tests pin release 17's rule and still pass unchanged.

### 9.3 Every FFX-2 chapter, four arms (200 seeds a row)

B is this branch (IC-2 fix, Acta on the Redoubts). "+ menu" turns on the menu-cancel correction and
"+ IC-1" the immune-hit switch. Human is the live default, the Wait split (1.5 s a menu, 0.5 s of it
on the top list). Active is 1.5 s a menu with the clock running throughout. Bench is zero decision
time. Within 5 is 1-(1-p)^5 from the first-try rate, except XV, which retries from Baralai as the game
does (its "within 3 / 5" is counted). Chapters IV to XIII come from `ffx2-engine-fixes-bench.test.ts`
(`PYREFLY_MEASURE=1`, 114 s). XV comes from a scratch export of `chapter-gippal-ship-0925` at
`79434a56` with this branch's whole `src/battle/ffx2` patch applied (it applied cleanly), using that
branch's driver, kit and line, as in section 7. The scratch exports (`D:/pyrefly-scratch-xv0926`,
`D:/pyrefly-scratch-mc0926`, each with a `node_modules` junction) are still on disk: deleting them was
not permitted from this session. Unlink the junction (`rmdir`) before deleting either folder. The B column
reproduces section 4 exactly (IV 200 / 200, V 175 / 188, VI 159 / 195, XI 157 / 174, XIII 16 / 14,
XV 34 / 94 and 149 within 5).

**First try, wins of 200** (human / Active / bench):

| Chapter | B | B + menu | B + IC-1 | B + both |
|---|---:|---:|---:|---:|
| IV Bahamut | 200 / 200 / 200 | 200 / 200 / 200 | 200 / 200 / 200 | 200 / 200 / 200 |
| V Vegnagun + Shuyin | 175 / 29 / 188 | **181 / 90** / 188 | 175 / 31 / 188 | 181 / 89 / 188 |
| VI Leblanc | 159 / 13 / 195 | 157 / **31** / 195 | 159 / 13 / 195 | 157 / 31 / 195 |
| XI Fallen Aeons | 157 / 95 / 174 | **164 / 116** / 174 | 157 / 95 / 174 | 164 / 116 / 174 |
| XIII Trema | 16 / 7 / 14 | 13 / 13 / 14 | 16 / 7 / 14 | 13 / 13 / 14 |
| XV Den of Woe | 34 / 6 / 94 | 36 / 13 / 94 | 48 / 8 / 112 | 48 / 18 / 112 |

**As rates** (human first try, human within 5, Active first try):

| Chapter | B | B + menu | B + IC-1 | B + both |
|---|---|---|---|---|
| IV | 100 %, 100 %, 100 % | same | same | same |
| V | 87.5 %, 100 %, 14.5 % | 90.5 %, 100 %, **45.0 %** | 87.5 %, 100 %, 15.5 % | 90.5 %, 100 %, 44.5 % |
| VI | 79.5 %, 100 %, 6.5 % | 78.5 %, 100 %, **15.5 %** | same as B | 78.5 %, 100 %, 15.5 % |
| XI | 78.5 %, 100 %, 47.5 % | 82.0 %, 100 %, **58.0 %** | same as B | 82.0 %, 100 %, 58.0 % |
| XIII | 8.0 %, 34.1 %, 3.5 % | 6.5 %, 28.5 %, 6.5 % | same as B | 6.5 %, 28.5 %, 6.5 % |
| XV | 17.0 %, 74.5 %, 3.0 % | 18.0 %, 72.5 %, 6.5 % | 24.0 %, 85.5 %, 4.0 % | 24.0 %, 81.0 %, 9.0 % |

XV within 3 / 5 (retry from Baralai). Human: B 102 / 149, + menu 113 / 145, + IC-1 133 / 171, both
127 / 162. Active: B 12 / 16, + menu 27 / 45, + IC-1 16 / 24, both 44 / 69. Bench: B and + menu
168 / 196, + IC-1 and both 179 / 199.

**Event logs that move against B** (human / Active). Bench never moves, because no clock runs under a
menu at zero decision time. IV 200 / 200, V 200 / 200, VI 198 / 200, XI 180 / 199, XIII 22 / 26. The
IC-1 arm alone moves only V (13 / 20, and 6 at bench), as section 8 F1 found.

### 9.4 What the correction means, chapter by chapter

- **IV Bahamut.** He has no Delay ability, so under the correction none of his hits closes a menu.
  Wins stay 200 / 200 at every speed. Every human and Active log moves, and the Active fight gets
  shorter (2.51 -> 2.39 min on average). Nothing for the player to relearn.
- **V Vegnagun + Shuyin.** Vita Brevis still closes menus (sourced Delay); no other hit does. The live
  default rises 87.5 -> 90.5 %, and **Active triples, 14.5 -> 45 %**. Bench is unchanged.
- **VI Leblanc.** Supercollider, Huggles and Mach Fan still close menus. Human -1 point (2 seeds,
  noise-sized); Active 6.5 -> 15.5 %.
- **XI Fallen Aeons.** No Delay ability. Human 78.5 -> 82 %, Active 47.5 -> 58 %.
- **XIII Trema.** No Delay ability. Human 16 -> 13 wins (8 -> 6.5 %: 3 seeds, inside the noise of a
  16-win count); Active 7 -> 13. Only about 1 run in 8 moves at all, because Trema's hits rarely land
  under an open menu. The chapter's own difficulty question (section 4) is unchanged.
- **XV Den of Woe.** No Delay ability. Human first try 34 -> 36, within 5 149 -> 145 (a 2-point drop,
  inside the noise); Active 6 -> 13 first try and 16 -> 45 within 5. With IC-1 as well: human 48 first
  try, 162 within 5 (IC-1 alone: 171).
- Across the six chapters, the correction never lowers a first-try rate at the live default by more
  than 1.5 points, and it raises every Active rate below 100 % (2 to 3 times in V, VI and XV). Nothing new falls
  below 1 in 10 at the live default; XIII was already below it.

### 9.5 Recommendation (sourced changes on, unsourced off)

- **Take B and turn the menu-cancel correction on** (`MENU_CANCEL_ONLY_DELAY_ABILITIES = true`). It is
  sourced (`[verified: 2 sources]`). It replaces a reading that §9.2 shows was taken from a
  Delay-effect example. And it makes Active playable again without touching a boss number: release
  17 had made Active very hard (V 14.5 %, VI 6.5 %, XV 3 %). It changes a shipped rule from decision
  item 4 A1, so it is **Bailey's call**, and the switch stays OFF in this branch until Bailey picks.
- **Keep IC-1 off** until Bailey rules or the Steam HD Remaster is checked. It is unsourced, and it
  moves only XV (and 13 to 20 of V's logs).
- If Bailey takes the correction, item 4 A1 in the decision sheet (`docs/plans/decisions-2026-09-25.md`,
  on main) should note it. That sheet was not edited here, because the main tree is off limits to
  this branch.
- F2 (the lone White Mage stalemate in Chapter IV) still stands for Bailey. The shipped line never
  meets it, and the test that did (B1) now plays the shipped line under a cap.

## 10. Independent check of section 9, 2026-09-26 (a separate agent that did not build it)

**Game case: FFX-2 only** (the menu-cancel rule and the chapters are FFX-2's; the test cap is shared
test plumbing). Checked branch head `5083709d` (commits `bf46732e`, `54da2e9d`, `5083709d` on top of
`d0d53cb4`). Every number was re-run, none was copied. The runs used my own scratch exports on D:
(`git archive` of `d0d53cb4`, `5083709d` and `79434a56`), not the builder's. Nothing was pushed or
deployed. NOW.md, `critic/` and the main tree were not touched; the main tree was read only for
`research/ffx2-combat-core.md` §9 at `ea05f877`.

### Verdict: B1 is closed, section 9 reproduces exactly, no blocker

- **B1 is closed without weakening the test.** The Chapter IV test still asserts the same cue fade
  (`fades[0]` is `fadeMs / 1000` and under 5 s), and it now also asserts that the fight ended in a
  victory or defeat and not at the cap. Proven both ways in a scratch copy: with the old first-enabled
  line (`setCappedAutoPlay(presenter, () => null)`), the fade assertions still pass, and the test
  then fails loudly with "the fight hit the decision cap after 5001 decisions", in 327 ms instead of
  running out of heap.
- **The switch matches research §9.2 and goes no further, and it ships OFF.**
  `MENU_CANCEL_ONLY_DELAY_ABILITIES = false`. When it is on, `closesOpenMenu` adds one condition to
  release 17's rule: the hitting ability must carry Delay (the `weak-delay` / `strong-delay` flags or
  a `delay-effect` status row) or Action-cancel (an `action-cancel` status row). No delay amount is
  applied (A2 stays unbuilt), and the gauge perturbation from §9.2 row 3 is not built (amount
  unsourced).
- **No ability flag was invented, and no boss number moved.** The branch changes nothing under
  `src/data` against `d0d53cb4`. The four enemy rows that carry Delay in these chapters were flagged
  before this branch, and each one has a source: Vita Brevis (`ffx2-vegnagun-shuyin.md` §3.2, "strong
  Delay"), Supercollider and Huggles (`ffx2-leblanc-syndicate.md` §4.2, `[verified: 2 sources]`), and
  Mach Fan (§4.4, `[verified: 2 sources for effect]`). The research for Chapters IV, XI, XIII and XV
  lists Delay and Interrupt only as immunities; none of those enemies has a Delay ability.
- **With the switch off, the logs are identical, and this is proven on far more than the pinned
  seeds.** I took hashes from `d0d53cb4` (its bench with the branch's bench file dropped in, `built`
  arm), then ran the branch against them: **0 / 200 logs move** in every chapter (IV, V, VI, XI, XIII)
  at all three speeds (Wait split 1.5 s / 0.5 s, Active 1.5 s, bench). That makes 3,000 runs.
- **Hits are attributed to the right ability.** I probed 20 seeds each of IV, V and VI at Active
  1.5 s with the switch on. All 8,673 enemy hits on a girl were attributed to an ability. In every
  case the ability was the one named by that enemy's most recent `action-start` (0 disagreements).
  The Delay hits were only Vita Brevis (69), Supercollider (136), Huggles (45) and Mach Fan (105).

### Re-run results

| Check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `tools/orphans.mjs` | 24 (784 modules, 760 reachable), unchanged |
| Full vitest `--testTimeout=60000` | **431 passed, 4 skipped (435 files), 8,030 tests, exit 0** (82.5 s). **Exact** |
| B1 with the old first-enabled line under the cap | the cap fires after 5,001 decisions, in 327 ms; the fade assertions pass first. **Exact** |
| Section 9.3, IV to XIII, four arms x three speeds (`PYREFLY_MEASURE=1`, 118 s) | every win count, every rate and every "logs moved vs B" count matches section 9.3. **Exact** (IV and V menu human/Active 200 / 200, VI 198 / 200, XI 180 / 199, XIII 22 / 26; IC-1 alone moves only V, 13 / 20 / 6) |
| Average minutes quoted in 9.4 | IV Active 2.51 -> 2.39. **Exact** |
| XV, my own export of `79434a56` + `git diff ea05f877 5083709d -- src/battle/ffx2` (applied cleanly), shipped kit and line, 200 seeds, retry from Baralai | first try, human / Active / bench: B 34 / 6 / 94, + menu 36 / 13 / 94, + IC-1 48 / 8 / 112, both 48 / 18 / 112. Within 3 / 5, human: 102 / 149, 113 / 145, 133 / 171, 127 / 162; Active: 12 / 16, 27 / 45, 16 / 24, 44 / 69; bench: 168 / 196 (B, + menu), 179 / 199 (IC-1, both). **Exact** |
| Rates table in 9.3 (derived) | recomputed from the counts. **Exact** |

### Findings that do not block

- **C1. Action-cancel goes slightly beyond the words of §9.2.** §9.2 ties the lost menu to the Delay
  effect (G1041). For Action-cancel (G1042) it says that the effect cancels a *charging* command and
  restarts the ATB; it does not say an open menu closes. The switch treats Action-cancel as closing a
  menu too, which follows the brief's wording. **No change to any number:** no enemy in any FFX-2
  chapter carries Action-cancel. If Bailey takes the correction, the sheet should say that the
  Action-cancel half is our reading.
- **C2. The action-start / action-end stream is not balanced per actor.** For example, Bahamut's
  ends outnumber his starts by 15 to 19 in each fight, and some Chapter V parts are short by 1 to 9.
  `ActingAbilities` survives this because popping an empty stack does nothing, and the probe above
  found no misattribution. But a stray end that popped a charged Delay ability could, in principle,
  leave its hits unattributed, and then they would not close the menu. If the switch is turned on, a
  one-line guard test over the chapters (every enemy hit attributed, as in the probe) would lock this
  in.
- **C3. The cap fails silently in two of the capped tests.** `presenter-vitals-sync` (`playChapter`)
  and `audio-chain-entrance-owner` (`timeline`) do not assert `capped() === false` or an outcome. If a
  shipped line ever stalemated there, they would stop at 5,000 decisions and check only what was
  played up to that point. This is still strictly better than the old hang, and the other three
  capped sites assert a real outcome.
- **C4. Wording.** The summary says `engine.ts` is 641 lines. It is **643** (it was 636; +9 / -2),
  still over the 400-line rule, as F3 already notes. Section 9.4 says the correction "never lowers a
  first-try rate at the live default by more than 1.5 points". That is true (XIII 8.0 -> 6.5 %), but
  XV's within-5 rate drops 2 points (74.5 -> 72.5 %), and XIII's computed within-5 drops 5.6 points
  (34.1 -> 28.5 %). Both are noise-sized on 13 to 16 wins, but Bailey should see them next to the
  first-try line.
- F2 (the Chapter IV lone White Mage stalemate) still stands for Bailey, and so does the uncapped
  live presenter loop behind `window.__pyrefly.autoBattle`. That is a debug path, and the section 9.1
  note is accurate.
- My scratch exports are in `D:/pyrefly-scratch-chk0926b` (`d0`, `head` and `xv`, each with a
  `node_modules` junction). Deleting them was not permitted from this session. Unlink each
  junction (`rmdir`) before deleting the folder.

## 11. Merged on main, re-measured (2026-09-26, Bailey's D-193)

Bailey, ~07:00 EDT: "I'll go with all your recommendations" (D-193, option B). The branch is merged on
`main` (merge `8235ad63`, no conflicts; main had moved on to the listed Den of Woe and release 19).
On main: `NAMED_TARGETS_ONLY = true`, `IMMUNE_HITS_SKIP_CHAIN = false`,
`MENU_CANCEL_ONLY_DELAY_ABILITIES = false` (the menu-cancel correction is still Bailey's open call).
**FFX-2 only.**

**Every FFX-2 chapter on main**, 200 seeds, first try human (Wait split 1.5 s / 0.5 s) / Active 1.5 s /
bench (`ffx2-engine-fixes-bench.test.ts`, `PYREFLY_MEASURE=1 ENGINE_FIX_ARMS=built`; the Den from
`den-of-woe-shipped-bench.test.ts`):

| Chapter | Human / Active / bench | Column B in 9.3 |
|---|---|---|
| IV Bahamut | 200 / 200 / 200 | exact |
| V Vegnagun + Shuyin | 175 / 29 / 188 | exact |
| VI Leblanc | 159 / 13 / 195 | exact |
| XI Fallen Aeons | 157 / 95 / 174 | exact |
| XIII Trema | 16 / 7 / 14 | exact |
| XV Den of Woe | 34 / 6 / 94; within 3 / 5 human 102 / 149, Active 12 / 16, bench 168 / 196 | exact |

The Den at the other human speeds: 59 first try, 134 / 169 at 1.0 s; 45, 98 / 131 at 2.5 s (section 7's
scratch read 59 / 169 and 45 / 131). D-191's numbers note in `docs/target/decisions.json` and the Den
options sheet carry the new table.

**One pin moved on main that the branch did not have:** `tests/unit/chapters/den-of-woe-carry.test.ts`
pins the Chapter 5, 6 and XI event logs (seeds 1 to 8, D = 0). Re-pinned with the reason in the file:
Chapter 5's eight now equal the re-pinned `ffx2-atb-golden` CH5_D0 again (IC-2 and Acta), Chapter 6
moves on seed 3, the Road on six of eight and the Sisters on all eight (IC-2 alone; neither chain casts
Acta). No contract file changed, so there is no `docs/CONTRACT-CHANGES.md` entry.

**Real-key sanity run on a production build** (`vite build`, served at `/pyrefly-reprise/` on port
5880, headless Chromium on the real GPU, `PYREFLY_BROWSER=gpu`, 0 page errors). The debug API reached
each link, labelled: `setSeed(1)`, `gotoChapter(<id>, { skipCutscenes: true })` with no auto,
`autoBattle('intended')` on every link before the checked one, `setBattleSpeed('fast')`.

- **Chapter V, the Head link (seed 4), real keys only:** auto-play cleared on entry, 97 Enter presses.
  The Head's first Acta Est Fabula targets `redoubt-r` and `redoubt-l` only: two hits, healing them
  2,451 and 2,392. The cast's only HP events are those two heals: the Head is not a target and is not healed (35,448 HP before and after the cast).
  Frame: `docs/screenshots/engine-0926/ch5-head-first-acta.jpg`.
- **Chapter XV, Nooj (seed 3):** debug auto-play held the link until Nooj was at 3,595 HP (above
  Lightfall's 2,999 line), then auto was cleared and 31 real Enter presses took him to 927. Lightfall:
  three hits, one on each living girl (Yuna 587 HP, Rikku 1,905, Paine 4,425 before it), 5,000 each, in
  order Yuna, Rikku, Paine; nobody is hit twice and nobody is skipped (the old wrap's seed-6 failure).
  No girl had drunk a Hero Drink, so all three went down, as the line predicts. Frame:
  `docs/screenshots/engine-0926/ch15-first-lightfall.jpg`.
