# r392-trema: PR-0407 (a hopeless Retry in Chapter XIII) and PR-0353 (no real-key win)

Branch `r392-trema`, from `origin/main` 30e7d701. **Game case: FFX-2 only** (Chapter XIII, Oversoul Paragon then Trema); the checkpoint plumbing it touches is shared and every other chain is pinned unchanged. Pushed, **not merged, not deployed**. Source: critic deep round 23 on live 39.1 (`critic/rounds/round-23.md` issues 6 and 7, untracked in the main tree when this was written).

## The brief had the direction backwards

The lane brief said a loss in link 2 "retries from Paragon's encounter instead of from Trema". It does not, and it never did. A loss to Trema retries **at Trema** (`checkpointOnEntry`, TR5 b, Bailey's adopted pick: "a 30-minute fight should not replay Paragon"), in the state Paragon left the girls, with no prep. The defect is the opposite one: when only one girl survived Paragon, that carried state has no winning line, and every Retry re-opens it.

## PR-0407: the repro, before

Engine, shipped checkpoint code, seed 21 (Paragon won with Yuna and Rikku KO and Paine alone), kit-intended line, Wait split: first entry into Trema lost in 5 decisions; Retries 1 to 6 through `resumeSetup` all opened on **Trema with one girl standing** and lost in 2, 2, 6, 2, 3, 3 decisions. Round 23's 200-seed probe, re-run here over the same 28 Paragon wins: **one standing 0/200 wins (109 lost within two decisions, 188 within eight)**; two standing 20/20; three standing 298/340 (87.6 %). Active ATB: one standing 0/240, two 34/80, three 168/220. 10 of the 28 Paragon wins (36 %) end with one girl standing (12 of 27 under Active). The live run r4 hit it: attempts 13 and 14 lost in 2 and 1 turns.

Through the real app flow (`tests/unit/chapters/trema-retry-flow.test.ts`: the real `GameFlow`, the real `runEncounterChain`, the real seam carry and the real FFX-2 engine; only the presenter is a script), before the fix: Paragon won with one girl standing, Trema lost, then six RETRYs: every one `onLinks [2]` (at Trema, not Paragon), `standing 1`, lost in 0 or 1 decisions.

## The fix (three answers built and measured; one shipped on the branch)

`EnemyGroupDef.hopelessRetry?: { standing, answer }` (additive, `docs/CONTRACT-CHANGES.md` 2026-10-06), read only by `checkpointAt` and `resumeSetup` in `src/app/screens/BattleChainCheckpoint.ts`. Trema's link names it through `TREMA_HOPELESS_RETRY` in `src/data/ffx2/enemies/trema.ts`. The first entry into Trema is never changed (the sources carry Paragon's state, research/ffx2-trema.md 1.1). No sourced number moves.

