# Six process proposals from `project-scaffolding`

Written 2026-09-21 by a side session. Source: Bailey's private repo `BaileyPillon/project-scaffolding` (v2.1), read
through the GitHub API only; nothing in it was changed.

**Status: ADOPTED, all six.** Bailey said "yes to all six, write them up as proposals" and then "adopt all six" on
2026-09-21. Where each one landed is in the table at the end of this file; the sections in between are the proposals
as Bailey read them, kept for the reasoning.

**Game case (hard rule 14): both, for all six.** They change how work is planned, reviewed and recorded. None touches
game data, a mechanic, a screen of the game or a sound. None of them needs a critic review to land: every file they
touch (`critic/**`, `tools/**`, `docs/**`, `tests/**`) is under the `no-product-effect` rule in `critic/policy.json`.

**What I checked first.** The scaffold was written for a forecasting project, so I compared each idea with what this
repo already does. Two of the six are already half here (2 and the preflight half of 6), and the write-up says so
instead of proposing them as new.

| # | Proposal | Already here | What is actually new | Size |
|---|---|---|---|---|
| 1 | Stagnation rule | Two attempts per failure (RUBRIC §8) | The same limit for a whole area across reviews, and a status line that shows it | Small |
| 2 | Repair-cycle cap | The rule and `repairAttemptsBeforeEscalation: 2` | Counting attempts in the reports; a cap per release candidate; "ship what passed" | Small |
| 3 | Usage modes | Readings at releases, "about 15 points a day", ask above 85 percent | Three named modes with numbers, a pacing warning, one line in NOW.md | Small, wording only |
| 4 | Decision states | Design status per tile (approved / rejected / gap) | Delivery status per tile (RUBRIC §10 lists it as missing); states for Bailey's non-picture decisions | Medium |
| 5 | Named versus inferred | "A pick approves only what Bailey names", a quote per group | A place in `targets.json` for the five reactions Bailey's own rule asks for, plus "inferred" | Medium |
| 6 | Calibration and preflight | Paper critiques for new screens (RUBRIC §4 row 1) | A labelled case set to test the critic against; a paper preflight before any deep-review build | Medium |

---

## 1. Stagnation rule

**Scaffold wording:** two consecutive same-scope batches with neither material gain nor discriminating evidence
require a pivot with a new discriminator; do not start a third similar run.

**What we have.** RUBRIC §8: "After two unsuccessful attempts on the same failure, stop repeating the approach." It
works: the strategy guide's slicing line (PR-0009) was rebuilt as a column on the third try, citing that sentence
(`ee49fc3`). But it is scoped to one failure. Nothing looks at an area. Fix round 3 had all four second verifier passes
refuted (`docs/handoff/fix3-verify2-findings.json`), and nothing in the tooling would notice if the same issue ID
stayed open from one round's report to the next.

**Proposed text, RUBRIC §8, after the two-attempts paragraph:**

> The same limit holds for an area. When two consecutive reviews leave the same issue ID open at the same severity, or
> leave a category that the work targeted without a gain, the next batch in that area starts with a written method
> check instead of a third similar batch: the current route and why it stalled, up to two alternatives, the smallest
> test that would tell them apart, and one choice of continue / change method / small probe / defer / ask Bailey. A
> cosmetic gain does not reset the count.

**Proposed data:** `policy.json` `cadence.stalledAfterReviews: 2`.

**Proposed tool change:** `npm run critic:status` reads the `issues` arrays it already has (each issue has a stable
`id`, `severity` and `status`) and prints `STALLED: <id> open in rounds 04, 05` for any issue open in two consecutive
reports. Information only; it does not block a deploy.

**Not decided:** what counts as "a gain" for a category. I would not pick a number; the reviewer states it in the
report and Bailey can overrule.

## 2. Repair-cycle cap

**Scaffold wording:** at most two consolidated repair and recheck cycles in normal mode, one in conserve; at each
boundary take a fresh usage reading and reconsider the method; no extra cycle opens automatically.

**What we have.** The per-failure rule above, and the number in `policy.json`. Honest reading: this proposal is mostly
already adopted. Three things are missing.

