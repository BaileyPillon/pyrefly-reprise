# Build A.1 — engine-status track

Round 03 blockers #3, #4, #15 and #16a, plus the pre-deploy gate's letter-tag
major. Commits `dd12561` and `3958ac3`. Nothing here changes a look, a sound or
an approved design, so no end-state pick was needed (rule 9).

Owned files touched: `src/battle/ffx/state.ts`, `turnQueue.ts`, `ticks.ts`,
`engine.ts`, `ai/reactions.ts`, `ai/yu-yevon.ts` and their tests. No file in
`docs/CONTRACTS.md` was touched, so `docs/CONTRACT-CHANGES.md` needs no entry.

## 1. Threaten deleted an enemy from the battle; Sleep never expired

**What was wrong.** After Auron's Threaten landed on Yunalesca she took **zero
turns in the next 120+** on four of five seeds, boss HP unmoved, with Auron in
the shipped `zanarkandBuild` — two menu presses from a win button. A Sleep put
on a combatant sat at `turnsRemaining: 3` for 53 turns and never came off
without a physical hit.

**Root cause.** One predicate doing two jobs. `state.ts canAct()` answered both
"may this actor act?" and "is this actor in the turn queue?", and
`turnQueue.ts queueMembers()` filtered on it. A Threatened or sleeping actor was
therefore removed from the CTB queue outright — and both statuses are cleared
*by the turn that never arrived*:

- `ffx-combat-core.md` §1.1: `nextActor = argmin(ctb) over living, non-Eject,
  non-Petrify actors` `[verified: 2 sources]`. That list is exhaustive; neither
  Sleep nor Threaten is on it.
- §4.1: Sleep, Silence, Darkness, Slow and Regen "tick down, by 1 at the **end
  of the victim's own action**". `tickDurationStatuses` is called from
  `onTurnEnd`, i.e. only for an actor that got a turn.
- §4.2: Threaten "lasts until the **user's** next turn, and the target's next
  turn is then scheduled **immediately after** the user's."

**What changed.**

- `state.ts` now exports `inTurnQueue()` — §1.1's rule verbatim — and
  `canAct()` is defined on top of it and keeps only the sleep/threaten checks.
  `queueMembers()` uses `inTurnQueue()`, so a denied actor keeps its counter and
  still reaches the front of the queue.
- `engine.ts advance()` sends an actor that cannot act down the existing
  `runTurn(actor, null)` pass path: a rank-3 recovery charge and a full
  `afterAction`, which runs `onTurnEnd` and pays the duration. The engine's
  "nobody can act → defeat" guard is no longer reachable by a field of sleepers.
- `ticks.ts` moves Threaten's release to its **user**: `releaseThreatenFrom()`
  runs at every turn start and clears any Threaten whose `sourceId` is the
  acting combatant, then drops the freed target's counter to the field minimum
  so its turn lands immediately after the user's. `StatusInstance.sourceId`
  already existed for exactly this rule. A Threaten whose user has left the
  field (KO, dismissal, Eject) is released on the target's own turn, which is
  §4.2's "KO-ing the user removes Threaten" generalised.

**Tests that pin it.** `tests/unit/ffx-ctb-locks.test.ts` (7 cases, 6 of them
red before the change): Auron's real `threaten` command driven through
`engine.submit` over the real Chapter 2 encounter across eight seeds; a direct
Threaten whose release is checked against Auron's next turn; a Threatened enemy
still appearing in `predictTurnOrder`; a slept Yu Pagoda and a slept Tidus in
the real Chapter 3 encounter, both acting again with the duration gone.

**Game case: FFX only** for Threaten — `ffx-combat-core.md` §11 C12, "Party
members and aeons have resistance 255 permanently … Implement Threaten as
enemy-only", and FFX-2 has no such status. **The queue/act split is shared
plumbing**, so the FFX-2 ATB engine was audited for the same hole and **does not
have it**: `ffx2-combat-core.md` §2.8 gives Sleep and Stop wall-clock durations
(Sleep 97 units = 51.4 s) and `ffx2/statuses.ts advanceStatuses` runs over every
unit on every step regardless of whose gauge is full, so nothing there is waiting
on a turn it cannot take. `tests/unit/ffx2-status-locks.test.ts` pins that, and
pins rule 14's absence check: no FFX-2 ability inflicts Threaten or Provoke, and
FFX-2's `canAct` does not read an FFX `threaten` status.

## 2. Yu Yevon: his own side provoked his counter, and Gravija missed his Pagodas

**What was wrong.** Every `yu-pagoda-* -> power-wave-aeon @ ["yu-yevon"]` was
followed by `COUNTER yu-yevon curaga` and a 9,999 heal. `ffx-bfa-yu-yevon.md`
§3.4.1's table scores that row at **0**. Separately, his Gravija never touched
his own Pagodas, so they were never suppressed and healed him faster than he
whittled himself down: the critic measured him parked on 4,801 of 99,999 after
57 Gravijas, then a stalemate `escape`.

**Root cause.** `ai/reactions.ts collectBossCounters()` skipped only
`enemy.id === attacker.id` and never checked `attacker.side`. And
`ai/yu-yevon.ts` hand-built Gravija's targets as `[...party, ai.self.id]`,
although §3.3 says it "removes exactly 75% of current HP from **every target on
the field** — including Yu Yevon himself" `[verified: 2 sources]` and the
shipped record already carries `targeting: 'all'` with `extra.includesUser`.

