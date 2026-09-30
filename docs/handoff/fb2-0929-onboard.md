# fb2-0929 onboarding: first-run clarity

**Branch `fb2-0929-onboard`** (worktree `D:/pyrefly-fb-onboard`), from `main` 1c313c17.
Not merged, not pushed, not deployed.

**Trigger.** Bailey, 2026-09-29 ~19:20 EDT, passing on a friend's words and concurring:
*"It didn't really explain what was going on so that initial UI after you get past the
dialogue was confusing on how to start a game and what to do next"*; the friend loves
Persona 3 and 5 and thinks it would be an awesome mobile game.

## 1. The walk (live release 31a, fresh profile)

Headless Chromium, `PYREFLY_BROWSER=gpu`, driven by real mouse clicks at 1600x900 and
real touch taps at 390x844 (`isMobile`, `hasTouch`), a fresh browser context each run.
Scratch driver: `D:/Tools/pyrefly-scratch/fb2-0929/onboard/walk.mjs`.

| screen | reached at (desktop) | seen first | clickable | next step, and does anything say so | where a newcomer stalls |
|---|---|---|---|---|---|
| Title | 3 s | the key art, the Pyrefly Reprise plate | the whole frame; PRESS ENTER (phone: TAP TO BEGIN); B BRIEFING chip | yes: PRESS ENTER | no. Phone: the chip still reads "B BRIEFING" |
| Auron's briefing | 4 s | Auron's painting and four lines (**"Eighteen fights. That is all this is."**, the two clocks) | anywhere skips; the two foot chips | yes: ENTER / ESC SKIP (phone: TAP SKIP) | no, but it says what the fights are, not how to start one |
| **Chapter select** | 6 s | Chapter I's big picture, 18 equal cards, the chapter blurb | every card; the big picture ("the plate") starts | only the foot, in small type: CLICK A CARD CHOOSE · CLICK THE PLATE BEGIN (phone: TAP THE PLATE BEGIN · TAP HERE BACK) | **yes, the stall the friend named.** No card is marked as the start, nothing on the picture says it is a button, and "plate" is never defined |
| Party prep | 9 s | the party roster and the chapter's card | members, six tabs, START BATTLE | yes: a large gold START BATTLE | no |
| Story scene | 11 s | Kimahri's line over Mt. Gagazet | the dialogue card (advance), AUTO | yes: ENTER ADVANCE (phone: TAP ADVANCE) | long: 33 lines, 36 presses, about 50 s at a quick pace; AUTO is on the card but nothing points at it |
| Battle intro | 61 s | the chapter banner and the party | nothing | "ANY KEY" | about 11 s |
| **First command** | ~72 s | Auron's line "He moves after you. Not before. Use it." ENTER CONTINUE · FIRST TIME ONLY, the command menu, the guide (NEXT Holy Water → Yuna), the move chip (NEXT BEST MOVE Slow → Seymour Flux), the turn column, the enemy panel | the line; the menu rows; G / N / E / I chips; PAUSE | the line says ENTER; the menu is live under it | **yes.** Two advisors name two different moves. On a phone the line said ENTER (defect 2), and a tap on ATTACK left it up over the enemy being aimed at (defect 1) |

Phone times are the same to within a few seconds (battle at 64 s, first menu 77 s).
Every screen is captured (JPEG) under `D:/Tools/pyrefly-scratch/fb2-0929/onboard/`
(`d*/` desktop, `p*/` phone); the ones the mockups use are copied into
`docs/concepts/fb2-0929/onboard/frames/`.

**The first result.** A mouse player who only presses ATTACK on the first target (and
clicks each coach line away) lost Chapter I after 26 s of battle: 9 turns, 3 of them
the player's. Defeat shows turns, attempts, best and the party with RETRY and CHAPTER
SELECT; nothing says what went wrong or what to try (the defeat line is the R13 gap
tile). Capture: `docs/screenshots/fb2-0929-onboard/live-first-defeat-attack-only-1600x900.jpg`.
In the same run Yuna's Summon line (`ffx-aeon`) came up while the player was aiming, and
could not be clicked away (the t1-b5 pass-through), which is defect 1 below.

### Against the approved target (option C, Auron's briefing; tiles C1-C3, D-008)

- **C1, the briefing:** shows on first launch, skippable from the first frame, reads as
  the approved frame (painting left, four lines right, the fight count now derived).
  Met.
