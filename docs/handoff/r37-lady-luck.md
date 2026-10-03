# r37-lady-luck: FFX-2 Lady Luck's reels, ported onto main

**Branch:** `r37-lady-luck` (from `c69de96a`). **Backlog key:** `BR-LADY-LUCK-REELS`. **Game case: FFX-2 only.** Lady Luck is
X-2's dressphere; her reels share no rule with Wakka's Slots (`src/battle/ffx/reels.ts` is untouched), and FFX has no code
change. **Source:** `research/ffx2-combat-core.md` §3.12 and §2.3 (the Dud) `[verified: 2 sources]`, §2.9.1, §3.9. **Critic:**
round 02 #05 (X-2 half). **critic-plan class:** DEEP, after deploy (focused review before deploy). Not the save-data class:
no `SaveData.ts`, no schema, no settings persistence, so there is **no `-savedata` branch**. Paper preflight:
[docs/plans/r37-lady-luck-review.md](../plans/r37-lady-luck-review.md).

## What it was, and how it was ported

Commit `946918c69` (branch `claude/trusting-mestorf-caaa6a`, 2026-09-19) was cherry-picked with `-n` and then resolved by hand
against the engine as it is now. It is a port, not a merge; the sibling `889ddfd39` on `claude/wonderful-faraday-37e6a2` stays
superseded. Main's engine has split since (`engine-core.ts`, `resolve-hp.ts`, `resolve-targets.ts`, Active ATB, Wait split), so:

| Old commit piece | Here |
|---|---|
| `src/data/ffx2/reels.ts`, five payload records (`lady-luck.ts`, `samurai.ts`), Reels are Long CT | Ported as is |
| `src/battle/ffx2/reels.ts`, `minigames.ts`, `execute.ts` shaping | Ported; `execute.ts` re-cut on main's version (theft, `performed`, action time) |
| `AbilityCommand.extra`, `ReelResult` doc | Ported (`types.ts`), CONTRACT-CHANGES entry written |
| `submit()` hands the answer to whoever's gauge is full | `suspendedActor` in `execute.ts`; `engine.ts` / `engine-core.ts` (`awaitingBy`), fork copies it; the other girl's open menu (`inputOwner`) is left alone |
| Presenter drops the reel request from `tick()`; result attached to `'overdrive'` only | `BattlePresenter.ts`: `deferredMinigame`, `commandBy`, `'ability'` carries the result. **New here:** the Active pump (`BattlePresenterActive.ts`, `interrupted` dep) also dropped it under an open menu; that path did not exist in 2026-09 |
| Dud ignores the Chain (`extra.noChain`), status-only action on an immune target says IMMUNE | `resolve.ts`, `resolve-targets.ts` (main's file split) |
| `vitals.ts` split of `resolve.ts` | **Dropped**: main already split it (`resolve-hp.ts`); the file is parked in `F:/pyrefly-parked/2026-10-03/r37-lady-luck/` |
| Reflect bounce (§2.8) | **Not ported**, not named by this item (see "Left") |
| "Known defect" note on `targetForHit` | **Dropped**: main fixed that rule itself (IC-2, `resolve-targets.ts`) |

## Item BR-LADY-LUCK-REELS

- **Rule (sourced):** read left to right. X-X-X pays the set's top result, X-X-any (slots 1+2) the mid result (Cherry and the
  three suit symbols only: §3.12 has no Red 7 / BAR pair, so those are Duds), a Cherry in slot 1 the weakest, everything else
  is the **Dud**: 75 % of current HP off the spinner's whole party, ignoring defence. Attack and Magic Reels only (Item and
  Random Reels are not shipped commands and most payloads have no record; a test fails if a reel command is added without a table).
- **Unsourced, labelled `[estimate]`:** the Long CT tier for the reels (§1.3 names it, the numbers are an estimate), the
  Shin-Zantetsu / Magicide / Clean Slate CT tiers, Auto-Life's targeting, and the project's rule for re-aiming a payload at the
  side it is for (§3.12 is silent). No number was invented.
- **Proof:**
  - `tests/unit/ffx2-lady-luck-reels.test.ts` (7), `ffx2-lady-luck-human.test.ts` (2, the real presenter on the real engine),
    `ffx2-lady-luck-active.test.ts` (1, new: Active ATB with another girl's menu open when the reels land; red on the old
    presenter with "the reels never asked for their overlay under an open menu"), `ffx2-ability-flags.test.ts` (the Reflect
    cases and the three delay/reflect "unread" entries dropped, the every-flag-has-a-reader guard kept).
  - Typecheck clean; no new orphan (24 before, 24 after); full suite: see "Done means" below.
- **Measured, 200 seeds, before (`origin/main` c69de96a) and after, headless engine, same harness file on both**
  (harness `F:/pyrefly-parked/2026-10-03/r37-lady-luck/zz-tmp-r37-measure.test.ts`; result lines in `docs/handoff/r37-lady-luck-measure.txt`, raw output in
  `D:/Tools/pyrefly-scratch/2026-10-03/r37-lady-luck/{before,after}-{shipped,reels}.txt`):

  | Line | Before | After | Moved |
  |---|---|---|---|
  | Chapter V (Farplane, the five-link Vegnagun chain), shipped `intendedStrategy` | 188/200 | 188/200 (identical per-link losses: 11 at link 2, 1 at link 3) | 0.0 points |
  | Via Infinito (Chapter XIII, Paragon then Trema), shipped intended line, action time off, Active, D=0 | 0/200 | 0/200 | 0.0 points (the line is 0/200 on main for reasons recorded in `docs/plans/trema-bench.md`; no signal here) |
  | Chapter V, **a player who picks Lady Luck**: Paine on Lady Luck spamming Attack Reels, the other two on the shipped line | 0/200 wins; 143 of 200 reached link 2 or later; 6,546 spins that did nothing | 0/200 wins; **200 of 200 dead in link 1**; 888 spins, 90 % Duds | win rate 0 points; survival depth moved a lot |

  The shipped lines never open a reel (no strategy row names a reel; on the Farplane board Yuna's opening menu offers only
  Gunner and Black Mage as dress changes, and the shipped lines never spherechange to Lady Luck), so the headline win rates do not move: well inside the 3-point bar. What moves is the new downside of choosing the
  reels, which is the point of the sourced rule (§3.12: "double-edged"). With nobody timing the presses an unattended spin is
  uniform over six symbols a reel, so about 9 in 10 are Duds; a human stopping reels has her own odds.
