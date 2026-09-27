# Iteration 2, batch B1: paper preflight addendum (2026-09-26)

The rule-15 paper preflight for B1 ("combat engine and data", deep class) is
`docs/plans/combat-polish-0926-review.md` (items 1 to 9). This addendum covers what B1 adds on top
of it (`docs/plans/iteration-2-batches.md` §3 B1): the three FFX-2 sourced switches, D-217, the
GameFAQs-labelled data (D-214) and PR-0053. Paper only; written before any source change.
Batch game case: **both** (FFX-2 engine and data; FFX builds for PR-0174 and PR-0179).

## 1. Method

- **One bench for every FFX-2 arm:** `tests/unit/iter2-b1-bench.test.ts` drives IV, V, VI, XI, XIII
  and XV with the shipped lines (the drivers of `ffx2-engine-fixes-bench` plus the shipped Den) at
  the three paces (human Wait split 1.5 s / 0.5 s, Active 1.5 s, bench D = 0), arms `off`, `ic1`,
  `carry`, `leblanc`, `all`, and writes or compares a per-seed event-log hash. The seam switch is
  set through a `vi.mock` of `setupForNextLink`, so no driver changes.
- **Byte identity:** a 50-seed hash baseline of arm `off` was taken on `0bf77169` before any edit
  (`D:/Tools/pyrefly-scratch/iter2-b1/base-off-50.json`). Every refactor (PR-0083) and every OFF
  switch must reproduce it exactly; behaviour items (PR-0145, PR-0107, PR-0138) name the logs they
  move.
- **200-seed tables** wait for the round-14 capture to finish (the host is shared); 20 to 50 seeds
  are used while it runs.

## 2. Items added by B1

| Item | Game | Change | Source | Test first | Risk |
|---|---|---|---|---|---|
| PR-0106 switch | FFX-2 (VI) | `LEBLANC_SCRIPT_SINIROTHX` (constants, OFF) + `Ffx2EngineOptions.leblancScriptSinirothX`: the failsafe Not-So-Mighty Guard fires **once**, on turn 25 + No Love Lost uses (read "on", as the No Love Lost line is); turn 5 of the loop is Fan Slap on a random girl | `ffx2-leblanc-syndicate.md` §19.2, §19.3 (SinirothX, GameFAQs; conflicts with the wiki's "repeat turn 1") | the AI picks per turn with the switch on and off; OFF log hashes unchanged | boss-side behaviour: OFF until Bailey; measured |
| IC-1 label | FFX-2 | `IMMUNE_HITS_SKIP_CHAIN` stays OFF; its comment cites §10.1 (Split_Infinity G1032, "our estimate") | §10.1 | measured only | none |
| PR-0124 switch | FFX-2 (V, VI, XI) | `FFX2_DRESSPHERE_CARRIES` (OFF): at a plain seam (a group without `carriesPartyState` / `carriesFullPartyState`) each girl keeps the dressphere she wore, on the grid layout she had (`BattleScreenCarry.wearing`); gates, the worn-this-battle list and a special dressphere never carry. XIII and XV keep their own approved carries | §10.2 (KADFC FAQ 38278, our estimate) | a seam test in both modes; OFF hashes unchanged | player-side; measured |
| GP-G2 | FFX-2 | only if a GameFAQs line states Alchemist's Stash heals exact; otherwise stop (rule 6) | D-214 | a unit test on the labelled value | shipped Alchemist heals |
| PR-0217 | FFX | only after a sourced line (L-4 or a read here); otherwise open | D-214 | as GP-G2 | Chapter III |
| PR-0054 | FFX-2 | label the Break fallback as an inference, GameFAQs' reading if one exists | D-214 | comment and test name | none |
| D-217 | FFX-2 (V) | Shuyin's link gets `checkpointOnEntry` (the Trema seam), labelled an adaptation | D-217 (Bailey) | `checkpointAt` returns Shuyin's link; the flow test | retry only |
| PR-0053 | FFX-2 | paper: restate or withdraw | round-13 record | none | none |

## 3. Stop rules

- A switch whose OFF arm moves any hash is a bug, fixed before measuring.
- PR-0107 is built ON only if Chapter VI stays inside its band (first try at human pace within
  5 points of today, within five unchanged); otherwise it stays behind an OFF flag and is asked.
- No boss number changes; no research file gains an unsourced value.
