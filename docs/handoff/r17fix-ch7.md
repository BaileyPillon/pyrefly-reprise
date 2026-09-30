# r17fix-ch7: PR-0244, the Chapter VII aftermath staged to match its words

Branch `r17fix-ch7` (from main 29c18cd3), not pushed. **Game case: FFX only.** The data (Seymour at
Macalania, Chapter VII) and the script are FFX; the `setPose` port on the cutscene stage is shared
plumbing but does nothing for any figure that does not opt in (`stagesUnpaintedPoses`, only
`seymour-macalania` does; pinned by a test), so no FFX-2 scene and no other FFX scene changes.

## PR-0244 (major, stalled two rounds): FIXED

**Cause, proven by running it** (`critic/rounds/round-17/cap/gaps/ch7-17.mjs`, seed 1, keyboard, 1600x900 and 390x844):
1. `CutsceneScreen` had no `setPose` port, so the script's `setPose(SEYMOUR, 'kneel' | 'ko')` did nothing and the
   standing idle painting stayed under "He went down on one knee" and "Then he fell". No kneel or KO painting exists for
   him (`public/art/manifest.json`: `seymour-macalania` states are cast, hurt, idle; `hurt.png` is another standing
   pose, arms crossed).
2. The plate before the tally was `showActor` 600 ms plus `beat(1400)`: at least 1.2 s of plate (the critic timed 1.7 s)
   with no line and an empty then upright stage.

**Fix** (no new art):
- `CutsceneStage.setPose` (`src/app/screens/CutsceneStage.ts`), wired in `CutsceneScreen.ts` on an existing line
  (the file is over 400 lines and did not grow). For a figure with `stagesUnpaintedPoses`, `kneel` sinks, bows and dims
  the standing painting, `ko` lays it on the floor, dimmer (as the battle's KO pose lies), anything else stands it. CSS in
  `cutsceneStage.css`, a stronger sink on portrait screens (a 22% sink still read as standing on a phone).
- `seymour-anima-macalania.ts` post: he is posed `kneel` before `showActor`, both before the tally and when the scene
  resumes after it, so an upright Seymour is never on the plate; `ko` is set before the fall caption. The pre-tally plate is
  his 500 ms fade-in and no beat. The reaction-beat rule wants every `wait` >= 1200 ms, so the beat was removed rather
  than shortened.
- No dialogue was added or changed. Research §9.7 beat 9 says no speech, and no sourced aftermath line exists for that
  moment, so the plate was cut, not captioned.

**Before / after** (`docs/screenshots/r17fix-ch7-before-after-1600x900.jpg`, `...-390x844.jpg`, top row before, bottom after):
- Plate before the tally at 1600x900: before, cutscene frames from 8671 ms to at least 9835 ms (the capture window ended
  there, the critic timed 1.7 s); after, 8444 ms to results at 9324 ms, 0.88 s, and Seymour already down on it.
- Kneel caption (frames f02 to f10) and fall caption (f12 to f19): before, the full upright painting in both;
  after, sunk and bowed, then lying on the floor. At 390x844 the same (`cmp-390`).
- Full runs: 1600x900 and 390x844 by real keys, seed 1, victory both, no console errors added.

**Tests** (new, fail before the fix; the story test was re-run against the pre-fix script copy and failed):
`tests/unit/chapters/macalania-story.test.ts` (no upright `showActor` or caption, `ko` before the fall, pre-tally plate
<= 1000 ms), `tests/unit/cutscene-stage.test.ts` (setPose classes, opt-in pinned to Seymour, other figures untouched).
`npx tsc --noEmit` clean; orphans unchanged (no new module).
Full `npm test`: 10481 passed, 1 failed, `strategy-ffx2-bahamut` heal-only route timed out under load (the file passes
alone, 19 of 19); it is in the eye-candy-d handoff as a known load timeout. (The full suite was run twice by mistake,
the second only to name the failure.)

## Not fixed / open
- The fall is a dimmed painting laid down, not a painted KO pose. If Bailey wants a painted kneel and KO for Seymour,
  that is new art (an option, default off, needs his yes). The stage hook is in place for it.
- Other post scenes call `setPose(x, 'kneel')` on figures with no kneel painting (Isaaru, Shuyin). Not changed: not in this
  issue and each would be a visible change for Bailey to pick. Flip `stagesUnpaintedPoses` on their `CUTSCENE_FIGURES`
  entries to get the same staging.
- The battle screen lays Seymour down (KO) and the plate then shows him kneeling, not lying: a small step back up
  the pose ladder that the narration ("went down on one knee") covers.