1. **Nobody counts.** The attempt number lives in commit messages and memory. Proposed: an optional `attempts` integer
   on each issue in a report; `validateReport` accepts it; the status tool prints it. Additive, old reports stay valid.
2. **No cap per release candidate.** Build A.1 went: deep review round 04 (changed area FAIL), repair 1, verifier
   refuted two fixes, repair 2, verifier confirmed, round 05. That was the right call and it would still be allowed.
   Proposed text for RUBRIC §8: "A release candidate gets two repair and recheck cycles. Before a third: a usage
   reading, the method check from the stagnation rule, and one of (a) take the failing change out of the candidate and
   ship what passed, (b) defer the candidate, (c) ask Bailey."
3. **Option (a) is the point.** Today one failing fix holds every passing fix off the live site. Taking a change out
   means a new commit that removes it from the candidate, never `git revert` games in the shared tree and never
   `reset`; the release worktree `D:\pyrefly-release` is where that happens.

**Tie to proposal 3:** one cycle instead of two in conserve mode.

## 3. Usage modes

**Scaffold wording:** normal above 50 percent of the weekly allowance remaining, conserve from 20 to 50, protect at 20
or below; a shorter window can tighten the mode and never relax it; if the allowance remaining trails the share of the
week remaining by more than five points, drop one mode.

**What we have.** Readings before the cut, after the deploy and after the review (Bailey, 2026-09-19); the driver's
own "about 15 weekly points a day"; "ask Bailey above about 85 percent". The thrift habits proposed on 2026-09-18 were
never approved. This would replace the loose parts with one table.

| Mode | Weekly allowance left | What it permits here |
|---|---|---|
| Normal | More than 50 percent | Workflows as planned, at most two at once. Opus for engine, presenter and verification; Sonnet for well-specified tracks. Two repair cycles. |
| Conserve | 20 to 50 percent | One workflow at a time. Sonnet unless the track is engine, presenter or the verifier. No art agents and no image-heavy options rounds. One repair cycle. Batch shared-system changes so they share one deep review. |
| Protect | 20 percent or less | No new workflow. Commit, hand off, update NOW.md. Small direct edits only. A build that needs a deep review is written up as "deploy + review owed". Anything else: ask Bailey. |

- The 5-hour window uses the same thresholds and can only tighten the mode (six parallel workflows emptied it on
  2026-09-18 and every agent died mid-task).
- **Pacing warning, with our own numbers.** Evening of 2026-09-18: 29 percent used about 7 hours into the week, so 71
  percent left against 96 percent of the week left. Gap 25 points: conserve on day one. Noon on 2026-09-19: 39 percent
  left against 86 percent of the week: protect. The rule would have spoken up a day before the allowance ran out.
- **Bailey can set the mode by word; agents can only tighten it.** On 2026-09-19 Bailey chose full speed knowing the
  cost. That stays Bailey's call.
- **Where it lives:** the table in RUBRIC §9; one line at the top of NOW.md and in every release announcement:
  `Usage mode: normal (weekly 16 used, 5-hour 20, read 00:20 EDT)`. No tool can enforce it: the reading comes from the
  desktop app, not from node. `critic/runner/release.js` could take the mode as an argument to pick models; optional.
- **One number changes:** "ask above 85 percent used" becomes "protect at 80 percent used". I recommend the round
  number; say so if 85 should stay.

## 4. Decision states

**Scaffold wording:** every decision is `proposed`, `adopted`, `deferred`, `superseded` or `verified`; an adoption is
not a verification.

**What we have.** `targets.json` tiles carry a design state: 61 approved, 4 rejected, 8 gaps. RUBRIC §7 says delivery
status is tracked "separately, in the review's release manifest", and RUBRIC §10 lists "delivery status per target is
not tracked in `targets.json`" under *not automated yet*. So an approved tile says nothing about whether the game
matches it. The "Turn cut-in" tile is the example: approved, never wired (NOW.md still asks Bailey whether it stands).

**Part A, tiles.** An optional `delivery` field per tile: `not-scheduled`, `in-progress`, `implemented`, `verified`,
and for `verified` a `verifiedBy` (report path and main sha). Additive: a tile without it reads as unknown, and
`tools/end-state-board.mjs` keeps working unchanged until it is taught to show it. The milestone gate's "required /
matched" count can then come from the file instead of being rebuilt by hand in each deep review. Only a report settles
`verified`, the same way only `critic-clear` settles an obligation.