- **Browser check (real keyboard input, headless Playwright, GPU args, scratch vite on :5960 aliasing the Farplane build so
  Yuna wears Lady Luck):** see "Browser" below.

## Browser

Scratch dev server on port 5960 (stopped by PID afterwards) with a vite alias that swaps the Chapter V Farplane build for a copy
where Yuna wears Lady Luck (`D:/Tools/pyrefly-scratch/2026-10-03/r37-lady-luck/browser/`, scratch only, nothing under `src`). One
headless Chromium (`PYREFLY_BROWSER=gpu`), keyboard input only: Skill, Attack Reels, target, then plain Attack for Rikku and Paine
when their menus came up (Wait holds the clock under an open menu), then Enter three times at the reels. Frames:

| Frame | What it shows |
|---|---|
| `docs/screenshots/r37-lady-luck/01-skill-submenu-reels-rows.png` | Yuna's Skill group: Attack Reels and Magic Reels are offered |
| `02-reel-overlay-opens-after-charge.png` | the overlay opened by the engine's request once the charge bar emptied, six-symbol strip, `DUD: -75% PARTY HP` warning (already in the overlay) |
| `03-three-reels-stopped.png` | her three stops, read from the page: `paw`, `red7`, `paw` (a losing line: not three, not a pair, slot 1 not a Cherry) |
| `04-dud-payoff-75-percent.png` | the spin names itself (`DUD!` on the enemy plate), 2127 / 3176 / 3298 gravity on Yuna, Rikku and Paine: Yuna 2826 to 699 (75 % of current HP), the whole party, not the boss |

`browser-report.json` is the page's own log tail: one `minigame-request`, one `message "Dud!"`, three gravity hits sourced by Yuna
on her own side. An earlier run of the same script (a Cherry in slot 1) printed `Armor Break` and 324 damage to the Tail:
the weakest tier pays. No console errors or warnings in either run. There is no approved target for this overlay
(`hasApprovedTarget: false`), so no side-by-side; the overlay itself is unchanged by this branch.

Visual note (not mine, not touched): the overlay panel sits over the top-left, on top of the boss plate and the guide's
`G HIDE GUIDE` tab (frame 02). That is the existing `ffx2-reels` placement; the reels had never been reachable by a human
before, so nobody had seen it in a real fight. Candidate for the visual pass, not built here.

## Done means

- `node node_modules/typescript/bin/tsc --noEmit`: clean.
- Targeted: `ffx2-lady-luck-reels` (7), `ffx2-lady-luck-human` (2), `ffx2-lady-luck-active` (1), `ffx2-ability-flags` (3): all pass.
- **Full suite** (`vitest run --testTimeout=60000 --maxWorkers=4`, once, at the end, in this worktree): **752 files passed, 5
  skipped (757); 11,086 tests passed, 40 skipped, 1 todo; 0 failed.** The three files that fail in a worktree for want of
  `public/art` passed because the junction is in place. Includes the Chapter 4 and 5 strategy suites (Shell route 30/30, and the
  rest unchanged).
- `node tools/orphans.mjs`: 24 orphaned before, 24 after, none of them mine.
- `node tools/critic-plan.mjs --paths <the 15 changed src files>`: **DEEP, after deploy** (focused review before deploy; live
  verification, then the deep review on the live build); games: both by chapter list, FFX-2 only by content; no save-data class.
- House rule 7: new files `reels.ts` 161 and `data/reels.ts` 119 lines; `engine.ts` 371, `execute.ts` 300; `BattlePresenter.ts` was
  already over (698 to 747, see Left 3).

## Left

1. **Reflect (§2.8):** the old commit also made single-target `reflectable` magic bounce back at the caster once (X-2's rule;
   FFX sends it to the other party). Not part of this item and not ported. Main's `ffx2-ability-flags` guard passes `reflectable`
   only because `ai/paragon-oversoul.ts` mentions the string; the engine bounce itself is still absent. Needs its own yes/brief.
2. **Item Reels and Random Reels:** not shipped commands; most payloads (Megalixir+, Mighty Guard+, Supreme Gem, CONGRATS!) have
   no record. Out of scope until the commands exist.
3. **Size rule:** `src/engine/BattlePresenter.ts` was 698 lines and is now 747 (house rule 7 says 400); `engine.ts` 371 and
   `execute.ts` 300 are under. The presenter was already over; a split is its own pure-move item.
4. The rules this port leaves open (no source): how an AI/autopilot should treat the reels (today an unattended spin is a blind
   roll, mostly a Dud, so no autopilot should be pointed at the reel rows).

## For Bailey

- **Numbers to look at:** the third table row above. A player who spams the reels with nobody timing the presses now wipes
  their own party in the first fight of Chapter V (the old behaviour was a free no-op turn). That is the sourced Dud, and the
  reel overlay already says `DUD: -75% PARTY HP`. A human timing three Cherries gets Flare. If you want the unattended
  default to be kinder than uniform over six symbols, that is a new design rule (not in §3.12), so I did not build it.
- Whether to do Reflect next (see Left 1).
