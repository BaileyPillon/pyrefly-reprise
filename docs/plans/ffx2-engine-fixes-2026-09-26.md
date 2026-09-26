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
