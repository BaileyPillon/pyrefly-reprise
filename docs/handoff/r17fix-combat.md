# r17fix-combat: PR-0267 (failed Bushido timing bonus) and PR-0268 (Sin link-3 checkpoint ON)

Branch `r17fix-combat` in `D:/pyrefly-aeon-hp`, cut from local main `cdde9844`. **Not pushed, not merged, not
deployed** (the driver pushes). Critic round 17 (`critic/rounds/round-17.md` issues 6 and 7). Game case for both:
**FFX only** (rule 14): Bushido is Auron's FFX Overdrive, and Sin is an FFX encounter.

## PR-0267: a failed Bushido kept its time remaining and earned the §5.2 timing bonus. FIXED

**Source.** `research/ffx-combat-core.md` §5.5: "Failure (timer expiry) resolves the (Fail) row", and the §5.2 bonus
comes from the sequence *completing early* (`timeRemaining = 4000 - msElapsedWhenLastInputLanded`). A failed
sequence never completes, so it carries no time remaining. The engine's own auto-resolve already sent 0 on failure
(`overdrive.ts`, `success ? rng.int(0, timerMs) : 0`). The source settles it; this is not an estimate.

**Cause, proven by running.** `timingBonusFrom` (`src/battle/ffx/overdrive.ts`) returned
`result.sequence.timeRemainingMs` whatever `success` said, and the UI's `resolveAuronSequence`
(`src/ui/ffx/minigames/logic.ts`) reported `timerMs - elapsedMs` on a failure too. Because the UI ends the attempt on
the first wrong press (visual-bible §3.11.2), a wrong first press at 3.9 s left was paid +49 % on the Fail row.

**Fix.** `timingBonusFrom` credits time remaining only when `sequence.success` is true (the engine is the authority,
so a replayed or hand-built result is covered too); `resolveAuronSequence` reports 0 on a failure (the result is now
truthful at the source). `overdrive.ts` stays at 472 lines (no growth, rule 7). Tidus's and Wakka's results are
unchanged: their failure is timer expiry by construction (§5.3 rule 1), so their remaining time is already 0.

**Before / after (the critic's own board: `sin-face` seed 1, the capture log replayed to Auron's first Dragon Fang,
the critic test pointed at this worktree with the round's acceptance assertions added):**

| Minigame result | Before | After |
|---|---:|---:|
| fail, timer expired (canon) | 2,432 | 2,432 |
| fail, wrong press at 3.9 s left | **3,617** | 2,432 |
| fail, as captured (335 ms left) | 2,533 | 2,432 |
| success, 2.5 s left | 3,192 | 3,192 |
| success, 0.5 s left | 2,584 | 2,584 |

Before: the critic test fails (`expected 3617 to be 2432`); after: it passes. Successes are unchanged, so no golden
moved (the full suite is green, see below).

**New test** `tests/unit/ffx-bushido-fail-bonus.test.ts` (engine and minigame logic, no grepping): the Fail row is
the same for 0, 335 and 3,900 ms left; a fast success beats a slow one beats every failure; `timingBonusFrom` and
`resolveAuronSequence` report 0 for a failure. Before the fix 4 of its 4 assertions failed (394 against 265 on the
fixture board; 3900 against 0); after, all pass.

**Not fixed (a question for Bailey, not a defect to settle by taste).** The sources conflict on a wrong press:
`research/ffx-combat-core.md` §5.5's shipping rule says a wrong press is *ignored* (`[estimate]`, authored), while
`visual-bible` §3.11.2 and the shipped UI end the attempt on the first wrong press. With this fix the conflict no
longer pays anyone; which input rule the player feels is a perceivable change (rules 9 and 10), so it is left as is.

## PR-0268: Bailey adopted the Sin link-3 checkpoint (D-284) but it shipped OFF. FIXED

**Cause.** `SIN_LINK3_CHECKPOINT = false` in `src/data/ffx/enemies/sin-genais-core.ts`; the release 31 merge that was
to switch it on never did (the critic's `git log -S`), so a loss at Chapter XVII's link 3 restarted at the Left Fin.

**Proof by running.** A new block in `tests/unit/chapters/sin-checkpoint-flow.test.ts` runs the real `GameFlow` and
the real chain with the formation **as the game finds it** (`findEnemyGroup`, not an injected shape): win both Fins,
lose link 3, RETRY. With the switch `false` it fails (`expected undefined to be 3`: the retry had no checkpoint and
opened on the Left Fin); with `true` it passes: the retry opens on link 3 (Genais and the Core), no prep, Auron at
the HP he entered link 3 with. A second test pins that a loss at link 1 or link 2 still retries from the Left Fin
through prep.

**Fix.** `SIN_LINK3_CHECKPOINT = true`, and the tests follow: `sin-checkpoint.test.ts` "ships on" (link 3 is a
checkpoint, the OFF shape is not, neither Fin ever is); the flow test's OFF case now injects the OFF shape itself
instead of relying on the shipped data; `fallen-aeons-flow-chain.test.ts` names XVII's link 3 among the checkpoints. `docs/target/decisions.json` D-284 `delivery: implemented`. Comments that
said "OFF as shipped" updated (`BattleChainCheckpoint.ts`, the bench labels, `sinFinsBench.ts`, the e2e header, and
the `checkpointOnEntry` doc comment in `types.ts`, recorded in `docs/CONTRACT-CHANGES.md`: comment only).

**e2e.** `tests/e2e/ffx-sin.spec.ts` loses with the `defend` line, which falls at link 1, so its expectation (RETRY
lands on the Left Fin at 65,000 HP) is still right with the switch on; only its header comment changed.
`flow-checkpoint-retry.test.ts` "17. sin-fins-core: RETRY goes back through prep" scripts a loss with no checkpoint
(link 1), which stays true, and passes unchanged.

**Not done.** The critic's real-keys acceptance at 1600x900 (lose at link 3 by real input and RETRY) was not run: it
needs both 65,000-HP Fins won in a browser (about 13 minutes each by real keys) while ComfyUI holds the GPU. The flow
test drives the same `GameFlow`, chain, engine and `resumeSetup` path the battle screen uses. A real-key check is owed
to the next focused review.

## Checks

- `npx tsc --noEmit`: clean.
- Targeted: `ffx-bushido-fail-bonus`, `ui-ffx-minigames`, `chapters/sin-checkpoint`, `chapters/sin-checkpoint-flow`,
  `flow-checkpoint-retry`: all pass. The critic's `bushido-fail-bonus.test.ts` (copied, pointed at this worktree,
  acceptance assertions added; not committed, it lives with the round's untracked evidence): fails before, passes after.
- Full suite once (4 workers): 692 files passed, 5 skipped, 1 failed: `chapters/fallen-aeons-flow-chain.test.ts`
  "17. sin-fins-core: no checkpoint but the named links", the guard that lists every no-Save-Sphere checkpoint by
  name. That failure is this change working (Sin link 3 now flags `checkpointOnEntry`), so XVII's link 3 joins the
  named list (D-284) and the file passes alone (33 of 33). No golden moved: every FFX golden and replay passed
  unchanged (successful Overdrives and the engine's auto-resolve are untouched), so none was re-pinned.
- `node tools/orphans.mjs`: 24 orphaned, no new module added.