**What changed.** `collectBossCounters` returns early for `attacker.side ===
'enemy'` (§3.4.1: "one Curaga per **player-side** action"; ffx-yunalesca §14.11
draws the same line for her counters). `yuYevonAi` submits `use(ai, 'gravija',
[])` and lets `targeting.ts` expand the record.

**Tests that pin it.** `tests/unit/ffx-yu-yevon-counters.test.ts` (4 cases, all
red before): a defend-only line draws **zero** Curagas; three party attacks draw
exactly three; the Pagodas take Gravija damage; and §3.5's attrition route is
played end to end — suppress the Pagodas, let Gravija bottom him out at the 1 HP
floor `cannotKo` implies, then one hit for victory.

**Game case: FFX only.** The formation, the counter and Gravija are Chapter 3
content; the `attacker.side` guard sits in the FFX reaction collector, which
FFX-2 does not use, and FFX-2 has no counter of this shape.

### Two existing tests were corrected, not loosened

Both had encoded the defects rather than the research, and both now assert more.

- `tests/unit/ffx-ai.test.ts` asserted the command's literal target list. It now
  asserts the **shipped record** is `targeting: 'all'` with `includesUser`, and
  that the real `resolveTargets` expansion puts Yu Yevon in his own blast.
- `tests/unit/strategy-braskas-final-aeon.test.ts` asserted that a swinging
  party never wins and leaves him **above 80,000 HP**. That number came from the
  Power Wave Curaga farm: with one Curaga per player action and a Gravija taking
  75 % of current HP, no arithmetic holds him there. §3.5 names attrition a win
  route and the group record says "Cannot be lost". The block now pins the
  *shape* of the failure instead: the last link takes **478 turns** (seed 1) and
  **477** (seed 42), against ~200 for the whole seven-link shipped line — the
  party still cannot out-damage the counter; it only outlasts him. The shipped
  `intendedStrategy` is unaffected: still 39/40 contiguous seeds and 8/8
  verifier seeds.

## 3. Letter tags marked the formation, not the duplicates

`turnQueue.ts letterTagFor()` lettered every enemy by its index in
`state.enemyIds` whenever the formation held two or more, so Chapter 1 read
"Seymour Flux A" and "Mortiorchis B" — two different enemies, neither needing a
letter. FFX letters **duplicates**. Grouping is now by **display name**, because
the name is the string the letter is appended to on the CTB tile
(`src/ui/ffx/CtbList.ts`) and on the targeting name plate
(`src/ui/ffx/CommandMenu.ts` via `FFXBattleHud.letterTagOf`). Chapter 1 shows no
letters; Chapter 3 shows "Yu Pagoda A" and "Yu Pagoda B" with Yu Yevon plain.

Both call sites read `TurnPreview.letterTag`, which this function produces, so
no UI file needed touching and `npx tsc --noEmit` is clean. Pinned by two cases
in `ffx-ctb-locks.test.ts`.

**Game case: FFX only.** FFX-2's letter tag is computed separately in
`src/ui/ffx2/FFX2BattleHud.ts letterTagOf()` (same formation-index bug: it
letters Vegnagun's parts and any two fiends by position). That file belongs to
the FFX-2 HUD track, not this one, and `research/ffx2-combat-core.md` has no
statement on the convention — **see "Still open" below**.

## Verification

- `npx tsc --noEmit` clean.
- `npx vitest run` over the whole suite: **4,175 passing**. One unrelated red,
  `tests/unit/ui-common-results.test.ts` ("awards every active member its AP"),
  which appeared between two runs of the full suite while
  `src/ui/common/resultsMath.ts` and `src/battle/ffx/results.ts` were being
  edited by the results/AP track. Nothing in this track touches those files;
  before their edits landed, the same suite was green apart from the two tests
  corrected above.
- No browser pass: this track's brief asks only that the two letter-tag call
  sites still compile, and nothing else here is visible.

## Still open

1. **Blocker #16b — the stalemate guard reports `escape`.** A battle that hits
   `engine.ts`'s stalemate guard in a formation with `canEscape: false` should
   report a distinct outcome the results screen can name. That needs a new
   `BattleResult['outcome']` member, which is `src/battle/common/types.ts` (a
   contract file) plus `src/battle/ffx/results.ts` and the results screen —
   explicitly outside this track's files. The guard is now much harder to reach:
   attrition ends the fight instead.
2. **FFX-2 letter tags.** `src/ui/ffx2/FFX2BattleHud.ts letterTagOf()` has the
   same per-formation bug, but the FFX-2 convention is not stated in
   `research/ffx2-combat-core.md` or `research/ffx-vs-ffx2-presentation.md`.
   Rule 14 says decide from the sources or ask, so this is a **question for
   Bailey**, not a fix to copy across: does Vegnagun's part list letter from A
   per part group the way FFX letters duplicates, and is a lone fiend plain?
3. **Threaten's reschedule is an approximation.** §4.2's "the target's next turn
   is then scheduled immediately after the user's" is modelled by setting the
   freed target's counter to the field minimum. It is right in every case seen
   so far, but a formation where several actors sit on the minimum resolves by
   the §1.6 tie-break rather than strictly after the user.