- **C2, the first FFX line:** shows beside a visible menu and advisor card, as the tile
  pictures. Short of the design in two places, both now fixed (below): R11 "every
  surface is tappable ... no copy is key-only" was broken by ENTER CONTINUE on touch, and
  R4 "zero overlap with ... the target cursor" was broken for any mouse or touch player
  (the line stayed up into targeting because only a key press dismissed it).
- **What option C never covered:** the board. `docs/handoff/onboarding-c.md` left **R10,
  a RECOMMENDED / START HERE card on chapter select**, as a gap tile needing Bailey's
  pick. That gap is exactly where the friend stalled. It is a new visible element on an
  approved screen, so it is an option, not a defect: see
  `docs/concepts/fb2-0929/onboard/README.md`.

## 2. The defects fixed (both games; shared coach plumbing, CHK-020)

The approved design and its own critique say the line never covers the target and never
uses key-only words on a phone. Two measured breaks:

1. **A tap or click on the menu did not take the line down.** Measured on live at
   390x844, fresh profile, Chapter I: the line at [25,128 340x160]; after one tap on
   ATTACK the HUD is `ffxhud--targeting-enemy` and the line is still up at the same box,
   over the target's name tag at [165,136] and the enemy itself (`p2/05-after-tap-attack.jpg`).
   At 1600x900 the same happens by mouse; where the line sits depends on the advisor
   card's solve, and in one run it covered the TARGET plate [694,22 213x36] and the
   target name [830,148] (`d7/02-3s-later.jpg`). Worse, the t1-b5 fix makes the line
   `pointer-events: none` while aiming, so a mouse player in targeting sees a line that
   says ENTER CONTINUE and cannot be clicked (seen with the Summon line, `ffx-aeon`, in
   the attack-only run).
   **Cause:** `CoachMark` took the line down on a key (the confirm key, or any key after
   navigating, PR-0182 / PR-0190) or a click on the line itself, never on a pointer press
   elsewhere. A pointer player never "navigates" first, so the rule that lets a keyboard
   player's answer both dismiss the line and reach the menu had no pointer twin.
   **Fix** (`src/ui/coach/CoachMark.ts`, `onPointerCapture`): a `pointerdown` anywhere
   outside the line, while it is up, takes it down (outcome `confirmed`, as the keyboard
   answer does) and is never swallowed, so the row it landed on still acts. A press on
   the line itself is left to its own click.
2. **ENTER CONTINUE on a phone.** The briefing already swaps its key labels for TAP on a
   coarse pointer (PR-0073); the line did not. **Fix:** the foot carries both labels
   (`coach-mark__key` Enter, `coach-mark__tap` Tap) and `src/ui/coach/coach-taps.css`
   does the same pure-CSS swap (`coach.css` is at the 400-line limit). A keyboard or
   mouse player sees the approved frame unchanged.

Game case: **both**. The pointer rule mirrors the keyboard rule, which is both-game
(PR-0182 / PR-0190); the phone line-over-reticle problem was already recorded as both
(t1-b5). The foot swap only changes FFX's holding line: FFX-2's foot has no key in it
("Fades on its own").

**Tests that failed first:** `tests/unit/ui-coach-pointer-answer.test.ts` (7 tests; 4
failed on the unfixed source: the FFX and FFX-2 pointer answers, the foot labels, the
CSS swap; the 3 guards passed before and after). The 16 existing coach suites stay
green (117 tests).

**Real-input check, before and after, same script** (`D:/Tools/pyrefly-scratch/fb2-0929/onboard/verify.mjs`:
fresh profile, `setSeed(1)`, `gotoChapter(id, {skipCutscenes: true})`, then ONE real
mouse click or touch tap on the first command row). Before = live release 31a; after =
this branch on its own Vite server (port 8260, stopped afterwards). JSON:
`docs/screenshots/fb2-0929-onboard/verify-before.json`, `verify-after.json`.