| Answer | What a Retry does with fewer than two girls standing | One standing, wins / runs (Wait split) | Under Active |
|---|---|---|---|
| `'carry'` (live 39.1) | replays Paine alone | 0 / 200 | 0 / 240 |
| **`'restore'` (shipped on the branch)** | opens Trema with the Save Sphere's rule: HP and MP full, a KO'd girl up, statuses kept (Chapter XI's `restoresPartyOnEntry`) | **175 / 200 (87.5 %)** | **181 / 240 (75.4 %)** |
| `'chapter-start'` | no checkpoint: a loss retries Paragon through prep (TR5 a) | a fresh chapter run: 13 / 200 (6.5 %) per run | 13 / 200 |

Two or three standing replay exactly as entered under every answer (unchanged: two 20/20 Wait, 34/80 Active; three 298/340, 168/220). Also measured and not built: restoring **every** Retry changes the three-standing rate by nothing at the Wait split (299/340) and lifts two standing under Active from 42.5 % to 63.8 %, which is the next question if Bailey wants Active kinder. Eventual completion from a Paragon win: 18 of 28 before (the 10 one-survivor states can never finish), 28 of 28 with `'restore'` (87.5 % per Retry); `'chapter-start'` throws those 10 wins away, which is why `'restore'` fits TR5's own reason.

**Bailey's call, not made here.** Round 23 and AGENTS.md rule 10 say the kind of fix is his; the brief asked for a fix, so the branch builds all three and ships `'restore'` as the candidate. His choices: ship `'restore'`, switch to `'chapter-start'` (one constant), keep `'carry'` and say so on the defeat card (option c, not built: it is copy, not behaviour), or widen to every Retry. Nothing is merged. A merge also needs the ledger rows (D-nnn, A-nnnn) once he has decided; none were added.

Measured files (scratch on D:, not committed): `D:\Tools\pyrefly-scratch\r392-trema\` `repro-before.json`, `matrix-wait.json`, `matrix-active.json`, `sin-entry.json`, `route-model-wait.json`, `route-model-active.json`; the probes themselves in `probes\` (vitest files `repro`, `matrix` with `R392_MODE=wait|active`, `route-model`, `sin`; they import the repo by relative path, so they run from a folder inside a worktree with a config like `probes\vitest.config.ts`); and the live run's whole evidence folder in `evidence\ffx2-trema-win-r392\`.

### Tests

`tests/unit/chapters/trema-hopeless-retry.test.ts` (14: `standingIn`, `hopelessAt`, `checkpointAt` and `resumeSetup` for each answer, the real engine opening the restored Retry, the pause menu's RESTART ENCOUNTER hand-over, no other formation in either game names the rule, Den of Woe and Sin pins) and `tests/unit/chapters/trema-retry-flow.test.ts` (10: through the real flow, every answer, plus real fights: the old loop, and the shipped answer's first Retry opens with three standing and wins in 223 decisions). Existing checkpoint files all green: flow-checkpoint-retry, pause-restart-checkpoint, pause-restart-owner, chain-checkpoint-spoils, fallen-aeons-flow-chain, den-of-woe-carry and -options, sin-checkpoint and -flow, trema-engine, trema-options, isaaru-duel, iter2-b1-switches (209 tests with mine). `tsc --noEmit` clean. The full `npm test` was NOT run (shared machine); run it before any merge.

### Chapters checked for the same pattern

- **Ch XV Den of Woe:** `DEN_OF_WOE_RETRY_FROM_LINK` is off, so Gippal and Nooj make no checkpoint and a loss retries from Baralai. Correct, unchanged, pinned.
- **Ch XVII Sin (FFX):** link 3 is a checkpoint (D-284) but 200 of 200 sensible-line chains reach it with 7 of 7 standing; no hopeless state is reachable, no rule added, pinned.
- **Ch XI (Save Sphere links)** already restore on entry. **Ch V Shuyin** is also `checkpointOnEntry` (D-217); not asked for and **not measured** here.

## PR-0353: route harness or real difficulty?

**Mostly real difficulty, with two harness faults that kept the evidence from forming.** Evidence:

1. The shipped fight is hard at human pace. The engine, kit-intended line, 200 seeds: Paragon won 28 (14 %), the chapter 13 (6.5 %), reproduced exactly. The in-game advisor's tactic for this chapter is that same line written as a tactic (`src/engine/tactics/ffx2-trema.ts`), and the card the route reads (given the HUD's own options) plays it: 28 Paragon wins and 17 chapter wins of 200 at the Wait split, 24 and 13 under Active. At 6.5 % a try, 26 live attempts with no win has probability 17 % (10 % at the card line's 8.5 %): consistent with the bench, and the live link-1 rate (2 wins in 26, 7.7 %) is inside the bench's 14 %.
2. The route is not structurally unable to win: in the gap run (seed 3) it beat Paragon and took Trema to 122,279 of 999,999 with the party healthy after 332 turns, and the run **ended at its 28-minute budget**. Both links need about 90 minutes of play at route pace. Fault one: the budget.
3. Fault two: every attempt made the route's one scripted CHANGE after two picks, and it landed on Lady Luck in all of them (Rikku's Alchemist stash or a Dark Knight's Darkness gone on turn 3), a move the chapter's tactic never makes. The engine bench does not show it costing a measurable share of wins (card line: 17 chapter wins of 200 without it, 11 with it at the Wait split; 13 and 14 under Active: noise), so it is removed as an uncontrolled variable, not named as the cause.
4. PR-0407 also ate the one full Paragon win (r4 attempt 12): the next two attempts were one-survivor Retries.

Harness change (`critic/runner/lib/route-pure.mjs`, `route.mjs`, tests in `tests/unit/critic-route-harness.test.ts`): `ffx2-trema` makes no scripted CHANGE (every other FFX-2 chapter still captures the Garment Grid menu; `--nochange` still works anywhere) and gets a 100-minute attempt budget (an explicit `--budget` wins); `run.json` records `scriptedChange` and `budgetMs`. No boss, number or tuning was touched.

### Live real-key run

**One real-key victory, recorded** (route `ffx2-trema win --seed=drawn --attempts=40`, headless Chromium with `PYREFLY_BROWSER=gpu`, this branch built into `dist-gate` and served by `vite preview`, 70.8 minutes, summary in [r392-trema-live-run.json](r392-trema-live-run.json), screenshots in `docs/screenshots/r392-trema/`):

- Attempts 1 to 3 lost to Paragon (82, 86 and 75 turns). **Attempt 4 beat Oversoul Paragon, entered Trema with Paine down (two standing), and lost at turn 249 after 26 minutes.** Attempt 5 was the Retry at Trema (no prep, link 2, the carried state replayed: two standing, so the PR-0407 rule correctly did not fire) and **won in 219 turns**.
- Results: `VIA INFINITO - CLOISTER 100 - CLEARED`, 49:47, NEW BEST, EXP 23,000 x3, AP 52, Gil 18,000, Dark Matter x2. Read against `research/ffx2-trema.md` 3.1 and 3.2: Oversoul Paragon 13,000 / 2 / 8,000 plus Trema 10,000 / 50 / 10,000 = 23,000 / 52 / 18,000 [verified: 3 to 5 sources], exact. The Dark Matter drop count is not pinned by the research row (Paragon's Oversoul drop and Trema's 100 % drop), so it is read as consistent, not proved.
- Then the post-battle scene ("Why do you fight, if not to forget?" to "Dibs!"), CONFIRM, the scene after it ("Hole in the floor. Out."), chapter select with Trema CLEARED and 1 OF 18 BEATEN, and a real page reload that kept the clear and the 49:47 best time. `fails` is empty; `scriptedChange` reads "not made".
- **Not exercised by this run:** the PR-0407 restore itself (the run never reached a one-survivor Retry). That path is proved by the engine matrix and the real-flow tests above, not by a live key run. And this is the branch build on a local server, not the deployed artifact: CHK-022 on the live 39.1 or the next release still needs this flow on that build (it needs the route change from this branch).
- **A new observation, cause not established:** one console error in the run, `[presenter] mid-battle script "paragon-falls" did not finish within 30000ms; abandoning the beat and resuming the battle`. The link-seam beat's lines ran from 1714 s to 1737 s on the run's clock and the next beat started at 1753 s, so the beat is close to the presenter's 30 s backstop (`SCRIPT_BUDGET_MS`). The battle resumed and the dialogue completed. It may be the route's pace or the beat's length; it was not investigated here and no fix is attempted. Worth a line in the next review.

**Verdict for PR-0353 in one sentence:** the wall is the authored fight (6.5 to 8.5 % a try at human pace, which a real-key route met at its fifth attempt), made unobservable for five reviews by two harness faults (a 15 to 28 minute budget on a fight that needs about 90, and a scripted CHANGE the chapter's line never makes), plus PR-0407 eating the one early Paragon win; both harness faults are fixed on this branch and the evidence gap is closed on this build.

## Cleanup

Servers started: one `vite preview` on port 5437 from this worktree's `dist-gate`, stopped by its listening PID; the port is closed. The worktree's own scratch folder and the 7.8 GB `dist-gate` build were removed afterwards (my own output; the `node_modules` link is intact). The `lighting-mockups` branch was left alone. One slip to report: a trailing `git commit --amend --no-edit` ran once on my own just-made, unpushed commit (route harness); content unchanged, hash `fa9a789e` is the pushed one.
