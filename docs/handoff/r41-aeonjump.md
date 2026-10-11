# r41-aeonjump: FOC40-02, the 960 px head jump of Anima in Chapter XI, is the giant's framing plan landing under the Save Sphere wash

Date 2026-10-11. Branch `r41-aeonjump` off `origin/r40-rc` (bc373d58). Lane: trace FOC40-02 (and PR-0380's 966 px on the Fallen Aeons boss swap, round 24)
without a browser. **No product code was changed**; this note is the whole deliverable. Game case (rule 14): **FFX-2 only**. Chapter XI is FFX-2, the Save
Sphere card plays only where a formation carries `restoresPartyOnEntry` (`SaveSphereCard.ts`; Road links 2 and 3, `fallen-aeons-road.ts:187,198`), and the giants'
plan (`fx/mix/giants.ts`) is FFX-2 only. FFX has no such seam.

## Verdict

**The designed cut between two links, not a jump the player sees.** The figure is `x2-anima`; the transition is the seam from link 2 (the Magus Sisters) to link 3
(Anima), the Save Sphere card. Under the card's wash the next formation is staged, and 0.6 s later CHAPTER FRAMING's giant plan lands: Anima's group scale goes from 1
to 2.8235 in one frame while the camera has not moved, so her head climbs about 900 px at 1600x900. The camera cuts onto the plan's master about 1.6 s later, as the
wash lifts. The harness reads the canvas only; the wash is an HTML overlay, so it counts the covered pop as a jerk.

## What the harness saw

| | candidate fcecfa74 | live 2ae1a9e4 |
|---|---|---|
| figure, part | `x2-anima`, head | `x2-anima`, head |
| frame, time | 22056, 377.14 s | 21776, 368.65 s |
| one-frame jerk | 960.2 px (dx -287, dy -916.3; the move's own speed 2 px) | 965.9 px (dx -299.4, dy -918.3) |
| at a pose swap | no (`atSwap` false) | no |
| nearest battle event | an ATB tick 38 frames before | none within 60 frames |

Strip: `critic/reviews/fcecfa74-focused/continuity/ffx2-fallen-aeons-win-fcecfa74/continuity/strips/jerk-000-x2-anima.jpg`. Frames -14 to -1: the party stands in idle
and a small, pale Anima stands at the right at the scene's drawn size. The jerk frame: a huge dark Anima fills the top right, head past the top edge; the party
and the backdrop are the same size as in the frame before. So the camera did not move; the plane's own scale changed.

## Where it falls in the seam (from `continuity.json`, both builds)

The Save Sphere card (`SaveSphereCard.ts:55`): wash in 520 ms, the swap (`restage`) under the wash, hold 1700 ms, wash out 620 ms; the next link's opening
(`BattleMoments.battleStart`, which cuts to the scene's intro, resolved to the master for a giant: `BattleMoments.ts:263`) starts when the card ends. From the
restage to the end of the card is 2320 ms.

| | candidate | live |
|---|---|---|
| restage (the three girls swap victory to idle, planes "not recorded": new actors) | frame 22018, 376.36 s | frame 21710, 367.35 s |
| the jerk | +778 ms (inside the 1700 ms hold) | +1299 ms (inside the hold) |
| first camera cut after the restage (`cameraCuts`) | frame 22159, +2402 ms | frame 21882, +2934 ms |
| the other seam (link 1 to 2): restage, first cut | 15703, +2440 ms | 15907, +3393 ms |

The candidate's cut lands 80 to 120 ms after the card's end at both seams; live's frames are slower (slow-frame times are interpolated between swaps), so its gaps
are looser. Read as a timeline: restage, the plan lands inside the hold, the wash lifts, the camera cuts onto the master.

## Why one frame: the code path

1. `BattleEncounterChain.ts:238-248`: the next link's `restage()` (`engine.init`, `stage.stage`) runs inside the card's `swap`, under the wash.
2. `Framing.update` (`fx/mix/framing.ts:121-126`): the figure signature changed, and a giant arriving always re-plans (`giant !== giantId`). The Road has no
   staging-table row (the table is FFX only, `stageTable.ts`), so `staged` is false and the plan waits `time - sigAt >= 0.6` (`framing.ts:137`).
3. `decide` runs `decideGiant` (`giants.ts:223`): the Anima row, `giantFactor` = 9.6 / 3.4 = 2.8235 (0.7 of her real 7.71 times the girls' 1.78, over the drawn
   3.4). `commit` (`framing.ts:326`) applies it with `Staging.write` (`staging.ts:188`), at once, at the plan's scale.
4. `RigWatch.install` registers the new master and "adds no cut and no move of its own" (`rigWatch.ts:150`): the camera stays on the old rig until the
   presenter's next move or cut onto `idle`. By its timing (the table above) that is the next link's opening cut as the card ends; the code that makes the cut was not stepped through.

The existing test pins this arrival: `tests/unit/fx-mix-giants.test.ts:367` ("a plan of her own when she arrives on a stage that was Shiva's").

**Replay, not committed** (vitest, the real `Framing`, `RigWatch` and `Staging`; the `road()` stand-in actors of that test, a fake camera that records its calls, the
Road's idle rig, 1600x900): 14 s of link 2 with Sandy, then Anima in, stepped at 1/60 s. Boss scale 1.0000 until frame 36 (t = 0.617 s, the 0.6 s gate), then
2.8235 on that one frame; the stand-in's box top goes from y 205 to y -439 (-645 px in one frame; the painted Anima is taller than the stand-in, the harness measured
-916); nothing after it moves. The camera calls after the link starts: one `addRig idle`, no `moveTo`, no `snapTo`. The replay's 0.617 s is close to the harness's 0.78 s
(candidate, 38 frames) and under the card's 1.7 s hold.

## What the player sees, and what this does to CHK-027

- The jump is under the wash: `.ssphere__wash` is `rgba(246, 240, 250, 0.74)` over the whole frame, HUD included (`save-sphere-card.css:23`). The strips cannot show
  it (the probe copies the canvas; the HTML card is not in it). **Covered, not invisible: about 26 percent of the picture shows through the veil**, so a dim mass
  can appear behind the orb and card for a frame. What comes out of the wash is the finished shot (`seq-seam-3/f00..f07.jpg`: Anima whole on the master, then her
  name plate).
- Of the 26 jerks of 40 px or more in the candidate, 4 fall in the two seam windows: this one and three 68 to 80 px head steps of the girls at the restage frames
  (Rikku 15703 and 22018, Paine 22018). Live: 4 of 47. The worst outside the seams is 137.8 px (Anima's feet at frame 33176, at a pose swap), and nothing
  else is over 140. The 960 px is a single outlier, not a class.
- **The acceptance in FOC40-02 ("CHK-027 over-40 count falls to 0 in the chapter") cannot be met by a game change here**: the other 22 are in other classes, and this
  one is the seam working as drawn.

## Not proven, and what would settle it

1. **Nobody has seen the frame.** The wash is a timing match (2.40 to 2.44 s against 2.32 s, both seams), the code and the replay; the strip is canvas only. A
   browser run that records `document.querySelector('[data-testid="save-sphere"]')` and its wash opacity on the jerk frame settles it. Not run (no browser in this lane).
2. **A cold cache could land the plan late.** The plan waits for every painted figure (`isPlaceholder`); Anima's masters are the biggest files in the chapter. If they
   were still uploading when the wash lifts, the plan would land in view, over the opening. Both runs here had warm art and landed inside the hold. Not observed, not
   claimed; the same holds for Bahamut and Paragon with no wash at all.

## Options, neither built (rule 10: ideas need a yes)

- **Critic tooling.** Let the continuity probe mark frames in which a Save Sphere wash is up (or the restage-to-card-end window) as covered, and count no jerk in
  them, as it already excuses camera cuts and staged changes. That removes this outlier and the three girl steps from CHK-027; the checks are Bailey's
  (D-420 to D-426), so the definition of a jerk is his to change.
- **Game.** Land the giant's plan with the camera's cut instead of 0.6 s after the swap (a change to `Framing`/`RigWatch` timing, shared plumbing). Not recommended
  now: any version that holds Anima's scale until the camera moves leaves the shot rules reading a small Anima, so a close shot chosen in between would then be cut by
  the growth; the one that cuts the camera itself breaks "the mix adds no cut" and `fx-mix-giants.test.ts`'s arrival test.

## Evidence

`critic/reviews/fcecfa74-focused/continuity/ffx2-fallen-aeons-win-fcecfa74/{continuity.json,run.json,strips/jerk-000-x2-anima.jpg,seq-seam-3/}` and
`continuity-live/ffx2-fallen-aeons-win-live2ae1a9e4/continuity/continuity.json` (in `D:/pyrefly-r39-int`, read only); `critic/rounds/round-22.json` PR-0380;
`critic/reviews/fcecfa74-focused.json` FOC40-02. The tables above are computed from `swaps[]` (`n`, `tMs`, poses), `jerks[]` and `cameraCuts.frames`.