| case | before (live) | after (branch) |
|---|---|---|
| Chapter I, 1600x900, click ATTACK | line still up at [629,744 400x146] in targeting | line gone; targeting open; TARGET plate and name clear |
| Chapter I, 390x844, tap ATTACK | line still up at [25,148 340x160] over the target name [167,133] and the enemy | line gone; target, reticle and name visible (`after-tap-attack-390x844.jpg`) |
| Chapter I, 390x844, the line's foot | ENTER CONTINUE | TAP CONTINUE |
| Chapter I, 1600x900, the line's foot | ENTER CONTINUE | ENTER CONTINUE (unchanged) |
| Chapter IV (FFX-2), 1600x900, click WHITE MAGIC | line still up | line gone; the White Magic list opened under it (the press still acted) |
| Chapter IV (FFX-2), 390x844, tap WHITE MAGIC | line still up | line gone |

Zero page errors in all eight runs. Pairs under `docs/screenshots/fb2-0929-onboard/`.
Keyboard behaviour is unchanged: the confirm-key capture (PR-0051) and the navigated
confirm (PR-0182 / PR-0190) are untouched and their suites pass.

`npx tsc --noEmit` clean. `node tools/orphans.mjs`: 24 orphaned before and after (no
module added). Full vitest suite not run (targeted suites only: the new file plus the 16
coach suites, 124 tests).

## 3. The options (not built)

`docs/concepts/fb2-0929/onboard/README.md`: O1 One clear next step, O2 Guided first run,
O3 Straight into the fight, each at 1600x900 and 390x844 on our own live captures, with
before frames, what each changes and costs, and the agents' recommended pick (O2, with
O1 as the cheap alternative). Plus observations from the phone walk on what would make
it feel like a good mobile game.

## Open

- **Bailey's pick** among O1 / O2 / O3 (or none). This fills the R10 gap tile.
- **Two advisors, two different "next" moves** on the first command (the strategy
  guide's NEXT and the move chip's NEXT BEST MOVE). Observed, not changed: it belongs to
  the advisor track and the guide's sourced plan, and which one should speak on a first
  turn is a design question.
- Phone observations in the README (the dense intent bar, 36 taps of story, "B
  BRIEFING" and "TAP HERE BACK" wording, missing board thumbnails) are recorded, not
  acted on.

## CHECK (independent, 2026-09-29, a separate agent that did not build this)

Verdict: **no blockers.** Both claimed fixes hold by real input; the options are
mockups only.

- **Live repro (release 31a, fresh profile, headless Playwright, PYREFLY_BROWSER=gpu).**
  Chapter I (FFX) 1600x900 mouse click on ATTACK: targeting opens and the line stays up.
  390x844 touch tap on ATTACK: the line stays at [25,148 340x160] over the target name
  [166,137]; its foot reads "Enter continue". Chapter IV (FFX-2) click and tap on WHITE
  MAGIC: the line stays up.
- **Branch production build** (vite build of af9c96fc into scratch, preview on 8270, same
  script, same inputs): after the click or tap the line is gone in all four cases,
  targeting opens in chapter I at both sizes (target name visible), and the White Magic
  list opens in chapter IV. The phone foot reads "Tap continue"; desktop still "Enter".
  Regression probes: Enter with the line up and a click on the line itself still take it
  down without acting on the menu (same as live). No page errors.
- **Fail first:** the new test file run against origin/main's CoachMark.ts and
  coach-taps.css: 4 of 7 fail (the same 4 the builder names); all 7 pass on the branch.
- **Scope and rules:** code diff is only `src/ui/coach/CoachMark.ts` (370 lines),
  `src/ui/coach/coach-taps.css` and the new test; nothing in `src/battle`, the presenter
  or the RNG (rule 1). O1/O2/O3 are static files under `docs/concepts/fb2-0929/onboard/`
  with no code path, so without Bailey's pick the branch looks and moves like main
  apart from the two fixes (rules 9, 10). Mockups use our own captures (rule 8). The
  game case is written in both commits (rule 14).
- **Gates:** `tsc --noEmit` clean; `git merge-tree` against origin/main 1c313c17 clean;
  full unit suite: one run showed 1 failed file of 668 (10190 tests passed), a re-run was
  fully green and wrote no failure for any file of this branch, so the one failure reads
  as a flaky test outside this change (not identified; the output was cut before its name).
- **Minor notes (not blockers):** the pointer rule is broader than its keyboard twin:
  any press outside the line (a stray tap on the stage, the PAUSE button, the advisor's
  MORE) takes the one-time line down for good, where the keyboard needs a navigated
  confirm. That is probably what a touch player expects, but it is a judgement worth
  one line to Bailey when this merges.
- Preview server on 8270 stopped by PID. Nothing pushed, merged or deployed.