*The board is something Bailey looks at, so showing delivery on it (a second pill, a filter) gets a mockup and a pick
first (hard rule 9). Recording the field does not need one.*

**Part B, decisions that are not pictures.** NOW.md holds them as prose in two places ("Decided by Bailey", "Waiting
on Bailey") and they scroll away. Proposed: `docs/target/decisions.json`, one row each: id, date, Bailey's words,
state, game case, where built, evidence. How today's list would read:

| Decision | State |
|---|---|
| FFX-2 ATB is Active only ("For ffx-2 I choose active", 2026-09-21) | adopted, not built |
| Onboarding C, Auron's briefing | adopted, implemented, not yet live |
| Critic policy v2 | adopted, in force |
| Product brief | proposed (draft awaits a yes) |
| Thrift habits of 2026-09-18 | proposed (never approved) |
| "An enemy hit closes the open menu" in Active mode | proposed (asked, not answered) |
| "Full critic round on every deploy" | superseded by policy v2 |

NOW.md would link to the file instead of repeating it. `tools/end-state-board.mjs` could render it under the pictures
later; same mockup-first note.

## 5. Named versus inferred preferences

**Scaffold wording:** keep Bailey's words with their source; mark each preference explicit or inferred; never promote
an inference to a requirement; record rejected directions.

**What we have.** Bailey's own standing rule already asks for this after every reaction: liked, disliked, must remain,
must change, still undecided. There is no home for it. A group has one `evidence` quote and tiles have a free-text
`note`, so an agent reading a tile cannot tell what Bailey named from what an agent assumed.

**Proposed:** an optional `reaction` object on a tile or a group:

```json
"reaction": {
  "date": "2026-09-19",
  "words": "Bailey's sentence, verbatim",
  "liked": [], "disliked": [], "mustRemain": [], "mustChange": [], "undecided": [],
  "inferred": []
}
```

Worked example, targeting look B: `mustRemain` hand cursor (FFX), pink sparkle cursor and six-petal reticle (FFX-2),
ring, slight dim; `disliked` chevron plate, rim light, x-ray, moving enemies; `undecided` the leader-line marker (it is
not in option B and still needs a yes). Second example, Braska's portrait: card 1 is approved, the off-canon gold
crest is `mustChange`, so the repaint is part of the record and not a surprise later.

**How the critic uses it (RUBRIC §7):** acceptance cases come only from `mustRemain`, `mustChange` and named `liked`
items. An `inferred` item never fails a build; it shows up in the report as a question for Bailey. That is the rule
"a pick approves only what Bailey names" made checkable.

**Cost to fill in:** only going forward, plus the handful of tiles where the words are already on record (targeting,
onboarding C, the portraits, Ink & Gold). No back-filling of 61 tiles from guesswork: that would be inventing
preferences, the thing this proposal exists to stop.

## 6. Critic calibration and preflight

**Scaffold wording:** before trusting a rubric, run the reviewer over cases with known answers, record false accepts
and false blocks, then freeze it; review a bounded plan before execution as well as after.

### 6a. Calibration

**What we have.** RUBRIC §6 says the anchors are "calibrated on Bailey's accepted and rejected examples". No such set
exists in the repo; that sentence is the only mention. RUBRIC §9 asks for escaped owner-found defects to be recorded
"to judge the critic itself", by hand. Meanwhile the history is full of labelled cases:

- **Should have failed, passed (false accepts).** Bailey's criticisms of 2026-09-18, all on a build the critic had
  seen: pause screen low-resolution and not full-bleed; the advisor suggesting Poison Fang for Tidus and ignoring a
  fallen Yuna; the stale Ronso Rage banner; debug text in the advice card.
- **Should have passed, failed (false blocks).** "Tidus has White Magic and Hastega" flagged as a defect (it is
  canon; chip withdrawn). The art judge scoring approved paintings 5.2 to 7.5, after which eight approved paintings
  were overwritten. A verifier whose own rig was wrong (`b4-final.mjs` subtracted unscaled padding).
- **Ready-made visual set.** 61 approved and 4 rejected tiles, with hashes for the approved paintings.

**Proposed:** `critic/calibration/cases.json`: id, kind (`should-fail` or `should-pass`), the artefact (commit and
state, or image and hash), the expected finding, the source (Bailey's words and date). About a dozen seed cases from
the list above; each is confirmed against the files before it goes in, none is written from memory. A run sends the
relevant reviewer over the cases and records false accepts and false blocks in `critic/calibration/runs/`.

**When it runs:** when the rubric, a runner prompt in `critic/runner/` or the reviewing model changes. Not per
release. Every new owner-found defect adds a case (this extends the defect-retrospective row in RUBRIC §4).

**Cost:** not measured. It is one reviewer agent over small inputs, but the first run gets sized and the number shown
to Bailey before it starts, in whatever usage mode applies.

### 6b. Preflight

**What we have.** RUBRIC §4 row 1 already requires a plan check for a new screen, mechanic or encounter, and it pays:
`docs/plans/onboarding-review.md` found five required changes before a line was built. What has no preflight is the
expensive case. A shared-system change costs a deep review (several weekly points), and round 04 failed its changed
area after everything was built.

**Proposed text, RUBRIC §4, new row:** "A change that `node tools/critic-plan.mjs --paths <intended files>` classes as
deep gets a paper preflight before building: game case stated with its source (rule 14), acceptance cases named,
before-and-after measurement named where behaviour changes, which existing evidence stays reusable. Result PROCEED /
REPAIR / PIVOT, saved as `docs/plans/<track>-review.md`. 5 to 10 minutes; no browser, no build."

The planning tool already answers the `--paths` question, so this needs no new code.

**First candidate:** the FFX-2 Active-only ATB build. It is combat core, FFX-2 only, already owes a deep review and a
measurement of chapters 4 and 5, and has one open question for Bailey (the menu-closing hit). A preflight would pin
those down before an Opus agent starts on `BattlePresenter`.

---

## Adopted 2026-09-21: where each one landed

| # | In force as | Enforced by |
|---|---|---|
| 1 | RUBRIC §8 "The same limit holds for an area"; `cadence.stalledAfterReviews` | `stalledIssues` in `tools/critic-policy.mjs`; `npm run critic:status` prints `STALLED:` (information only) |
| 2 | RUBRIC §8 "Count the attempts, cap the cycles"; `cadence.repairCyclesPerCandidate` | `validateReport` checks `attempts`; the cycle cap is applied by whoever drives the release |
| 3 | RUBRIC §9 usage modes; `usageModes` in policy.json; AGENTS.md rule 15; the mode line at the top of NOW.md | A reviewer or driver; no tool can read the allowance. "Protect at 80 percent used" replaces "ask above 85" |
| 4 | RUBRIC §7; `delivery` / `verifiedBy` on tiles (24 filled: 15 verified and 5 failing from round 04 by exact label, 3 onboarding tiles, the Turn cut-in); `docs/target/decisions.json` (14 decisions) | `tests/unit/critic-policy-adoptions.test.ts`. **Not done:** showing delivery on the board, which needs a mockup and Bailey's pick first |
| 5 | RUBRIC §7 "What Bailey named, and what an agent guessed"; `reaction` on four tiles where the words are on record (targeting B, onboarding C, Ink & Gold style board, Braska's portrait), `reactionOf` on four more | The same test file; the critic applies it when it writes acceptance cases |
| 6a | RUBRIC §6 and §9; `critic/calibration/cases.json` with four confirmed should-fail cases and four candidates still to confirm | The same test file checks every case names a file that confirms it. **No calibration run has happened**; the first one is sized and shown to Bailey before it starts |
| 6b | RUBRIC §4, the paper-preflight row; AGENTS.md rule 15 | A reviewer or driver. First candidate: the FFX-2 Active-only ATB build |

One thing changed while adopting: `rejected` was added to the decision states, because this project has real
rejections (four tiles, several proposals) and the scaffold's five states had no word for them.

**Deliberately not proposed** from the scaffold: its second critic scale (five dimensions, 8 of 10), the 14 templates,
the Astra / Luna / Terra / Sol role names, batch cards and handoff forms, and the forecasting vocabulary (cutoffs,
held-out cohorts, exposure). They would duplicate or contradict what is in force here.
