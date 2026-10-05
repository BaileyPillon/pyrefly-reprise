# Paper preflight: first run O2 "Guided first run", plus the calm camera as the default

Paper preflight under AGENTS.md rule 15, written **before any product code**, 2026-09-30,
by a sub-agent of the driver session. Branch `firstrun-o2` (worktree `D:/pyrefly-fb-onboard`).

`node tools/critic-plan.mjs --paths src/engine/CameraPreset.ts,src/engine/BattlePresenterStage.ts,src/ui/coach/firstRunGuide.ts,src/ui/coach/CoachMark.ts,src/ui/coach/CoachLayer.ts,src/ui/coach/coachState.ts,src/app/screens/raiseBriefing.ts`
says **DEEP** (battle presenter and a shared UI path), before deploy a FOCUSED review of the
production candidate, then live verification and the deep review on the live build. Not the
save-data class: nothing in `src/app/SaveData.ts` or the save schema changes (section 3).

Bailey, verbatim, 2026-09-29 about 21:00 EDT, answering the driver's recommendations:

> "I'll go with all of your recommendations please"

What that approves, and only that (rule 9): **O2** of `docs/concepts/fb2-0929/onboard/`
(`o2-step1-board-*`, `o2-step2-prep-*`, `o2-step3-battle-*` at 1600x900 and 390x844, the
README's O2 section), and the **calm** camera preset of `docs/concepts/fb2-0929/camera/`
as the default for everyone. Everything else in those folders (O1, O3, `steady`,
`originals`) stays unbuilt.

## 1. Game case (rule 14)

- **Both:** the board step, the party-prep step, the skip path, the seen-ids, the calm camera
  (shared presenter camera; `calm` is defined for both games in `CameraPreset.ts`).
- **FFX only:** step 3 (the first command). Chapter I is FFX, the line it merges with is
  Auron's approved `ffx-turn-order` line, and the README says a first run that begins in an
  FFX-2 chapter would need Rikku's voice and a line that never holds, which nothing drew.
  So a first run whose first battle is FFX-2 ends the guide after step 2, silently.

## 2. What gets built (and nothing more)

| Mockup element | Build |
|---|---|
| gold spot on the Chapter I picture, rest of the board dimmed (step 1) | `.fe-hero` found live each frame; a 3000 px box-shadow dim with a gold outline and an outer ring (the mockup's `.spot.spot--pulse`), drawn by a `pointer-events: none` layer |
| ink slab "AURON · 1 OF 3", italic line, one plain line, three pips, "ESC / TAP HERE SKIP THE GUIDE" | same words, same tokens; desktop to the right of the plate with a left chevron, phone under it with an up chevron |
| step 2 on party prep, spot on START BATTLE | `.prep__start`; desktop slab to its left with a right chevron, phone slab above with a down chevron |
| step 3: Auron's approved line kept word for word, "Your turn.", gold "Pick ATTACK, then pick who it hits.", ring (no dim) on ATTACK | the existing `ffx-turn-order` CoachMark is **the same surface**: when the guide is on its third step, the mark gets the guide's eyebrow ("Auron · 3 of 3"), the two extra lines, the pips and the skip foot, and is placed beside ATTACK (desktop) or under the top band (phone). One voice, one surface |
| the "02 · GUIDED FIRST RUN · STEP n OF 3" slate | **not built**: it is the mockup's own label (`_mock.css` "the concept slate") |

Wording differs by pointer the way the mockup does (desktop "Click its picture to begin. The
others wait on the board." / phone "Tap its picture to begin. The other fights wait on the
board."), switched by `(pointer: coarse)` exactly as the coach line's own ENTER/TAP foot is.

## 3. Seen-state without a save change

`SaveData.seenCoach` is a `string[]` of shown ids, written through `coachState.markSeen`
(which also keeps a session set for a private window). The guide adds three ids,
`firstrun-board`, `firstrun-prep`, `firstrun-battle`, in a new `firstRunCopy.ts`. **No new
SaveData field, no SAVE_VERSION change, no migration change.**

- **Armed only on a first run:** the guide starts when `runBriefingIfDue` actually played the
  briefing (the one moment that is a first launch by definition). A returning player, a
  veteran (whose migration marked `briefing` seen) and every `?coach=off` harness never arm it.
- **Resume:** a guide that was started (`firstrun-board` seen) but not finished resumes its
  remaining steps on the next boot, from the same call site. Bailey's own save has none of the
  three ids and `briefing` seen, so it never arms.
- `markAllSeen()` (the harness hook `__pyrefly.markCoachSeen()`) marks the three ids too.
- Skip (Esc, or a tap/click on the skip words) marks all three seen and takes everything down.

When each step counts as done: step 1 when party prep appears (so Esc BACK from prep and
returning to the board does not replay it); step 2 when a battle HUD mounts (the coach layer's
`mount`, both games); step 3 when the mark is confirmed, answered by a press on the menu, or
skipped. A battle in FFX-2 marks step 3 done at mount, ending the guide.

## 4. Risks, and the answer to each

1. **Blocking the highlighted control (the brief's hard requirement).** Every drawn piece
   except the slab is `pointer-events: none`; the slab is placed beside, never over, the
   target. Step 3: the mark's existing pointer capture already takes the line down *and* lets
   the press through; on the keyboard the approved line swallows a bare first Enter
   (PR-0051), which would block ATTACK, so in guide mode the confirm is let through (the same
   rule PR-0182 uses once the cursor has moved). Proved by real clicks, taps and keys.
   **Superseded 2026-10-04 (release 39, PR-0362, FFX only):** round 21's critic measured that
   exception as "the key that dismisses the card does something else" (one Enter took the card
   down and opened the target cursor, in the five chapters whose menu opens on ATTACK), and the
   release 39 brief asked for the rule every other overlay follows to apply here too. A bare Enter or Cross now
   only takes the card down, with the cursor on the ringed ATTACK or not; the next press is the
   pick. A tap or a click on ATTACK still acts on the first press (pointing at a row is an answer
   to it). This is a reversal of the "each acts on the first press" acceptance above for the
   keyboard and the pad: it is flagged for Bailey in `docs/handoff/r39-uifix.md`.
2. **Esc does two things.** On the board Esc is BACK, on prep BACK, in battle it opens the
   pause (`canPauseOnCancel`). `Input` latches the key in a window capture listener registered
   at boot, before anything the guide can add. The guide takes the latched edge back with the
   public API (`input.claimKeyboard(noop, { exclusive: true })` released at once runs
   `absorbEdges`), and stops the DOM event from reaching the raw watchers. Proved by pressing
   Esc on each screen and checking the screen did not change.
3. **A dismissed-by-system mark read as a skip.** `CoachLayer.clear()` (beat hold, a menu
   answered by auto-play, `setVisible(false)`) also ends a mark as `'cancelled'`. Only the
   mark's own cancel press counts as a skip; the re-raised held mark is decorated again.
4. **The line's own avoid solvers fight the guide's placement.** `recheckPosition` and
   `keepMarkClear` skip a mark that carries `data-guide`; the guide places it each frame.
5. **Layering (rule 1).** No engine, RNG or presenter file changes for the guide. The camera
   change is one default in `CameraPreset.ts` (and the stage fallback), both games.
6. **File sizes (rule 7).** `coachCopy.ts` (403) and `Input.ts` (523) do not change;
   `CoachLayer.ts` (396) and `CoachMark.ts` (370) get a few lines each and stay under 400;
   the guide is new files under 400 each; CSS in its own file (`coach.css` is at 398).
7. **Orphans (rule 4).** The guide is imported by `raiseBriefing.ts` and `CoachLayer.ts`.
8. **Evidence poisoning (CHK-016).** Harnesses boot with `?coach=off` or mark all seen; the
   guide never arms there, and `markAllSeen` covers its ids.
9. **Camera default.** `?cam=current` still gives today's camera; REDUCE MOTION's
   `StillCamera` wraps the preset camera, so it still wins (cuts only). `calm` already rests
   the FFX-2 intent card over the boss (`labelsAtRest`). Tests that assert `current` is the
   default are updated; the presets' own behaviour tests are unchanged.

## 5. Proof plan

Headless Playwright (GPU), fresh profile, own dev server on 8430-8449:
- Before (this base): title, briefing, board: no pointer. After: each of the three steps at
  1600x900 by mouse and at 390x844 by touch; screenshots beside the mockup frames into
  `docs/concepts/fb2-0929/onboard/final/`.
- Real input: click the ringed plate, click START BATTLE, click ATTACK (and Enter on ATTACK in
  a second run); each acts on the first press. Esc on the board skips without leaving it.
- Reload mid-guide resumes; a second fresh run with Esc at step 1 never shows steps 2-3.
- Camera: `cameraPreset()` answers `calm` with no parameter; two 8 s clips (Ch. I, Ch. IV)
  at the default into `docs/concepts/fb2-0929/camera/final/`.
- `npx tsc --noEmit`, the touched vitest files, the full suite once, `node tools/orphans.mjs`.
