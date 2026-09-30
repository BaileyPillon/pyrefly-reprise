# Handoff: first run O2 "Guided first run" + the calm camera as the default

Branch `firstrun-o2` (worktree `D:/pyrefly-fb-onboard`), 2026-09-30, from `origin/main` 888a7578.
Not merged, not pushed, not deployed (the driver does those). Paper preflight:
`docs/plans/firstrun-o2-review.md` (critic-plan: DEEP; not the save-data class).

Bailey's words, 2026-09-29 ~21:00 EDT: "I'll go with all of your recommendations please"
(recommendations 3 and 5; `docs/target/decisions.json` D-289 and D-291).

## Game case (rule 14)

- **Both:** the board step, the party-prep step, the skip path and the seen-ids; the calm camera
  (shared presenter camera).
- **FFX only:** step 3 (the first command). It is Auron's approved `ffx-turn-order` line in the
  guide's dress, so it exists only in FFX. A first battle in FFX-2 ends the guide when its HUD mounts
  (nothing drew Rikku's version).

## (A) Guided first run

After Auron's briefing plays on a first launch, a three-step pointer in his voice: a gold spot (steps
1-2, the rest dimmed) or ring (step 3) on the exact control, a chevron, and one ink slab.

| step | target | words |
|---|---|---|
| 1 board | `.fe-hero` (the chosen chapter's picture; Chapter I on a first run) | "Start with the first one." Click/Tap its picture to begin. ... |
| 2 party prep | `.prep__start` (START BATTLE) | "Your party is ready." The tabs are for later. ... |
| 3 first command (FFX) | the ATTACK row | Auron's approved line word for word, "Your turn.", "Pick/Tap ATTACK, then pick/tap who it hits." |

Files: `src/ui/coach/firstRunCopy.ts` (words, ids), `firstRunView.ts` (markup, placement),
`firstRunGuide.ts` (state, per-frame loop while armed, Esc), `first-run.css`. Hooks:
`app/screens/raiseBriefing.ts` (arm after the briefing, resume on a later boot), `CoachLayer.ts`
(battle mounted; step 3's dress on `ffx-turn-order`), `CoachMark.ts` (the `guide` option),
`coachActorAvoid.ts` (the guide places its own line), `coachState.ts` (`markAllSeen` covers the ids).

Seen-state: three ids (`firstrun-board`, `firstrun-prep`, `firstrun-battle`) in the save's existing
`seenCoach` list. **No SaveData field, version or migration change.** Step 1 counts as done when party
prep appears, step 2 when a battle HUD mounts, step 3 when the line is answered or skipped. A started,
unfinished guide resumes on the next boot; a returning player or veteran never sees it.

Never blocks the highlighted control: the drawn layer is `pointer-events: none` except the slab, which
sits beside the target. A click or tap on ATTACK takes the line down and goes through (the existing
pointer rule). **Behaviour change inside the guide only:** Enter with the cursor on ATTACK reaches the
menu (the approved line alone swallows the first bare Enter, PR-0051); with the cursor elsewhere
(Kimahri's first menu opens on TALK on some seeds) the approved rule stands. Esc or the skip words end
the guide for good; the Esc is taken back from `Input` (a claim released at once runs `absorbEdges`),
so it does not also go BACK on the board or prep, or open the pause in battle.

Evidence: `docs/concepts/fb2-0929/onboard/final/` (sheets, build frames, README),
`docs/screenshots/picks-0929/firstrun-o2/`. Walks in `D:/Tools/pyrefly-scratch/picks-0929/firstrun/`
(`guide-walk.mjs` modes mouse, keys, skip1, tapskip1, skip3, reload2; desktop and phone): every ringed
control acted on the first press; no page errors.

## (B) Calm camera as the default

`CameraPreset.ts`: `DEFAULT_CAMERA_PRESET = 'calm'`; no parameter plays calm in both games,
`?cam=current` (or `__pyrefly.cam('current')`) the old camera. REDUCE MOTION's `StillCamera` still wraps
whatever plays. The stage's own fallback (`BattlePresenterStage`, used only when a caller passes no
preset) is left at `current`; `BattleScreen` always passes the preset. Clips and measurements in
`docs/concepts/fb2-0929/camera/final/`: Ch. I peak 102 → 42 °/s, largest cut 17.3° → 7.1°, roll and
shakes 0; Ch. IV peak 62 → 20 °/s, largest cut 11.3° → 4.9°. Frame time unchanged (16.6 ms).

## Checks

`npx tsc --noEmit` clean; `tests/unit/ui-coach-first-run.test.ts` (new, 16) and
`tests/unit/camera-presets.test.ts` (updated for the new default, 12) pass with the other coach
and camera files; full suite once (result in the commit body); `node tools/orphans.mjs`: nothing new.

## Open

- The phone step-3 quote wraps before "it." where the mockup's fits on one line (the slab stays
  inside 390 px).
- On the board, if the player selects another card first, the spot follows the picture, which then
  shows that chapter while the line still says "Start with the first one." Not drawn by the mockup.
- A reload between the story scene and the first command leaves step 3 unseen until the next battle
  mount, which then closes the guide (the line it rides was already shown).
- FF7 (hidden experiment) has no coach layer, so a first battle there would not advance the guide.

## CHECK (independent, 2026-09-30)

Checked by an agent that did not build it, on branch `firstrun-o2` (978251c4) in this worktree. Fresh
production build (`vite build`, base `/pyrefly-reprise/`) served by `vite preview` on port 8450 (stopped
by PID afterwards). Headless Chromium on the GPU, fresh profile per walk, real input only past the title
(the briefing and the 58-59 line story scene were played by Enter or taps, not skipped by debug calls).
Scripts and frames: `D:/Tools/pyrefly-scratch/picks-0929/firstrun-check/`.

Verdict: **no blocker.** Game case confirmed: steps 1-2 and the camera both games, step 3 FFX only.

Target vs build: `onboard/final/sheet-1600x900.jpg` and `sheet-390x844.jpg` match the approved O2 frames
(anchors, slab places, chevrons, words, pips, skip line). The only visible departures are the ones
written above (the concept's corner slate, today's board foot hint, the phone step-3 wrap before "it.").

| walk | result |
|---|---|
| desktop, Enter everywhere | step 1 on the picture (64,133 778x407), step 2 on START BATTLE (1233,642), step 3 ring on ATTACK (87,511); the first Enter at step 3 reached the target bar (TARGET Mortiorchis) and Tidus attacked; reload: no briefing, no guide; 0 errors |
| desktop, mouse | every ringed control acted on the first click (`elementFromPoint` at each ring's centre is the control); Tidus `attack` on Mortiorchis; 0 errors |
| phone 390x844, taps | step 1 plate 12,34, step 2 START BATTLE 7,782, step 3 ATTACK 199,610; the first tap on ATTACK opened ATTACK -> MORTIORCHIS; touch wording shown; 0 errors |
| desktop, Esc at step 2 | stays on party prep (no BACK), guide gone, all three ids seen; reload shows neither the briefing nor the guide |
| desktop, Esc at step 3 | line and ring gone, no pause opened, still in battle |
| desktop, reduced motion | same flow; the guide CSS has no animation or transition at all, so nothing to still |

Camera, measured independently (the builder's `clip.mjs`/`analyze.mjs`, seed 1, 22 s, real Enter presses):

| | preset in force | peak turn | roll | shakes | median frame |
|---|---|---|---|---|---|
| Ch. I default | calm | 42 deg/s | 0 | 0 | 16.7 ms |
| Ch. I `?cam=current` | current | 96 deg/s | 44 deg/s | 6 | 16.7 ms |
| Ch. I default + reduced motion | calm, still camera | 24 deg/s, 1 move, 25 cuts | 0 | 0 | 16.7 ms |
| Ch. IV default | calm | 20 deg/s | 0 | 0 | 16.7 ms |
| Ch. IV `?cam=current` | current | 112 deg/s | 48 deg/s | 7 | 16.6 ms |

Checks: `tsc --noEmit` clean; the 20 coach/camera/briefing/first-run test files pass (155 tests);
`tools/orphans.mjs` 24 orphans, the same as main (main's working tree shows 25 only because of another
agent's untracked `statusMessageLine.ts`); every touched source file under 400 lines (`BattleScreen.ts`,
already over, changed one comment line in place); `git merge-tree` against origin/main 888a7578 clean.
Full suite once: 10,280 passed, 1 failed, the same `strategy-ffx2-bahamut` "heal-only route" 15 s
timeout the builder saw (25 s under the load of a parallel build and browser). Run alone it passes on
this branch (7.5 s) and on main (8.6 s) with the identical 1/30 result, and it imports nothing changed:
a load-sensitive timeout, not a regression.

Findings (minor, none blocks):
- F1. When the first command belongs to Kimahri (his menu opens on TALK: seen on the reduced-motion walk
  and the phone walk, where Mortiorchis' Full-Life had already KO'd the zombied Tidus), the ring and the
  words say ATTACK while the keyboard cursor rests on TALK. Enter #1 only takes the line down (PR-0051, as
  documented) and Enter #2 plays TALK. A tap or click on the ringed ATTACK works. The mockup only drew
  Tidus' turn; worth a line to Bailey, not a build.
- F2. The phone step-3 quote wraps before "it." (already written above).
- F3. The full suite's one red is the known load-sensitive Bahamut timeout (above); give that test more
  time or run it apart, separately from this track.
